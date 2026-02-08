import { API_ENDPOINTS } from '../config/api';

type LogLevel = 'info' | 'warn' | 'error';

class RemoteLogger {
  private static async sendLog(level: LogLevel, message: string, details?: any) {
    // Console log for local debugging
    const timestamp = new Date().toISOString();
    const consoleMsg = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (level === 'error') {
      console.error(consoleMsg, details || '');
    } else if (level === 'warn') {
      console.warn(consoleMsg, details || '');
    } else {
      console.log(consoleMsg, details || '');
    }

    try {
      // Don't await specifically to avoid blocking UI
       fetch(API_ENDPOINTS.LOGS.LOG, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level,
          message,
          details
        }),
      }).catch(err => console.error('Failed to send log to server:', err));
    } catch (e) {
      // Fail silently if logging fails
    }
  }

  static info(message: string, details?: any) {
    this.sendLog('info', message, details);
  }

  static warn(message: string, details?: any) {
    this.sendLog('warn', message, details);
  }

  static error(message: string, details?: any) {
    this.sendLog('error', message, details);
  }
}

export default RemoteLogger;
