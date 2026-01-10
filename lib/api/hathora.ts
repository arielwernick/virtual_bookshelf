/**
 * Hathora Models API Integration
 * Provides ASR (Speech-to-Text), LLM, and TTS (Text-to-Speech) capabilities
 */

const HATHORA_API_BASE = 'https://api.hathora.dev/v1';

interface HathoraConfig {
  apiKey: string;
}

/**
 * Transcribe audio to text using Hathora ASR
 * Model: nvidia/parakeet-tdt-0.6b-v3
 */
export async function transcribeAudio(
  audioBlob: Blob,
  config: HathoraConfig
): Promise<string> {
  // Determine file extension based on blob type
  let filename = 'recording.webm';
  const mimeType = audioBlob.type || 'audio/webm';
  
  if (mimeType.includes('ogg')) {
    filename = 'recording.ogg';
  } else if (mimeType.includes('mp4') || mimeType.includes('m4a')) {
    filename = 'recording.m4a';
  } else if (mimeType.includes('wav')) {
    filename = 'recording.wav';
  }
  
  const formData = new FormData();
  
  // Create a File object with proper metadata for better compatibility
  const audioFile = new File([audioBlob], filename, {
    type: mimeType,
  });
  
  formData.append('file', audioFile);
  formData.append('model', 'nvidia/parakeet-tdt-0.6b-v3');
  
  // Log request details for debugging
  console.log('Hathora ASR Request:', {
    filename,
    mimeType,
    size: audioBlob.size,
    model: 'nvidia/parakeet-tdt-0.6b-v3',
  });

  const response = await fetch(`${HATHORA_API_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('ASR API Error:', {
      status: response.status,
      statusText: response.statusText,
      error,
      blobType: audioBlob.type,
      blobSize: audioBlob.size,
      filename,
    });
    throw new Error(`ASR failed (${response.status}): ${error}`);
  }

  const data = await response.json();
  console.log('Hathora ASR Response:', data);
  return data.text || '';
}

/**
 * Generate response using Hathora LLM
 * Model: qwen/qwen3-30b-a3b
 */
export async function generateResponse(
  userQuestion: string,
  bookContext: string,
  systemPrompt: string,
  config: HathoraConfig
): Promise<string> {
  const response = await fetch(`${HATHORA_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen/qwen3-30b-a3b',
      messages: [
        {
          role: 'system',
          content: `${systemPrompt}\n\nBook Context:\n${bookContext}`,
        },
        {
          role: 'user',
          content: userQuestion,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM failed: ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Synthesize speech from text using Hathora TTS
 * Model: hexgrad/kokoro-82m
 */
export async function synthesizeSpeech(
  text: string,
  config: HathoraConfig
): Promise<Blob> {
  const response = await fetch(`${HATHORA_API_BASE}/audio/speech`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'hexgrad/kokoro-82m',
      input: text,
      voice: 'default',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TTS failed: ${error}`);
  }

  return await response.blob();
}

export interface TalkToBookResult {
  transcript: string;
  responseText: string;
  audioBlob: Blob;
}

/**
 * Orchestrate the full voice conversation pipeline
 */
export async function processTalkToBook(
  inputAudio: Blob,
  bookContext: string,
  systemPrompt: string
): Promise<TalkToBookResult> {
  const apiKey = process.env.HATHORA_API_KEY;
  if (!apiKey) {
    throw new Error('HATHORA_API_KEY is not configured');
  }

  const config: HathoraConfig = { apiKey };

  // Step 1: Transcribe audio to text
  const transcript = await transcribeAudio(inputAudio, config);
  
  // Step 2: Generate response using LLM
  const responseText = await generateResponse(
    transcript,
    bookContext,
    systemPrompt,
    config
  );
  
  // Step 3: Synthesize speech from response
  const audioBlob = await synthesizeSpeech(responseText, config);
  
  return {
    transcript,
    responseText,
    audioBlob,
  };
}
