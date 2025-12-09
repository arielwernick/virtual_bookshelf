'use client';

import { useState, useRef, useEffect } from 'react';
import { BOOK_METADATA, INTRODUCTION } from '@/lib/data/winnie-the-pooh';

interface Message {
  role: 'user' | 'book';
  text: string;
  audioUrl?: string;
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'speaking';

export default function TalkToBookPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Request microphone permission on mount
  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately, we just wanted to check permission
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('Microphone permission error:', err);
      setError('Microphone access is required. Please grant permission.');
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try to use the best available audio format
      let mimeType = 'audio/webm';
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      console.log('Using MIME type:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('Audio recorded:', {
          size: audioBlob.size,
          type: audioBlob.type,
          chunks: audioChunksRef.current.length,
        });
        stream.getTracks().forEach(track => track.stop());
        
        // Validate audio size (must be at least 1KB)
        if (audioBlob.size < 1000) {
          setError('Recording too short. Please hold the button longer and speak clearly.');
          setRecordingState('idle');
          return;
        }
        
        await processAudio(audioBlob);
      };

      // Start recording with timeslice to ensure we get data chunks
      mediaRecorder.start(100); // Request data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      setRecordingState('recording');
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please check microphone permissions.');
      setRecordingState('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecordingState('processing');
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      setRecordingState('processing');

      console.log('Sending audio to API:', {
        size: audioBlob.size,
        type: audioBlob.type,
      });

      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await fetch('/api/talk-to-book', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to process audio');
      }

      // Get JSON response with transcript, response text, and audio
      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error('Invalid response from server');
      }

      const { transcript, responseText, audio } = data.data;

      // Convert base64 audio to blob
      const audioBytes = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
      const audioResponseBlob = new Blob([audioBytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioResponseBlob);

      // Add user's question
      const userMessage: Message = {
        role: 'user',
        text: transcript,
      };

      // Add book's response
      const bookMessage: Message = {
        role: 'book',
        text: responseText,
        audioUrl,
      };

      setMessages(prev => [...prev, userMessage, bookMessage]);
      
      // Play the audio response
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        setRecordingState('speaking');
        audioRef.current.play();
      }
    } catch (err) {
      console.error('Error processing audio:', err);
      setError(err instanceof Error ? err.message : 'Failed to process audio');
      setRecordingState('idle');
    }
  };

  const handleAudioEnded = () => {
    setRecordingState('idle');
  };

  const handleMouseDown = () => {
    if (recordingState === 'idle') {
      startRecording();
    }
  };

  const handleMouseUp = () => {
    if (recordingState === 'recording') {
      stopRecording();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (recordingState === 'idle') {
      startRecording();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (recordingState === 'recording') {
      stopRecording();
    }
  };

  const getButtonText = () => {
    switch (recordingState) {
      case 'recording':
        return '🎙️ Recording... (Release to send)';
      case 'processing':
        return '⏳ Processing...';
      case 'speaking':
        return '🔊 Speaking...';
      default:
        return '🎤 Hold to ask a question';
    }
  };

  const isButtonDisabled = recordingState === 'processing' || recordingState === 'speaking';

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            📖 Talk to This Book
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Have a conversation with a classic
          </p>
        </div>

        {/* Book Display */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Book Cover */}
            <div className="flex-shrink-0">
              <img
                src={BOOK_METADATA.coverImage}
                alt={BOOK_METADATA.title}
                className="w-48 h-64 object-cover rounded-lg shadow-lg"
              />
            </div>

            {/* Book Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {BOOK_METADATA.title}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                {BOOK_METADATA.author}, {BOOK_METADATA.year}
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded">
                <p className="text-gray-700 dark:text-gray-300 italic">
                  {INTRODUCTION}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Conversation Area */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 min-h-[300px]">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
              <p className="text-center">
                Press and hold the microphone button to start a conversation
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xl">
                        {message.role === 'user' ? '👤' : '📖'}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">
                          {message.role === 'user' ? 'You' : 'Book'}
                        </p>
                        <p>{message.text}</p>
                        {message.audioUrl && (
                          <button
                            onClick={() => {
                              if (audioRef.current) {
                                audioRef.current.src = message.audioUrl!;
                                audioRef.current.play();
                              }
                            }}
                            className="mt-2 flex items-center gap-1 text-sm hover:underline"
                          >
                            <span>🔊</span>
                            <span>Play again</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200 text-sm">
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* Recording Button */}
        <div className="flex justify-center">
          <button
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            disabled={isButtonDisabled}
            className={`px-8 py-4 rounded-full text-lg font-semibold shadow-lg transition-all transform active:scale-95 ${
              recordingState === 'recording'
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                : isButtonDisabled
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-xl'
            }`}
          >
            {getButtonText()}
          </button>
        </div>

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          onEnded={handleAudioEnded}
          className="hidden"
        />

        {/* Instructions */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Press and hold the button to record your question.</p>
          <p className="mt-1">Release to send and hear the book&apos;s response.</p>
        </div>
      </div>
    </div>
  );
}
