/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { createMockShelf } from '@/test/utils/mocks';

vi.mock('@/lib/db/queries', () => ({
  getShelfByShareToken: vi.fn(),
  recordShelfView: vi.fn(),
}));

vi.mock('@/lib/utils/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/utils/rateLimit', () => ({
  isRateLimitingEnabled: vi.fn(),
  getViewRateLimiter: vi.fn(() => ({})),
  getClientIP: vi.fn(() => '203.0.113.7'),
  checkRateLimit: vi.fn(),
}));

import { getShelfByShareToken, recordShelfView } from '@/lib/db/queries';
import { getSession } from '@/lib/utils/session';
import { isRateLimitingEnabled, checkRateLimit, getClientIP } from '@/lib/utils/rateLimit';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

function createViewRequest(
  body: object | string,
  { userAgent = BROWSER_UA }: { userAgent?: string | null } = {}
): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userAgent) headers['User-Agent'] = userAgent;
  return new Request('http://localhost:3000/api/views', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

async function postView(body: object | string, options?: { userAgent?: string | null }) {
  const res = await POST(createViewRequest(body, options));
  expect(res.status).toBe(204);
  expect(await res.text()).toBe('');
  return res;
}

describe('POST /api/views', () => {
  beforeEach(() => {
    vi.mocked(getShelfByShareToken).mockReset();
    vi.mocked(recordShelfView).mockReset().mockResolvedValue();
    vi.mocked(getSession).mockReset().mockResolvedValue(null);
    vi.mocked(isRateLimitingEnabled).mockReset().mockReturnValue(false);
    vi.mocked(checkRateLimit).mockReset().mockResolvedValue({ success: true });
  });

  describe('Counted views', () => {
    it('records an anonymous shelf page view without a shelf lookup', async () => {
      await postView({ shareToken: 'tok12345', surface: 'shelf', embedHost: 'ignored.com' });

      expect(recordShelfView).toHaveBeenCalledWith('tok12345', 'shelf', '');
      expect(getShelfByShareToken).not.toHaveBeenCalled();
    });

    it('records an embed view with the lowercased host of the embedding site', async () => {
      await postView({ shareToken: 'tok12345', surface: 'embed', embedHost: 'Blog.Example.com' });

      expect(recordShelfView).toHaveBeenCalledWith('tok12345', 'embed', 'blog.example.com');
    });

    it('drops an embed host that is not a plain host name', async () => {
      await postView({ shareToken: 'tok12345', surface: 'embed', embedHost: 'https://x.com/path?q=1' });

      expect(recordShelfView).toHaveBeenCalledWith('tok12345', 'embed', '');
    });

    it('records a logged-in view of someone else’s public shelf', async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'visitor', username: 'visitor' });
      vi.mocked(getShelfByShareToken).mockResolvedValue(
        createMockShelf({ user_id: 'owner', is_public: true })
      );

      await postView({ shareToken: 'tok12345', surface: 'shelf' });

      expect(recordShelfView).toHaveBeenCalledWith('tok12345', 'shelf', '');
    });

    it('counts views under the rate limit when Upstash is configured', async () => {
      vi.mocked(isRateLimitingEnabled).mockReturnValue(true);

      await postView({ shareToken: 'tok12345', surface: 'shelf' });

      expect(checkRateLimit).toHaveBeenCalledWith(expect.anything(), '203.0.113.7');
      expect(getClientIP).toHaveBeenCalled();
      expect(recordShelfView).toHaveBeenCalled();
    });
  });

  describe('Ignored views', () => {
    it('ignores a malformed body', async () => {
      await postView('not json');
      expect(recordShelfView).not.toHaveBeenCalled();
    });

    it('ignores an invalid share token', async () => {
      await postView({ shareToken: "tok'; DROP TABLE shelves;--", surface: 'shelf' });
      await postView({ surface: 'shelf' });
      expect(recordShelfView).not.toHaveBeenCalled();
    });

    it('ignores an unknown surface', async () => {
      await postView({ shareToken: 'tok12345', surface: 'dashboard' });
      expect(recordShelfView).not.toHaveBeenCalled();
    });

    it('ignores bot user-agents', async () => {
      await postView({ shareToken: 'tok12345', surface: 'shelf' }, { userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)' });
      await postView({ shareToken: 'tok12345', surface: 'shelf' }, { userAgent: 'Mozilla/5.0 HeadlessChrome/130.0' });
      await postView({ shareToken: 'tok12345', surface: 'shelf' }, { userAgent: 'facebookexternalhit/1.1' });
      expect(recordShelfView).not.toHaveBeenCalled();
    });

    it('ignores requests with no user-agent', async () => {
      await postView({ shareToken: 'tok12345', surface: 'shelf' }, { userAgent: null });
      expect(recordShelfView).not.toHaveBeenCalled();
    });

    it('stops counting once the IP rate limit is hit', async () => {
      vi.mocked(isRateLimitingEnabled).mockReturnValue(true);
      vi.mocked(checkRateLimit).mockResolvedValue({
        success: false,
        response: new Response(null, { status: 429 }) as never,
      });

      await postView({ shareToken: 'tok12345', surface: 'shelf' });

      expect(recordShelfView).not.toHaveBeenCalled();
    });

    it('ignores views by the shelf owner', async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'owner', username: 'owner' });
      vi.mocked(getShelfByShareToken).mockResolvedValue(
        createMockShelf({ user_id: 'owner', is_public: true })
      );

      await postView({ shareToken: 'tok12345', surface: 'shelf' });

      expect(recordShelfView).not.toHaveBeenCalled();
    });

    it('ignores private shelves for logged-in visitors', async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'visitor', username: 'visitor' });
      vi.mocked(getShelfByShareToken).mockResolvedValue(
        createMockShelf({ user_id: 'owner', is_public: false })
      );

      await postView({ shareToken: 'tok12345', surface: 'shelf' });

      expect(recordShelfView).not.toHaveBeenCalled();
    });

    it('ignores unknown shelves for logged-in visitors', async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'visitor', username: 'visitor' });
      vi.mocked(getShelfByShareToken).mockResolvedValue(null);

      await postView({ shareToken: 'tok12345', surface: 'shelf' });

      expect(recordShelfView).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('still returns 204 when the database write fails', async () => {
      vi.mocked(recordShelfView).mockRejectedValue(new Error('db down'));

      await postView({ shareToken: 'tok12345', surface: 'shelf' });
    });
  });
});
