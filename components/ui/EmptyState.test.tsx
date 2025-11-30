import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState, BookshelfIcon } from './EmptyState';

describe('EmptyState', () => {
  describe('Rendering', () => {
    it('renders heading', () => {
      render(<EmptyState heading="Test Heading" />);

      expect(screen.getByText('Test Heading')).toBeInTheDocument();
    });

    it('renders subheading when provided', () => {
      render(<EmptyState heading="Title" subheading="Test subheading text" />);

      expect(screen.getByText('Test subheading text')).toBeInTheDocument();
    });

    it('does not render subheading when not provided', () => {
      render(<EmptyState heading="Title" />);

      expect(screen.queryByText('Test subheading text')).not.toBeInTheDocument();
    });

    it('renders icon when provided', () => {
      render(
        <EmptyState
          heading="Title"
          icon={<span data-testid="custom-icon">Icon</span>}
        />
      );

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state-icon')).toBeInTheDocument();
    });

    it('does not render icon container when not provided', () => {
      render(<EmptyState heading="Title" />);

      expect(screen.queryByTestId('empty-state-icon')).not.toBeInTheDocument();
    });
  });

  describe('CTA Button', () => {
    it('renders CTA button with text when ctaText and onCTA provided', () => {
      const onCTA = vi.fn();
      render(
        <EmptyState heading="Title" ctaText="Click Me" onCTA={onCTA} />
      );

      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
    });

    it('calls onCTA when button is clicked', () => {
      const onCTA = vi.fn();
      render(
        <EmptyState heading="Title" ctaText="Click Me" onCTA={onCTA} />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Click Me' }));

      expect(onCTA).toHaveBeenCalledTimes(1);
    });

    it('does not render CTA when ctaText is not provided', () => {
      const onCTA = vi.fn();
      render(<EmptyState heading="Title" onCTA={onCTA} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('does not render CTA when onCTA is not provided', () => {
      render(<EmptyState heading="Title" ctaText="Click Me" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('CTA Link', () => {
    it('renders CTA as link when ctaHref is provided', () => {
      render(
        <EmptyState
          heading="Title"
          ctaText="Go to Page"
          ctaHref="/some-page"
        />
      );

      const link = screen.getByRole('link', { name: 'Go to Page' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/some-page');
    });

    it('prefers link over button when both ctaHref and onCTA are provided', () => {
      const onCTA = vi.fn();
      render(
        <EmptyState
          heading="Title"
          ctaText="Action"
          ctaHref="/page"
          onCTA={onCTA}
        />
      );

      expect(screen.getByRole('link', { name: 'Action' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Action' })).not.toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('has proper container styling', () => {
      render(<EmptyState heading="Title" />);

      const container = screen.getByText('Title').parentElement;
      expect(container?.className).toContain('text-center');
      expect(container?.className).toContain('bg-white');
      expect(container?.className).toContain('rounded-lg');
    });

    it('heading has proper styling', () => {
      render(<EmptyState heading="Title" />);

      const heading = screen.getByText('Title');
      expect(heading?.className).toContain('text-lg');
      expect(heading?.className).toContain('font-semibold');
      expect(heading?.className).toContain('text-gray-900');
    });

    it('subheading has proper styling', () => {
      render(<EmptyState heading="Title" subheading="Subtitle" />);

      const subheading = screen.getByText('Subtitle');
      expect(subheading?.className).toContain('text-gray-600');
    });
  });
});

describe('BookshelfIcon', () => {
  it('renders SVG element', () => {
    render(<BookshelfIcon />);

    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies default className', () => {
    render(<BookshelfIcon />);

    const svg = document.querySelector('svg');
    expect(svg?.className.baseVal).toContain('w-16');
    expect(svg?.className.baseVal).toContain('h-16');
    expect(svg?.className.baseVal).toContain('mx-auto');
  });

  it('applies custom className', () => {
    render(<BookshelfIcon className="w-20 h-20" />);

    const svg = document.querySelector('svg');
    expect(svg?.className.baseVal).toContain('w-20');
    expect(svg?.className.baseVal).toContain('h-20');
  });

  it('has aria-hidden attribute for accessibility', () => {
    render(<BookshelfIcon />);

    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});
