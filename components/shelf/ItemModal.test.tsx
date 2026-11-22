import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemModal, stepItem } from './ItemModal';
import { createMockItem } from '@/test/utils/mocks';
import { Item } from '@/lib/types/shelf';

vi.mock('@/components/shelf/StockDrawer', () => ({ StockDrawer: () => null }));

const shelf: Item[] = [
  createMockItem({ id: 'a', title: 'Alpha', notes: 'A note on alpha' }),
  createMockItem({ id: 'b', title: 'Bravo', notes: null }),
  createMockItem({ id: 'c', title: 'Charlie', notes: 'A note on charlie' }),
  createMockItem({ id: 'd', title: 'Delta', notes: '   ' }),
];

/** Renders the popup the way the shelf pages do: it owns the selected item. */
interface RenderOptions {
  items?: Item[];
  start?: Item;
  navigable?: boolean;
}

function renderComponent({ items = shelf, start, navigable = true }: RenderOptions = {}) {
  const first = start ?? items[0];
  const onClose = vi.fn();
  function Harness() {
    const [item, setItem] = useState<Item | null>(first);
    return (
      <ItemModal
        item={item}
        isOpen={!!item}
        onClose={onClose}
        items={navigable ? items : undefined}
        onNavigate={navigable ? setItem : undefined}
      />
    );
  }
  render(<Harness />);
  return { onClose };
}

const title = () => screen.getByRole('heading', { level: 2 }).textContent;

describe('ItemModal', () => {
  describe('Rendering', () => {
    it('shows the note as the curator\'s note', () => {
      renderComponent();

      expect(screen.getByText("Curator's note")).toBeInTheDocument();
      expect(screen.getByTestId('notes-content')).toHaveTextContent('A note on alpha');
    });

    it('puts the note above the rating', () => {
      renderComponent({ items: [createMockItem({ notes: 'Loved it', rating: 4 })] });

      const note = screen.getByTestId('notes-section');
      const stars = screen.getByLabelText(/4 out of 5/i);
      expect(note.compareDocumentPosition(stars) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('shows the position in the shelf', () => {
      renderComponent();

      expect(screen.getByTestId('item-position')).toHaveTextContent('1 of 4');
    });

    it('has no navigation without items to step through', () => {
      renderComponent({ navigable: false });

      expect(screen.queryByLabelText('Next item')).not.toBeInTheDocument();
      expect(screen.queryByTestId('item-position')).not.toBeInTheDocument();
    });

    it('has no navigation on a one-item shelf', () => {
      renderComponent({ items: [shelf[0]] });

      expect(screen.queryByLabelText('Next item')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('steps to the next and previous item with the arrows', () => {
      renderComponent();

      fireEvent.click(screen.getByLabelText('Next item'));
      expect(title()).toBe('Bravo');
      expect(screen.getByTestId('item-position')).toHaveTextContent('2 of 4');

      fireEvent.click(screen.getByLabelText('Previous item'));
      expect(title()).toBe('Alpha');
    });

    it('steps with the arrow keys', () => {
      renderComponent();

      fireEvent.keyDown(document, { key: 'ArrowRight' });
      expect(title()).toBe('Bravo');
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      expect(title()).toBe('Delta');
    });

    it('ignores arrow keys with a modifier held', () => {
      renderComponent();

      fireEvent.keyDown(document, { key: 'ArrowRight', metaKey: true });
      expect(title()).toBe('Alpha');
    });

    it('skips items without a note in notes-only mode', () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: 'Notes only' }));
      expect(screen.getByTestId('item-position')).toHaveTextContent('1 of 2 notes');

      fireEvent.click(screen.getByLabelText('Next note'));
      expect(title()).toBe('Charlie');
      fireEvent.click(screen.getByLabelText('Next note'));
      expect(title()).toBe('Alpha');
    });

    it('closes on Escape', () => {
      const { onClose } = renderComponent();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('hides "Notes only" when every item has a note', () => {
      renderComponent({ items: [shelf[0], shelf[2]] });

      expect(screen.queryByRole('button', { name: 'Notes only' })).not.toBeInTheDocument();
    });

    it('hides "Notes only" when no item has a note', () => {
      renderComponent({ items: [shelf[1], shelf[3]] });

      expect(screen.queryByRole('button', { name: 'Notes only' })).not.toBeInTheDocument();
    });

    it('leaves the counter off when the open item has no note in notes-only mode', () => {
      renderComponent({ start: shelf[1] });

      fireEvent.click(screen.getByRole('button', { name: 'Notes only' }));
      expect(screen.queryByTestId('item-position')).not.toBeInTheDocument();
      fireEvent.click(screen.getByLabelText('Next note'));
      expect(title()).toBe('Charlie');
    });
  });

  describe('stepItem', () => {
    it('wraps around both ends', () => {
      expect(stepItem(shelf, shelf[3], 1, false)?.id).toBe('a');
      expect(stepItem(shelf, shelf[0], -1, false)?.id).toBe('d');
    });

    it('returns null when there is nowhere else to go', () => {
      expect(stepItem([shelf[0]], shelf[0], 1, false)).toBeNull();
      expect(stepItem(shelf, shelf[0], 1, true)?.id).toBe('c');
      expect(stepItem([shelf[0], shelf[1]], shelf[0], 1, true)).toBeNull();
    });

    it('returns null for an item not on the shelf', () => {
      expect(stepItem(shelf, createMockItem({ id: 'zzz' }), 1, false)).toBeNull();
    });
  });
});

describe('ItemModal Spotify player', () => {
  const spotifyItem = (overrides: Partial<Item> = {}) =>
    createMockItem({
      type: 'music',
      title: 'Blue in Green',
      creator: 'Miles Davis',
      image_url: 'https://example.com/cover.jpg',
      external_url: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC',
      notes: null,
      rating: null,
      ...overrides,
    });
  const renderComponent = (item: Item) => render(<ItemModal item={item} isOpen onClose={() => {}} />);

  it('embeds the Spotify player for Spotify items', () => {
    renderComponent(spotifyItem());
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
    renderComponent(spotifyItem());
    expect(screen.queryByRole('img', { name: 'Blue in Green' })).not.toBeInTheDocument();
    expect(screen.queryByText('by Miles Davis')).not.toBeInTheDocument();
    expect(screen.queryByText('View on Spotify')).not.toBeInTheDocument();
    // Outside the player's placeholder (which Spotify covers), the title is only in the header
    const placeholder = screen.getByTestId('spotify-player-placeholder');
    const titles = screen.getAllByText('Blue in Green').filter((el) => !placeholder.contains(el));
    expect(titles).toHaveLength(1);
  });

  it('shows rating and notes below the player', () => {
    renderComponent(spotifyItem({ rating: 4, notes: 'Best track on the album' }));
    expect(screen.getByTestId('notes-content')).toHaveTextContent('Best track on the album');
  });

  it('labels podcast episodes as "episode"', () => {
    renderComponent(spotifyItem({ type: 'podcast_episode', external_url: 'https://open.spotify.com/episode/4uLU6hMCjMI75M1A2tKUQC' }));
    expect(screen.getByText('episode')).toBeInTheDocument();
  });

  it('does not embed a player for non-Spotify items', () => {
    renderComponent(spotifyItem({ type: 'book', external_url: 'https://books.google.com/books?id=abc123' }));
    expect(screen.queryByTestId('spotify-embed')).not.toBeInTheDocument();
  });
});
