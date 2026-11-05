import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicVideoByVideoId } from '@/lib/db/queries';
import {
  isValidVideoId,
  getEmbedUrl,
  getWatchUrl,
  getThumbnailUrl,
} from '@/lib/api/youtube';
import { generateVideoObjectSchemaJson } from '@/lib/utils/schemaMarkup';
import { buildSharePath } from '@/lib/utils/slug';

interface PageProps {
  params: Promise<{ videoId: string }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app';

/**
 * Dedicated video watch page — /v/[videoId]
 *
 * Unlike the shelf collection page, a single video is the main, embedded,
 * playable content here. The YouTube player is rendered directly into the
 * server HTML (not behind a modal), and the page carries full VideoObject
 * structured data, so Google can index it as a real "watch page" and surface
 * it in video results. See lib/utils/schemaMarkup.ts for the schema rationale.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { videoId } = await params;

  if (!isValidVideoId(videoId)) {
    return { title: 'Video Not Found | Virtual Bookshelf' };
  }

  const result = await getPublicVideoByVideoId(videoId);
  if (!result) {
    return { title: 'Video Not Found | Virtual Bookshelf' };
  }

  const { item, shelfName } = result;
  const description = item.notes
    ? item.notes.substring(0, 155)
    : `${item.title}${item.creator ? ` by ${item.creator}` : ''} — from the "${shelfName}" shelf on Virtual Bookshelf.`;
  const canonical = `${BASE_URL}/v/${videoId}`;
  const thumbnailUrl = item.image_url || getThumbnailUrl(videoId);

  return {
    title: `${item.title} | Virtual Bookshelf`,
    description,
    alternates: { canonical },
    openGraph: {
      title: item.title,
      description,
      type: 'video.other',
      url: canonical,
      images: [{ url: thumbnailUrl, alt: item.title }],
      siteName: 'Virtual Bookshelf',
    },
    twitter: {
      card: 'player',
      title: item.title,
      description,
      images: [thumbnailUrl],
    },
  };
}

export default async function VideoWatchPage({ params }: PageProps) {
  const { videoId } = await params;

  if (!isValidVideoId(videoId)) {
    notFound();
  }

  const result = await getPublicVideoByVideoId(videoId);
  if (!result) {
    notFound();
  }

  const { item, shelfName, shelfShareToken } = result;
  const embedUrl = getEmbedUrl(videoId);
  const contentUrl = getWatchUrl(videoId);
  const thumbnailUrl = item.image_url || getThumbnailUrl(videoId);

  const schemaJson = generateVideoObjectSchemaJson(item, {
    embedUrl,
    contentUrl,
    thumbnailUrl,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaJson }}
        suppressHydrationWarning
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Embedded player — the main content, in server HTML for crawlers */}
          <div className="relative w-full overflow-hidden rounded-xl bg-black shadow-lg" style={{ aspectRatio: '16 / 9' }}>
            <iframe
              className="absolute inset-0 h-full w-full"
              src={embedUrl}
              title={item.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          </div>

          {/* Metadata */}
          <div className="mt-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {item.title}
            </h1>
            {item.creator && (
              <p className="mt-1 text-gray-600 dark:text-gray-400">{item.creator}</p>
            )}

            {item.notes && (
              <p className="mt-4 whitespace-pre-line text-gray-700 dark:text-gray-300 leading-relaxed">
                {item.notes}
              </p>
            )}

            {/* Backlink into the collection it belongs to */}
            <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-6">
              <Link
                href={buildSharePath(shelfName, shelfShareToken)}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:underline"
              >
                <span aria-hidden>←</span>
                From the &ldquo;{shelfName}&rdquo; shelf
              </Link>
            </div>

            {/* Direct link to source */}
            <div className="mt-4">
              <a
                href={contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
              >
                Watch on YouTube ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
