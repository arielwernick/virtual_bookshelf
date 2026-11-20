import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth/config';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('AuthLogout');

/**
 * Sign out: ends the Better Auth session and clears its cookies. Also clears
 * the old JWT cookie, in case a browser still has one from before #267.
 */
export async function POST() {
  try {
    const { headers: setCookieHeaders } = await getAuth().api.signOut({
      headers: await headers(),
      returnHeaders: true,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
    for (const cookie of setCookieHeaders.getSetCookie()) {
      response.headers.append('set-cookie', cookie);
    }
    response.cookies.delete('bookshelf_session');
    return response;
  } catch (error) {
    logger.errorWithException('Logout failed', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}
