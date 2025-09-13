"use client";

import { useVAD as useVADCore } from '@ricky0123/vad-react';
import { useState, useEffect } from 'react';

interface UseVADOptions {
  onSpeechEnd: (audio: Float32Array) => void;
  startOnLoad?: boolean;
}

export function useVAD({ onSpeechEnd, startOnLoad = false }: UseVADOptions) {
  const [isTalking, setIsTalking] = useState(false);

  const vad = useVADCore({
    startOnLoad,
    onSpeechStart: () => {
      setIsTalking(true);
    },
    onSpeechEnd: (audio: Float32Array) => {
      setIsTalking(false);
      onSpeechEnd(audio);
    },
    // Adjust these parameters as needed for responsiveness
    // A lower pauseTime will make it react faster to pauses.
    pauseTime: 1000, // ms
    // The minimum duration of speech to be considered a valid utterance.
    minSpeechFrames: 3,
  });

  // Cleanup: pause VAD when the component unmounts
  useEffect(() => {
    return () => {
      if (vad && !vad.loading) {
        vad.pause();
      }
    };
  }, [vad]);

  return { ...vad, userSpeaking: isTalking };
}
