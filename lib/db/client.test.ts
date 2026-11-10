import { describe, it, expect } from 'vitest';
import { resolveDatabaseUrl } from './client';

const PROD = 'postgresql://user:pw@ep-prod-pooler.example.neon.tech/neondb';
const BRANCH = 'postgresql://user:pw@ep-preview-pooler.example.neon.tech/neondb';

function env(overrides: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return { NODE_ENV: 'test', ...overrides } as NodeJS.ProcessEnv;
}

describe('resolveDatabaseUrl', () => {
  it('uses the preview branch on Vercel preview deployments', () => {
    expect(
      resolveDatabaseUrl(env({ VERCEL_ENV: 'preview', DATABASE_URL: PROD, BOOKSHELF_DATABASE_URL: BRANCH }))
    ).toBe(BRANCH);
  });

  it('falls back to DATABASE_URL on a preview without a branch URL', () => {
    expect(resolveDatabaseUrl(env({ VERCEL_ENV: 'preview', DATABASE_URL: PROD }))).toBe(PROD);
  });

  it('uses DATABASE_URL in production, even when the integration URL is set', () => {
    expect(
      resolveDatabaseUrl(env({ VERCEL_ENV: 'production', DATABASE_URL: PROD, BOOKSHELF_DATABASE_URL: BRANCH }))
    ).toBe(PROD);
  });

  it('uses DATABASE_URL locally, where VERCEL_ENV is not set', () => {
    expect(resolveDatabaseUrl(env({ DATABASE_URL: PROD, BOOKSHELF_DATABASE_URL: BRANCH }))).toBe(PROD);
  });

  it('returns undefined when nothing is set', () => {
    expect(resolveDatabaseUrl(env({}))).toBeUndefined();
  });
});
