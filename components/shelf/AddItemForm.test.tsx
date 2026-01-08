import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddItemForm } from './AddItemForm';
import { setupFetchMock, resetFetchMock, mockFetchSuccess, mockFetchError } from '@/test/utils/api';

describe('AddItemForm', () => {
  const mockOnItemAdded = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    setupFetchMock();
  });

  describe('Rendering', () => {
    it('renders type selector buttons', () => {
      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('button', { name: 'Book' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Podcast' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Music' })).toBeInTheDocument();
    });

    it('renders search input', () => {
      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByPlaceholderText(/search for books/i)).toBeInTheDocument();
    });

    it('renders manual entry toggle', () => {
      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/or add manually/i)).toBeInTheDocument();
    });
  });

  describe('Type Selection', () => {
    it('defaults to book type', () => {
      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      const bookButton = screen.getByRole('button', { name: 'Book' });
      expect(bookButton.className).toContain('bg-blue-100');
    });

    it('changes to podcast type when clicked', async () => {
      const user = userEvent.setup();
      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Podcast' }));

      const podcastButton = screen.getByRole('button', { name: 'Podcast' });
      expect(podcastButton.className).toContain('bg-purple-100');
    });

    it('changes to music type when clicked', async () => {
      const user = userEvent.setup();
      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Music' }));

      const musicButton = screen.getByRole('button', { name: 'Music' });
      expect(musicButton.className).toContain('bg-green-100');
    });

    it('updates search placeholder based on type', async () => {
      const user = userEvent.setup();
      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByPlaceholderText(/search for books/i)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Podcast' }));
      expect(screen.getByPlaceholderText(/search for podcasts/i)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Music' }));
      expect(screen.getByPlaceholderText(/search for musics/i)).toBeInTheDocument();
    });
  });

  describe('Manual Mode', () => {
    it('switches to manual mode', async () => {
      const user = userEvent.setup();
      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByText(/or add manually/i));

      expect(screen.getByText(/title/i)).toBeInTheDocument();
    });

    it('shows Author label for books', async () => {
      const user = userEvent.setup();
      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByText(/or add manually/i));

      expect(screen.getByText(/author/i)).toBeInTheDocument();
    });

    it('shows Host label for podcasts', async () => {
      const user = userEvent.setup();
      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Podcast' }));
      await user.click(screen.getByText(/or add manually/i));

      expect(screen.getByText(/host/i)).toBeInTheDocument();
    });

    it('shows Artist label for music', async () => {
      const user = userEvent.setup();
      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Music' }));
      await user.click(screen.getByText(/or add manually/i));

      expect(screen.getByText(/artist/i)).toBeInTheDocument();
    });

    it('shows back to search button in manual mode', async () => {
      const user = userEvent.setup();
      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByText(/or add manually/i));

      expect(screen.getByText(/back to search/i)).toBeInTheDocument();
    });

    it('shows optional fields in manual mode', async () => {
      const user = userEvent.setup();
      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByText(/or add manually/i));

      expect(screen.getByText(/image url/i)).toBeInTheDocument();
      expect(screen.getByText(/external url/i)).toBeInTheDocument();
      expect(screen.getByText(/notes/i)).toBeInTheDocument();
    });
  });

  describe('Manual Form Submission', () => {
    it('submits manual entry with valid data', async () => {
      const user = userEvent.setup();
      mockFetchSuccess();

      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByText(/or add manually/i));
      
      // Get inputs by their position/role since they don't have proper labels
      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], 'Test Book'); // Title
      await user.type(inputs[1], 'Test Author'); // Creator
      await user.click(screen.getByRole('button', { name: /add to shelf/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Test Book'),
        });
      });

      await waitFor(() => {
        expect(mockOnItemAdded).toHaveBeenCalled();
      });
    });

    it('shows alert when title is missing', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByText(/or add manually/i));
      
      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[1], 'Test Author'); // Only creator
      await user.click(screen.getByRole('button', { name: /add to shelf/i }));

      expect(alertSpy).toHaveBeenCalledWith('Title and creator are required');
      expect(global.fetch).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('shows alert when creator is missing', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByText(/or add manually/i));
      
      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], 'Test Book'); // Only title
      await user.click(screen.getByRole('button', { name: /add to shelf/i }));

      expect(alertSpy).toHaveBeenCalledWith('Title and creator are required');

      alertSpy.mockRestore();
    });
  });

  describe('Search Functionality', () => {
    it('calls search API when search button clicked', async () => {
      const user = userEvent.setup();
      mockFetchSuccess([]);

      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      await user.type(screen.getByPlaceholderText(/search for books/i), 'gatsby');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/search/books?q=gatsby')
        );
      });
    });

    it('calls search on Enter key', async () => {
      const user = userEvent.setup();
      mockFetchSuccess([]);

      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search for books/i);
      await user.type(searchInput, 'gatsby{Enter}');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('does not search with empty query', async () => {
      const user = userEvent.setup();

      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Search' }));

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('uses correct endpoint for music type', async () => {
      const user = userEvent.setup();
      mockFetchSuccess([]);

      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Music' }));
      await user.type(screen.getByPlaceholderText(/search for musics/i), 'beatles');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/search/music?q=beatles&type=music')
        );
      });
    });
  });

  describe('Video Mode', () => {
    it('changes to video type when clicked', async () => {
      const user = userEvent.setup();
      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Video' }));

      const videoButton = screen.getByRole('button', { name: 'Video' });
      expect(videoButton.className).toContain('bg-red-100');
    });

    it('shows URL input for video type', async () => {
      const user = userEvent.setup();
      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Video' }));

      expect(screen.getByPlaceholderText(/paste youtube url/i)).toBeInTheDocument();
    });

    it('shows Add Video button for video type', async () => {
      const user = userEvent.setup();
      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Video' }));

      expect(screen.getByRole('button', { name: 'Add Video' })).toBeInTheDocument();
    });

    it('shows supported formats help text', async () => {
      const user = userEvent.setup();
      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Video' }));

      expect(screen.getByText(/supported formats/i)).toBeInTheDocument();
    });

    it('calls from-url API when Add Video clicked', async () => {
      const user = userEvent.setup();
      mockFetchSuccess({ 
        id: 'item-1',
        title: 'Test Video',
        creator: 'Test Channel'
      });

      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Video' }));
      await user.type(
        screen.getByPlaceholderText(/paste youtube url/i), 
        'https://youtube.com/watch?v=dQw4w9WgXcQ'
      );
      await user.click(screen.getByRole('button', { name: 'Add Video' }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/items/from-url',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('youtube.com/watch?v=dQw4w9WgXcQ'),
          })
        );
      });
    });

    it('calls onItemAdded after successful video fetch', async () => {
      const user = userEvent.setup();
      mockFetchSuccess({ 
        id: 'item-1',
        title: 'Test Video',
        creator: 'Test Channel'
      });

      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Video' }));
      await user.type(
        screen.getByPlaceholderText(/paste youtube url/i), 
        'https://youtube.com/watch?v=dQw4w9WgXcQ'
      );
      await user.click(screen.getByRole('button', { name: 'Add Video' }));

      await waitFor(() => {
        expect(mockOnItemAdded).toHaveBeenCalled();
      });
    });

    it('Add Video button is disabled when URL is empty', async () => {
      const user = userEvent.setup();
      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Video' }));

      const addButton = screen.getByRole('button', { name: 'Add Video' });
      expect(addButton).toBeDisabled();
    });

    it('shows alert on API error', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      mockFetchError('Invalid YouTube URL');

      render(
        <AddItemForm
          shelfId="shelf-1"
          onItemAdded={mockOnItemAdded}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Video' }));
      await user.type(
        screen.getByPlaceholderText(/paste youtube url/i), 
        'https://invalid-url.com'
      );
      await user.click(screen.getByRole('button', { name: 'Add Video' }));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Invalid YouTube URL');
      });

      alertSpy.mockRestore();
    });
  });
});
