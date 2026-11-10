import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Markdown, { type Components } from 'react-markdown';
import { getAllGuides, getGuide } from '@/lib/utils/guides';
import { breadcrumbJsonLd, faqPageJsonLd } from '@/lib/utils/landingSchema';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app';

const h2Class = 'text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight';
const primaryCta =
  'inline-block px-8 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-all font-medium text-lg shadow-md hover:shadow-lg';

const markdownComponents: Components = {
  h2: ({ children }) => <h2 className={`${h2Class} mt-12 mb-4`}>{children}</h2>,
  h3: ({ children }) => <h3 className="mt-8 mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">{children}</h3>,
  p: ({ children }) => <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">{children}</p>,
  ol: ({ children }) => <ol className="mt-4 ml-5 list-decimal space-y-3 text-gray-600 dark:text-gray-400 leading-relaxed">{children}</ol>,
  ul: ({ children }) => <ul className="mt-4 ml-5 list-disc space-y-3 text-gray-600 dark:text-gray-400 leading-relaxed">{children}</ul>,
  strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
  a: ({ href, children }) => <a href={href} className="underline text-gray-900 dark:text-gray-100">{children}</a>,
};

type PageProps = { params: Promise<{ slug: string }> };

// Guides are built ahead of time, so any other slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllGuides().map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: 'Guide Not Found' };

  return {
    title: guide.question,
    description: guide.description,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      title: guide.question,
      description: guide.description,
      type: 'article',
      url: `${baseUrl}/guides/${guide.slug}`,
      siteName: 'Virtual Bookshelf',
      images: [{ url: `${baseUrl}/api/og/landing`, width: 1200, height: 630, alt: guide.question }],
    },
  };
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const jsonLd = [
    ...(guide.faq.length > 0 ? [faqPageJsonLd(guide.faq)] : []),
    breadcrumbJsonLd([
      { name: 'Home', url: baseUrl },
      { name: 'Guides', url: `${baseUrl}/guides` },
      { name: guide.question, url: `${baseUrl}/guides/${guide.slug}` },
    ]),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}

      <main id="main-content" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-20">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <li><Link href="/" className="hover:text-gray-700 dark:hover:text-gray-300">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/guides" className="hover:text-gray-700 dark:hover:text-gray-300">Guides</Link></li>
          </ol>
        </nav>

        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{guide.question}</h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-700 dark:text-gray-300 leading-relaxed">{guide.answer}</p>

        <Markdown components={markdownComponents}>{guide.body}</Markdown>

        <section aria-labelledby="example-heading" className="mt-14">
          <h2 id="example-heading" className={h2Class}>See a live shelf</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400">This is {guide.shelf.label}, embedded live. Click any item to explore it.</p>
          <iframe
            src={`${baseUrl}/embed/${guide.shelf.token}?theme=light`}
            title={guide.shelf.label}
            className="mt-5 w-full rounded-lg bg-white"
            style={{ height: 600, border: 'none' }}
            loading="lazy"
          />
        </section>

        {guide.faq.length > 0 && (
          <section aria-labelledby="faq-heading" className="mt-14">
            <h2 id="faq-heading" className={`${h2Class} mb-8`}>Frequently asked questions</h2>
            <dl className="space-y-8">
              {guide.faq.map((item) => (
                <div key={item.q}>
                  <dt className="font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg">{item.q}</dt>
                  <dd className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className="mt-16 text-center">
          <h2 className={h2Class}>Start your shelf</h2>
          <div className="mt-6">
            <Link href="/signup" className={primaryCta}>Create your shelf — free</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
