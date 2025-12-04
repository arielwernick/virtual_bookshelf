export interface RecordingState {
  isSupported: boolean;
  isRecording: boolean;
  error?: string;
}

export function useAudioRecorder() {
  let mediaRecorder: MediaRecorder | null = null;
  const chunks: BlobPart[] = [];
  const state: RecordingState = {
    isSupported: typeof window !== 'undefined' && !!navigator.mediaDevices,
    isRecording: false,
  };

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunks.length = 0;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.start();
      state.isRecording = true;
    } catch (err) {
      state.error = 'Microphone permission denied or unsupported.';
      state.isRecording = false;
    }
  }

  async function stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!mediaRecorder) return resolve(null);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        resolve(blob);
      };
      mediaRecorder.stop();
      state.isRecording = false;
    });
  }

  return { state, start, stop };
}
