import { NextResponse } from 'next/server';
import { searchBooks } from '@/lib/api/googleBooks';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'Atomic Habits';

  try {
    const results = await searchBooks(query);
    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
