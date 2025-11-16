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

/**
 * Search for books using Google Books API
 * No API key required for basic searches
 */
export async function searchBooks(query: string): Promise<BookItem[]> {
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`,
    {
      headers: {
        'Accept': 'application/json',
      },
    }
  );

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
