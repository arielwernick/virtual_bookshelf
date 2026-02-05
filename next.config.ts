import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              // Default to same origin
              "default-src 'self'",
              // Scripts: Allow self, Vercel Analytics, and Next.js chunks
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com",
              // Styles: Allow self, inline styles (for Tailwind and Confetti), and Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Images: Allow self, data URIs, HTTPS images, and blob URIs
              "img-src 'self' data: https: blob:",
              // Fonts: Allow self and Google Fonts
              "font-src 'self' https://fonts.gstatic.com data:",
              // Connect (AJAX/fetch): Allow self, Vercel Analytics, and Google APIs
              "connect-src 'self' https://vitals.vercel-insights.com https://accounts.google.com https://www.googleapis.com https://oauth2.googleapis.com",
              // Frames: Allow YouTube embeds
              "frame-src 'self' https://www.youtube.com",
              // Form actions: Allow self and Google OAuth
              "form-action 'self' https://accounts.google.com",
              // Base URI: Restrict to self
              "base-uri 'self'",
              // Object/embed: Block plugins
              "object-src 'none'",
              // Upgrade insecure requests in production
              ...(process.env.NODE_ENV === 'production' ? ["upgrade-insecure-requests"] : []),
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
      {
        // Separate headers for embed routes to allow embedding
        source: '/embed/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' https://fonts.gstatic.com data:",
              "connect-src 'self' https://vitals.vercel-insights.com",
              "frame-src 'self' https://www.youtube.com",
              "base-uri 'self'",
              "object-src 'none'",
              ...(process.env.NODE_ENV === 'production' ? ["upgrade-insecure-requests"] : []),
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
