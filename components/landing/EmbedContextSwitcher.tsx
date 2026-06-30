'use client';

import { useState } from 'react';

interface EmbedContext {
  id: string;
  label: string;
}

const CONTEXTS: EmbedContext[] = [
  { id: 'newsletter', label: 'Newsletter' },
  { id: 'email', label: 'Email' },
  { id: 'website', label: 'Website' },
];

const NEWSLETTER_SRC = 'https://virtualbookshelf.app/embed/hnDScsft?theme=light';
const EMAIL_SRC = 'https://virtualbookshelf.app/embed/bzU3ZvNo?theme=light';
const WEBSITE_SRC = 'https://virtualbookshelf.app/embed/y6b67aoh?theme=light';

function EmbedFrame({ src, title, height }: { src: string; title: string; height: number }) {
  return (
    <iframe
      src={src}
      title={title}
      className="w-full rounded-lg"
      style={{ height, border: 'none' }}
      loading="lazy"
    />
  );
}

function NewsletterMock() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
      <div className="px-6 sm:px-10 py-6 border-b border-gray-100 dark:border-gray-800">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">The Weekly Dispatch</p>
        <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">Issue #42 — This week in engineering leadership</h3>
      </div>
      <div className="px-6 sm:px-10 py-8 space-y-5">
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Hey everyone — I caught a few talks from Engineering Leadership LIVE in San Francisco this week, and they were too good not to share. Recordings and articles below 👇
        </p>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-2 bg-gray-50 dark:bg-gray-950">
          <EmbedFrame src={NEWSLETTER_SRC} title="Engineering Leadership Live — embedded resource shelf" height={460} />
        </div>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Click through any of the cards above — they open straight to the recording or article. See you next week.
        </p>
      </div>
    </div>
  );
}

function EmailMock() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <span className="w-3 h-3 rounded-full bg-yellow-400" />
        <span className="w-3 h-3 rounded-full bg-green-400" />
        <span className="ml-3 text-xs text-gray-400 dark:text-gray-500">Inbox — Design talks worth your time</span>
      </div>
      <div className="px-6 sm:px-10 py-6 border-b border-gray-100 dark:border-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">From: Sarah Chen &lt;sarah@company.com&gt;</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Subject: Config 2025 — the sessions worth your time</p>
      </div>
      <div className="px-6 sm:px-10 py-8 space-y-5">
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Hi team,</p>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          I pulled together the Config 2025 sessions I think are most relevant to what we're building. Everything's linked below — just click through.
        </p>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-2 bg-gray-50 dark:bg-gray-950">
          <EmbedFrame src={EMAIL_SRC} title="Config 2025 — embedded resource shelf" height={460} />
        </div>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Best,<br />Sarah</p>
      </div>
    </div>
  );
}

function WebsiteMock() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-6 sm:px-10 py-4 border-b border-gray-100 dark:border-gray-800">
        <span className="font-bold text-gray-900 dark:text-gray-100">Data + AI Summit</span>
        <div className="hidden sm:flex gap-6 text-sm text-gray-500 dark:text-gray-400">
          <span>Schedule</span>
          <span>Speakers</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">Resources</span>
        </div>
      </div>
      <div className="px-6 sm:px-10 py-8 space-y-5">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Keynote recordings & resources</h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Missed a session, or want to revisit one? All keynote recordings and resources from this year's summit are below.
        </p>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-2 bg-gray-50 dark:bg-gray-950">
          <EmbedFrame src={WEBSITE_SRC} title="Data + AI Summit 2025 — embedded resource shelf" height={460} />
        </div>
      </div>
    </div>
  );
}

export function EmbedContextSwitcher() {
  const [active, setActive] = useState('newsletter');

  return (
    <div>
      <div role="tablist" aria-label="Embed context" className="flex justify-center gap-2 mb-8">
        {CONTEXTS.map((ctx) => (
          <button
            key={ctx.id}
            role="tab"
            aria-selected={active === ctx.id}
            onClick={() => setActive(ctx.id)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
              active === ctx.id
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            {ctx.label}
          </button>
        ))}
      </div>

      {active === 'newsletter' && <NewsletterMock />}
      {active === 'email' && <EmailMock />}
      {active === 'website' && <WebsiteMock />}
    </div>
  );
}
