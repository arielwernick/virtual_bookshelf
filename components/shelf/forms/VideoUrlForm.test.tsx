import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoUrlForm } from './VideoUrlForm';

describe('VideoUrlForm', () => {
  const mockSetVideoUrl = vi.fn();
  const mockOnSubmit = vi.fn();

  const defaultProps = {
    videoUrl: '',
    setVideoUrl: mockSetVideoUrl,
    onSubmit: mockOnSubmit,
    fetching: false,
  };

  it('renders URL input', () => {
    render(<VideoUrlForm {...defaultProps} />);
    expect(screen.getByPlaceholderText(/paste youtube url/i)).toBeInTheDocument();
  });

  it('renders Add Video button', () => {
    render(<VideoUrlForm {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Add Video' })).toBeInTheDocument();
  });

  it('renders supported formats help text', () => {
    render(<VideoUrlForm {...defaultProps} />);
    expect(screen.getByText(/supported formats/i)).toBeInTheDocument();
  });

  it('calls setVideoUrl when typing', async () => {
    const user = userEvent.setup();
    render(<VideoUrlForm {...defaultProps} />);

    await user.type(
      screen.getByPlaceholderText(/paste youtube url/i),
      'https://youtube.com/watch?v=test'
    );

    expect(mockSetVideoUrl).toHaveBeenCalled();
  });

  it('calls onSubmit when button clicked', async () => {
    const user = userEvent.setup();
    render(<VideoUrlForm {...defaultProps} videoUrl="https://youtube.com/watch?v=test" />);

    await user.click(screen.getByRole('button', { name: 'Add Video' }));

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('calls onSubmit when Enter pressed', async () => {
    const user = userEvent.setup();
    render(<VideoUrlForm {...defaultProps} />);

    await user.type(screen.getByPlaceholderText(/paste youtube url/i), '{Enter}');

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('shows fetching state', () => {
    render(<VideoUrlForm {...defaultProps} fetching={true} />);
    expect(screen.getByText('Fetching...')).toBeInTheDocument();
  });

  it('disables button when fetching', () => {
    render(<VideoUrlForm {...defaultProps} fetching={true} />);
    expect(screen.getByRole('button', { name: 'Fetching...' })).toBeDisabled();
  });

  it('disables button when URL is empty', () => {
    render(<VideoUrlForm {...defaultProps} videoUrl="" />);
    expect(screen.getByRole('button', { name: 'Add Video' })).toBeDisabled();
  });
});
