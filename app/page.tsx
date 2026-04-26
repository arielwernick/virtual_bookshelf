import Link from 'next/link';
import { getShelfByShareToken, getItemsByShelfId, getShelvesWithItems } from '@/lib/db/queries';
import { getDemoShelfToken, getDemoUserId } from '@/lib/utils/env';
import { DemoShelf } from '@/components/home/DemoShelf';
import { RotatingDemoShelf, ShelfPreview } from '@/components/home/RotatingDemoShelf';
import { Space_Grotesk } from 'next/font/google';

const MAX_DEMO_SHELVES = 5;
const MAX_ITEMS_PER_SHELF = 12;

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

async function getDemoShelvesData(): Promise<ShelfPreview[] | null> {
  const userId = getDemoUserId();
  if (userId) {
    try {
      const shelfPreviews = await getShelvesWithItems(userId, MAX_DEMO_SHELVES, MAX_ITEMS_PER_SHELF);
      if (shelfPreviews.length === 0) return null;
      return shelfPreviews;
    } catch {
      return null;
    }
  }

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

export default async function Home() {
  const demoShelves = await getDemoShelvesData();

  return (
    <div className="relative min-h-screen bg-[var(--db-coconut)] flex flex-col">
      <main id="main-content" className="relative flex-1">
        {/* ============ HERO — editorial, generous whitespace ============ */}
        <section className="relative mx-auto max-w-6xl px-6 sm:px-8 pt-20 pb-24 sm:pt-32 sm:pb-36">
          <div className="max-w-4xl mx-auto text-center" data-reveal="zoom">
            <p className={`${spaceGrotesk.className} text-[0.78rem] font-semibold uppercase tracking-[0.24em] text-[var(--db-ink)]/55 mb-8`}>
              Virtual Bookshelf
            </p>
            <h1
              className={`${spaceGrotesk.className} text-[var(--db-ink)] font-bold tracking-[-0.045em] leading-[0.92]`}
              style={{ fontSize: 'clamp(3rem, 10vw, 8.5rem)' }}
            >
              Your taste,
              <br />
              <span className="text-[var(--db-blue)]">beautifully</span> shelved.
            </h1>
            <p className={`${spaceGrotesk.className} mt-10 text-xl sm:text-2xl text-[var(--db-ink)]/70 font-normal leading-snug max-w-2xl mx-auto`}>
              Books, podcasts, and music — curated into a shelf you can share anywhere.
            </p>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6" data-reveal="soft" data-stagger="2">
              <Link
                href="/signup"
                className={`${spaceGrotesk.className} group inline-flex items-center gap-2 rounded-full bg-[var(--db-ink)] px-9 py-4 text-base font-semibold text-[var(--db-coconut)] transition-all hover:bg-black hover:-translate-y-[1px] shadow-[0_8px_24px_rgba(30,25,25,0.2)] hover:shadow-[0_14px_34px_rgba(30,25,25,0.28)]`}
              >
                Build your shelf
                <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </Link>
              <Link
                href="/login"
                className={`${spaceGrotesk.className} text-sm font-semibold text-[var(--db-ink)]/70 hover:text-[var(--db-blue)] transition-colors`}
              >
                Sign in →
              </Link>
            </div>
          </div>
        </section>

        {/* ============ HERO PRODUCT SHOT — the demo shelf as centerpiece ============ */}
        {demoShelves && demoShelves.length > 0 && (
          <section className="relative mx-auto max-w-6xl px-6 sm:px-8 pb-24 sm:pb-36">
            <div
              className="relative rounded-[28px] bg-white shadow-[0_40px_80px_-20px_rgba(30,25,25,0.18)] ring-1 ring-[var(--db-ink)]/8 overflow-hidden"
              data-reveal="zoom"
              data-stagger="1"
            >
              {/* Top chrome bar — like a product window */}
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[var(--db-ink)]/8 bg-[var(--db-paper)]">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--db-ink)]/14" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--db-ink)]/14" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--db-ink)]/14" />
                <span className="ml-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--db-ink)]/45">
                  virtualbookshelf.app
                </span>
              </div>
              <div className="p-5 sm:p-8">
                {demoShelves.length === 1 ? (
                  <DemoShelf
                    items={demoShelves[0].items}
                    shelfName={demoShelves[0].shelf.name}
                    shareToken={demoShelves[0].shelf.share_token}
                  />
                ) : (
                  <RotatingDemoShelf shelves={demoShelves} />
                )}
              </div>
            </div>
          </section>
        )}

        {/* ============ FEATURE ROW 1 — Build ============ */}
        <section className="relative mx-auto max-w-6xl px-6 sm:px-8 py-24 sm:py-32">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            <div data-reveal="left">
              <p className={`${spaceGrotesk.className} text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[var(--db-blue)] mb-5`}>
                01 — Build
              </p>
              <h2
                className={`${spaceGrotesk.className} text-[var(--db-ink)] font-bold tracking-[-0.035em] leading-[0.95]`}
                style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)' }}
              >
                Search. Click.
                <br />
                <span className="text-[var(--db-ink)]/45">Added.</span>
              </h2>
              <p className={`${spaceGrotesk.className} mt-6 text-lg text-[var(--db-ink)]/70 font-normal leading-relaxed max-w-md`}>
                Find any book, podcast, or album in a heartbeat. Covers and metadata — handled. You just pick.
              </p>
            </div>
            <div className="relative" data-reveal="right" data-stagger="2">
              <div className="aspect-[4/3] rounded-3xl bg-[var(--db-paper)] ring-1 ring-[var(--db-ink)]/8 shadow-[0_30px_60px_-20px_rgba(30,25,25,0.14)] overflow-hidden p-8 flex flex-col justify-center">
                <div className="rounded-xl bg-white ring-1 ring-[var(--db-ink)]/10 shadow-sm p-3 flex items-center gap-3">
                  <svg className="h-4 w-4 text-[var(--db-ink)]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="7" strokeWidth={2} />
                    <path strokeLinecap="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
                  </svg>
                  <span className="text-sm text-[var(--db-ink)]/70">the creative act</span>
                </div>
                <div className="mt-3 space-y-2">
                  {['The Creative Act — Rick Rubin', 'The Creative Habit — Twyla Tharp', 'The War of Art — Steven Pressfield'].map((label, i) => (
                    <div
                      key={label}
                      className={`flex items-center gap-3 rounded-xl p-3 transition-all ${
                        i === 0 ? 'bg-white ring-1 ring-[var(--db-blue)]/30 shadow-sm' : 'bg-white/50 ring-1 ring-[var(--db-ink)]/5'
                      }`}
                    >
                      <div className={`h-10 w-7 rounded-sm ${i === 0 ? 'bg-[var(--db-blue)]' : i === 1 ? 'bg-[var(--db-ink)]' : 'bg-[var(--db-sunset)]'}`} />
                      <span className="text-sm text-[var(--db-ink)]/80 font-medium truncate">{label}</span>
                      {i === 0 && (
                        <svg className="ml-auto h-4 w-4 text-[var(--db-blue)] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ MIDDLE BAND — the big moment ============ */}
        <section className="relative mt-8 mb-8">
          <div className="relative mx-auto max-w-[88rem] px-4 sm:px-6">
            <div
              className="relative overflow-hidden rounded-[32px] bg-[var(--db-ink)] px-8 sm:px-14 py-20 sm:py-28"
              data-reveal="zoom"
            >
              {/* Subtle grid texture */}
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
                  backgroundSize: '80px 80px',
                  maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
                  WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
                }}
              />
              {/* Floating accent planes — subtle, not neon */}
              <div className="absolute top-12 right-12 h-16 w-16 rounded-xl bg-[var(--db-blue)] opacity-90 hidden sm:block" aria-hidden="true" />
              <div className="absolute bottom-16 right-28 h-10 w-10 rounded-lg bg-[var(--db-lime)] hidden sm:block" aria-hidden="true" />
              <div className="absolute top-24 left-10 h-8 w-8 rounded-md bg-[var(--db-sunset)] hidden sm:block" aria-hidden="true" />

              <div className="relative max-w-4xl">
                <p className={`${spaceGrotesk.className} text-[0.72rem] font-bold uppercase tracking-[0.28em] text-[var(--db-coconut)]/50 mb-7`}>
                  The principle
                </p>
                <h2
                  className={`${spaceGrotesk.className} text-[var(--db-coconut)] font-bold tracking-[-0.045em] leading-[0.88]`}
                  style={{ fontSize: 'clamp(2.8rem, 8vw, 7rem)' }}
                >
                  Simple.
                  <br />
                  <span className="text-[var(--db-ink)]/0 [-webkit-text-stroke:1.5px_rgba(247,245,242,0.4)]">Helpful.</span>
                  <br />
                  Human.
                  <br />
                  <span className="text-[var(--db-blue)]">Magic.</span>
                </h2>

                <div className="mt-14 grid sm:grid-cols-2 gap-x-12 gap-y-8 max-w-2xl">
                  <div>
                    <p className={`${spaceGrotesk.className} text-sm font-bold uppercase tracking-[0.18em] text-[var(--db-lime)] mb-3`}>
                      Under 2 minutes
                    </p>
                    <p className="text-[var(--db-coconut)]/75 text-base leading-snug font-medium">
                      Sign up, add a few items, publish. That&apos;s it. Your shelf is live.
                    </p>
                  </div>
                  <div>
                    <p className={`${spaceGrotesk.className} text-sm font-bold uppercase tracking-[0.18em] text-[var(--db-sunset)] mb-3`}>
                      Six item types
                    </p>
                    <p className="text-[var(--db-coconut)]/75 text-base leading-snug font-medium">
                      Books, podcasts, episodes, albums, videos, links — all in one place.
                    </p>
                  </div>
                  <div>
                    <p className={`${spaceGrotesk.className} text-sm font-bold uppercase tracking-[0.18em] text-[#8bb6ff] mb-3`}>
                      Forever free
                    </p>
                    <p className="text-[var(--db-coconut)]/75 text-base leading-snug font-medium">
                      No credit card. No upsell. Just a shelf you&apos;ll actually use.
                    </p>
                  </div>
                  <div>
                    <p className={`${spaceGrotesk.className} text-sm font-bold uppercase tracking-[0.18em] text-[#f9c8ce] mb-3`}>
                      Yours forever
                    </p>
                    <p className="text-[var(--db-coconut)]/75 text-base leading-snug font-medium">
                      Export anytime. Your picks belong to you, not a platform.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FEATURE ROW 2 — Arrange (reversed) ============ */}
        <section className="relative mx-auto max-w-6xl px-6 sm:px-8 py-24 sm:py-32 border-t border-[var(--db-ink)]/8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            <div className="order-2 lg:order-1 relative" data-reveal="left" data-stagger="2">
              <div className="aspect-[4/3] rounded-3xl bg-[var(--db-ink)] ring-1 ring-[var(--db-ink)]/8 shadow-[0_30px_60px_-20px_rgba(30,25,25,0.25)] overflow-hidden p-8 flex flex-col justify-center gap-3">
                {[
                  { name: 'Books that changed my year', count: 12, color: 'var(--db-lime)' },
                  { name: 'Sunday morning jazz', count: 24, color: 'var(--db-sunset)' },
                  { name: 'Podcasts I loop', count: 8, color: 'var(--db-blue)' },
                ].map((shelf) => (
                  <div key={shelf.name} className="rounded-2xl bg-white/8 ring-1 ring-white/12 p-4 flex items-center gap-4 backdrop-blur-sm">
                    <span className="h-10 w-1.5 rounded-full shrink-0" style={{ background: shelf.color }} />
                    <div className="flex-1 min-w-0">
                      <p className={`${spaceGrotesk.className} text-white font-semibold text-base tracking-tight truncate`}>
                        {shelf.name}
                      </p>
                      <p className="text-xs text-white/50 font-medium mt-0.5">{shelf.count} items</p>
                    </div>
                    <svg className="h-4 w-4 text-white/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2" data-reveal="right">
              <p className={`${spaceGrotesk.className} text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[var(--db-blue)] mb-5`}>
                02 — Arrange
              </p>
              <h2
                className={`${spaceGrotesk.className} text-[var(--db-ink)] font-bold tracking-[-0.035em] leading-[0.95]`}
                style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)' }}
              >
                Shelves that
                <br />
                <span className="text-[var(--db-ink)]/45">breathe.</span>
              </h2>
              <p className={`${spaceGrotesk.className} mt-6 text-lg text-[var(--db-ink)]/70 font-normal leading-relaxed max-w-md`}>
                Group picks the way you think about them. Reorder with a drag, publish with a click.
              </p>
            </div>
          </div>
        </section>

        {/* ============ FEATURE ROW 3 — Share ============ */}
        <section className="relative mx-auto max-w-6xl px-6 sm:px-8 py-24 sm:py-32 border-t border-[var(--db-ink)]/8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            <div data-reveal="left">
              <p className={`${spaceGrotesk.className} text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[var(--db-blue)] mb-5`}>
                03 — Share
              </p>
              <h2
                className={`${spaceGrotesk.className} text-[var(--db-ink)] font-bold tracking-[-0.035em] leading-[0.95]`}
                style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)' }}
              >
                One link.
                <br />
                <span className="text-[var(--db-ink)]/45">Everywhere.</span>
              </h2>
              <p className={`${spaceGrotesk.className} mt-6 text-lg text-[var(--db-ink)]/70 font-normal leading-relaxed max-w-md`}>
                Drop it in your site, socials, signature, or link-in-bio. Always fresh — update once, update everywhere.
              </p>
            </div>
            <div className="relative" data-reveal="right" data-stagger="2">
              <div className="aspect-[4/3] rounded-3xl bg-[var(--db-paper)] ring-1 ring-[var(--db-ink)]/8 shadow-[0_30px_60px_-20px_rgba(30,25,25,0.14)] overflow-hidden p-8 flex items-center justify-center">
                <div className="w-full max-w-sm">
                  <div className="rounded-2xl bg-white ring-1 ring-[var(--db-ink)]/8 shadow-sm p-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-[var(--db-ink)]/50 mb-3">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 10-5.656-5.656l-1.102 1.101" />
                      </svg>
                      your-site.com/bookshelf
                    </div>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex-1 aspect-[2/3] rounded"
                          style={{
                            background:
                              i === 0 ? 'var(--db-blue)' :
                              i === 1 ? 'var(--db-sunset)' :
                              i === 2 ? 'var(--db-ink)' :
                              'var(--db-canopy)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-center gap-1.5">
                    <span className="text-[0.68rem] font-semibold text-[var(--db-ink)]/50">Embed · iframe · link</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ POETIC CLOSER ============ */}
        <section className="relative mx-auto max-w-4xl px-6 sm:px-8 py-24 sm:py-36 text-center">
          <h2
            className={`${spaceGrotesk.className} text-[var(--db-ink)] font-bold tracking-[-0.04em] leading-[0.92]`}
            style={{ fontSize: 'clamp(2.2rem, 6vw, 4.8rem)' }}
            data-reveal="zoom"
          >
            Simple. Helpful.
            <br />
            Human. <span className="text-[var(--db-blue)]">Magic.</span>
          </h2>
          <p className={`${spaceGrotesk.className} mt-8 text-lg sm:text-xl text-[var(--db-ink)]/65 font-normal max-w-xl mx-auto`} data-reveal="soft" data-stagger="2">
            A shelf in under two minutes. No credit card. No setup. Just your picks, beautifully arranged.
          </p>
          <div className="mt-12" data-reveal="soft" data-stagger="3">
            <Link
              href="/signup"
              className={`${spaceGrotesk.className} group inline-flex items-center gap-2 rounded-full bg-[var(--db-ink)] px-10 py-4 text-base font-semibold text-[var(--db-coconut)] transition-all hover:bg-black hover:-translate-y-[1px] shadow-[0_8px_24px_rgba(30,25,25,0.2)] hover:shadow-[0_14px_34px_rgba(30,25,25,0.28)]`}
            >
              Start building — it&apos;s free
              <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-[var(--db-ink)]/8 bg-[var(--db-coconut)]">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--db-ink)]/55">
            <p className={`${spaceGrotesk.className} font-semibold text-[var(--db-ink)]/75`}>
              Virtual Bookshelf <span className="text-[var(--db-ink)]/40">· © {new Date().getFullYear()}</span>
            </p>
            <a
              href="https://github.com/arielwernick/virtual_bookshelf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium hover:text-[var(--db-ink)] transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
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
