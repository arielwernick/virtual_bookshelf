import type { Metadata } from 'next';
import Link from 'next/link';
import {
  faqPageJsonLd,
  breadcrumbJsonLd,
  howToJsonLd,
  type FaqItem,
} from '@/lib/utils/landingSchema';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app';
const connectorUrl = `${baseUrl}/mcp`;

// Drop a real reading-list share token here to show a live example shelf.
// Leave null to render the text example instead (no misleading placeholder).
const EXAMPLE_SHARE_TOKEN: string | null = null;

export const metadata: Metadata = {
  title: 'Have Claude Make You a Reading List — Shareable in One Click | Virtual Bookshelf',
  description:
    'Ask Claude to build you a reading list on any topic and share it with one link. Claude searches every book, adds the real cover and author, and returns a public, visual shelf. Free MCP connector.',
  alternates: { canonical: '/claude/reading-list' },
  openGraph: {
    title: 'Have Claude Make You a Reading List',
    description:
      'Say "make me a reading list on X and share the link." Claude curates the books with real covers and hands you a shareable shelf.',
    type: 'website',
    url: `${baseUrl}/claude/reading-list`,
    siteName: 'Virtual Bookshelf',
    images: [{ url: `${baseUrl}/api/og/landing`, width: 1200, height: 630, alt: 'Virtual Bookshelf — Claude reading lists' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Have Claude Make You a Reading List',
    description: 'Ask Claude to curate a reading list on any topic and share it with one link.',
    images: [`${baseUrl}/api/og/landing`],
  },
};

const FAQ: FaqItem[] = [
  {
    q: 'Can Claude make me a reading list?',
    a: 'Yes. With the Virtual Bookshelf MCP connector, you can ask Claude to build a reading list on any topic — "make me a reading list on behavioral economics" — and Claude searches for each book, adds it with the real cover, author, and link, and returns a public URL you can share.',
  },
  {
    q: 'How does Claude know which books to include?',
    a: 'Claude uses its own knowledge to choose the titles, then looks each one up through Google Books to confirm the author, cover art, and details. You can refine the list conversationally — add more, swap a title, or ask for beginner-friendly picks — and the shelf updates.',
  },
  {
    q: 'Can I share the reading list Claude makes?',
    a: 'Yes. Every shelf has a public share URL and a rich link preview, so you can post it on social media, drop it in a newsletter, or embed it on a website. The link stays live — when you or Claude add a book, the shared list updates.',
  },
  {
    q: 'Is this different from asking Claude for book recommendations in chat?',
    a: 'Yes. A plain chat answer disappears when the conversation ends. With the connector, Claude saves the list to a real, visual shelf you own — with covers and links — that you can revisit, edit, and share with anyone, anytime.',
  },
  {
    q: 'How much does it cost?',
    a: 'Virtual Bookshelf and the MCP connector are free. You only need a Claude account (or any MCP client) that supports custom connectors.',
  },
];

const primaryCta =
  'inline-block px-8 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-all font-medium text-lg shadow-md hover:shadow-lg';
const h2Class = 'text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight';
const codeBlock =
  'block w-full overflow-x-auto rounded-lg bg-gray-900 dark:bg-black text-gray-100 text-sm px-4 py-3 font-mono text-left';

const CONNECT_STEPS = [
  {
    name: 'Connect Claude to Virtual Bookshelf',
    text: 'Add the MCP connector in claude.ai (Settings → Connectors → Add custom connector) and approve access. Takes about a minute.',
  },
  {
    name: 'Describe the reading list you want',
    text: 'Tell Claude the topic, vibe, or goal — "a starter reading list on stoicism" or "the 10 best sci-fi novels of the last decade."',
  },
  {
    name: 'Get a shareable shelf',
    text: 'Claude builds the shelf with real covers and links, then hands you a public URL to share or embed anywhere.',
  },
];

const jsonLd = [
  faqPageJsonLd(FAQ),
  breadcrumbJsonLd([
    { name: 'Home', url: baseUrl },
    { name: 'Claude & MCP connector', url: `${baseUrl}/claude` },
    { name: 'Reading list', url: `${baseUrl}/claude/reading-list` },
  ]),
  howToJsonLd({
    name: 'How to have Claude make you a reading list',
    description:
      'Use the Virtual Bookshelf MCP connector to have Claude curate a reading list on any topic and share it with one link.',
    steps: CONNECT_STEPS,
  }),
];

const EXAMPLE_PROMPTS = [
  '“Make me a reading list on behavioral economics and share the link.”',
  '“Build a beginner-friendly stoicism reading list — 6 books, share it.”',
  '“Turn the novels we just discussed into a shelf I can send my book club.”',
];

export default function ClaudeReadingListPage() {
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
              <li><Link href="/claude" className="hover:text-gray-700 dark:hover:text-gray-300">Claude &amp; MCP connector</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-700 dark:text-gray-300 font-medium">Reading list</li>
            </ol>
          </nav>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
            Have Claude make you a reading list
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto">
            Ask Claude for a reading list on any topic and get back a real, shareable shelf — every book with
            its cover, author, and link. It beats a chat answer that vanishes: this one you own, edit, and
            share.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup" className={primaryCta}>Create your shelf — free</Link>
            <Link href="/claude" className="inline-block px-8 py-3.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium text-lg">
              How the connector works
            </Link>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* AEO direct-answer intro */}
          <section aria-labelledby="intro-heading" className="max-w-2xl mx-auto mb-16 sm:mb-20">
            <h2 id="intro-heading" className={`${h2Class} mb-4`}>
              Can Claude make me a reading list?
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
              <p>
                Yes. Connect the free Virtual Bookshelf MCP connector to Claude, then ask for a reading list
                on any topic. Claude picks the titles, looks each one up for the real cover and author, saves
                them to a visual shelf you own, and hands you a public link to share. Unlike a chat reply, the
                list sticks around — you can revisit it, edit it, and send it to anyone.
              </p>
              <code className={codeBlock}>{connectorUrl}</code>
            </div>
          </section>

          {/* Live example (optional) */}
          {EXAMPLE_SHARE_TOKEN && (
            <section aria-labelledby="example-heading" className="mb-20 sm:mb-28">
              <div className="text-center mb-8">
                <h2 id="example-heading" className={h2Class}>A reading list Claude built</h2>
                <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  This shelf was created entirely through the connector — covers and links and all.
                </p>
              </div>
              <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-lg bg-white dark:bg-gray-900 max-w-3xl mx-auto">
                <iframe
                  src={`${baseUrl}/embed/${EXAMPLE_SHARE_TOKEN}`}
                  title="Example reading list shelf built by Claude"
                  className="w-full"
                  style={{ height: '560px', border: 'none' }}
                  loading="lazy"
                />
              </div>
            </section>
          )}

          {/* Example prompts */}
          <section aria-labelledby="prompts-heading" className="mb-20 sm:mb-28">
            <div className="text-center mb-10">
              <h2 id="prompts-heading" className={h2Class}>Just say what you want</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                No forms, no manual entry. Describe the list and Claude does the curation and the busywork.
              </p>
            </div>
            <ul className="grid gap-6 sm:grid-cols-3">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <li key={prompt} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/50 p-6">
                  <p className="font-medium text-gray-900 dark:text-gray-100 leading-relaxed">{prompt}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Steps */}
          <section aria-labelledby="steps-heading" className="mb-20 sm:mb-28">
            <div className="text-center mb-10">
              <h2 id="steps-heading" className={h2Class}>How it works</h2>
            </div>
            <ol className="grid gap-6 sm:grid-cols-3">
              {CONNECT_STEPS.map((step, i) => (
                <li key={step.name} className="text-center">
                  <span className="mx-auto grid place-items-center w-10 h-10 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold">{i + 1}</span>
                  <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100">{step.name}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{step.text}</p>
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
            <h2 className={h2Class}>Your next reading list, one message away</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Free to use. Connect Claude once, then ask for a reading list on anything.
            </p>
            <div className="mt-7">
              <Link href="/signup" className={primaryCta}>Create your shelf — free</Link>
              <p className="mt-5 text-sm text-gray-600 dark:text-gray-400">
                Want the full connector details?{' '}
                <Link href="/claude" className="text-gray-900 dark:text-gray-100 hover:underline font-medium">See how Claude connects</Link>
              </p>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
            <p>© {new Date().getFullYear()} Virtual Bookshelf</p>
            <Link href="/claude" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors font-medium">Claude &amp; MCP connector</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
