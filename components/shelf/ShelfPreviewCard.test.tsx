import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShelfPreviewCard, describeViews, ShelfPreviewCardProps } from './ShelfPreviewCard';
import type { ShelfPreviewItem } from '@/lib/types/shelf';

function createMockPreviewItem(overrides: Partial<ShelfPreviewItem> = {}): ShelfPreviewItem {
  return {
    id: 'item-1',
    type: 'book',
    title: 'The Great Gatsby',
    creator: 'F. Scott Fitzgerald',
    image_url: null,
    ...overrides,
  };
}

function createMockShelfPreview(
  overrides: Partial<ShelfPreviewCardProps['shelf']> = {}
): ShelfPreviewCardProps['shelf'] {
  return {
    id: 'shelf-1',
    name: 'My Reading List',
    description: null,
    is_public: false,
    item_count: 0,
    preview_items: [],
    ...overrides,
  };
}

function renderComponent(overrides: Partial<ShelfPreviewCardProps['shelf']> = {}) {
  return render(<ShelfPreviewCard shelf={createMockShelfPreview(overrides)} />);
}

describe('ShelfPreviewCard', () => {
  describe('Rendering', () => {
    it('renders shelf name', () => {
      renderComponent({ name: 'Sci-Fi Favorites' });

      expect(screen.getByText('Sci-Fi Favorites')).toBeInTheDocument();
    });

    it('renders description when present', () => {
      renderComponent({ description: 'Books I love' });

      expect(screen.getByText('Books I love')).toBeInTheDocument();
    });

    it('links to the shelf page', () => {
      renderComponent({ id: 'shelf-42' });

      expect(screen.getByRole('link')).toHaveAttribute('href', '/shelf/shelf-42');
    });

    it('renders item count with pluralization', () => {
      renderComponent({ item_count: 3, preview_items: [createMockPreviewItem()] });

      expect(screen.getByText('3 items')).toBeInTheDocument();
    });

    it('renders singular item count', () => {
      renderComponent({ item_count: 1, preview_items: [createMockPreviewItem()] });

      expect(screen.getByText('1 item')).toBeInTheDocument();
    });

    it('renders public badge for public shelves', () => {
      renderComponent({ is_public: true });

      expect(screen.getByText('Public')).toBeInTheDocument();
    });

    it('renders private badge for private shelves', () => {
      renderComponent({ is_public: false });

      expect(screen.getByText('Private')).toBeInTheDocument();
    });

    it('renders cover images for items with image_url', () => {
      renderComponent({
        item_count: 1,
        preview_items: [
          createMockPreviewItem({ image_url: 'https://example.com/cover.jpg' }),
        ],
      });

      expect(screen.getByAltText('The Great Gatsby')).toBeInTheDocument();
    });

    it('renders a titled spine for items without image_url', () => {
      renderComponent({
        item_count: 1,
        preview_items: [createMockPreviewItem({ title: 'Coverless Book' })],
      });

      // No img rendered, but the title appears on the spine
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.getByText('Coverless Book')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('shows empty state when shelf has no items', () => {
      renderComponent({ item_count: 0, preview_items: [] });

      expect(screen.getByText('This shelf is empty')).toBeInTheDocument();
    });

    it('shows overflow spine when item_count exceeds visible books', () => {
      const items = Array.from({ length: 6 }, (_, i) =>
        createMockPreviewItem({ id: `item-${i}`, title: `Book ${i}` })
      );
      renderComponent({ item_count: 11, preview_items: items });

      // 4 visible tiles, 11 total -> +7 overflow
      expect(screen.getByText('+7')).toBeInTheDocument();
    });

    it('does not show overflow spine when all items fit', () => {
      const items = Array.from({ length: 3 }, (_, i) =>
        createMockPreviewItem({ id: `item-${i}`, title: `Book ${i}` })
      );
      renderComponent({ item_count: 3, preview_items: items });

      expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
    });

    it('caps visible tiles and shows overflow when items exceed the max', () => {
      const items = Array.from({ length: 6 }, (_, i) =>
        createMockPreviewItem({
          id: `item-${i}`,
          title: `Book ${i}`,
          image_url: `https://example.com/cover-${i}.jpg`,
        })
      );
      renderComponent({ item_count: 6, preview_items: items });

      // 6 > 5 -> show 4 tiles + "+2"
      expect(screen.getAllByRole('img')).toHaveLength(4);
      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('renders five tiles with no overflow when exactly at the max', () => {
      const items = Array.from({ length: 5 }, (_, i) =>
        createMockPreviewItem({
          id: `item-${i}`,
          title: `Book ${i}`,
          image_url: `https://example.com/cover-${i}.jpg`,
        })
      );
      renderComponent({ item_count: 5, preview_items: items });

      expect(screen.getAllByRole('img')).toHaveLength(5);
      expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
    });
  });

  describe('View counts', () => {
    const views = { views_7d: 14, views_total: 40, top_embed_host: null, top_embed_host_views: 0 };

    it('tells the owner how often the shelf was seen this week', () => {
      renderComponent({ views });
      expect(screen.getByText('Seen 14 times this week')).toBeInTheDocument();
    });

    it('names the site that embeds the shelf most', () => {
      renderComponent({ views: { ...views, top_embed_host: 'yoursite.com', top_embed_host_views: 9 } });
      expect(screen.getByText('Seen 14 times this week, embedded on yoursite.com')).toBeInTheDocument();
    });

    it('falls back to the total in a quiet week', () => {
      renderComponent({ views: { ...views, views_7d: 0, views_total: 1 } });
      expect(screen.getByText('Seen 1 time so far')).toBeInTheDocument();
    });

    it('shows nothing for a shelf that has never been viewed', () => {
      renderComponent({ views: undefined });
      expect(screen.queryByText(/^Seen /)).not.toBeInTheDocument();

      expect(describeViews({ ...views, views_7d: 0, views_total: 0 })).toBeNull();
    });
  });
});
