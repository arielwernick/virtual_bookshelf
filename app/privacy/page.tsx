import type { Metadata } from 'next';
import { ContactEmail, LegalLink, LegalPage, LegalSection } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'What Virtual Bookshelf collects when you sign up and build shelves, which cookies it sets, which outside services receive data, and how to export or delete your data.',
  alternates: { canonical: '/privacy' },
};

/**
 * Every statement here was checked against the code on November 21, 2026,
 * after the switch to Better Auth
 * (issue #305). If you change what the app stores, sets or sends, change this
 * page and LEGAL_LAST_UPDATED in the same pull request.
 */
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      crumb="Privacy"
      intro={
        <>
          <p>
            This page says what Virtual Bookshelf collects, where it goes, and what you can do about it. It
            describes what the site does today.
          </p>
          <p>
            Virtual Bookshelf is run by one person, not a company. The code is public, so you can check any of
            this yourself on{' '}
            <LegalLink href="https://github.com/arielwernick/virtual_bookshelf">GitHub</LegalLink>.
          </p>
        </>
      }
    >
      <LegalSection id="account" title="What we store when you create an account">
        <p>If you sign up with an email and password, we store:</p>
        <ul>
          <li>your username and email address</li>
          <li>your password, scrambled with bcrypt. We never store the password itself and cannot read it.</li>
        </ul>
        <p>
          If you sign up with Google, we ask Google for your email address and basic profile, and store:
        </p>
        <ul>
          <li>your email address, and whether Google says it is verified</li>
          <li>your Google account ID</li>
          <li>
            the name and profile picture address on your Google account. We do not show either of them anywhere
            on the site today.
          </li>
          <li>
            a username made from the part of your email before the @. Usernames are not shown on public shelf
            pages.
          </li>
          <li>
            the sign-in tokens Google hands back. They are refreshed each time you sign in with Google, and are
            stored as Google sends them, without extra encryption. We do not use them to read anything from your
            Google account.
          </li>
        </ul>
        <p>
          If you sign in with Google using an email that already has an account here, the two are linked.
        </p>
        <p>For every account we also store:</p>
        <ul>
          <li>whether you signed up with email or Google, and when</li>
          <li>when you were last active. This is updated at most once an hour, when you open your dashboard.</li>
          <li>where you came from when you first visited. See the next section.</li>
        </ul>
      </LegalSection>

      <LegalSection id="sessions" title="Staying signed in">
        <p>
          Each time you sign in, we create a session and keep a record of it in our database. The record holds
          your user ID, when the session started and expires, and the IP address and browser details (the
          &quot;user agent&quot;) of the device you signed in from.
        </p>
        <p>
          A session lasts 7 days and is extended when you come back, so you stay signed in as long as you visit
          at least once a week. Signing out ends the session and deletes its record. Records of sessions that
          simply expire are not cleaned up on a schedule yet.
        </p>
      </LegalSection>

      <LegalSection id="referral" title="Where you came from">
        <p>
          This one is easy to miss, so we will be plain about it. The first time anyone visits the site, signed
          in or not, we set a cookie that records:
        </p>
        <ul>
          <li>the address of the page that linked you here, without anything after a <code>?</code> or <code>#</code></li>
          <li>
            any <code>utm_source</code>, <code>utm_medium</code> and <code>utm_campaign</code> tags on the link
            you followed
          </li>
          <li>
            the first page you landed on. For shelf pages we record only that it was a shelf, not which one.
          </li>
        </ul>
        <p>
          The cookie stays in your browser for 30 days. We do not ask before setting it. If you create an account
          while it is there, we copy those details onto your account, so we can see which sites bring people in.
          If you never sign up, they never reach our database.
        </p>
      </LegalSection>

      <LegalSection id="shelves" title="What you put on your shelves">
        <p>
          We store your shelves and everything on them: shelf names and descriptions, and each item&apos;s title,
          creator, cover image address, link, your notes and your rating.
        </p>
        <p>
          A shelf is private until you publish it. Once published, anyone can see it, including search engines
          and AI crawlers. A published shelf is also listed in our sitemap and <code>llms.txt</code>, offered as
          Markdown and JSON, and can be embedded on other sites. You can make a shelf private again or delete it
          at any time, but copies that others have already made are out of our hands.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="Cookies and browser storage">
        <p>We set three cookies. None of them is an advertising cookie, and none follows you to other sites.</p>
        <ul>
          <li>
            <strong><code>better-auth.session_token</code></strong> keeps you signed in, as described under
            &quot;Staying signed in&quot;. It holds a random session key and nothing about you. Scripts on the
            page cannot read it. On the live site its name starts with <code>__Secure-</code>.
          </li>
          <li>
            <strong><code>better-auth.state</code></strong> lasts 5 minutes while you sign in with Google, and
            protects that sign-in from being hijacked.
          </li>
          <li>
            <strong><code>vb_attribution</code></strong> lasts 30 days and holds the details described under
            &quot;Where you came from&quot;.
          </li>
        </ul>
        <p>
          We also use your browser&apos;s own storage for two small things that stay on your device:
        </p>
        <ul>
          <li>
            When you view a public shelf, a marker for that tab, so a refresh is not counted as a second view. It
            is gone when you close the tab.
          </li>
          <li>
            If you paste a list before signing up, the preview of it (the links, their titles and images, and the
            shelf name you chose) is kept in your browser so it survives signing up. It is removed once the shelf
            is created or you start over, and ignored after a day.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="views" title="View counts">
        <p>
          We count how many times each public shelf and each embedded shelf is viewed per day. For embeds we also
          record the name of the site the shelf is embedded on, such as <code>example.com</code>. Shelf owners
          see the totals for their own shelves.
        </p>
        <p>
          We store the count only. Nothing about the person viewing is saved: no IP address, no browser details
          and no account. We do not currently delete old daily counts.
        </p>
        <p>
          Separately, we use Vercel Web Analytics to count visits to pages across the site. Vercel runs that
          service; see{' '}
          <LegalLink href="https://vercel.com/docs/analytics/privacy-policy">Vercel&apos;s description</LegalLink>{' '}
          of what it collects.
        </p>
      </LegalSection>

      <LegalSection id="rate-limits" title="Rate limits and your IP address">
        <p>
          To stop abuse, we limit how often one IP address can try to sign in, sign up, start Google sign-in,
          search for items, import a list, or be counted as a shelf view. To do that, we send your IP address to
          Upstash, which runs the counter for us.
        </p>
        <p>
          The limits are counted per minute. For everything except view counting, an Upstash reporting feature is
          also switched on, so Upstash may keep a record of those requests, including the IP address, for longer
          than that.
        </p>
      </LegalSection>

      <LegalSection id="services" title="Outside services that receive data">
        <p>These services run the site and hold or handle its data:</p>
        <ul>
          <li><strong>Vercel</strong> hosts the site, so it handles every request, including your IP address and browser details.</li>
          <li><strong>Neon</strong> hosts the database, which holds your account and your shelves.</li>
          <li><strong>Upstash</strong> receives IP addresses for rate limits, as described above.</li>
          <li><strong>Google</strong> handles sign-in, if you choose to sign in with Google.</li>
          <li>
            <strong>Cloudflare</strong> runs the site&apos;s domain name. If you write to our contact address, it
            forwards your message to a Gmail inbox, which Google runs.
          </li>
          <li>
            <strong>Resend</strong> is set up to send the site&apos;s email. It does not send anything to users
            yet, so it has not received your address.
          </li>
        </ul>
        <p>
          When you add something to a shelf, our server looks it up for you. These requests come from our server,
          not your browser, and carry only what is listed:
        </p>
        <ul>
          <li><strong>Google Books</strong> receives the words you search for when adding a book.</li>
          <li><strong>Spotify</strong> receives the words you search for when adding music or a podcast.</li>
          <li><strong>YouTube</strong> receives the ID of a video you add.</li>
          <li><strong>Microlink</strong> receives the address of a link you add, to fetch its title and image.</li>
          <li><strong>Yahoo Finance</strong> receives the ticker symbol of a stock you add or view.</li>
          <li>
            <strong>The site a link points to</strong> may be contacted by our server, for example to follow a
            shortened link to its real address.
          </li>
        </ul>
        <p>
          Some things are loaded by your browser straight from other sites, which means those sites see your IP
          address. This applies to anyone viewing a shelf, not only account holders:
        </p>
        <ul>
          <li>
            Cover images are loaded from wherever they are hosted, such as Google Books, Spotify, YouTube or the
            site an item links to.
          </li>
          <li>Stock logos are loaded from Financial Modeling Prep.</li>
          <li>Opening a video shows the YouTube player, which YouTube runs under its own privacy policy.</li>
        </ul>
      </LegalSection>

      <LegalSection id="assistants" title="Connecting an AI assistant">
        <p>
          You can connect an AI assistant to your account so it can read and change your shelves. When you
          approve a connection, we store the name the assistant gave, a scrambled copy of its access token, and
          when the token was last used. The token works for 30 days.
        </p>
        <p>
          There is no button to disconnect an assistant yet. Access ends when the token expires, or you can ask
          us to remove it sooner.
        </p>
      </LegalSection>

      <LegalSection id="access" title="Who can see your data">
        <p>
          The person who runs the site can see an admin page listing each account&apos;s username, email address,
          sign-up method, the referral details above, sign-up date, last active time, and how many shelves and
          items it has.
        </p>
        <p>
          We do not sell your data, and the site has no advertising. We do not send you email yet, not even a
          welcome message, so there is no automatic password reset yet. When that changes, this page will say
          what we send and how to stop it.
        </p>
      </LegalSection>

      <LegalSection id="your-data" title="Exporting and deleting your data">
        <ul>
          <li>
            <strong>Export.</strong> Your dashboard has an export link that downloads all your shelves and items,
            private ones included, as one JSON file. It does not include your account details, such as your email
            address or the referral details.
          </li>
          <li>
            <strong>Delete shelves and items.</strong> You can delete any item or shelf yourself. It is removed
            from our database straight away.
          </li>
          <li>
            <strong>Delete your account.</strong> There is no delete button yet. Write to us and we will delete
            your account and everything on it by hand.
          </li>
        </ul>
        <p>
          We keep your account and shelves until you delete them or ask us to. We do not automatically remove
          accounts that have gone quiet.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to this page">
        <p>
          When the site starts doing something different with your data, we will update this page and the date at
          the top. The full history of this page is public in the code repository.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact">
        <p>
          Questions, or a request to delete your account: <ContactEmail />
        </p>
        <p>
          See also the <LegalLink href="/terms">Terms</LegalLink>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
