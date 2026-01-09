import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EpisodeBrowser } from './EpisodeBrowser';

describe('EpisodeBrowser', () => {
  const mockSetSearchingInShow = vi.fn();
  const mockSetEpisodeSearchQuery = vi.fn();
  const mockOnSearch = vi.fn();
  const mockOnLoadMoreEpisodes = vi.fn();
  const mockOnLoadMoreSearchResults = vi.fn();
  const mockOnAddEpisode = vi.fn();

  const defaultProps = {
    selectedShow: {
      id: 'show-1',
      title: 'Test Podcast',
      imageUrl: 'http://example.com/show.jpg',
    },
    episodes: [],
    searchedEpisodes: [],
    searchingInShow: false,
    setSearchingInShow: mockSetSearchingInShow,
    episodeSearchQuery: '',
    setEpisodeSearchQuery: mockSetEpisodeSearchQuery,
    hasMoreEpisodes: false,
    hasMoreSearchResults: false,
    loading: false,
    onSearch: mockOnSearch,
    onLoadMoreEpisodes: mockOnLoadMoreEpisodes,
    onLoadMoreSearchResults: mockOnLoadMoreSearchResults,
    onAddEpisode: mockOnAddEpisode,
    adding: false,
  };

  it('renders show title', () => {
    render(<EpisodeBrowser {...defaultProps} />);
    expect(screen.getByText(/Episodes from/)).toBeInTheDocument();
    expect(screen.getByText(/Test Podcast/)).toBeInTheDocument();
  });

  it('renders browse mode buttons', () => {
    render(<EpisodeBrowser {...defaultProps} />);
    expect(screen.getByText('Browse Recent')).toBeInTheDocument();
    expect(screen.getByText('Search All Episodes')).toBeInTheDocument();
  });

  it('shows search input in search mode', () => {
    render(<EpisodeBrowser {...defaultProps} searchingInShow={true} />);
    expect(screen.getByPlaceholderText(/search episodes/i)).toBeInTheDocument();
  });

  it('renders episodes in browse mode', () => {
    const episodes = [
      {
        id: '1',
        title: 'Episode 1',
        description: 'Description 1',
        release_date: '2024-01-01',
        duration_ms: 3600000,
        imageUrl: 'http://example.com/ep1.jpg',
        externalUrl: 'http://example.com/ep1',
        showName: 'Test Podcast',
      },
    ];

    render(<EpisodeBrowser {...defaultProps} episodes={episodes} />);
    expect(screen.getByText('Episode 1')).toBeInTheDocument();
  });

  it('renders searched episodes in search mode', () => {
    const searchedEpisodes = [
      {
        id: '2',
        title: 'Searched Episode',
        description: 'Search result',
        release_date: '2024-01-02',
        duration_ms: 1800000,
        imageUrl: 'http://example.com/ep2.jpg',
        externalUrl: 'http://example.com/ep2',
        showName: 'Test Podcast',
      },
    ];

    render(
      <EpisodeBrowser
        {...defaultProps}
        searchingInShow={true}
        searchedEpisodes={searchedEpisodes}
        episodeSearchQuery="searched"
      />
    );
    expect(screen.getByText('Searched Episode')).toBeInTheDocument();
  });

  it('calls onAddEpisode when Add Episode clicked', async () => {
    const user = userEvent.setup();
    const episode = {
      id: '1',
      title: 'Episode 1',
      description: 'Description 1',
      release_date: '2024-01-01',
      duration_ms: 3600000,
      imageUrl: 'http://example.com/ep1.jpg',
      externalUrl: 'http://example.com/ep1',
      showName: 'Test Podcast',
    };

    render(<EpisodeBrowser {...defaultProps} episodes={[episode]} />);

    await user.click(screen.getByText('Add Episode'));

    expect(mockOnAddEpisode).toHaveBeenCalledWith(episode);
  });

  it('shows Load More button when hasMoreEpisodes is true', () => {
    const episodes = [
      {
        id: '1',
        title: 'Episode 1',
        description: '',
        release_date: '2024-01-01',
        duration_ms: 3600000,
        imageUrl: '',
        externalUrl: '',
        showName: 'Test',
      },
    ];

    render(<EpisodeBrowser {...defaultProps} episodes={episodes} hasMoreEpisodes={true} />);
    expect(screen.getByText('Load More Episodes')).toBeInTheDocument();
  });

  it('formats duration correctly', () => {
    const episode = {
      id: '1',
      title: 'Episode 1',
      description: '',
      release_date: '2024-01-01',
      duration_ms: 3665000, // 1h 1m 5s
      imageUrl: '',
      externalUrl: '',
      showName: 'Test',
    };

    render(<EpisodeBrowser {...defaultProps} episodes={[episode]} />);
    expect(screen.getByText(/1h 1m/)).toBeInTheDocument();
  });
});
