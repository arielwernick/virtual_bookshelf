import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
import { Redis } from '@upstash/redis';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('FinanceQuote');
const CACHE_TTL = 60; // 60 seconds

let _redis: Redis | null = null;
function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!_redis) _redis = Redis.fromEnv();
  return _redis;
}

function logoUrlFromWebsite(website: string | undefined): string | null {
  if (!website) return null;
  try {
    const domain = new URL(website).hostname.replace(/^www\./, '');
    // Fallback: Google favicon at high quality — used only if ticker-based lookup fails
    return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol')?.toUpperCase();

  if (!symbol) {
    return NextResponse.json({ success: false, error: 'symbol is required' }, { status: 400 });
  }

  const cacheKey = `finance:quote:${symbol}`;
  const redis = getRedis();

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({ success: true, data: cached });
      }
    } catch (err) {
      logger.errorWithException('Redis get failed', err);
    }
  }

  try {
    // Fetch quote and company profile in parallel
    const [quote, summary] = await Promise.all([
      yahooFinance.quote(symbol, {
        fields: ['regularMarketPrice', 'regularMarketChange', 'regularMarketChangePercent',
                 'fiftyTwoWeekLow', 'fiftyTwoWeekHigh', 'shortName', 'longName', 'currency'],
      }) as Promise<{
        longName?: string;
        shortName?: string;
        regularMarketPrice?: number;
        regularMarketChange?: number;
        regularMarketChangePercent?: number;
        fiftyTwoWeekLow?: number;
        fiftyTwoWeekHigh?: number;
        currency?: string;
      }>,
      yahooFinance.quoteSummary(
        symbol,
        { modules: ['assetProfile'] },
        { validateResult: false }
      ).catch((err) => {
        logger.warn(`quoteSummary failed for ${symbol}`, { error: String(err) });
        return null;
      }),
    ]);

    // Primary: Financial Modeling Prep has high-quality ticker-based logos, no API key needed
    const fmpLogoUrl = `https://financialmodelingprep.com/image-stock/${symbol}.png`;
    // Fallback: derive from company website via Google favicon service
    const website = (summary as { assetProfile?: { website?: string } } | null)?.assetProfile?.website;
    const fallbackLogoUrl = logoUrlFromWebsite(website);
    const logoUrl = fmpLogoUrl;
    logger.debug(`Logo for ${symbol}`, { logoUrl, fallback: fallbackLogoUrl });

    const data = {
      symbol,
      name: quote.longName ?? quote.shortName ?? symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
      currency: quote.currency ?? 'USD',
      logoUrl,
    };

    if (redis) {
      try {
        await redis.set(cacheKey, data, { ex: CACHE_TTL });
      } catch (err) {
        logger.errorWithException('Redis set failed', err);
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.errorWithException(`Failed to fetch quote for ${symbol}`, error);
    return NextResponse.json({ success: false, error: 'Failed to fetch quote' }, { status: 502 });
  }
}
