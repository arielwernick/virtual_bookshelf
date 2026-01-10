# Talk to This Book - Voice AI Demo

## Overview

"Talk to This Book" is a voice AI demonstration that allows users to have interactive conversations with classic literature. The demo features **Winnie-the-Pooh** by A.A. Milne (1926), a public domain work that became freely available in 2022.

This feature showcases the integration of [Hathora Models](https://models.hathora.dev/) voice AI platform, providing a compelling use case for combining Automatic Speech Recognition (ASR), Large Language Models (LLM), and Text-to-Speech (TTS) technologies.

## Features

- 🎤 **Voice Recording**: Hold-to-record interface for natural voice input
- 🎧 **Audio Playback**: Listen to the book's spoken responses
- 💬 **Conversation History**: See the full dialogue between you and the book
- 📖 **Rich Book Context**: Responses draw from detailed knowledge about characters, themes, and story
- 🎨 **Beautiful UI**: Warm, inviting interface matching the book's tone

## How It Works

### Architecture

```
User's Browser
    ↓
1. Record audio (MediaRecorder API)
    ↓
2. POST /api/talk-to-book
    ↓
3. Hathora Pipeline:
   a. ASR: nvidia/parakeet-tdt-0.6b-v3 (audio → text)
   b. LLM: qwen/qwen3-30b-a3b (generate response)
   c. TTS: hexgrad/kokoro-82m (text → audio)
    ↓
4. Return JSON: { transcript, responseText, audio (base64) }
    ↓
5. Display conversation & play audio
```

### User Flow

1. **Visit the demo page** at `/demo/talk-to-book`
2. **Press and hold** the microphone button
3. **Speak your question** (e.g., "What is this book about?")
4. **Release** to send your question
5. **Wait** while the system processes your audio (transcription → generation → synthesis)
6. **Listen** to the book's spoken response
7. **Continue** the conversation by asking more questions

## Setup

### Prerequisites

- Node.js 20+
- Hathora Models API key

### Environment Variables

Add to your `.env.local`:

```bash
HATHORA_API_KEY=your_api_key_here
```

Get your API key from: https://models.hathora.dev/

### Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Visit the demo
open http://localhost:3000/demo/talk-to-book
```

## Technical Details

### Files Structure

```
app/
  api/
    talk-to-book/
      route.ts           # API endpoint handling voice requests
  demo/
    talk-to-book/
      page.tsx           # Main demo page component

lib/
  api/
    hathora.ts           # Hathora API integration
    hathora.test.ts      # Tests for API utilities
  data/
    winnie-the-pooh.ts   # Book context and system prompt
    winnie-the-pooh.test.ts  # Tests for book data
```

### API Endpoints

#### POST `/api/talk-to-book`

Processes audio recording through the Hathora pipeline.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: `audio` (Blob, WebM format)

**Response:**
```json
{
  "success": true,
  "data": {
    "transcript": "What is this book about?",
    "responseText": "I tell the story of a loveable bear...",
    "audio": "base64_encoded_audio_data"
  }
}
```

#### GET `/api/talk-to-book`

Health check endpoint.

**Response:**
```json
{
  "success": true,
  "configured": true,
  "message": "Talk to Book API is ready"
}
```

### Hathora Models Used

| Function | Model | Description |
|----------|-------|-------------|
| ASR | nvidia/parakeet-tdt-0.6b-v3 | Multilingual speech recognition |
| LLM | qwen/qwen3-30b-a3b | Reasoning and instruction following |
| TTS | hexgrad/kokoro-82m | Lightweight, warm voice synthesis |

### Browser Compatibility

- **Required**: Web Audio API, MediaRecorder API
- **Supported**: Modern Chrome, Firefox, Safari, Edge
- **Audio Format**: WebM (recording), MP3 (playback)

### System Prompt Design

The book persona is defined through a carefully crafted system prompt that:
- Instructs the LLM to speak as "the book" in first person
- Provides character descriptions with personality traits
- Includes key themes and story elements
- Maintains a warm, gentle tone appropriate for all ages
- Keeps responses concise (2-4 sentences typically)

## Book Context

The demo uses **Winnie-the-Pooh** (1926) by A.A. Milne because:

✅ **Public Domain** - Freely available since January 1, 2022  
✅ **Well-Known** - Universally beloved classic  
✅ **Kid-Friendly** - Perfect for voice demo with families  
✅ **Warm Tone** - Matches TTS voice well  
✅ **Rich Content** - Many characters, themes, and memorable quotes  
✅ **Timeless** - Not dated, still relevant today  

## Example Conversations

**Q:** "Who is Pooh?"  
**A:** "Pooh is a loveable bear with very little brain but a very big heart. He lives in the Hundred Acre Wood and loves honey more than anything!"

**Q:** "What can I learn from this book?"  
**A:** "My pages teach beautiful lessons about friendship, kindness, and finding joy in simple things. Every character shows that being different is wonderful, and friends help each other through everything."

**Q:** "Tell me about Eeyore."  
**A:** "Eeyore is a gloomy old grey donkey who always expects the worst, but his friends love him dearly and always try to cheer him up. Even when he's sad, he reminds us that everyone deserves kindness."

## Testing

```bash
# Run all tests
npm run test

# Run specific test files
npm run test:run lib/api/hathora.test.ts
npm run test:run lib/data/winnie-the-pooh.test.ts

# Run with coverage
npm run test:ci
```

Current test coverage:
- ✅ Hathora API utilities (6 tests)
- ✅ Book data and metadata (16 tests)

## Error Handling

The system gracefully handles:
- ❌ Missing microphone permissions
- ❌ API key not configured
- ❌ Network failures
- ❌ ASR transcription errors
- ❌ LLM generation errors
- ❌ TTS synthesis errors

Each error provides user-friendly messages and returns to idle state.

## Performance Considerations

- **Latency**: Hathora provides geo-routing for low latency
- **Audio Size**: WebM compression keeps recordings small
- **Loading States**: Clear visual feedback during each processing step
- **Error Recovery**: Automatic cleanup of resources on failure

## Future Enhancements

Potential improvements (not implemented):

- 📚 Support for any book on user's shelf
- 🔍 Integration with Open Library API for book summaries
- 🎭 Multiple voice selection options
- 💾 Conversation memory across sessions
- 🔗 "Talk to this book" button on item cards
- 🌐 Multi-language support
- 📊 Conversation analytics

## Limitations

- Requires HATHORA_API_KEY environment variable
- Audio recording works in secure contexts (HTTPS or localhost)
- Browser must support MediaRecorder API
- Internet connection required for API calls

## Contributing

When adding new books:
1. Create book data file in `lib/data/`
2. Include metadata, system prompt, book context, and introduction
3. Add comprehensive tests
4. Update the demo page to support book selection

## License

The Talk to This Book feature code is part of Virtual Bookshelf.

**Winnie-the-Pooh** by A.A. Milne (1926) is in the public domain in the United States as of January 1, 2022.

## Resources

- [Hathora Models Documentation](https://docs.hathora.dev/)
- [Winnie-the-Pooh on Project Gutenberg](https://www.gutenberg.org/ebooks/67098)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)

## Support

For issues or questions:
- Check console for error messages
- Verify HATHORA_API_KEY is set correctly
- Ensure microphone permissions are granted
- Try in a different browser
- Open an issue on GitHub
