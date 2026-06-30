'use client';

import { useState } from 'react';

interface Example {
  id: string;
  label: string;
  shareToken: string;
  title: string;
}

const EXAMPLES: Example[] = [
  { id: 'eng-leadership', label: 'Engineering Leadership LIVE', shareToken: 'hnDScsft', title: 'Engineering Leadership Live SF' },
  { id: 'config', label: 'Config 2025 (Figma)', shareToken: 'bzU3ZvNo', title: 'Config 2025' },
  { id: 'data-ai', label: 'Data + AI Summit', shareToken: 'y6b67aoh', title: 'Databricks Data + AI Summit 2025' },
];

export function LiveShelfExamples() {
  const [active, setActive] = useState(EXAMPLES[0].id);
  const current = EXAMPLES.find((e) => e.id === active) ?? EXAMPLES[0];

  return (
    <div>
      <div role="tablist" aria-label="Example conference shelf" className="flex flex-wrap justify-center gap-2 mb-8">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.id}
            role="tab"
            aria-selected={active === ex.id}
            onClick={() => setActive(ex.id)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
              active === ex.id
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-lg bg-white dark:bg-gray-900">
        <iframe
          key={current.shareToken}
          src={`https://virtualbookshelf.app/embed/${current.shareToken}`}
          title={`${current.title} — conference resource shelf example`}
          className="w-full"
          style={{ height: '560px', border: 'none' }}
          loading="lazy"
        />
      </div>
      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <a
          href={`https://virtualbookshelf.app/s/${current.shareToken}`}
          className="hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {current.title} — view the full shelf →
        </a>
      </p>
    </div>
  );
}
