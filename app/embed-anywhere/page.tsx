import type { Metadata } from 'next';
import Link from 'next/link';
import { EmbedContextSwitcher } from '@/components/landing/EmbedContextSwitcher';
import { faqPageJsonLd, breadcrumbJsonLd, type FaqItem } from '@/lib/utils/landingSchema';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app';

export const metadata: Metadata = {
  title: 'Embed a Shelf in Your Newsletter, Email, or Website — Virtual Bookshelf',
  description:
    'Embed a live, clickable resource shelf directly in a newsletter, email, or website. One snippet, always up to date — no screenshots, no broken link lists.',
  alternates: { canonical: '/embed-anywhere' },
  openGraph: {
    title: 'Embed a Shelf Anywhere — Newsletter, Email, or Website',
    description:
      'Drop a live, clickable resource shelf into a newsletter, email, or website with one embed snippet. Update the shelf once and it updates everywhere it is embedded.',
    type: 'website',
    url: `${baseUrl}/embed-anywhere`,
    siteName: 'Virtual Bookshelf',
    images: [{ url: `${baseUrl}/api/og/landing`, width: 1200, height: 630, alt: 'Virtual Bookshelf — embed a shelf anywhere' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Embed a Shelf Anywhere — Newsletter, Email, or Website',
    description: 'Drop a live, clickable resource shelf into a newsletter, email, or website with one embed snippet.',
    images: [`${baseUrl}/api/og/landing`],
  },
};

const FAQ: FaqItem[] = [
  {
    q: 'Can I embed a curated link list in a newsletter?',
    a: 'Yes. Most newsletter tools (Substack, ConvertKit, beehiiv, Mailchimp) support an HTML or iframe embed block. Paste your shelf\'s embed snippet into that block and the shelf renders live inside the newsletter, with every card clickable.',
  },
  {
    q: 'Does the embed work inside an email?',
    a: 'Many email clients strip iframes for security, so for email we recommend either linking to the shelf with a styled preview image, or using the embed inside email-builder tools that support live web content blocks. For guaranteed rendering in any inbox, share the shelf link directly — the Open Graph preview already looks like a rich card.',
  },
  {
    q: 'How do I embed a resource shelf on my website?',
    a: 'Copy the embed snippet from your shelf\'s share settings and paste it into any page that accepts HTML — a blog post, a resources page, a Webflow embed block, or a custom site. It renders as a live iframe and stays in sync with the shelf.',
  },
  {
    q: 'Does the embedded shelf update automatically?',
    a: 'Yes. The embed always reflects the current state of the shelf. Add, remove, or reorder items once, and every place you have embedded that shelf — newsletter archive, website, docs page — shows the update without re-pasting anything.',
  },
  {
    q: 'Can I customize the look of an embedded shelf?',
    a: 'Yes. The embed supports a light or dark theme and a custom accent color so it can match your newsletter or site branding instead of looking like an inserted widget.',
  },
  {
    q: 'Is embedding a shelf free?',
    a: 'Yes, embedding is included free with any Virtual Bookshelf shelf. Create a shelf, add your items, and copy the embed snippet from the share menu.',
  },
];

const primaryCta =
  'inline-block px-8 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-all font-medium text-lg shadow-md hover:shadow-lg';
const h2Class = 'text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight';

const jsonLd = [
  faqPageJsonLd(FAQ),
  breadcrumbJsonLd([
    { name: 'Home', url: baseUrl },
    { name: 'Embed anywhere', url: `${baseUrl}/embed-anywhere` },
  ]),
];

export default function EmbedAnywherePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex flex-col">
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}

      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-10 text-center">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center justify-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="/" className="hover:text-gray-700 dark:hover:text-gray-300">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-700 dark:text-gray-300 font-medium">Embed anywhere</li>
            </ol>
          </nav>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
            Embed a live shelf in your newsletter, email, or website
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto">
            One snippet. A real, clickable resource shelf wherever you paste it — always up to date, no screenshots, no broken lists.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup" className={primaryCta}>Create your shelf — free</Link>
            <Link href="#try-it" className="inline-block px-8 py-3.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium text-lg">
              Try it below
            </Link>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* AEO direct-answer intro */}
          <section aria-labelledby="intro-heading" className="max-w-2xl mx-auto mb-16 sm:mb-20">
            <h2 id="intro-heading" className={`${h2Class} mb-4`}>
              Where can you embed a Virtual Bookshelf shelf?
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
              <p>
                Anywhere that accepts HTML or an iframe: a newsletter platform like Substack or beehiiv, a website or blog post, a Notion or Webflow page, or your own docs site. Paste one snippet and the shelf renders live — clickable cards, real thumbnails, no manual upkeep.
              </p>
            </div>
          </section>

          {/* Interactive demo */}
          <section id="try-it" aria-labelledby="try-it-heading" className="mb-20 sm:mb-28 scroll-mt-24">
            <div className="text-center mb-8">
              <h2 id="try-it-heading" className={h2Class}>See it embedded in three places</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Same shelf, same snippet — switch the tab to see how it looks dropped into each context. The cards are live and clickable.
              </p>
            </div>
            <EmbedContextSwitcher />
          </section>

          {/* Why */}
          <section aria-labelledby="reasons-heading" className="mb-20 sm:mb-28">
            <div className="text-center mb-10">
              <h2 id="reasons-heading" className={h2Class}>Why embed instead of screenshot or link</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                A screenshot goes stale the moment you update your list. An embed never does.
              </p>
            </div>
            <ul className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  title: 'Always current',
                  body: 'Update the shelf once and every embed — newsletter archive, website, docs — reflects the change automatically.',
                },
                {
                  title: 'Actually clickable',
                  body: 'Unlike a screenshot, every card in the embed links straight to the recording, article, or product. No dead pixels.',
                },
                {
                  title: 'Matches your brand',
                  body: 'Choose light or dark theme and a custom accent color so the embed looks native to where you place it.',
                },
              ].map((r) => (
                <li key={r.title} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/50 p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{r.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{r.body}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Steps */}
          <section aria-labelledby="steps-heading" className="mb-20 sm:mb-28">
            <div className="text-center mb-10">
              <h2 id="steps-heading" className={h2Class}>Get your embed snippet in three steps</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">No code required.</p>
            </div>
            <ol className="grid gap-6 sm:grid-cols-3">
              {[
                { n: 1, title: 'Build your shelf', body: 'Add the books, podcasts, talks, or links you want to share. Cover art and titles fill in automatically.' },
                { n: 2, title: 'Open share settings', body: 'Copy the embed snippet from your shelf — choose a theme and accent color if you want it to match your brand.' },
                { n: 3, title: 'Paste it anywhere', body: 'Drop the snippet into your newsletter platform, website, or docs page. It renders live immediately.' },
              ].map((step) => (
                <li key={step.n} className="text-center">
                  <span className="mx-auto grid place-items-center w-10 h-10 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold">{step.n}</span>
                  <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100">{step.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{step.body}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* FAQ */}
          <section aria-labelledby="faq-heading" className="max-w-2xl mx-auto mb-20 sm:mb-28">
            <h2 id="faq-heading" className={`${h2Class} text-center mb-10`}>Frequently asked questions</h2>
            <dl className="space-y-8">
              {FAQ.map((item) => (
                <div key={item.q}>
                  <dt className="font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg">{item.q}</dt>
                  <dd className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Final CTA */}
          <section className="text-center pb-20 sm:pb-28">
            <h2 className={h2Class}>Embed your first shelf today</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Free to use. No code. Updates everywhere automatically.
            </p>
            <div className="mt-7">
              <Link href="/signup" className={primaryCta}>Create your shelf — free</Link>
              <p className="mt-5 text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link href="/login" className="text-gray-900 dark:text-gray-100 hover:underline font-medium">Sign in</Link>
              </p>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
            <p>© {new Date().getFullYear()} Virtual Bookshelf</p>
            <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors font-medium">Back to home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
