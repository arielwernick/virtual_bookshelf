import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Navigation } from './Navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('Navigation', () => {
  beforeEach(() => {
    // Mock fetch for auth check
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ authenticated: false }),
      } as unknown as Response)
    );
  });

  describe('Skip Link', () => {
    it('renders skip to main content link', () => {
      render(<Navigation />);
      
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
    });

    it('skip link has correct href', () => {
      render(<Navigation />);
      
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('skip link is visually hidden by default', () => {
      render(<Navigation />);
      
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink.className).toContain('sr-only');
    });

    it('skip link becomes visible on focus', () => {
      render(<Navigation />);
      
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink.className).toContain('focus:not-sr-only');
      expect(skipLink.className).toContain('focus:absolute');
    });
  });

  describe('Branding', () => {
    it('renders Virtual Bookshelf logo', () => {
      render(<Navigation />);
      
      const logo = screen.getByTitle('Virtual Bookshelf');
      expect(logo).toBeInTheDocument();
    });

    it('logo links to home page', () => {
      render(<Navigation />);
      
      const logo = screen.getByTitle('Virtual Bookshelf');
      expect(logo).toHaveAttribute('href', '/');
    });
  });

  describe('Authentication State', () => {
    it('shows sign in link when not logged in', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ authenticated: false }),
        } as unknown as Response)
      );

      render(<Navigation />);

      expect(await screen.findByText('Sign In')).toBeInTheDocument();
    });

    it('shows dashboard and sign out when logged in', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ authenticated: true }),
        } as unknown as Response)
      );

      render(<Navigation />);

      expect(await screen.findByText('Dashboard')).toBeInTheDocument();
      expect(await screen.findByText('Sign Out')).toBeInTheDocument();
    });
  });
});
