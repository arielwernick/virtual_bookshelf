/**
 * JSON-LD builders shared by the competitor "alternative" landing pages.
 * Keeps FAQPage / BreadcrumbList markup consistent and in one place.
 */

export interface FaqItem {
  q: string;
  a: string;
}

export function faqPageJsonLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

export function breadcrumbJsonLd(crumbs: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

export interface HowToStep {
  name: string;
  text: string;
}

/**
 * HowTo markup for step-by-step guides (e.g. "connect Claude in 3 steps").
 * Eligible for HowTo rich results and easy for LLMs to lift verbatim.
 */
export function howToJsonLd(opts: { name: string; description: string; steps: HowToStep[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: opts.name,
    description: opts.description,
    step: opts.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

/**
 * SoftwareApplication markup so the connector can be named/cited as a product
 * (e.g. "which MCP server manages reading lists?").
 */
export function softwareApplicationJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  applicationCategory?: string;
  operatingSystem?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    applicationCategory: opts.applicationCategory ?? 'ProductivityApplication',
    operatingSystem: opts.operatingSystem ?? 'Claude, Claude Code, any MCP client',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}
