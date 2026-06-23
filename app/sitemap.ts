import { MetadataRoute } from 'next'
import { getPublicShelves } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app'
  const shelves = await getPublicShelves()

  const shelfUrls = shelves.map(shelf => ({
    url: `${baseUrl}/s/${shelf.share_token}`,
    lastModified: shelf.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/bento-alternative`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/linktree-alternative`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/goodreads-alternative`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/login`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/signup`, changeFrequency: 'yearly', priority: 0.3 },
    ...shelfUrls,
  ]
}
