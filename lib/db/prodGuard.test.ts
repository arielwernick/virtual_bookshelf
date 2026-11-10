import { describe, it, expect } from 'vitest';
import {
  assertNotProduction,
  isProductionDatabaseUrl,
  isProductionSiteUrl,
  ProductionGuardError,
} from './prodGuard';

const PROD_POOLED = 'postgresql://u:pw@ep-broad-resonance-ahfg834z-pooler.c-3.us-east-1.aws.neon.tech/neondb';
const PROD_DIRECT = 'postgresql://u:pw@ep-broad-resonance-ahfg834z.c-3.us-east-1.aws.neon.tech/neondb';
const DEV = 'postgresql://u:pw@ep-divine-wave-ahsze4vu-pooler.c-3.us-east-1.aws.neon.tech/neondb';
const LOCAL = 'postgresql://test:test@localhost:5432/test';

const env = (vars: Record<string, string> = {}) => ({ NODE_ENV: 'test', ...vars }) as NodeJS.ProcessEnv;

describe('isProductionDatabaseUrl', () => {
  it('recognizes the production endpoint, pooled or direct', () => {
    expect(isProductionDatabaseUrl(PROD_POOLED, env())).toBe(true);
    expect(isProductionDatabaseUrl(PROD_DIRECT, env())).toBe(true);
  });

  it('does not flag the dev branch, localhost or a missing URL', () => {
    expect(isProductionDatabaseUrl(DEV, env())).toBe(false);
    expect(isProductionDatabaseUrl(LOCAL, env())).toBe(false);
    expect(isProductionDatabaseUrl(undefined, env())).toBe(false);
    expect(isProductionDatabaseUrl('not a url', env())).toBe(false);
  });

  it('honors extra hosts from PRODUCTION_DB_HOSTS', () => {
    expect(isProductionDatabaseUrl(LOCAL, env({ PRODUCTION_DB_HOSTS: 'db.example.com, localhost' }))).toBe(true);
  });
});

describe('isProductionSiteUrl', () => {
  it('flags the production site and nothing else', () => {
    expect(isProductionSiteUrl('https://virtualbookshelf.app')).toBe(true);
    expect(isProductionSiteUrl('https://www.virtualbookshelf.app/dashboard')).toBe(true);
    expect(isProductionSiteUrl('http://localhost:3000')).toBe(false);
    expect(isProductionSiteUrl('https://virtualbookshelf-git-x.vercel.app')).toBe(false);
    expect(isProductionSiteUrl(undefined)).toBe(false);
  });
});

describe('assertNotProduction', () => {
  const opts = { action: 'migrate:down', allowVar: 'MIGRATE_ALLOW_PROD' };

  it('passes for non-production targets', () => {
    expect(assertNotProduction({ databaseUrl: DEV }, { ...opts, env: env() })).toBe(false);
  });

  it('throws for the production database, naming the action and the override', () => {
    expect(() => assertNotProduction({ databaseUrl: PROD_POOLED }, { ...opts, env: env() })).toThrow(
      ProductionGuardError
    );
    expect(() => assertNotProduction({ databaseUrl: PROD_POOLED }, { ...opts, env: env() })).toThrow(
      /migrate:down.*MIGRATE_ALLOW_PROD=1/
    );
  });

  it('throws for the production site', () => {
    expect(() =>
      assertNotProduction({ siteUrl: 'https://virtualbookshelf.app' }, { ...opts, env: env() })
    ).toThrow(ProductionGuardError);
  });

  it('allows production only when the override is exactly "1"', () => {
    expect(
      assertNotProduction({ databaseUrl: PROD_DIRECT }, { ...opts, env: env({ MIGRATE_ALLOW_PROD: '1' }) })
    ).toBe(true);
    expect(() =>
      assertNotProduction({ databaseUrl: PROD_DIRECT }, { ...opts, env: env({ MIGRATE_ALLOW_PROD: 'true' }) })
    ).toThrow(ProductionGuardError);
  });
});
