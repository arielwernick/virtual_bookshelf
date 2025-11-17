import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { updateUserDescription } from '@/lib/db/queries';

const MAX_DESCRIPTION_LENGTH = 500;

export async function POST(request: Request) {
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
    const { description } = body;

    // Validate description length
    if (description && typeof description === 'string' && description.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // Update the user's description
    const updatedUser = await updateUserDescription(session.userId, description || null);

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        description: updatedUser.description,
      },
    });
  } catch (error) {
    console.error('Error updating shelf description:', error);
    return NextResponse.json({ success: false, error: 'Failed to update shelf description' }, { status: 500 });
  }
}
