import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBookDetails, htmlToText } from './bookDetails';

vi.mock('./mockMode', () => ({ isMockMode: () => false }));

const googleVolume = {
  id: 'B1hSG45JCX4C',
  volumeInfo: {
    description: '<p>Set on the desert planet <b>Arrakis</b>&hellip; it&#39;s a story of <i>politics</i> &amp; power.</p><p>Second paragraph.</p>',
    publishedDate: '2005-08-02',
    pageCount: 896,
    publisher: 'Ace',
    categories: ['Fiction / Science Fiction / General'],
    industryIdentifiers: [
      { type: 'ISBN_10', identifier: '0441013597' },
      { type: 'ISBN_13', identifier: '9780441013593' },
    ],
  },
  accessInfo: { embeddable: true, viewability: 'PARTIAL' },
};

const olDoc = {
  key: '/works/OL893414W',
  first_publish_year: 1965,
  number_of_pages_median: 605,
  ratings_average: 4.30819,
  ratings_count: 464,
  subject: ['New York Times reviewed', 'Fiction', 'Science fiction', 'Dune (Imaginary place)'],
};

type Routes = Record<string, unknown>;
let fetchMock: ReturnType<typeof vi.fn>;

/** Answer fetches by URL prefix; anything unmatched is a 404. */
function mockFetch(routes: Routes) {
  fetchMock = vi.fn(async (input: string | URL) => {
    const url = input.toString();
    const match = Object.keys(routes).find((prefix) => url.startsWith(prefix));
    if (!match) return new Response('not found', { status: 404 });
    return new Response(JSON.stringify(routes[match]), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
}

const calledUrls = () => fetchMock.mock.calls.map(([u]) => u.toString());

beforeEach(() => {
  vi.stubEnv('GOOGLE_BOOKS_API_KEY', '');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('htmlToText', () => {
  it('turns Google description HTML into plain paragraphs', () => {
    expect(htmlToText(googleVolume.volumeInfo.description)).toBe(
      "Set on the desert planet Arrakis… it's a story of politics & power.\n\nSecond paragraph."
    );
  });

  it('leaves no markup behind, even from nested or encoded tags', () => {
    expect(htmlToText('a<scr<script>ipt>alert(1)</script>b')).toBe('aalert(1)b');
    expect(htmlToText('x &lt;script&gt;y&#60;img&#62; 3 > 2')).toBe('x scriptyimg 3 2');
    expect(htmlToText('Unclosed <b tag')).toBe('Unclosed b tag');
  });

  it('handles line breaks and numeric entities', () => {
    expect(htmlToText('One<br>Two&#x2014;Three&nbsp;Four')).toBe('One\nTwo—Three Four');
  });
});

describe('getBookDetails', () => {
  describe('Rendering', () => {
    it('combines Google and Open Library details', async () => {
      mockFetch({
        'https://www.googleapis.com/books/v1/volumes/B1hSG45JCX4C': googleVolume,
        'https://openlibrary.org/search.json': { docs: [olDoc] },
      });

      const details = await getBookDetails({ googleVolumeId: 'B1hSG45JCX4C', title: 'Dune', author: 'Frank Herbert' });

      expect(details).toMatchObject({
        year: 1965, // first published, not this edition
        pageCount: 896, // Google's edition count wins
        publisher: 'Ace',
        categories: ['Science Fiction'],
        isbn13: '9780441013593',
        previewVolumeId: 'B1hSG45JCX4C',
        rating: { average: 4.3, count: 464, source: 'Open Library' },
      });
      expect(details.description).toContain('Arrakis');
      // Open Library looked up by Google's ISBN
      expect(calledUrls().some((u) => u.includes('openlibrary.org/search.json') && u.includes('isbn=9780441013593'))).toBe(true);
    });

    it('passes the Google API key when set', async () => {
      vi.stubEnv('GOOGLE_BOOKS_API_KEY', 'test-key');
      mockFetch({ 'https://www.googleapis.com/': googleVolume, 'https://openlibrary.org/': { docs: [] } });
      await getBookDetails({ googleVolumeId: 'B1hSG45JCX4C', title: 'Dune' });
      expect(calledUrls()[0]).toContain('key=test-key');
    });
  });

  describe('Edge Cases', () => {
    it('only offers a preview when Google allows embedding and has pages', async () => {
      mockFetch({
        'https://www.googleapis.com/': { ...googleVolume, accessInfo: { embeddable: true, viewability: 'NO_PAGES' } },
        'https://openlibrary.org/': { docs: [] },
      });
      expect((await getBookDetails({ googleVolumeId: 'B1hSG45JCX4C', title: 'Dune' })).previewVolumeId).toBeUndefined();
    });

    it('falls back to Open Library by title and author when Google fails', async () => {
      mockFetch({
        'https://openlibrary.org/search.json': { docs: [olDoc] },
        'https://openlibrary.org/works/OL893414W.json': {
          description: { value: 'A desert planet story.\r\n\r\n----------\r\nSee also: other editions' },
        },
      });

      const details = await getBookDetails({ googleVolumeId: 'B1hSG45JCX4C', title: 'Dune', author: 'Frank Herbert, Someone Else' });

      expect(details).toMatchObject({
        description: 'A desert planet story.',
        year: 1965,
        pageCount: 605,
        categories: ['Fiction', 'Science fiction'],
      });
      expect(details.previewVolumeId).toBeUndefined();
      const search = calledUrls().find((u) => u.includes('search.json'))!;
      expect(search).toContain('title=Dune');
      expect(search).toContain('author=Frank+Herbert');
      expect(search).not.toContain('Someone');
    });

    it('looks up Open Library works directly by id', async () => {
      mockFetch({ 'https://openlibrary.org/search.json': { docs: [olDoc] } });
      await getBookDetails({ openLibraryId: 'OL893414W', title: 'Dune' });
      expect(calledUrls()[0]).toContain('q=key%3A%2Fworks%2FOL893414W');
    });

    it('skips ratings with too few votes', async () => {
      mockFetch({ 'https://openlibrary.org/search.json': { docs: [{ ...olDoc, ratings_count: 2 }] } });
      expect((await getBookDetails({ title: 'Dune' })).rating).toBeUndefined();
    });

    it('returns an empty object when every source fails', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
      expect(await getBookDetails({ googleVolumeId: 'B1hSG45JCX4C', title: 'Dune' })).toEqual({ year: undefined });
    });

    it('ignores malformed Google ids without calling Google', async () => {
      mockFetch({ 'https://openlibrary.org/': { docs: [] } });
      await getBookDetails({ googleVolumeId: '../../etc', title: 'Dune' });
      expect(calledUrls().some((u) => u.includes('googleapis'))).toBe(false);
    });

    it('trims very long descriptions at a sentence', async () => {
      const long = Array.from({ length: 40 }, (_, i) => `Sentence number ${i} is here.`).join(' ');
      mockFetch({
        'https://www.googleapis.com/': { ...googleVolume, volumeInfo: { ...googleVolume.volumeInfo, description: long } },
        'https://openlibrary.org/': { docs: [] },
      });
      const { description } = await getBookDetails({ googleVolumeId: 'B1hSG45JCX4C', title: 'Dune' });
      expect(description!.length).toBeLessThanOrEqual(1200);
      expect(description!.endsWith('.')).toBe(true);
    });
  });
});
