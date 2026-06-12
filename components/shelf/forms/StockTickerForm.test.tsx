import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StockTickerForm } from './StockTickerForm';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function renderComponent(props?: Partial<React.ComponentProps<typeof StockTickerForm>>) {
  const onAdd = vi.fn();
  render(<StockTickerForm onAdd={onAdd} adding={false} {...props} />);
  return { onAdd };
}

describe('StockTickerForm', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('Rendering', () => {
    it('renders ticker input and look up button', () => {
      renderComponent();
      expect(screen.getByPlaceholderText(/ticker symbol/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /look up/i })).toBeInTheDocument();
    });

    it('disables look up button when input is empty', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /look up/i })).toBeDisabled();
    });

    it('disables look up button while looking up', async () => {
      mockFetch.mockResolvedValue({ json: () => new Promise(() => {}) });
      const user = userEvent.setup();
      renderComponent();
      await user.type(screen.getByPlaceholderText(/ticker symbol/i), 'AAPL');
      await user.click(screen.getByRole('button', { name: /look up/i }));
      expect(screen.getByRole('button', { name: /looking up/i })).toBeDisabled();
    });
  });

  describe('Successful lookup with price', () => {
    it('shows preview with price when lookup succeeds', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          data: { name: 'Apple Inc.', price: 192.50, currency: 'USD', logoUrl: null },
        }),
      });
      const user = userEvent.setup();
      renderComponent();
      await user.type(screen.getByPlaceholderText(/ticker symbol/i), 'AAPL');
      await user.click(screen.getByRole('button', { name: /look up/i }));
      await waitFor(() => expect(screen.getByText('Apple Inc.')).toBeInTheDocument());
      expect(screen.getByText(/192\.50 USD/)).toBeInTheDocument();
    });
  });

  describe('Successful lookup without price', () => {
    it('shows preview without price when price is null', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          data: { name: 'Some Corp', price: null, currency: 'USD', logoUrl: null },
        }),
      });
      const user = userEvent.setup();
      renderComponent();
      await user.type(screen.getByPlaceholderText(/ticker symbol/i), 'XYZ');
      await user.click(screen.getByRole('button', { name: /look up/i }));
      await waitFor(() => expect(screen.getByText('Some Corp')).toBeInTheDocument());
      expect(screen.queryByText(/USD/)).not.toBeInTheDocument();
    });
  });

  describe('Failed lookup', () => {
    it('shows error when ticker not found', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ success: false, error: 'Not found' }),
      });
      const user = userEvent.setup();
      renderComponent();
      await user.type(screen.getByPlaceholderText(/ticker symbol/i), 'FAKE');
      await user.click(screen.getByRole('button', { name: /look up/i }));
      await waitFor(() => expect(screen.getByText(/could not find ticker/i)).toBeInTheDocument());
    });

    it('shows error on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('network'));
      const user = userEvent.setup();
      renderComponent();
      await user.type(screen.getByPlaceholderText(/ticker symbol/i), 'AAPL');
      await user.click(screen.getByRole('button', { name: /look up/i }));
      await waitFor(() => expect(screen.getByText(/lookup failed/i)).toBeInTheDocument());
    });
  });

  describe('Add stock', () => {
    it('calls onAdd with ticker and name when Add Stock clicked', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          data: { name: 'Apple Inc.', price: 192.50, currency: 'USD', logoUrl: null },
        }),
      });
      const user = userEvent.setup();
      const { onAdd } = renderComponent();
      await user.type(screen.getByPlaceholderText(/ticker symbol/i), 'AAPL');
      await user.click(screen.getByRole('button', { name: /look up/i }));
      await waitFor(() => screen.getByRole('button', { name: /add stock/i }));
      await user.click(screen.getByRole('button', { name: /add stock/i }));
      expect(onAdd).toHaveBeenCalledWith('AAPL', 'Apple Inc.', null);
    });
  });
});
