import { NextResponse } from 'next/server';
import { processTalkToBook } from '@/lib/api/hathora';
import { BOOK_CONTEXT, SYSTEM_PROMPT } from '@/lib/data/winnie-the-pooh';

/**
 * Talk to Book API endpoint
 * Accepts audio recording, processes through Hathora Models (ASR → LLM → TTS)
 * Returns audio response
 */
export async function POST(request: Request) {
  try {
    // Check if Hathora API key is configured
    if (!process.env.HATHORA_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Voice AI is not configured. Please set HATHORA_API_KEY environment variable.' 
        },
        { status: 503 }
      );
    }

    // Get the audio file from form data
    const formData = await request.formData();
    const audioFile = formData.get('audio');

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Process through Hathora pipeline
    const result = await processTalkToBook(
      audioFile,
      BOOK_CONTEXT,
      SYSTEM_PROMPT
    );

    // Convert audio blob to base64 for JSON response
    const audioBuffer = await result.audioBlob.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    // Return JSON response with transcript, response text, and audio
    return NextResponse.json({
      success: true,
      data: {
        transcript: result.transcript,
        responseText: result.responseText,
        audio: audioBase64,
      },
    });
  } catch (error) {
    console.error('Error in talk-to-book API:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to process voice request';
    if (error instanceof Error) {
      if (error.message.includes('ASR failed')) {
        errorMessage = 'Failed to transcribe audio. Please try speaking again.';
      } else if (error.message.includes('LLM failed')) {
        errorMessage = 'Failed to generate response. Please try again.';
      } else if (error.message.includes('TTS failed')) {
        errorMessage = 'Failed to generate speech. Please try again.';
      } else if (error.message.includes('HATHORA_API_KEY')) {
        errorMessage = 'Voice AI is not configured properly.';
      }
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  const isConfigured = Boolean(process.env.HATHORA_API_KEY);
  
  return NextResponse.json({
    success: true,
    configured: isConfigured,
    message: isConfigured 
      ? 'Talk to Book API is ready' 
      : 'HATHORA_API_KEY environment variable is not set',
  });
}
