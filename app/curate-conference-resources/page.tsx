import type { Metadata } from 'next';
import { AlternativeLandingPage } from '@/components/landing/AlternativeLandingPage';
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

export default function CurateConferenceResourcesPage() {
  return (
    <AlternativeLandingPage
      breadcrumbLabel="Curate conference resources"
      h1="Turn your conference recap into a shareable resource shelf"
      heroSubhead="Stop sharing flat lists of links. Add your talks, recordings, and articles — cover art and titles fill in automatically — then share one beautiful URL with your community."
      intro={{
        heading: 'What is the best way to share conference resources?',
        paragraphs: [
          'After a great event, the instinct is to paste every link into a LinkedIn post or newsletter. The result is a wall of text that nobody saves and most people skip.',
          'A Virtual Bookshelf shelf does the same thing visually — each talk or article becomes a rich card with a thumbnail, title, and your own note. Share one URL and your audience can browse, click, and bookmark what matters to them.',
        ],
      }}
      reasons={{
        heading: 'Built for the way people actually share event resources',
        sub: 'Rich cards, automatic metadata, one link — everything a flat post is not.',
        items: [
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
        ],
      }}
      comparison={{
        heading: 'Virtual Bookshelf vs. a LinkedIn post vs. a Google Doc',
        sub: 'How the common options stack up for sharing event resources.',
        columns: [
          { name: 'Virtual Bookshelf', highlight: true },
          { name: 'LinkedIn post' },
          { name: 'Google Doc / Notion' },
        ],
        rows: [
          {
            feature: 'Visual cards with thumbnails',
            cells: [['Yes — automatic', true], ['No', false], ['No', false]],
          },
          {
            feature: 'Shareable with one link',
            cells: [['Yes', true], ['Yes (post URL)', true], ['Yes (doc URL)', true]],
          },
          {
            feature: 'Works as a bio link',
            cells: [['Yes', true], ['No', false], ['Poor UX', null]],
          },
          {
            feature: 'Embeddable on any site',
            cells: [['Yes', true], ['No', false], ['Limited', null]],
          },
          {
            feature: 'Add personal notes per item',
            cells: [['Yes', true], ['Only in caption', null], ['Yes', true]],
          },
          {
            feature: 'Stays live and updatable',
            cells: [['Yes', true], ['Buried in feed', false], ['Yes', true]],
          },
          {
            feature: 'Free to use',
            cells: [['Yes', true], ['Yes', true], ['Free + paid tiers', null]],
          },
        ],
        note: 'Comparison reflects general platform capabilities as of June 2026.',
      }}
      steps={{
        heading: 'Build your conference shelf in minutes',
        sub: 'Most event recaps take less than ten minutes to shelve.',
        items: [
          {
            n: 1,
            title: 'Create a shelf',
            body: 'Sign up free and name your shelf — "Engineering Leadership Live 2026" or whatever fits your event.',
          },
          {
            n: 2,
            title: 'Add talks and links',
            body: 'Paste each recording, article, or speaker link. Thumbnails, titles, and descriptions fill in automatically.',
          },
          {
            n: 3,
            title: 'Share your URL',
            body: 'Drop the shelf link in your LinkedIn post, newsletter, or bio. Embed it on your site if you want it live anywhere else.',
          },
        ],
      }}
      faq={{ heading: 'Frequently asked questions', items: FAQ }}
      cta={{
        heading: 'Shelve your next conference recap',
        sub: 'Free to use. Looks great. Takes minutes. Your community will actually read it.',
      }}
      jsonLd={[
        faqPageJsonLd(FAQ),
        breadcrumbJsonLd([
          { name: 'Home', url: baseUrl },
          { name: 'Curate conference resources', url: `${baseUrl}/curate-conference-resources` },
        ]),
      ]}
    />
  );
}
