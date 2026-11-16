import { describe, it, expect, vi } from 'vitest';

vi.mock('./lib/loadEnv', () => ({}));
vi.mock('@/lib/db/client', () => ({ sql: vi.fn(), resolveDatabaseUrl: vi.fn() }));

import { planBackfill } from './backfill-item-identity';

const row = (overrides: Record<string, unknown>) => ({
  id: 'i1',
  type: 'video' as const,
  external_url: 'https://youtu.be/dQw4w9WgXcQ',
  creator: 'Channel',
  source: null,
  source_id: null,
  ...overrides,
});

describe('planBackfill', () => {
  it('plans a change for an item whose URL carries an identifier', () => {
    const plan = planBackfill([row({})]);

    expect(plan.changes).toEqual([{ id: 'i1', source: 'youtube', sourceId: 'dQw4w9WgXcQ' }]);
    expect(plan.bySource).toEqual({ youtube: 1 });
  });

  it('skips items that are already correct, so a second run changes nothing', () => {
    const plan = planBackfill([row({ source: 'youtube', source_id: 'dQw4w9WgXcQ' })]);
    expect(plan.changes).toEqual([]);
  });

  it('counts items with no identifier and leaves them alone', () => {
    const plan = planBackfill([row({ type: 'link', external_url: 'https://example.com/post' })]);

    expect(plan.changes).toEqual([]);
    expect(plan.unidentified).toBe(1);
  });
});
