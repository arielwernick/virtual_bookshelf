import { NextRequest, NextResponse } from 'next/server';
import { getUserByShareToken, getItemsByUserId } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;

    // Get user by share token
    const user = await getUserByShareToken(shareToken);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Shelf not found' },
        { status: 404 }
      );
    }

    // Get user's items
    const items = await getItemsByUserId(user.id);

    return NextResponse.json({
      success: true,
      data: {
        username: user.username,
        description: user.description,
        title: user.title,
        items,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Error fetching shared shelf:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shelf' },
      { status: 500 }
    );
  }
}
