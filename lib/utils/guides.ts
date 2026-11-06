import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { Guide } from '@/lib/types/shelf';

const GUIDES_DIR = path.join(process.cwd(), 'content', 'guides');
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHARE_TOKEN_PATTERN = /^[A-Za-z0-9-]+$/;

function requireString(data: Record<string, unknown>, field: string, slug: string): string {
  const value = data[field];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Guide "${slug}" is missing "${field}"`);
  }
  return value.trim();
}

/**
 * Parses a guide's Markdown. Throws on bad frontmatter, so a broken guide fails
 * the build instead of publishing an incomplete page.
 */
export function parseGuide(slug: string, raw: string): Guide {
  const { data, content } = matter(raw);

  const updated = data.updated instanceof Date ? data.updated : new Date(String(data.updated));
  if (Number.isNaN(updated.getTime())) {
    throw new Error(`Guide "${slug}" has an invalid "updated" date`);
  }

  const shelf = (data.shelf ?? {}) as Record<string, unknown>;
  const token = requireString(shelf, 'token', slug);
  if (!SHARE_TOKEN_PATTERN.test(token)) {
    throw new Error(`Guide "${slug}" has an invalid shelf token`);
  }

  const faq = ((data.faq ?? []) as Record<string, unknown>[]).map((entry) => ({
    q: requireString(entry, 'q', slug),
    a: requireString(entry, 'a', slug),
  }));

  const body = content.trim();
  if (!body) {
    throw new Error(`Guide "${slug}" has no body`);
  }

  return {
    slug,
    question: requireString(data, 'question', slug),
    description: requireString(data, 'description', slug),
    answer: requireString(data, 'answer', slug),
    updated,
    shelf: { token, label: requireString(shelf, 'label', slug) },
    faq,
    body,
  };
}

/** All guides, most recently updated first. */
export function getAllGuides(): Guide[] {
  return fs
    .readdirSync(GUIDES_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const slug = file.slice(0, -'.md'.length);
      return parseGuide(slug, fs.readFileSync(path.join(GUIDES_DIR, file), 'utf8'));
    })
    .sort((a, b) => b.updated.getTime() - a.updated.getTime());
}

export function getGuide(slug: string): Guide | null {
  if (!SLUG_PATTERN.test(slug)) return null;

  const file = path.join(GUIDES_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;

  return parseGuide(slug, fs.readFileSync(file, 'utf8'));
}
