import type { Metadata } from 'next';
import { AlternativeLandingPage } from '@/components/landing/AlternativeLandingPage';
import {
  faqPageJsonLd,
  breadcrumbJsonLd,
  itemListJsonLd,
  type FaqItem,
} from '@/lib/utils/landingSchema';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app';
const path = '/best-virtual-bookshelf-apps';

const description =
  'Five ways to build a virtual bookshelf, compared: Virtual Bookshelf, Book Nook, ShelfLife, Goodreads and Notion. Which one fits depends on whether you want to track your reading or share a mix of books, podcasts and more.';

export const metadata: Metadata = {
  title: 'Best Virtual Bookshelf Apps (2026)',
  description,
  alternates: { canonical: path },
  openGraph: {
    title: 'The best virtual bookshelf apps in 2026, compared',
    description,
    type: 'website',
    url: `${baseUrl}${path}`,
    siteName: 'Virtual Bookshelf',
    images: [{ url: `${baseUrl}/api/og/landing`, width: 1200, height: 630, alt: 'Virtual bookshelf apps compared' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The best virtual bookshelf apps in 2026, compared',
    description,
    images: [`${baseUrl}/api/og/landing`],
  },
};

const APPS = [
  { name: 'Virtual Bookshelf', url: baseUrl },
  { name: 'Book Nook', url: 'https://trybooknook.com' },
  { name: 'ShelfLife', url: 'https://apps.apple.com/us/app/shelflife-social-book-tracker/id6761312960' },
  { name: 'Goodreads', url: 'https://www.goodreads.com' },
  { name: 'Notion', url: 'https://www.notion.so' },
];

const FAQ: FaqItem[] = [
  {
    q: 'What is the best app for a virtual bookshelf?',
    a: 'It depends on what the shelf is for. To track what you read, with stats and challenges, use a book tracker such as Book Nook, ShelfLife or Goodreads. To share a shelf that mixes books with podcasts, episodes, music and videos, use Virtual Bookshelf. To build everything yourself, use Notion.',
  },
  {
    q: 'Which virtual bookshelf app supports podcasts as well as books?',
    a: 'Virtual Bookshelf. You can put books, whole podcasts, single podcast episodes, music, YouTube videos and links on the same shelf, and the artwork fills in for you. Book Nook, ShelfLife and Goodreads are for books only. Notion can hold anything, but you add the images and details yourself.',
  },
  {
    q: 'Can I share or embed my virtual bookshelf?',
    a: 'On Virtual Bookshelf, every published shelf has its own link and an embed snippet for a website, blog or newsletter. Book trackers mostly share inside their own apps. Notion pages can be published to the web.',
  },
  {
    q: 'Is there a free virtual bookshelf app?',
    a: 'Yes. Virtual Bookshelf, Book Nook and Goodreads are free. ShelfLife is free with an optional paid membership, and Notion has a free plan.',
  },
  {
    q: 'Does Virtual Bookshelf track my reading?',
    a: 'No. It has no reading timer, stats or challenges. It is for curating and sharing what you love, so many people use it alongside a book tracker.',
  },
  {
    q: 'Do I need to install an app?',
    a: 'Not for Virtual Bookshelf. It runs in the browser on any phone or computer. Book Nook has iPhone, Android and web versions, and ShelfLife is on iPhone and iPad.',
  },
];

export default function BestVirtualBookshelfAppsPage() {
  return (
    <AlternativeLandingPage
      breadcrumbLabel="Best virtual bookshelf apps"
      h1="The best virtual bookshelf apps in 2026"
      heroSubhead="Five ways to put the books you love on a virtual shelf, compared honestly. The right one depends on whether you want to track your reading or show people what you love, podcasts included."
      intro={{
        heading: 'The short answer',
        paragraphs: [
          'Virtual bookshelf apps do one of three jobs. Some are visual shelves, with covers in a grid or on a shelf. Some are personal libraries, for logging, rating and tracking what you read. Some are shareable collections, a curated shelf other people can browse, like a recommendation list.',
          'If you want to track your reading, pick a book tracker: Book Nook, ShelfLife or Goodreads. If you want one shelf that shows your taste across books, podcasts, single episodes, music and videos, and that you can share with a link or embed on your site, pick Virtual Bookshelf. If you want total control and don’t mind setting it up, Notion works.',
        ],
      }}
      reasons={{
        heading: 'Which one fits what you want',
        sub: 'Start from what the shelf is for, not from a feature list.',
        items: [
          {
            title: 'Share books and podcasts together',
            body: 'Virtual Bookshelf. Mix books, podcasts, episodes, music, videos and links on one shelf, add a note on why each is there, and share one link or embed it anywhere.',
          },
          {
            title: 'Track everything you read',
            body: 'Book Nook, ShelfLife or Goodreads. They log reading progress, ratings and reviews, and Book Nook and ShelfLife add a shelf view you can decorate.',
          },
          {
            title: 'Build your own system',
            body: 'Notion. Make a gallery of books and podcasts with your own fields, ratings and notes. It is flexible, but you set it up and add the cover images yourself.',
          },
        ],
      }}
      comparison={{
        heading: 'Five virtual bookshelf apps compared',
        sub: 'What each app is built for, side by side.',
        columns: [
          { name: 'Virtual Bookshelf', highlight: true },
          { name: 'Book Nook' },
          { name: 'ShelfLife' },
          { name: 'Goodreads' },
          { name: 'Notion' },
        ],
        rows: [
          { feature: 'Books', cells: [['Yes', true], ['Yes', true], ['Yes', true], ['Yes', true], ['Manual', null]] },
          { feature: 'Podcasts and single episodes', cells: [['Yes', true], ['No', false], ['No', false], ['No', false], ['Manual', null]] },
          { feature: 'Music, videos and links', cells: [['Yes', true], ['No', false], ['No', false], ['No', false], ['Manual', null]] },
          { feature: 'Cover art fills in for you', cells: [['Yes', true], ['Yes', true], ['Yes', true], ['Yes', true], ['No', false]] },
          { feature: 'Share with one public link', cells: [['Yes', true], ['In the app', null], ['In the app', null], ['Profile link', null], ['Publish to web', true]] },
          { feature: 'Embed on your own site', cells: [['Yes', true], ['Not the focus', null], ['Not the focus', null], ['Widgets', null], ['Not the focus', null]] },
          { feature: 'Reading tracking and stats', cells: [['Not the focus', null], ['Yes', true], ['Yes', true], ['Yes', true], ['Build it yourself', null]] },
          { feature: 'Platforms', cells: [['Web, any device', true], ['iOS, Android, web', true], ['iPhone, iPad', null], ['iOS, Android, web', true], ['Web, desktop, mobile', true]] },
          { feature: 'Price', cells: [['Free', true], ['Free', true], ['Free, paid membership', null], ['Free', true], ['Free plan', true]] },
        ],
        note: 'Based on each app’s own public pages as of November 2026. Book Nook, ShelfLife, Goodreads and Notion are trademarks of their owners; this page is not affiliated with them.',
      }}
      steps={{
        heading: 'Try Virtual Bookshelf in three steps',
        sub: 'Most shelves come together in a few minutes.',
        items: [
          { n: 1, title: 'Create a shelf', body: 'Sign up free. Shelves start private until you publish them.' },
          { n: 2, title: 'Add what you love', body: 'Search a book, podcast or album and the artwork fills in, or paste a link to an episode, video or article.' },
          { n: 3, title: 'Share it', body: 'Send one link, or embed the shelf on your website or newsletter.' },
        ],
      }}
      faq={{ heading: 'Virtual bookshelf apps FAQ', items: FAQ }}
      cta={{
        heading: 'Build a shelf of books and podcasts',
        sub: 'Show people what you love, across every medium, with one link.',
      }}
      jsonLd={[
        itemListJsonLd('Virtual bookshelf apps', APPS),
        faqPageJsonLd(FAQ),
        breadcrumbJsonLd([
          { name: 'Home', url: baseUrl },
          { name: 'Best virtual bookshelf apps', url: `${baseUrl}${path}` },
        ]),
      ]}
    />
  );
}
