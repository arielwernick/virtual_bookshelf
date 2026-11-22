import { Item } from '@/lib/types/shelf';
import { deriveItemIdentity } from '@/lib/utils/itemIdentity';

export interface SpotifyEmbed {
  /** iframe src for Spotify's embed player */
  src: string;
  /** Height Spotify recommends for this kind: compact for single tracks/episodes, tall for lists */
  height: number;
}

const COMPACT_KINDS = new Set(['track', 'episode']);

/**
 * Spotify embed player details for an item, or null when the item doesn't
 * link to something on open.spotify.com that Spotify can embed.
 */
export function getSpotifyEmbed(item: Pick<Item, 'type' | 'external_url'>): SpotifyEmbed | null {
  if (item.type === 'stock') return null;
  const identity = deriveItemIdentity(item.type, item.external_url);
  if (identity?.source !== 'spotify') return null;

  const [kind, id] = identity.sourceId.split(':');
  if (!kind || !id) return null;

  return {
    src: `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator`,
    height: COMPACT_KINDS.has(kind) ? 152 : 352,
  };
}
