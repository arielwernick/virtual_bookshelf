import { describe, it, expect } from 'vitest';
import nextConfig from '../next.config';

describe('next.config.ts - Security Headers', () => {
  it('exports a valid Next.js config object', () => {
    expect(nextConfig).toBeDefined();
    expect(typeof nextConfig).toBe('object');
  });

  it('has headers function defined', () => {
    expect(nextConfig.headers).toBeDefined();
    expect(typeof nextConfig.headers).toBe('function');
  });

  describe('CSP Configuration', () => {
    it('configures headers for all routes', async () => {
      if (!nextConfig.headers) {
        throw new Error('headers function not defined');
      }
      
      const headers = await nextConfig.headers();
      expect(headers).toBeDefined();
      expect(Array.isArray(headers)).toBe(true);
      expect(headers.length).toBeGreaterThan(0);
      
      // Find the main route config
      const mainRouteConfig = headers.find(h => h.source === '/:path*');
      expect(mainRouteConfig).toBeDefined();
      expect(mainRouteConfig?.headers).toBeDefined();
      expect(Array.isArray(mainRouteConfig?.headers)).toBe(true);
    });

    it('includes Content-Security-Policy header for main routes', async () => {
      if (!nextConfig.headers) {
        throw new Error('headers function not defined');
      }
      
      const headers = await nextConfig.headers();
      const mainRouteConfig = headers.find(h => h.source === '/:path*');
      const cspHeader = mainRouteConfig?.headers.find(h => h.key === 'Content-Security-Policy');
      
      expect(cspHeader).toBeDefined();
      expect(cspHeader?.value).toBeDefined();
      expect(typeof cspHeader?.value).toBe('string');
    });

    it('CSP includes essential directives', async () => {
      if (!nextConfig.headers) {
        throw new Error('headers function not defined');
      }
      
      const headers = await nextConfig.headers();
      const mainRouteConfig = headers.find(h => h.source === '/:path*');
      const cspHeader = mainRouteConfig?.headers.find(h => h.key === 'Content-Security-Policy');
      const cspValue = cspHeader?.value as string;
      
      // Check for essential CSP directives
      expect(cspValue).toContain("default-src 'self'");
      expect(cspValue).toContain('script-src');
      expect(cspValue).toContain('style-src');
      expect(cspValue).toContain('img-src');
      expect(cspValue).toContain('font-src');
      expect(cspValue).toContain('connect-src');
      expect(cspValue).toContain('frame-src');
      expect(cspValue).toContain('form-action');
      expect(cspValue).toContain('base-uri');
      expect(cspValue).toContain("object-src 'none'");
    });

    it('CSP allows required external sources', async () => {
      if (!nextConfig.headers) {
        throw new Error('headers function not defined');
      }
      
      const headers = await nextConfig.headers();
      const mainRouteConfig = headers.find(h => h.source === '/:path*');
      const cspHeader = mainRouteConfig?.headers.find(h => h.key === 'Content-Security-Policy');
      const cspValue = cspHeader?.value as string;
      
      // Vercel Analytics
      expect(cspValue).toContain('https://va.vercel-scripts.com');
      expect(cspValue).toContain('https://vitals.vercel-insights.com');
      
      // Google Fonts
      expect(cspValue).toContain('https://fonts.googleapis.com');
      expect(cspValue).toContain('https://fonts.gstatic.com');
      
      // Google OAuth
      expect(cspValue).toContain('https://accounts.google.com');
      expect(cspValue).toContain('https://www.googleapis.com');
      expect(cspValue).toContain('https://oauth2.googleapis.com');
      
      // YouTube embeds
      expect(cspValue).toContain('https://www.youtube.com');
    });

    it('configures separate headers for embed routes', async () => {
      if (!nextConfig.headers) {
        throw new Error('headers function not defined');
      }
      
      const headers = await nextConfig.headers();
      const embedRouteConfig = headers.find(h => h.source === '/embed/:path*');
      
      expect(embedRouteConfig).toBeDefined();
      expect(embedRouteConfig?.headers).toBeDefined();
      
      // Embed routes should have ALLOWALL for X-Frame-Options
      const xFrameHeader = embedRouteConfig?.headers.find(h => h.key === 'X-Frame-Options');
      expect(xFrameHeader?.value).toBe('ALLOWALL');
    });
  });

  describe('Additional Security Headers', () => {
    it('includes X-Frame-Options header', async () => {
      if (!nextConfig.headers) {
        throw new Error('headers function not defined');
      }
      
      const headers = await nextConfig.headers();
      const mainRouteConfig = headers.find(h => h.source === '/:path*');
      const xFrameHeader = mainRouteConfig?.headers.find(h => h.key === 'X-Frame-Options');
      
      expect(xFrameHeader).toBeDefined();
      expect(xFrameHeader?.value).toBe('SAMEORIGIN');
    });

    it('includes X-Content-Type-Options header', async () => {
      if (!nextConfig.headers) {
        throw new Error('headers function not defined');
      }
      
      const headers = await nextConfig.headers();
      const mainRouteConfig = headers.find(h => h.source === '/:path*');
      const contentTypeHeader = mainRouteConfig?.headers.find(h => h.key === 'X-Content-Type-Options');
      
      expect(contentTypeHeader).toBeDefined();
      expect(contentTypeHeader?.value).toBe('nosniff');
    });

    it('includes Referrer-Policy header', async () => {
      if (!nextConfig.headers) {
        throw new Error('headers function not defined');
      }
      
      const headers = await nextConfig.headers();
      const mainRouteConfig = headers.find(h => h.source === '/:path*');
      const referrerHeader = mainRouteConfig?.headers.find(h => h.key === 'Referrer-Policy');
      
      expect(referrerHeader).toBeDefined();
      expect(referrerHeader?.value).toBe('strict-origin-when-cross-origin');
    });

    it('includes X-XSS-Protection header', async () => {
      if (!nextConfig.headers) {
        throw new Error('headers function not defined');
      }
      
      const headers = await nextConfig.headers();
      const mainRouteConfig = headers.find(h => h.source === '/:path*');
      const xssHeader = mainRouteConfig?.headers.find(h => h.key === 'X-XSS-Protection');
      
      expect(xssHeader).toBeDefined();
      expect(xssHeader?.value).toBe('1; mode=block');
    });

    it('includes Permissions-Policy header', async () => {
      if (!nextConfig.headers) {
        throw new Error('headers function not defined');
      }
      
      const headers = await nextConfig.headers();
      const mainRouteConfig = headers.find(h => h.source === '/:path*');
      const permissionsHeader = mainRouteConfig?.headers.find(h => h.key === 'Permissions-Policy');
      
      expect(permissionsHeader).toBeDefined();
      expect(permissionsHeader?.value).toContain('camera=()');
      expect(permissionsHeader?.value).toContain('microphone=()');
      expect(permissionsHeader?.value).toContain('geolocation=()');
    });
  });

  describe('Image Configuration', () => {
    it('has remote image patterns configured', () => {
      expect(nextConfig.images).toBeDefined();
      expect(nextConfig.images?.remotePatterns).toBeDefined();
      expect(Array.isArray(nextConfig.images?.remotePatterns)).toBe(true);
      expect(nextConfig.images?.remotePatterns?.length).toBeGreaterThan(0);
    });
  });
});
