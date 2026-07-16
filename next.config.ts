import type { NextConfig } from "next";

// Security headers applied to all routes except /embed/* (which needs to be iframed cross-origin).
const baseSecurityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      // Clean, memorable connector URL. Routes to the mcp-handler mount, which
      // requires the `[transport]` segment (`mcp` = Streamable HTTP). The
      // internal /api/mcp/mcp path keeps working as a fallback.
      { source: '/mcp', destination: '/api/mcp/mcp' },
    ];
  },
  async headers() {
    return [
      {
        // Negative lookahead: applies to every path except those starting with embed/
        source: '/((?!embed/).*)',
        headers: baseSecurityHeaders,
      },
      {
        source: '/embed/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
