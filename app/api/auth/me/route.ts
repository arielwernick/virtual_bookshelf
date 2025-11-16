import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: session.userId,
        username: session.username,
      },
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get session' },
      { status: 500 }
    );
  }
}
