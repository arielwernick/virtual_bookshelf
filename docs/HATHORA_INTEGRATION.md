# Hathora Integration Guide

This guide explains how Virtual Bookshelf integrates with Hathora Models to power the "Talk to This Book" voice AI demo.

## Overview

- ASR: Speech-to-text using `nvidia/parakeet-tdt-0.6b-v3`
- LLM: Text generation using `qwen/qwen3-30b-a3b` (OpenAI-compatible API)
- TTS: Text-to-speech using `hexgrad/kokoro-82m` (voice: `af_bella` by default)

Primary files:
- `lib/api/hathora.ts` — API client for ASR, LLM, TTS
- `lib/data/winnie-the-pooh.ts` — System prompt and book context
- `app/api/talk-to-book/route.ts` — Next.js API route orchestrating the pipeline
- `app/demo/talk-to-book/page.tsx` — Demo UI with shelf and modal chat

## Environment Setup

Required in `.env.local` (local dev) or environment variables (prod):

```
HATHORA_API_KEY=your_hathora_api_key_here
```

Verify the key is loaded by restarting the dev server.

Optional: configure the TTS backend (defaults to Kokoro). To use ResembleAI/Chatterbox on Hathora, set:

```
# Default (Kokoro on Hathora)
HATHORA_TTS_MODEL=kokoro-82m
HATHORA_TTS_URL=https://app-01312daf-6e53-4b9d-a4ad-13039f35adc4.app.hathora.dev/synthesize
HATHORA_TTS_VOICE=af_bella

# ResembleAI/Chatterbox on Hathora
# Find your synthesize endpoint and voice id from your Hathora app
HATHORA_TTS_MODEL=resemble-ai-chatterbox
HATHORA_TTS_URL=https://app-<your-chatterbox-app-id>.app.hathora.dev/synthesize
HATHORA_TTS_VOICE=<voice-id>
```

Notes:
- `HATHORA_TTS_MODEL` switches the payload shape sent by `synthesizeSpeech()`.
- If your Chatterbox setup supports extra fields (e.g., language/style), extend via envs and wire them in `lib/api/hathora.ts`.

## Architecture

1. Client records audio via `MediaRecorder` (`hooks/useAudioRecorder.ts`).
2. Client sends either:
   - Audio (`multipart/form-data`) or
   - Text (`application/json`) to `/api/talk-to-book`.
3. Server (`route.ts`) orchestrates:
   - ASR → transcribeAudio(audioBlob)
   - LLM → generateResponse(userMessage, systemPrompt, history)
   - TTS → synthesizeSpeech(responseText)
4. Server returns audio (`audio/mpeg`) with headers:
   - `X-Transcription`: user text
   - `X-Text`: assistant text
   or JSON fallback when TTS fails.

## API Client Details (`lib/api/hathora.ts`)

Endpoints (examples):
- ASR: `POST ${HATHORA_ASR_URL}/audio/transcriptions`
- LLM: `POST ${HATHORA_LLM_URL}/chat/completions`
- TTS: `POST ${HATHORA_TTS_URL}`

Key functions:
- `transcribeAudio(blob)` → returns `string`
- `generateResponse(userMessage, systemPrompt, history)` → returns `string`
- `synthesizeSpeech(text)` → returns `ArrayBuffer`
- `talkToBook(blob, systemPrompt, history)` → returns `{ transcription, response, audio }`

LLM settings:
- `max_tokens: 150` (keeps spoken responses ~20s)
- `temperature: 0.7`

TTS backends:
- Kokoro (default): `voice` is required; uses `HATHORA_TTS_VOICE`.
- ResembleAI/Chatterbox: uses the same `voice` key; you can optionally add fields like `language` or `style` if your model supports them.

## Prompting & Context (`lib/data/winnie-the-pooh.ts`)

- System prompt enforces an “old-school storytime narrator” persona.
- Explicit brevity rule: 2–3 sentences (~20s spoken).
- Book context: condensed excerpts and character notes from the public domain text.

## API Route (`app/api/talk-to-book/route.ts`)

