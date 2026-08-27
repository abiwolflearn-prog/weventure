import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const getSocketServerUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    const cleanUrl = envUrl.trim().replace(/\/+$/, '');
    return cleanUrl.replace(/\/api(\/v1)?$/, '');
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
};

export const getSocket = (): Socket => {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('weventure_jwt_token') || '') : '';

  if (!socket) {
    socket = io(getSocketServerUrl(), {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      auth: {
        token,
      },
    });

    socket.on('connect', () => {
      console.log('🔌 Secure socket connected to WeVentureHub server');
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected from WeVentureHub server');
    });

    socket.on('connect_error', (error) => {
      console.warn('⚠️ Socket connection error, entering retry loop:', error.message);
    });
  } else {
    // Keep auth token in sync with localStorage
    if (token && socket.auth) {
      (socket.auth as any).token = token;
    }
  }
  return socket;
};

export const connectSocket = (_userId?: string, _tenantId?: string) => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('weventure_jwt_token') : null;
    if (!token || token === 'undefined' || token === 'null' || !token.trim()) {
      return;
    }

    const s = getSocket();
    if (s.auth) {
      (s.auth as any).token = token;
    }
    if (!s.connected) {
      s.connect();
    }
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
