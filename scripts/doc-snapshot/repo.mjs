#!/usr/bin/env node
/**
 * Repo snapshot for the "Codebase" tab of the project's Claude Doc.
 *
 * Reads code from a git ref (default origin/main, after a fetch) without
 * checking it out, and issues/PRs from GitHub through the `gh` CLI.
 * Read-only: it never writes to git or GitHub.
 *
 * Usage:
 *   node scripts/doc-snapshot/repo.mjs [--out DIR] [--ref origin/main] [--no-fetch]
 *        [--plan-issues 263,264,...]
 *
 *   --plan-issues  Issue numbers linked from the Plan and notes tab. Each is
 *                  looked up, so the caller can tick items whose issue closed.
 *
 * Writes DIR/repo.json (facts) and DIR/codebase.md: the generated part of
 * the tab, as markdown with a `<?claude block asof?>` date-chip token. The
 * tab's "Notes kept by hand" section is written by people and is never
 * generated here.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = parseArgs(process.argv.slice(2));
const REF = args.ref || 'origin/main';
const OUT = args.out || path.join(os.homedir(), '.cache', 'vb-doc-snapshot', 'out');
const REPO_SLUG = 'arielwernick/virtual_bookshelf';
const GH_URL = `https://github.com/${REPO_SLUG}`;

/** YYYY-MM-DD in the machine's time zone (the doc's dates are local). */
function localDate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    if (key.startsWith('no-')) out[key.slice(3)] = false;
    else out[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return out;
}

