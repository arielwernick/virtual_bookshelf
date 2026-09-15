/**
 * Shared layout shell for competitor "alternative" landing pages
 * (Bento.me, Linktree, Goodreads). Each route supplies its own copy, comparison
 * data, and structured data — the content is intentionally distinct per page;
 * only the presentation is shared. Server component, fully static.
 */

import Link from 'next/link';
import { CapabilityShowcase } from '@/components/home/CapabilityShowcase';
import { ComparisonTable, type ComparisonColumn, type ComparisonRow } from './ComparisonTable';

interface Reason {
  title: string;
  body: string;
}
interface Step {
  n: number;
  title: string;
  body: string;
}
interface FaqEntry {
  q: string;
  a: string;
}

export interface AlternativeLandingPageProps {
  breadcrumbLabel: string;
  h1: string;
  heroSubhead: string;
  intro: { heading: string; paragraphs: string[] };
  reasons: { heading: string; sub: string; items: Reason[] };
  comparison: { heading: string; sub: string; columns: ComparisonColumn[]; rows: ComparisonRow[]; note?: string };
  steps: { heading: string; sub: string; items: Step[] };
  faq: { heading: string; items: FaqEntry[] };
  cta: { heading: string; sub: string };
  /** Structured-data blocks (FAQPage, BreadcrumbList, …) rendered as JSON-LD. */
  jsonLd: object[];
}

const primaryCta =
  'inline-block px-8 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-all font-medium text-lg shadow-md hover:shadow-lg';
const h2Class = 'text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight';

export function AlternativeLandingPage({
  breadcrumbLabel,
  h1,
  heroSubhead,
  intro,
  reasons,
  comparison,
  steps,
  faq,
  cta,
  jsonLd,
}: AlternativeLandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex flex-col">
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}

      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-10 text-center">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center justify-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="/" className="hover:text-gray-700 dark:hover:text-gray-300">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-700 dark:text-gray-300 font-medium">{breadcrumbLabel}</li>
            </ol>
          </nav>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">{h1}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto">{heroSubhead}</p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup" className={primaryCta}>Create your shelf — free</Link>
            <Link href="#comparison" className="inline-block px-8 py-3.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium text-lg">
              Compare features
            </Link>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Intro / direct answer — AEO target */}
          <section aria-labelledby="intro-heading" className="max-w-2xl mx-auto mb-20 sm:mb-24">
            <h2 id="intro-heading" className={`${h2Class} mb-4`}>{intro.heading}</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
              {intro.paragraphs.map((p, i) => (<p key={i}>{p}</p>))}
            </div>
          </section>

          {/* Why */}
          <section aria-labelledby="reasons-heading" className="mb-16 sm:mb-20">
            <div className="text-center mb-10">
              <h2 id="reasons-heading" className={h2Class}>{reasons.heading}</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{reasons.sub}</p>
            </div>
            <ul className="grid gap-6 sm:grid-cols-3">
              {reasons.items.map((r) => (
                <li key={r.title} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/50 p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{r.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{r.body}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Shelve anything */}
          <CapabilityShowcase />

          {/* Comparison */}
          <section id="comparison" aria-labelledby="comparison-heading" className="mb-20 sm:mb-28 scroll-mt-24">
            <div className="text-center mb-10">
              <h2 id="comparison-heading" className={h2Class}>{comparison.heading}</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{comparison.sub}</p>
            </div>
            <ComparisonTable columns={comparison.columns} rows={comparison.rows} note={comparison.note} />
          </section>

          {/* Steps */}
          <section aria-labelledby="steps-heading" className="mb-20 sm:mb-28">
            <div className="text-center mb-10">
              <h2 id="steps-heading" className={h2Class}>{steps.heading}</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{steps.sub}</p>
            </div>
            <ol className="grid gap-6 sm:grid-cols-3">
              {steps.items.map((step) => (
                <li key={step.n} className="text-center">
                  <span className="mx-auto grid place-items-center w-10 h-10 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold">{step.n}</span>
                  <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100">{step.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{step.body}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* FAQ */}
          <section aria-labelledby="faq-heading" className="max-w-2xl mx-auto mb-20 sm:mb-28">
            <h2 id="faq-heading" className={`${h2Class} text-center mb-10`}>{faq.heading}</h2>
            <dl className="space-y-8">
              {faq.items.map((item) => (
                <div key={item.q}>
                  <dt className="font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg">{item.q}</dt>
                  <dd className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Final CTA */}
          <section className="text-center pb-20 sm:pb-28">
            <h2 className={h2Class}>{cta.heading}</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-xl mx-auto">{cta.sub}</p>
            <div className="mt-7">
              <Link href="/signup" className={primaryCta}>Create your shelf — free</Link>
              <p className="mt-5 text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link href="/login" className="text-gray-900 dark:text-gray-100 hover:underline font-medium">Sign in</Link>
              </p>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
            <p>© {new Date().getFullYear()} Virtual Bookshelf</p>
            <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors font-medium">Back to home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
