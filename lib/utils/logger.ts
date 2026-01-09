/**
 * Production-safe logging utility
 * 
 * Features:
 * - Log levels: DEBUG, INFO, WARN, ERROR
 * - Automatic sensitive data redaction
 * - Environment-aware (DEBUG only in development)
 * - Consistent formatting
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// Sensitive field patterns to redact
const SENSITIVE_FIELDS = [
  'password',
  'password_hash',
  'passwordHash',
  'token',
  'access_token',
  'refresh_token',
  'id_token',
  'code',
  'state',
  'secret',
  'api_key',
  'apiKey',
  'client_secret',
  'authorization',
  'cookie',
  'session',
];

// Sensitive value patterns (emails, JWTs, etc.)
const SENSITIVE_PATTERNS = [
  /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/, // JWT tokens
  /^[a-f0-9]{32,}$/i, // Long hex strings (tokens, state values)
];

/**
 * Redact sensitive data from objects
 */
function redactSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle primitive types
  if (typeof data !== 'object') {
    // Check if string matches sensitive patterns
    if (typeof data === 'string') {
      for (const pattern of SENSITIVE_PATTERNS) {
        if (pattern.test(data)) {
          return '[REDACTED]';
        }
      }
    }
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item));
  }

  // Handle objects
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    // Check if key exactly matches or is a variant of sensitive fields
    const isSensitiveKey = SENSITIVE_FIELDS.some(field => {
      const lowerField = field.toLowerCase();
      // Exact match or key ends with the sensitive field name (e.g., 'user_password' matches 'password')
      return lowerKey === lowerField || lowerKey.endsWith('_' + lowerField) || lowerKey.endsWith(lowerField);
    });

    if (isSensitiveKey) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = redactSensitiveData(value);
    }
  }

  return redacted;
}

/**
 * Format log message with timestamp and level
 */
function formatMessage(level: LogLevel, context: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] [${context}] ${message}`;
}

/**
 * Core logging function
 */
function log(
  level: LogLevel,
  context: string,
  message: string,
  data?: Record<string, unknown>
): void {
  // Skip DEBUG logs in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (level === LogLevel.DEBUG && !isDevelopment) {
    return;
  }

  const formattedMessage = formatMessage(level, context, message);
  const redactedData = data ? redactSensitiveData(data) : undefined;

  switch (level) {
    case LogLevel.ERROR:
      if (redactedData !== undefined) {
        console.error(formattedMessage, redactedData);
      } else {
        console.error(formattedMessage);
      }
      break;
    case LogLevel.WARN:
      if (redactedData !== undefined) {
        console.warn(formattedMessage, redactedData);
      } else {
        console.warn(formattedMessage);
      }
      break;
    case LogLevel.INFO:
    case LogLevel.DEBUG:
      if (redactedData !== undefined) {
        console.log(formattedMessage, redactedData);
      } else {
        console.log(formattedMessage);
      }
      break;
  }
}

/**
 * Logger instance with context
 */
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  debug(message: string, data?: Record<string, unknown>): void {
    log(LogLevel.DEBUG, this.context, message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    log(LogLevel.INFO, this.context, message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    log(LogLevel.WARN, this.context, message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    log(LogLevel.ERROR, this.context, message, data);
  }

  /**
   * Log error object safely
   */
  errorWithException(message: string, error: unknown, data?: Record<string, unknown>): void {
    const errorData = {
      ...data,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    };
    log(LogLevel.ERROR, this.context, message, errorData);
  }
}

/**
 * Create a logger instance for a specific context
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}

/**
 * Export for testing purposes
 */
export const _testing = {
  redactSensitiveData,
  formatMessage,
  SENSITIVE_FIELDS,
  SENSITIVE_PATTERNS,
};
