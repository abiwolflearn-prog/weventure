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
import { tenantService } from './src/services/TenantService';
import { subscriptionService } from './src/services/SubscriptionService';
import { IntegrationController } from './src/controllers/IntegrationController';
import { tenantContext } from './src/middleware/tenantContext';

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Initialize Socket.io with restricted CORS origins in production
  const socketOrigins = env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
    : '*';

  const io = new SocketIOServer(server, {
    cors: {
      origin: socketOrigins,
      methods: ['GET', 'POST'],
    },
  });

  // Initialize our centralized notification and real-time state publisher
  notificationService.init(io);

  // Socket.io Handshake and Connection logic
  io.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: ${socket.id}`);

    socket.on('join-tenant-room', (tenantId: string) => {
      const room = `tenant:${tenantId.toLowerCase()}`;
      socket.join(room);
      logger.info(`🔌 Socket ${socket.id} joined space boundary: ${room}`);
    });

    socket.on('join-user-room', (userId: string) => {
      const room = `user:${userId.toLowerCase()}`;
      socket.join(room);
      logger.info(`🔌 Socket ${socket.id} joined personal boundary: ${room}`);
    });

    socket.on('disconnect', () => {
      logger.info(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  // Make Socket.io server accessible globally inside request handlers if needed
  app.set('io', io);

  // Parse incoming JSON requests with a reasonable limit
  const payloadLimit = env.NODE_ENV === 'production' ? '2mb' : '10mb';
  app.use(express.json({ limit: payloadLimit }));
  app.use(express.urlencoded({ extended: true, limit: payloadLimit }));

  // Dynamic CORS configuration based on environment
  const allowedOrigins = env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
    : true;

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Request-ID'],
    })
  );

  // Configure Helmet for secure HTTP response headers
  // We disable contentSecurityPolicy in development to let Vite load hot module files
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: env.NODE_ENV === 'production',
    })
  );

  // Database Connection
  try {
    await connectDatabase();
    await tenantService.seedDefaultTenant();
    await subscriptionService.seedDefaultPlans();
    reportService.startScheduler();
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

  const PORT = env.PORT;
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`===================================================`);
    logger.info(`🚀 WeVentureHub Platform running at http://0.0.0.0:${PORT}`);
    logger.info(`🔧 Active Environment: ${env.NODE_ENV}`);
    logger.info(`===================================================`);
  });
}

startServer().catch((err) => {
  logger.error('❌ Failed to boot WeVentureHub Express server', err);
  process.exit(1);
});
