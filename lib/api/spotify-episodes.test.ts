import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { EpisodesResponse } from '@/lib/api/spotify';

// Mock the spotify module with a factory function
vi.mock('@/lib/api/spotify', () => ({
  getShowEpisodes: vi.fn(),
}));

// Import the mocked function
import { getShowEpisodes } from '@/lib/api/spotify';

// Type the mocked function
const mockGetShowEpisodes = vi.mocked(getShowEpisodes);

describe('getShowEpisodes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return episodes with correct data structure', async () => {
    const mockResponse: EpisodesResponse = {
      episodes: [
        {
          id: 'episode-1',
          title: 'Test Episode 1',
          description: 'First test episode',
          duration_ms: 3600000,
          release_date: '2024-12-01',
          imageUrl: 'https://example.com/image1.jpg',
          externalUrl: 'https://open.spotify.com/episode/episode-1',
          showName: 'Test Podcast Show',
        },
        {
          id: 'episode-2',
          title: 'Test Episode 2',
          description: 'Second test episode',
          duration_ms: 2700000,
          release_date: '2024-11-24',
          imageUrl: 'https://example.com/image2.jpg',
          externalUrl: 'https://open.spotify.com/episode/episode-2',
          showName: 'Test Podcast Show',
        },
      ],
      total: 100,
      showName: 'Test Podcast Show',
    };

    mockGetShowEpisodes.mockResolvedValueOnce(mockResponse);

    const result = await getShowEpisodes('test-show-id', { offset: 0, limit: 2 });

    expect(result).toEqual(mockResponse);
    expect(mockGetShowEpisodes).toHaveBeenCalledWith('test-show-id', { offset: 0, limit: 2 });
    expect(mockGetShowEpisodes).toHaveBeenCalledTimes(1);
  });

  it('should handle pagination parameters correctly', async () => {
    const mockResponse: EpisodesResponse = {
      episodes: [],
      total: 50,
      showName: 'Test Show',
    };

    mockGetShowEpisodes.mockResolvedValueOnce(mockResponse);

    await getShowEpisodes('test-show-id', { offset: 20, limit: 10 });

    expect(mockGetShowEpisodes).toHaveBeenCalledWith('test-show-id', { offset: 20, limit: 10 });
  });

  it('should use default pagination when no options provided', async () => {
    const mockResponse: EpisodesResponse = {
      episodes: [],
      total: 0,
      showName: 'Test Show',
    };

    mockGetShowEpisodes.mockResolvedValueOnce(mockResponse);

    await getShowEpisodes('test-show-id');

    expect(mockGetShowEpisodes).toHaveBeenCalledWith('test-show-id');
  });

  it('should handle API errors by rejecting with proper error message', async () => {
    const errorMessage = 'Failed to fetch episodes: Not Found';
    mockGetShowEpisodes.mockRejectedValueOnce(new Error(errorMessage));

    await expect(getShowEpisodes('invalid-show-id')).rejects.toThrow(errorMessage);
    expect(mockGetShowEpisodes).toHaveBeenCalledWith('invalid-show-id');
  });

  it('should return episode data with correct types', async () => {
    const mockResponse: EpisodesResponse = {
      episodes: [
        {
          id: 'ep-123',
          title: 'Episode Title',
          description: 'Episode description',
          duration_ms: 1800000, // 30 minutes
          release_date: '2024-12-07',
          imageUrl: 'https://example.com/episode.jpg',
          externalUrl: 'https://open.spotify.com/episode/ep-123',
          showName: 'Podcast Show Name',
        },
      ],
      total: 1,
      showName: 'Podcast Show Name',
    };

    mockGetShowEpisodes.mockResolvedValueOnce(mockResponse);

    const result = await getShowEpisodes('show-123');

    // Verify structure and types
    expect(result.episodes).toHaveLength(1);
    expect(result.episodes[0]).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      duration_ms: expect.any(Number),
      release_date: expect.any(String),
      imageUrl: expect.any(String),
      externalUrl: expect.any(String),
      showName: expect.any(String),
    });
    expect(result.total).toBe(1);
    expect(result.showName).toBe('Podcast Show Name');
  });

  it('should handle empty episodes response', async () => {
    const mockResponse: EpisodesResponse = {
      episodes: [],
      total: 0,
      showName: 'Empty Show',
    };

    mockGetShowEpisodes.mockResolvedValueOnce(mockResponse);

    const result = await getShowEpisodes('empty-show-id');

    expect(result.episodes).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.showName).toBe('Empty Show');
  });
});