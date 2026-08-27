import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { env } from './src/config/env';
import { connectDatabase } from './src/db/connection';
import { errorHandler } from './src/middleware/errorHandler';
import apiRouter from './src/routes/api.routes';
import publicApiRouter from './src/routes/publicApi.routes';
import dashboardRouter from './src/routes/dashboard.routes';
import { logger } from './src/utils/logger';
import { notificationService } from './src/services/NotificationService';
import { reportService } from './src/services/ReportService';
import { billingSchedulerService } from './src/services/billing/BillingSchedulerService';
import { tenantService } from './src/services/TenantService';
import { subscriptionService } from './src/services/SubscriptionService';
import { emailTemplateService } from './src/services/EmailTemplateService';
import { emailQueueProcessor } from './src/services/EmailQueueProcessor';
import { emailCronScheduler } from './src/services/EmailCronScheduler';
import { IntegrationController } from './src/controllers/IntegrationController';
import { tenantContext } from './src/middleware/tenantContext';
import jwt from 'jsonwebtoken';
import { User } from './src/models/User';
import { UserRole } from './src/types';

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Setup allowed origins list for CORS and Socket.io
  const defaultAllowedOrigins = [
    'https://weventure.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4173',
  ];

  const envOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  const appUrl = process.env.APP_URL ? process.env.APP_URL.trim() : '';
  if (appUrl && !envOrigins.includes(appUrl)) {
    envOrigins.push(appUrl);
  }

  const allAllowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));

  const corsOriginHandler = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (env.NODE_ENV !== 'production' || allAllowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, false);
  };

  const io = new SocketIOServer(server, {
    cors: {
      origin: corsOriginHandler,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Initialize our centralized notification and real-time state publisher
  notificationService.init(io);

  // Secure Socket.io Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '') ||
        (socket.handshake.query?.token as string);

      if (!token || token === 'undefined' || token === 'null' || !token.trim()) {
        return next(new Error('Authentication required for socket connection'));
      }

      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
      if (!decoded || (!decoded.id && !decoded.email)) {
        return next(new Error('Invalid socket authentication token'));
      }

      let dbUser: any = null;
      if (decoded.id && decoded.id.length === 24) {
        dbUser = await (User as any).findById(decoded.id).select('email role firstName lastName').lean();
      }
      if (!dbUser && decoded.email) {
        const cleanEmail = String(decoded.email).toLowerCase().trim();
        dbUser = await (User as any).findOne({ email: cleanEmail }).select('email role firstName lastName').lean();
      }

      if (!dbUser) {
        return next(new Error('User account not found or access revoked'));
      }

      socket.data.user = {
        id: dbUser._id.toString(),
        email: dbUser.email,
        role: dbUser.role || UserRole.HUB_MEMBER,
        tenantId: 'weventurehub',
      };

      next();
    } catch (err: any) {
      logger.warn(`🔒 Socket connection authentication rejected: ${err.message}`);
      return next(new Error('Authentication failed'));
    }
  });

  // Socket.io Handshake and Authoritative Connection logic
  io.on('connection', (socket) => {
    const user = socket.data.user;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    logger.info(`🔌 Authenticated socket connected: ${socket.id} (${user.email}, ${user.role})`);

    // Authoritatively join user's private personal room using verified user ID
    const personalRoom = `user:${user.id}`;
    socket.join(personalRoom);

    // Join platform organization room
    socket.join('tenant:weventurehub');

    // If administrative or operational role, join staff/admin channel
    const isAdmin = [
      UserRole.SUPER_ADMIN,
      UserRole.TENANT_ADMIN,
      'ADMIN',
      UserRole.STAFF,
      'MANAGER',
      UserRole.EVENT_MANAGER,
      UserRole.WORKSPACE_MANAGER,
      UserRole.FINANCE_OFFICER,
    ].includes(user.role);

    if (isAdmin) {
      socket.join('admin:notifications');
    }

    // Client requests to join rooms are verified against the authenticated user
    socket.on('join-tenant-room', () => {
      socket.join('tenant:weventurehub');
    });

    socket.on('join-user-room', (requestedUserId: string) => {
      if (requestedUserId && requestedUserId.toLowerCase() !== user.id.toLowerCase()) {
        logger.warn(`⚠️ [SECURITY] Socket ${socket.id} attempted to join unauthorized user room: ${requestedUserId}`);
        return;
      }
      socket.join(personalRoom);
    });

    socket.on('disconnect', () => {
      logger.info(`🔌 Socket disconnected: ${socket.id} (${user.email})`);
    });
  });

  // Make Socket.io server accessible globally inside request handlers if needed
  app.set('io', io);

  // Parse incoming JSON requests with a reasonable limit
  const payloadLimit = env.NODE_ENV === 'production' ? '2mb' : '10mb';
  app.use(express.json({ limit: payloadLimit }));
  app.use(express.urlencoded({ extended: true, limit: payloadLimit }));

  app.use(
    cors({
      origin: corsOriginHandler,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Request-ID'],
    })
  );

  // Configure Helmet for secure HTTP response headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // Database Connection
  try {
    await connectDatabase();
    await tenantService.seedDefaultTenant();
    await subscriptionService.seedDefaultPlans();
    await emailTemplateService.seedDefaultTemplates();
    reportService.startScheduler();
    billingSchedulerService.startScheduler();
    emailQueueProcessor.start(5000);
    emailCronScheduler.start(15);
  } catch (error) {
    if (env.NODE_ENV === 'production') {
      logger.error('❌ Critical database connection failure in production. Failing fast...', error);
      process.exit(1);
    } else {
      logger.error('⚠️ Server booting in offline mode (database connection failed)');
    }
  }

  // Mount API REST Router
  app.use('/api', publicApiRouter);
  app.use('/api/v1', apiRouter);
  app.use('/api/dashboard', dashboardRouter);

  // Raw root-level webhook listener for third party integrations
  const integrationController = new IntegrationController();
  app.post('/api/webhooks/events', tenantContext, (req, res, next) => {
    integrationController.handleIncomingWebhook(req, res, next);
  });

  // Vite middleware setup for asset serving in Development vs Production
  if (env.NODE_ENV !== 'production') {
    logger.info('🚀 Mounting Vite dev server middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    logger.info('📦 Serving compiled static production assets from /dist...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Register Global Error Handling Middleware (MUST be registered last)
  app.use(errorHandler);

  // Use the port assigned by Render in production.
// Fallback to 3000 for local development.
const PORT = Number(process.env.PORT) || 3000;

server.listen(PORT, '0.0.0.0', () => {
  logger.info('===================================================');
  logger.info(`🚀 WeVentureHub Platform running at http://0.0.0.0:${PORT}`);
  logger.info(`🔧 Active Environment: ${env.NODE_ENV}`);
  logger.info('===================================================');
});
}

startServer().catch((err) => {
  logger.error('❌ Failed to boot WeVentureHub Express server', err);
  process.exit(1);
});
