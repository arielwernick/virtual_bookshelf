// Open Library API integration for book search (replaces Google Books which hit quota limits)

interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
}

interface OpenLibraryResponse {
  docs: OpenLibraryDoc[];
  numFound: number;
}

export interface BookItem {
  id: string;
  title: string;
  creator: string;
  imageUrl: string;
  externalUrl: string;
  type: 'book';
}

export async function searchBooks(query: string): Promise<BookItem[]> {
  const response = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10&fields=key,title,author_name,cover_i`,
    {
      headers: { 'Accept': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to search Open Library');
  }

  const data: OpenLibraryResponse = await response.json();
  const docs = data.docs ?? [];

  return docs.map((doc) => ({
    id: doc.key,
    title: doc.title,
    creator: doc.author_name?.join(', ') || 'Unknown Author',
    imageUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : '',
    externalUrl: `https://openlibrary.org${doc.key}`,
    type: 'book' as const,
  }));
}