function sh(cmd, cmdArgs, opts = {}) {
  return execFileSync(cmd, cmdArgs, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
}
const git = (...a) => sh('git', a);
const show = (file) => git('show', `${REF}:${file}`);
const gh = (...a) => JSON.parse(sh('gh', a));

// ---------------------------------------------------------------------------
// Code facts from the ref
// ---------------------------------------------------------------------------

const PAGE_INFO = {
  '/': ['Homepage', 'Public'],
  '/bento-alternative': ['Competitor comparison page', 'Public'],
  '/linktree-alternative': ['Competitor comparison page', 'Public'],
  '/goodreads-alternative': ['Competitor comparison page', 'Public'],
  '/embed-anywhere': ['Use-case landing page', 'Public'],
  '/curate-conference-resources': ['Use-case landing page', 'Public'],
  '/s/[shareToken]': ['Published shelf, rendered on the server', 'Public'],
  '/embed/[shareToken]': ['Embeddable shelf with theme, background and accent options', 'Public, kept out of search'],
  '/v/[videoId]': ['Watch page for a video on a public shelf', 'Public'],
  '/signup': ['Sign up', 'Public'],
  '/login': ['Sign in', 'Public'],
  '/dashboard': ['Managing shelves', 'Signed in'],
  '/shelf/[shelfId]': ['Shelf view, with sharing and editing controls for the owner', 'Owner; others can view public shelves'],
  '/shelf/[shelfId]/edit': ['Editing a shelf', 'Signed in'],
  '/import': ['Paste text with links to create a shelf', 'Public page'],
  '/admin': ['Signup and attribution dashboard, limited by `ADMIN_EMAILS`', 'Admin'],
  '/oauth/authorize': ['Approves connections from AI clients', 'Signed in'],
  '/sitemap.xml': ['Crawler file', 'Public'],
  '/robots.txt': ['Crawler file', 'Public'],
  '/llms.txt': ['Crawler file', 'Public'],
  '/guides': ['Guides index', 'Public'],
  '/guides/[slug]': ['A guide', 'Public'],
  '/claude': ['Claude connector page', 'Public'],
  '/.well-known/oauth-authorization-server': ['OAuth discovery for AI clients', 'Machines'],
  '/.well-known/oauth-protected-resource/[[...path]]': ['OAuth discovery for AI clients', 'Machines'],
};

/** App Router file path → URL path ("app/(group)/s/[x]/page.tsx" → "/s/[x]"). */
function routeFromFile(file) {
  const parts = file.replace(/^app\//, '').split('/').slice(0, -1);
  const segs = parts.filter((p) => !/^\(.*\)$/.test(p) && !p.startsWith('@'));
  return '/' + segs.join('/');
}

function readRoutes(files) {
  const pages = files
    .filter((f) => /^app\/.*page\.(tsx|ts|jsx|js|mdx)$/.test(f) || /^app\/page\.(tsx|ts)$/.test(f))
    .map(routeFromFile);
  // Metadata routes (sitemap.ts, robots.ts) and non-API route handlers (llms.txt/route.ts)
  for (const f of files) {
    if (/^app\/(sitemap|robots|manifest)\.(ts|tsx|js)$/.test(f)) pages.push('/' + path.basename(f).replace(/\.(ts|tsx|js)$/, f.includes('manifest') ? '.webmanifest' : '.xml').replace('robots.xml', 'robots.txt'));
    if (/^app\/(?!api\/).*route\.(ts|js)$/.test(f)) pages.push(routeFromFile(f));
  }
  const api = [];
  for (const f of files.filter((f) => /^app\/api\/.*route\.(ts|js)$/.test(f))) {
    const src = show(f);
    const methods = [...src.matchAll(/export\s+(?:async\s+)?(?:function|const)\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g)].map((m) => m[1]);
    const reexports = [...src.matchAll(/export\s*\{([^}]*)\}/g)].flatMap((m) => m[1].split(',').map((s) => s.trim().split(/\s+as\s+/).pop())).filter((s) => /^(GET|POST|PUT|PATCH|DELETE)$/.test(s));
    api.push({ path: routeFromFile(f), methods: [...new Set([...methods, ...reexports])] });
  }
  api.sort((a, b) => a.path.localeCompare(b.path));
  return { pages: [...new Set(pages)].sort(), api };
}

/** Replay CREATE/ALTER/DROP statements from migrations/*.sql, in order. */
function readSchema(files) {
  const migrations = files.filter((f) => /^migrations\/\d+.*\.sql$/.test(f) && !f.endsWith('.down.sql')).sort();
  const tables = new Map();
  let itemTypes = [];
  for (const f of migrations) {
    const sql = show(f).replace(/--.*$/gm, '');
    for (const m of sql.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+"?(\w+)"?\s*\(([\s\S]*?)\n\);/gi)) {
      const cols = [];
      let depth = 0;
      let cur = '';
      for (const ch of m[2]) {
        if (ch === '(') depth++;
        if (ch === ')') depth--;
        if (ch === ',' && depth === 0) {
          cols.push(cur);
          cur = '';
        } else cur += ch;
      }
      cols.push(cur);
      const names = cols
        .map((c) => c.trim())
        .filter((c) => c && !/^(CONSTRAINT|PRIMARY|UNIQUE|CHECK|FOREIGN|EXCLUDE)\b/i.test(c))
        .map((c) => c.split(/\s+/)[0].replace(/"/g, ''));
      if (!tables.has(m[1])) tables.set(m[1], names);
    }
    for (const m of sql.matchAll(/ALTER TABLE(?: IF EXISTS)?\s+"?(\w+)"?\s+ADD COLUMN(?: IF NOT EXISTS)?\s+"?(\w+)"?/gi)) {
      const t = tables.get(m[1]) || [];
      if (!t.includes(m[2])) t.push(m[2]);
      tables.set(m[1], t);
    }
    for (const m of sql.matchAll(/ALTER TABLE(?: IF EXISTS)?\s+"?(\w+)"?\s+DROP COLUMN(?: IF EXISTS)?\s+"?(\w+)"?/gi)) {
      tables.set(m[1], (tables.get(m[1]) || []).filter((c) => c !== m[2]));
    }
    for (const m of sql.matchAll(/DROP TABLE(?: IF EXISTS)?\s+"?(\w+)"?/gi)) tables.delete(m[1]);
    // Latest CHECK on items.type wins.
    for (const m of sql.matchAll(/type\s+IN\s*\(([^)]*)\)/gi)) {
      const vals = [...m[1].matchAll(/'(\w+)'/g)].map((v) => v[1]);
      if (vals.includes('book')) itemTypes = vals;
    }
  }
  return {
    migrations: migrations.map((f) => path.basename(f)),
    tables: [...tables.entries()].map(([name, columns]) => ({ name, columns })),
    itemTypes,
  };
}

function readPackage() {
  const pkg = JSON.parse(show('package.json'));
  return { dependencies: pkg.dependencies || {}, devDependencies: pkg.devDependencies || {}, scripts: pkg.scripts || {} };
}

function readWorkflows(files) {
  return files
    .filter((f) => /^\.github\/workflows\/.*\.ya?ml$/.test(f))
    .map((f) => {
      const src = show(f);
      const name = (src.match(/^name:\s*(.+)$/m) || [])[1]?.replace(/['"]/g, '').trim() || path.basename(f);
      const on = (src.match(/^['"]?on['"]?:[ \t]*\n((?:[ \t]+.*\n|[ \t]*\n)*)/m) || [])[1] || '';
      const triggers = [...on.matchAll(/^\s{2}(\w+):/gm)].map((m) => m[1]);
      const inline = (src.match(/^on:\s*\[?([\w, ]+)\]?\s*$/m) || [])[1];
      return { file: path.basename(f), name, triggers: triggers.length ? triggers : inline ? inline.split(',').map((s) => s.trim()) : [] };
    });
}

// ---------------------------------------------------------------------------
// GitHub facts
// ---------------------------------------------------------------------------

function readGitHub() {
  const issues = gh('issue', 'list', '-R', REPO_SLUG, '--state', 'open', '--limit', '200', '--json', 'number,title,labels,updatedAt');
  const prs = gh('pr', 'list', '-R', REPO_SLUG, '--state', 'open', '--limit', '100', '--json', 'number,title,isDraft,author,updatedAt,baseRefName,headRefName,reviewDecision');
  const since = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);
  const merged = gh('pr', 'list', '-R', REPO_SLUG, '--state', 'merged', '--search', `merged:>=${since}`, '--limit', '50', '--json', 'number,title,mergedAt,closingIssuesReferences');
  const closed = gh('issue', 'list', '-R', REPO_SLUG, '--state', 'closed', '--search', `closed:>=${new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)}`, '--limit', '100', '--json', 'number,title,closedAt');
  return {
    recentlyClosedIssues: closed.map((i) => ({ number: i.number, title: i.title, closedAt: i.closedAt })).sort((a, b) => a.number - b.number),
    openIssues: issues.map((i) => ({ number: i.number, title: i.title, labels: i.labels.map((l) => l.name), updatedAt: i.updatedAt })),
    openPRs: prs.map((p) => ({
      number: p.number,
      title: p.title,
      draft: p.isDraft,
      bot: /dependabot/i.test(p.author?.login || ''),
      base: p.baseRefName,
      updatedAt: p.updatedAt,
      reviewDecision: p.reviewDecision || '',
    })),
    recentlyMerged: merged
      .map((p) => ({ number: p.number, title: p.title, mergedAt: p.mergedAt, closes: (p.closingIssuesReferences || []).map((c) => c.number) }))
      .sort((a, b) => b.mergedAt.localeCompare(a.mergedAt)),
  };
}

/** States of the issues linked from the Plan and notes tab. */
function readPlanIssues(list) {
  const nums = [...new Set(String(list).split(/[\s,]+/).map((n) => Number(n.replace('#', ''))).filter(Boolean))].sort((a, b) => a - b);
  const states = [];
  for (const n of nums) {
    try {
      const i = gh('issue', 'view', String(n), '-R', REPO_SLUG, '--json', 'number,state,title,closedAt');
      states.push({ number: i.number, state: i.state, title: i.title, closedAt: i.closedAt });
    } catch {
      states.push({ number: n, state: 'UNKNOWN' });
    }
  }
  return states;
}

// ---------------------------------------------------------------------------
// Markdown
// ---------------------------------------------------------------------------

const code = (s) => '`' + s + '`';
const cell = (s) => String(s ?? '').replace(/([\\|<>])/g, '\\$1').replace(/\n/g, ' ');
const major = (v) => (String(v).match(/\d+/) || [''])[0];

function stackRows(deps, dev) {
  const all = { ...deps, ...dev };
  const rows = [];
  const add = (layer, text) => text && rows.push([layer, text]);
  add('Framework', all.next && `Next.js ${major(all.next)} App Router, React ${major(all.react)}, TypeScript in strict mode`);
  add('Styling', all.tailwindcss || all['@tailwindcss/postcss'] ? `Tailwind CSS ${major(all.tailwindcss || all['@tailwindcss/postcss'])}` : '');
  add('Database', all['@neondatabase/serverless'] && 'Postgres on Neon, with hand-written SQL in `lib/db/queries.ts`');
  const auth = [];
  if (all['better-auth']) auth.push(`Better Auth ${major(all['better-auth'])}`);
  if (all.jose && all.bcryptjs) auth.push('Hand-written email and password (bcrypt) plus Google OAuth, with 7-day JWT cookies');
  add('Auth', auth.join('; '));
  add('Email', all.resend ? 'Resend' : '');
  add('Hosting', 'Vercel. `main` deploys to production');
  add('Drag and drop', all['@dnd-kit/core'] && 'dnd-kit');
  add('Charts', all['lightweight-charts'] && 'lightweight-charts, for stocks');
  add('Rate limiting', all['@upstash/ratelimit'] && 'Upstash Redis');
  add('Analytics', all['@vercel/analytics'] && 'Vercel Analytics');
  add('AI connector', all['mcp-handler'] && `MCP server via mcp-handler ${major(all['mcp-handler'])}`);
  return rows;
}

function pageGroup(route) {
  if (route.startsWith('/api')) return null;
  return route;
}

function toMarkdown(f) {
  const L = [];
  L.push('# Codebase', '');
  L.push(`<?claude block asof?> · ${code('main')} at commit ${code(f.commit)}`, '');
  L.push(
    `A Next.js app on Vercel with a Neon Postgres database: ${f.routes.pages.length} pages, ${f.routes.api.length} API routes, ` +
      `${f.schema.tables.length} tables and ${f.testFiles} test files. This tab is a snapshot that a cron replaces each day from ${code('origin/main')} and GitHub, so keep plans and opinions in Plan and notes. Everything above Notes kept by hand is generated.`,
    ''
  );

  L.push('## Stack', '', '| Layer | What\'s used |', '| --- | --- |');
  for (const [layer, text] of stackRows(f.packages.dependencies, f.packages.devDependencies)) L.push(`| ${layer} | ${cell(text)} |`);
  L.push(`| Tests | Vitest and Testing Library (${f.testFiles} test files), Playwright for end-to-end (${f.e2eFiles} specs) |`, '');

  L.push('## Pages', '', '| Route | What it is | Audience |', '| --- | --- | --- |');
  for (const r of f.routes.pages.map(pageGroup).filter(Boolean)) {
    const [what, who] = PAGE_INFO[r] || ['New since the last description; not described yet', ''];
    L.push(`| ${code(r)} | ${cell(what)} | ${cell(who)} |`);
  }
  L.push('');

  L.push('## API', '', '| Group | Routes |', '| --- | --- |');
  const groups = new Map();
  for (const r of f.routes.api) {
    const g = r.path.split('/')[2] || 'api';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(`${code(r.path.replace(/^\/api/, ''))}${r.methods.length ? ' ' + r.methods.join(', ') : ''}`);
  }
  for (const [g, list] of groups) L.push(`| ${code(g)} | ${cell(list.join('; '))} |`);
  L.push('');
  if (f.mcpTools.length) L.push(`The MCP connector has ${f.mcpTools.length} tools: ${f.mcpTools.map(code).join(', ')}.`, '');

  L.push('## Data', '', '| Table | Columns |', '| --- | --- |');
  for (const t of f.schema.tables) L.push(`| ${code(t.name)} | ${cell(t.columns.join(', '))} |`);
  L.push('');
  L.push(
    `Built from ${f.schema.migrations.length} migrations in ${code('migrations/')} (latest ${code(f.schema.migrations.at(-1) || 'none')}). ` +
      (f.schema.itemTypes.length ? `Item types allowed by the database: ${f.schema.itemTypes.map(code).join(', ')}.` : ''),
    ''
  );

  L.push('## Dependencies', '', '| Package | Version | Kind |', '| --- | --- | --- |');
  for (const [n, v] of Object.entries(f.packages.dependencies)) L.push(`| ${code(n)} | ${cell(v)} | Runtime |`);
  for (const [n, v] of Object.entries(f.packages.devDependencies)) L.push(`| ${code(n)} | ${cell(v)} | Dev |`);
  L.push('');

  L.push('## Automation', '', '| Workflow | Runs on |', '| --- | --- |');
  for (const w of f.workflows) L.push(`| ${cell(w.name)} (${code(w.file)}) | ${cell(w.triggers.join(', ') || 'see file')} |`);
  L.push('');

  L.push('## Open issues', '');
  if (f.github.openIssues.length) {
    L.push('| Issue | Topic | Labels |', '| --- | --- | --- |');
    for (const i of f.github.openIssues) L.push(`| [#${i.number}](${GH_URL}/issues/${i.number}) | ${cell(i.title)} | ${cell(i.labels.join(', ') || 'None')} |`);
  } else L.push('None.');
  L.push('');

  L.push('## Open pull requests', '');
  if (f.github.openPRs.length) {
    L.push('| PR | Topic | Note |', '| --- | --- | --- |');
    for (const p of f.github.openPRs) {
      const note = [p.draft ? 'Draft' : '', p.bot ? 'Dependabot' : '', p.base !== 'main' ? `Stacked on ${code(p.base)}` : '', p.reviewDecision ? p.reviewDecision.toLowerCase().replace(/_/g, ' ') : '', `Updated ${p.updatedAt.slice(0, 10)}`]
        .filter(Boolean)
        .join('; ');
      L.push(`| [#${p.number}](${GH_URL}/pull/${p.number}) | ${cell(p.title)} | ${cell(note)} |`);
    }
  } else L.push('None.');
  L.push('');

  return L.join('\n').trimEnd() + '\n';
}

// ---------------------------------------------------------------------------

function main() {
  if (args.fetch !== false) git('fetch', '--quiet', 'origin');
  const commit = git('rev-parse', '--short', REF).trim();
  const commitDate = git('log', '-1', '--format=%cs', REF).trim();
  const files = git('ls-tree', '-r', '--name-only', REF).split('\n').filter(Boolean);

  let mcpTools = [];
  const mcpFiles = files.filter((f) => /^(app\/api\/mcp|lib\/mcp)\/.*\.(ts|tsx)$/.test(f) && !/\.test\./.test(f));
  for (const f of mcpFiles) {
    const src = show(f);
    mcpTools.push(...[...src.matchAll(/(?:registerTool|server\.tool)\(\s*['"](\w+)['"]/g)].map((m) => m[1]));
  }
  mcpTools = [...new Set(mcpTools)];

  const facts = {
    date: localDate(new Date()),
    generatedAt: new Date().toISOString(),
    ref: REF,
    commit,
    commitDate,
    routes: readRoutes(files),
    schema: readSchema(files),
    packages: readPackage(),
    workflows: readWorkflows(files),
    testFiles: files.filter((f) => /\.test\.(ts|tsx)$/.test(f)).length,
    e2eFiles: files.filter((f) => /\.spec\.(ts|tsx)$/.test(f)).length,
    mcpTools,
    github: readGitHub(),
  };
  if (args['plan-issues']) facts.planIssues = readPlanIssues(args['plan-issues']);

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'repo.json'), JSON.stringify(facts, null, 2));
  fs.writeFileSync(path.join(OUT, 'codebase.md'), toMarkdown(facts));
  console.log(`Wrote ${path.join(OUT, 'repo.json')} and codebase.md (commit ${commit})`);
}

main();
