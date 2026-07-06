import { revalidatePath } from 'next/cache';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('RevalidateShelf');

/**
 * Purge the cached public page for a shelf after a mutation.
 *
 * The shared shelf page (/s/[shareToken]) uses ISR (`revalidate = 300`), so
 * without this call edits could take up to 5 minutes to appear publicly.
 * Never throws — a failed cache purge must not fail the mutation itself.
 */
export function revalidateSharedShelf(shareToken: string | null | undefined): void {
  if (!shareToken) return;

  try {
    revalidatePath(`/s/${shareToken}`);
  } catch (error) {
    logger.errorWithException('Failed to revalidate shared shelf page', error);
  }
}
