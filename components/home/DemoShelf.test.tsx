import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DemoShelf } from './DemoShelf';
import { Item } from '@/lib/types/shelf';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

const mockItems: Item[] = [
  {
    id: '1',
    shelf_id: 'shelf-1',
    type: 'book',
    title: 'Test Book',
    creator: 'Test Author',
    image_url: 'https://example.com/book.jpg',
    external_url: 'https://example.com/book',
    sort_order: 0,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '2',
    shelf_id: 'shelf-1',
    type: 'podcast',
    title: 'Test Podcast',
    creator: 'Test Host',
    image_url: 'https://example.com/podcast.jpg',
    external_url: 'https://example.com/podcast',
    sort_order: 1,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '3',
    shelf_id: 'shelf-1',
    type: 'music',
    title: 'Test Album',
    creator: 'Test Artist',
    image_url: null,
    external_url: null,
    sort_order: 2,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

describe('DemoShelf', () => {
  it('renders shelf name', () => {
    render(
      <DemoShelf
        items={mockItems}
        shelfName="My Reading List"
        shareToken="abc123"
      />
    );

    expect(screen.getByText('My Reading List')).toBeInTheDocument();
  });

  it('renders items with images', () => {
    render(
      <DemoShelf
        items={mockItems}
        shelfName="My Reading List"
        shareToken="abc123"
      />
    );

    expect(screen.getByAltText('Test Book')).toBeInTheDocument();
    expect(screen.getByAltText('Test Podcast')).toBeInTheDocument();
  });

  it('shows title as fallback when no image', () => {
    render(
      <DemoShelf
        items={mockItems}
        shelfName="My Reading List"
        shareToken="abc123"
      />
    );

    expect(screen.getByText('Test Album')).toBeInTheDocument();
  });

  it('links to the share page', () => {
    render(
      <DemoShelf
        items={mockItems}
        shelfName="My Reading List"
        shareToken="abc123"
      />
    );

    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/s/abc123');
  });

  it('limits display to 12 items', () => {
    const manyItems: Item[] = Array.from({ length: 15 }, (_, i) => ({
      id: `item-${i}`,
      shelf_id: 'shelf-1',
      type: 'book' as const,
      title: `Book ${i}`,
      creator: `Author ${i}`,
      image_url: `https://example.com/book${i}.jpg`,
      external_url: null,
      sort_order: i,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    }));

    render(
      <DemoShelf
        items={manyItems}
        shelfName="My Reading List"
        shareToken="abc123"
      />
    );

    // Should only render 12 images (limited to 12, created 15)
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(12);
  });

  it('renders explore prompt', () => {
    render(
      <DemoShelf
        items={mockItems}
        shelfName="My Reading List"
        shareToken="abc123"
      />
    );

    expect(screen.getByText('Click to explore →')).toBeInTheDocument();
  });

  it('renders view full link', () => {
    render(
      <DemoShelf
        items={mockItems}
        shelfName="My Reading List"
        shareToken="abc123"
      />
    );

    expect(screen.getByText('View full example shelf →')).toBeInTheDocument();
  });

  it('handles empty items array', () => {
    render(
      <DemoShelf
        items={[]}
        shelfName="Empty Shelf"
        shareToken="abc123"
      />
    );

    expect(screen.getByText('Empty Shelf')).toBeInTheDocument();
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });
});
