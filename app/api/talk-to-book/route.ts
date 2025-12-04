import { NextResponse } from 'next/server';
import { talkToBook, generateResponse, synthesizeSpeech } from '@/lib/api/hathora';
import { buildBookContext, systemPrompt } from '@/lib/data/winnie-the-pooh';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    console.log('[Talk-to-Book] Request received');
    
    // Quick env validation to avoid opaque 500s
    if (!process.env.HATHORA_API_KEY) {
      console.log('[Talk-to-Book] Missing HATHORA_API_KEY');
      return NextResponse.json(
        { success: false, error: 'Missing HATHORA_API_KEY environment variable' },
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const debug = url.searchParams.get('debug') === '1';
    const contentType = request.headers.get('content-type') || '';
    console.log('[Talk-to-Book] Content-Type:', contentType);

    // JSON text-mode: { text: string, history?: messages[] }
    if (contentType.includes('application/json')) {
      console.log('[Talk-to-Book] Processing JSON request');
      const body = await request.json();
      const { text, history = [] } = body || {};
      if (typeof text !== 'string' || !text.trim()) {
        // Fallback to base64 audio path if provided
        const { audioBase64 } = body || {};
        if (!audioBase64) {
          return NextResponse.json({ success: false, error: 'Missing text or audioBase64' }, { status: 400 });
        }
        const bytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
        const audioBlob = new Blob([bytes.buffer], { type: 'audio/webm' });
        const bookContext = buildBookContext();
        const composedPrompt = `${systemPrompt}\n\nContext:\n${bookContext}`;
        const result = await talkToBook(audioBlob, composedPrompt, history);
        return NextResponse.json({ success: true, mode: 'base64', ...result });
      }

      const bookContext = buildBookContext();
      const composedPrompt = `${systemPrompt}\n\nContext:\n${bookContext}`;
      const responseText = await generateResponse(text, composedPrompt, history);
      const audioBuf = await synthesizeSpeech(responseText);

      // Return audio binary with text metadata in headers (same as voice mode)
      return new NextResponse(audioBuf, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'X-Transcription': encodeURIComponent(text),
          'X-Text': encodeURIComponent(responseText),
        },
      });
    }

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file');
      if (!(file instanceof Blob)) {
        return NextResponse.json({ success: false, error: 'Missing audio file' }, { status: 400 });
      }

      const conversationJson = form.get('history');
      const history: Array<{ role: 'user' | 'assistant'; content: string }> = conversationJson
        ? JSON.parse(String(conversationJson))
        : [];

      const bookContext = buildBookContext();
      const composedPrompt = `${systemPrompt}\n\nContext:\n${bookContext}`;

      const result = await talkToBook(file, composedPrompt, history);

      if (debug) {
        return NextResponse.json({ success: true, mode: 'multipart', ...result });
      }

      // Edge runtime supports ArrayBuffer directly; avoid Node Buffer
      return new NextResponse(result.audio, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'X-Transcription': encodeURIComponent(result.transcription),
          'X-Text': encodeURIComponent(result.response),
        },
      });
    }

    // Fallback: JSON body with base64 audio
    const body = await request.json();
    const { audioBase64, history = [] } = body || {};
    if (!audioBase64) {
      return NextResponse.json({ success: false, error: 'Missing audioBase64' }, { status: 400 });
    }
    const bytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
    const audioBlob = new Blob([bytes.buffer], { type: 'audio/webm' });

    const bookContext = buildBookContext();
    const composedPrompt = `${systemPrompt}\n\nContext:\n${bookContext}`;
    const result = await talkToBook(audioBlob, composedPrompt, history);

    return NextResponse.json({ success: true, mode: 'base64', ...result });
  } catch (error) {
    console.error('[Talk-to-Book API] Error details:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    const message = error instanceof Error ? error.message : 'Processing failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
