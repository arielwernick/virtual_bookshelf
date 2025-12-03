# TASK-006: Restrict Image Domains in Next.js Config

**Priority:** 🟠 High  
**Estimated Effort:** 30 minutes  
**Security Impact:** Prevent SSRF and image proxy abuse

---

## Context

The current Next.js configuration allows loading images from any HTTPS domain:

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**',  // Allows ANY hostname
    },
  ],
},
```

This creates several risks:
- **SSRF (Server-Side Request Forgery):** The image optimization API could be used to probe internal services
- **Proxy Abuse:** Attackers could use your server as a proxy for any image
- **Inappropriate Content:** No control over what images are loaded

---

## Requirements

1. Restrict image domains to known, trusted sources
2. Include all domains used by Google Books API
3. Include all domains used by Spotify API
4. Maintain image functionality for existing items
5. Document the allowed domains

---

## Implementation Guide

### Step 1: Identify Required Domains

Based on the APIs used:

**Google Books:**
- `books.google.com`
- `*.googleusercontent.com` (book cover CDN)

**Spotify:**
- `i.scdn.co` (main image CDN)
- `mosaic.scdn.co` (playlist mosaics)
- `image-cdn-*.spotifycdn.com` (newer CDN)
- `platform-lookaside.fbsbx.com` (some podcast images)

**Other:**
- `image.simplecastcdn.com` (some podcasts)
- User-provided URLs (need consideration)

### Step 2: Update Next.js Config

Modify `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Google Books images
      {
        protocol: 'https',
        hostname: 'books.google.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      
      // Spotify images
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
      },
      {
        protocol: 'https',
        hostname: 'mosaic.scdn.co',
      },
      {
        protocol: 'https',
        hostname: 'image-cdn-*.spotifycdn.com',
      },
      {
        protocol: 'https',
        hostname: '*.spotifycdn.com',
      },
      
      // Podcast images (various CDNs)
      {
        protocol: 'https',
        hostname: 'image.simplecastcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'ssl-static.libsyn.com',
      },
      {
        protocol: 'https',
        hostname: 'megaphone.imgix.net',
      },
      {
        protocol: 'https',
        hostname: 'media.npr.org',
      },
      {
        protocol: 'https',
        hostname: 'static.libsyn.com',
      },
      {
        protocol: 'https',
        hostname: 'pbcdn1.podbean.com',
      },
      {
        protocol: 'https',
        hostname: 'www.omnycontent.com',
      },
      
      // Platform-specific
      {
        protocol: 'https',
        hostname: 'platform-lookaside.fbsbx.com', // Facebook-hosted podcast art
      },
    ],
  },
  
  // Remove X-Powered-By header
  poweredByHeader: false,
  
  // Enable React strict mode
  reactStrictMode: true,
};

export default nextConfig;
```

### Step 3: Handle User-Provided URLs

For items where users might paste custom image URLs, you have options:

**Option A: Proxy through your server (recommended)**
Create an image proxy endpoint that validates and caches images:

```typescript
// app/api/image-proxy/route.ts
import { NextResponse } from 'next/server';

const ALLOWED_HOSTS = [
  'books.google.com',
  'i.scdn.co',
  // ... etc
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  
  if (!imageUrl) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 });
  }
  
  try {
    const url = new URL(imageUrl);
    
    // Validate host
    const isAllowed = ALLOWED_HOSTS.some(host => 
      url.hostname === host || url.hostname.endsWith('.' + host)
    );
    
    if (!isAllowed) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }
    
    // Fetch and return image
    const response = await fetch(imageUrl);
    const contentType = response.headers.get('content-type');
    
    if (!contentType?.startsWith('image/')) {
      return NextResponse.json({ error: 'Not an image' }, { status: 400 });
    }
    
    const buffer = await response.arrayBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}
```

**Option B: Use standard img tags for untrusted sources**
```tsx
// For trusted sources, use next/image
<Image src={item.imageUrl} alt={item.title} ... />

// For untrusted/unknown sources, use regular img
<img src={item.imageUrl} alt={item.title} className="..." loading="lazy" />
```

### Step 4: Update Image Components

Audit components that use `next/image` and ensure they handle missing/failed images:

```tsx
import Image from 'next/image';
import { useState } from 'react';

function BookCover({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);
  
  if (error || !src) {
    return <div className="bg-gray-200 flex items-center justify-center">📚</div>;
  }
  
  return (
    <Image
      src={src}
      alt={alt}
      width={200}
      height={300}
      onError={() => setError(true)}
    />
  );
}
```

---

## Files to Modify

| File | Action |
|------|--------|
| `next.config.ts` | Modify - Restrict image domains |
| `app/api/image-proxy/route.ts` | Create (Optional) - Image proxy |
| Components using `next/image` | Review - Handle errors gracefully |

---

## Acceptance Criteria

- [ ] Wildcard hostname is removed from config
- [ ] Only specific trusted domains are allowed
- [ ] Google Books images still load
- [ ] Spotify album/podcast images still load
- [ ] Build succeeds
- [ ] Existing shelf items with images display correctly
- [ ] Error handling for images from unknown domains

---

## Testing Instructions

### Manual Testing

1. Create a shelf and add items via search (uses API images)
2. Verify images load correctly
3. Check browser console for image loading errors
4. Try to load an image from an unlisted domain (should fail)

### Domain Testing Checklist

- [ ] `https://books.google.com/books/...` - Should load
- [ ] `https://i.scdn.co/image/...` - Should load
- [ ] `https://evil-domain.com/image.jpg` - Should NOT load via next/image

### Build Test

```bash
npm run build
npm run start
# Test image loading in production mode
```

---

## Adding New Domains

If a new image source needs to be added:

1. Identify the CDN hostname
2. Add to `remotePatterns` in `next.config.ts`
3. Test the integration
4. Document why the domain was added

---

## Rollback Plan

If images break unexpectedly:
1. Temporarily add back the wildcard pattern
2. Identify which domains need to be added
3. Update config with specific domains
4. Remove wildcard again

---

## References

- Original audit finding: `docs/SECURITY_AUDIT.md` - Finding #6
- [Next.js Image Configuration](https://nextjs.org/docs/app/api-reference/components/image#remotepatterns)
- OWASP: [SSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
