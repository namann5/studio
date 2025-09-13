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

    useEffect(() => {
        onEndRef.current = opts?.onEnd;
    }, [opts?.onEnd]);

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
                window.speechSynthesis.cancel();
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
        
        window.speechSynthesis.cancel();
        utteranceQueueRef.current = [];

        setSpeaking(true);

        const chunks: string[] = [];
        let currentText = text;

        if (text.length > MAX_TEXT_LENGTH) {
            const sentences = text.match(/[^.!?]+[.!?]*|[^,]+,*/g) || [];
            let currentChunk = "";
            for (const sentence of sentences) {
                if (currentChunk.length + sentence.length <= MAX_TEXT_LENGTH) {
                    currentChunk += sentence;
                } else {
                    chunks.push(currentChunk);
                    currentChunk = sentence;
                }
            }
            if (currentChunk) {
                chunks.push(currentChunk);
            }
        } else {
            chunks.push(text);
        }
        

        const preferredVoice = 
            voice ||
            voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
            voices.find(v => v.lang.startsWith('en') && v.name.includes('Microsoft')) ||
            voices.find(v => v.lang.startsWith('en'));

        utteranceQueueRef.current = chunks.map(chunk => {
            const utterance = new SpeechSynthesisUtterance(chunk.trim());
            utterance.rate = rate;
            utterance.pitch = pitch;
            utterance.volume = volume;
            
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }

            utterance.onend = processQueue;
            utterance.onerror = (event) => {
                console.error('SpeechSynthesisUtterance.onerror', event);
                utteranceQueueRef.current = [];
                setSpeaking(false);
                processQueue(); // Try to process next chunk or end
            };
            return utterance;
        });

        processQueue();

    }, [supported, speaking, voices, processQueue]);

    const cancel = useCallback(() => {
        if (!supported) return;
        utteranceQueueRef.current = [];
        window.speechSynthesis.cancel();
        setSpeaking(false);
    }, [supported]);
    
    return { speak, cancel, speaking, supported, voices };
};
