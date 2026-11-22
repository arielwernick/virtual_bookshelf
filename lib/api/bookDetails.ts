import { isMockMode } from './mockMode';
import { MOCK_BOOK_DETAILS } from './mockFixtures';

/**
 * Extra details for a book's item window, fetched when it opens.
 *
 * Google Books (by volume id) gives the description, page count, publisher,
 * categories, ISBNs and whether its in-page preview can be shown. Open Library
 * (free, no key) fills the gaps: first publish year, typical page count,
 * a reader rating, and a description when Google has none.
 *
 * Every field is optional: either source may be down, over quota, or simply
 * not know the book. Callers show whatever came back.
 */
export interface BookDetails {
  description?: string;
  /** Year the work was first published (Open Library), else this edition's (Google). */
  year?: number;
  pageCount?: number;
  publisher?: string;
  categories?: string[];
  isbn13?: string;
  isbn10?: string;
  /** Google volume id whose preview can be embedded, when Google allows it. */
  previewVolumeId?: string;
  rating?: { average: number; count: number; source: 'Open Library' };
}

export interface BookLookup {
  googleVolumeId?: string | null;
  openLibraryId?: string | null;
  title: string;
  author?: string | null;
}

/** Upstream data barely changes; let Next cache fetches for a week. */
const REVALIDATE_SECONDS = 60 * 60 * 24 * 7;
const DESCRIPTION_MAX = 1200;
const TIMEOUT_MS = 5000;

interface GoogleVolume {
  id: string;
  volumeInfo?: {
    description?: string;
    publishedDate?: string;
    pageCount?: number;
    publisher?: string;
    categories?: string[];
    industryIdentifiers?: { type: string; identifier: string }[];
  };
  accessInfo?: { embeddable?: boolean; viewability?: string };
}

interface OpenLibraryDoc {
  key?: string;
  first_publish_year?: number;
  number_of_pages_median?: number;
  ratings_average?: number;
  ratings_count?: number;
  subject?: string[];
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  hellip: '…', mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
};

/**
 * Google descriptions are HTML. Turn them into plain paragraphs.
 *
 * The result is rendered as React text (escaped), but it's still made free of
 * markup on its own: tags are stripped until none are left (so nested ones
 * like "<scr<script>ipt>" can't survive one pass), and any angle bracket
 * left over or decoded from an entity is dropped.
 */
