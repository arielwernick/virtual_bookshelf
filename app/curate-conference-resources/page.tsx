import type { Metadata } from 'next';
import Link from 'next/link';
import { CapabilityShowcase } from '@/components/home/CapabilityShowcase';
import { LiveShelfExamples } from '@/components/landing/LiveShelfExamples';
import { faqPageJsonLd, breadcrumbJsonLd, type FaqItem } from '@/lib/utils/landingSchema';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app';

export const metadata: Metadata = {
  title: 'Share Conference Resources & Event Recaps — Virtual Bookshelf',
  description:
    'Turn your conference talk list into a shareable, visual resource shelf. Add speaker recordings, articles, and links — cover art and titles fill in automatically. One link to share with your community.',
  alternates: { canonical: '/curate-conference-resources' },
  openGraph: {
    title: 'Share Conference Resources as a Beautiful Shelf',
    description:
      'Stop sharing flat link lists. Virtual Bookshelf turns your conference recap into a visual, browsable resource page — recordings, articles, and speaker links all in one place.',
    type: 'website',
    url: `${baseUrl}/curate-conference-resources`,
    siteName: 'Virtual Bookshelf',
    images: [{ url: `${baseUrl}/api/og/landing`, width: 1200, height: 630, alt: 'Virtual Bookshelf — share conference resources' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Share Conference Resources as a Beautiful Shelf',
    description:
      'Turn your conference recap into a visual resource shelf — recordings, articles, and links in one shareable page.',
    images: [`${baseUrl}/api/og/landing`],
  },
};

const FAQ: FaqItem[] = [
  {
    q: 'What is the best way to share conference resources online?',
    a: 'The best way is to collect all recordings, articles, and speaker links into a single visual shelf — rather than a flat list of links in a LinkedIn post or newsletter. A shelf is browsable, shareable with one URL, and auto-fills thumbnails and titles so your community can quickly find what they care about.',
  },
  {
    q: 'How do I organize talks and recordings from an event?',
    a: 'Add each talk or recording to a Virtual Bookshelf shelf by pasting the URL or searching by title. The shelf automatically pulls in the video thumbnail, title, speaker name, and description. You can add a note to each item with your own takeaway, then share the whole shelf with one link.',
  },
  {
    q: 'Can I share a curated list of conference talks on LinkedIn?',
    a: 'Yes — and a shelf link looks much better than a wall of text. Paste your shelf URL into a LinkedIn post and the Open Graph preview shows a clean, branded image. Your followers get one click to a browsable, visual resource page instead of scanning through a long caption.',
  },
  {
    q: 'Is there a free tool for sharing event recap resources?',
    a: 'Virtual Bookshelf is free. Create a shelf, add your conference talks and links, and share the URL — no credit card required. Rich cards with cover art and titles generate automatically.',
  },
  {
    q: 'Can I embed a conference resource shelf on my website or newsletter?',
    a: 'Yes. Every shelf has an embeddable version you can drop into Notion, Webflow, Substack, or any site that accepts an iframe. It stays live — when you add or update items, the embedded shelf updates too.',
  },
  {
    q: 'Who uses Virtual Bookshelf for conference resources?',
    a: 'Event organizers collecting speaker recordings, newsletter writers curating the best talks from an event, community managers sharing resources after a summit, and individual attendees building their own personal recap shelf.',
  },
];

const primaryCta =
  'inline-block px-8 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-all font-medium text-lg shadow-md hover:shadow-lg';
const h2Class = 'text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight';

const jsonLd = [
  faqPageJsonLd(FAQ),
  breadcrumbJsonLd([
    { name: 'Home', url: baseUrl },
    { name: 'Curate conference resources', url: `${baseUrl}/curate-conference-resources` },
  ]),
];

export default function CurateConferenceResourcesPage() {
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
              <li className="text-gray-700 dark:text-gray-300 font-medium">Curate conference resources</li>
            </ol>
          </nav>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
            Turn your conference recap into a shareable resource shelf
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto">
            Stop sharing flat lists of links. Add your talks, recordings, and articles — cover art and titles fill in automatically — then share one beautiful URL with your community.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup" className={primaryCta}>Create your shelf — free</Link>
            <Link href="#live-example" className="inline-block px-8 py-3.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium text-lg">
              See a live example
            </Link>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* AEO direct-answer intro */}
          <section aria-labelledby="intro-heading" className="max-w-2xl mx-auto mb-20 sm:mb-24">
            <h2 id="intro-heading" className={`${h2Class} mb-4`}>
              What is the best way to share conference resources?
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
              <p>
                After a great event, the instinct is to paste every link into a LinkedIn post or newsletter. The result is a wall of text that nobody saves and most people scroll past.
              </p>
              <p>
                A Virtual Bookshelf shelf gives the same content a visual home — each talk or article becomes a rich card with a thumbnail, title, and your own note. Share one URL and your audience can browse, click, and bookmark what matters to them.
              </p>
            </div>
          </section>

          {/* Live example embed */}
          <section id="live-example" aria-labelledby="example-heading" className="mb-20 sm:mb-28 scroll-mt-24">
            <div className="text-center mb-8">
              <h2 id="example-heading" className={h2Class}>See what a conference shelf looks like</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                These are real shelves — live, browsable, and shareable with one link. Switch between events below.
              </p>
            </div>
            <LiveShelfExamples />
          </section>

          {/* Before / after */}
          <section aria-labelledby="before-after-heading" className="mb-20 sm:mb-28">
            <div className="text-center mb-10">
              <h2 id="before-after-heading" className={h2Class}>From flat text to a living resource page</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                The same content — one format people save, one they scroll past.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Before */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/50 p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">Before — LinkedIn post</p>
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 font-mono leading-relaxed">
                  <p>🎤 Gregor Ojstersek — AI-Native Engineering Leadership</p>
                  <p>Recording: lnkd.in/ej3qDUYZ</p>
                  <p>Article: lnkd.in/eHS5JkYN</p>
                  <p className="pt-1">🎤 Vinay Perneti — We Thought AI Transformation Was About Adopting Agents. We Were Wrong.</p>
                  <p>Recording: lnkd.in/eMSUcBQj</p>
                  <p>Article: lnkd.in/d9gMipvC</p>
                  <p className="pt-1">🎤 Andrew Churchill — What Actually Works: AI Coding Patterns from the Top 1%...</p>
                  <p>Recording: lnkd.in/eX4dVZ8y</p>
                  <p className="text-gray-300 dark:text-gray-600">↓ buried in the feed after 24 hours</p>
                </div>
              </div>

              {/* After */}
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 p-6 flex flex-col">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4">After — Virtual Bookshelf shelf</p>
                <div className="rounded-xl overflow-hidden border border-emerald-200/60 dark:border-emerald-900/60 bg-white dark:bg-gray-900">
                  <iframe
                    src={`${baseUrl}/embed/hnDScsft`}
                    title="Engineering Leadership Live — real embedded shelf"
                    className="w-full"
                    style={{ height: '360px', border: 'none' }}
                    loading="lazy"
                  />
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 pt-3 font-medium">✓ This is a real, live shelf — not a mockup. Lives at one URL, auto-fills thumbnails, embeddable.</p>
              </div>
            </div>
          </section>

          {/* Capability showcase */}
          <CapabilityShowcase />

          {/* Why / 3 reasons */}
          <section aria-labelledby="reasons-heading" className="mb-20 sm:mb-28">
            <div className="text-center mb-10">
              <h2 id="reasons-heading" className={h2Class}>Built for the way people actually share event resources</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Rich cards, automatic metadata, one link — everything a flat post is not.
              </p>
            </div>
            <ul className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  title: 'Visual cards, not a link dump',
                  body: 'Every recording, article, or speaker link becomes a card with a real thumbnail and title — far easier to scan than a bulleted list.',
                },
                {
                  title: 'Metadata fills in automatically',
                  body: 'Paste a YouTube link, a newsletter article, or a podcast episode URL and the title, thumbnail, and description populate themselves. No manual work.',
                },
                {
                  title: 'One link for everything',
                  body: 'Share a single URL in your post, bio, or email. Embed the live shelf in Notion or your own site. Update once and everywhere refreshes.',
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
              <h2 id="steps-heading" className={h2Class}>Build your conference shelf in minutes</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Most event recaps take less than ten minutes to shelve.</p>
            </div>
            <ol className="grid gap-6 sm:grid-cols-3">
              {[
                { n: 1, title: 'Create a shelf', body: 'Sign up free and name your shelf — "Engineering Leadership Live 2026" or whatever fits your event.' },
                { n: 2, title: 'Add talks and links', body: 'Paste each recording, article, or speaker link. Thumbnails, titles, and descriptions fill in automatically.' },
                { n: 3, title: 'Share your URL', body: 'Drop the shelf link in your LinkedIn post, newsletter, or bio. Embed it on your site if you want it live anywhere else.' },
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
            <h2 className={h2Class}>Shelve your next conference recap</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Free to use. Looks great. Takes minutes. Your community will actually read it.
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
