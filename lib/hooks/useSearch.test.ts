import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSearch } from './useSearch';

describe('useSearch', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useSearch());

    expect(result.current.searchQuery).toBe('');
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('updates search query', () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setSearchQuery('test query');
    });

    expect(result.current.searchQuery).toBe('test query');
  });

  it('searches for books', async () => {
    const mockResults = [
      {
        id: '1',
        title: 'Test Book',
        creator: 'Test Author',
        imageUrl: 'http://example.com/image.jpg',
        externalUrl: 'http://example.com',
        type: 'book' as const,
      },
    ];

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockResults }),
    } as Response);

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setSearchQuery('gatsby');
    });

    await act(async () => {
      await result.current.handleSearch('book');
    });

    await waitFor(() => {
      expect(result.current.searchResults).toEqual(mockResults);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/search/books?q=gatsby')
    );
  });

  it('searches for podcasts', async () => {
    const mockResults = [
      {
        id: '1',
        title: 'Test Podcast',
        creator: 'Test Host',
        imageUrl: 'http://example.com/image.jpg',
        externalUrl: 'http://example.com',
        type: 'podcast' as const,
      },
    ];

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockResults }),
    } as Response);

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setSearchQuery('test podcast');
    });

    await act(async () => {
      await result.current.handleSearch('podcast');
    });

    await waitFor(() => {
      expect(result.current.searchResults).toEqual(mockResults);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/search/music?q=test%20podcast&type=podcast')
    );
  });

  it('does not search with empty query', async () => {
    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.handleSearch('book');
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sets loading state during search', async () => {
    vi.mocked(global.fetch).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ success: true, data: [] }),
            } as Response);
          }, 100);
        })
    );

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setSearchQuery('test');
    });

    let searchPromise: Promise<void>;
    act(() => {
      searchPromise = result.current.handleSearch('book');
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await searchPromise!;
    });

    expect(result.current.loading).toBe(false);
  });

  it('handles search errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setSearchQuery('test');
    });

    await act(async () => {
      await result.current.handleSearch('book');
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result.current.loading).toBe(false);

    consoleErrorSpy.mockRestore();
  });
});
