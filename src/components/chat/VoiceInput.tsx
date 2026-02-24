import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Send, X } from 'lucide-react';

// ---- Types ----

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

// ---- Waveform Animation ----

function WaveformAnimation() {
  return (
    <div className="flex items-center gap-0.5 h-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="w-0.5 bg-red-400 rounded-full animate-pulse"
          style={{
            height: `${8 + Math.random() * 12}px`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${0.4 + Math.random() * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
}

// ---- Main Component ----

export default function VoiceInput({ onTranscript, disabled }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    setIsSupported(supported);
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setIsRecording(false);
    setInterimTranscript('');
  }, []);

  const startRecording = useCallback(() => {
    if (!isSupported || disabled) return;

    const recognition = createRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalText = '';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + ' ';
          setTranscript(finalText.trim());
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimTranscript(interim);

      // Reset silence timer — auto-send after 2s of silence
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (finalText.trim()) {
          onTranscript(finalText.trim());
          setTranscript('');
          stopRecording();
        }
      }, 2000);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      stopRecording();
    };

    recognition.onend = () => {
      // If still supposed to be recording, restart (browser may stop it)
      if (recognitionRef.current === recognition && isRecording) {
        try {
          recognition.start();
        } catch {
          stopRecording();
        }
      }
    };

    recognition.start();
    setIsRecording(true);
    setTranscript('');
    setInterimTranscript('');
  }, [isSupported, disabled, onTranscript, stopRecording, isRecording]);

  const handleSend = useCallback(() => {
    if (transcript.trim()) {
      onTranscript(transcript.trim());
      setTranscript('');
      stopRecording();
    }
  }, [transcript, onTranscript, stopRecording]);

  const handleCancel = useCallback(() => {
    setTranscript('');
    stopRecording();
  }, [stopRecording]);

  if (!isSupported) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Recording overlay */}
      {isRecording && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <WaveformAnimation />
          <div className="text-xs max-w-[200px] truncate">
            {transcript || interimTranscript ? (
              <span>
                <span className="text-foreground">{transcript}</span>
                <span className="text-muted italic">{interimTranscript}</span>
              </span>
            ) : (
              <span className="text-muted">Listening...</span>
            )}
          </div>
          {transcript && (
            <button
              onClick={handleSend}
              className="p-1 rounded-md hover:bg-accent/20 text-accent transition-colors"
              title="Send"
            >
              <Send size={12} />
            </button>
          )}
          <button
            onClick={handleCancel}
            className="p-1 rounded-md hover:bg-red-500/20 text-red-400 transition-colors"
            title="Cancel"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Mic button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
        className={`p-2 rounded-lg transition-all duration-200 ${
          isRecording
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            : 'text-muted hover:text-foreground hover:bg-muted/10'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isRecording ? 'Stop recording' : 'Voice input'}
      >
        {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
      </button>
    </div>
  );
}

// ---- Helpers ----

/* eslint-disable @typescript-eslint/no-explicit-any */
function createRecognition(): any {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!SR) return null;
  return new SR();
}
