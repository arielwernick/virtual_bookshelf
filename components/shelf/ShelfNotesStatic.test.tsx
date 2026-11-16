import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShelfNotesStatic } from './ShelfNotesStatic';
import { Item } from '@/lib/types/shelf';

function createMockItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    shelf_id: '',
    user_id: null,
    type: 'book',
    title: 'Deep Work',
    creator: 'Cal Newport',
    image_url: null,
    external_url: 'https://books.google.com/books?id=abc',
    notes: 'Changed how I plan my week',
    rating: null,
    order_index: 0,
    created_at: new Date('2026-10-01T00:00:00Z'),
    updated_at: new Date('2026-10-01T00:00:00Z'),
    ...overrides,
  };
}

function renderComponent(items: Item[]) {
  return render(<ShelfNotesStatic items={items} />);
}

describe('ShelfNotesStatic', () => {
  describe('Rendering', () => {
    it('renders each note in full, as a block quote under the item heading', () => {
      const long = 'A long note. '.repeat(40).trim();
      const { container } = renderComponent([createMockItem({ notes: long })]);

      expect(screen.getByRole('heading', { level: 2, name: 'Notes on this shelf' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /Deep Work/ })).toHaveTextContent(
        'Deep Work by Cal Newport'
      );
      expect(container.querySelector('blockquote')).toHaveTextContent(long);
    });

    it('lists items in shelf order and skips items without a note', () => {
      renderComponent([
        createMockItem({ id: 'b', title: 'Second', order_index: 2 }),
        createMockItem({ id: 'x', title: 'No Note', order_index: 1, notes: null }),
        createMockItem({ id: 'a', title: 'First', order_index: 0 }),
      ]);

      const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
      expect(titles).toEqual(['First by Cal Newport', 'Second by Cal Newport']);
    });

    it('links the title to the item, marked as a user-added link', () => {
      renderComponent([createMockItem()]);
      const link = screen.getByRole('link', { name: 'Deep Work' });

      expect(link).toHaveAttribute('href', 'https://books.google.com/books?id=abc');
      expect(link.getAttribute('rel')).toContain('ugc');
      expect(link.getAttribute('rel')).toContain('nofollow');
    });
  });

  describe('Edge Cases', () => {
    it('renders nothing when no item has a note', () => {
      const { container } = renderComponent([
        createMockItem({ notes: null }),
        createMockItem({ id: 'b', notes: '   ' }),
      ]);
      expect(container).toBeEmptyDOMElement();
    });

    it('does not link a title whose URL is not a web address', () => {
      renderComponent([createMockItem({ external_url: 'javascript:alert(1)' })]);
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('shows a stock ticker in brackets, not as an author', () => {
      renderComponent([createMockItem({ type: 'stock', title: 'Apple', creator: 'AAPL' })]);
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Apple (AAPL)');
    });
  });
});