export function htmlToText(html: string): string {
  let text = html.replace(/<\s*br\s*\/?>/gi, '\n').replace(/<\/\s*(p|div|li|h[1-6])\s*>/gi, '\n\n');
  let previous;
  do {
    previous = text;
    text = text.replace(/<[^<>]*>/g, '');
  } while (text !== previous);

  return text
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (match, code: string) => {
      if (code[0] === '#') {
        const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : match;
      }
      return ENTITIES[code.toLowerCase()] ?? match;
    })
    .replace(/[<>]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function trimDescription(text: string): string {
  if (text.length <= DESCRIPTION_MAX) return text;
  const cut = text.slice(0, DESCRIPTION_MAX);
  const lastSentence = cut.lastIndexOf('. ');
  return (lastSentence > DESCRIPTION_MAX * 0.6 ? cut.slice(0, lastSentence + 1) : cut.trimEnd() + '…');
}

function yearFrom(date: string | undefined): number | undefined {
  const year = date ? parseInt(date.slice(0, 4), 10) : NaN;
  return Number.isFinite(year) ? year : undefined;
}

async function fromGoogle(volumeId: string): Promise<{ details: BookDetails; editionYear?: number }> {
  if (!/^[A-Za-z0-9_-]{6,20}$/.test(volumeId)) return { details: {} };
  const url = new URL(`https://www.googleapis.com/books/v1/volumes/${volumeId}`);
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (apiKey) url.searchParams.set('key', apiKey);

  const volume = await fetchJson<GoogleVolume>(url.toString());
  if (!volume) return { details: {} };

  const info = volume.volumeInfo ?? {};
  const ids = info.industryIdentifiers ?? [];
  const access = volume.accessInfo ?? {};
  const description = info.description ? htmlToText(info.description) : '';

  return {
    editionYear: yearFrom(info.publishedDate),
    details: {
      description: description || undefined,
      pageCount: info.pageCount || undefined,
      publisher: info.publisher,
      // Google's categories look like "Fiction / Science Fiction / General"
      categories: info.categories?.map((c) => c.split(' / ').filter((p) => p !== 'General').pop() || c),
      isbn13: ids.find((i) => i.type === 'ISBN_13')?.identifier,
      isbn10: ids.find((i) => i.type === 'ISBN_10')?.identifier,
      previewVolumeId:
        access.embeddable && access.viewability && access.viewability !== 'NO_PAGES' ? volume.id : undefined,
    },
  };
}

const OL_FIELDS = 'key,first_publish_year,number_of_pages_median,ratings_average,ratings_count,subject';

/** Open Library subjects mix genres with shelving tags; keep short genre-like ones. */
const NOT_A_GENRE = /reviewed|award|best ?seller|accessible|protected|lending|in library|large type|open library|staff picks|nyt|^\d|[(),:]/i;
export const isGenre = (subject: string) => subject.length <= 30 && !NOT_A_GENRE.test(subject);

async function findOpenLibraryDoc(lookup: BookLookup, isbn?: string): Promise<OpenLibraryDoc | null> {
  const search = new URL('https://openlibrary.org/search.json');
  search.searchParams.set('fields', OL_FIELDS);
  search.searchParams.set('limit', '1');

  if (lookup.openLibraryId && /^OL\d+W$/.test(lookup.openLibraryId)) {
    search.searchParams.set('q', `key:/works/${lookup.openLibraryId}`);
  } else if (isbn) {
    search.searchParams.set('isbn', isbn);
  } else {
    search.searchParams.set('title', lookup.title);
    if (lookup.author) search.searchParams.set('author', lookup.author.split(',')[0].trim());
  }

  const result = await fetchJson<{ docs?: OpenLibraryDoc[] }>(search.toString());
  return result?.docs?.[0] ?? null;
}

async function openLibraryDescription(workKey: string): Promise<string | undefined> {
  if (!/^\/works\/OL\d+W$/.test(workKey)) return undefined;
  const work = await fetchJson<{ description?: string | { value?: string } }>(`https://openlibrary.org${workKey}.json`);
  const raw = typeof work?.description === 'string' ? work.description : work?.description?.value;
  // Open Library descriptions are Markdown-ish and often end with a "----------" source list
  return raw?.split(/\n-{3,}/)[0].replace(/\r/g, '').trim() || undefined;
}

export async function getBookDetails(lookup: BookLookup): Promise<BookDetails> {
  if (isMockMode()) return { ...MOCK_BOOK_DETAILS, previewVolumeId: lookup.googleVolumeId ?? undefined };

  const google = lookup.googleVolumeId ? await fromGoogle(lookup.googleVolumeId) : { details: {} as BookDetails };
  const details: BookDetails = { ...google.details };

  const doc = await findOpenLibraryDoc(lookup, details.isbn13 ?? details.isbn10);
  if (doc) {
    details.year = doc.first_publish_year ?? google.editionYear;
    details.pageCount ??= doc.number_of_pages_median;
    if (doc.ratings_average && doc.ratings_count && doc.ratings_count >= 5) {
      details.rating = {
        average: Math.round(doc.ratings_average * 10) / 10,
        count: doc.ratings_count,
        source: 'Open Library',
      };
    }
    if (!details.categories?.length && doc.subject?.length) {
      details.categories = doc.subject.filter(isGenre).slice(0, 2);
    }
    if (!details.description && doc.key) {
      details.description = await openLibraryDescription(doc.key);
    }
  } else {
    details.year = google.editionYear;
  }

  if (details.description) details.description = trimDescription(details.description);
  if (details.categories) details.categories = [...new Set(details.categories)].slice(0, 2);
  return details;
}
