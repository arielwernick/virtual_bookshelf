import { NextResponse } from 'next/server';
import { getUserByUsername, getItemsByUserId } from '@/lib/db/queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Get user
    const user = await getUserByUsername(username.toLowerCase());
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
        share_token: user.share_token,
      },
    });
  } catch (error) {
    console.error('Error fetching shelf:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shelf' },
      { status: 500 }
    );
  }
}
