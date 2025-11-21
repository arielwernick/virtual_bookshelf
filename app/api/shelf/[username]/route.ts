import { NextResponse } from 'next/server';
import { getUserByUsername, getDefaultShelf, getItemsByShelfId } from '@/lib/db/queries';

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

    // Get user's default shelf
    const defaultShelf = await getDefaultShelf(user.id);
    if (!defaultShelf) {
      return NextResponse.json(
        { success: false, error: 'Default shelf not found' },
        { status: 404 }
      );
    }

    // Get shelf's items
    const items = await getItemsByShelfId(defaultShelf.id);

    return NextResponse.json({
      success: true,
      data: {
        username: user.username,
        shelfName: defaultShelf.name,
        description: defaultShelf.description,
        items,
        created_at: defaultShelf.created_at,
        share_token: defaultShelf.share_token,
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
