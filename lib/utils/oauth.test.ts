import { describe, it, expect } from 'vitest';
import {
  generateOpaqueToken,
  hashToken,
  verifyPkceS256,
  isAllowedRedirectUri,
} from './oauth';

describe('oauth utils', () => {
  describe('generateOpaqueToken', () => {
    it('generates a 43-char base64url string (32 bytes)', () => {
      const token = generateOpaqueToken();
      expect(token).toHaveLength(43);
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('generates unique values', () => {
      const tokens = new Set(Array.from({ length: 100 }, generateOpaqueToken));
      expect(tokens.size).toBe(100);
    });
  });

  describe('hashToken', () => {
    it('is deterministic', async () => {
      const a = await hashToken('some-token');
      const b = await hashToken('some-token');
      expect(a).toBe(b);
    });

    it('produces base64url output distinct from the input', async () => {
      const hash = await hashToken('some-token');
      expect(hash).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(hash).not.toBe('some-token');
    });
  });

  describe('verifyPkceS256', () => {
    it('accepts a matching verifier/challenge pair', async () => {
      const verifier = generateOpaqueToken(); // 43 chars, valid PKCE verifier
      const challenge = await hashToken(verifier);
      expect(await verifyPkceS256(verifier, challenge)).toBe(true);
    });

    it('rejects a wrong verifier', async () => {
      const challenge = await hashToken(generateOpaqueToken());
      expect(await verifyPkceS256(generateOpaqueToken(), challenge)).toBe(false);
    });

    it('rejects verifiers shorter than 43 chars', async () => {
      const short = 'abc';
      const challenge = await hashToken(short);
      expect(await verifyPkceS256(short, challenge)).toBe(false);
    });

    it('rejects verifiers longer than 128 chars', async () => {
      const long = 'a'.repeat(129);
      const challenge = await hashToken(long);
      expect(await verifyPkceS256(long, challenge)).toBe(false);
    });
  });

  describe('isAllowedRedirectUri', () => {
    it('allows https URIs', () => {
      expect(isAllowedRedirectUri('https://claude.ai/api/mcp/auth_callback')).toBe(true);
    });

    it('allows http on localhost and 127.0.0.1', () => {
      expect(isAllowedRedirectUri('http://localhost:33418/callback')).toBe(true);
      expect(isAllowedRedirectUri('http://127.0.0.1:8080/callback')).toBe(true);
    });

    it('rejects http on other hosts', () => {
      expect(isAllowedRedirectUri('http://evil.example.com/callback')).toBe(false);
    });

    it('rejects non-http(s) schemes and malformed URIs', () => {
      expect(isAllowedRedirectUri('javascript:alert(1)')).toBe(false);
      expect(isAllowedRedirectUri('not a url')).toBe(false);
    });
  });
});
