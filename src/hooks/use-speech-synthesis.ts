
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

const MAX_TEXT_LENGTH = 150; // Max characters per chunk

export const useSpeechSynthesis = (opts?: UseSpeechSynthesisOptions) => {
    const [speaking, setSpeaking] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [supported, setSupported] = useState(false);
    const onEndRef = useRef(opts?.onEnd);
    const utteranceQueueRef = useRef<SpeechSynthesisUtterance[]>([]);

    const populateVoiceList = useCallback(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            const newVoices = window.speechSynthesis.getVoices();
            setVoices(newVoices);
        }
    }, []);
    
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            setSupported(true);
            populateVoiceList();
            window.speechSynthesis.onvoiceschanged = populateVoiceList;
        }

        return () => {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.onvoiceschanged = null;
            }
        }
    }, [populateVoiceList]);

    const processQueue = useCallback(() => {
        if (utteranceQueueRef.current.length > 0) {
            const utterance = utteranceQueueRef.current.shift();
            if (utterance) {
                window.speechSynthesis.speak(utterance);
            }
        } else {
            setSpeaking(false);
            if (onEndRef.current) {
                onEndRef.current();
            }
        }
    }, []);

    const speak = useCallback((options: SpeechOptions) => {
        if (!supported || speaking) return;

        const { text, rate = 1, pitch = 1, volume = 1, voice } = options;
        
        // Cancel any previous speech to prevent overlap
        window.speechSynthesis.cancel();
        utteranceQueueRef.current = [];

        setSpeaking(true);

        const chunks: string[] = [];
        let currentChunk = '';

        const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];

        sentences.forEach(sentence => {
            if ((currentChunk + sentence).length > MAX_TEXT_LENGTH) {
                chunks.push(currentChunk);
                currentChunk = sentence;
            } else {
                currentChunk += sentence;
            }
        });
        if (currentChunk) {
            chunks.push(currentChunk);
        }

        const preferredVoice = 
            voices.find(v => v.lang === 'en-US' && v.name.includes('Google') && !v.name.includes('Male')) || 
            voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
            voices.find(v => v.lang === 'en-US');

        utteranceQueueRef.current = chunks.map(chunk => {
            const utterance = new SpeechSynthesisUtterance(chunk);
            utterance.rate = rate;
            utterance.pitch = pitch;
            utterance.volume = volume;
            
            if (voice) {
                utterance.voice = voice;
            } else if (preferredVoice) {
                utterance.voice = preferredVoice;
            }

            utterance.onend = processQueue;
            utterance.onerror = (event) => {
                console.error('SpeechSynthesisUtterance.onerror', event);
                // Clear queue and stop speaking on error
                utteranceQueueRef.current = [];
                setSpeaking(false);
            };
            return utterance;
        });

        processQueue();

    }, [supported, speaking, voices, processQueue]);

    const cancel = useCallback(() => {
        if (!supported) return;
        utteranceQueueRef.current = [];
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
