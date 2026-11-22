import type { Metadata } from 'next';
import { ContactEmail, LegalLink, LegalPage, LegalSection, Placeholder } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Terms',
  description:
    'The terms for using Virtual Bookshelf: what the service is, acceptable use, who owns your content, what publishing a shelf means, and how these terms can change.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      crumb="Terms"
      intro={
        <p>
          These are the terms for using Virtual Bookshelf. They are short on purpose. By creating an account or
          using the site, you agree to them.
        </p>
      }
    >
      <LegalSection id="service" title="The service">
        <p>
          Virtual Bookshelf is a free tool for building shelves of books, podcasts, music, videos, links and
          stock tickers, and sharing them with a link or an embed. It is run by one person, not a company, and
          the code is public on{' '}
          <LegalLink href="https://github.com/arielwernick/virtual_bookshelf">GitHub</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection id="account" title="Your account">
        <p>
          Give a real email address and keep your password to yourself. You are responsible for what happens
          under your account. The site does not send email yet, so there is no automatic password reset.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" title="Acceptable use">
        <p>Please do not use Virtual Bookshelf to:</p>
        <ul>
          <li>publish anything illegal, or anything that harasses, threatens or impersonates someone</li>
          <li>share other people&apos;s private information</li>
          <li>post spam, scams, malware, or links meant to mislead people</li>
          <li>publish content you have no right to share</li>
          <li>break, overload or probe the site, or get around its rate limits</li>
          <li>collect other people&apos;s data from the site in bulk for purposes they would not expect</li>
        </ul>
        <p>We may remove content, unpublish shelves or close accounts that do any of this.</p>
      </LegalSection>

      <LegalSection id="your-content" title="Your content stays yours">
        <p>
          You own what you write here: your shelf names, descriptions, notes and ratings. You give us permission
          to store it and to show it the way the site works, which for a published shelf includes its public
          page, embeds on other sites, and the Markdown and JSON versions. That permission ends when you delete
          the content.
        </p>
        <p>
          Covers, titles and other details pulled in from services such as Google Books, Spotify and YouTube
          belong to their owners, not to you or to us.
        </p>
      </LegalSection>

      <LegalSection id="public-shelves" title="Public shelves are public">
        <p>
          A shelf is private until you publish it. Once you publish a shelf, anyone can see it, copy it and link
          to it. That includes search engines and AI crawlers, which may index it, quote it or learn from it.
          Published shelves are listed in our sitemap and <code>llms.txt</code> so they are easy to find.
        </p>
        <p>
          You can make a shelf private again or delete it at any time. We cannot pull back copies that others
          have already made.
        </p>
      </LegalSection>

      <LegalSection id="no-warranty" title="No warranty">
        <p>
          The site is free and provided as it is, with no promises. It may have bugs, go offline, change, or shut
          down. Details pulled in from other services may be wrong or out of date. Stock prices and charts are
          for interest only and are not financial advice.
        </p>
        <p>
          As far as the law allows, the person who runs the site is not liable for any loss that comes from using
          it. Use the export link on your dashboard to keep your own copy of your shelves.
        </p>
      </LegalSection>

      <LegalSection id="leaving" title="Leaving">
        <p>
          You can stop using the site at any time, and you can delete your shelves yourself. To have your account
          deleted, write to us. The <LegalLink href="/privacy">Privacy page</LegalLink> says what we hold and how
          deletion works.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to these terms">
        <p>
          These terms may change. When they do, we will update this page and the date at the top. If you keep
          using the site after a change, you accept the new terms. The full history of this page is public in the
          code repository.
        </p>
      </LegalSection>

      <LegalSection id="law" title="Governing law">
        <p>
          <Placeholder>governing law and location to be added</Placeholder>
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact">
        <p>
          Questions about these terms: <ContactEmail />
        </p>
      </LegalSection>
    </LegalPage>
  );
}
