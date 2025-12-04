/**
 * Hathora Models API Integration
 * 
 * Provides ASR (Speech-to-Text), LLM (Text Generation), and TTS (Text-to-Speech)
 * for the "Talk to This Book" feature.
 * 
 * API Key: https://models.hathora.dev/tokens
 */

// Hathora Model Endpoints (public shared endpoints)
const HATHORA_ASR_URL = 'https://app-1c7bebb9-6977-4101-9619-833b251b86d1.app.hathora.dev/v1';
const HATHORA_TTS_URL = 'https://app-01312daf-6e53-4b9d-a4ad-13039f35adc4.app.hathora.dev/synthesize';
const HATHORA_LLM_URL = 'https://app-362f7ca1-6975-4e18-a605-ab202bf2c315.app.hathora.dev/v1';

function getApiKey(): string {
  const apiKey = process.env.HATHORA_API_KEY;
  if (!apiKey) {
    throw new Error('HATHORA_API_KEY environment variable is not set');
  }
  return apiKey;
}

/**
 * Transcribe audio to text using NVIDIA Parakeet ASR
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const apiKey = getApiKey();
  
  // Create form data with audio file
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'nvidia/parakeet-tdt-0.6b-v3');
  
  const response = await fetch(`${HATHORA_ASR_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('ASR Error:', error);
    throw new Error(`Failed to transcribe audio: ${response.status}`);
  }

  const result = await response.json();
  return result.text || '';
}

/**
 * Generate a response using Qwen3 LLM (OpenAI-compatible API)
 */
export async function generateResponse(
  userMessage: string,
  systemPrompt: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  const apiKey = getApiKey();
  
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  const response = await fetch(`${HATHORA_LLM_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      max_tokens: 150,  // ~20 seconds of speech at 150 words/min
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('LLM Error:', error);
    throw new Error(`Failed to generate response: ${response.status}`);
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content || '';
}

/**
 * Synthesize speech from text using Kokoro TTS
 */
export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  const apiKey = getApiKey();
  
  const response = await fetch(HATHORA_TTS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voice: 'am_adam', // Mature male voice for old storyteller
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('TTS Error:', error);
    throw new Error(`Failed to synthesize speech: ${response.status}`);
  }

  return response.arrayBuffer();
}

/**
 * Full pipeline: Audio -> Transcription -> LLM Response -> Speech
 */
export async function talkToBook(
  audioBlob: Blob,
  systemPrompt: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<{
  transcription: string;
  response: string;
  audio: ArrayBuffer;
}> {
  // Step 1: Transcribe user's speech
  const transcription = await transcribeAudio(audioBlob);
  
  if (!transcription.trim()) {
    throw new Error('Could not understand audio. Please try again.');
  }
  
  // Step 2: Generate LLM response
  const response = await generateResponse(transcription, systemPrompt, conversationHistory);
  
  // Step 3: Synthesize speech
  const audio = await synthesizeSpeech(response);
  
  return {
    transcription,
    response,
    audio,
  };
}
