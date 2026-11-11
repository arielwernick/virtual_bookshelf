import { MetadataRoute } from 'next'

// Private or duplicate surfaces. /embed/ is the iframe version of /s/.
const DISALLOW = ['/dashboard', '/api/', '/embed/']

// Share-card images live under /api/og/. Without this, crawlers that respect
// robots.txt are refused the image that makes a shared link look right.
const ALLOW = ['/', '/api/og/']

/**
 * Crawlers that fetch pages to answer a person's question or to build a
 * search index, and that link back to the source. They are named so the policy
 * is explicit and easy to change; they get the same rules as everyone else.
 *
 * Crawlers that collect training data (GPTBot, ClaudeBot, Google-Extended,
 * CCBot) are a separate decision and fall under the default rule for now.
 */
export const AI_SEARCH_CRAWLERS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
]

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app'
  return {
    rules: [
      { userAgent: '*', allow: ALLOW, disallow: DISALLOW },
      { userAgent: AI_SEARCH_CRAWLERS, allow: ALLOW, disallow: DISALLOW },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
