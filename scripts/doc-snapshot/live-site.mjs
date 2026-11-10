#!/usr/bin/env node
/**
 * Read-only snapshot of the live site for the "Live site" tab of the
 * project's Claude Doc.
 *
 * - Visits public pages only: no sign-ins, no form submissions.
 * - Uses Playwright's default headless user agent ("HeadlessChrome"), which
 *   app/api/views/route.ts treats as a bot. As a second guard, every request
 *   to /api/views is aborted, so no view is ever counted.
 * - Reads only what any visitor can see on public shelves.
 *
 * Usage:
 *   node scripts/doc-snapshot/live-site.mjs [--out DIR] [--base URL] [--commit SHA]
 *
 * Writes DIR/live-site.json (facts) and DIR/live-site.md (the tab, as
 * markdown with a `<?claude block asof?>` date-chip token).
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = parseArgs(process.argv.slice(2));
const BASE = (args.base || 'https://virtualbookshelf.app').replace(/\/$/, '');
const OUT = args.out || path.join(os.homedir(), '.cache', 'vb-doc-snapshot', 'out');
const COMMIT = args.commit || '';
const CONCURRENCY = 4;

// Routes that should exist (or that we track as missing) beyond the sitemap.
const PROBE_ROUTES = ['/about', '/why', '/privacy', '/terms', '/guides', '/blog', '/claude', '/import'];
const CRAWLER_FILES = ['/sitemap.xml', '/robots.txt', '/llms.txt'];

/** YYYY-MM-DD in the machine's time zone (the doc's dates are local). */
function localDate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[i + 1]?.startsWith('--') ? true : argv[++i];
  }
  return out;
}

/** Newest installed headless shell / chromium, for when the pinned revision is missing. */
function findInstalledChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const cache = path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright');
  const linuxCache = path.join(os.homedir(), '.cache', 'ms-playwright');
  const dir = fs.existsSync(cache) ? cache : linuxCache;
  if (!fs.existsSync(dir)) return undefined;
  const candidates = fs
    .readdirSync(dir)
    .filter((d) => /^chromium(_headless_shell)?-\d+$/.test(d))
    .sort((a, b) => Number(b.split('-').pop()) - Number(a.split('-').pop()));
  for (const d of candidates) {
    for (const rel of [
      'chrome-headless-shell-mac-arm64/chrome-headless-shell',
      'chrome-headless-shell-mac-x64/chrome-headless-shell',
      'chrome-headless-shell-linux64/chrome-headless-shell',
      'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
      'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
      'chrome-linux64/chrome',
    ]) {
      const p = path.join(dir, d, rel);
      if (fs.existsSync(p)) return p;
    }
  }
  return undefined;
}

async function launch() {
  try {
    return await chromium.launch({ headless: true });
  } catch (err) {
    const executablePath = findInstalledChromium();
    if (!executablePath) throw err;
    console.error(`Pinned browser missing; using ${executablePath}`);
    return chromium.launch({ headless: true, executablePath });
  }
}

async function newGuardedPage(context) {
  const page = await context.newPage();
  // Never let a view beacon through, whatever the user agent.
  await page.route('**/api/views**', (route) => route.abort());
  return page;
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    })
  );
  return results;
}

async function routeStatus(request, url) {
  try {
    const res = await request.get(url, { maxRedirects: 0, timeout: 30000 });
    const status = res.status();
    const location = res.headers()['location'];
    return { status, location: location || null };
  } catch (err) {
    return { status: 0, error: String(err.message || err).split('\n')[0] };
  }
}

