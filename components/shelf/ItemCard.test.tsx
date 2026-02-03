import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemCard } from './ItemCard';
import { ShelfProvider } from '@/lib/contexts/ShelfContext';
import { createMockItem } from '@/test/utils/mocks';
import { Item } from '@/lib/types/shelf';
import { ReactNode } from 'react';

// Helper to wrap ItemCard with ShelfProvider
interface RenderOptions {
  editMode?: boolean;
  onItemClick?: (item: Item) => void;
  onDeleteItem?: (itemId: string) => void;
  onEditNote?: (item: Item) => void;
}

function renderWithProvider(
  children: ReactNode,
  options: RenderOptions = {}
) {
  const { editMode = false, onItemClick, onDeleteItem, onEditNote } = options;
  return render(
    <ShelfProvider
      editMode={editMode}
      onItemClick={onItemClick}
      onDeleteItem={onDeleteItem}
      onEditNote={onEditNote}
    >
      {children}
    </ShelfProvider>
  );
}

describe('ItemCard', () => {
  describe('Rendering', () => {
    it('renders item title', () => {
      renderWithProvider(<ItemCard item={createMockItem({ title: 'Test Book Title' })} />);

      expect(screen.getByText('Test Book Title')).toBeInTheDocument();
    });

    it('renders item creator', () => {
      renderWithProvider(<ItemCard item={createMockItem({ creator: 'Test Author' })} />);

      expect(screen.getByText('Test Author')).toBeInTheDocument();
    });

    it('renders item type badge', () => {
      renderWithProvider(<ItemCard item={createMockItem({ type: 'book' })} />);

      expect(screen.getByText('book')).toBeInTheDocument();
    });

    it('renders different type badges correctly', () => {
      const { rerender } = render(
        <ShelfProvider>
          <ItemCard item={createMockItem({ type: 'podcast' })} />
        </ShelfProvider>
      );
      expect(screen.getByText('podcast')).toBeInTheDocument();

      rerender(
        <ShelfProvider>
          <ItemCard item={createMockItem({ type: 'music' })} />
        </ShelfProvider>
      );
      expect(screen.getByText('music')).toBeInTheDocument();

      rerender(
        <ShelfProvider>
          <ItemCard item={createMockItem({ type: 'video' })} />
        </ShelfProvider>
      );
      expect(screen.getByText('video')).toBeInTheDocument();
    });

    it('renders image when provided', () => {
      renderWithProvider(
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
      renderWithProvider(<ItemCard item={createMockItem({ image_url: null })} />);

      // Check for SVG fallback icon
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('has lazy loading on image', () => {
      renderWithProvider(
        <ItemCard
          item={createMockItem({ image_url: 'https://example.com/image.jpg' })}
        />
      );

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'lazy');
    });
  });

  describe('Click Behavior', () => {
    it('calls onItemClick when clicked', () => {
      const onItemClick = vi.fn();
      renderWithProvider(
        <ItemCard item={createMockItem()} />,
        { onItemClick }
      );

      fireEvent.click(screen.getByText('The Great Gatsby'));

      expect(onItemClick).toHaveBeenCalledTimes(1);
    });

    it('has cursor-pointer when clickable', () => {
      renderWithProvider(
        <ItemCard item={createMockItem()} />,
        { onItemClick: () => {} }
      );

      const card = screen.getByText('The Great Gatsby').closest('div[class*="cursor-pointer"]');
      expect(card).toBeInTheDocument();
    });

    it('does not call onItemClick in edit mode', () => {
      const onItemClick = vi.fn();
      renderWithProvider(
        <ItemCard item={createMockItem()} />,
        { onItemClick, editMode: true }
      );

      fireEvent.click(screen.getByText('The Great Gatsby'));

      expect(onItemClick).not.toHaveBeenCalled();
    });

    it('does not have cursor-pointer when not clickable', () => {
      renderWithProvider(<ItemCard item={createMockItem()} />);

      const card = screen.getByText('The Great Gatsby').parentElement?.parentElement;
      expect(card?.className).not.toContain('cursor-pointer');
    });
  });

  describe('Edit Mode', () => {
    it('shows delete button in edit mode', () => {
      const onDeleteItem = vi.fn();
      renderWithProvider(
        <ItemCard item={createMockItem()} />,
        { editMode: true, onDeleteItem }
      );

      const deleteButton = screen.getByTitle('Delete item');
      expect(deleteButton).toBeInTheDocument();
    });

    it('hides delete button when not in edit mode', () => {
      const onDeleteItem = vi.fn();
      renderWithProvider(
        <ItemCard item={createMockItem()} />,
        { onDeleteItem }
      );

      expect(screen.queryByTitle('Delete item')).not.toBeInTheDocument();
    });

    it('calls onDeleteItem when delete button clicked', () => {
      const onDeleteItem = vi.fn();
      renderWithProvider(
        <ItemCard item={createMockItem()} />,
        { editMode: true, onDeleteItem }
      );

      fireEvent.click(screen.getByTitle('Delete item'));

      expect(onDeleteItem).toHaveBeenCalledTimes(1);
    });

    it('stops propagation when delete button clicked', () => {
      const onItemClick = vi.fn();
      const onDeleteItem = vi.fn();
      renderWithProvider(
        <ItemCard item={createMockItem()} />,
        { onItemClick, editMode: true, onDeleteItem }
      );

      fireEvent.click(screen.getByTitle('Delete item'));

      expect(onDeleteItem).toHaveBeenCalled();
      expect(onItemClick).not.toHaveBeenCalled();
    });
  });

  describe('Type Badge Colors', () => {
    it('applies blue color for book type', () => {
      renderWithProvider(<ItemCard item={createMockItem({ type: 'book' })} />);

      const badge = screen.getByText('book');
      expect(badge.className).toContain('bg-blue-100');
      expect(badge.className).toContain('text-blue-800');
    });

    it('applies purple color for podcast type', () => {
      renderWithProvider(<ItemCard item={createMockItem({ type: 'podcast' })} />);

      const badge = screen.getByText('podcast');
      expect(badge.className).toContain('bg-purple-100');
      expect(badge.className).toContain('text-purple-800');
    });

    it('applies green color for music type', () => {
      renderWithProvider(<ItemCard item={createMockItem({ type: 'music' })} />);

      const badge = screen.getByText('music');
      expect(badge.className).toContain('bg-green-100');
      expect(badge.className).toContain('text-green-800');
    });
  });

  describe('Note Preview', () => {
    it('renders note preview when item has notes in non-edit mode', () => {
      renderWithProvider(<ItemCard item={createMockItem({ notes: 'Some notes here' })} />);

      const notePreview = screen.getByTestId('note-preview');
      expect(notePreview).toBeInTheDocument();
      expect(notePreview).toHaveTextContent('Some notes here');
    });

    it('does not show note preview when item has no notes', () => {
      renderWithProvider(<ItemCard item={createMockItem({ notes: null })} />);

      expect(screen.queryByTestId('note-preview')).not.toBeInTheDocument();
    });

    it('does not show note preview when notes is empty string', () => {
      renderWithProvider(<ItemCard item={createMockItem({ notes: '' })} />);

      expect(screen.queryByTestId('note-preview')).not.toBeInTheDocument();
    });

    it('does not show note preview in edit mode even when item has notes', () => {
      renderWithProvider(
        <ItemCard item={createMockItem({ notes: 'Some notes' })} />,
        { editMode: true, onEditNote: () => {} }
      );

      expect(screen.queryByTestId('note-preview')).not.toBeInTheDocument();
    });
  });

  describe('Note Edit Button (Edit Mode)', () => {
    it('shows edit note button in edit mode when item has notes', () => {
      const onEditNote = vi.fn();
      renderWithProvider(
        <ItemCard item={createMockItem({ notes: 'Some notes' })} />,
        { editMode: true, onEditNote }
      );

      const editNoteButton = screen.getByTestId('edit-note-button');
      expect(editNoteButton).toBeInTheDocument();
      expect(editNoteButton).toHaveAttribute('title', 'Edit note');
    });

    it('shows add note button in edit mode when item has no notes', () => {
      const onEditNote = vi.fn();
      renderWithProvider(
        <ItemCard item={createMockItem({ notes: null })} />,
        { editMode: true, onEditNote }
      );

      const addNoteButton = screen.getByTestId('add-note-button');
      expect(addNoteButton).toBeInTheDocument();
      expect(addNoteButton).toHaveAttribute('title', 'Add note');
    });

    it('calls onEditNote when edit note button is clicked', () => {
      const onEditNote = vi.fn();
      renderWithProvider(
        <ItemCard item={createMockItem({ notes: 'Some notes' })} />,
        { editMode: true, onEditNote }
      );

      fireEvent.click(screen.getByTestId('edit-note-button'));
      expect(onEditNote).toHaveBeenCalledTimes(1);
    });

    it('calls onEditNote when add note button is clicked', () => {
      const onEditNote = vi.fn();
      renderWithProvider(
        <ItemCard item={createMockItem({ notes: null })} />,
        { editMode: true, onEditNote }
      );

      fireEvent.click(screen.getByTestId('add-note-button'));
      expect(onEditNote).toHaveBeenCalledTimes(1);
    });

    it('does not show note edit button when not in edit mode', () => {
      const onEditNote = vi.fn();
      renderWithProvider(
        <ItemCard item={createMockItem({ notes: 'Some notes' })} />,
        { onEditNote }
      );

      expect(screen.queryByTestId('edit-note-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('add-note-button')).not.toBeInTheDocument();
    });

    it('does not show note edit button when onEditNote is not provided', () => {
      renderWithProvider(
        <ItemCard item={createMockItem({ notes: 'Some notes' })} />,
        { editMode: true }
      );

      expect(screen.queryByTestId('edit-note-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('add-note-button')).not.toBeInTheDocument();
    });

    it('stops propagation when note edit button is clicked', () => {
      const onItemClick = vi.fn();
      const onEditNote = vi.fn();
      renderWithProvider(
        <ItemCard item={createMockItem({ notes: 'Some notes' })} />,
        { onItemClick, editMode: true, onEditNote }
      );

      fireEvent.click(screen.getByTestId('edit-note-button'));

      expect(onEditNote).toHaveBeenCalled();
      expect(onItemClick).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Accessibility', () => {
    it('is keyboard focusable when clickable', () => {
      const onItemClick = vi.fn();
      renderWithProvider(
        <ItemCard item={createMockItem()} />,
        { onItemClick }
      );

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('is not focusable when not clickable', () => {
      renderWithProvider(<ItemCard item={createMockItem()} />);

      const card = screen.getByText('The Great Gatsby').closest('div');
      expect(card).not.toHaveAttribute('tabIndex');
      expect(card).not.toHaveAttribute('role', 'button');
    });

    it('calls onItemClick when Enter key is pressed', () => {
      const onItemClick = vi.fn();
      renderWithProvider(
        <ItemCard item={createMockItem()} />,
        { onItemClick }
      );

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(onItemClick).toHaveBeenCalledTimes(1);
    });

    it('calls onItemClick when Space key is pressed', () => {
      const onItemClick = vi.fn();
      renderWithProvider(
        <ItemCard item={createMockItem()} />,
        { onItemClick }
      );

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: ' ' });

      expect(onItemClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onItemClick for other keys', () => {
      const onItemClick = vi.fn();
      renderWithProvider(
        <ItemCard item={createMockItem()} />,
        { onItemClick }
      );

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'a' });
      fireEvent.keyDown(card, { key: 'Escape' });

      expect(onItemClick).not.toHaveBeenCalled();
    });

    it('does not call onItemClick on keyboard press in edit mode', () => {
      const onItemClick = vi.fn();
      renderWithProvider(
        <ItemCard item={createMockItem()} />,
        { onItemClick, editMode: true }
      );

      const card = screen.getByText('The Great Gatsby').closest('div');
      fireEvent.keyDown(card!, { key: 'Enter' });

      expect(onItemClick).not.toHaveBeenCalled();
    });

    it('has accessible label', () => {
      const onItemClick = vi.fn();
      renderWithProvider(
        <ItemCard item={createMockItem({ title: 'Test Title' })} />,
        { onItemClick }
      );

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-label', 'View details for Test Title');
    });

    it('shows focus ring when focused', () => {
      const onItemClick = vi.fn();
      renderWithProvider(
        <ItemCard item={createMockItem()} />,
        { onItemClick }
      );

      const card = screen.getByRole('button');
      expect(card.className).toContain('focus-within:ring-2');
      expect(card.className).toContain('focus-within:ring-gray-500');
    });
  });
});
