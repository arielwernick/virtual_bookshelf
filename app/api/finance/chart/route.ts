import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
import { Redis } from '@upstash/redis';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('FinanceChart');
const CACHE_TTL = 300; // 5 minutes

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

  const cacheKey = `finance:chart:${symbol}`;
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
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    const result = await yahooFinance.chart(symbol, {
      period1: oneYearAgo,
      period2: now,
      interval: '1d',
      return: 'array',
    });

    // Transform to TradingView Lightweight Charts candlestick format
    // result.quotes exists when return:'array' is set; cast to access it
    const quotes = (result as { quotes?: Array<{ date: Date; open: number | null; high: number | null; low: number | null; close: number | null }> }).quotes ?? [];
    const candles = quotes
      .filter((q) => q.open != null && q.close != null)
      .map((q) => ({
        time: Math.floor(q.date.getTime() / 1000) as number,
        open: q.open!,
        high: q.high!,
        low: q.low!,
        close: q.close!,
      }));

    const data = { symbol, candles };

    if (redis) {
      try {
        await redis.set(cacheKey, data, { ex: CACHE_TTL });
      } catch (err) {
        logger.errorWithException('Redis set failed', err);
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.errorWithException(`Failed to fetch chart for ${symbol}`, error);
    return NextResponse.json({ success: false, error: 'Failed to fetch chart' }, { status: 502 });
  }
}
