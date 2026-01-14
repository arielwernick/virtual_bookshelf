import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { createLogger } from '@/lib/utils/logger';
import { authRequiredError, internalError } from '@/lib/utils/errors';

const logger = createLogger('AuthMe');

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return authRequiredError();
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: session.userId,
        username: session.username,
      },
    });
  } catch (error) {
    logger.errorWithException('Failed to get session', error);
    return internalError('Failed to get session');
  }
}
