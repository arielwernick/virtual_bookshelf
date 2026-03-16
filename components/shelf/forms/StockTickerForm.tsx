'use client';

import { useState } from 'react';

interface StockTickerFormProps {
  onAdd: (ticker: string, companyName: string) => Promise<void>;
  adding: boolean;
}

export function StockTickerForm({ onAdd, adding }: StockTickerFormProps) {
  const [ticker, setTicker] = useState('');
  const [preview, setPreview] = useState<{ name: string; price: number; currency: string } | null>(null);
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async () => {
    const sym = ticker.trim().toUpperCase();
    if (!sym) return;
    setLooking(true);
    setError('');
    setPreview(null);
    try {
      const res = await fetch(`/api/finance/quote?symbol=${encodeURIComponent(sym)}`);
      const data = await res.json();
      if (data.success) {
        setPreview({ name: data.data.name, price: data.data.price, currency: data.data.currency });
      } else {
        setError(`Could not find ticker "${sym}"`);
      }
    } catch {
      setError('Lookup failed — check your connection');
    } finally {
      setLooking(false);
    }
  };

  const handleAdd = async () => {
    const sym = ticker.trim().toUpperCase();
    await onAdd(sym, preview?.name ?? sym);
    setTicker('');
    setPreview(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={ticker}
          onChange={(e) => { setTicker(e.target.value.toUpperCase()); setPreview(null); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
          placeholder="Enter ticker symbol (e.g., NVDA)"
          maxLength={10}
          className="flex-1 px-4 py-2 border border-purple-300 dark:border-purple-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-mono uppercase"
        />
        <button
          onClick={handleLookup}
          disabled={looking || !ticker.trim()}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
        >
          {looking ? 'Looking up…' : 'Look up'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {preview && (
        <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{preview.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {ticker.trim().toUpperCase()} · {preview.price.toFixed(2)} {preview.currency}
            </p>
          </div>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm disabled:opacity-50"
          >
            {adding ? 'Adding…' : 'Add Stock'}
          </button>
        </div>
      )}

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Enter a stock ticker to look up the company and add it to your shelf.
      </p>
    </div>
  );
}
