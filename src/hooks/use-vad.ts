// Inspired by https://github.com/ricky0123/vad/blob/master/examples/web/src/App.tsx
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {MicVAD, utils} from '@ricky0123/vad-web';

const floatTo16BitPCM = (input: Float32Array): Int16Array => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
};

const toWavBlob = (paddles: Int16Array[], sampleRate: number): Blob => {
    const format = 1; // PCM
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = paddles.reduce((acc, val) => acc + val.length * 2, 0);
    const chunkSize = 36 + dataSize;
    
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, chunkSize, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"

    // "fmt " sub-chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // Sub-chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // "data" sub-chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataSize, true);

    // Write PCM data
    let offset = 44;
    for (const pcm of paddles) {
        for (let i = 0; i < pcm.length; i++, offset += 2) {
            view.setInt16(offset, pcm[i], true);
        }
    }

    return new Blob([view], { type: 'audio/wav' });
};


type UseVADOptions = {
    onSpeechEnd: (audio: Blob) => void;
    onVADMisfire: () => void;
    onError?: (e: any) => void;
};

export const useVAD = (options: UseVADOptions) => {
    const [listening, setListening] = useState(false);
    const vadRef = useRef<MicVAD | null>(null);

    const start = useCallback(() => {
        if (vadRef.current) {
            vadRef.current.start();
            setListening(true);
            return;
        }

        MicVAD.new({
            ...options,
            workletURL: '/vad.worklet.bundle.min.js',
            modelURL: '/silero_vad.onnx',
            onSpeechStart: () => {
                // console.log('VAD: Speech started');
            },
            onSpeechEnd: (audio: Float32Array) => {
                const pcm = floatTo16BitPCM(audio);
                const wav = toWavBlob([pcm], 16000);
                options.onSpeechEnd(wav);
            },
        })
        .then(vad => {
            vadRef.current = vad;
            vad.start();
            setListening(true);
        })
        .catch(e => {
            console.error('Failed to create or start VAD', e);
            if (options.onError) {
                options.onError(e);
            }
        });

    }, [options]);

    const stop = () => {
        if (vadRef.current) {
            vadRef.current.destroy();
            vadRef.current = null;
            setListening(false);
        }
    };

    const pause = () => {
        if (vadRef.current) {
            vadRef.current.pause();
            setListening(false);
        }
    };
    
    useEffect(() => {
        return () => {
            if (vadRef.current) {
                vadRef.current.destroy();
            }
        };
    }, []);

    return { start, stop, pause, listening };
};
