import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/utils/session', () => ({ getSession: vi.fn() }));
vi.mock('@/lib/db/queries', () => ({
  getShelvesForDashboard: vi.fn(),
  getShelfViewsForOwner: vi.fn(),
  touchUserLastSeen: vi.fn(),
}));

import { getSession } from '@/lib/utils/session';
import { getShelvesForDashboard, getShelfViewsForOwner, touchUserLastSeen } from '@/lib/db/queries';
import { GET } from './route';
import type { DashboardShelf } from '@/lib/types/shelf';

function createMockDashboardShelf(overrides: Partial<DashboardShelf> = {}): DashboardShelf {
  return {
    id: 'shelf-1',
    user_id: 'user-1',
    name: 'Favorite Books',
    description: null,
    share_token: 'Xk9mP2vL',
    is_public: true,
    item_count: 2,
    preview_items: [],
    created_at: new Date('2026-09-01T00:00:00Z'),
    updated_at: new Date('2026-11-01T00:00:00Z'),
    ...overrides,
  };
}

const request = new Request('https://virtualbookshelf.app/api/shelf/dashboard');
const views = { views_7d: 14, views_total: 40, top_embed_host: 'yoursite.com', top_embed_host_views: 9 };

describe('GET /api/shelf/dashboard', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset().mockResolvedValue({ userId: 'user-1', username: 'u', email: 'e' } as never);
    vi.mocked(getShelvesForDashboard).mockReset().mockResolvedValue([createMockDashboardShelf()]);
    vi.mocked(getShelfViewsForOwner).mockReset().mockResolvedValue(new Map([['shelf-1', views]]));
    vi.mocked(touchUserLastSeen).mockReset().mockResolvedValue();
  });

  it('answers 401 when signed out', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    expect((await GET(request)).status).toBe(401);
  });

  it('attaches view counts to each shelf, for the signed-in owner only', async () => {
    const body = await (await GET(request)).json();

    expect(getShelfViewsForOwner).toHaveBeenCalledWith('user-1');
    expect(body.data.shelves[0].views).toEqual(views);
  });

  it('leaves views out for a shelf that has none', async () => {
    vi.mocked(getShelfViewsForOwner).mockResolvedValue(new Map());
    const body = await (await GET(request)).json();

    expect(body.data.shelves[0].views).toBeUndefined();
  });

  it('still loads the dashboard when view counts fail', async () => {
    vi.mocked(getShelfViewsForOwner).mockRejectedValue(new Error('db down'));
    const res = await GET(request);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.shelves).toHaveLength(1);
  });
});
