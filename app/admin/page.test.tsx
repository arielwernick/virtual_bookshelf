import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@/lib/utils/admin', () => ({
  getAdminUser: vi.fn(),
}));

vi.mock('@/lib/db/queries', () => ({
  ACTIVATION_ITEM_THRESHOLD: 3,
  getAdminOverview: vi.fn(),
  getAdminWeeklySignups: vi.fn(),
  getAdminAttribution: vi.fn(),
  getAdminRecentUsers: vi.fn(),
}));

import AdminPage from './page';
import { getAdminUser } from '@/lib/utils/admin';
import {
  getAdminOverview,
  getAdminWeeklySignups,
  getAdminAttribution,
  getAdminRecentUsers,
} from '@/lib/db/queries';
import { createMockUser } from '@/test/utils/mocks';
import type { AdminRecentUser } from '@/lib/types/shelf';

function createMockRecentUser(overrides: Partial<AdminRecentUser> = {}): AdminRecentUser {
  return {
    id: 'user-1',
    username: 'reader',
    email: 'reader@example.com',
    signup_method: 'google',
    tracked: true,
    first_referrer: 'https://www.google.com',
    utm_source: null,
    created_at: new Date('2026-10-20'),
    last_seen_at: new Date('2026-10-28'),
    shelf_count: 2,
    item_count: 7,
    activated: true,
    public_share_token: 'share-abc',
    ...overrides,
  };
}

async function renderPage() {
  render(await AdminPage());
}

describe('AdminPage', () => {
  beforeEach(() => {
    vi.mocked(getAdminUser).mockResolvedValue(createMockUser({ email: 'owner@example.com' }));
    vi.mocked(getAdminOverview).mockResolvedValue({
      total_users: 40,
      new_users_7d: 6,
      new_users_30d: 18,
      active_users_7d: 9,
      active_users_30d: 21,
      activated_users: 10,
    });
    vi.mocked(getAdminWeeklySignups).mockResolvedValue([
      { week: new Date('2026-10-19'), email: 1, google: 4 },
      { week: new Date('2026-10-26'), email: 2, google: 3 },
    ]);
    vi.mocked(getAdminAttribution).mockResolvedValue([
      { tracked: true, first_referrer: 'https://www.google.com', utm_source: null, count: 5 },
      { tracked: true, first_referrer: 'https://www.google.co.uk', utm_source: null, count: 2 },
      { tracked: true, first_referrer: null, utm_source: null, count: 3 },
      { tracked: false, first_referrer: null, utm_source: null, count: 30 },
    ]);
    vi.mocked(getAdminRecentUsers).mockResolvedValue([
      createMockRecentUser(),
      createMockRecentUser({
        id: 'user-2',
        username: 'oldtimer',
        email: 'old@example.com',
        signup_method: 'email',
        tracked: false,
        first_referrer: null,
        activated: false,
        public_share_token: null,
      }),
    ]);
  });

  describe('Access', () => {
    it('returns 404 for non-admins without querying stats', async () => {
      vi.mocked(getAdminUser).mockResolvedValue(null);

      await expect(AdminPage()).rejects.toThrow('NEXT_NOT_FOUND');
      expect(getAdminOverview).not.toHaveBeenCalled();
    });
  });

  describe('Rendering', () => {
    it('shows headline stats with activation rate', async () => {
      await renderPage();

      expect(screen.getByText('Total users').nextSibling).toHaveTextContent('40');
      expect(screen.getByText('25%')).toBeInTheDocument();
      expect(screen.getByText('10 with a 3+ item shelf')).toBeInTheDocument();
    });

    it('groups attribution rows into channels', async () => {
      await renderPage();

      // google.com + google.co.uk collapse into one channel: 7 of 40 signups
      expect(screen.getByRole('row', { name: 'Google 7 18%' })).toBeInTheDocument();
      expect(screen.getAllByText('Before tracking').length).toBeGreaterThan(0);
      expect(screen.getByText('Direct')).toBeInTheDocument();
    });

    it('lists recent users with source, activation, and shelf link', async () => {
      await renderPage();

      expect(screen.getByText('reader@example.com')).toBeInTheDocument();
      expect(screen.getByText('activated')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute('href', '/s/share-abc');
    });
  });

  describe('Edge Cases', () => {
    it('renders empty states with no signups', async () => {
      vi.mocked(getAdminWeeklySignups).mockResolvedValue([]);
      vi.mocked(getAdminAttribution).mockResolvedValue([]);
      vi.mocked(getAdminRecentUsers).mockResolvedValue([]);

      await renderPage();

      expect(screen.getByText('No signups in the last 12 weeks.')).toBeInTheDocument();
      expect(screen.getByText('No signups yet.')).toBeInTheDocument();
    });
  });
});
