import { expect, type APIRequestContext } from '@playwright/test';
import path from 'node:path';

/**
 * Authentication + seeding helpers for the authenticated Playwright projects.
 *
 * The flow is API-driven (no clicking through forms): sign the test user up,
 * fall back to logging in if they already exist, then ensure they own one
 * seeded shelf with a few items so the authenticated UI isn't empty.
 *
 * Credentials are overridable via env so the same suite can target a shared
 * staging account instead of creating one locally.
 */

export const TEST_USER = {
  username: process.env.E2E_USERNAME ?? 'e2e-agent',
  email: process.env.E2E_EMAIL ?? 'e2e-agent@example.test',
  password: process.env.E2E_PASSWORD ?? 'e2e-agent-pw',
};

/** Persisted browser auth state, consumed by the `authenticated` project. */
export const STORAGE_STATE = path.join(__dirname, '..', '.auth', 'user.json');
/** Seed metadata (e.g. the seeded shelf id) shared with the auth specs. */
export const SEED_STATE = path.join(__dirname, '..', '.auth', 'seed.json');

const SEEDED_SHELF_NAME = 'Agent Demo Shelf';

const SEED_ITEMS = [
  { type: 'book', title: 'The Pragmatic Programmer', creator: 'Hunt & Thomas', rating: 5 },
  { type: 'podcast', title: 'Lenny\'s Podcast', creator: 'Lenny Rachitsky' },
  { type: 'video', title: 'Inside the Spec', creator: 'Playwright', external_url: 'https://playwright.dev' },
] as const;

export type SeedState = { shelfId: string; shareToken: string | null };

/**
 * Ensure the test user exists and is authenticated on `request`.
 * Idempotent: signup first, fall back to login if the account already exists.
 */
export async function authenticate(request: APIRequestContext): Promise<void> {
  const signup = await request.post('/api/auth/signup', { data: TEST_USER });

  if (signup.ok()) return;

  // 409 = already registered; anything else is unexpected.
  expect(
    signup.status(),
    `Unexpected signup failure: ${signup.status()} ${await signup.text()}`,
  ).toBe(409);

  const login = await request.post('/api/auth/login', {
    data: { username: TEST_USER.username, password: TEST_USER.password },
  });
  expect(login.ok(), `Login failed: ${login.status()} ${await login.text()}`).toBeTruthy();
}

/**
 * Ensure the authenticated user owns a seeded shelf with items.
 * Reuses an existing seeded shelf if present so reruns don't pile up data.
 */
export async function ensureSeededShelf(request: APIRequestContext): Promise<SeedState> {
  const dashboardRes = await request.get('/api/shelf/dashboard');
  expect(dashboardRes.ok(), 'Could not load dashboard for seeding').toBeTruthy();
  const dashboard = await dashboardRes.json();

  const existing = (dashboard.data?.shelves ?? []).find(
    (s: { name: string }) => s.name === SEEDED_SHELF_NAME,
  );
  if (existing) {
    return { shelfId: existing.id, shareToken: existing.share_token ?? null };
  }

  const createRes = await request.post('/api/shelf/create', {
    data: { name: SEEDED_SHELF_NAME, description: 'Seeded for agent UI exploration.' },
  });
  expect(createRes.ok(), `Shelf create failed: ${await createRes.text()}`).toBeTruthy();
  const shelf = (await createRes.json()).data;

  for (const item of SEED_ITEMS) {
    const res = await request.post('/api/items', { data: { shelf_id: shelf.id, ...item } });
    expect(res.ok(), `Item create failed: ${await res.text()}`).toBeTruthy();
  }

  return { shelfId: shelf.id, shareToken: shelf.share_token ?? null };
}
