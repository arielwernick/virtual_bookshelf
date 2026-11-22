import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchEpisodes } from './spotify';

const EP1 = '1a2b3c4d5e6f7g8h9i0jkl';
const EP2 = '0z9y8x7w6v5u4t3s2r1qpo';

function spotifyEpisode(id: string, name: string, show?: string) {
  return {
    id,
    name,
    images: [{ url: `https://i.scdn.co/image/${id}` }],
    external_urls: { spotify: `https://open.spotify.com/episode/${id}` },
    ...(show && { show: { id: 'show', name: show } }),
  };
}

function json(body: unknown, ok = true) {
  return Promise.resolve({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) } as Response);
}

describe('searchEpisodes', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv('EXTERNAL_APIS', '');
    vi.stubEnv('SPOTIFY_CLIENT_ID', 'id');
    vi.stubEnv('SPOTIFY_CLIENT_SECRET', 'secret');
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  function route(searchItems: unknown[], fullEpisodes: unknown | null) {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('accounts.spotify.com')) return json({ access_token: 't', token_type: 'Bearer', expires_in: 3600 });
      if (url.includes('/v1/search')) return json({ episodes: { items: searchItems } });
      if (url.includes('/v1/episodes')) return fullEpisodes === null ? json({}, false) : json({ episodes: fullEpisodes });
      throw new Error(`unexpected ${url}`);
    });
  }

  it('returns episode links with the show name as creator', async () => {
    route(
      [spotifyEpisode(EP1, 'Costco'), null, spotifyEpisode(EP2, 'Amazon')],
      [spotifyEpisode(EP1, 'Costco', 'Acquired'), spotifyEpisode(EP2, 'Amazon', 'Acquired')]
    );

    const results = await searchEpisodes('Acquired Costco');

    expect(results).toEqual([
      {
        id: EP1,
        title: 'Costco',
        creator: 'Acquired',
        imageUrl: `https://i.scdn.co/image/${EP1}`,
        externalUrl: `https://open.spotify.com/episode/${EP1}`,
        type: 'podcast_episode',
      },
      expect.objectContaining({ id: EP2, creator: 'Acquired', externalUrl: `https://open.spotify.com/episode/${EP2}` }),
    ]);
    const searchUrl = fetchMock.mock.calls.map(([u]) => u as string).find((u) => u.includes('/v1/search'));
    expect(searchUrl).toContain('type=episode');
    expect(searchUrl).toContain('market=US');
  });

  it('still returns episodes when the show lookup fails', async () => {
    route([spotifyEpisode(EP1, 'Costco')], null);
    const results = await searchEpisodes('Costco');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ title: 'Costco', creator: '', type: 'podcast_episode' });
  });

  it('returns nothing without a second request when search finds nothing', async () => {
    route([], []);
    expect(await searchEpisodes('nothing here')).toEqual([]);
    expect(fetchMock.mock.calls.some(([u]) => (u as string).includes('/v1/episodes'))).toBe(false);
  });

  it('returns fixed episodes in mock mode without fetching', async () => {
    vi.stubEnv('EXTERNAL_APIS', 'mock');
    const results = await searchEpisodes('Acquired');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].externalUrl).toMatch(/open\.spotify\.com\/episode\//);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
