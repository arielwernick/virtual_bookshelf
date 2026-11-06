import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Guide } from '@/lib/types/shelf';
import GuidePage, { generateMetadata, generateStaticParams } from './page';
import { getAllGuides, getGuide } from '@/lib/utils/guides';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

vi.mock('@/lib/utils/guides', () => ({
  getAllGuides: vi.fn(),
  getGuide: vi.fn(),
}));

function createMockGuide(overrides: Partial<Guide> = {}): Guide {
  return {
    slug: 'my-guide',
    question: 'How do you do it?',
    description: 'A description.',
    answer: 'The direct answer.',
    updated: new Date('2026-11-05'),
    shelf: { token: 'abc123', label: 'A shelf' },
    faq: [{ q: 'A question?', a: 'An answer.' }],
    body: '## How to do it\n\n1. **First** step\n\n<script>alert(1)</script>',
    ...overrides,
  };
}

async function renderPage(guide: Guide | null = createMockGuide()) {
  vi.mocked(getGuide).mockReturnValue(guide);
  const page = await GuidePage({ params: Promise.resolve({ slug: 'my-guide' }) });
  return render(page);
}

function getJsonLdTypes(container: HTMLElement) {
  return [...container.querySelectorAll('script[type="application/ld+json"]')].map(
    (script) => JSON.parse(script.innerHTML)['@type']
  );
}

describe('GuidePage', () => {
  describe('Rendering', () => {
    it('renders the question as the H1, followed by the direct answer', async () => {
      await renderPage();

      expect(screen.getByRole('heading', { level: 1, name: 'How do you do it?' })).toBeInTheDocument();
      expect(screen.getByText('The direct answer.')).toBeInTheDocument();
    });

    it('renders the Markdown steps', async () => {
      await renderPage();

      expect(screen.getByRole('heading', { level: 2, name: 'How to do it' })).toBeInTheDocument();
      expect(screen.getByText('First').tagName).toBe('STRONG');
      expect(screen.getByText('First').closest('ol')).toHaveTextContent('First step');
    });

    it('embeds the live shelf', async () => {
      await renderPage();

      expect(screen.getByTitle('A shelf')).toHaveAttribute('src', expect.stringContaining('/embed/abc123?theme=light'));
    });

    it('links the CTA to signup', async () => {
      await renderPage();

      expect(screen.getByRole('link', { name: /create your shelf/i })).toHaveAttribute('href', '/signup');
    });

    it('includes FAQ and breadcrumb structured data', async () => {
      const { container } = await renderPage();

      expect(screen.getByText('A question?')).toBeInTheDocument();
      expect(getJsonLdTypes(container)).toEqual(['FAQPage', 'BreadcrumbList']);
    });
  });

  describe('Edge Cases', () => {
    it('leaves out the FAQ section and markup when a guide has no FAQ', async () => {
      const { container } = await renderPage(createMockGuide({ faq: [] }));

      expect(screen.queryByRole('heading', { name: /frequently asked/i })).not.toBeInTheDocument();
      expect(getJsonLdTypes(container)).toEqual(['BreadcrumbList']);
    });

    it('does not render raw HTML from Markdown', async () => {
      const { container } = await renderPage();

      expect(container.querySelector('main script')).toBeNull();
    });

    it('returns 404 for an unknown guide', async () => {
      await expect(renderPage(null)).rejects.toThrow('NEXT_NOT_FOUND');
    });
  });

  describe('Metadata', () => {
    it('uses the question as the title, with a canonical URL', async () => {
      vi.mocked(getGuide).mockReturnValue(createMockGuide());

      const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'my-guide' }) });

      expect(metadata.title).toBe('How do you do it?');
      expect(metadata.alternates?.canonical).toBe('/guides/my-guide');
    });

    it('pre-builds every guide', () => {
      vi.mocked(getAllGuides).mockReturnValue([createMockGuide()]);

      expect(generateStaticParams()).toEqual([{ slug: 'my-guide' }]);
    });
  });
});
