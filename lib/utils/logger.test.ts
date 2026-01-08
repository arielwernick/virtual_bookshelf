import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger, LogLevel, _testing } from './logger';

const { redactSensitiveData, formatMessage } = _testing;

describe('logger utility', () => {
  // Store original NODE_ENV
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore mocks
    vi.restoreAllMocks();
    // Restore NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });

  describe('redactSensitiveData', () => {
    it('redacts password fields', () => {
      const data = { username: 'john', password: 'secret123' };
      const result = redactSensitiveData(data);
      expect(result).toEqual({ username: 'john', password: '[REDACTED]' });
    });

    it('redacts password_hash fields', () => {
      const data = { username: 'john', password_hash: 'hashed_value' };
      const result = redactSensitiveData(data);
      expect(result).toEqual({ username: 'john', password_hash: '[REDACTED]' });
    });

    it('redacts token fields', () => {
      const data = { id: '123', access_token: 'abc123' };
      const result = redactSensitiveData(data);
      expect(result).toEqual({ id: '123', access_token: '[REDACTED]' });
    });

    it('does not redact email field names by default', () => {
      const data = { username: 'john', email: 'john@example.com' };
      const result = redactSensitiveData(data);
      // Email addresses are kept (field name 'email' is not in SENSITIVE_FIELDS)
      // We redact by sensitive field names, not by pattern matching email values
      expect(result).toEqual({ username: 'john', email: 'john@example.com' });
    });

    it('redacts JWT tokens in string values', () => {
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const result = redactSensitiveData(jwt);
      expect(result).toBe('[REDACTED]');
    });

    it('redacts long hex strings (tokens, state values)', () => {
      const hexToken = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';
      const result = redactSensitiveData(hexToken);
      expect(result).toBe('[REDACTED]');
    });

    it('handles nested objects', () => {
      const data = {
        user: {
          username: 'john',
          credentials: {
            password: 'secret',
            token: 'abc123',
          },
        },
      };
      const result = redactSensitiveData(data);
      expect(result).toEqual({
        user: {
          username: 'john',
          credentials: {
            password: '[REDACTED]',
            token: '[REDACTED]',
          },
        },
      });
    });

    it('handles arrays', () => {
      const data = [
        { username: 'john', password: 'secret1' },
        { username: 'jane', password: 'secret2' },
      ];
      const result = redactSensitiveData(data);
      expect(result).toEqual([
        { username: 'john', password: '[REDACTED]' },
        { username: 'jane', password: '[REDACTED]' },
      ]);
    });

    it('handles null and undefined', () => {
      expect(redactSensitiveData(null)).toBe(null);
      expect(redactSensitiveData(undefined)).toBe(undefined);
    });

    it('handles primitive types', () => {
      expect(redactSensitiveData(123)).toBe(123);
      expect(redactSensitiveData(true)).toBe(true);
      expect(redactSensitiveData('safe string')).toBe('safe string');
    });

    it('redacts case-insensitive sensitive fields', () => {
      const data = { 
        Password: 'secret',
        ACCESS_TOKEN: 'token123',
        ApiKey: 'key456',
      };
      const result = redactSensitiveData(data);
      expect(result).toEqual({
        Password: '[REDACTED]',
        ACCESS_TOKEN: '[REDACTED]',
        ApiKey: '[REDACTED]',
      });
    });
  });

  describe('formatMessage', () => {
    it('formats message with timestamp, level, and context', () => {
      const result = formatMessage(LogLevel.INFO, 'TestContext', 'Test message');
      expect(result).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] \[TestContext\] Test message$/);
    });

    it('handles different log levels', () => {
      expect(formatMessage(LogLevel.DEBUG, 'Test', 'msg')).toContain('[DEBUG]');
      expect(formatMessage(LogLevel.INFO, 'Test', 'msg')).toContain('[INFO]');
      expect(formatMessage(LogLevel.WARN, 'Test', 'msg')).toContain('[WARN]');
      expect(formatMessage(LogLevel.ERROR, 'Test', 'msg')).toContain('[ERROR]');
    });
  });

  describe('Logger class', () => {
    it('creates logger with context', () => {
      const logger = createLogger('TestService');
      expect(logger).toBeDefined();
    });

    describe('in development environment', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development';
      });

      it('logs DEBUG messages', () => {
        const logger = createLogger('Test');
        logger.debug('Debug message');
        expect(console.log).toHaveBeenCalled();
      });

      it('logs INFO messages', () => {
        const logger = createLogger('Test');
        logger.info('Info message');
        expect(console.log).toHaveBeenCalled();
      });

      it('logs WARN messages', () => {
        const logger = createLogger('Test');
        logger.warn('Warning message');
        expect(console.warn).toHaveBeenCalled();
      });

      it('logs ERROR messages', () => {
        const logger = createLogger('Test');
        logger.error('Error message');
        expect(console.error).toHaveBeenCalled();
      });

      it('redacts sensitive data in logs', () => {
        const logger = createLogger('Test');
        logger.info('User login', { username: 'john', password: 'secret' });
        
        const call = (console.log as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[0]).toContain('User login');
        expect(call[1]).toEqual({ username: 'john', password: '[REDACTED]' });
      });
    });

    describe('in production environment', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
      });

      it('does NOT log DEBUG messages', () => {
        const logger = createLogger('Test');
        logger.debug('Debug message');
        expect(console.log).not.toHaveBeenCalled();
      });

      it('logs INFO messages', () => {
        const logger = createLogger('Test');
        logger.info('Info message');
        expect(console.log).toHaveBeenCalled();
      });

      it('logs WARN messages', () => {
        const logger = createLogger('Test');
        logger.warn('Warning message');
        expect(console.warn).toHaveBeenCalled();
      });

      it('logs ERROR messages', () => {
        const logger = createLogger('Test');
        logger.error('Error message');
        expect(console.error).toHaveBeenCalled();
      });
    });

    describe('errorWithException', () => {
      it('logs error with Error object', () => {
        const logger = createLogger('Test');
        const error = new Error('Something went wrong');
        logger.errorWithException('Operation failed', error);
        
        const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[1]).toMatchObject({
          error: 'Something went wrong',
          errorType: 'Error',
        });
      });

      it('logs error with non-Error object', () => {
        const logger = createLogger('Test');
        logger.errorWithException('Operation failed', 'string error');
        
        const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[1]).toMatchObject({
          error: 'Unknown error',
          errorType: 'string',
        });
      });

      it('includes additional data', () => {
        const logger = createLogger('Test');
        const error = new Error('Test error');
        logger.errorWithException('Failed', error, { userId: '123' });
        
        const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[1]).toMatchObject({
          userId: '123',
          error: 'Test error',
          errorType: 'Error',
        });
      });

      it('redacts sensitive data in additional data', () => {
        const logger = createLogger('Test');
        const error = new Error('Test error');
        logger.errorWithException('Failed', error, { 
          username: 'john',
          password: 'secret',
        });
        
        const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[1]).toMatchObject({
          username: 'john',
          password: '[REDACTED]',
        });
      });
    });
  });
});
