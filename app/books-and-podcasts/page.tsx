import type { Metadata } from 'next';
import { AlternativeLandingPage } from '@/components/landing/AlternativeLandingPage';
import { faqPageJsonLd, breadcrumbJsonLd, type FaqItem } from '@/lib/utils/landingSchema';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app';
const path = '/books-and-podcasts';

const description =
  'Make a virtual bookshelf of the books and podcasts you like. Put books, whole podcasts and single episodes on one shelf with their cover art, then share it with a link or embed it. Free.';

export const metadata: Metadata = {
  title: 'A Virtual Bookshelf for Books and Podcasts',
  description,
  alternates: { canonical: path },
  openGraph: {
    title: 'A virtual bookshelf for the books and podcasts you like',
    description,
    type: 'website',
    url: `${baseUrl}${path}`,
    siteName: 'Virtual Bookshelf',
    images: [{ url: `${baseUrl}/api/og/landing`, width: 1200, height: 630, alt: 'A shelf of books and podcasts' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'A virtual bookshelf for the books and podcasts you like',
    description,
    images: [`${baseUrl}/api/og/landing`],
  },
};

const FAQ: FaqItem[] = [
  {
    q: 'How do I make a virtual bookshelf of books and podcasts?',
    a: 'Create a free shelf on Virtual Bookshelf, then search for each book or podcast by name. The cover art and details fill in for you. Add single episodes or anything else by pasting a link, then publish the shelf and share its link.',
  },
  {
    q: 'Can I add a single podcast episode, not just the show?',
    a: 'Yes. You can add a whole podcast or one episode, so a shelf can point people to the exact episode you want them to hear.',
  },
  {
    q: 'Can I put books, podcasts, music and videos on the same shelf?',
    a: 'Yes. One shelf can hold books, podcasts, episodes, music, YouTube videos and links, side by side.',
  },
  {
    q: 'Can I say why I picked each one?',
    a: 'Yes. Each item can have a short note, shown on the shelf, saying why it is there.',
  },
  {
    q: 'Can I share or embed the shelf?',
    a: 'Yes. A published shelf has its own link, and you can embed it on a website, blog, Notion page or newsletter.',
  },
  {
    q: 'Does it track what I have read or listened to?',
    a: 'No. Virtual Bookshelf is for curating and sharing, not for logging progress or stats. Use it alongside a reading tracker or podcast app if you want those.',
  },
  {
    q: 'Is it free?',
    a: 'Yes. Virtual Bookshelf is free to use, and shelves stay private until you publish them.',
  },
];

export default function BooksAndPodcastsPage() {
  return (
    <AlternativeLandingPage
      breadcrumbLabel="Books and podcasts"
      h1="A virtual bookshelf for the books and podcasts you like"
      heroSubhead="Put your favorite books, podcasts and single episodes on one shelf, with their cover art, and share it with a link. It’s the online version of the shelf in your living room."
      intro={{
        heading: 'Where can I keep books and podcasts together?',
        paragraphs: [
          'Most bookshelf apps only hold books, and podcast apps only hold what you subscribe to. If your taste runs across both, they end up in two places, and neither is easy to show someone.',
          'Virtual Bookshelf puts them on the same shelf. Search a book or a podcast and the artwork fills in, add the one episode you keep recommending, and write a line on why each is there. Then share one link, or embed the shelf on your site.',
        ],
      }}
      reasons={{
        heading: 'One shelf for everything you read and listen to',
        sub: 'Less a reading log, more a shelf that shows what you love.',
        items: [
          { title: 'Books and podcasts together', body: 'Books, whole shows and single episodes sit side by side, with music, videos and links if you want them.' },
          { title: 'Artwork fills in', body: 'Search by name and the cover or podcast art is added for you. No screenshots or image hunting.' },
          { title: 'Made to share', body: 'Send one link, or embed the shelf in a website, blog or newsletter. Shelves stay private until you publish them.' },
        ],
      }}
      comparison={{
        heading: 'Virtual Bookshelf vs. book trackers and podcast apps',
        sub: 'Different tools for different jobs.',
        columns: [{ name: 'Virtual Bookshelf', highlight: true }, { name: 'Book trackers' }, { name: 'Podcast apps' }],
        rows: [
          { feature: 'Books with covers', cells: [['Yes', true], ['Yes', true], ['No', false]] },
          { feature: 'Podcasts', cells: [['Yes', true], ['No', false], ['Yes', true]] },
          { feature: 'Single episodes', cells: [['Yes', true], ['No', false], ['Yes', true]] },
          { feature: 'Books and podcasts on one shelf', cells: [['Yes', true], ['No', false], ['No', false]] },
          { feature: 'A note on why you picked each', cells: [['Yes', true], ['Reviews', null], ['No', false]] },
          { feature: 'Share with one link', cells: [['Yes', true], ['Profile link', null], ['Per episode', null]] },
          { feature: 'Embed on your own site', cells: [['Yes', true], ['Rarely', null], ['Single player', null]] },
          { feature: 'Reading or listening progress', cells: [['Not the focus', null], ['Yes', true], ['Yes', true]] },
        ],
        note: 'Book trackers and podcast apps vary; this compares what they are typically built for.',
      }}
      steps={{
        heading: 'Build your shelf in three steps',
        sub: 'Most shelves come together in a few minutes.',
        items: [
          { n: 1, title: 'Create a shelf', body: 'Sign up free and name your shelf.' },
          { n: 2, title: 'Add books and podcasts', body: 'Search each title or show, or paste a link to an episode. Add a note on why it’s there.' },
          { n: 3, title: 'Share it', body: 'Publish, then send the link or embed the shelf anywhere.' },
        ],
      }}
      faq={{ heading: 'Books and podcasts FAQ', items: FAQ }}
      cta={{
        heading: 'Put your books and podcasts on one shelf',
        sub: 'Free, and ready to share in a few minutes.',
      }}
      jsonLd={[
        faqPageJsonLd(FAQ),
        breadcrumbJsonLd([
          { name: 'Home', url: baseUrl },
          { name: 'Books and podcasts', url: `${baseUrl}${path}` },
        ]),
      ]}
    />
  );
}
