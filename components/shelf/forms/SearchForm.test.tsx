import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchForm } from './SearchForm';

describe('SearchForm', () => {
  const mockSetSearchQuery = vi.fn();
  const mockOnSearch = vi.fn();
  const mockOnAddResult = vi.fn();
  const mockOnBrowseEpisodes = vi.fn();

  const defaultProps = {
    itemType: 'book' as const,
    searchQuery: '',
    setSearchQuery: mockSetSearchQuery,
    searchResults: [],
    loading: false,
    onSearch: mockOnSearch,
    onAddResult: mockOnAddResult,
    onBrowseEpisodes: mockOnBrowseEpisodes,
    adding: false,
  };

  it('renders search input', () => {
    render(<SearchForm {...defaultProps} />);
    expect(screen.getByPlaceholderText(/search for books/i)).toBeInTheDocument();
  });

  it('renders search button', () => {
    render(<SearchForm {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('calls setSearchQuery when typing', async () => {
    const user = userEvent.setup();
    render(<SearchForm {...defaultProps} />);

    await user.type(screen.getByPlaceholderText(/search for books/i), 'gatsby');

    expect(mockSetSearchQuery).toHaveBeenCalled();
  });

  it('calls onSearch when button clicked', async () => {
    const user = userEvent.setup();
    render(<SearchForm {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(mockOnSearch).toHaveBeenCalled();
  });

  it('calls onSearch when Enter pressed', async () => {
    const user = userEvent.setup();
    render(<SearchForm {...defaultProps} />);

    await user.type(screen.getByPlaceholderText(/search for books/i), '{Enter}');

    expect(mockOnSearch).toHaveBeenCalled();
  });

  it('renders search results', () => {
    const results = [
      {
        id: '1',
        title: 'Test Book',
        creator: 'Test Author',
        imageUrl: 'http://example.com/image.jpg',
        externalUrl: 'http://example.com',
        type: 'book' as const,
      },
    ];

    render(<SearchForm {...defaultProps} searchResults={results} />);

    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });

  it('shows Browse Episodes button for podcasts', () => {
    const results = [
      {
        id: '1',
        title: 'Test Podcast',
        creator: 'Test Host',
        imageUrl: 'http://example.com/image.jpg',
        externalUrl: 'http://example.com',
        type: 'podcast' as const,
      },
    ];

    render(<SearchForm {...defaultProps} searchResults={results} />);

    expect(screen.getByText(/browse episodes/i)).toBeInTheDocument();
  });

  it('calls onBrowseEpisodes when Browse Episodes clicked', async () => {
    const user = userEvent.setup();
    const result = {
      id: '1',
      title: 'Test Podcast',
      creator: 'Test Host',
      imageUrl: 'http://example.com/image.jpg',
      externalUrl: 'http://example.com',
      type: 'podcast' as const,
    };

    render(<SearchForm {...defaultProps} searchResults={[result]} />);

    await user.click(screen.getByText(/browse episodes/i));

    expect(mockOnBrowseEpisodes).toHaveBeenCalledWith(result);
  });

  it('calls onAddResult when Add clicked', async () => {
    const user = userEvent.setup();
    const result = {
      id: '1',
      title: 'Test Book',
      creator: 'Test Author',
      imageUrl: 'http://example.com/image.jpg',
      externalUrl: 'http://example.com',
      type: 'book' as const,
    };

    render(<SearchForm {...defaultProps} searchResults={[result]} />);

    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(mockOnAddResult).toHaveBeenCalledWith(result);
  });

  it('shows loading state', () => {
    render(<SearchForm {...defaultProps} loading={true} />);
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('disables search button when loading', () => {
    render(<SearchForm {...defaultProps} loading={true} />);
    expect(screen.getByRole('button', { name: 'Searching...' })).toBeDisabled();
  });
});
