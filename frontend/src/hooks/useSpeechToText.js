import { useState, useEffect, useRef, useCallback } from 'react';

export const useSpeechToText = (options = {}) => {
  const { lang = 'en-US', continuous = false, interimResults = true } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      setError('Web Speech API is not supported in this browser. Please use Chrome, Safari or Edge.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.continuous = continuous;
    rec.interimResults = interimResults;

    rec.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone permission blocked. Please check your browser settings.');
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.');
      } else if (event.error === 'network') {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(`Speech error: ${event.error}`);
      }
      setIsListening(false);
    };

    rec.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else if (interimResults) {
          // Accumulate interim results (active speech visualization)
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(finalTranscript);
      }
    };

    recognitionRef.current = rec;
  }, [lang, continuous, interimResults]);

  const startListening = useCallback(() => {
    if (!supported || !recognitionRef.current) return;
    try {
      setTranscript('');
      setError(null);
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
    }
  }, [supported]);

  const stopListening = useCallback(() => {
    if (!supported || !recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error('Failed to stop speech recognition:', err);
    }
  }, [supported]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    error,
    supported,
    startListening,
    stopListening,
    resetTranscript,
  };
};

export default useSpeechToText;
