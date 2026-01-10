import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { transcribeAudio, generateResponse, synthesizeSpeech } from './hathora';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Hathora API Integration', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('transcribeAudio', () => {
    it('should transcribe audio successfully', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
      const mockResponse = {
        ok: true,
        json: async () => ({ text: 'Hello, how are you?' }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await transcribeAudio(mockBlob, { apiKey: 'test-key' });

      expect(result).toBe('Hello, how are you?');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.hathora.dev/v1/audio/transcriptions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key',
          }),
        })
      );
    });

    it('should throw error on failed transcription', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
      const mockResponse = {
        ok: false,
        text: async () => 'ASR service error',
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(
        transcribeAudio(mockBlob, { apiKey: 'test-key' })
      ).rejects.toThrow('ASR failed');
    });
  });

  describe('generateResponse', () => {
    it('should generate response successfully', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'I am doing well, thank you!',
              },
            },
          ],
        }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await generateResponse(
        'How are you?',
        'Book context',
        'System prompt',
        { apiKey: 'test-key' }
      );

      expect(result).toBe('I am doing well, thank you!');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.hathora.dev/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should throw error on failed generation', async () => {
      const mockResponse = {
        ok: false,
        text: async () => 'LLM service error',
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(
        generateResponse('Question', 'Context', 'Prompt', { apiKey: 'test-key' })
      ).rejects.toThrow('LLM failed');
    });
  });

  describe('synthesizeSpeech', () => {
    it('should synthesize speech successfully', async () => {
      const mockAudioBlob = new Blob(['audio'], { type: 'audio/mpeg' });
      const mockResponse = {
        ok: true,
        blob: async () => mockAudioBlob,
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await synthesizeSpeech('Hello world', { apiKey: 'test-key' });

      expect(result).toBe(mockAudioBlob);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.hathora.dev/v1/audio/speech',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should throw error on failed synthesis', async () => {
      const mockResponse = {
        ok: false,
        text: async () => 'TTS service error',
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(
        synthesizeSpeech('Text', { apiKey: 'test-key' })
      ).rejects.toThrow('TTS failed');
    });
  });
});
