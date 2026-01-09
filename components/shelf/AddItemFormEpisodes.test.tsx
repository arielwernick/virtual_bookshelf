import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddItemForm } from './AddItemForm';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock data
const mockPodcastResult = {
  id: 'podcast-123',
  title: 'Test Podcast Show',
  creator: 'Test Host',
  imageUrl: 'https://example.com/podcast.jpg',
  externalUrl: 'https://open.spotify.com/show/123',
  type: 'podcast' as const,
};

const mockEpisodesResponse = {
  success: true,
  data: {
    episodes: [
      {
        id: 'episode-1',
        title: 'Episode 1: Introduction',
        description: 'This is the first episode of our amazing podcast.',
        release_date: '2024-12-01',
        duration_ms: 1800000, // 30 minutes
        imageUrl: 'https://example.com/episode1.jpg',
        externalUrl: 'https://open.spotify.com/episode/1',
        showName: 'Test Podcast Show',
      },
      {
        id: 'episode-2',
        title: 'Episode 2: Deep Dive',
        description: 'We go deeper into the topic discussed in episode 1.',
        release_date: '2024-12-05',
        duration_ms: 3600000, // 60 minutes
        imageUrl: 'https://example.com/episode2.jpg',
        externalUrl: 'https://open.spotify.com/episode/2',
        showName: 'Test Podcast Show',
      },
    ],
    total: 2,
    showName: 'Test Podcast Show',
  },
};

describe('AddItemForm - Episode Browsing', () => {
  const mockProps = {
    shelfId: 'shelf-1',
    onItemAdded: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  it('shows Browse Episodes button for podcast results', async () => {
    // Mock podcast search response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [mockPodcastResult],
      }),
    });

    render(<AddItemForm {...mockProps} />);

    // Switch to podcast type
    fireEvent.click(screen.getByText('Podcast'));

    // Search for podcasts
    const searchInput = screen.getByPlaceholderText('Search for podcasts...');
    const searchButton = screen.getByText('Search');
    
    fireEvent.change(searchInput, { target: { value: 'test podcast' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Test Podcast Show')).toBeInTheDocument();
    });

    // Check that Browse Episodes button is present
    expect(screen.getByText('Browse Episodes →')).toBeInTheDocument();
  });

  it('displays episodes when Browse Episodes is clicked', async () => {
    // Mock podcast search response
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockPodcastResult],
        }),
      })
      // Mock episodes response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEpisodesResponse,
      });

    render(<AddItemForm {...mockProps} />);

    // Switch to podcast type and search
    fireEvent.click(screen.getByText('Podcast'));
    const searchInput = screen.getByPlaceholderText('Search for podcasts...');
    fireEvent.change(searchInput, { target: { value: 'test podcast' } });
    fireEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('Browse Episodes →')).toBeInTheDocument();
    });

    // Click Browse Episodes
    fireEvent.click(screen.getByText('Browse Episodes →'));

    await waitFor(() => {
      // Use a more flexible text matching approach
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading.textContent).toContain('Episodes from');
      expect(heading.textContent).toContain('Test Podcast Show');
    });

    // Check that episodes are displayed (wait for them to load)
    await waitFor(() => {
      expect(screen.getByText('Episode 1: Introduction')).toBeInTheDocument();
    });
    expect(screen.getByText('Episode 2: Deep Dive')).toBeInTheDocument();

    // Check that episodes have duration info (don't need exact matching)
    expect(screen.getByText(/30m/)).toBeInTheDocument(); // 30 minutes duration appears
    expect(screen.getByText(/1h 0m/)).toBeInTheDocument(); // 60 minutes duration appears
  });

  it('can add a podcast episode', async () => {
    // Mock responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockPodcastResult],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEpisodesResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<AddItemForm {...mockProps} />);

    // Navigate to episodes
    fireEvent.click(screen.getByText('Podcast'));
    const searchInput = screen.getByPlaceholderText('Search for podcasts...');
    fireEvent.change(searchInput, { target: { value: 'test podcast' } });
    fireEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('Browse Episodes →')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Browse Episodes →'));

    await waitFor(() => {
      expect(screen.getByText('Episode 1: Introduction')).toBeInTheDocument();
    });

    // Click Add Episode
    const addButtons = screen.getAllByText('Add Episode');
    fireEvent.click(addButtons[0]);

    await waitFor(() => {
      expect(mockProps.onItemAdded).toHaveBeenCalled();
    });

    // Verify the correct API call was made
    expect(mockFetch).toHaveBeenLastCalledWith('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shelf_id: 'shelf-1',
        type: 'podcast_episode',
        title: 'Episode 1: Introduction',
        creator: 'Test Podcast Show',
        image_url: 'https://example.com/episode1.jpg',
        external_url: 'https://open.spotify.com/episode/1',
      }),
    });
  });

  it('shows back button when browsing episodes', async () => {
    // Mock responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockPodcastResult],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEpisodesResponse,
      });

    render(<AddItemForm {...mockProps} />);

    // Navigate to episodes
    fireEvent.click(screen.getByText('Podcast'));
    const searchInput = screen.getByPlaceholderText('Search for podcasts...');
    fireEvent.change(searchInput, { target: { value: 'test podcast' } });
    fireEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('Browse Episodes →')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Browse Episodes →'));

    await waitFor(() => {
      expect(screen.getByText('← Back to Search Results')).toBeInTheDocument();
    });

    // Click back button
    fireEvent.click(screen.getByText('← Back to Search Results'));

    // Should be back to search results
    await waitFor(() => {
      expect(screen.getByText('Test Podcast Show')).toBeInTheDocument();
      expect(screen.getByText('Browse Episodes →')).toBeInTheDocument();
    });
  });
});