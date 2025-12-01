import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

/**
 * Generate Open Graph image for the landing page
 * 
 * This creates a beautiful hero image showing:
 * - App name and tagline
 * - Visual bookshelf with colorful book spines
 * - Clean, professional branding
 * 
 * Used when sharing the main site on LinkedIn, Twitter, etc.
 */
export async function GET() {
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
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Decorative background pattern */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '400px',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 50%, rgba(34, 197, 94, 0.08) 100%)',
            borderRadius: '0 0 0 200px',
          }}
        />

        {/* Header with logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px', zIndex: 1 }}>
          <BookshelfIcon size={56} />
          <span style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>
            Virtual Bookshelf
          </span>
        </div>

        {/* Main headline */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', zIndex: 1 }}>
          <h1
            style={{
              fontSize: '72px',
              fontWeight: '800',
              color: '#111827',
              margin: '0 0 20px 0',
              lineHeight: 1.1,
              maxWidth: '700px',
              letterSpacing: '-0.02em',
            }}
          >
            Your bookshelf,
            <br />
            everywhere you are
          </h1>
          
          <p
            style={{
              fontSize: '28px',
              color: '#4b5563',
              margin: '0 0 40px 0',
              maxWidth: '600px',
              lineHeight: 1.4,
            }}
          >
            Curate your favorite books, podcasts, and music.
            Share a link anywhere.
          </p>

          {/* Feature badges */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <FeatureBadge icon="📚" text="Books" color="#3b82f6" />
            <FeatureBadge icon="🎙️" text="Podcasts" color="#8b5cf6" />
            <FeatureBadge icon="🎵" text="Music" color="#22c55e" />
          </div>
        </div>

        {/* Visual bookshelf illustration */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'absolute',
            right: '60px',
            bottom: '80px',
            alignItems: 'flex-end',
          }}
        >
          {/* Books on shelf */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '0' }}>
            <BookSpine height={140} color="#3b82f6" />
            <BookSpine height={160} color="#8b5cf6" />
            <BookSpine height={130} color="#22c55e" />
            <BookSpine height={155} color="#f59e0b" />
            <BookSpine height={145} color="#ec4899" />
            <BookSpine height={135} color="#6366f1" />
            <BookSpine height={150} color="#14b8a6" />
          </div>
          
          {/* Shelf bar */}
          <div
            style={{
              display: 'flex',
              width: '340px',
              height: '12px',
              background: 'linear-gradient(180deg, #78716c 0%, #57534e 50%, #44403c 100%)',
              borderRadius: '2px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)',
            }}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 1,
          }}
        >
          <span style={{ fontSize: '18px', color: '#9ca3af' }}>
            Free • Beautiful • Shareable
          </span>
          <span style={{ fontSize: '20px', color: '#6b7280', fontWeight: '600' }}>
            virtualbookshelf.app
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

// Book spine illustration component
function BookSpine({ height, color }: { height: number; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '36px',
        height: `${height}px`,
        background: `linear-gradient(135deg, ${color} 0%, ${adjustColor(color, -30)} 100%)`,
        borderRadius: '3px 6px 6px 3px',
        boxShadow: '2px 0 8px rgba(0,0,0,0.15), -1px 0 2px rgba(255,255,255,0.2) inset',
        position: 'relative',
      }}
    >
      {/* Spine detail line */}
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          left: '4px',
          top: '0',
          bottom: '0',
          width: '2px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '1px',
        }}
      />
    </div>
  );
}

// Feature badge component
function FeatureBadge({ icon, text, color }: { icon: string; text: string; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: `2px solid ${color}20`,
      }}
    >
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <span style={{ fontSize: '18px', fontWeight: '600', color: '#374151' }}>{text}</span>
    </div>
  );
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
