import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ItemModal } from './ItemModal';
import { Item } from '@/lib/types/shelf';

vi.mock('@/components/shelf/StockDrawer', () => ({ StockDrawer: () => null }));

function createMockItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    shelf_id: 'shelf-1',
    user_id: 'user-1',
    type: 'music',
    title: 'Blue in Green',
    creator: 'Miles Davis',
    image_url: 'https://example.com/cover.jpg',
    external_url: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC',
    notes: null,
    rating: null,
    order_index: 0,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function renderComponent(item: Item) {
  return render(<ItemModal item={item} isOpen onClose={() => {}} />);
}

describe('ItemModal', () => {
  describe('Spotify player', () => {
    it('embeds the Spotify player for Spotify items', () => {
      renderComponent(createMockItem());
      const player = screen.getByTestId('spotify-embed');
      expect(player).toHaveAttribute(
        'src',
        'https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC?utm_source=generator'
      );
      expect(player).toHaveAttribute('height', '152');
      expect(screen.getByRole('link', { name: 'Open in Spotify' })).toHaveAttribute(
        'href',
        'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC'
      );
    });

    it('drops the cover and details the player already shows', () => {
      renderComponent(createMockItem());
      expect(screen.queryByRole('img', { name: 'Blue in Green' })).not.toBeInTheDocument();
      expect(screen.queryByText('by Miles Davis')).not.toBeInTheDocument();
      expect(screen.queryByText('View on Spotify')).not.toBeInTheDocument();
      // Title stays in the dialog header only
      expect(screen.getAllByText('Blue in Green')).toHaveLength(1);
    });

    it('shows rating and notes below the player', () => {
      renderComponent(createMockItem({ rating: 4, notes: 'Best track on the album' }));
      expect(screen.getByTestId('notes-content')).toHaveTextContent('Best track on the album');
    });

    it('labels podcast episodes as "episode"', () => {
      renderComponent(createMockItem({ type: 'podcast_episode', external_url: 'https://open.spotify.com/episode/4uLU6hMCjMI75M1A2tKUQC' }));
      expect(screen.getByText('episode')).toBeInTheDocument();
    });

    it('does not embed a player for non-Spotify items', () => {
      renderComponent(createMockItem({ type: 'book', external_url: 'https://books.google.com/books?id=abc123' }));
      expect(screen.queryByTestId('spotify-embed')).not.toBeInTheDocument();
    });
  });
});
