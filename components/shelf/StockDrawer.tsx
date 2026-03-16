'use client';

import { useEffect, useRef, useState } from 'react';
import type { UTCTimestamp } from 'lightweight-charts';
import { Item } from '@/lib/types/shelf';

interface QuoteData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  fiftyTwoWeekLow: number;
  fiftyTwoWeekHigh: number;
  currency: string;
}

interface CandleData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface Headline {
  title: string;
  url: string;
  publisher: string;
  publishedAt: string | null;
}

interface StockDrawerProps {
  item: Item;
}

export function StockDrawer({ item }: StockDrawerProps) {
  // The ticker symbol is stored in item.creator per the plan
  const symbol = item.creator;

  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [quoteError, setQuoteError] = useState(false);
  const [chartError, setChartError] = useState(false);
  const [newsError, setNewsError] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);

  // Fetch quote
  useEffect(() => {
    fetch(`/api/finance/quote?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setQuote(res.data);
        else setQuoteError(true);
      })
      .catch(() => setQuoteError(true));
  }, [symbol]);

  // Fetch news
  useEffect(() => {
    fetch(`/api/finance/news?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setHeadlines(res.data.headlines);
        else setNewsError(true);
      })
      .catch(() => setNewsError(true));
  }, [symbol]);

  // Fetch chart data and render TradingView Lightweight Charts
  useEffect(() => {
    if (!chartContainerRef.current) return;

    let cleanup: (() => void) | undefined;

    fetch(`/api/finance/chart?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then(async (res) => {
        if (!res.success || !chartContainerRef.current) {
          setChartError(true);
          return;
        }

        const candles: CandleData[] = res.data.candles;
        if (!candles.length) {
          setChartError(true);
          return;
        }

        const { createChart, ColorType, CandlestickSeries } = await import('lightweight-charts');
        const container = chartContainerRef.current!;

        const chart = createChart(container, {
          layout: {
            background: { type: ColorType.Solid, color: 'transparent' },
            textColor: '#9ca3af',
          },
          grid: {
            vertLines: { color: '#1f2937' },
            horzLines: { color: '#1f2937' },
          },
          width: container.clientWidth,
          height: 240,
          timeScale: { timeVisible: false },
          rightPriceScale: { borderColor: '#374151' },
        });

        chartRef.current = chart;

        const series = chart.addSeries(CandlestickSeries, {
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444',
        });

        series.setData(candles);
        chart.timeScale().fitContent();

        const observer = new ResizeObserver(() => {
          if (container) {
            chart.applyOptions({ width: container.clientWidth });
          }
        });
        observer.observe(container);

        cleanup = () => {
          observer.disconnect();
          chart.remove();
          chartRef.current = null;
        };
      })
      .catch(() => setChartError(true));

    return () => {
      if (cleanup) cleanup();
    };
  }, [symbol]);

  const isPositive = quote ? quote.change >= 0 : null;

  return (
    <div className="space-y-5">
      {/* Price strip */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
        {quoteError ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Could not load quote for {symbol}.</p>
        ) : quote ? (
          <div className="flex flex-wrap gap-x-6 gap-y-2 items-baseline">
            <div>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {quote.price.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">{quote.currency}</span>
            </div>
            <div className={`text-sm font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%)
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              52W: {quote.fiftyTwoWeekLow.toFixed(2)} – {quote.fiftyTwoWeekHigh.toFixed(2)}
            </div>
          </div>
        ) : (
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        )}
      </div>

      {/* 1-year chart */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
          1-Year Price
        </p>
        {chartError ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Chart unavailable.</p>
        ) : (
          <div
            ref={chartContainerRef}
            className="w-full rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800"
            style={{ height: 240 }}
          />
        )}
      </div>

      {/* News headlines */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
          Latest News
        </p>
        {newsError ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Could not load news.</p>
        ) : headlines.length > 0 ? (
          <ul className="space-y-2">
            {headlines.map((h, i) => (
              <li key={i}>
                <a
                  href={h.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 leading-snug"
                >
                  {h.title}
                </a>
                <p className="text-xs text-gray-400 mt-0.5">
                  {h.publisher}
                  {h.publishedAt && ` · ${new Date(h.publishedAt).toLocaleDateString()}`}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-3/4" />
            ))}
          </div>
        )}
      </div>

      {/* Yahoo Finance link */}
      <a
        href={item.external_url ?? `https://finance.yahoo.com/quote/${symbol}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
      >
        <span>View on Yahoo Finance</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
}
