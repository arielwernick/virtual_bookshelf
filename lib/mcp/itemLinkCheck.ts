import type { ItemType } from '@/lib/types/shelf';
import { deriveItemIdentity } from '@/lib/utils/itemIdentity';

/**
 * Why an item's Spotify link doesn't fit its type, or null when it's fine.
 *
 * An episode saved with its show's link plays the show's newest episode in
 * the item window, not the one the user meant, so add_item turns it away and
 * points the agent at episode search instead.
 */
export function spotifyLinkProblem(type: ItemType, externalUrl: string | undefined): string | null {
  if (type !== 'podcast_episode' || !externalUrl) return null;
  const identity = deriveItemIdentity(type, externalUrl);
  if (identity?.source !== 'spotify') return null;
  const kind = identity.sourceId.split(':')[0];
  if (kind === 'episode') return null;
  return (
    `external_url is a Spotify ${kind} link, not an episode link. ` +
    'Call search_catalog with type "podcast_episode" (e.g. query "<show name> <episode topic>") ' +
    'and pass that result\'s external_url, or add the show itself with type "podcast".'
  );
}