async function readHomepage(context) {
  const page = await newGuardedPage(context);
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
  const data = await page.evaluate(() => {
    const text = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim();
    const h1 = document.querySelector('h1');
    // Subhead: the first paragraph after the headline, inside the hero.
    let subhead = '';
    if (h1) {
      const hero = h1.closest('section') || h1.parentElement;
      const p = hero?.querySelector('p');
      subhead = text(p);
    }
    const hero = h1?.closest('section') || document.body;
    const buttons = [...hero.querySelectorAll('a, button')]
      .map((el) => text(el))
      .filter((t) => t && t.length < 40);
    const sections = [...document.querySelectorAll('main h2, body > h2, section h2')].map(text).filter(Boolean);
    const footer = document.querySelector('footer');
    const footerLinks = footer ? [...footer.querySelectorAll('a')].map((a) => text(a) || a.getAttribute('aria-label') || a.href) : [];
    const bodyText = document.body.innerText;
    return {
      title: document.title,
      metaDescription: document.querySelector('meta[name="description"]')?.content || '',
      headline: text(h1),
      subhead,
      buttons: [...new Set(buttons)],
      sections: [...new Set(sections)],
      footerLinks: [...new Set(footerLinks)],
      stockMentions: (bodyText.match(/\b(stocks?|tickers?)\b/gi) || []).length,
      madeMentions: (bodyText.match(/\b(you(?:'|’)ve made|you made|your work|things you make)\b/gi) || []).length,
      hasEmbedIframe: Boolean(document.querySelector('iframe[src*="/embed/"]')),
    };
  });
  await page.close();
  return data;
}

async function hasOverflow(context, url) {
  const page = await newGuardedPage(context);
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    return await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  } finally {
    await page.close();
  }
}

async function hasLiveEmbed(context, url) {
  const page = await newGuardedPage(context);
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    return await page.evaluate(() => Boolean(document.querySelector('iframe[src*="/embed/"]')));
  } finally {
    await page.close();
  }
}

async function readShelf(context, url) {
  const page = await newGuardedPage(context);
  const failedImages = new Set();
  page.on('response', (res) => {
    if (res.request().resourceType() === 'image' && res.status() >= 400) failedImages.add(res.url());
  });
  page.on('requestfailed', (req) => {
    if (req.resourceType() === 'image') failedImages.add(req.url());
  });
  try {
    const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    // Let lazy images below the fold load.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 800) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 100));
      }
    });
    await page.waitForLoadState('networkidle').catch(() => {});
    const data = await page.evaluate(() => {
      const items = [...document.querySelectorAll('article[data-item-type]')];
      const types = {};
      let withNote = 0;
      for (const a of items) {
        const t = a.getAttribute('data-item-type');
        types[t] = (types[t] || 0) + 1;
        // The note sits in a bordered block below the title; star ratings
        // share the icon size class, so count the note's text instead.
        const note = a.querySelector('div.border-t p');
        if (note && note.textContent.trim()) withNote++;
      }
      const brokenInDom = [...document.querySelectorAll('article[data-item-type] img')].filter(
        (img) => img.complete && img.naturalWidth === 0
      ).length;
      const cta = [...document.querySelectorAll('a')].find((a) => /create my own shelf/i.test(a.textContent || ''));
      const desc = document.querySelector('header div.border-t > p');
      return {
        name: (document.querySelector('h1')?.textContent || '').trim(),
        items: items.length,
        types,
        withNote,
        brokenInDom,
        ctaHref: cta ? new URL(cta.href).pathname : null,
        hasDescription: Boolean(desc && desc.textContent.trim()),
      };
    });
    return { url, status: res?.status() ?? 0, ...data, failedImages: failedImages.size };
  } catch (err) {
    return { url, status: 0, error: String(err.message || err).split('\n')[0] };
  } finally {
    await page.close();
  }
}

