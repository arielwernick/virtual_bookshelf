import type { Metadata } from 'next';
import Link from 'next/link';
import {
  faqPageJsonLd,
  breadcrumbJsonLd,
  howToJsonLd,
  softwareApplicationJsonLd,
  type FaqItem,
} from '@/lib/utils/landingSchema';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app';
const connectorUrl = `${baseUrl}/mcp`;

export const metadata: Metadata = {
  title: 'Have Claude Build You a Bookshelf — of Anything | Virtual Bookshelf MCP',
  description:
    'Ask Claude (or any MCP client) to build and share a curated shelf — a reading list, podcast list, or resource collection of anything. Connect with one URL; Claude fills in covers, links, and metadata.',
  alternates: { canonical: '/claude' },
  openGraph: {
    title: 'Have Claude Build You a Bookshelf — of Anything',
    description:
      'Say "make me a shelf of the best books on X and share the link" — and Claude does it. Connect Claude or any MCP client to Virtual Bookshelf with one URL.',
    type: 'website',
    url: `${baseUrl}/claude`,
    siteName: 'Virtual Bookshelf',
    images: [{ url: `${baseUrl}/api/og/landing`, width: 1200, height: 630, alt: 'Virtual Bookshelf — Claude & MCP connector' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Have Claude Build You a Bookshelf — of Anything',
    description: 'Ask Claude or any MCP client to curate and share a shelf of books, podcasts, or links — one connector URL.',
    images: [`${baseUrl}/api/og/landing`],
  },
};

const FAQ: FaqItem[] = [
  {
    q: 'Can Claude make me a bookshelf or reading list?',
    a: 'Yes. Connect the Virtual Bookshelf MCP connector and Claude can build you a shelf of anything — a reading list, a podcast list, a collection of videos or links — then hand you a public URL to share it. Just describe what you want ("make me a shelf of the best books on stoicism") and Claude searches for each item, adds it with the real cover and author, and returns the link.',
  },
  {
    q: 'What is the Virtual Bookshelf connector for Claude and MCP?',
    a: 'It is a remote MCP (Model Context Protocol) server that lets Claude — or any MCP-capable client — read and manage your Virtual Bookshelf account. Once connected, you can list your shelves, add or remove books, podcasts, music, videos, and links, edit notes, and get share links, all by asking in plain English.',
  },
  {
    q: 'How do I connect Claude to Virtual Bookshelf?',
    a: `In claude.ai, open Settings → Connectors, choose "Add custom connector," and paste ${connectorUrl}. Claude sends you to virtualbookshelf.app to sign in (including with Google) and approve access, then the connection is live in every conversation.`,
  },
  {
    q: 'Does Claude get my Virtual Bookshelf password?',
    a: 'No. The connector uses OAuth: you sign in on virtualbookshelf.app itself, and Claude only receives a limited access token scoped to your shelves. You can cut off access anytime by removing the connector in Claude settings, and tokens expire automatically after 30 days.',
  },
  {
    q: 'What can Claude actually do with my shelves?',
    a: 'Claude can list your shelves, read what is on them, create new shelves, add items with accurate metadata (it searches Google Books and Spotify for covers, authors, and links), update your notes, remove items, and hand you the public share link for any shelf.',
  },
  {
    q: 'Does the connector work with Claude Code, the Claude API, or other MCP clients?',
    a: `Yes. In Claude Code run: claude mcp add --transport http bookshelf ${connectorUrl} — the same OAuth flow opens in your browser. The connector speaks standard MCP over Streamable HTTP, so any MCP-capable client (Claude Desktop, Cursor, and others) can use it the same way.`,
  },
  {
    q: 'Is the Claude connector free?',
    a: 'Yes. The connector is included with every Virtual Bookshelf account. You only need a Claude account that supports custom connectors.',
  },
];

const primaryCta =
  'inline-block px-8 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-all font-medium text-lg shadow-md hover:shadow-lg';
const h2Class = 'text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight';
const codeBlock =
  'block w-full overflow-x-auto rounded-lg bg-gray-900 dark:bg-black text-gray-100 text-sm px-4 py-3 font-mono text-left';

const CONNECT_STEPS = [
  {
    name: 'Add the connector',
    text: 'In claude.ai go to Settings → Connectors → Add custom connector and paste the connector URL above.',
  },
  {
    name: 'Approve access',
    text: 'Claude sends you to virtualbookshelf.app to sign in — including with Google — and approve. Claude never sees your password.',
  },
  {
    name: 'Start talking',
    text: 'Ask Claude what’s on your shelves or tell it to build one. It works in every conversation from then on.',
  },
];

const jsonLd = [
  faqPageJsonLd(FAQ),
  breadcrumbJsonLd([
    { name: 'Home', url: baseUrl },
    { name: 'Claude & MCP connector', url: `${baseUrl}/claude` },
  ]),
  howToJsonLd({
    name: 'How to have Claude build you a bookshelf',
    description:
      'Connect the Virtual Bookshelf MCP connector to Claude so it can create and share curated shelves of anything.',
    steps: CONNECT_STEPS,
  }),
  softwareApplicationJsonLd({
    name: 'Virtual Bookshelf MCP connector',
    description:
      'Official Model Context Protocol connector that lets Claude and other MCP clients build, curate, and share visual shelves of books, podcasts, music, videos, and links.',
    url: `${baseUrl}/claude`,
  }),
];

// The "of anything" hook — the domains a searcher might want a shelf of.
const SHELF_DOMAINS = [
  { label: 'Reading lists', example: '“the best books on stoicism”', href: '/claude/reading-list' },
  { label: 'Podcast lists', example: '“shows for a long road trip”' },
  { label: 'Music & albums', example: '“the albums we just talked about”' },
  { label: 'Videos & talks', example: '“every conference talk on RAG”' },
  { label: 'Links & tools', example: '“the MCP tools worth trying”' },
  { label: 'Anything else', example: '“recipes, courses, papers…”' },
];

const EXAMPLE_PROMPTS = [
  {
    prompt: '“Make me a shelf of the best books on stoicism and share the link”',
    result: 'Claude searches each title, adds the real cover and author, and hands back a public share URL.',
  },
  {
    prompt: '“What have I been meaning to read?”',
    result: 'Claude reads your shelves and answers from what is actually on them.',
  },
  {
    prompt: '“Turn the podcasts we just discussed into a shelf”',
    result: 'Claude creates the shelf, adds each show with real artwork, and returns the link.',
  },
];

export default function ClaudeConnectorPage() {
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
              <li className="text-gray-700 dark:text-gray-300 font-medium">Claude &amp; MCP connector</li>
            </ol>
          </nav>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
            Have Claude build you a bookshelf — of anything
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto">
            Ask Claude — or any MCP client — to curate a reading list, a podcast list, or a collection of
            links, then share it with one URL. Just describe what you want; Claude finds each item and fills
            in the covers, authors, and metadata for you. No account needed to see how it works.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup" className={primaryCta}>Create your shelf — free</Link>
            <Link href="#connect" className="inline-block px-8 py-3.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium text-lg">
              Connect Claude
            </Link>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* AEO direct-answer intro */}
          <section aria-labelledby="intro-heading" className="max-w-2xl mx-auto mb-16 sm:mb-20">
            <h2 id="intro-heading" className={`${h2Class} mb-4`}>
              Can Claude make and share a bookshelf for me?
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
              <p>
                Yes. Virtual Bookshelf ships an official MCP connector — a secure endpoint Claude can talk
                to. Add it as a custom connector in claude.ai or Claude Code, approve access on
                virtualbookshelf.app, and you can ask Claude to build a shelf of anything: a reading list,
                a podcast list, a set of videos or links. Claude searches for each item, adds it with the
                real cover and metadata, and returns a public link to share. No password sharing, no
                copy-pasting lists.
              </p>
              <code className={codeBlock}>{connectorUrl}</code>
            </div>
          </section>

          {/* "Of anything" domains */}
          <section aria-labelledby="domains-heading" className="mb-20 sm:mb-28">
            <div className="text-center mb-10">
              <h2 id="domains-heading" className={h2Class}>A shelf of anything you can name</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Books are just the start. Ask Claude to curate any kind of collection — it pulls real
                artwork and links for each item, so the finished shelf looks hand-made.
              </p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SHELF_DOMAINS.map((d) => {
                const card = (
                  <>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{d.label}</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{d.example}</p>
                    {d.href && (
                      <span className="mt-2 inline-block text-sm font-medium text-gray-900 dark:text-gray-100">
                        See an example →
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={d.label}>
                    {d.href ? (
                      <Link
                        href={d.href}
                        className="block h-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/50 p-6 transition-colors hover:border-gray-300 dark:hover:border-gray-700"
                      >
                        {card}
                      </Link>
                    ) : (
                      <div className="h-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/50 p-6">
                        {card}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Example prompts */}
          <section aria-labelledby="examples-heading" className="mb-20 sm:mb-28">
            <div className="text-center mb-10">
              <h2 id="examples-heading" className={h2Class}>Things you can just say</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                The connector gives Claude seven tools — listing, reading, creating, and editing shelves,
                plus book, music, and podcast search for accurate metadata.
              </p>
            </div>
            <ul className="grid gap-6 sm:grid-cols-3">
              {EXAMPLE_PROMPTS.map((example) => (
                <li key={example.prompt} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/50 p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{example.prompt}</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{example.result}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Setup steps */}
          <section id="connect" aria-labelledby="steps-heading" className="mb-20 sm:mb-28 scroll-mt-24">
            <div className="text-center mb-10">
              <h2 id="steps-heading" className={h2Class}>Connect in three steps</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Takes about a minute. Works on claude.ai and in Claude Code.
              </p>
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
            <div className="mt-10 max-w-2xl mx-auto text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Using Claude Code? One command:</p>
              <code className={codeBlock}>
                claude mcp add --transport http bookshelf {connectorUrl}
              </code>
            </div>
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
            <h2 className={h2Class}>Your shelves, one conversation away</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Free to use. Connect once, curate from anywhere you talk to Claude.
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
