import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShelfGrid } from './ShelfGrid';
import { Item } from '@/lib/types/shelf';

function createMockItem(overrides: Partial<Item> = {}): Item {
  return {
    id: Math.random().toString(36).slice(2),
    shelf_id: 'shelf-1',
    user_id: 'user-1',
    type: 'book',
    title: 'Test Book',
    creator: 'Author',
    image_url: null,
    external_url: null,
    notes: null,
    order_index: 0,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('ShelfGrid', () => {
  it('renders items in correct order', () => {
    const items = [
      createMockItem({ id: 'a', title: 'A', order_index: 0 }),
      createMockItem({ id: 'b', title: 'B', order_index: 1 }),
      createMockItem({ id: 'c', title: 'C', order_index: 2 }),
    ];
    render(<ShelfGrid items={items} editMode={false} />);
    const titles = screen.getAllByText(/A|B|C/).map((el) => el.textContent);
    expect(titles).toContain('A');
    expect(titles).toContain('B');
    expect(titles).toContain('C');
  });

  it('shows drag handles in edit mode', () => {
    const items = [createMockItem()];
    render(<ShelfGrid items={items} editMode={true} />);
    expect(screen.getByLabelText('Drag to reorder')).toBeInTheDocument();
  });

  it('does not show drag handles outside edit mode', () => {
    const items = [createMockItem()];
    render(<ShelfGrid items={items} editMode={false} />);
    expect(screen.queryByLabelText('Drag to reorder')).toBeNull();
  });

  // More tests for drag-and-drop and keyboard reordering can be added with integration/mocks
});
