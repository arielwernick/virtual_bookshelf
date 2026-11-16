import { getPublicShelves } from '@/lib/db/queries';
import { buildShelfUrls, getBaseUrl } from '@/lib/shelf/publicShelf';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('LlmsTxt');

// Reads the list of public shelves, so it cannot be built ahead of time.
export const dynamic = 'force-dynamic';

/** Keep the file small enough to read in one go; the sitemap has every shelf. */
const MAX_SHELVES = 100;

/**
 * Text that would break a Markdown link label is dropped from shelf names.
 */
function linkLabel(name: string): string {
  return name.replace(/[\[\]\r\n]/g, ' ').replace(/\s+/g, ' ').trim() || 'Untitled shelf';
}

export function buildLlmsTxt(
  baseUrl: string,
  shelves: { share_token: string; name: string; updated_at: Date }[]
): string {
  const shelfLines = shelves.slice(0, MAX_SHELVES).map((shelf) => {
    const { markdown } = buildShelfUrls(shelf.name, shelf.share_token, baseUrl);
    return `- [${linkLabel(shelf.name)}](${markdown}): updated ${new Date(shelf.updated_at)
      .toISOString()
      .slice(0, 10)}`;
  });

  const shelfSection =
    shelfLines.length > 0
      ? `## Public shelves

Each link is the Markdown version of a shelf that its owner chose to publish. Notes on items are the curator's own words.

${shelfLines.join('\n')}
`
      : '';

  return `# Virtual Bookshelf

> Virtual Bookshelf is a free tool for building small shelves of what you love and what you've made: books, podcasts, music, videos and links. Each shelf can be shared with one link or embedded on your own site. Think of it as the online version of the shelf or coffee table in your living room.

Search for a title or paste a URL and the cover art and details are filled in. Owners can add a short note to each item saying why it is there. Shelves start private and are only public when the owner publishes them. Shelf owners are not named on public pages.

## Reading a shelf

Every public shelf is available in four forms. Add the suffix to the shelf URL:

- \`/s/<shelf>\`: the web page, with schema.org structured data
- \`/s/<shelf>/shelf.md\`: Markdown, the easiest form for an assistant to read and quote
- \`/s/<shelf>/shelf.json\`: the full shelf as JSON
- \`/s/<shelf>/feed.json\`: JSON Feed 1.1, newest item first, for following a shelf

When citing a shelf, link to the web page.

${shelfSection}
## Building a shelf with an assistant

Virtual Bookshelf has a connector (a Model Context Protocol server) so that signed-in users can create shelves and add items from an AI assistant.

- Connector endpoint: ${baseUrl}/api/mcp/mcp

## Key pages

- [Home](${baseUrl}/): Create and share a shelf.
- [Embed anywhere](${baseUrl}/embed-anywhere): Embed a live, clickable shelf on a website or in a newsletter with one snippet.
- [Curate conference resources](${baseUrl}/curate-conference-resources): Turn a talk's reading list into a shareable shelf.
- [Goodreads alternative](${baseUrl}/goodreads-alternative): For curating and sharing a shelf, not for tracking or reviews.
- [Linktree alternative](${baseUrl}/linktree-alternative): Rich visual cards instead of a list of links.
- [Bento.me alternative](${baseUrl}/bento-alternative): For people moving on after Bento.me shut down on February 13, 2026.

## What you can put on a shelf

- Books: search by title; cover art is added automatically
- Podcasts and individual podcast episodes
- Music albums and tracks
- YouTube videos
- Any link: the title, image and source are pulled in automatically
- Stock tickers

## Facts

- Price: free.
- Sharing: a published shelf has a public link and can be embedded on other sites (Notion, Webflow, WordPress, Squarespace and more).
- Privacy: shelves are private until published; owners are not named on public pages.
- Source code: https://github.com/arielwernick/virtual_bookshelf
`;
}

/**
 * Served at /llms.txt — guidance for AI crawlers and answer engines (llmstxt.org).
 *
 * Lists the real public shelves (issue #285), because answer engines cite
 * content, not product descriptions. If the database is unavailable the file
 * is still served, without the shelf list.
 */
export async function GET() {
  let shelves: { share_token: string; name: string; updated_at: Date }[] = [];
  try {
    shelves = await getPublicShelves();
  } catch (error) {
    logger.errorWithException('Could not list public shelves for llms.txt', error);
  }

  return new Response(buildLlmsTxt(getBaseUrl(), shelves), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, must-revalidate',
    },
  });
}
