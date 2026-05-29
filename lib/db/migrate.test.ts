import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadMigrationFiles } from './migrate';

// The DB-touching functions (migrateUp/migrateDown/migrationStatus) require a
// live Postgres connection and are exercised against a real dev/ephemeral DB,
// not in unit tests. Here we cover the pure file-discovery/ordering logic that
// determines correctness and idempotency of the runner.

vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    errorWithException: vi.fn(),
  }),
}));

function makeDir(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'migrate-test-'));
  for (const [name, contents] of Object.entries(files)) {
    writeFileSync(join(dir, name), contents);
  }
  return dir;
}

describe('loadMigrationFiles', () => {
  let dir: string | null = null;

  beforeEach(() => {
    dir = null;
  });

  afterEach(() => {
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
      dir = null;
    }
  });

  it('returns migrations sorted ascending by numeric version', () => {
    dir = makeDir({
      '002_second.sql': 'SELECT 2;',
      '001_first.sql': 'SELECT 1;',
      '010_tenth.sql': 'SELECT 10;',
    });

    const result = loadMigrationFiles(dir);

    expect(result.map((m) => m.version)).toEqual([1, 2, 10]);
    expect(result.map((m) => m.filename)).toEqual([
      '001_first.sql',
      '002_second.sql',
      '010_tenth.sql',
    ]);
  });

  it('orders numerically rather than lexically (2 before 10)', () => {
    dir = makeDir({
      '10_b.sql': 'x',
      '2_a.sql': 'x',
    });

    expect(loadMigrationFiles(dir).map((m) => m.version)).toEqual([2, 10]);
  });

  it('excludes *.down.sql rollback files from the up list', () => {
    dir = makeDir({
      '001_init.sql': 'up',
      '001_init.down.sql': 'down',
    });

    const result = loadMigrationFiles(dir);

    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('001_init.sql');
  });

  it('ignores non-migration files', () => {
    dir = makeDir({
      '001_init.sql': 'up',
      'README.md': 'docs',
      'notes.txt': 'x',
      'no_prefix.sql': 'x',
    });

    const result = loadMigrationFiles(dir);

    expect(result.map((m) => m.filename)).toEqual(['001_init.sql']);
  });

  it('throws on duplicate version prefixes', () => {
    dir = makeDir({
      '001_a.sql': 'x',
      '001_b.sql': 'x',
    });

    expect(() => loadMigrationFiles(dir!)).toThrow(/Duplicate migration version 1/);
  });

  it('throws when the migrations directory does not exist', () => {
    expect(() => loadMigrationFiles('/nonexistent/path/xyz')).toThrow(
      /Migrations directory not found/
    );
  });
});
