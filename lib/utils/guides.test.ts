/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { getAllGuides, getGuide, parseGuide } from './guides';

function createGuideMarkdown(overrides: Record<string, string> = {}, body = '## Steps\n\n1. Do it') {
  const fields: Record<string, string> = {
    question: 'How do you do it?',
    description: 'A description.',
    answer: 'Like this.',
    updated: '2026-11-05',
    ...overrides,
  };
  const lines = Object.entries(fields).map(([key, value]) => `${key}: ${value}`);
  return `---\n${lines.join('\n')}\nshelf:\n  token: abc123\n  label: A shelf\nfaq:\n  - q: A question?\n    a: An answer.\n---\n\n${body}\n`;
}

describe('parseGuide', () => {
  it('parses frontmatter and body', () => {
    const guide = parseGuide('my-guide', createGuideMarkdown());

    expect(guide).toMatchObject({
      slug: 'my-guide',
      question: 'How do you do it?',
      answer: 'Like this.',
      shelf: { token: 'abc123', label: 'A shelf' },
      faq: [{ q: 'A question?', a: 'An answer.' }],
    });
    expect(guide.updated).toEqual(new Date('2026-11-05'));
    expect(guide.body).toContain('## Steps');
  });

  it('allows a guide with no FAQ', () => {
    const raw = createGuideMarkdown().replace('faq:\n  - q: A question?\n    a: An answer.\n', '');

    expect(parseGuide('my-guide', raw).faq).toEqual([]);
  });

  it('rejects a missing required field', () => {
    const raw = createGuideMarkdown().replace('answer: Like this.\n', '');

    expect(() => parseGuide('my-guide', raw)).toThrow('missing "answer"');
  });

  it('rejects an invalid date', () => {
    expect(() => parseGuide('my-guide', createGuideMarkdown({ updated: 'soon' }))).toThrow('invalid "updated"');
  });

  it('rejects a shelf token that is unsafe in a URL', () => {
    const raw = createGuideMarkdown().replace('token: abc123', 'token: "../admin?x=1"');

    expect(() => parseGuide('my-guide', raw)).toThrow('invalid shelf token');
  });

  it('rejects an empty body', () => {
    expect(() => parseGuide('my-guide', createGuideMarkdown({}, ''))).toThrow('no body');
  });
});

describe('getGuide', () => {
  it('returns null for an unknown slug', () => {
    expect(getGuide('no-such-guide')).toBeNull();
  });

  it.each(['../../package', '..%2Fsecret', 'UPPER', 'a/b', ''])('rejects the unsafe slug %j', (slug) => {
    expect(getGuide(slug)).toBeNull();
  });
});

describe('shipped guides', () => {
  it('all parse, and can each be found by slug', () => {
    const guides = getAllGuides();

    expect(guides.length).toBeGreaterThan(0);
    for (const guide of guides) {
      expect(getGuide(guide.slug)?.question).toBe(guide.question);
    }
  });

  it('keeps titles short enough for search results', () => {
    const brandSuffix = ' | Virtual Bookshelf';

    for (const guide of getAllGuides()) {
      expect((guide.question + brandSuffix).length).toBeLessThanOrEqual(70);
    }
  });
});
