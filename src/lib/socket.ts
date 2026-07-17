import { io, Socket } from 'socket.io-client';
import { logger } from '../utils/logger';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    // Connect to same host/port serving the web app
    socket = io({
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected successfully to WeVentureHub server');
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected from WeVentureHub server');
    });

    socket.on('connect_error', (error) => {
      console.warn('⚠️ Socket connection error, entering retry loop:', error);
    });
  }
  return socket;
};

export const connectSocket = (userId: string, tenantId: string) => {
  try {
    const s = getSocket();
    if (!s.connected) {
      s.connect();
    }
    s.emit('join-tenant-room', tenantId.toLowerCase());
    s.emit('join-user-room', userId.toLowerCase());
  } catch (err) {
    console.error('Failed to coordinate socket connections:', err);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
