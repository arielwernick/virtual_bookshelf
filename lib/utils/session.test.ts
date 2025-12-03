/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createSession, verifySession, _resetSecretKeyCache } from './session';

// Note: setSessionCookie, getSession, and clearSession use next/headers
// which is mocked globally. We test the core JWT functions directly.

describe('createSession', () => {
  it('creates a valid JWT token', async () => {
    const sessionData = {
      userId: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
    };

    const token = await createSession(sessionData);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
  });

  it('creates different tokens for different users', async () => {
    const token1 = await createSession({ userId: 'user-1', username: 'user1' });
    const token2 = await createSession({ userId: 'user-2', username: 'user2' });

    expect(token1).not.toBe(token2);
  });

  it('handles null username', async () => {
    const sessionData = {
      userId: 'user-123',
      username: null,
      email: 'test@example.com',
    };

    const token = await createSession(sessionData);
    expect(token).toBeDefined();
  });
});

describe('verifySession', () => {
  it('verifies and decodes a valid token', async () => {
    const sessionData = {
      userId: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
    };

    const token = await createSession(sessionData);
    const verified = await verifySession(token);

    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe('user-123');
    expect(verified?.username).toBe('testuser');
    expect(verified?.email).toBe('test@example.com');
  });

  it('returns null for invalid token', async () => {
    const result = await verifySession('invalid-token');
    expect(result).toBeNull();
  });

  it('returns null for malformed JWT', async () => {
    const result = await verifySession('not.a.valid.jwt.token');
    expect(result).toBeNull();
  });

  it('returns null for empty token', async () => {
    const result = await verifySession('');
    expect(result).toBeNull();
  });

  it('returns null for token with wrong signature', async () => {
    // Create a valid token structure but with wrong signature
    const validToken = await createSession({ userId: '1', username: 'test' });
    const parts = validToken.split('.');
    const tamperedToken = parts[0] + '.' + parts[1] + '.wrongsignature';

    const result = await verifySession(tamperedToken);
    expect(result).toBeNull();
  });

  it('preserves all session data through round-trip', async () => {
    const sessionData = {
      userId: 'abc-123-def',
      username: 'john_doe',
      email: 'john@example.com',
    };

    const token = await createSession(sessionData);
    const verified = await verifySession(token);

    expect(verified?.userId).toBe(sessionData.userId);
    expect(verified?.username).toBe(sessionData.username);
    expect(verified?.email).toBe(sessionData.email);
  });

  it('handles special characters in session data', async () => {
    const sessionData = {
      userId: 'user-with-special-chars-!@#',
      username: 'user_name-123',
      email: 'user+tag@example.com',
    };

    const token = await createSession(sessionData);
    const verified = await verifySession(token);

    expect(verified?.userId).toBe(sessionData.userId);
    expect(verified?.email).toBe(sessionData.email);
  });
});

describe('session token expiration', () => {
  it('includes expiration claim in token', async () => {
    const token = await createSession({ userId: '1', username: 'test' });
    
    // Decode the payload (middle part of JWT)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    expect(payload.exp).toBeDefined();
    expect(typeof payload.exp).toBe('number');
  });

  it('includes issued-at claim in token', async () => {
    const token = await createSession({ userId: '1', username: 'test' });
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    expect(payload.iat).toBeDefined();
    expect(typeof payload.iat).toBe('number');
  });

  it('sets expiration to approximately 7 days from now', async () => {
    const beforeCreate = Math.floor(Date.now() / 1000);
    const token = await createSession({ userId: '1', username: 'test' });
    const afterCreate = Math.floor(Date.now() / 1000);
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    const sevenDaysInSeconds = 7 * 24 * 60 * 60;
    const expectedExpMin = beforeCreate + sevenDaysInSeconds;
    const expectedExpMax = afterCreate + sevenDaysInSeconds + 1; // +1 for timing tolerance
    
    expect(payload.exp).toBeGreaterThanOrEqual(expectedExpMin);
    expect(payload.exp).toBeLessThanOrEqual(expectedExpMax);
  });
});

describe('session security', () => {
  const originalSecret = process.env.SESSION_SECRET;

  beforeEach(() => {
    // Reset the cached key before each test
    _resetSecretKeyCache();
  });

  afterEach(() => {
    // Restore the original secret after each test
    process.env.SESSION_SECRET = originalSecret;
    _resetSecretKeyCache();
  });

  it('throws error when SESSION_SECRET is not set', async () => {
    delete process.env.SESSION_SECRET;

    await expect(
      createSession({ userId: '1', username: 'test' })
    ).rejects.toThrow('SESSION_SECRET environment variable is required');
  });

  it('throws error with helpful message about configuration', async () => {
    delete process.env.SESSION_SECRET;

    await expect(
      createSession({ userId: '1', username: 'test' })
    ).rejects.toThrow('Please set it in your .env.local file or deployment environment');
  });

  it('works when SESSION_SECRET is properly set', async () => {
    process.env.SESSION_SECRET = 'test-secret-for-unit-tests';

    const token = await createSession({ userId: '1', username: 'test' });
    const verified = await verifySession(token);

    expect(verified?.userId).toBe('1');
  });
});
