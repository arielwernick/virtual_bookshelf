import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isMockMode } from './mockMode';
import { searchBooks } from './googleBooks';
import { searchAlbums, searchPodcasts, getShowEpisodes, searchEpisodesInShow, searchMusic } from './spotify';
import { getVideoDetails } from './youtube';
import { fetchLinkMetadata } from './microlink';
import { deriveItemIdentity } from '@/lib/utils/itemIdentity';

describe('isMockMode', () => {
  const env = (values: Record<string, string>) => values as unknown as NodeJS.ProcessEnv;

  it('is on only when EXTERNAL_APIS is exactly "mock"', () => {
    expect(isMockMode(env({ EXTERNAL_APIS: 'mock' }))).toBe(true);
    expect(isMockMode(env({ EXTERNAL_APIS: 'true' }))).toBe(false);
    expect(isMockMode(env({}))).toBe(false);
  });

  it('can never turn on in production', () => {
    expect(isMockMode(env({ EXTERNAL_APIS: 'mock', VERCEL_ENV: 'production' }))).toBe(false);
    expect(isMockMode(env({ EXTERNAL_APIS: 'mock', VERCEL_ENV: 'preview' }))).toBe(true);
  });
});

describe('outside-API clients in mock mode', () => {
  const originalFetch = global.fetch;
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv('EXTERNAL_APIS', 'mock');
    fetchMock.mockReset().mockRejectedValue(new Error('network must not be used in mock mode'));
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    global.fetch = originalFetch;
  });

  it('returns fixed books without a request', async () => {
    const books = await searchBooks('anything');

    expect(books.length).toBeGreaterThan(0);
    expect(books[0]).toMatchObject({ type: 'book', title: expect.any(String) });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns fixed albums and podcasts without a request', async () => {
    expect((await searchAlbums('x'))[0].type).toBe('music');
    expect((await searchPodcasts('x'))[0].type).toBe('podcast');
    expect((await searchMusic('x', 'podcast'))[0].type).toBe('podcast');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns fixed episodes, honouring offset and limit', async () => {
    const all = await getShowEpisodes('show');
    const second = await getShowEpisodes('show', { offset: 1, limit: 1 });
    const searched = await searchEpisodesInShow('show', 'x');

    expect(all.total).toBe(all.episodes.length);
    expect(second.episodes).toEqual([all.episodes[1]]);
    expect(searched.episodes.length).toBe(all.total);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns a video for the id asked for', async () => {
    const video = await getVideoDetails('dQw4w9WgXcQ');

    expect(video.id).toBe('dQw4w9WgXcQ');
    expect(video.videoUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('builds link metadata from the URL, and still rejects bad URLs', async () => {
    const meta = await fetchLinkMetadata('https://www.example.com/post');

    expect(meta).toMatchObject({ url: 'https://www.example.com/post', publisher: 'example.com' });
    await expect(fetchLinkMetadata('javascript:alert(1)')).rejects.toThrow();
    await expect(fetchLinkMetadata('not a url')).rejects.toThrow('Invalid URL format');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns nothing for a query containing "nothing", so empty states can be tested', async () => {
    expect(await searchBooks('nothing here')).toEqual([]);
    expect(await searchAlbums('NOTHING')).toEqual([]);
  });

  it('uses fixtures whose links carry real identifiers', async () => {
    const [book] = await searchBooks('x');
    const [album] = await searchAlbums('x');

    expect(deriveItemIdentity('book', book.externalUrl)?.source).toBe('google_books');
    expect(deriveItemIdentity('music', album.externalUrl)?.source).toBe('spotify');
  });
});

describe('outside-API clients with mock mode off', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    vi.unstubAllEnvs();
    global.fetch = originalFetch;
  });

  it('still call the network', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });
    global.fetch = fetchMock as unknown as typeof fetch;

    await searchBooks('dune');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('stay off in production even when the variable is set', async () => {
    vi.stubEnv('EXTERNAL_APIS', 'mock');
    vi.stubEnv('VERCEL_ENV', 'production');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });
    global.fetch = fetchMock as unknown as typeof fetch;

    await searchBooks('dune');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
