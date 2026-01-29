import { NextResponse } from 'next/server';
import { parseTextWithContext, validateParseResults } from '@/lib/utils/textParser';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ImportParse');

const MAX_TEXT_LENGTH = 100000; // 100KB max text input
const MAX_ITEMS = 50;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;

    // Validate text input
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Parse the text to extract URLs and context
    const parsedItems = parseTextWithContext(text);

    // Validate and potentially truncate results
    const { items, warning } = validateParseResults(parsedItems, MAX_ITEMS);

    logger.info(`Parsed ${items.length} items from text`);

    return NextResponse.json({
      success: true,
      data: {
        items,
        count: items.length,
        warning,
      },
    });
  } catch (error) {
    logger.errorWithException('Failed to parse text', error);
    return NextResponse.json(
      { success: false, error: 'Failed to parse text' },
      { status: 500 }
    );
  }
}