Features:
- Edge runtime for low latency
- Supports both `multipart/form-data` (audio) and `application/json` (text)
- Debug/timing logs for LLM and TTS segments
- TTS fallback: returns JSON text-only if TTS fails to keep UX responsive

Response behaviors:
- Audio path: `Content-Type: audio/mpeg`, headers include text metadata
- Fallback path: JSON `{ success, mode: 'text-only', transcription, response }`

Observability:
- Logs record Content-Type, LLM start/end, and TTS start/end timings. In failures, you’ll see `TTS failed` with the upstream message.
- On production (e.g., Vercel), use function logs to trace stalls and confirm which stage failed.

## UI (`app/demo/talk-to-book/page.tsx`)

- Shelf view pulls items from the `hathora_demo` user’s “Magical Speaking Books” shelf via `/api/demo/magical-books`.
- Clicking a book opens a modal with:
  - Conversation history
  - Voice hold-to-record
  - Text input
  - Google Books link (if present)
- Client handles both audio and text-only responses.

## Common Issues & Troubleshooting

- 500 errors at TTS:
  - May be rate limiting or transient endpoint issues.
  - The server now falls back to text-only; client renders the reply.
  - Consider shorter outputs, alternate voice, or retry/backoff.

- Edge runtime warnings (Node crypto):
  - Non-blocking warning if Node APIs appear in import traces.
  - Ensure Node-only modules aren’t used in Edge routes.

- Env not picked up:
  - Restart the dev server after editing `.env.local`.

- TTS model switching:
  - If you see 415/400 from TTS after switching to Chatterbox, confirm `HATHORA_TTS_URL` and `voice` are valid for your app.
  - If your Chatterbox voice needs `language/style`, add those to the request body in `lib/api/hathora.ts` (guarded by `HATHORA_TTS_MODEL==='resemble-ai-chatterbox'`).

## Optional Enhancements (Streaming & Robustness)

- LLM streaming: use fetch streaming or SSE for progressive tokens.
- TTS near-streaming: split assistant text into sentences and synthesize+play sequentially.
- Retry with backoff: on TTS failure, retry with alternate voice and shorter text.
- Circuit breaker: auto text-only mode after multiple TTS failures and log a user-friendly note.

Status:
- Streaming is planned; current implementation returns whole responses (audio or text-only fallback).

## Quick Start

1. Set `HATHORA_API_KEY` in `.env.local`.
2. Start dev:

```
npm run dev
```

3. Visit `http://localhost:3000/demo/talk-to-book`.
4. Click a book on the shelf, ask via voice or text.

## Verify With curl

JSON (text input → audio or text-only):

```
curl -s -X POST "http://localhost:3000/api/talk-to-book" \
  -H "Content-Type: application/json" \
  -d '{"text": "Give me two sentences about Pooh and honey.", "history": []}' \
  -D - \
  --output reply.mp3
```

- If TTS succeeds, `reply.mp3` contains audio and response headers include `X-Text`.
- If TTS fails, you’ll get a JSON body with `mode: "text-only"`.

Multipart (audio path):

```
curl -s -X POST "http://localhost:3000/api/talk-to-book?debug=1" \
  -H "Authorization: Bearer test" \
  -F file=@sample.webm \
  -F history='[]'
```

- Returns JSON with `transcription`, `response`, and base64-less `audio` only when `debug=1`.
- Without `debug=1`, response is `audio/mpeg` with `X-Transcription` and `X-Text` headers.

## When To Use The Second TTS

- Reliability: Use Chatterbox as an alternate when Kokoro rate-limits or stalls; the app already falls back to text-only on failures.
- Voice quality: If you prefer a specific Chatterbox voice or need style/language controls.
- Trade-offs: Adds a small config surface and potential payload differences; validate your `HATHORA_TTS_URL` and `voice` IDs.

## Support

- If TTS stalls, you’ll see text-only responses — this is expected under rate limits.
- For true audio streaming, confirm Hathora’s TTS supports chunked responses; otherwise use sentence-chunk playback.
