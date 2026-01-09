import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManualEntryForm } from './ManualEntryForm';

describe('ManualEntryForm', () => {
  const mockSetManualData = vi.fn();
  const mockOnSubmit = vi.fn();

  const defaultProps = {
    itemType: 'book' as const,
    manualData: {
      title: '',
      creator: '',
      image_url: '',
      external_url: '',
      notes: '',
      rating: null,
    },
    setManualData: mockSetManualData,
    onSubmit: mockOnSubmit,
    adding: false,
  };

  it('renders title input', () => {
    render(<ManualEntryForm {...defaultProps} />);
    expect(screen.getByText(/title/i)).toBeInTheDocument();
  });

  it('renders Author label for books', () => {
    render(<ManualEntryForm {...defaultProps} itemType="book" />);
    expect(screen.getByText(/author/i)).toBeInTheDocument();
  });

  it('renders Host label for podcasts', () => {
    render(<ManualEntryForm {...defaultProps} itemType="podcast" />);
    expect(screen.getByText(/host/i)).toBeInTheDocument();
  });

  it('renders Artist label for music', () => {
    render(<ManualEntryForm {...defaultProps} itemType="music" />);
    expect(screen.getByText(/artist/i)).toBeInTheDocument();
  });

  it('renders optional fields', () => {
    render(<ManualEntryForm {...defaultProps} />);
    expect(screen.getByText(/image url/i)).toBeInTheDocument();
    expect(screen.getByText(/external url/i)).toBeInTheDocument();
    expect(screen.getByText(/notes/i)).toBeInTheDocument();
    expect(screen.getByText(/rating/i)).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<ManualEntryForm {...defaultProps} />);
    expect(screen.getByRole('button', { name: /add to shelf/i })).toBeInTheDocument();
  });

  it('calls onSubmit when submit clicked', async () => {
    const user = userEvent.setup();
    render(<ManualEntryForm {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /add to shelf/i }));

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('shows adding state', () => {
    render(<ManualEntryForm {...defaultProps} adding={true} />);
    expect(screen.getByRole('button', { name: /adding/i })).toBeInTheDocument();
  });

  it('disables button when adding', () => {
    render(<ManualEntryForm {...defaultProps} adding={true} />);
    expect(screen.getByRole('button', { name: /adding/i })).toBeDisabled();
  });

  it('calls setManualData when title changes', async () => {
    const user = userEvent.setup();
    render(<ManualEntryForm {...defaultProps} />);

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], 'Test Title');

    expect(mockSetManualData).toHaveBeenCalled();
  });
});
