import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import PrivacyPage, { metadata } from './page';

function renderComponent() {
  return render(<PrivacyPage />);
}

describe('PrivacyPage', () => {
  describe('Rendering', () => {
    it('has one h1', () => {
      renderComponent();
      const headings = screen.getAllByRole('heading', { level: 1 });
      expect(headings).toHaveLength(1);
      expect(headings[0]).toHaveTextContent('Privacy');
    });

    it('shows a machine-readable last updated date', () => {
      renderComponent();
      const date = screen.getByText('November 21, 2026');
      expect(date.tagName).toBe('TIME');
      expect(date).toHaveAttribute('datetime', '2026-11-21');
      expect(date.parentElement).toHaveTextContent(/^Last updated:/);
    });

    it.each([
      'What we store when you create an account',
      'Staying signed in',
      'Where you came from',
      'What you put on your shelves',
      'Cookies and browser storage',
      'View counts',
      'Rate limits and your IP address',
      'Outside services that receive data',
      'Connecting an AI assistant',
      'Who can see your data',
      'Exporting and deleting your data',
      'Changes to this page',
      'Contact',
    ])('has the "%s" section', (title) => {
      renderComponent();
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
    });

    it('names every cookie the site sets', () => {
      renderComponent();
      for (const name of ['better-auth.session_token', 'better-auth.state', 'vb_attribution']) {
        expect(screen.getByText(name)).toBeInTheDocument();
      }
    });

    it('names the outside services that receive data', () => {
      renderComponent();
      const section = screen
        .getByRole('heading', { name: 'Outside services that receive data' })
        .closest('section') as HTMLElement;
      for (const name of ['Vercel', 'Neon', 'Upstash', 'Google', 'Cloudflare', 'Resend', 'Google Books', 'Spotify', 'YouTube', 'Microlink', 'Yahoo Finance']) {
        expect(within(section).getByText(name, { selector: 'strong' })).toBeInTheDocument();
      }
    });

    it('sets a title and description', () => {
      expect(metadata.title).toBe('Privacy');
      expect(String(metadata.description).length).toBeGreaterThan(50);
      expect(metadata.alternates?.canonical).toBe('/privacy');
    });
  });

  describe('Interactions', () => {
    it('links to the Terms page and back home', () => {
      renderComponent();
      const main = screen.getByRole('main');
      expect(within(main).getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
      expect(within(main).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    });

    it('has the legal links in the footer', () => {
      renderComponent();
      const legal = screen.getByRole('navigation', { name: 'Legal' });
      expect(within(legal).getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
      expect(within(legal).getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
    });
  });

  describe('Edge Cases', () => {
    it('has no placeholders left', () => {
      renderComponent();
      expect(screen.queryAllByTestId('legal-placeholder')).toHaveLength(0);
    });

    it('gives the project contact address and no other email address', () => {
      const { container } = renderComponent();
      expect(screen.getByRole('link', { name: 'hello@virtualbookshelf.app' })).toHaveAttribute(
        'href',
        'mailto:hello@virtualbookshelf.app'
      );
      const rest = (container.textContent ?? '').replaceAll('hello@virtualbookshelf.app', '');
      expect(rest).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]/i);
    });

    it('no longer describes the cookie sign-in that Better Auth replaced', () => {
      const { container } = renderComponent();
      expect(container.textContent).not.toContain('bookshelf_session');
      expect(container.textContent).not.toContain('oauth_state');
    });

    it('discloses that sessions record the IP address and browser', () => {
      renderComponent();
      const section = screen.getByRole('heading', { name: 'Staying signed in' }).closest('section') as HTMLElement;
      expect(section).toHaveTextContent(/IP address and browser details/);
    });

    it('says plainly that there is no account delete button', () => {
      renderComponent();
      expect(screen.getByText(/There is no delete button yet/)).toBeInTheDocument();
    });
  });
});
