import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

// The real form talks to search APIs. A stand-in with one button is enough to
// drive the modal: clicking it reports an item as added.
vi.mock('@/components/shelf/AddItemForm', () => ({
  AddItemForm: ({ onItemAdded }: { onItemAdded: (item?: { id: string; title: string }) => void }) => (
    <button onClick={() => onItemAdded({ id: 'item-1', title: 'Deep Work' })}>Add a test item</button>
  ),
}));

import { AddItemModal } from './AddItemModal';

function renderComponent(props: Partial<React.ComponentProps<typeof AddItemModal>> = {}) {
  const onItemAdded = vi.fn();
  const onClose = vi.fn();
  render(
    <AddItemModal
      isOpen
      onClose={onClose}
      shelfId="shelf-1"
      shelfName="Favorite Books"
      onItemAdded={onItemAdded}
      {...props}
    />
  );
  return { onItemAdded, onClose };
}

describe('AddItemModal', () => {
  beforeEach(() => {
    push.mockReset();
  });

  describe('Rendering', () => {
    it('invites the first item, with a real apostrophe', () => {
      renderComponent();

      expect(screen.getByText("Let's add your first item ✨")).toBeInTheDocument();
      expect(screen.queryByText(/&apos;/)).not.toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('stays open after an add, confirms it and offers a note', async () => {
      const { onItemAdded } = renderComponent();

      await userEvent.click(screen.getByRole('button', { name: 'Add a test item' }));

      expect(screen.getByRole('status')).toHaveTextContent('Added “Deep Work”.');
      expect(screen.getByLabelText(/Why this one\?/)).toBeInTheDocument();
      expect(screen.getByText('Keep going, add another')).toBeInTheDocument();
      expect(onItemAdded).toHaveBeenCalledTimes(1);
      // The old behaviour was to leave for the read-only shelf page
      expect(push).not.toHaveBeenCalled();
    });

    it('counts several adds in a row', async () => {
      renderComponent();
      const add = screen.getByRole('button', { name: 'Add a test item' });

      await userEvent.click(add);
      await userEvent.click(add);
      await userEvent.click(add);

      expect(screen.getByRole('status')).toHaveTextContent('3 items so far.');
    });

    it('Done leads to the edit page once something is on the shelf', async () => {
      renderComponent();

      await userEvent.click(screen.getByRole('button', { name: 'Add a test item' }));
      await userEvent.click(screen.getByRole('button', { name: 'Done' }));

      expect(push).toHaveBeenCalledWith('/shelf/shelf-1/edit');
    });

    it('with nothing added, the buttons view the empty shelf or close', async () => {
      const { onClose } = renderComponent();

      await userEvent.click(screen.getByRole('button', { name: 'View Empty Shelf' }));
      expect(push).toHaveBeenCalledWith('/shelf/shelf-1');

      await userEvent.click(screen.getByRole('button', { name: 'Add Items Later' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
