import { request } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

/**
 * Vercel preview protection bypass (issue #273).
 *
 * Previews sit behind Vercel's login wall. When VERCEL_AUTOMATION_BYPASS_SECRET
 * is set and the tests target a deployed URL, ask Vercel once for its bypass
 * cookie and save it as storage state. The cookie is scoped to the preview's
 * own domain, so the secret is never sent to third-party hosts (image CDNs,
 * analytics), as it would be with a global extra header.
 */
export const BYPASS_STATE = path.join(__dirname, '.auth', 'vercel-bypass.json');

export default async function globalSetup(): Promise<void> {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const baseURL = process.env.PLAYWRIGHT_BASE_URL;
  if (!secret || !baseURL) return;

  const context = await request.newContext({ baseURL });
  const url = `/?x-vercel-protection-bypass=${encodeURIComponent(secret)}&x-vercel-set-bypass-cookie=true`;
  const res = await context.get(url, { maxRedirects: 0 });
  if (res.status() >= 400) {
    throw new Error(`Vercel protection bypass failed: HTTP ${res.status()} from ${baseURL}`);
  }
  await mkdir(path.dirname(BYPASS_STATE), { recursive: true });
  await context.storageState({ path: BYPASS_STATE });
  await context.dispose();
}
