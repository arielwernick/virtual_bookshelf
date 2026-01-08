import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEpisodes } from './useEpisodes';

describe('useEpisodes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useEpisodes());

    expect(result.current.browsingEpisodes).toBe(false);
    expect(result.current.selectedShow).toBeNull();
    expect(result.current.episodes).toEqual([]);
    expect(result.current.searchingInShow).toBe(false);
    expect(result.current.episodeSearchQuery).toBe('');
  });

  it('fetches episodes when browsing starts', async () => {
    const mockEpisodes = [
      {
        id: '1',
        title: 'Episode 1',
        description: 'Description 1',
        release_date: '2024-01-01',
        duration_ms: 3600000,
        imageUrl: 'http://example.com/image.jpg',
        externalUrl: 'http://example.com',
        showName: 'Test Show',
      },
    ];

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { episodes: mockEpisodes } }),
    } as Response);

    const { result } = renderHook(() => useEpisodes());

    await act(async () => {
      await result.current.handleBrowseEpisodes({
        id: 'show-1',
        title: 'Test Show',
        imageUrl: 'http://example.com/show.jpg',
      });
    });

    await waitFor(() => {
      expect(result.current.episodes).toEqual(mockEpisodes);
      expect(result.current.browsingEpisodes).toBe(true);
    });
  });

  it('searches episodes in show', async () => {
    const mockBrowseResults = [
      {
        id: '1',
        title: 'Episode 1',
        description: '',
        release_date: '2024-01-01',
        duration_ms: 3600000,
        imageUrl: '',
        externalUrl: '',
        showName: 'Test Show',
      },
    ];

    const mockSearchResults = [
      {
        id: '2',
        title: 'Searched Episode',
        description: 'Search result',
        release_date: '2024-01-02',
        duration_ms: 1800000,
        imageUrl: 'http://example.com/image2.jpg',
        externalUrl: 'http://example.com/2',
        showName: 'Test Show',
      },
    ];

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { episodes: mockBrowseResults } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { episodes: mockSearchResults, hasMore: false } 
        }),
      } as Response);

    const { result } = renderHook(() => useEpisodes());

    // First browse episodes to set the show
    await act(async () => {
      await result.current.handleBrowseEpisodes({
        id: 'show-1',
        title: 'Test Show',
        imageUrl: 'http://example.com/show.jpg',
      });
    });

    // Then set search query
    act(() => {
      result.current.setEpisodeSearchQuery('test');
    });

    // Then search
    await act(async () => {
      await result.current.handleEpisodeSearch();
    });

    await waitFor(() => {
      expect(result.current.searchedEpisodes).toEqual(mockSearchResults);
      expect(result.current.searchingInShow).toBe(true);
    });
  });

  it('loads more episodes', async () => {
    const initialEpisodes = [{ id: '1', title: 'Episode 1', description: '', release_date: '2024-01-01', duration_ms: 3600000, imageUrl: '', externalUrl: '', showName: 'Test' }];
    const moreEpisodes = [{ id: '2', title: 'Episode 2', description: '', release_date: '2024-01-02', duration_ms: 3600000, imageUrl: '', externalUrl: '', showName: 'Test' }];

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { episodes: initialEpisodes } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { episodes: moreEpisodes } }),
      } as Response);

    const { result } = renderHook(() => useEpisodes());

    await act(async () => {
      await result.current.handleBrowseEpisodes({
        id: 'show-1',
        title: 'Test Show',
        imageUrl: 'http://example.com/show.jpg',
      });
    });

    await act(async () => {
      await result.current.loadMoreEpisodes();
    });

    await waitFor(() => {
      expect(result.current.episodes.length).toBe(2);
    });
  });

  it('resets episode browsing', () => {
    const { result } = renderHook(() => useEpisodes());

    act(() => {
      result.current.resetEpisodeBrowsing();
    });

    expect(result.current.browsingEpisodes).toBe(false);
    expect(result.current.selectedShow).toBeNull();
    expect(result.current.episodes).toEqual([]);
  });

  it('toggles search mode', () => {
    const { result } = renderHook(() => useEpisodes());

    act(() => {
      result.current.setSearchingInShow(true);
      result.current.setEpisodeSearchQuery('test');
    });

    act(() => {
      result.current.toggleSearchMode();
    });

    expect(result.current.searchingInShow).toBe(false);
    expect(result.current.episodeSearchQuery).toBe('');
  });
});
