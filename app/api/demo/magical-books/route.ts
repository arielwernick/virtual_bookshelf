import { NextResponse } from 'next/server';
import { getUserByUsername, getShelfsByUserId, getItemsByShelfId } from '@/lib/db/queries';

/**
 * GET: Fetch the "Magical Speaking Books" demo shelf
 * Public endpoint - no auth required
 */
export async function GET() {
  try {
    console.log('[Magical Books API] Fetching demo shelf...');
    
    // Get the hathora_demo user
    const user = await getUserByUsername('hathora_demo');
    console.log('[Magical Books API] User lookup result:', user ? `Found user ${user.id}` : 'User not found');
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Demo user "hathora_demo" not found. Please create this user first.' },
        { status: 404 }
      );
    }

    // Get all shelves for this user
    const shelves = await getShelfsByUserId(user.id);
    console.log('[Magical Books API] Found shelves:', shelves.map(s => ({ id: s.id, name: s.name, is_public: s.is_public })));
    
    // Find the "Magical Speaking Books" shelf (or just get the first public shelf)
    const magicalShelf = shelves.find(
      s => s.name.toLowerCase().includes('magical') || s.name.toLowerCase().includes('speaking')
    ) || shelves.find(s => s.is_public) || shelves[0];

    console.log('[Magical Books API] Selected shelf:', magicalShelf ? magicalShelf.name : 'None found');

    if (!magicalShelf) {
      return NextResponse.json(
        { success: false, error: `No demo shelf found for user hathora_demo. Found ${shelves.length} shelves total.` },
        { status: 404 }
      );
    }

    // Get items for this shelf
    const items = await getItemsByShelfId(magicalShelf.id);
    console.log('[Magical Books API] Found items:', items.length);

    return NextResponse.json({
      success: true,
      data: {
        id: magicalShelf.id,
        name: magicalShelf.name,
        description: magicalShelf.description,
        shelf_type: magicalShelf.shelf_type,
        items,
        created_at: magicalShelf.created_at,
      },
    });
  } catch (error) {
    console.error('[Magical Books API] Error fetching magical books shelf:', error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch demo shelf: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
