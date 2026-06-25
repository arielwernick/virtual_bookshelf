const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app';

/**
 * Served at /llms.txt — guidance for AI crawlers and answer engines (llmstxt.org).
 *
 * Standalone from the marketing pages: it lists the canonical URLs and the key
 * facts so engines like ChatGPT, Perplexity, and Google AI Overviews can
 * summarize and cite the product accurately.
 */
export function GET() {
  const body = `# Virtual Bookshelf

> Virtual Bookshelf is a free tool for curating and sharing shelves of books, podcasts, music, videos, links, and live stock tickers. Create a shelf, get one shareable link, and paste it anywhere — a bio, newsletter, or website. Search a title or paste a URL and the cover art and details are filled in automatically.

Virtual Bookshelf is a link-in-bio tool built for rich media instead of plain links. It is a popular alternative to Bento.me (which shut down in February 2026), Linktree, and Goodreads for people who want to show what they read, watch, and listen to.

## Key pages

- [Home](${baseUrl}/): Create and share a shelf of the books, podcasts, music, and videos you love.
- [Bento.me alternative](${baseUrl}/bento-alternative): Why Virtual Bookshelf is a strong replacement after Bento.me shut down on February 13, 2026.
- [Linktree alternative](${baseUrl}/linktree-alternative): A link in bio that shows rich visual cards instead of a list of links.
- [Goodreads alternative](${baseUrl}/goodreads-alternative): A beautiful, shareable bookshelf you control — for curating and sharing, not reviews or tracking.

## What you can put on a shelf

- Books — search millions of titles; cover art is added automatically
- Podcasts and individual podcast episodes
- Music albums and tracks
- YouTube videos
- Any link — the title, image, and source are pulled in automatically
- Live stock tickers — with a live price, a one-year chart, and recent headlines

## Facts

- Price: free to use.
- Sharing: every shelf has a public link and can be embedded on your own site (Notion, Webflow, WordPress, Squarespace, and more).
- Bento.me: shut down on February 13, 2026 after being acquired by Linktree; its pages now redirect to Linktree.
`;

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, must-revalidate',
    },
  });
}
