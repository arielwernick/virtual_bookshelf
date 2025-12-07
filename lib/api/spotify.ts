// Spotify API integration for music and podcast search

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifySearchResult {
  id: string;
  name: string;
  artists?: { name: string }[];
  album?: { images: { url: string }[] };
  images?: { url: string }[];
  publisher?: string;
  external_urls: { spotify: string };
  type: string;
}

interface SpotifyEpisode {
  id: string;
  name: string;
  description: string;
  duration_ms: number;
  release_date: string;
  release_date_precision: string;
  images: { url: string; height: number | null; width: number | null }[];
  external_urls: { spotify: string };
  type: 'episode';
  uri: string;
  is_externally_hosted: boolean;
  is_playable: boolean;
}

export interface SpotifyItem {
  id: string;
  title: string;
  creator: string;
  imageUrl: string;
  externalUrl: string;
  type: 'music' | 'podcast';
}

export interface Episode {
  id: string;
  title: string;
  description: string;
  duration_ms: number;
  release_date: string;
  imageUrl: string;
  externalUrl: string;
  showName: string;
}

export interface EpisodesResponse {
  episodes: Episode[];
  total: number;
  showName: string;
}

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Helper for Basic Auth that works in both Node and Edge runtimes
 */
function basicAuth(clientId: string, clientSecret: string): string {
  const credentials = `${clientId}:${clientSecret}`;
  // Use btoa if available (Edge), otherwise Buffer (Node)
  if (typeof btoa === 'function') {
    return btoa(credentials);
  }
  return Buffer.from(credentials).toString('base64');
}

/**
 * Get Spotify access token using client credentials flow
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + basicAuth(clientId, clientSecret),
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Spotify token error:', errorData);
    throw new Error(`Failed to get Spotify access token: ${errorData.error_description || errorData.error || response.statusText}`);
  }

  const data: SpotifyTokenResponse = await response.json();
  
  // Cache token with 1-minute buffer before expiry
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

  return data.access_token;
}

/**
 * Search for albums on Spotify
 */
export async function searchAlbums(query: string): Promise<SpotifyItem[]> {
  const token = await getAccessToken();

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=10`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to search Spotify albums');
  }

  const data = await response.json();
  const albums = data.albums?.items || [];

  return albums.map((album: SpotifySearchResult) => ({
    id: album.id,
    title: album.name,
    creator: album.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
    imageUrl: album.images?.[0]?.url || '',
    externalUrl: album.external_urls.spotify,
    type: 'music' as const,
  }));
}

/**
 * Search for podcasts (shows) on Spotify
 */
export async function searchPodcasts(query: string): Promise<SpotifyItem[]> {
  const token = await getAccessToken();

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=show&limit=10`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to search Spotify podcasts');
  }

  const data = await response.json();
  const shows = data.shows?.items || [];

  return shows.map((show: SpotifySearchResult) => ({
    id: show.id,
    title: show.name,
    creator: show.publisher || 'Unknown Publisher',
    imageUrl: show.images?.[0]?.url || '',
    externalUrl: show.external_urls.spotify,
    type: 'podcast' as const,
  }));
}

/**
 * Get episodes for a specific podcast show
 */
export async function getShowEpisodes(
  showId: string,
  options: { offset?: number; limit?: number } = {}
): Promise<EpisodesResponse> {
  const { offset = 0, limit = 20 } = options;
  const token = await getAccessToken();

  // First get the show info to get the show name
  const showResponse = await fetch(
    `https://api.spotify.com/v1/shows/${showId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!showResponse.ok) {
    const errorData = await showResponse.json().catch(() => ({}));
    console.error('Failed to fetch show info:', errorData);
    throw new Error(`Failed to fetch show information: ${showResponse.statusText}`);
  }

  const showData = await showResponse.json();
  const showName = showData.name || 'Unknown Show';

  // Then get the episodes
  const episodesResponse = await fetch(
    `https://api.spotify.com/v1/shows/${showId}/episodes?offset=${offset}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!episodesResponse.ok) {
    const errorData = await episodesResponse.json().catch(() => ({}));
    console.error('Failed to fetch episodes:', errorData);
    throw new Error(`Failed to fetch episodes: ${episodesResponse.statusText}`);
  }

  const data = await episodesResponse.json();
  const episodes = data.items || [];
  const total = data.total || 0;

  const formattedEpisodes: Episode[] = episodes.map((episode: SpotifyEpisode) => ({
    id: episode.id,
    title: episode.name,
    description: episode.description,
    duration_ms: episode.duration_ms,
    release_date: episode.release_date,
    imageUrl: episode.images?.[0]?.url || '',
    externalUrl: episode.external_urls.spotify,
    showName,
  }));

  return {
    episodes: formattedEpisodes,
    total,
    showName,
  };
}

/**
 * Search for both albums and podcasts
 */
export async function searchMusic(query: string, type: 'music' | 'podcast' = 'music'): Promise<SpotifyItem[]> {
  if (type === 'podcast') {
    return searchPodcasts(query);
  }
  return searchAlbums(query);
}
