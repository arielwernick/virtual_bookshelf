import { MetadataRoute } from 'next'
import { getPublicShelves, getPublicVideoItems } from '@/lib/db/queries'
import { buildSharePath } from '@/lib/utils/slug'
import { extractVideoId } from '@/lib/api/youtube'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app'
  const [shelves, videoItems] = await Promise.all([
    getPublicShelves(),
    getPublicVideoItems(),
  ])

  const shelfUrls = shelves.map(shelf => ({
    url: `${baseUrl}${buildSharePath(shelf.name, shelf.share_token)}`,
    lastModified: shelf.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // One canonical /v/[videoId] entry per video; keep the most recent
  // lastModified when the same video appears on multiple public shelves.
  const videoLastModified = new Map<string, Date>()
  for (const { external_url, updated_at } of videoItems) {
    const videoId = external_url ? extractVideoId(external_url) : null
    if (!videoId) continue
    const existing = videoLastModified.get(videoId)
    if (!existing || updated_at > existing) {
      videoLastModified.set(videoId, updated_at)
    }
  }

  const videoUrls = Array.from(videoLastModified.entries()).map(([videoId, lastModified]) => ({
    url: `${baseUrl}/v/${videoId}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/bento-alternative`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/linktree-alternative`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/goodreads-alternative`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/login`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/signup`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/curate-conference-resources`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/embed-anywhere`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/claude`, changeFrequency: 'monthly', priority: 0.9 },
    ...shelfUrls,
    ...videoUrls,
  ]
}
