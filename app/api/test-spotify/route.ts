import { NextResponse } from 'next/server';
import { searchMusic } from '@/lib/api/spotify';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'Radiohead';
  const type = searchParams.get('type') as 'album' | 'podcast' || 'album';

  try {
    const results = await searchMusic(query, type);
    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
