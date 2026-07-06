import type { Metadata } from 'next';
import { AlternativeLandingPage } from '@/components/landing/AlternativeLandingPage';
import { faqPageJsonLd, breadcrumbJsonLd, type FaqItem } from '@/lib/utils/landingSchema';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app';

export const metadata: Metadata = {
  title: 'Bento.me Alternative (2026)',
  description:
    'Bento.me shut down in February 2026. Virtual Bookshelf is the best free alternative for creators who want to showcase the books, podcasts, music, and videos they love — with automatic cover art, in one shareable link.',
  alternates: { canonical: '/bento-alternative' },
  openGraph: {
    title: 'The best Bento.me alternative for creators',
    description:
      'Bento.me shut down in February 2026. Virtual Bookshelf is a free alternative with rich, automatic cards for the books, podcasts, music, and videos you love — in one shareable link.',
    type: 'website',
    url: `${baseUrl}/bento-alternative`,
    siteName: 'Virtual Bookshelf',
    images: [{ url: `${baseUrl}/api/og/landing`, width: 1200, height: 630, alt: 'Virtual Bookshelf — a Bento.me alternative' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The best Bento.me alternative for creators',
    description:
      'Bento.me shut down in February 2026. Virtual Bookshelf is a free alternative with rich, automatic cards for what you read, watch & hear.',
    images: [`${baseUrl}/api/og/landing`],
  },
};

const FAQ: FaqItem[] = [
  {
    q: 'What happened to Bento.me?',
    a: 'Bento.me shut down on February 13, 2026. After being acquired by Linktree in 2023, the service was discontinued and existing Bento pages now redirect to Linktree. Exports are no longer available, so most former users are rebuilding their page on a new platform.',
  },
  {
    q: 'What is the best Bento.me alternative?',
    a: 'It depends on what your Bento was for. If you mainly showcased the books, podcasts, music, and videos you love, Virtual Bookshelf is the closest fit — it builds rich, visual cards with automatic cover art instead of a plain list of links.',
  },
  {
    q: 'Is there a free Bento.me alternative?',
    a: 'Yes. Virtual Bookshelf is free to use. Create a shelf, add your content, and share the link — no credit card required.',
  },
  {
    q: 'Can I import or migrate my Bento.me page?',
    a: 'Bento deleted user data when it shut down, so there is nothing to import. The good news is that rebuilding is fast: search for a book, podcast, album, or video and Virtual Bookshelf pulls in the cover art and details automatically, so a full shelf takes only a few minutes.',
  },
  {
    q: 'How is Virtual Bookshelf different from Linktree?',
    a: 'Linktree shows a vertical list of text links. Virtual Bookshelf shows rich content — cover art, titles, creators, and live prices — for everything on your shelf, which is much closer to the visual experience Bento offered.',
  },
  {
    q: 'Is Virtual Bookshelf a good Bento alternative for creators?',
    a: 'For creators who want to share what they are reading, watching, and listening to — authors, podcasters, newsletter writers, musicians, and reviewers — yes. Each item becomes a polished card, and the whole shelf lives behind one link you can put in any bio.',
  },
];

export default function BentoAlternativePage() {
  return (
    <AlternativeLandingPage
      breadcrumbLabel="Bento.me alternative"
      h1="The Bento.me alternative for everything you read, watch & hear"
      heroSubhead="Bento.me shut down in February 2026. Virtual Bookshelf picks up where it left off — rich, visual cards for the books, podcasts, music, and videos you love, all behind one shareable link."
      intro={{
        heading: 'What happened to Bento.me?',
        paragraphs: [
          'Bento.me shut down on February 13, 2026. After being acquired by Linktree in 2023, the service was discontinued, and existing Bento pages now redirect to Linktree. Exports are no longer available.',
          "If you used Bento to show your work with rich visual blocks, Linktree's simple list of links isn't the same thing. Virtual Bookshelf keeps the part people loved — beautiful, automatic cards — for the books, podcasts, music, and videos you want to share.",
        ],
      }}
      reasons={{
        heading: 'The closest thing to Bento for what you love',
        sub: 'Not another list of links — a curated shelf with real cover art and live details.',
        items: [
          { title: 'Rich cards, not a link list', body: 'Every book, podcast, album, and video becomes a visual card with real cover art — the part of Bento people actually miss.' },
          { title: 'Details fill in automatically', body: 'Search or paste, and the title, creator, artwork, and source populate themselves. No uploading images by hand.' },
          { title: 'One link, embeddable anywhere', body: 'Share a single URL or embed your live shelf in Notion, Webflow, or your own site. Update once, everywhere updates.' },
        ],
      }}
      comparison={{
        heading: 'Virtual Bookshelf vs. Bento.me vs. Linktree',
        sub: 'How the options stack up for showcasing the content you care about.',
        columns: [{ name: 'Virtual Bookshelf', highlight: true }, { name: 'Bento.me' }, { name: 'Linktree' }],
        rows: [
          { feature: 'Status in 2026', cells: [['Active', true], ['Shut down (Feb 2026)', false], ['Active', true]] },
          { feature: 'Rich visual cards', cells: [['Yes', true], ['Yes', true], ['List of links', false]] },
          { feature: 'Automatic cover art & metadata', cells: [['Automatic', true], ['Manual', null], ['No', false]] },
          { feature: 'Built for books, podcasts, music & video', cells: [['Yes', true], ['Generic blocks', null], ['Links only', false]] },
          { feature: 'Live stock tickers', cells: [['Yes', true], ['No', false], ['No', false]] },
          { feature: 'One shareable link', cells: [['Yes', true], ['Yes', true], ['Yes', true]] },
          { feature: 'Embed live on your own site', cells: [['Yes', true], ['Limited', null], ['Limited', null]] },
          { feature: 'Free to use', cells: [['Yes', true], ['—', null], ['Free + paid tiers', null]] },
        ],
        note: 'Comparison reflects publicly reported details as of June 2026. Bento.me is a trademark of its owner; this page is not affiliated with Bento.me or Linktree.',
      }}
      steps={{
        heading: 'Switch in three steps',
        sub: 'Nothing to import means nothing to wait for — most shelves take a few minutes.',
        items: [
          { n: 1, title: 'Create your shelf', body: 'Sign up free and start a shelf — no credit card, no setup.' },
          { n: 2, title: 'Add what you love', body: 'Search a book, podcast, album, or video — or paste any link. Cover art and details fill in automatically.' },
          { n: 3, title: 'Share your link', body: 'Drop your shelf link wherever your Bento link used to live — bio, newsletter, or site.' },
        ],
      }}
      faq={{ heading: 'Bento.me alternative FAQ', items: FAQ }}
      cta={{
        heading: 'Rebuild your Bento in minutes',
        sub: 'Curate the books, podcasts, music, and videos you love, and share them with one link.',
      }}
      jsonLd={[
        faqPageJsonLd(FAQ),
        breadcrumbJsonLd([
          { name: 'Home', url: baseUrl },
          { name: 'Bento.me alternative', url: `${baseUrl}/bento-alternative` },
        ]),
      ]}
    />
  );
}
