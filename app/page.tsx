import Link from 'next/link';
import { getShelfByShareToken, getItemsByShelfId, getShelvesWithItems } from '@/lib/db/queries';
import { getDemoShelfToken, getDemoUserId } from '@/lib/utils/env';
import { DemoShelf } from '@/components/home/DemoShelf';
import { RotatingDemoShelf, ShelfPreview } from '@/components/home/RotatingDemoShelf';
import { CapabilityShowcase } from '@/components/home/CapabilityShowcase';
import { HOW_IT_WORKS } from '@/lib/constants/landingShowcase';

const MAX_DEMO_SHELVES = 5;
const MAX_ITEMS_PER_SHELF = 12;

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app';

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'What is Virtual Bookshelf?', acceptedAnswer: { '@type': 'Answer', text: 'Virtual Bookshelf is a tool to curate and share shelves of books, podcasts, music, videos, links, and live stock tickers. Create a shelf, get a shareable link, and paste it anywhere — your bio, newsletter, LinkedIn, or portfolio.' } },
    { '@type': 'Question', name: 'What can I put on a shelf?', acceptedAnswer: { '@type': 'Answer', text: 'Books, podcasts, podcast episodes, music albums, YouTube videos, any link, and live stock tickers.' } },
    { '@type': 'Question', name: 'How do I share my shelf?', acceptedAnswer: { '@type': 'Answer', text: 'Every shelf gets a public link. Paste it in your bio, newsletter, LinkedIn, or anywhere you want people to find it.' } },
    { '@type': 'Question', name: 'Is Virtual Bookshelf free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, Virtual Bookshelf is free to use.' } },
    { '@type': 'Question', name: 'What happened to Bento.me?', acceptedAnswer: { '@type': 'Answer', text: 'Bento.me shut down in February 2026 after being acquired by Linktree. Virtual Bookshelf is a great alternative for creators who want to showcase what they are reading, watching, and listening to with rich cover art and metadata.' } },
    { '@type': 'Question', name: 'How is Virtual Bookshelf different from Linktree?', acceptedAnswer: { '@type': 'Answer', text: 'Linktree shows a list of links. Virtual Bookshelf shows rich content — cover art, metadata, and live prices — for everything on your shelf.' } },
  ],
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'Virtual Bookshelf',
      url: baseUrl,
      logo: `${baseUrl}/favicon.svg`,
    },
    {
      '@type': 'WebSite',
      name: 'Virtual Bookshelf',
      url: baseUrl,
      description: 'Curate shelves of books, podcasts, music, videos, links and stocks. Share a single link anywhere.',
    },
  ],
};

const EMBED_DESTINATIONS = ['Notion', 'Squarespace', 'Webflow', 'WordPress'];
const SHELF_LINK_EXAMPLE = `${baseUrl.replace(/^https?:\/\//, '')}/s/your-shelf`;

/**
 * Fetch demo shelves for the home page
 *
 * Supports two modes:
 * 1. DEMO_USER_ID (preferred): Fetches all public shelves from admin user with optimized query
 * 2. DEMO_SHELF_TOKEN (legacy): Fetches a single shelf by token
 *
 * See docs/guides/ADMIN_DEMO_SETUP.md for setup instructions.
 */
async function getDemoShelvesData(): Promise<ShelfPreview[] | null> {
  // Try new approach first: fetch all public shelves from demo user using optimized query
  const userId = getDemoUserId();
  if (userId) {
    try {
      // Use optimized query that fetches shelves and items in a single database call
      const shelfPreviews = await getShelvesWithItems(userId, MAX_DEMO_SHELVES, MAX_ITEMS_PER_SHELF);

      if (shelfPreviews.length === 0) return null;

      return shelfPreviews;
    } catch {
      return null;
    }
  }

  // Fallback to legacy single shelf approach
  const token = getDemoShelfToken();
  if (!token) return null;

  try {
    const shelf = await getShelfByShareToken(token);
    if (!shelf || !shelf.is_public) return null;

    const items = await getItemsByShelfId(shelf.id);
    return [{ shelf, items }];
  } catch {
    return null;
  }
}

/**
 * The "public link" bar shown in the Embed section. When a real demo shelf is
 * available it renders as a link that clicks through to the live shelf (just
 * like the preview cards); otherwise it falls back to a static placeholder.
 */
function EmbedLinkBar({ url, href }: { url: string; href: string | null }) {
  const base =
    'flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 px-4 py-3.5 shadow-sm';
  const inner = (
    <>
      <svg
        className="w-5 h-5 shrink-0 text-gray-400 dark:text-gray-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" />
        <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
      </svg>
      <span className="font-mono text-sm text-gray-700 dark:text-gray-300 truncate">{url}</span>
      <span className="ml-auto text-xs font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap transition-colors group-hover:text-gray-600 dark:group-hover:text-gray-400">
        {href ? 'Click to explore →' : 'Public link'}
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`${base} group transition hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md`}
      >
        {inner}
      </Link>
    );
  }
  return <div className={base}>{inner}</div>;
}

