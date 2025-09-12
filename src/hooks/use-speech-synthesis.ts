
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

type SpeechOptions = {
    text: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: SpeechSynthesisVoice;
};

type UseSpeechSynthesisOptions = {
    onEnd?: () => void;
};


export const useSpeechSynthesis = (opts?: UseSpeechSynthesisOptions) => {
    const [speaking, setSpeaking] = useState(false);
    const [supported, setSupported] = useState(false);
    const onEndRef = useRef(opts?.onEnd);

    useEffect(() => {
        onEndRef.current = opts?.onEnd;
    }, [opts?.onEnd]);
    
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            setSupported(true);
        }
    }, []);

    const speak = useCallback((options: SpeechOptions) => {
        if (!supported || speaking) return;

        const { text, rate = 1, pitch = 1.3, volume = 1, voice } = options;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        if (voice) {
            utterance.voice = voice;
        } else {
            const voices = window.speechSynthesis.getVoices();
            // A different set of voices that often sound more natural or expressive on some browsers.
            const expressiveVoice = voices.find(v => v.lang.startsWith('en-') && (v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Female')));
            
            if (expressiveVoice) {
                utterance.voice = expressiveVoice;
            }
        }
        
        utterance.onstart = () => {
            setSpeaking(true);
        };

        utterance.onend = () => {
            setSpeaking(false);
            if (onEndRef.current) {
                onEndRef.current();
            }
        };

        utterance.onerror = (event) => {
            console.error('SpeechSynthesisUtterance.onerror', event);
            setSpeaking(false);
        };
        
        // Cancel any previous speech to prevent overlap
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }, [supported, speaking]);

    const cancel = useCallback(() => {
        if (!supported) return;
        setSpeaking(false);
        window.speechSynthesis.cancel();
    }, [supported]);

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
