import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllGuides } from '@/lib/utils/guides';
import { breadcrumbJsonLd } from '@/lib/utils/landingSchema';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app';
const description = 'Practical guides to curating, sharing, and embedding shelves of the books, podcasts, music, and videos you love.';

export const metadata: Metadata = {
  title: 'Guides',
  description,
  alternates: { canonical: '/guides' },
  openGraph: {
    title: 'Virtual Bookshelf Guides',
    description,
    type: 'website',
    url: `${baseUrl}/guides`,
    siteName: 'Virtual Bookshelf',
    images: [{ url: `${baseUrl}/api/og/landing`, width: 1200, height: 630, alt: 'Virtual Bookshelf guides' }],
  },
};

const jsonLd = breadcrumbJsonLd([
  { name: 'Home', url: baseUrl },
  { name: 'Guides', url: `${baseUrl}/guides` },
]);

export default function GuidesPage() {
  const guides = getAllGuides();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main id="main-content" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-20">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <li><Link href="/" className="hover:text-gray-700 dark:hover:text-gray-300">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-gray-700 dark:text-gray-300 font-medium">Guides</li>
          </ol>
        </nav>

        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Guides</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">{description}</p>

        <ul className="mt-10 space-y-4">
          {guides.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={`/guides/${guide.slug}`}
                className="block rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/50 p-6 transition hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md"
              >
                <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{guide.question}</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{guide.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
