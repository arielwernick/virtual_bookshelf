import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Top5ItemCard } from './Top5ItemCard';
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

describe('Top5ItemCard', () => {
  describe('Rendering', () => {
    it('renders item title', () => {
      render(<Top5ItemCard item={createMockItem({ title: 'Test Title' })} rank={1} />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders item creator', () => {
      render(<Top5ItemCard item={createMockItem({ creator: 'Test Author' })} rank={1} />);
      expect(screen.getByText('Test Author')).toBeInTheDocument();
    });

    it('renders rank badge', () => {
      render(<Top5ItemCard item={createMockItem()} rank={1} />);
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    it('renders rank 5 correctly', () => {
      render(<Top5ItemCard item={createMockItem()} rank={5} />);
      expect(screen.getByText('#5')).toBeInTheDocument();
    });

    it('renders item type badge', () => {
      render(<Top5ItemCard item={createMockItem({ type: 'book' })} rank={1} />);
      expect(screen.getByText('book')).toBeInTheDocument();
    });

    it('renders podcast type badge', () => {
      render(<Top5ItemCard item={createMockItem({ type: 'podcast' })} rank={2} />);
      expect(screen.getByText('podcast')).toBeInTheDocument();
    });

    it('renders music type badge', () => {
      render(<Top5ItemCard item={createMockItem({ type: 'music' })} rank={3} />);
      expect(screen.getByText('music')).toBeInTheDocument();
    });

    it('renders image when provided', () => {
      render(
        <Top5ItemCard
          item={createMockItem({ image_url: 'https://example.com/cover.jpg' })}
          rank={1}
        />
      );
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/cover.jpg');
    });

    it('renders fallback icon when no image', () => {
      render(<Top5ItemCard item={createMockItem({ image_url: null })} rank={1} />);
      // Should have fallback SVG icon
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Click Behavior', () => {
    it('calls onClick when clicked in view mode', () => {
      const handleClick = vi.fn();
      render(
        <Top5ItemCard
          item={createMockItem()}
          rank={1}
          onClick={handleClick}
        />
      );

      const card = screen.getByText('The Great Gatsby').closest('div[class*="group"]');
      fireEvent.click(card!);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when clicked in edit mode', () => {
      const handleClick = vi.fn();
      render(
        <Top5ItemCard
          item={createMockItem()}
          rank={1}
          onClick={handleClick}
          editMode
        />
      );

      const card = screen.getByText('The Great Gatsby').closest('div[class*="group"]');
      fireEvent.click(card!);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    it('shows delete button in edit mode', () => {
      const handleDelete = vi.fn();
      render(
        <Top5ItemCard
          item={createMockItem()}
          rank={1}
          editMode
          onDelete={handleDelete}
        />
      );

      const deleteButton = screen.getByTitle('Delete item');
      expect(deleteButton).toBeInTheDocument();
    });

    it('calls onDelete when delete button clicked', () => {
      const handleDelete = vi.fn();
      render(
        <Top5ItemCard
          item={createMockItem()}
          rank={1}
          editMode
          onDelete={handleDelete}
        />
      );

      const deleteButton = screen.getByTitle('Delete item');
      fireEvent.click(deleteButton);
      expect(handleDelete).toHaveBeenCalledTimes(1);
    });

    it('shows move up button when canMoveUp is true', () => {
      const handleMoveUp = vi.fn();
      render(
        <Top5ItemCard
          item={createMockItem()}
          rank={2}
          editMode
          onMoveUp={handleMoveUp}
          canMoveUp={true}
        />
      );

      const moveUpButton = screen.getByTitle('Move up');
      expect(moveUpButton).toBeInTheDocument();
    });

    it('does not show move up button when canMoveUp is false', () => {
      const handleMoveUp = vi.fn();
      render(
        <Top5ItemCard
          item={createMockItem()}
          rank={1}
          editMode
          onMoveUp={handleMoveUp}
          canMoveUp={false}
        />
      );

      expect(screen.queryByTitle('Move up')).not.toBeInTheDocument();
    });

    it('shows move down button when canMoveDown is true', () => {
      const handleMoveDown = vi.fn();
      render(
        <Top5ItemCard
          item={createMockItem()}
          rank={1}
          editMode
          onMoveDown={handleMoveDown}
          canMoveDown={true}
        />
      );

      const moveDownButton = screen.getByTitle('Move down');
      expect(moveDownButton).toBeInTheDocument();
    });

    it('does not show move down button when canMoveDown is false', () => {
      const handleMoveDown = vi.fn();
      render(
        <Top5ItemCard
          item={createMockItem()}
          rank={5}
          editMode
          onMoveDown={handleMoveDown}
          canMoveDown={false}
        />
      );

      expect(screen.queryByTitle('Move down')).not.toBeInTheDocument();
    });

    it('calls onMoveUp when move up button clicked', () => {
      const handleMoveUp = vi.fn();
      render(
        <Top5ItemCard
          item={createMockItem()}
          rank={2}
          editMode
          onMoveUp={handleMoveUp}
          canMoveUp={true}
        />
      );

      const moveUpButton = screen.getByTitle('Move up');
      fireEvent.click(moveUpButton);
      expect(handleMoveUp).toHaveBeenCalledTimes(1);
    });

    it('calls onMoveDown when move down button clicked', () => {
      const handleMoveDown = vi.fn();
      render(
        <Top5ItemCard
          item={createMockItem()}
          rank={1}
          editMode
          onMoveDown={handleMoveDown}
          canMoveDown={true}
        />
      );

      const moveDownButton = screen.getByTitle('Move down');
      fireEvent.click(moveDownButton);
      expect(handleMoveDown).toHaveBeenCalledTimes(1);
    });

    it('does not show edit controls in view mode', () => {
      render(
        <Top5ItemCard
          item={createMockItem()}
          rank={1}
          onDelete={vi.fn()}
          onMoveUp={vi.fn()}
          onMoveDown={vi.fn()}
        />
      );

      expect(screen.queryByTitle('Delete item')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Move up')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Move down')).not.toBeInTheDocument();
    });
  });
});
