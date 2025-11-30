import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  SkeletonShelfCard,
  SkeletonItemCard,
  SkeletonShelfGrid,
  SkeletonItemGrid,
  SkeletonEditHeader,
} from './SkeletonLoader';

describe('SkeletonShelfCard', () => {
  it('renders with test id', () => {
    render(<SkeletonShelfCard />);

    expect(screen.getByTestId('skeleton-shelf-card')).toBeInTheDocument();
  });

  it('has proper container styling', () => {
    render(<SkeletonShelfCard />);

    const card = screen.getByTestId('skeleton-shelf-card');
    expect(card.className).toContain('bg-white');
    expect(card.className).toContain('rounded-lg');
    expect(card.className).toContain('shadow-sm');
  });

  it('contains animated skeleton elements', () => {
    render(<SkeletonShelfCard />);

    const pulseElements = document.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('has aria-hidden on skeleton elements', () => {
    render(<SkeletonShelfCard />);

    const pulseElements = document.querySelectorAll('.animate-pulse');
    pulseElements.forEach((element) => {
      expect(element).toHaveAttribute('aria-hidden', 'true');
    });
  });
});

describe('SkeletonItemCard', () => {
  it('renders with test id', () => {
    render(<SkeletonItemCard />);

    expect(screen.getByTestId('skeleton-item-card')).toBeInTheDocument();
  });

  it('has proper container styling', () => {
    render(<SkeletonItemCard />);

    const card = screen.getByTestId('skeleton-item-card');
    expect(card.className).toContain('bg-white');
    expect(card.className).toContain('rounded-lg');
  });

  it('contains animated skeleton elements', () => {
    render(<SkeletonItemCard />);

    const pulseElements = document.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('includes image placeholder with aspect ratio', () => {
    render(<SkeletonItemCard />);

    const imagePlaceholder = document.querySelector('.aspect-\\[2\\/3\\]');
    expect(imagePlaceholder).toBeInTheDocument();
  });
});

describe('SkeletonShelfGrid', () => {
  it('renders with test id', () => {
    render(<SkeletonShelfGrid />);

    expect(screen.getByTestId('skeleton-shelf-grid')).toBeInTheDocument();
  });

  it('renders default count of 6 skeleton cards', () => {
    render(<SkeletonShelfGrid />);

    const cards = screen.getAllByTestId('skeleton-shelf-card');
    expect(cards).toHaveLength(6);
  });

  it('renders custom count of skeleton cards', () => {
    render(<SkeletonShelfGrid count={3} />);

    const cards = screen.getAllByTestId('skeleton-shelf-card');
    expect(cards).toHaveLength(3);
  });

  it('has grid layout classes', () => {
    render(<SkeletonShelfGrid />);

    const grid = screen.getByTestId('skeleton-shelf-grid');
    expect(grid.className).toContain('grid');
    expect(grid.className).toContain('md:grid-cols-2');
    expect(grid.className).toContain('lg:grid-cols-3');
    expect(grid.className).toContain('gap-6');
  });
});

describe('SkeletonItemGrid', () => {
  it('renders with test id', () => {
    render(<SkeletonItemGrid />);

    expect(screen.getByTestId('skeleton-item-grid')).toBeInTheDocument();
  });

  it('renders default count of 8 skeleton cards', () => {
    render(<SkeletonItemGrid />);

    const cards = screen.getAllByTestId('skeleton-item-card');
    expect(cards).toHaveLength(8);
  });

  it('renders custom count of skeleton cards', () => {
    render(<SkeletonItemGrid count={4} />);

    const cards = screen.getAllByTestId('skeleton-item-card');
    expect(cards).toHaveLength(4);
  });

  it('has grid layout classes', () => {
    render(<SkeletonItemGrid />);

    const grid = screen.getByTestId('skeleton-item-grid');
    expect(grid.className).toContain('grid');
    expect(grid.className).toContain('grid-cols-2');
    expect(grid.className).toContain('sm:grid-cols-3');
    expect(grid.className).toContain('md:grid-cols-4');
    expect(grid.className).toContain('lg:grid-cols-5');
    expect(grid.className).toContain('gap-4');
  });
});

describe('SkeletonEditHeader', () => {
  it('renders with test id', () => {
    render(<SkeletonEditHeader />);

    expect(screen.getByTestId('skeleton-edit-header')).toBeInTheDocument();
  });

  it('contains multiple animated skeleton elements', () => {
    render(<SkeletonEditHeader />);

    const pulseElements = document.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(3);
  });

  it('has proper structure with multiple skeleton blocks', () => {
    render(<SkeletonEditHeader />);

    const container = screen.getByTestId('skeleton-edit-header');
    // Should have skeleton elements for name, description, and button
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(6);
  });
});