export default async function Home() {
  const demoShelves = await getDemoShelvesData();
  const hasDemo = Boolean(demoShelves && demoShelves.length > 0);

  // Use a real demo shelf for the Embed section's example link so it clicks
  // through to a live shelf, just like the preview cards. Falls back to a
  // placeholder when no demo data is available (e.g. local dev without env).
  const embedExampleToken = demoShelves?.[0]?.shelf.share_token ?? null;
  const embedExampleUrl = embedExampleToken
    ? `${baseUrl.replace(/^https?:\/\//, '')}/s/${embedExampleToken}`
    : SHELF_LINK_EXAMPLE;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
            A shelf for everything you love
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto">
            Books, podcasts, music, videos, links — even live stock tickers. Curate it once,
            then share a link anywhere.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-block px-8 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-all font-medium text-lg shadow-md hover:shadow-lg"
            >
              Create your shelf
            </Link>
            <Link
              href="/login"
              className="inline-block px-8 py-3.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium text-lg"
            >
              Sign in
            </Link>
          </div>
        </section>

        {/* Live demo gallery — real, click-through example shelves */}
        {hasDemo && demoShelves && (
          <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
            <p className="text-center text-sm font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-5">
              Real shelves · tap to explore
            </p>
            {demoShelves.length === 1 ? (
              <DemoShelf
                items={demoShelves[0].items}
                shelfName={demoShelves[0].shelf.name}
                shareToken={demoShelves[0].shelf.share_token}
              />
            ) : (
              <RotatingDemoShelf shelves={demoShelves} />
            )}
          </section>
        )}

        {/* Capability showcase */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <CapabilityShowcase />

          {/* How it works */}
          <section aria-labelledby="how-heading" className="mb-20 sm:mb-28">
            <div className="text-center mb-10">
              <h2 id="how-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                Search. Click. Added.
              </h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Perfect for your website, LinkedIn, socials, or portfolio.
              </p>
            </div>
            <ol className="grid gap-6 sm:grid-cols-3">
              {HOW_IT_WORKS.map((step) => (
                <li key={step.step} className="text-center">
                  <span className="mx-auto grid place-items-center w-10 h-10 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold">
                    {step.step}
                  </span>
                  <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100">{step.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {/* Embed anywhere */}
          <section aria-labelledby="embed-heading" className="mb-20 sm:mb-28">
            <div className="text-center mb-10">
              <h2 id="embed-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                Embed it anywhere
              </h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Every shelf gets a public link. Drop it into Notion or a site builder
                and it embeds live — cover art, metadata, and prices included. Change
                the shelf, and every embed updates with it.
              </p>
            </div>

            <div className="max-w-xl mx-auto">
              {/* The link — the no-code path, clicks through to a live shelf */}
              <EmbedLinkBar
                url={embedExampleUrl}
                href={embedExampleToken ? `/s/${embedExampleToken}` : null}
              />

              {/* Where it works */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {EMBED_DESTINATIONS.map((dest) => (
                  <span
                    key={dest}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                  >
                    {dest}
                  </span>
                ))}
              </div>

              {/* The custom-site path, demoted */}
              <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Building a custom site? Grab a ready-made{' '}
                <code className="font-mono text-[0.8125rem] text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5">
                  &lt;iframe&gt;
                </code>{' '}
                from any shelf&apos;s Share menu.
              </p>

              {/* Somewhere to go */}
              <div className="mt-8 text-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 font-medium text-gray-900 dark:text-gray-100 hover:underline"
                >
                  Create a shelf and grab your link
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section aria-labelledby="faq-heading" className="max-w-2xl mx-auto mb-20 sm:mb-28">
            <h2 id="faq-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight text-center mb-10">
              Frequently asked questions
            </h2>
            <dl className="space-y-8">
              {faqSchema.mainEntity.map((item) => (
                <div key={item.name}>
                  <dt className="font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg">
                    {item.name}
                  </dt>
                  <dd className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item.acceptedAnswer.text}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Final CTA */}
          <section className="text-center pb-20 sm:pb-28">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              Start your shelf in minutes
            </h2>
            <div className="mt-7">
              <Link
                href="/signup"
                className="inline-block px-8 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-all font-medium text-lg shadow-md hover:shadow-lg"
              >
                Create your shelf
              </Link>
              <p className="mt-5 text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link href="/login" className="text-gray-900 dark:text-gray-100 hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
            <p>© {new Date().getFullYear()} Virtual Bookshelf</p>
            <a
              href="https://github.com/arielwernick/virtual_bookshelf"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
