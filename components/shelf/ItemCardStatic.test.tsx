import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ItemCardStatic } from './ItemCardStatic';
import { Item } from '@/lib/types/shelf';

// Helper to create mock item data
function createMockItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    shelf_id: 'shelf-1',
    user_id: 'user-1',
    type: 'book',
    title: 'The Great Gatsby',
    creator: 'F. Scott Fitzgerald',
    image_url: 'https://example.com/image.jpg',
    external_url: 'https://example.com',
    notes: 'A classic American novel',
    rating: 4,
    order_index: 0,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('ItemCardStatic', () => {
  describe('Rendering', () => {
    it('renders item title', () => {
      render(<ItemCardStatic item={createMockItem({ title: 'Test Book Title' })} />);
      expect(screen.getByText('Test Book Title')).toBeInTheDocument();
    });

    it('renders item creator', () => {
      render(<ItemCardStatic item={createMockItem({ creator: 'Test Author' })} />);
      expect(screen.getByText('Test Author')).toBeInTheDocument();
    });

    it('renders item type badge', () => {
      render(<ItemCardStatic item={createMockItem({ type: 'podcast' })} />);
      expect(screen.getByText('podcast')).toBeInTheDocument();
    });

    it('renders notes when present', () => {
      render(<ItemCardStatic item={createMockItem({ notes: 'My review note' })} />);
      expect(screen.getByText(/My review note/)).toBeInTheDocument();
    });

    it('does not render notes section when notes are empty', () => {
      render(<ItemCardStatic item={createMockItem({ notes: null })} />);
      expect(screen.queryByText(/"/)).not.toBeInTheDocument();
    });

    it('renders rating stars when rating is present', () => {
      render(<ItemCardStatic item={createMockItem({ rating: 4 })} />);
      expect(screen.getByRole('img', { name: /4 out of 5 stars/i })).toBeInTheDocument();
    });

    it('does not render rating when null', () => {
      render(<ItemCardStatic item={createMockItem({ rating: null })} />);
      expect(screen.queryByRole('img', { name: /stars/i })).not.toBeInTheDocument();
    });
  });

  describe('Data Attributes', () => {
    it('includes data-item-id attribute', () => {
      render(<ItemCardStatic item={createMockItem({ id: 'test-item-123' })} />);
      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('data-item-id', 'test-item-123');
    });

    it('includes data-item-type attribute', () => {
      render(<ItemCardStatic item={createMockItem({ type: 'music' })} />);
      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('data-item-type', 'music');
    });
  });

  describe('Accessibility', () => {
    it('uses article element as semantic container', () => {
      render(<ItemCardStatic item={createMockItem()} />);
      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('renders image with alt text', () => {
      render(<ItemCardStatic item={createMockItem({ title: 'Book Title' })} />);
      expect(screen.getByAltText('Book Title')).toBeInTheDocument();
    });
  });

  describe('Image Handling', () => {
    it('renders image when image_url is provided', () => {
      render(<ItemCardStatic item={createMockItem({ image_url: 'https://example.com/cover.jpg' })} />);
      const img = screen.getByRole('img', { name: /gatsby/i });
      expect(img).toHaveAttribute('src', 'https://example.com/cover.jpg');
    });

    it('renders fallback icon when no image_url', () => {
      render(<ItemCardStatic item={createMockItem({ image_url: null, rating: null })} />);
      // Should not have an actual img element
      expect(screen.queryByRole('img', { name: /gatsby/i })).not.toBeInTheDocument();
      // Check for SVG fallback icon in the image container
      const article = screen.getByRole('article');
      expect(article.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Type-specific Styling', () => {
    it('applies correct badge color for book type', () => {
      render(<ItemCardStatic item={createMockItem({ type: 'book' })} />);
      const badge = screen.getByText('book');
      expect(badge).toHaveClass('bg-blue-100');
    });

    it('applies correct badge color for podcast type', () => {
      render(<ItemCardStatic item={createMockItem({ type: 'podcast' })} />);
      const badge = screen.getByText('podcast');
      expect(badge).toHaveClass('bg-purple-100');
    });

    it('applies correct badge color for music type', () => {
      render(<ItemCardStatic item={createMockItem({ type: 'music' })} />);
      const badge = screen.getByText('music');
      expect(badge).toHaveClass('bg-green-100');
    });
  });
});
