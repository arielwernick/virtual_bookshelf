import { describe, it, expect } from 'vitest';
import nextConfig from '../../next.config';
import { CSP_REPORT_ONLY_HEADER, buildContentSecurityPolicy } from './csp';

type HeaderRule = { source: string; headers: { key: string; value: string }[] };

async function headerRules(): Promise<HeaderRule[]> {
  return (await nextConfig.headers!()) as HeaderRule[];
}

describe('Content Security Policy', () => {
  it('is well formed and names what the site loads', () => {
    const policy = buildContentSecurityPolicy();

    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain('https://www.youtube.com');
    expect(policy).toContain('https://open.spotify.com');
    expect(policy).not.toMatch(/;\s*;/);
  });

  it('never allows scripts from anywhere or eval', () => {
    const scriptSrc = buildContentSecurityPolicy()
      .split('; ')
      .find((directive) => directive.startsWith('script-src'))!;

    expect(scriptSrc).not.toContain(' *');
    expect(scriptSrc).not.toContain(' https: ');
    expect(scriptSrc).not.toContain('unsafe-eval');
  });

  it('is sent in report-only mode on the main site, so it cannot break a page', async () => {
    const main = (await headerRules()).find((rule) => !rule.source.startsWith('/embed'))!;
    const keys = main.headers.map((header) => header.key);

    expect(keys).toContain(CSP_REPORT_ONLY_HEADER);
    expect(keys).not.toContain('Content-Security-Policy');
  });

  it('is not sent on embeds, which must be framed by other sites', async () => {
    const embed = (await headerRules()).find((rule) => rule.source.startsWith('/embed'))!;
    const keys = embed.headers.map((header) => header.key);

    expect(keys).not.toContain(CSP_REPORT_ONLY_HEADER);
    expect(embed.headers.find((h) => h.key === 'Content-Security-Policy')?.value).toBe('frame-ancestors *');
  });
});
