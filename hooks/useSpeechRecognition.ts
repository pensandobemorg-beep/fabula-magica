
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Language } from '../contexts/LanguageContext';

// @ts-ignore-next-line
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

interface SpeechRecognitionHookProps {
  language: Language;
  onSubmit: (text: string) => void;
  onSubmission?: () => void;
}

export function useSpeechRecognition({ language, onSubmit, onSubmission }: SpeechRecognitionHookProps) {
  const [isListening, setIsListening] = useState(false);
  const [userInput, setUserInput] = useState('');
  const recognitionRef = useRef<any | null>(null);
  
  useEffect(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }
      
      setUserInput(finalTranscript + interimTranscript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    }

  }, [language]);

  const handleMicPress = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setUserInput('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Speech recognition could not start: ", e);
      }
    }
  }, [isListening]);

  const handleMicRelease = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false); 
        if (userInput.trim()) {
          onSubmit(userInput.trim());
          onSubmission?.();
        }
        setUserInput('');
      } catch (e) {
        console.error("Speech recognition could not stop: ", e);
      }
    }
  }, [isListening, userInput, onSubmit, onSubmission]);

  return {
    userInput,
    isListening,
    handleMicPress,
    handleMicRelease,
    handleUserInputChange: setUserInput,
    isSpeechRecognitionSupported: !!SpeechRecognition,
  };
}