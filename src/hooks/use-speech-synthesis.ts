"use client";

import { useState, useEffect, useCallback } from 'react';

type SpeechOptions = {
    text: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: SpeechSynthesisVoice;
    onEnd?: () => void;
};

export const useSpeechSynthesis = () => {
    const [speaking, setSpeaking] = useState(false);
    const [supported, setSupported] = useState(false);
    
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            setSupported(true);
        }
    }, []);

    const speak = useCallback((options: SpeechOptions) => {
        if (!supported || speaking) return;

        const { text, rate = 1, pitch = 1, volume = 1, voice, onEnd } = options;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        if (voice) {
            utterance.voice = voice;
        } else {
            const voices = window.speechSynthesis.getVoices();
            // Prefer a Google US English voice if available
            const preferredVoice = voices.find(v => v.name === 'Google US English');
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
        }
        
        utterance.onstart = () => {
            setSpeaking(true);
        };

        utterance.onend = () => {
            setSpeaking(false);
            if (onEnd) onEnd();
        };

        utterance.onerror = (event) => {
            console.error('SpeechSynthesisUtterance.onerror', event);
            setSpeaking(false);
        };
        
        window.speechSynthesis.speak(utterance);
    }, [supported, speaking]);

    const cancel = useCallback(() => {
        if (!supported || !speaking) return;
        window.speechSynthesis.cancel();
        setSpeaking(false);
    }, [supported, speaking]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (supported) {
                window.speechSynthesis.cancel();
            }
        };
    }, [supported]);
    
    return { speak, cancel, speaking, supported };
};
