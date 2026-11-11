import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddedItemPrompt } from './AddedItemPrompt';

const fetchMock = vi.fn();

function renderComponent(props: Partial<React.ComponentProps<typeof AddedItemPrompt>> = {}) {
  return render(
    <AddedItemPrompt item={{ id: 'item-1', title: 'Deep Work' }} count={1} {...props} />
  );
}

describe('AddedItemPrompt', () => {
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    vi.stubGlobal('fetch', fetchMock);
  });

  describe('Rendering', () => {
    it('confirms the add and invites another', () => {
      renderComponent({ count: 3 });

      expect(screen.getByRole('status')).toHaveTextContent('Added “Deep Work”.');
      expect(screen.getByRole('status')).toHaveTextContent('3 items so far.');
      expect(screen.getByLabelText(/Why this one\?/)).toBeInTheDocument();
    });

    it('renders nothing before anything is added', () => {
      const { container } = renderComponent({ count: 0, item: undefined });
      expect(container).toBeEmptyDOMElement();
    });

    it('confirms without a note box when the created item is unknown', () => {
      renderComponent({ item: undefined });

      expect(screen.getByRole('status')).toHaveTextContent('Added.');
      expect(screen.queryByLabelText(/Why this one\?/)).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('saves the note to the item that was just added', async () => {
      const onNoteSaved = vi.fn();
      renderComponent({ onNoteSaved });

      await userEvent.type(screen.getByLabelText(/Why this one\?/), '  Changed my week  ');
      await userEvent.click(screen.getByRole('button', { name: 'Save note' }));

      await waitFor(() => expect(screen.getByText('Note saved.')).toBeInTheDocument());
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/items/item-1',
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ notes: 'Changed my week' }) })
      );
      expect(onNoteSaved).toHaveBeenCalledTimes(1);
    });

    it('saves on Enter', async () => {
      renderComponent();

      await userEvent.type(screen.getByLabelText(/Why this one\?/), 'A reason{Enter}');

      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    });

    it('does not save an empty note', async () => {
      renderComponent();

      expect(screen.getByRole('button', { name: 'Save note' })).toBeDisabled();
      await userEvent.type(screen.getByLabelText(/Why this one\?/), '   {Enter}');

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('clears the note box when another item is added', async () => {
      const { rerender } = renderComponent();
      await userEvent.type(screen.getByLabelText(/Why this one\?/), 'For the first item');

      rerender(<AddedItemPrompt item={{ id: 'item-2', title: 'Dune' }} count={2} />);

      expect(screen.getByLabelText(/Why this one\?/)).toHaveValue('');
      expect(screen.getByRole('status')).toHaveTextContent('Added “Dune”.');
    });
  });

  describe('Edge Cases', () => {
    it('says so when the note cannot be saved, and keeps the text', async () => {
      fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });
      renderComponent();

      await userEvent.type(screen.getByLabelText(/Why this one\?/), 'A reason');
      await userEvent.click(screen.getByRole('button', { name: 'Save note' }));

      await waitFor(() => expect(screen.getByText(/could not be saved/)).toBeInTheDocument());
      expect(screen.getByLabelText(/Why this one\?/)).toHaveValue('A reason');
    });
  });
});
