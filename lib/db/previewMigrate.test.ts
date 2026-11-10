import { describe, it, expect } from 'vitest';
import { endpointOf, planPreviewMigration } from './previewMigrate';

const PROD_POOLED = 'postgresql://u:pw@ep-broad-resonance-ahfg834z-pooler.c-3.us-east-1.aws.neon.tech/neondb';
const PROD_DIRECT = 'postgresql://u:pw@ep-broad-resonance-ahfg834z.c-3.us-east-1.aws.neon.tech/neondb';
const BRANCH_DIRECT = 'postgresql://u:pw@ep-hidden-bonus-ahdko6kb.c-3.us-east-1.aws.neon.tech/neondb';
const OTHER_POOLED = 'postgresql://u:pw@ep-some-prod-pooler.example.neon.tech/neondb';
const OTHER_DIRECT = 'postgresql://u:pw@ep-some-prod.example.neon.tech/neondb';

const env = (vars: Record<string, string>) => ({ NODE_ENV: 'test', ...vars }) as NodeJS.ProcessEnv;

describe('endpointOf', () => {
  it('strips the pooler suffix and handles bad input', () => {
    expect(endpointOf(PROD_POOLED)).toBe('ep-broad-resonance-ahfg834z');
    expect(endpointOf(PROD_DIRECT)).toBe('ep-broad-resonance-ahfg834z');
    expect(endpointOf(undefined)).toBeNull();
    expect(endpointOf('nope')).toBeNull();
  });
});

describe('planPreviewMigration', () => {
  it('migrates the preview branch on a preview build', () => {
    const plan = planPreviewMigration(
      env({ VERCEL_ENV: 'preview', DATABASE_URL: PROD_POOLED, BOOKSHELF_DATABASE_URL_UNPOOLED: BRANCH_DIRECT })
    );
    expect(plan).toEqual({ run: true, databaseUrl: BRANCH_DIRECT, endpoint: 'ep-hidden-bonus-ahdko6kb' });
  });

  it('never migrates production or local builds', () => {
    for (const vercelEnv of ['production', 'development', undefined]) {
      const vars: Record<string, string> = { DATABASE_URL: PROD_POOLED, BOOKSHELF_DATABASE_URL_UNPOOLED: BRANCH_DIRECT };
      if (vercelEnv) vars.VERCEL_ENV = vercelEnv;
      expect(planPreviewMigration(env(vars)).run).toBe(false);
    }
  });

  it('skips a preview without a branch URL', () => {
    const plan = planPreviewMigration(env({ VERCEL_ENV: 'preview', DATABASE_URL: PROD_POOLED }));
    expect(plan).toMatchObject({ run: false, reason: expect.stringMatching(/no preview branch URL/) });
  });

  it('skips when the branch URL is the known production endpoint', () => {
    const plan = planPreviewMigration(
      env({ VERCEL_ENV: 'preview', DATABASE_URL: OTHER_POOLED, BOOKSHELF_DATABASE_URL_UNPOOLED: PROD_DIRECT })
    );
    expect(plan).toMatchObject({ run: false, reason: expect.stringMatching(/production/) });
  });

  it('skips when the branch URL is the same endpoint as DATABASE_URL', () => {
    const plan = planPreviewMigration(
      env({ VERCEL_ENV: 'preview', DATABASE_URL: OTHER_POOLED, BOOKSHELF_DATABASE_URL_UNPOOLED: OTHER_DIRECT })
    );
    expect(plan).toMatchObject({ run: false, reason: expect.stringMatching(/production/) });
  });
});
