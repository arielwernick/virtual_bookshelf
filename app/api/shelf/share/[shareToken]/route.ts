import { NextRequest, NextResponse } from 'next/server';
import { getShelfByShareToken, getItemsByShelfId, getUserById } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;

    // Get shelf by share token
    const shelf = await getShelfByShareToken(shareToken);
    if (!shelf) {
      return NextResponse.json(
        { success: false, error: 'Shelf not found' },
        { status: 404 }
      );
    }

    // Get the owner user to get username
    const user = await getUserById(shelf.user_id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get shelf's items
    const items = await getItemsByShelfId(shelf.id);

    return NextResponse.json({
      success: true,
      data: {
        username: user.username,
        shelfName: shelf.name,
        description: shelf.description,
        items,
        created_at: shelf.created_at,
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
