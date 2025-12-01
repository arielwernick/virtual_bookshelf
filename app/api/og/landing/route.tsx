import { ImageResponse } from '@vercel/og';
import { getPublicShelvesByUserId, getItemsByShelfId, getShelfByShareToken } from '@/lib/db/queries';
import { getDemoUserId, getDemoShelfToken } from '@/lib/utils/env';
import { Item } from '@/lib/types/shelf';

export const runtime = 'edge';

/**
 * Fetch demo items for the OG image
 * Uses the same logic as the landing page
 */
async function getDemoItems(): Promise<Item[]> {
  // Try new approach first: fetch from demo user
  const userId = getDemoUserId();
  if (userId) {
    try {
      const shelves = await getPublicShelvesByUserId(userId);
      if (shelves.length > 0) {
        const items = await getItemsByShelfId(shelves[0].id);
        return items.slice(0, 6); // Get up to 6 items for display
      }
    } catch {
      // Fall through to legacy approach
    }
  }

  // Fallback to legacy single shelf approach
  const token = getDemoShelfToken();
  if (token) {
    try {
      const shelf = await getShelfByShareToken(token);
      if (shelf && shelf.is_public) {
        const items = await getItemsByShelfId(shelf.id);
        return items.slice(0, 6);
      }
    } catch {
      // Return empty array
    }
  }

  return [];
}

/**
 * Generate Open Graph image for the landing page
 * 
 * This creates a beautiful hero image showing:
 * - App name and tagline
 * - Real book/media covers from demo shelf on a wooden shelf
 * - Clean, professional branding
 * 
 * Used when sharing the main site on LinkedIn, Twitter, etc.
 */
export async function GET() {
  // Fetch real demo items
  const demoItems = await getDemoItems();
  const hasRealItems = demoItems.length > 0;

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
          padding: '48px 60px',
          position: 'relative',
        }}
      >
        {/* Header with logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', zIndex: 1 }}>
          <BookshelfIcon size={48} />
          <span style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937' }}>
            Virtual Bookshelf
          </span>
        </div>

        {/* Main headline */}
        <div style={{ display: 'flex', flexDirection: 'column', zIndex: 1, marginBottom: '24px' }}>
          <h1
            style={{
              fontSize: '56px',
              fontWeight: '800',
              color: '#111827',
              margin: '0 0 12px 0',
              lineHeight: 1.1,
              maxWidth: '650px',
              letterSpacing: '-0.02em',
            }}
          >
            Your bookshelf, everywhere you are
          </h1>
          
          <p
            style={{
              fontSize: '24px',
              color: '#4b5563',
              margin: '0',
              maxWidth: '550px',
              lineHeight: 1.4,
            }}
          >
            Curate your favorite books, podcasts, and music. Share a link anywhere.
          </p>
        </div>

        {/* Bookshelf with real items */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-end' }}>
          {/* Items Row */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-end', 
            gap: '16px', 
            paddingLeft: '20px',
            paddingRight: '20px',
          }}>
            {hasRealItems ? (
              // Display real item covers
              demoItems.map((item) => (
                <div 
                  key={item.id} 
                  style={{ 
                    display: 'flex',
                    width: '120px',
                    height: '170px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.1)',
                    background: item.image_url ? 'transparent' : getTypeGradient(item.type),
                  }}
                >
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt={item.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      padding: '10px',
                      color: 'white',
                    }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', textAlign: 'center', lineHeight: 1.2 }}>
                        {item.title.length > 25 ? item.title.substring(0, 25) + '...' : item.title}
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              // Fallback: colorful book spines when no demo items
              <>
                <BookSpine height={150} color="#3b82f6" />
                <BookSpine height={170} color="#8b5cf6" />
                <BookSpine height={140} color="#22c55e" />
                <BookSpine height={165} color="#f59e0b" />
                <BookSpine height={155} color="#ec4899" />
                <BookSpine height={145} color="#6366f1" />
              </>
            )}
          </div>

          {/* Shelf Bar */}
          <div style={{
            display: 'flex',
            width: '100%',
            height: '14px',
            background: 'linear-gradient(180deg, #78716c 0%, #57534e 50%, #44403c 100%)',
            borderRadius: '2px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)',
          }} />
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '20px',
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <FeatureBadge icon="📚" text="Books" />
            <FeatureBadge icon="🎙️" text="Podcasts" />
            <FeatureBadge icon="🎵" text="Music" />
          </div>
          <span style={{ fontSize: '18px', color: '#6b7280', fontWeight: '500' }}>
            Free • Beautiful • Shareable
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

// SVG Bookshelf Icon Component
function BookshelfIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#1f2937">
      <rect x="2" y="8" width="2" height="10" rx="0.5" />
      <rect x="4.5" y="6" width="2" height="12" rx="0.5" />
      <rect x="7" y="7" width="2" height="11" rx="0.5" />
      <rect x="9.5" y="5" width="2" height="13" rx="0.5" />
      <rect x="12" y="7" width="2" height="11" rx="0.5" />
      <rect x="14.5" y="6" width="2" height="12" rx="0.5" />
      <rect x="17" y="8" width="2" height="10" rx="0.5" />
      <rect x="19.5" y="7" width="2" height="11" rx="0.5" />
      <line x1="1" y1="19" x2="23" y2="19" stroke="#1f2937" strokeWidth="1.5" />
    </svg>
  );
}

// Book spine illustration component (fallback when no demo items)
function BookSpine({ height, color }: { height: number; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100px',
        height: `${height}px`,
        background: `linear-gradient(135deg, ${color} 0%, ${adjustColor(color, -30)} 100%)`,
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.1)',
      }}
    />
  );
}

// Feature badge component
function FeatureBadge({ icon, text }: { icon: string; text: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
      }}
    >
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{text}</span>
    </div>
  );
}

// Helper to get gradient based on item type
function getTypeGradient(type: string): string {
  switch (type) {
    case 'book':
      return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
    case 'podcast':
      return 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)';
    case 'music':
      return 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
    default:
      return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
  }
}

// Helper to darken/lighten a hex color
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.slice(1), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}
