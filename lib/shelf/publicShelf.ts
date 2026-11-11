/**
 * The public shelf document: one serializer, several formats (issue #285).
 *
 * Every machine-readable view of a public shelf (Markdown, JSON, JSON Feed,
 * the embed API) is built from the PublicShelf returned here, so they cannot
 * drift apart and none of them can leak a field the others hide.
 *
 * Fields are copied one by one on purpose. Never spread a database row into
 * a public payload: rows carry owner and internal ids. The owner is never
 * named (usernames can reveal part of an email address).
 *
 * The format is documented in docs/spec/SHELF_FORMAT.md. Bump
 * PUBLIC_SHELF_VERSION on any breaking change.
 */

import { Item, ItemType, Shelf } from '@/lib/types/shelf';
import { buildSharePath } from '@/lib/utils/slug';

export const PUBLIC_SHELF_VERSION = 1;

const DEFAULT_BASE_URL = 'https://virtualbookshelf.app';

export function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

export interface PublicShelfItem {
  position: number;
  type: ItemType;
  title: string;
  creator: string | null;
  url: string | null;
  image_url: string | null;
  note: string | null;
  rating: number | null;
  added_at: string;
}

export interface PublicShelf {
  version: number;
  name: string;
  description: string | null;
  url: string;
  item_count: number;
  created_at: string;
  updated_at: string;
  formats: {
    html: string;
    markdown: string;
    json: string;
    json_feed: string;
  };
  items: PublicShelfItem[];
}

const TYPE_LABELS: Record<ItemType, string> = {
  book: 'Book',
  podcast: 'Podcast',
  podcast_episode: 'Podcast episode',
  music: 'Music',
  video: 'Video',
  link: 'Link',
  stock: 'Stock',
};

function toIso(value: Date | string): string {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

/** Absolute URLs of a public shelf and its machine-readable twins. */
export function buildShelfUrls(name: string, shareToken: string, baseUrl = getBaseUrl()) {
  const html = `${baseUrl}${buildSharePath(name, shareToken)}`;
  return {
    html,
    markdown: `${html}/shelf.md`,
    json: `${html}/shelf.json`,
    json_feed: `${html}/feed.json`,
  };
}

/**
 * An Item with the owner and shelf ids blanked, for payloads that still need
 * the Item shape (the embed and the shared page render with the same cards).
 */
export function redactItemForPublic(item: Item): Item {
  return {
    id: item.id,
    shelf_id: '',
    user_id: null,
    type: item.type,
    title: item.title,
    creator: item.creator,
    image_url: item.image_url,
    external_url: item.external_url,
    notes: item.notes,
    rating: item.rating,
    order_index: item.order_index,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

export function toPublicShelf(shelf: Shelf, items: Item[], baseUrl = getBaseUrl()): PublicShelf {
  const formats = buildShelfUrls(shelf.name, shelf.share_token, baseUrl);
  const sorted = [...items].sort((a, b) => a.order_index - b.order_index);

  return {
    version: PUBLIC_SHELF_VERSION,
    name: shelf.name,
    description: shelf.description || null,
    url: formats.html,
    item_count: sorted.length,
    created_at: toIso(shelf.created_at),
    updated_at: toIso(shelf.updated_at),
    formats,
    items: sorted.map((item, index) => ({
      position: index + 1,
      type: item.type,
      title: item.title,
      creator: item.creator || null,
      url: item.external_url || null,
      image_url: item.image_url || null,
      note: item.notes || null,
      rating: typeof item.rating === 'number' && item.rating > 0 ? item.rating : null,
      added_at: toIso(item.created_at),
    })),
  };
}

// ---------------------------------------------------------------------------
// Markdown
// ---------------------------------------------------------------------------

/** Escape user text so it cannot change the structure of the document. */
function escapeMarkdown(text: string): string {
  return text.replace(/([\\`*_[\]<>#|])/g, '\\$1').replace(/\s*\r?\n\s*/g, ' ').trim();
}

/** Only http(s) links are written as links; anything else is left as text. */
function isHttpUrl(url: string | null): url is string {
  return !!url && /^https?:\/\//i.test(url);
}

function markdownLink(label: string, url: string | null): string {
  if (!isHttpUrl(url)) return label;
  const safeUrl = url.replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\s/g, '%20');
  return `[${label}](${safeUrl})`;
}

export function toMarkdown(doc: PublicShelf): string {
  const lines: string[] = [`# ${escapeMarkdown(doc.name)}`, ''];

  if (doc.description) {
    lines.push(escapeMarkdown(doc.description), '');
  }

  const count = doc.item_count === 1 ? '1 item' : `${doc.item_count} items`;
  lines.push(
    `A shelf on Virtual Bookshelf. ${count}, last updated ${doc.updated_at.slice(0, 10)}.`,
    `Source: ${doc.url}`,
    ''
  );

  for (const item of doc.items) {
    const title = `**${markdownLink(escapeMarkdown(item.title), item.url)}**`;
    const by = item.creator ? ` by ${escapeMarkdown(item.creator)}` : '';
    const rating = item.rating ? `, rated ${item.rating}/5` : '';
    lines.push(`${item.position}. ${title}${by} (${TYPE_LABELS[item.type] ?? 'Item'}${rating})`);
    if (item.note) {
      lines.push(`   > ${escapeMarkdown(item.note)}`);
    }
  }

  if (doc.items.some((item) => item.note)) {
    lines.push('', 'Quoted lines are the curator\'s own notes on each item.');
  }

  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// JSON Feed 1.1 (https://www.jsonfeed.org/version/1.1/)
// ---------------------------------------------------------------------------

export function toJsonFeed(doc: PublicShelf): Record<string, unknown> {
  const newestFirst = [...doc.items].sort((a, b) => b.added_at.localeCompare(a.added_at));

  return {
    version: 'https://jsonfeed.org/version/1.1',
    title: doc.name,
    home_page_url: doc.url,
    feed_url: doc.formats.json_feed,
    ...(doc.description ? { description: doc.description } : {}),
    items: newestFirst.map((item) => {
      const summary = item.creator ? `${item.title} by ${item.creator}` : item.title;
      return {
        // Position can change when a shelf is reordered; the time an item was
        // added does not, so it anchors the id.
        id: `${doc.url}#${item.added_at}`,
        url: doc.url,
        ...(isHttpUrl(item.url) ? { external_url: item.url } : {}),
        title: item.title,
        content_text: item.note ? `${summary}\n\n${item.note}` : summary,
        ...(isHttpUrl(item.image_url) ? { image: item.image_url } : {}),
        date_published: item.added_at,
        ...(item.creator ? { authors: [{ name: item.creator }] } : {}),
        tags: [item.type],
      };
    }),
  };
}
