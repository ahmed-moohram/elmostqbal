/**
 * Logger Utility
 * 
 * استخدم هذا بدلاً من console.log/error/warn
 * في المستقبل يمكن إرسال اللوقات إلى خدمة مثل Sentry
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'security';

interface LogMeta {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * معلومات عامة
   */
  info(message: string, meta?: LogMeta) {
    if (this.isDevelopment) {
      console.log(`ℹ️ [INFO] ${message}`, meta || '');
    }
    
    // في الإنتاج: أرسل إلى logging service
    if (this.isProduction) {
      this.sendToService('info', message, meta);
    }
  }

  /**
   * تحذيرات
   */
  warn(message: string, meta?: LogMeta) {
    if (this.isDevelopment) {
      console.warn(`⚠️ [WARN] ${message}`, meta || '');
    }
    
    if (this.isProduction) {
      this.sendToService('warn', message, meta);
    }
  }

  /**
   * أخطاء
   */
  error(message: string, error?: Error | any, meta?: LogMeta) {
    if (this.isDevelopment) {
      console.error(`❌ [ERROR] ${message}`, error || '', meta || '');
    }
    
    if (this.isProduction) {
      this.sendToService('error', message, { error, ...meta });
    }
  }

  /**
   * Debug (فقط في التطوير)
   */
  debug(message: string, meta?: LogMeta) {
    if (this.isDevelopment) {
      console.log(`🐛 [DEBUG] ${message}`, meta || '');
    }
  }

  /**
   * أحداث أمنية مهمة
   */
  security(message: string, meta?: LogMeta) {
    const securityLog = {
      level: 'security',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    };

    if (this.isDevelopment) {
      console.warn(`🔒 [SECURITY] ${message}`, meta || '');
    }
    
    // في الإنتاج: أرسل دائماً إلى security monitoring
    if (this.isProduction) {
      this.sendToService('security', message, meta);
    }
  }

  /**
   * إرسال اللوقات إلى خدمة خارجية
   * TODO: تطبيق في المستقبل (Sentry, LogRocket, etc)
   */
  private sendToService(level: LogLevel, message: string, meta?: LogMeta) {
    // TODO: ادمج مع Sentry أو خدمة logging أخرى
    // مثال:
    // Sentry.captureMessage(message, {
    //   level: level as SeverityLevel,
    //   extra: meta
    // });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export default
export default logger;
