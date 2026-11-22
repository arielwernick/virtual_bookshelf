import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import TermsPage, { metadata } from './page';

function renderComponent() {
  return render(<TermsPage />);
}

describe('TermsPage', () => {
  describe('Rendering', () => {
    it('has one h1', () => {
      renderComponent();
      const headings = screen.getAllByRole('heading', { level: 1 });
      expect(headings).toHaveLength(1);
      expect(headings[0]).toHaveTextContent('Terms');
    });

    it('shows a machine-readable last updated date', () => {
      renderComponent();
      const date = screen.getByText('November 16, 2026');
      expect(date.tagName).toBe('TIME');
      expect(date).toHaveAttribute('datetime', '2026-11-16');
    });

    it.each([
      'The service',
      'Your account',
      'Acceptable use',
      'Your content stays yours',
      'Public shelves are public',
      'No warranty',
      'Leaving',
      'Changes to these terms',
      'Governing law',
      'Contact',
    ])('has the "%s" section', (title) => {
      renderComponent();
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
    });

    it('says public shelves are open to search engines and AI crawlers', () => {
      renderComponent();
      expect(screen.getByText(/search engines and AI crawlers/)).toBeInTheDocument();
    });

    it('sets a title and description', () => {
      expect(metadata.title).toBe('Terms');
      expect(String(metadata.description).length).toBeGreaterThan(50);
      expect(metadata.alternates?.canonical).toBe('/terms');
    });
  });

  describe('Interactions', () => {
    it('links to the Privacy page', () => {
      renderComponent();
      const main = screen.getByRole('main');
      expect(within(main).getByRole('link', { name: 'Privacy page' })).toHaveAttribute('href', '/privacy');
    });

    it('has the legal links in the footer', () => {
      renderComponent();
      const legal = screen.getByRole('navigation', { name: 'Legal' });
      expect(within(legal).getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
      expect(within(legal).getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
    });
  });

  describe('Edge Cases', () => {
    it('marks governing law as the only placeholder', () => {
      renderComponent();
      const texts = screen.getAllByTestId('legal-placeholder').map((el) => el.textContent);
      expect(texts).toEqual(['[governing law and location to be added]']);
    });

    it('names no company and gives only the project contact address', () => {
      const { container } = renderComponent();
      expect(container.textContent).not.toMatch(/\b(Inc|LLC|Ltd|GmbH)\b/);
      expect(screen.getByRole('link', { name: 'hello@virtualbookshelf.app' })).toHaveAttribute(
        'href',
        'mailto:hello@virtualbookshelf.app'
      );
      const rest = (container.textContent ?? '').replaceAll('hello@virtualbookshelf.app', '');
      expect(rest).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]/i);
    });
  });
});
