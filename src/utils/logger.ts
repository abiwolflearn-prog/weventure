import { env } from '../config/env';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class EnterpriseLogger {
  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const cleanMeta = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${cleanMeta}`;
  }

  info(message: string, meta?: any) {
    console.info(this.formatMessage('info', message, meta));
  }

  warn(message: string, meta?: any) {
    console.warn(this.formatMessage('warn', message, meta));
  }

  error(message: string, error?: any, meta?: any) {
    const errMeta = error instanceof Error 
      ? { ...meta, errorName: error.name, errorMessage: error.message, stack: error.stack }
      : { ...meta, rawError: error };
    console.error(this.formatMessage('error', message, errMeta));
  }

  debug(message: string, meta?: any) {
    if (env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }
}

export const logger = new EnterpriseLogger();
