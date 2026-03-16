import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
import { Redis } from '@upstash/redis';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('FinanceNews');
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

  const cacheKey = `finance:news:${symbol}`;
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
    const result = await yahooFinance.search(symbol, { newsCount: 5, quotesCount: 0 }) as {
      news?: Array<{ title: string; link: string; publisher: string; providerPublishTime?: Date | number }>;
    };

    const headlines = (result.news ?? []).slice(0, 5).map((article) => ({
      title: article.title,
      url: article.link,
      publisher: article.publisher,
      publishedAt: article.providerPublishTime
        ? (article.providerPublishTime instanceof Date
            ? article.providerPublishTime.toISOString()
            : new Date((article.providerPublishTime as number) * 1000).toISOString())
        : null,
    }));

    const data = { symbol, headlines };

    if (redis) {
      try {
        await redis.set(cacheKey, data, { ex: CACHE_TTL });
      } catch (err) {
        logger.errorWithException('Redis set failed', err);
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.errorWithException(`Failed to fetch news for ${symbol}`, error);
    return NextResponse.json({ success: false, error: 'Failed to fetch news' }, { status: 502 });
  }
}
