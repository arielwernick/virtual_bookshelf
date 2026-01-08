import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/utils/session';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('AuthLogout');

export async function POST() {
  try {
    await clearSession();
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.errorWithException('Logout failed', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}