function median(nums) {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const TYPE_LABEL = {
  book: 'Book',
  podcast: 'Podcast',
  podcast_episode: 'Podcast episode',
  music: 'Music',
  video: 'Video',
  link: 'Link',
  stock: 'Stock',
};

function code(s) {
  return '`' + s + '`';
}

function cell(s) {
  return String(s ?? '').replace(/([\\|<>])/g, '\\$1').replace(/\n/g, ' ');
}

function toMarkdown(f) {
  const L = [];
  const commitPart = f.commit ? ` at commit ${code(f.commit)}` : '';
  L.push('# Live site', '');
  L.push(`<?claude block asof?> · Read-only Playwright run on virtualbookshelf.app, ${code('main')}${commitPart}`, '');
  L.push(
    `${f.shelves.count} public shelves hold ${f.shelves.items} items. ` +
      `${f.missingRoutes.length ? `${f.missingRoutes.length} tracked pages still return 404.` : 'Every tracked page responds.'} ` +
      'This tab is a snapshot that a cron replaces each week, so keep plans and opinions in Plan and notes.',
    ''
  );

  L.push('## Homepage copy', '', '| Element | What it says now |', '| --- | --- |');
  const h = f.homepage;
  L.push(`| Page title | ${cell(h.title)} |`);
  L.push(`| Headline | ${cell(h.headline)} |`);
  L.push(`| Subhead | ${cell(h.subhead)} |`);
  L.push(`| Meta description | ${cell(h.metaDescription)} |`);
  L.push(`| Buttons | ${cell(h.buttons.join('; '))} |`);
  L.push(`| Sections | ${cell(h.sections.join('; '))} |`);
  L.push(`| Footer links | ${cell(h.footerLinks.join('; ') || 'None')} |`, '');
  L.push(
    `Stocks or tickers appear ${h.stockMentions} times in the page text. ` +
      `${h.hasEmbedIframe ? 'The homepage has a live shelf embed.' : 'The homepage has no live shelf embed.'}`,
    ''
  );

  const s = f.shelves;
  L.push('## Public shelves', '', '| Measure | Value |', '| --- | --- |');
  L.push(`| Public shelves | ${s.count} |`);
  L.push(`| Items | ${s.items} |`);
  L.push(`| Median items per shelf | ${s.median} |`);
  L.push(`| Largest shelf | ${s.largest} items |`);
  L.push(`| Shelves with 3 items or fewer | ${s.small} |`);
  L.push(`| Shelves with 10 items or more | ${s.large} |`);
  L.push(`| Shelves with a description | ${s.withDescription} |`);
  L.push(`| Items with a note | ${s.withNote}, on ${s.shelvesWithNotes} shelves |`);
  if (s.errors) L.push(`| Shelves that failed to load | ${s.errors} |`);
  L.push('');

  L.push('## Items by type', '', '| Type | Items | Share |', '| --- | --- | --- |');
  for (const [t, n] of Object.entries(s.types).sort((a, b) => b[1] - a[1])) {
    L.push(`| ${TYPE_LABEL[t] || t} | ${n} | ${s.items ? Math.round((n / s.items) * 100) : 0}% |`);
  }
  L.push('');
  if (s.largestShare >= 0.25) {
    L.push(`The largest shelf holds ${s.largest} items, ${Math.round(s.largestShare * 100)}% of all public items, so it skews the type mix.`, '');
  }

  L.push('## Routes', '', '| Route | Status |', '| --- | --- |');
  for (const r of f.routes) {
    const st = r.status === 0 ? `Error: ${r.error}` : r.location ? `${r.status} → ${code(r.location)}` : String(r.status);
    L.push(`| ${code(r.path)} | ${cell(st)} |`);
  }
  L.push('');

  L.push('## Search and AI files', '', '| Check | Result |', '| --- | --- |');
  const sm = f.sitemap;
  const others = sm.total - sm.shelves - sm.videos;
  L.push(`| ${code('sitemap.xml')} | ${sm.total} URLs: ${sm.shelves} shelves, ${sm.videos} video pages and ${others} others |`);
  L.push(`| ${code('robots.txt')} | ${f.robots.disallow.length ? 'Blocks ' + f.robots.disallow.map(code).join(', ') : 'Blocks nothing'} |`);
  L.push(`| ${code('llms.txt')} | ${f.llms.status === 200 ? `${f.llms.links} links` : `Returns ${f.llms.status}`} |`, '');

  L.push('## Other checks', '');
  const ctaOk = s.ctaTargets;
  L.push(
    `- **Shelf button:** "Create My Own Shelf" goes to ${Object.entries(ctaOk)
      .map(([href, n]) => `${code(href)} on ${n} shelves`)
      .join(', ') || 'nowhere (not found)'}.`
  );
  L.push(
    `- **Broken images:** ${s.brokenImages} ${s.brokenImages === 1 ? 'image fails' : 'images fail'} across ${s.shelvesWithBroken} ${s.shelvesWithBroken === 1 ? 'shelf' : 'shelves'}, and ${s.brokenImages === 1 ? 'shows' : 'show'} the fallback icon.`
  );
  const overflowing = f.mobile.filter((m) => m.overflow).map((m) => code(m.path));
  L.push(
    `- **Mobile:** ${overflowing.length ? `${overflowing.join(', ')} scroll sideways at phone width` : `no sideways scrolling at phone width on the ${f.mobile.length} pages checked`}.`
  );
  L.push(`- **Embed demo:** ${code('/embed-anywhere')} ${f.embedAnywhereLive ? 'has a' : 'has no'} live shelf embed.`, '');

  L.push('## Not checked', '');
  L.push(
    'Anything behind sign-in, including the dashboard, adding items and sharing. Private shelves and real user behavior aren\'t visible either.'
  );
  return L.join('\n') + '\n';
}

async function main() {
  const startedAt = new Date();
  const browser = await launch();
  const context = await browser.newContext(); // default headless UA
  const request = context.request;

  // Sitemap
  const smRes = await request.get(BASE + '/sitemap.xml');
  const smXml = await smRes.text();
  const urls = [...smXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  const shelfUrls = urls.filter((u) => /\/s\/[^/]+$/.test(u)).map((u) => BASE + new URL(u).pathname);
  const videoCount = urls.filter((u) => /\/v\/[^/]+$/.test(u)).length;
  const otherPaths = urls
    .map((u) => new URL(u).pathname)
    .filter((p) => !p.startsWith('/s/') && !p.startsWith('/v/'));

  // robots / llms
  const robotsText = await (await request.get(BASE + '/robots.txt')).text();
  const disallow = [...new Set([...robotsText.matchAll(/^Disallow:\s*(\S+)/gim)].map((m) => m[1]))];
  const llmsRes = await request.get(BASE + '/llms.txt');
  const llmsText = llmsRes.status() === 200 ? await llmsRes.text() : '';
  const llmsLinks = (llmsText.match(/\]\(https?:[^)]+\)/g) || []).length;

  // Routes
  const routePaths = [...new Set([...otherPaths, ...PROBE_ROUTES, ...CRAWLER_FILES])];
  const routes = await mapLimit(routePaths, CONCURRENCY, async (p) => ({ path: p, ...(await routeStatus(request, BASE + p)) }));
  routes.sort((a, b) => a.path.localeCompare(b.path));

  // Homepage
  const homepage = await readHomepage(context);
  const embedAnywhereLive = otherPaths.includes('/embed-anywhere')
    ? await hasLiveEmbed(context, BASE + '/embed-anywhere')
    : false;

  // Shelves
  const shelves = await mapLimit(shelfUrls, CONCURRENCY, (u) => readShelf(context, u));
  const ok = shelves.filter((s) => !s.error && s.status === 200);
  const types = {};
  for (const s of ok) for (const [t, n] of Object.entries(s.types)) types[t] = (types[t] || 0) + n;
  const counts = ok.map((s) => s.items);
  const totalItems = counts.reduce((a, b) => a + b, 0);
  const ctaTargets = {};
  for (const s of ok) if (s.ctaHref) ctaTargets[s.ctaHref] = (ctaTargets[s.ctaHref] || 0) + 1;
  const broken = ok.map((s) => Math.max(s.failedImages, s.brokenInDom));

  // Mobile overflow at phone width
  const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const mobilePaths = ['/', ...otherPaths.filter((p) => p !== '/' && !['/login', '/signup'].includes(p)), ...(shelfUrls[0] ? [new URL(shelfUrls[0]).pathname] : [])];
  const mobile = await mapLimit(mobilePaths, CONCURRENCY, async (p) => ({
    path: p.startsWith('/s/') ? '/s/[shareToken]' : p,
    overflow: await hasOverflow(mobileCtx, BASE + p).catch(() => null),
  }));
  await mobileCtx.close();
  await browser.close();

  const facts = {
    date: localDate(startedAt),
    generatedAt: startedAt.toISOString(),
    base: BASE,
    commit: COMMIT,
    homepage,
    shelves: {
      count: ok.length,
      errors: shelves.length - ok.length,
      items: totalItems,
      median: median(counts),
      largest: Math.max(0, ...counts),
      largestShare: totalItems ? Math.max(0, ...counts) / totalItems : 0,
      small: counts.filter((n) => n <= 3).length,
      large: counts.filter((n) => n >= 10).length,
      withDescription: ok.filter((s) => s.hasDescription).length,
      withNote: ok.reduce((a, s) => a + s.withNote, 0),
      shelvesWithNotes: ok.filter((s) => s.withNote > 0).length,
      types,
      ctaTargets,
      brokenImages: broken.reduce((a, b) => a + b, 0),
      shelvesWithBroken: broken.filter((n) => n > 0).length,
    },
    routes,
    missingRoutes: routes.filter((r) => r.status === 404).map((r) => r.path),
    sitemap: { total: urls.length, shelves: shelfUrls.length, videos: videoCount, others: otherPaths },
    robots: { disallow },
    llms: { status: llmsRes.status(), links: llmsLinks },
    mobile,
    embedAnywhereLive,
  };

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'live-site.json'), JSON.stringify(facts, null, 2));
  fs.writeFileSync(path.join(OUT, 'live-site.md'), toMarkdown(facts));
  console.log(`Wrote ${path.join(OUT, 'live-site.json')} and live-site.md`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
