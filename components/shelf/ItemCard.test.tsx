import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemCard } from './ItemCard';
import { Item } from '@/lib/types/shelf';

// Helper to create mock item
function createMockItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    shelf_id: 'shelf-1',
    user_id: 'user-1',
    type: 'book',
    title: 'The Great Gatsby',
    creator: 'F. Scott Fitzgerald',
    image_url: null,
    external_url: null,
    notes: null,
    order_index: 0,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('ItemCard', () => {
  describe('Rendering', () => {
    it('renders item title', () => {
      render(<ItemCard item={createMockItem({ title: 'Test Book Title' })} />);

      expect(screen.getByText('Test Book Title')).toBeInTheDocument();
    });

    it('renders item creator', () => {
      render(<ItemCard item={createMockItem({ creator: 'Test Author' })} />);

      expect(screen.getByText('Test Author')).toBeInTheDocument();
    });

    it('renders item type badge', () => {
      render(<ItemCard item={createMockItem({ type: 'book' })} />);

      expect(screen.getByText('book')).toBeInTheDocument();
    });

    it('renders different type badges correctly', () => {
      const { rerender } = render(<ItemCard item={createMockItem({ type: 'podcast' })} />);
      expect(screen.getByText('podcast')).toBeInTheDocument();

      rerender(<ItemCard item={createMockItem({ type: 'music' })} />);
      expect(screen.getByText('music')).toBeInTheDocument();
    });

    it('renders image when provided', () => {
      render(
        <ItemCard
          item={createMockItem({
            image_url: 'https://example.com/image.jpg',
            title: 'Book with Image',
          })}
        />
      );

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
      expect(img).toHaveAttribute('alt', 'Book with Image');
    });

    it('renders fallback icon when no image', () => {
      render(<ItemCard item={createMockItem({ image_url: null })} />);

      // Check for SVG fallback icon
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('has lazy loading on image', () => {
      render(
        <ItemCard
          item={createMockItem({ image_url: 'https://example.com/image.jpg' })}
        />
      );

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'lazy');
    });
  });

  describe('Click Behavior', () => {
    it('calls onClick when clicked', () => {
      const onClick = vi.fn();
      render(<ItemCard item={createMockItem()} onClick={onClick} />);

      fireEvent.click(screen.getByText('The Great Gatsby'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('has cursor-pointer when clickable', () => {
      render(<ItemCard item={createMockItem()} onClick={() => {}} />);

      const card = screen.getByText('The Great Gatsby').closest('div[class*="cursor-pointer"]');
      expect(card).toBeInTheDocument();
    });

    it('does not call onClick in edit mode', () => {
      const onClick = vi.fn();
      render(<ItemCard item={createMockItem()} onClick={onClick} editMode={true} />);

      fireEvent.click(screen.getByText('The Great Gatsby'));

      expect(onClick).not.toHaveBeenCalled();
    });

    it('does not have cursor-pointer when not clickable', () => {
      render(<ItemCard item={createMockItem()} />);

      const card = screen.getByText('The Great Gatsby').parentElement?.parentElement;
      expect(card?.className).not.toContain('cursor-pointer');
    });
  });

  describe('Edit Mode', () => {
    it('shows delete button in edit mode', () => {
      const onDelete = vi.fn();
      render(
        <ItemCard item={createMockItem()} editMode={true} onDelete={onDelete} />
      );

      const deleteButton = screen.getByTitle('Delete item');
      expect(deleteButton).toBeInTheDocument();
    });

    it('hides delete button when not in edit mode', () => {
      const onDelete = vi.fn();
      render(<ItemCard item={createMockItem()} onDelete={onDelete} />);

      expect(screen.queryByTitle('Delete item')).not.toBeInTheDocument();
    });

    it('calls onDelete when delete button clicked', () => {
      const onDelete = vi.fn();
      render(
        <ItemCard item={createMockItem()} editMode={true} onDelete={onDelete} />
      );

      fireEvent.click(screen.getByTitle('Delete item'));

      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('stops propagation when delete button clicked', () => {
      const onClick = vi.fn();
      const onDelete = vi.fn();
      render(
        <ItemCard
          item={createMockItem()}
          onClick={onClick}
          editMode={true}
          onDelete={onDelete}
        />
      );

      fireEvent.click(screen.getByTitle('Delete item'));

      expect(onDelete).toHaveBeenCalled();
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Type Badge Colors', () => {
    it('applies blue color for book type', () => {
      render(<ItemCard item={createMockItem({ type: 'book' })} />);

      const badge = screen.getByText('book');
      expect(badge.className).toContain('bg-blue-100');
      expect(badge.className).toContain('text-blue-800');
    });

    it('applies purple color for podcast type', () => {
      render(<ItemCard item={createMockItem({ type: 'podcast' })} />);

      const badge = screen.getByText('podcast');
      expect(badge.className).toContain('bg-purple-100');
      expect(badge.className).toContain('text-purple-800');
    });

    it('applies green color for music type', () => {
      render(<ItemCard item={createMockItem({ type: 'music' })} />);

      const badge = screen.getByText('music');
      expect(badge.className).toContain('bg-green-100');
      expect(badge.className).toContain('text-green-800');
    });
  });
});
