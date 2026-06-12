// Google Books API integration for book search

interface GoogleBooksVolumeInfo {
  title: string;
  authors?: string[];
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
  };
  infoLink?: string;
}

interface GoogleBooksItem {
  id: string;
  volumeInfo: GoogleBooksVolumeInfo;
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
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = new URL('https://www.googleapis.com/books/v1/volumes');
  url.searchParams.set('q', query);
  url.searchParams.set('maxResults', '10');
  if (apiKey) url.searchParams.set('key', apiKey);

  const response = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to search Google Books');
  }

  const data = await response.json();
  const items: GoogleBooksItem[] = data.items || [];

  return items.map((item) => ({
    id: item.id,
    title: item.volumeInfo.title,
    creator: item.volumeInfo.authors?.join(', ') || 'Unknown Author',
    imageUrl: item.volumeInfo.imageLinks?.thumbnail?.replace('http://', 'https://') ||
              item.volumeInfo.imageLinks?.smallThumbnail?.replace('http://', 'https://') ||
              '',
    externalUrl: item.volumeInfo.infoLink || `https://books.google.com/books?id=${item.id}`,
    type: 'book' as const,
  }));
}
