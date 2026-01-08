import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('AuthDebug');

/**
 * Debug endpoint - check session status
 * Remove in production
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: Request) {
  try {
    const session = await getSession();

    return NextResponse.json({
      success: true,
      session: session ? {
        userId: session.userId,
        username: session.username,
        email: session.email,
      } : null,
      authenticated: !!session,
    });
  } catch (error) {
    logger.errorWithException('Debug endpoint failed', error);
    return NextResponse.json(
      { success: false, error: 'Debug failed' },
      { status: 500 }
    );
  }
}
