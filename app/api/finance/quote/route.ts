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
    const quote = await yahooFinance.quote(symbol, {
      fields: ['regularMarketPrice', 'regularMarketChange', 'regularMarketChangePercent',
               'fiftyTwoWeekLow', 'fiftyTwoWeekHigh', 'shortName', 'longName', 'currency'],
    }) as {
      longName?: string;
      shortName?: string;
      regularMarketPrice?: number;
      regularMarketChange?: number;
      regularMarketChangePercent?: number;
      fiftyTwoWeekLow?: number;
      fiftyTwoWeekHigh?: number;
      currency?: string;
    };

    const data = {
      symbol,
      name: quote.longName ?? quote.shortName ?? symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
      currency: quote.currency ?? 'USD',
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
