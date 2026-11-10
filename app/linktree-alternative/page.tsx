import type { Metadata } from 'next';
import { AlternativeLandingPage } from '@/components/landing/AlternativeLandingPage';
import { faqPageJsonLd, breadcrumbJsonLd, type FaqItem } from '@/lib/utils/landingSchema';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app';

export const metadata: Metadata = {
  title: 'Linktree Alternative (2026)',
  description:
    'Looking for a Linktree alternative? Virtual Bookshelf turns your link in bio into rich, visual cards — books, podcasts, music, and videos with automatic cover art — instead of a plain list of links. Free.',
  alternates: { canonical: '/linktree-alternative' },
  openGraph: {
    title: 'A Linktree alternative with rich cards, not just links',
    description:
      'Virtual Bookshelf turns your link in bio into visual cards with automatic cover art — for the books, podcasts, music, and videos you love. Free.',
    type: 'website',
    url: `${baseUrl}/linktree-alternative`,
    siteName: 'Virtual Bookshelf',
    images: [{ url: `${baseUrl}/api/og/landing`, width: 1200, height: 630, alt: 'Virtual Bookshelf — a Linktree alternative' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'A Linktree alternative with rich cards, not just links',
    description:
      'Turn your link in bio into a shelf of visual cards with automatic cover art — for what you read, watch & hear. Free.',
    images: [`${baseUrl}/api/og/landing`],
  },
};

const FAQ: FaqItem[] = [
  {
    q: 'Is Virtual Bookshelf a good Linktree alternative?',
    a: 'If your link in bio is mostly about the books, podcasts, music, and videos you love, yes. Virtual Bookshelf shows each one as a rich card with cover art, instead of a plain list of links.',
  },
  {
    q: 'What is the difference between Virtual Bookshelf and Linktree?',
    a: 'Linktree shows a vertical list of text links. Virtual Bookshelf shows visual cards with cover art, titles, creators, and even live prices — a curated shelf rather than a menu of links.',
  },
  {
    q: 'Is there a free Linktree alternative?',
    a: 'Yes. Virtual Bookshelf is free to use — create a shelf, add your content, and share the link with no credit card required.',
  },
  {
    q: 'Can I still link to anything, like I can on Linktree?',
    a: 'Yes. Paste any URL and Virtual Bookshelf turns it into a card, pulling in the title, image, and source automatically.',
  },
  {
    q: 'Do I have to choose between Linktree and Virtual Bookshelf?',
    a: 'No — many people use both. You can drop your Virtual Bookshelf link inside your existing Linktree, or use your shelf as your main link in bio.',
  },
  {
    q: 'Can I embed my shelf on my own website?',
    a: 'Yes. Every shelf has a public link and an embed option, so it can live on your own site and update automatically whenever you change the shelf.',
  },
];

export default function LinktreeAlternativePage() {
  return (
    <AlternativeLandingPage
      breadcrumbLabel="Linktree alternative"
      h1="The Linktree alternative with rich cards, not just links"
      heroSubhead="Linktree gives visitors a list of text links. Virtual Bookshelf gives every book, podcast, album, and video its own visual card — with cover art pulled in automatically — all behind one link in your bio."
      intro={{
        heading: 'Why look for a Linktree alternative?',
        paragraphs: [
          "Linktree is great for a quick list of links. But if what you're sharing is the media you love — what you read, watch, and listen to — a stack of identical buttons sells it short.",
          'Virtual Bookshelf shows the covers, titles, and creators, so your page looks like a curated shelf instead of a menu. It is still one link in your bio — it just looks like something worth tapping.',
        ],
      }}
      reasons={{
        heading: 'A link in bio that actually shows your taste',
        sub: 'Cards with real cover art, not a column of look-alike links.',
        items: [
          { title: 'Cards, not a link list', body: "Every book, podcast, album, and video becomes a visual card with real cover art — so your page shows what you're recommending, not just where it goes." },
          { title: 'Filled in automatically', body: 'Search a title or paste a URL and the cover, creator, and source appear on their own. No thumbnails to design or upload.' },
          { title: 'Built for media', body: 'Books, podcasts, music, video, and even live stock tickers are first-class — not generic buttons with an icon.' },
        ],
      }}
      comparison={{
        heading: 'Virtual Bookshelf vs. Linktree',
        sub: 'Two ways to do "link in bio" — a list of links, or a shelf of rich cards.',
        columns: [{ name: 'Virtual Bookshelf', highlight: true }, { name: 'Linktree' }],
        rows: [
          { feature: 'Page format', cells: [['A shelf of visual cards', true], ['A list of text links', false]] },
          { feature: 'Cover art & metadata', cells: [['Shown automatically', true], ['Not shown', false]] },
          { feature: 'Built for books, podcasts, music & video', cells: [['Yes', true], ['Generic links', false]] },
          { feature: 'Live stock tickers', cells: [['Yes', true], ['No', false]] },
          { feature: 'Embed live on your own site', cells: [['Yes', true], ['Limited', null]] },
          { feature: 'One link in your bio', cells: [['Yes', true], ['Yes', true]] },
          { feature: 'Free to use', cells: [['Yes', true], ['Free + paid tiers', null]] },
        ],
        note: 'Comparison reflects publicly reported details as of June 2026. Linktree is a trademark of its owner; this page is not affiliated with Linktree.',
      }}
      steps={{
        heading: 'Switch from Linktree in three steps',
        sub: 'Keep your Linktree if you like — or replace it. Either way this takes a few minutes.',
        items: [
          { n: 1, title: 'Create your shelf', body: 'Sign up free and start a shelf — no credit card, no setup.' },
          { n: 2, title: 'Add what you love', body: 'Search a book, podcast, album, or video — or paste any link. Cover art and details fill in automatically.' },
          { n: 3, title: 'Update your bio link', body: 'Swap your Linktree URL for your shelf link — or add it inside your Linktree.' },
        ],
      }}
      faq={{ heading: 'Linktree alternative FAQ', items: FAQ }}
      cta={{
        heading: 'Turn your link in bio into a shelf',
        sub: 'Show the books, podcasts, music, and videos you love — with one link, beautifully.',
      }}
      jsonLd={[
        faqPageJsonLd(FAQ),
        breadcrumbJsonLd([
          { name: 'Home', url: baseUrl },
          { name: 'Linktree alternative', url: `${baseUrl}/linktree-alternative` },
        ]),
      ]}
    />
  );
}
