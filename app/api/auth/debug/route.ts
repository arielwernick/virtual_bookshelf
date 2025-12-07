import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';

/**
 * Debug endpoint - check session status
 * Remove in production
 */
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
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Debug failed' },
      { status: 500 }
    );
  }
}
