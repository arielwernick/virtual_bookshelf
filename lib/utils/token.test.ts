import { describe, it, expect } from 'vitest';
import { generateShortToken } from './token';

describe('generateShortToken', () => {
  it('generates a token of default length (8)', () => {
    const token = generateShortToken();
    expect(token).toHaveLength(8);
  });

  it('generates a token of specified length', () => {
    expect(generateShortToken(6)).toHaveLength(6);
    expect(generateShortToken(10)).toHaveLength(10);
    expect(generateShortToken(12)).toHaveLength(12);
  });

  it('generates unique tokens', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      tokens.add(generateShortToken());
    }
    // All 1000 tokens should be unique
    expect(tokens.size).toBe(1000);
  });

  it('only contains URL-safe characters', () => {
    const token = generateShortToken(100);
    // Should only contain alphanumeric characters (no special chars)
    expect(token).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('excludes ambiguous characters (0, O, 1, l, I)', () => {
    // Generate many tokens and check none contain ambiguous chars
    for (let i = 0; i < 100; i++) {
      const token = generateShortToken(20);
      expect(token).not.toMatch(/[0O1lI]/);
    }
  });
});
