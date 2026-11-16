import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SignupClient from './SignupClient';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

function renderComponent() {
  return render(<SignupClient />);
}

describe('SignupClient', () => {
  describe('Rendering', () => {
    it('shows the sign-up form', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
    });

    it('says that creating an account means agreeing to the terms', () => {
      renderComponent();
      expect(screen.getByText(/By creating an account you agree to the/)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('links to the Terms and Privacy pages', () => {
      renderComponent();
      expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
      expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
    });
  });

  describe('Edge Cases', () => {
    it('keeps the agreement line outside the form, so it is shown for Google sign-up too', () => {
      renderComponent();
      const line = screen.getByText(/By creating an account you agree to the/);
      expect(line.closest('form')).toBeNull();
    });
  });
});
