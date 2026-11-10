import { revalidatePath } from 'next/cache';
import { createLogger } from '@/lib/utils/logger';
import { buildSharePath } from '@/lib/utils/slug';

const logger = createLogger('RevalidateShelf');

/**
 * Purge the cached public page for a shelf after a mutation.
 *
 * The shared shelf page (/s/[shareToken]) uses ISR (`revalidate = 300`), so
 * without this call edits could take up to 5 minutes to appear publicly.
 * Never throws — a failed cache purge must not fail the mutation itself.
 *
 * Content is cached under the slugged canonical path (/s/<name-slug>-<token>),
 * so pass the shelf name(s) whenever available. Pass both the old and new
 * name when renaming a shelf so the stale slug's cache entry is purged too.
 * The bare-token path is always purged for legacy links.
 */
export function revalidateSharedShelf(
  shareToken: string | null | undefined,
  ...shelfNames: (string | null | undefined)[]
): void {
  if (!shareToken) return;

  const paths = new Set<string>([`/s/${shareToken}`]);
  for (const name of shelfNames) {
    if (name) paths.add(buildSharePath(name, shareToken));
  }

  try {
    for (const path of paths) {
      revalidatePath(path);
    }
  } catch (error) {
    logger.errorWithException('Failed to revalidate shared shelf page', error);
  }
}
