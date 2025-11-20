import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { updateUserTitle } from '@/lib/db/queries';

const MAX_TITLE_LENGTH = 100;

export async function PATCH(request: Request) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title } = body;

    // Validate title length
    if (title && typeof title === 'string' && title.length > MAX_TITLE_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Title must be ${MAX_TITLE_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // Update the user's title
    const updatedUser = await updateUserTitle(session.userId, title || null);

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        title: updatedUser.title,
      },
    });
  } catch (error) {
    console.error('Error updating shelf title:', error);
    return NextResponse.json({ success: false, error: 'Failed to update shelf title' }, { status: 500 });
  }
}
