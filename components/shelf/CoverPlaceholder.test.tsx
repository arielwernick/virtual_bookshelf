import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CoverPlaceholder, coverColor, COVER_PALETTE } from './CoverPlaceholder';
import { Item } from '@/lib/types/shelf';

function renderComponent(overrides: Partial<Pick<Item, 'title' | 'creator' | 'type'>> = {}) {
  const item = { title: 'Dune', creator: 'Frank Herbert', type: 'book' as const, ...overrides };
  return render(<CoverPlaceholder item={item} />);
}

describe('CoverPlaceholder', () => {
  describe('Rendering', () => {
    it('prints the title and creator', () => {
      renderComponent();

      const cover = screen.getByTestId('cover-placeholder');
      expect(cover).toHaveTextContent('Dune');
      expect(cover).toHaveTextContent('Frank Herbert');
    });

    it('is hidden from screen readers, since the card already names the item', () => {
      renderComponent();

      expect(screen.getByTestId('cover-placeholder')).toHaveAttribute('aria-hidden', 'true');
    });

    it('shows the ticker alone for stocks', () => {
      renderComponent({ type: 'stock', title: 'Apple Inc.', creator: 'AAPL' });

      const cover = screen.getByTestId('cover-placeholder');
      expect(cover).toHaveTextContent('AAPL');
      expect(cover).not.toHaveTextContent('Apple Inc.');
    });

    it('shows the show name alone for podcast episodes', () => {
      renderComponent({ type: 'podcast_episode', title: 'Google: The AI Company', creator: 'Acquired' });

      expect(screen.getByTestId('cover-placeholder')).toHaveTextContent(/^Acquired$/);
    });

    it('falls back to the title for an episode with no show name', () => {
      renderComponent({ type: 'podcast_episode', title: 'Some Episode', creator: '' });

      expect(screen.getByTestId('cover-placeholder')).toHaveTextContent(/^Some Episode$/);
    });
  });

  describe('Edge Cases', () => {
    it('lifts its text clear of a note marker when asked', () => {
      const { container } = render(
        <CoverPlaceholder item={{ title: 'Dune', creator: 'Frank Herbert', type: 'book' }} clearNoteMarker />
      );

      expect(container.querySelector('.pb-\\[30cqw\\]')).toBeInTheDocument();
    });

    it('handles a missing creator', () => {
      renderComponent({ creator: '' });

      expect(screen.getByTestId('cover-placeholder')).toHaveTextContent(/^Dune$/);
    });
  });

  describe('coverColor', () => {
    it('is stable for the same item', () => {
      expect(coverColor('Dune', 'Frank Herbert')).toBe(coverColor('Dune', 'Frank Herbert'));
    });

    it('always returns a palette entry', () => {
      for (const title of ['A', 'Dune', 'The Great Gatsby', '']) {
        expect(COVER_PALETTE).toContain(coverColor(title, null));
      }
    });

    it('spreads different items across colors', () => {
      const titles = Array.from({ length: 40 }, (_, i) => `Title ${i}`);
      const used = new Set(titles.map((t) => coverColor(t, 'Author')));
      expect(used.size).toBeGreaterThan(3);
    });
  });
});
