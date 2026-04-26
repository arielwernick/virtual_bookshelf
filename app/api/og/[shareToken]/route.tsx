import { ImageResponse } from '@vercel/og';
import { getShelfByShareToken, getItemsByShelfId } from '@/lib/db/queries';
import { createLogger } from '@/lib/utils/logger';
import { fetchAsDataUrl, OG_CACHE_CONTROL } from '@/lib/og/imageLoader';
import type { Item, ItemType } from '@/lib/types/shelf';

const logger = createLogger('OGImage');

export const runtime = 'edge';

const WIDTH = 1200;
const HEIGHT = 630;
const MAX_ITEMS = 5;

type PreparedItem = Item & { image_data: string | null };

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;

    const shelf = await getShelfByShareToken(shareToken);
    if (!shelf || !shelf.is_public) {
      return fallbackImage();
    }

    const items = await getItemsByShelfId(shelf.id);

    const lastModified = items.reduce<Date>(
      (max, item) => (item.updated_at > max ? item.updated_at : max),
      shelf.updated_at
    );
    const etag = `W/"${lastModified.getTime()}-${items.length}"`;

    if (request.headers.get('if-none-match') === etag) {
      return new Response(null, {
        status: 304,
        headers: { ETag: etag, 'Cache-Control': OG_CACHE_CONTROL },
      });
    }

    const displayItems = items.slice(0, MAX_ITEMS);
    const prepared = await prefetchCovers(displayItems);

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
            fontFamily: 'system-ui, sans-serif',
            padding: '48px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <BookshelfIcon />
              <span style={{ fontSize: '24px', fontWeight: 600, color: '#1f2937' }}>
                Virtual Bookshelf
              </span>
            </div>
          </div>

          <h1 style={{
            fontSize: '56px',
            fontWeight: 800,
            color: '#111827',
            margin: '0 0 16px 0',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            maxWidth: '1000px',
          }}>
            {truncate(shelf.name, 60)}
          </h1>

          {shelf.description && (
            <p style={{
              fontSize: '24px',
              color: '#6b7280',
              margin: '0 0 32px 0',
              maxWidth: '900px',
              lineHeight: 1.4,
            }}>
              {truncate(shelf.description, 110)}
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-end' }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '20px',
              paddingLeft: '24px',
              paddingRight: '24px',
            }}>
              {prepared.length > 0 ? (
                prepared.map((item) => <Cover key={item.id} item={item} />)
              ) : (
                <EmptyState />
              )}

              {items.length > MAX_ITEMS && <MoreTile count={items.length - MAX_ITEMS} />}
            </div>

            <div style={{
              display: 'flex',
              width: '100%',
              height: '12px',
              background: 'linear-gradient(180deg, #78716c 0%, #57534e 50%, #44403c 100%)',
              borderRadius: '2px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)',
            }} />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '24px',
          }}>
            <span style={{ fontSize: '18px', color: '#9ca3af' }}>
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
            <span style={{ fontSize: '18px', color: '#6b7280', fontWeight: 500 }}>
              virtualbookshelf.app
            </span>
          </div>
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
        headers: { 'Cache-Control': OG_CACHE_CONTROL, ETag: etag },
      }
    );
  } catch (error) {
    logger.errorWithException('Failed to generate OG image', error);
    return fallbackImage();
  }
}

function Cover({ item }: { item: PreparedItem }) {
  const { width, height } = getCoverDimensions(item.type);
  const showImage = item.image_data !== null;

  return (
    <div style={{
      display: 'flex',
      width: `${width}px`,
      height: `${height}px`,
      borderRadius: '4px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)',
      background: showImage ? '#fff' : getTypeGradient(item.type),
    }}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image_data!}
          alt={item.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          padding: '12px',
          color: 'white',
          gap: '10px',
        }}>
          <TypeIcon type={item.type} />
          <span style={{ fontSize: '14px', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>
            {truncate(item.title, 30)}
          </span>
        </div>
      )}
    </div>
  );
}

function MoreTile({ count }: { count: number }) {
  return (
    <div style={{
      display: 'flex',
      position: 'relative',
      width: '120px',
      height: '200px',
    }}>
      <div style={{
        display: 'flex',
        position: 'absolute',
        top: '8px',
        left: '8px',
        width: '104px',
        height: '184px',
        background: 'rgba(0,0,0,0.06)',
        borderRadius: '4px',
      }} />
      <div style={{
        display: 'flex',
        position: 'absolute',
        top: '4px',
        left: '4px',
        width: '104px',
        height: '184px',
        background: 'rgba(0,0,0,0.10)',
        borderRadius: '4px',
      }} />
      <div style={{
        display: 'flex',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '104px',
        height: '184px',
        background: 'linear-gradient(135deg, #4b5563 0%, #1f2937 100%)',
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>+{count}</span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '200px',
      color: '#9ca3af',
      fontSize: '20px',
    }}>
      Empty shelf — add some items!
    </div>
  );
}

function fallbackImage() {
  return new ImageResponse(
    (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <BookshelfIcon />
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'white' }}>
            Virtual Bookshelf
          </span>
        </div>
        <p style={{ fontSize: '24px', color: 'rgba(255,255,255,0.8)' }}>
          Curate and share your favorites
        </p>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' },
    }
  );
}

async function prefetchCovers(items: Item[]): Promise<PreparedItem[]> {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      image_data: item.image_url ? await fetchAsDataUrl(item.image_url) : null,
    }))
  );
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.substring(0, max).trimEnd() + '…' : text;
}

function getCoverDimensions(type: ItemType): { width: number; height: number } {
  switch (type) {
    case 'music':
    case 'podcast':
    case 'podcast_episode':
    case 'video':
      return { width: 180, height: 180 };
    case 'book':
      return { width: 140, height: 200 };
    default:
      return { width: 160, height: 200 };
  }
}

function getTypeGradient(type: ItemType): string {
  switch (type) {
    case 'book':
      return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
    case 'podcast':
    case 'podcast_episode':
      return 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)';
    case 'music':
      return 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
    case 'video':
      return 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)';
    case 'stock':
      return 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)';
    default:
      return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
  }
}

function TypeIcon({ type }: { type: ItemType }) {
  const size = 32;
  const stroke = 'rgba(255,255,255,0.9)';
  switch (type) {
    case 'book':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'podcast':
    case 'podcast_episode':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      );
    case 'music':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );
    case 'video':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      );
    case 'stock':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 17 9 11 13 15 21 7" />
          <polyline points="14 7 21 7 21 14" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
  }
}

function BookshelfIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="#1f2937">
      <rect x="2" y="8" width="2" height="10" />
      <rect x="4.5" y="6" width="2" height="12" />
      <rect x="7" y="7" width="2" height="11" />
      <rect x="9.5" y="5" width="2" height="13" />
      <rect x="12" y="7" width="2" height="11" />
      <rect x="14.5" y="6" width="2" height="12" />
      <rect x="17" y="8" width="2" height="10" />
      <rect x="19.5" y="7" width="2" height="11" />
      <line x1="1" y1="19" x2="23" y2="19" stroke="#1f2937" strokeWidth="1.5" />
    </svg>
  );
}
