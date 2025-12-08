import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import type { EpisodesResponse } from '@/lib/api/spotify';

// Mock the Spotify API module
vi.mock('@/lib/api/spotify', () => ({
  getShowEpisodes: vi.fn(),
}));

import { getShowEpisodes } from '@/lib/api/spotify';
const mockGetShowEpisodes = vi.mocked(getShowEpisodes);

describe('/api/search/episodes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (params: Record<string, string>) => {
    const url = new URL('http://localhost:3000/api/search/episodes');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return new Request(url.toString());
  };

  it('should return episodes for valid showId', async () => {
    const mockResponse: EpisodesResponse = {
      episodes: [
        {
          id: 'episode-1',
          title: 'Test Episode',
          description: 'A test episode',
          duration_ms: 3600000,
          release_date: '2024-12-01',
          imageUrl: 'https://example.com/image.jpg',
          externalUrl: 'https://open.spotify.com/episode/episode-1',
          showName: 'Test Podcast',
        },
      ],
      total: 1,
      showName: 'Test Podcast',
    };

    mockGetShowEpisodes.mockResolvedValueOnce(mockResponse);

    const request = createRequest({ showId: 'test-show-id' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      data: mockResponse,
    });
    expect(mockGetShowEpisodes).toHaveBeenCalledWith('test-show-id', { offset: 0, limit: 20 });
  });

  it('should handle custom pagination parameters', async () => {
    const mockResponse: EpisodesResponse = {
      episodes: [],
      total: 50,
      showName: 'Test Podcast',
    };

    mockGetShowEpisodes.mockResolvedValueOnce(mockResponse);

    const request = createRequest({ 
      showId: 'test-show-id', 
      offset: '10', 
      limit: '5' 
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetShowEpisodes).toHaveBeenCalledWith('test-show-id', { offset: 10, limit: 5 });
  });

  it('should return 400 when showId is missing', async () => {
    const request = createRequest({});
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      error: 'Query parameter "showId" is required',
    });
  });

  it('should return 400 for invalid offset parameter', async () => {
    const request = createRequest({ 
      showId: 'test-show-id', 
      offset: '-1' 
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      error: 'Parameter "offset" must be a non-negative integer',
    });
  });

  it('should return 400 for invalid limit parameter', async () => {
    const request = createRequest({ 
      showId: 'test-show-id', 
      limit: '100' 
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      error: 'Parameter "limit" must be an integer between 1 and 50',
    });
  });

  it('should return 404 when show is not found', async () => {
    mockGetShowEpisodes.mockRejectedValueOnce(
      new Error('Failed to fetch show information: Not Found')
    );

    const request = createRequest({ showId: 'invalid-show-id' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      success: false,
      error: 'Podcast show not found',
    });
  });

  it('should return 404 when episodes are not available', async () => {
    mockGetShowEpisodes.mockRejectedValueOnce(
      new Error('Failed to fetch episodes: Unavailable')
    );

    const request = createRequest({ showId: 'restricted-show-id' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      success: false,
      error: 'Episodes not available for this show',
    });
  });

  it('should return 503 when Spotify credentials are invalid', async () => {
    mockGetShowEpisodes.mockRejectedValueOnce(
      new Error('Spotify credentials not configured')
    );

    const request = createRequest({ showId: 'test-show-id' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data).toEqual({
      success: false,
      error: 'Spotify service unavailable',
    });
  });

  it('should return 500 for unexpected errors', async () => {
    mockGetShowEpisodes.mockRejectedValueOnce(
      new Error('Unexpected error')
    );

    const request = createRequest({ showId: 'test-show-id' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      success: false,
      error: 'Failed to fetch podcast episodes',
    });
  });

  it('should use default pagination when parameters are not provided', async () => {
    const mockResponse: EpisodesResponse = {
      episodes: [],
      total: 0,
      showName: 'Empty Podcast',
    };

    mockGetShowEpisodes.mockResolvedValueOnce(mockResponse);

    const request = createRequest({ showId: 'empty-show-id' });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockGetShowEpisodes).toHaveBeenCalledWith('empty-show-id', { offset: 0, limit: 20 });
  });
});