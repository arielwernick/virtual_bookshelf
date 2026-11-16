import { getDomain } from '@/lib/utils/urlResolver';

/**
 * One link from a pasted list, as it moves through preview.
 */
export interface PreviewItem {
  url: string;
  resolvedUrl?: string;
  parsedTitle?: string;
  parsedDescription?: string;
  fetchedTitle?: string;
  fetchedImage?: string;
  fetchedPublisher?: string;
  /** A title the visitor typed; wins over the fetched and parsed titles */
  customTitle?: string;
  /** False once the visitor takes the item off the shelf */
  selected: boolean;
  loading?: boolean;
  error?: string;
}

/**
 * The title shown for an item and saved with it:
 * the visitor's own > the page's > the pasted text's > the site name.
 */
export function getPreviewTitle(item: PreviewItem): string {
  return (
    item.customTitle?.trim() ||
    item.fetchedTitle ||
    item.parsedTitle ||
    getDomain(item.resolvedUrl || item.url)
  );
}
