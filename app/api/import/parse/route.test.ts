import { describe, it, expect } from 'vitest';
import { POST } from './route';

function parseRequest(body: unknown, raw = false) {
  return new Request('https://virtualbookshelf.app/api/import/parse', {
    method: 'POST',
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

describe('POST /api/import/parse', () => {
  it('finds the links in pasted text, in order', async () => {
    const res = await POST(
      parseRequest({ text: 'Read https://example.com/one first.\nThen https://example.org/two' })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.count).toBe(2);
    expect(body.data.items.map((item: { url: string }) => item.url)).toEqual([
      'https://example.com/one',
      'https://example.org/two',
    ]);
  });

  it('returns an empty list for text with no links', async () => {
    const body = await (await POST(parseRequest({ text: 'no links here' }))).json();

    expect(body.success).toBe(true);
    expect(body.data.count).toBe(0);
  });

  it.each([
    ['missing text', {}],
    ['empty text', { text: '' }],
    ['text that is not a string', { text: ['https://example.com'] }],
  ])('answers 400 for %s', async (_name, payload) => {
    expect((await POST(parseRequest(payload))).status).toBe(400);
  });

  it('answers 400 for text over the size limit', async () => {
    const res = await POST(parseRequest({ text: 'a'.repeat(100001) }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/maximum length/);
  });

  it('caps the number of items and says so', async () => {
    const text = Array.from({ length: 60 }, (_, i) => `https://example.com/${i}`).join('\n');
    const body = await (await POST(parseRequest({ text }))).json();

    expect(body.data.count).toBe(50);
    expect(body.data.warning).toBeTruthy();
  });

  it('answers 500, not a crash, for a body that is not JSON', async () => {
    const res = await POST(parseRequest('not json', true));

    expect(res.status).toBe(500);
    expect((await res.json()).success).toBe(false);
  });
});
