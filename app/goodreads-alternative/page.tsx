import type { Metadata } from 'next';
import { AlternativeLandingPage } from '@/components/landing/AlternativeLandingPage';
import { faqPageJsonLd, breadcrumbJsonLd, type FaqItem } from '@/lib/utils/landingSchema';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app';

export const metadata: Metadata = {
  title: 'Goodreads Alternative (2026)',
  description:
    'Want a Goodreads alternative for sharing the books you love? Virtual Bookshelf is a beautiful, shareable bookshelf — no ads, no Amazon account — that you control, and you can add podcasts, music, and more.',
  alternates: { canonical: '/goodreads-alternative' },
  openGraph: {
    title: 'A Goodreads alternative for sharing the books you love',
    description:
      'Virtual Bookshelf is a beautiful, shareable bookshelf you control — no ads, no Amazon account. Add podcasts, music, and more, and share it with one link.',
    type: 'website',
    url: `${baseUrl}/goodreads-alternative`,
    siteName: 'Virtual Bookshelf',
    images: [{ url: `${baseUrl}/api/og/landing`, width: 1200, height: 630, alt: 'Virtual Bookshelf — a Goodreads alternative' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'A Goodreads alternative for sharing the books you love',
    description:
      'A beautiful, shareable bookshelf you control — no ads, no Amazon account. Add podcasts, music, and more.',
    images: [`${baseUrl}/api/og/landing`],
  },
};

const FAQ: FaqItem[] = [
  {
    q: 'Is Virtual Bookshelf a good Goodreads alternative?',
    a: 'For curating and sharing the books you love, yes — it gives you a beautiful, shareable shelf you control, without ads or an Amazon account. It is not a review-and-tracking community, so if that is what you want from Goodreads, it works well alongside one.',
  },
  {
    q: 'What is the difference between Virtual Bookshelf and Goodreads?',
    a: 'Goodreads is built around tracking, rating, and reviewing books in a social network. Virtual Bookshelf is built around curating a beautiful shelf and sharing it with one link — and it can hold podcasts, music, and videos too.',
  },
  {
    q: 'Does Virtual Bookshelf have reviews, ratings, or reading tracking?',
    a: 'No. Virtual Bookshelf focuses on curating and sharing rather than reviews and reading stats. Many people use it alongside a dedicated tracker for that.',
  },
  {
    q: 'Can I import my Goodreads books?',
    a: 'There is no one-click Goodreads sync, but you can paste a list of links — Goodreads book links included — on the import page and Virtual Bookshelf will build a shelf from them. You can also add books one at a time by searching, which fills in the cover automatically.',
  },
  {
    q: 'Is Virtual Bookshelf free like Goodreads?',
    a: 'Yes, Virtual Bookshelf is free to use.',
  },
  {
    q: 'Do I need an Amazon account to use it?',
    a: 'No. Unlike Goodreads, Virtual Bookshelf has no connection to Amazon and needs no Amazon account.',
  },
];

export default function GoodreadsAlternativePage() {
  return (
    <AlternativeLandingPage
      breadcrumbLabel="Goodreads alternative"
      h1="A Goodreads alternative for showing off the books you love"
      heroSubhead="Virtual Bookshelf turns your reading into a beautiful, shareable shelf — cover art and all — that you actually control. No ads, no Amazon account, and you can mix in podcasts, music, and anything else."
      intro={{
        heading: 'Why look for a Goodreads alternative?',
        paragraphs: [
          'Goodreads is good at tracking and reviewing, but it is owned by Amazon, busy with ads, and has barely changed in years — and your shelves live inside its walls, looking the way it decides.',
          'Virtual Bookshelf is the opposite: a clean, beautiful page that is yours to share with a single link. It is built for curating and showing the books you love — not for reviews, ratings, and reading challenges.',
        ],
      }}
      reasons={{
        heading: 'Your books, beautifully, on a page you own',
        sub: 'Less profile-in-a-walled-garden, more shareable shelf you control.',
        items: [
          { title: 'Beautiful and yours', body: 'A clean shelf you control the look of — no ads, no clutter, no Amazon account required.' },
          { title: 'Made to be shared', body: 'Send your shelf anywhere — bio, newsletter, or site — and it shows the covers, not a wall of text.' },
          { title: 'More than books', body: 'Add podcasts, music, videos, and links so your shelf reflects everything you are into, not just your reading.' },
        ],
      }}
      comparison={{
        heading: 'Virtual Bookshelf vs. Goodreads',
        sub: 'Two very different tools — one for sharing a beautiful shelf, one for tracking and reviewing.',
        columns: [{ name: 'Virtual Bookshelf', highlight: true }, { name: 'Goodreads' }],
        rows: [
          { feature: 'Beautiful, shareable shelf', cells: [['Yes', true], ['Basic profile', null]] },
          { feature: 'You control the design', cells: [['Yes', true], ['No', false]] },
          { feature: 'Ads', cells: [['None', true], ['Yes', false]] },
          { feature: 'Amazon account', cells: [['Not needed', true], ['Effectively required', false]] },
          { feature: 'One shareable link', cells: [['Yes', true], ['Profile link', null]] },
          { feature: 'Add podcasts, music & more', cells: [['Yes', true], ['Books only', false]] },
          { feature: 'Embed on your own site', cells: [['Yes', true], ['No', false]] },
          { feature: 'Reviews, ratings & reading stats', cells: [['Not the focus', null], ['Yes', true]] },
        ],
        note: 'Comparison reflects publicly reported details as of June 2026. Goodreads is a trademark of its owner; this page is not affiliated with Goodreads or Amazon.',
      }}
      steps={{
        heading: 'Build your shelf in three steps',
        sub: 'Most shelves come together in a few minutes — covers and details fill in for you.',
        items: [
          { n: 1, title: 'Create your shelf', body: 'Sign up free and start a shelf — no credit card, no Amazon account.' },
          { n: 2, title: 'Add the books you love', body: 'Search any title and the cover and details fill in automatically — or paste a list of links to add several at once.' },
          { n: 3, title: 'Share your shelf', body: 'Send your one link anywhere, or embed the shelf on your own site.' },
        ],
      }}
      faq={{ heading: 'Goodreads alternative FAQ', items: FAQ }}
      cta={{
        heading: 'Build a bookshelf worth sharing',
        sub: 'Curate the books you love on a page that is yours — and share it with one link.',
      }}
      jsonLd={[
        faqPageJsonLd(FAQ),
        breadcrumbJsonLd([
          { name: 'Home', url: baseUrl },
          { name: 'Goodreads alternative', url: `${baseUrl}/goodreads-alternative` },
        ]),
      ]}
    />
  );
}
