/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { ErrorCode } from '@/lib/types/shelf';
import {
  authRequiredError,
  invalidCredentialsError,
  forbiddenError,
  validationError,
  invalidInputError,
  missingFieldError,
  notFoundError,
  alreadyExistsError,
  duplicateEntryError,
  rateLimitError,
  internalError,
  databaseError,
  externalServiceError,
} from './errors';

describe('Error Utility Functions', () => {
  describe('Authentication Errors (401)', () => {
    it('returns authRequiredError with correct structure', async () => {
      const response = authRequiredError();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe(ErrorCode.AUTH_REQUIRED);
      expect(data.error.message).toBe('Authentication required');
    });

    it('returns authRequiredError with custom message', async () => {
      const response = authRequiredError('Please log in');
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.message).toBe('Please log in');
    });

    it('returns invalidCredentialsError with correct structure', async () => {
      const response = invalidCredentialsError();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe(ErrorCode.INVALID_CREDENTIALS);
      expect(data.error.message).toBe('Invalid credentials');
    });

    it('returns invalidCredentialsError with custom message', async () => {
      const response = invalidCredentialsError('Wrong password');
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.message).toBe('Wrong password');
    });
  });

  describe('Authorization Errors (403)', () => {
    it('returns forbiddenError with correct structure', async () => {
      const response = forbiddenError();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe(ErrorCode.FORBIDDEN);
      expect(data.error.message).toBe('Access forbidden');
    });

    it('returns forbiddenError with custom message', async () => {
      const response = forbiddenError('You do not have permission');
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.message).toBe('You do not have permission');
    });
  });

  describe('Validation Errors (400)', () => {
    it('returns validationError with correct structure', async () => {
      const response = validationError('Invalid input');
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe(ErrorCode.VALIDATION_FAILED);
      expect(data.error.message).toBe('Invalid input');
    });

    it('returns validationError with details', async () => {
      const details = { field: 'email', reason: 'Invalid format' };
      const response = validationError('Validation failed', details);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.details).toEqual(details);
    });

    it('returns invalidInputError with correct structure', async () => {
      const response = invalidInputError('Bad data');
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe(ErrorCode.INVALID_INPUT);
      expect(data.error.message).toBe('Bad data');
    });

    it('returns missingFieldError with field name', async () => {
      const response = missingFieldError('username');
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe(ErrorCode.MISSING_FIELD);
      expect(data.error.message).toBe('Missing required field: username');
    });
  });

  describe('Not Found Errors (404)', () => {
    it('returns notFoundError with default resource', async () => {
      const response = notFoundError();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe(ErrorCode.NOT_FOUND);
      expect(data.error.message).toBe('Resource not found');
    });

    it('returns notFoundError with custom resource', async () => {
      const response = notFoundError('User');
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.message).toBe('User not found');
    });
  });

  describe('Conflict Errors (409)', () => {
    it('returns alreadyExistsError with default resource', async () => {
      const response = alreadyExistsError();
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error.code).toBe(ErrorCode.ALREADY_EXISTS);
      expect(data.error.message).toBe('Resource already exists');
    });

    it('returns alreadyExistsError with custom resource', async () => {
      const response = alreadyExistsError('Username');
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error.message).toBe('Username already exists');
    });

    it('returns duplicateEntryError with message', async () => {
      const response = duplicateEntryError('Email already in use');
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error.code).toBe(ErrorCode.DUPLICATE_ENTRY);
      expect(data.error.message).toBe('Email already in use');
    });
  });

  describe('Rate Limit Errors (429)', () => {
    it('returns rateLimitError with correct structure', async () => {
      const response = rateLimitError();
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(data.error.message).toBe('Too many requests. Please try again later.');
    });

    it('returns rateLimitError with details', async () => {
      const details = { retryAfter: 60, limit: 5 };
      const response = rateLimitError('Rate limit exceeded', details);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error.details).toEqual(details);
    });
  });

  describe('Server Errors (500)', () => {
    it('returns internalError with correct structure', async () => {
      const response = internalError();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(data.error.message).toBe('Internal server error');
    });

    it('returns internalError with custom message', async () => {
      const response = internalError('Something went wrong');
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.message).toBe('Something went wrong');
    });

    it('returns databaseError with correct structure', async () => {
      const response = databaseError();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(data.error.message).toBe('Database operation failed');
    });

    it('returns externalServiceError with service name', async () => {
      const response = externalServiceError('Google OAuth');
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe(ErrorCode.EXTERNAL_SERVICE_ERROR);
      expect(data.error.message).toBe('External service error: Google OAuth');
    });
  });

  describe('Error Response Structure', () => {
    it('all errors have success: false', async () => {
      const errors = [
        authRequiredError(),
        forbiddenError(),
        validationError('test'),
        notFoundError(),
        alreadyExistsError(),
        rateLimitError(),
        internalError(),
      ];

      for (const errorResponse of errors) {
        const data = await errorResponse.json();
        expect(data.success).toBe(false);
      }
    });

    it('all errors have error object with code and message', async () => {
      const errors = [
        authRequiredError(),
        forbiddenError(),
        validationError('test'),
        notFoundError(),
        alreadyExistsError(),
        rateLimitError(),
        internalError(),
      ];

      for (const errorResponse of errors) {
        const data = await errorResponse.json();
        expect(data.error).toBeDefined();
        expect(data.error.code).toBeDefined();
        expect(data.error.message).toBeDefined();
        expect(typeof data.error.code).toBe('string');
        expect(typeof data.error.message).toBe('string');
      }
    });

    it('errors with details include details field', async () => {
      const details = { field: 'email' };
      const response = validationError('test', details);
      const data = await response.json();

      expect(data.error.details).toEqual(details);
    });

    it('errors without details do not include details field', async () => {
      const response = authRequiredError();
      const data = await response.json();

      expect(data.error.details).toBeUndefined();
    });
  });
});
