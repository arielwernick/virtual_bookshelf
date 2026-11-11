# Roadmap

Now, next and later. Every line links to its issue. The detailed queue and the
reasons behind it live in the project's planning doc; this file is the short
public version.

The order follows one finding from the Nov 2026 audit: the plumbing is ahead
of the content. A public shelf has a median of 6 items and most items have no
note. So the roadmap favours work that makes each shelf worth reading and
sharing over work that adds new ways to be found.

## Now

Trust and the basics.

- Privacy and Terms pages (needs the owner; blocks every email feature)
- Sign-in on Better Auth with email verification and password reset: [#264](https://github.com/arielwernick/virtual_bookshelf/issues/264) to [#269](https://github.com/arielwernick/virtual_bookshelf/issues/269)
- Three shelf visibility levels: [#263](https://github.com/arielwernick/virtual_bookshelf/issues/263)
- End-to-end tests an agent can run alone: [#147](https://github.com/arielwernick/virtual_bookshelf/issues/147), [#275](https://github.com/arielwernick/virtual_bookshelf/issues/275)

## Next

Make each shelf worth citing, and make sharing pay back.

- Keep adding after the first item, ask for a note, publish from the edit page: [#292](https://github.com/arielwernick/virtual_bookshelf/issues/292)
- Full notes in the page, heading order, an updated date: [#293](https://github.com/arielwernick/virtual_bookshelf/issues/293)
- Show owners their own view counts: [#68](https://github.com/arielwernick/virtual_bookshelf/issues/68)
- A `/guides` section, with embed recipes per host: [#259](https://github.com/arielwernick/virtual_bookshelf/issues/259)

## Later

Worth doing once there are more shelves.

- Per-work pages, "shelves featuring this book": [#294](https://github.com/arielwernick/virtual_bookshelf/issues/294)
- Paste a list and get a shelf before signing up: [#295](https://github.com/arielwernick/virtual_bookshelf/issues/295)
- An SEO agent, then a PM agent. Each gets written test cases before it is built, and drafts only

## Landed on the `next` branch, waiting to be promoted

See `docs/process/INTEGRATION_BRANCH.md` for how promotion works.

- Valid structured data, notes as reviews: [#283](https://github.com/arielwernick/virtual_bookshelf/issues/283)
- Real 404s, sitemap cleanup, robots: [#284](https://github.com/arielwernick/virtual_bookshelf/issues/284)
- Every public shelf as Markdown, JSON and JSON Feed: [#285](https://github.com/arielwernick/virtual_bookshelf/issues/285)
- oEmbed: [#286](https://github.com/arielwernick/virtual_bookshelf/issues/286)
- Tracked "make your own" links: [#287](https://github.com/arielwernick/virtual_bookshelf/issues/287)
- Canonical identifiers on items: [#288](https://github.com/arielwernick/virtual_bookshelf/issues/288)
- Account export: [#289](https://github.com/arielwernick/virtual_bookshelf/issues/289)
- Agent harness: [#290](https://github.com/arielwernick/virtual_bookshelf/issues/290)
- Delivery process: [#291](https://github.com/arielwernick/virtual_bookshelf/issues/291)

## Not doing

- A social graph: follows, likes, a discover feed. It fights the "coffee table, not a portfolio" positioning and would look empty.
- More "alternative to" landing pages.
- Recommendations by AI, real-time collaboration, federation, a native app.
- More item types.
