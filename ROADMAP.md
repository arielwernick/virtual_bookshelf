# Roadmap

Now, next and later. Every line links to its issue. The detailed queue and the
reasons behind it live in the project's planning doc; this file is the short
public version. Last checked against `main` on Nov 21, 2026.

The order follows one finding from the Nov 2026 audit: the plumbing is ahead
of the content. A public shelf has a median of 6 items and most items have no
note. So the roadmap favours work that makes each shelf worth reading and
sharing over work that adds new ways to be found.

## Now

Trust and the basics.

- Privacy and Terms pages: [#305](https://github.com/arielwernick/virtual_bookshelf/issues/305) (drafted; needs the owner's read and details; blocks the welcome email)
- Sign-in on Better Auth: [#264](https://github.com/arielwernick/virtual_bookshelf/issues/264) to [#267](https://github.com/arielwernick/virtual_bookshelf/issues/267) are done and live. Left: password reset, verification and welcome emails ([#268](https://github.com/arielwernick/virtual_bookshelf/issues/268)), then removing the old sign-in code ([#269](https://github.com/arielwernick/virtual_bookshelf/issues/269))
- Three shelf visibility levels: [#263](https://github.com/arielwernick/virtual_bookshelf/issues/263)
- Talk to real users: what makes a shelf worth coming back to? (needs the owner; no code)
- End-to-end tests an agent can run alone: [#147](https://github.com/arielwernick/virtual_bookshelf/issues/147) (mock mode, [#275](https://github.com/arielwernick/virtual_bookshelf/issues/275), is done)

## Next

Make each shelf worth citing, and make sharing pay back.

- View counts on public shelves: [#68](https://github.com/arielwernick/virtual_bookshelf/issues/68) (owners already see theirs)
- Shelves as time capsules: mark a shelf as a dated snapshot ("Summer 2026") or as "what I'm into this week" (not ticketed yet)
- A `/guides` section, with embed recipes per host: [#259](https://github.com/arielwernick/virtual_bookshelf/issues/259)

## Later

Worth doing once there are more shelves.

- Per-work pages, "shelves featuring this book": [#294](https://github.com/arielwernick/virtual_bookshelf/issues/294)
- Paste a list before signing up, the rest of [#295](https://github.com/arielwernick/virtual_bookshelf/issues/295): show the waiting shelf on the sign-up page ([#309](https://github.com/arielwernick/virtual_bookshelf/issues/309)) and accept plain titles with no links ([#307](https://github.com/arielwernick/virtual_bookshelf/issues/307))
- An SEO agent, then a PM agent. Each gets written test cases before it is built, and drafts only

## Shipped in November 2026

- The Nov 2026 audit work, merged in one pull request on Nov 16: valid structured data ([#283](https://github.com/arielwernick/virtual_bookshelf/issues/283)), real 404s and sitemap cleanup ([#284](https://github.com/arielwernick/virtual_bookshelf/issues/284)), every public shelf as Markdown, JSON and JSON Feed ([#285](https://github.com/arielwernick/virtual_bookshelf/issues/285)), oEmbed ([#286](https://github.com/arielwernick/virtual_bookshelf/issues/286)), tracked "make your own" links ([#287](https://github.com/arielwernick/virtual_bookshelf/issues/287)), canonical identifiers on items ([#288](https://github.com/arielwernick/virtual_bookshelf/issues/288)), account export ([#289](https://github.com/arielwernick/virtual_bookshelf/issues/289)), the agent harness ([#290](https://github.com/arielwernick/virtual_bookshelf/issues/290)), the delivery process ([#291](https://github.com/arielwernick/virtual_bookshelf/issues/291)), keep adding and publish from the edit page ([#292](https://github.com/arielwernick/virtual_bookshelf/issues/292)), full notes on shelf pages ([#293](https://github.com/arielwernick/virtual_bookshelf/issues/293)), one URL rule for item writes ([#296](https://github.com/arielwernick/virtual_bookshelf/issues/296)) and mock mode for outside APIs ([#275](https://github.com/arielwernick/virtual_bookshelf/issues/275))
- Paste a list, see it as a shelf, save it after sign-up: the first part of [#295](https://github.com/arielwernick/virtual_bookshelf/issues/295), with [#308](https://github.com/arielwernick/virtual_bookshelf/issues/308) and [#310](https://github.com/arielwernick/virtual_bookshelf/issues/310)
- Sign-in on Better Auth and the Resend email helper: [#264](https://github.com/arielwernick/virtual_bookshelf/issues/264) to [#267](https://github.com/arielwernick/virtual_bookshelf/issues/267)

## Recommended against

These are the audit reviewers' recommendations, not decisions. The owner has
not ruled on them.

- A social graph: follows, likes, a discover feed. It fights the "coffee table, not a portfolio" positioning and would look empty.
- More "alternative to" landing pages.
- Recommendations by AI, real-time collaboration, federation, a native app.

## Open

- PDF uploads as an item type. Planned, with an open question about whether people want it.
- A founder blog at `/blog` beside `/guides`, for the origin and build stories.
