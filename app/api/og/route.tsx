import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

/**
 * Generate default Open Graph image for the home page
 * 
 * This creates a beautiful preview image showing:
 * - App name and tagline
 * - Tech stack badges (Neon, Next.js, Vercel)
 * - Professional branding
 * 
 * Used when sharing the home page on LinkedIn, Twitter, etc.
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
          background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
          fontFamily: 'system-ui, sans-serif',
          padding: '60px',
        }}
      >
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
          {/* Logo and Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
            <BookshelfIcon />
            <span style={{ fontSize: '64px', fontWeight: 'bold', color: 'white' }}>
              Virtual Bookshelf
            </span>
          </div>

          {/* Tagline */}
          <p style={{ 
            fontSize: '32px', 
            color: 'rgba(255,255,255,0.8)', 
            margin: '0 0 48px 0',
            maxWidth: '800px',
            lineHeight: 1.4,
          }}>
            Create beautiful shelves to share your favorite books, podcasts, and music
          </p>

          {/* Features */}
          <div style={{ display: 'flex', gap: '32px' }}>
            <FeatureBadge icon="📚" text="Books" />
            <FeatureBadge icon="🎙️" text="Podcasts" />
            <FeatureBadge icon="🎵" text="Music" />
          </div>
        </div>

        {/* Footer with Tech Stack */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: '24px',
        }}>
          <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)' }}>
            virtualbookshelf.app
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Built with</span>
            <TechBadge name="Neon" color="#00E599" />
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
            <TechBadge name="Next.js" color="#ffffff" />
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
            <TechBadge name="Vercel" color="#ffffff" />
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

// SVG Component for the OG image
function BookshelfIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="white">
      <rect x="2" y="8" width="2" height="10" />
      <rect x="4.5" y="6" width="2" height="12" />
      <rect x="7" y="7" width="2" height="11" />
      <rect x="9.5" y="5" width="2" height="13" />
      <rect x="12" y="7" width="2" height="11" />
      <rect x="14.5" y="6" width="2" height="12" />
      <rect x="17" y="8" width="2" height="10" />
      <rect x="19.5" y="7" width="2" height="11" />
      <line x1="1" y1="19" x2="23" y2="19" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

function TechBadge({ name, color }: { name: string; color: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      background: 'rgba(255,255,255,0.1)',
      padding: '6px 12px',
      borderRadius: '6px',
      border: '1px solid rgba(255,255,255,0.2)',
    }}>
      <span style={{ fontSize: '14px', fontWeight: '600', color }}>
        {name}
      </span>
    </div>
  );
}

function FeatureBadge({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: 'rgba(255,255,255,0.05)',
      padding: '16px 24px',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <span style={{ fontSize: '32px' }}>{icon}</span>
      <span style={{ fontSize: '20px', fontWeight: '500', color: 'rgba(255,255,255,0.9)' }}>{text}</span>
    </div>
  );
}
