import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useManualEntry } from './useManualEntry';

describe('useManualEntry', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useManualEntry());

    expect(result.current.manualMode).toBe(false);
    expect(result.current.manualData).toEqual({
      title: '',
      creator: '',
      image_url: '',
      external_url: '',
      notes: '',
      rating: null,
    });
    expect(result.current.adding).toBe(false);
  });

  it('updates manual mode', () => {
    const { result } = renderHook(() => useManualEntry());

    act(() => {
      result.current.setManualMode(true);
    });

    expect(result.current.manualMode).toBe(true);
  });

  it('updates manual data', () => {
    const { result } = renderHook(() => useManualEntry());

    act(() => {
      result.current.setManualData({
        title: 'Test Book',
        creator: 'Test Author',
        image_url: 'http://example.com/image.jpg',
        external_url: 'http://example.com',
        notes: 'Great book',
        rating: 5,
      });
    });

    expect(result.current.manualData.title).toBe('Test Book');
    expect(result.current.manualData.creator).toBe('Test Author');
  });

  it('adds manual entry successfully', async () => {
    const mockOnSuccess = vi.fn();
    
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const { result } = renderHook(() => useManualEntry());

    act(() => {
      result.current.setManualData({
        title: 'Test Book',
        creator: 'Test Author',
        image_url: '',
        external_url: '',
        notes: '',
        rating: null,
      });
    });

    await act(async () => {
      await result.current.handleManualAdd('shelf-1', 'book', mockOnSuccess);
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/items',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Test Book'),
      })
    );
  });

  it('shows alert when title is missing', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const mockOnSuccess = vi.fn();

    const { result } = renderHook(() => useManualEntry());

    act(() => {
      result.current.setManualData({
        title: '',
        creator: 'Test Author',
        image_url: '',
        external_url: '',
        notes: '',
        rating: null,
      });
    });

    await act(async () => {
      await result.current.handleManualAdd('shelf-1', 'book', mockOnSuccess);
    });

    expect(alertSpy).toHaveBeenCalledWith('Title and creator are required');
    expect(global.fetch).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('shows alert when creator is missing', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const mockOnSuccess = vi.fn();

    const { result } = renderHook(() => useManualEntry());

    act(() => {
      result.current.setManualData({
        title: 'Test Book',
        creator: '',
        image_url: '',
        external_url: '',
        notes: '',
        rating: null,
      });
    });

    await act(async () => {
      await result.current.handleManualAdd('shelf-1', 'book', mockOnSuccess);
    });

    expect(alertSpy).toHaveBeenCalledWith('Title and creator are required');

    alertSpy.mockRestore();
  });

  it('handles API error', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const mockOnSuccess = vi.fn();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to add item' }),
    } as Response);

    const { result } = renderHook(() => useManualEntry());

    act(() => {
      result.current.setManualData({
        title: 'Test Book',
        creator: 'Test Author',
        image_url: '',
        external_url: '',
        notes: '',
        rating: null,
      });
    });

    await act(async () => {
      await result.current.handleManualAdd('shelf-1', 'book', mockOnSuccess);
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to add item');
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});
