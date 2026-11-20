import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('AuthMe');

/**
 * Who is signed in. Kept for the app's own pages (navigation, edit page,
 * import flow); Better Auth's equivalent is /api/auth/get-session.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      data: {
        userId: user.userId,
        username: user.username,
      },
    });
  } catch (error) {
    logger.errorWithException('Failed to get session', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get session' },
      { status: 500 }
    );
  }
}
