import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShelfGridStatic } from './ShelfGridStatic';
import { Item } from '@/lib/types/shelf';

// Helper to create mock item data
function createMockItem(overrides: Partial<Item> = {}): Item {
  return {
    id: `item-${Math.random().toString(36).substr(2, 9)}`,
    shelf_id: 'shelf-1',
    user_id: 'user-1',
    type: 'book',
    title: 'Test Book',
    creator: 'Test Author',
    image_url: 'https://example.com/image.jpg',
    external_url: 'https://example.com',
    notes: null,
    rating: null,
    order_index: 0,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('ShelfGridStatic', () => {
  describe('Rendering', () => {
    it('renders empty state when no items', () => {
      render(<ShelfGridStatic items={[]} />);
      expect(screen.getByText(/No items in this shelf yet/i)).toBeInTheDocument();
    });

    it('renders all items when provided', () => {
      const items = [
        createMockItem({ title: 'Book One' }),
        createMockItem({ title: 'Book Two' }),
        createMockItem({ title: 'Book Three' }),
      ];
      render(<ShelfGridStatic items={items} />);

      expect(screen.getByText('Book One')).toBeInTheDocument();
      expect(screen.getByText('Book Two')).toBeInTheDocument();
      expect(screen.getByText('Book Three')).toBeInTheDocument();
    });

    it('renders items with their creators', () => {
      const items = [
        createMockItem({ creator: 'Author One' }),
        createMockItem({ creator: 'Author Two' }),
      ];
      render(<ShelfGridStatic items={items} />);

      expect(screen.getByText('Author One')).toBeInTheDocument();
      expect(screen.getByText('Author Two')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has list role with proper aria-label', () => {
      const items = [createMockItem()];
      render(<ShelfGridStatic items={items} />);

      expect(screen.getByRole('list', { name: /Bookshelf items/i })).toBeInTheDocument();
    });

    it('renders items as article elements', () => {
      const items = [createMockItem(), createMockItem()];
      render(<ShelfGridStatic items={items} />);

      expect(screen.getAllByRole('article')).toHaveLength(2);
    });
  });

  describe('Shelf Layout', () => {
    it('groups items into rows', () => {
      // Create more items than fit on one row
      const items = Array.from({ length: 12 }, (_, i) =>
        createMockItem({ title: `Book ${i + 1}` })
      );
      render(<ShelfGridStatic items={items} />);

      // Should have shelf divider elements (the wooden shelf visuals)
      const container = screen.getByRole('list');
      const shelfDividers = container.querySelectorAll('.bg-gradient-to-r');
      expect(shelfDividers.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Item Type Rendering', () => {
    it('renders different item types correctly', () => {
      const items = [
        createMockItem({ type: 'book', title: 'My Book' }),
        createMockItem({ type: 'podcast', title: 'My Podcast' }),
        createMockItem({ type: 'music', title: 'My Album' }),
      ];
      render(<ShelfGridStatic items={items} />);

      expect(screen.getByText('book')).toBeInTheDocument();
      expect(screen.getByText('podcast')).toBeInTheDocument();
      expect(screen.getByText('music')).toBeInTheDocument();
    });
  });
});
