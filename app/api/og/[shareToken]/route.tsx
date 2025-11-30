import { ImageResponse } from '@vercel/og';
import { getShelfByShareToken, getItemsByShelfId } from '@/lib/db/queries';

export const runtime = 'edge';

/**
 * Generate Open Graph image for shared shelves
 * 
 * This creates a beautiful preview image showing:
 * - Shelf name
 * - Book/podcast/music covers on a shelf
 * - Branding
 * 
 * Used when sharing shelf links on LinkedIn, Twitter, etc.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;

    // Fetch shelf data
    const shelf = await getShelfByShareToken(shareToken);
    if (!shelf || !shelf.is_public) {
      // Return a fallback image for missing/private shelves
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
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
        { width: 1200, height: 630 }
      );
    }

    // Get shelf items
    const items = await getItemsByShelfId(shelf.id);
    const displayItems = items.slice(0, 5); // Show up to 5 items
    const isTop5 = shelf.shelf_type === 'top5';

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
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <BookshelfIcon />
              <span style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
                Virtual Bookshelf
              </span>
            </div>
            {isTop5 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef3c7', padding: '8px 16px', borderRadius: '20px' }}>
                <TrophyIcon />
                <span style={{ fontSize: '18px', fontWeight: '600', color: '#92400e' }}>Top 5</span>
              </div>
            )}
          </div>

          {/* Shelf Title */}
          <h1 style={{ 
            fontSize: '56px', 
            fontWeight: 'bold', 
            color: '#111827', 
            margin: '0 0 16px 0',
            lineHeight: 1.1,
          }}>
            {shelf.name}
          </h1>

          {/* Description (if exists) */}
          {shelf.description && (
            <p style={{ 
              fontSize: '24px', 
              color: '#6b7280', 
              margin: '0 0 32px 0',
              maxWidth: '800px',
              lineHeight: 1.4,
            }}>
              {shelf.description.length > 100 
                ? shelf.description.substring(0, 100) + '...' 
                : shelf.description}
            </p>
          )}

          {/* Shelf with items */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-end' }}>
            {/* Items Row */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              gap: '20px', 
              paddingLeft: '24px',
              paddingRight: '24px',
              paddingBottom: '0',
            }}>
              {displayItems.length > 0 ? (
                displayItems.map((item, index) => (
                  <div 
                    key={item.id} 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    {/* Rank badge for Top 5 */}
                    {isTop5 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        borderRadius: '50%',
                        marginBottom: '-18px',
                        zIndex: 10,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      }}>
                        <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>
                          {index + 1}
                        </span>
                      </div>
                    )}
                    {/* Book cover */}
                    <div style={{
                      display: 'flex',
                      width: '140px',
                      height: '200px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)',
                      background: item.image_url ? 'transparent' : getTypeGradient(item.type),
                    }}>
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
                          padding: '12px',
                          color: 'white',
                        }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', textAlign: 'center', lineHeight: 1.2 }}>
                            {item.title.length > 30 ? item.title.substring(0, 30) + '...' : item.title}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '100%',
                  height: '200px',
                  color: '#9ca3af',
                  fontSize: '20px',
                }}>
                  Empty shelf - add some items!
                </div>
              )}
              
              {/* Show "+X more" if there are more items */}
              {items.length > 5 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100px',
                  height: '200px',
                  background: 'rgba(0,0,0,0.05)',
                  borderRadius: '4px',
                  color: '#6b7280',
                  fontSize: '20px',
                  fontWeight: '600',
                }}>
                  +{items.length - 5} more
                </div>
              )}
            </div>

            {/* Shelf Bar */}
            <div style={{
              display: 'flex',
              width: '100%',
              height: '12px',
              background: 'linear-gradient(180deg, #78716c 0%, #57534e 50%, #44403c 100%)',
              borderRadius: '2px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)',
            }} />
          </div>

          {/* Footer */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginTop: '24px',
          }}>
            <span style={{ fontSize: '18px', color: '#9ca3af' }}>
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
                <span>Built with</span>
                <TechBadge name="Neon" color="#00E599" />
                <span style={{ color: '#9ca3af' }}>•</span>
                <TechBadge name="Next.js" color="#000000" />
                <span style={{ color: '#9ca3af' }}>•</span>
                <TechBadge name="Vercel" color="#000000" />
              </div>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    
    // Return fallback image on error
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <BookshelfIcon />
            <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'white' }}>
              Virtual Bookshelf
            </span>
          </div>
          <p style={{ fontSize: '24px', color: 'rgba(255,255,255,0.7)' }}>
            Curate and share your favorites
          </p>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }
}

// Helper function to get gradient based on item type
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

// SVG Components for the OG image
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

function TrophyIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#d97706">
      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
    </svg>
  );
}

function TechBadge({ name, color }: { name: string; color: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      background: `${color}15`,
      padding: '4px 8px',
      borderRadius: '4px',
      border: `1px solid ${color}30`,
    }}>
      <span style={{ fontSize: '12px', fontWeight: '600', color: color === '#000000' ? '#374151' : color }}>
        {name}
      </span>
    </div>
  );
}
