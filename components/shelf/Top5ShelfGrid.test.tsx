import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Top5ShelfGrid } from './Top5ShelfGrid';
import { createMockItem } from '@/test/utils/mocks';

describe('Top5ShelfGrid', () => {
  describe('Rendering', () => {
    it('renders trophy header', () => {
      render(<Top5ShelfGrid items={[]} />);
      expect(screen.getByText('Top 5')).toBeInTheDocument();
    });

    it('renders 5 slots', () => {
      render(<Top5ShelfGrid items={[]} />);
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
      expect(screen.getByText('#4')).toBeInTheDocument();
      expect(screen.getByText('#5')).toBeInTheDocument();
    });

    it('renders empty slots when no items', () => {
      render(<Top5ShelfGrid items={[]} />);
      // Should show 5 empty slot messages
      const emptySlots = screen.getAllByText('Empty slot');
      expect(emptySlots).toHaveLength(5);
    });

    it('renders item count', () => {
      render(<Top5ShelfGrid items={[]} />);
      expect(screen.getByText('0 of 5 ranked')).toBeInTheDocument();
    });

    it('renders correct item count with items', () => {
      const items = [
        createMockItem({ id: 'item-1', order_index: 0 }),
        createMockItem({ id: 'item-2', order_index: 1 }),
      ];
      render(<Top5ShelfGrid items={items} />);
      expect(screen.getByText('2 of 5 ranked')).toBeInTheDocument();
    });

    it('renders items in correct rank positions', () => {
      const items = [
        createMockItem({ id: 'item-1', title: 'Book One', order_index: 0 }),
        createMockItem({ id: 'item-2', title: 'Book Two', order_index: 1 }),
        createMockItem({ id: 'item-3', title: 'Book Three', order_index: 2 }),
      ];
      render(<Top5ShelfGrid items={items} />);

      expect(screen.getByText('Book One')).toBeInTheDocument();
      expect(screen.getByText('Book Two')).toBeInTheDocument();
      expect(screen.getByText('Book Three')).toBeInTheDocument();
    });

    it('renders items sorted by order_index', () => {
      // Items in reverse order
      const items = [
        createMockItem({ id: 'item-3', title: 'Third', order_index: 2 }),
        createMockItem({ id: 'item-1', title: 'First', order_index: 0 }),
        createMockItem({ id: 'item-2', title: 'Second', order_index: 1 }),
      ];
      render(<Top5ShelfGrid items={items} />);

      // All should be rendered
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });

    it('renders empty slots for unfilled positions', () => {
      const items = [
        createMockItem({ id: 'item-1', order_index: 0 }),
        createMockItem({ id: 'item-2', order_index: 1 }),
      ];
      render(<Top5ShelfGrid items={items} />);

      // Should have 3 empty slots
      const emptySlots = screen.getAllByText('Empty slot');
      expect(emptySlots).toHaveLength(3);
    });

    it('shows helper text in edit mode when not full', () => {
      const items = [
        createMockItem({ id: 'item-1', order_index: 0 }),
        createMockItem({ id: 'item-2', order_index: 1 }),
      ];
      render(<Top5ShelfGrid items={items} editMode />);

      expect(screen.getByText(/Add 3 more items to complete your Top 5/)).toBeInTheDocument();
    });

    it('does not show helper text when shelf is full', () => {
      const items = [
        createMockItem({ id: 'item-1', order_index: 0 }),
        createMockItem({ id: 'item-2', order_index: 1 }),
        createMockItem({ id: 'item-3', order_index: 2 }),
        createMockItem({ id: 'item-4', order_index: 3 }),
        createMockItem({ id: 'item-5', order_index: 4 }),
      ];
      render(<Top5ShelfGrid items={items} editMode />);

      expect(screen.queryByText(/Add \d+ more items/)).not.toBeInTheDocument();
    });

    it('does not show helper text in view mode', () => {
      const items = [createMockItem({ id: 'item-1', order_index: 0 })];
      render(<Top5ShelfGrid items={items} />);

      expect(screen.queryByText(/Add \d+ more items/)).not.toBeInTheDocument();
    });

    it('shows "Add an item" text for empty slots in edit mode', () => {
      render(<Top5ShelfGrid items={[]} editMode />);
      const addItemTexts = screen.getAllByText('Add an item');
      expect(addItemTexts).toHaveLength(5);
    });

    it('shows drag hint in edit mode with multiple items', () => {
      const items = [
        createMockItem({ id: 'item-1', order_index: 0 }),
        createMockItem({ id: 'item-2', order_index: 1 }),
      ];
      render(<Top5ShelfGrid items={items} editMode onReorder={vi.fn()} />);

      expect(screen.getByText(/Drag and drop items to reorder/)).toBeInTheDocument();
    });
  });

  describe('Click Behavior', () => {
    it('calls onItemClick when item is clicked', () => {
      const handleClick = vi.fn();
      const item = createMockItem({ id: 'item-1', order_index: 0 });
      render(<Top5ShelfGrid items={[item]} onItemClick={handleClick} />);

      const card = screen.getByText('The Great Gatsby').closest('div[class*="group"]');
      fireEvent.click(card!);
      expect(handleClick).toHaveBeenCalledWith(item);
    });

    it('does not call onItemClick in edit mode', () => {
      const handleClick = vi.fn();
      const item = createMockItem({ id: 'item-1', order_index: 0 });
      render(<Top5ShelfGrid items={[item]} onItemClick={handleClick} editMode />);

      const card = screen.getByText('The Great Gatsby').closest('div[class*="group"]');
      fireEvent.click(card!);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Delete Functionality', () => {
    it('calls onDeleteItem when delete button is clicked', () => {
      const handleDelete = vi.fn();
      const item = createMockItem({ id: 'test-item-123', order_index: 0 });
      render(<Top5ShelfGrid items={[item]} onDeleteItem={handleDelete} editMode />);

      const deleteButton = screen.getByTitle('Delete item');
      fireEvent.click(deleteButton);
      expect(handleDelete).toHaveBeenCalledWith('test-item-123');
    });
  });

  describe('Drag and Drop Functionality', () => {
    it('makes items draggable in edit mode with onReorder', () => {
      const items = [
        createMockItem({ id: 'item-1', order_index: 0 }),
      ];
      render(<Top5ShelfGrid items={items} editMode onReorder={vi.fn()} />);

      const card = screen.getByText('The Great Gatsby').closest('div[class*="group"]');
      expect(card).toHaveAttribute('draggable', 'true');
    });

    it('items are not draggable in view mode', () => {
      const items = [
        createMockItem({ id: 'item-1', order_index: 0 }),
      ];
      render(<Top5ShelfGrid items={items} />);

      const card = screen.getByText('The Great Gatsby').closest('div[class*="group"]');
      expect(card).not.toHaveAttribute('draggable', 'true');
    });

    it('items are not draggable without onReorder handler', () => {
      const items = [
        createMockItem({ id: 'item-1', order_index: 0 }),
      ];
      render(<Top5ShelfGrid items={items} editMode />);

      const card = screen.getByText('The Great Gatsby').closest('div[class*="group"]');
      expect(card).not.toHaveAttribute('draggable', 'true');
    });

    it('calls onReorder when item is dropped on another item', () => {
      const handleReorder = vi.fn();
      const items = [
        createMockItem({ id: 'item-1', title: 'First', order_index: 0 }),
        createMockItem({ id: 'item-2', title: 'Second', order_index: 1 }),
      ];
      render(<Top5ShelfGrid items={items} editMode onReorder={handleReorder} />);

      const firstCard = screen.getByText('First').closest('div[class*="group"]');
      const secondCard = screen.getByText('Second').closest('div[class*="group"]');

      // Simulate drag and drop
      fireEvent.dragStart(firstCard!);
      fireEvent.dragOver(secondCard!);
      fireEvent.drop(secondCard!);

      expect(handleReorder).toHaveBeenCalledWith(['item-2', 'item-1']);
    });
  });
});
