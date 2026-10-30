import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAdminUser } from '@/lib/utils/admin';
import {
  getAdminOverview,
  getAdminWeeklySignups,
  getAdminAttribution,
  getAdminRecentUsers,
  ACTIVATION_ITEM_THRESHOLD,
} from '@/lib/db/queries';
import { classifyAttribution } from '@/lib/utils/attribution';
import type { AdminAttributionRow } from '@/lib/types/shelf';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

const ATTRIBUTION_DAYS = 90;

function summarizeChannels(rows: AdminAttributionRow[]): { channel: string; count: number }[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const channel = classifyAttribution(row.first_referrer, row.utm_source, row.tracked);
    totals.set(channel, (totals.get(channel) || 0) + row.count);
  }
  return [...totals.entries()]
    .map(([channel, count]) => ({ channel, count }))
    .sort((a, b) => b.count - a.count);
}

function formatDate(value: Date | string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function percent(part: number, whole: number): string {
  if (!whole) return '0%';
  return `${Math.round((part / whole) * 100)}%`;
}

function StatTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</div>}
    </div>
  );
}

export default async function AdminPage() {
  const admin = await getAdminUser();
  if (!admin) notFound();

  const [overview, weekly, attribution, recentUsers] = await Promise.all([
    getAdminOverview(),
    getAdminWeeklySignups(12),
    getAdminAttribution(ATTRIBUTION_DAYS),
    getAdminRecentUsers(50),
  ]);

  const channels = summarizeChannels(attribution);
  const channelTotal = channels.reduce((sum, c) => sum + c.count, 0);
  const maxWeekly = Math.max(1, ...weekly.map((w) => w.email + w.google));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-10">
      <header>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Signups, acquisition, and activation.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatTile label="Total users" value={overview.total_users} />
        <StatTile label="New (7d)" value={overview.new_users_7d} />
        <StatTile label="New (30d)" value={overview.new_users_30d} />
        <StatTile label="Active (7d)" value={overview.active_users_7d} />
        <StatTile label="Active (30d)" value={overview.active_users_30d} />
        <StatTile
          label="Activated"
          value={percent(overview.activated_users, overview.total_users)}
          hint={`${overview.activated_users} with a ${ACTIVATION_ITEM_THRESHOLD}+ item shelf`}
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold mb-3">Signups per week</h2>
          {weekly.length === 0 ? (
            <p className="text-sm text-gray-500">No signups in the last 12 weeks.</p>
          ) : (
            <div className="space-y-1.5">
              {weekly.map((w) => {
                const total = w.email + w.google;
                return (
                  <div key={String(w.week)} className="flex items-center gap-3 text-sm">
                    <div className="w-20 shrink-0 text-gray-500 dark:text-gray-400">
                      {new Date(w.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-1 flex h-4 rounded overflow-hidden bg-gray-100 dark:bg-gray-900">
                      <div
                        className="bg-blue-500"
                        style={{ width: `${(w.google / maxWeekly) * 100}%` }}
                        title={`Google: ${w.google}`}
                      />
                      <div
                        className="bg-emerald-500"
                        style={{ width: `${(w.email / maxWeekly) * 100}%` }}
                        title={`Email: ${w.email}`}
                      />
                    </div>
                    <div className="w-8 text-right tabular-nums">{total}</div>
                  </div>
                );
              })}
              <div className="flex gap-4 pt-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" /> Google
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Email
                </span>
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Where signups came from ({ATTRIBUTION_DAYS}d)</h2>
          {channels.length === 0 ? (
            <p className="text-sm text-gray-500">No signups yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {channels.map((c) => (
                  <tr key={c.channel} className="border-b border-gray-100 dark:border-gray-900">
                    <td className="py-1.5">{c.channel}</td>
                    <td className="py-1.5 text-right tabular-nums">{c.count}</td>
                    <td className="py-1.5 w-14 text-right tabular-nums text-gray-500 dark:text-gray-400">
                      {percent(c.count, channelTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Recent users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 dark:text-gray-400">
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="py-2 pr-4 font-medium">User</th>
                <th className="py-2 pr-4 font-medium">Joined</th>
                <th className="py-2 pr-4 font-medium">Via</th>
                <th className="py-2 pr-4 font-medium">Source</th>
                <th className="py-2 pr-4 font-medium text-right">Shelves</th>
                <th className="py-2 pr-4 font-medium text-right">Items</th>
                <th className="py-2 pr-4 font-medium">Last seen</th>
                <th className="py-2 font-medium">Shelf</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 dark:border-gray-900 align-top">
                  <td className="py-2 pr-4">
                    <div className="font-medium">
                      {u.username || '—'}
                      {u.activated && (
                        <span className="ml-2 rounded bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                          activated
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap">{formatDate(u.created_at)}</td>
                  <td className="py-2 pr-4 capitalize">{u.signup_method}</td>
                  <td className="py-2 pr-4">
                    {classifyAttribution(u.first_referrer, u.utm_source, u.tracked)}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">{u.shelf_count}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{u.item_count}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{formatDate(u.last_seen_at)}</td>
                  <td className="py-2">
                    {u.public_share_token ? (
                      <a
                        href={`/s/${u.public_share_token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
