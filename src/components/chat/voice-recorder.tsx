"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Mic, MicOff, Square, VolumeX, Loader2 } from "lucide-react";

type Props = {
  onAudioSubmit: (audioBlob: Blob) => void;
  isSpeaking: boolean;
  disabled: boolean;
  onRecordingChange: (isRecording: boolean) => void;
};

const SILENCE_THRESHOLD = 1000; // ms of silence to end recording

export const VoiceRecorder = forwardRef<{ startRecording: () => void; stopRecording: () => void; }, Props>(
  ({ onAudioSubmit, isSpeaking, disabled, onRecordingChange }, ref) => {
    const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "processing">("idle");
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);

    useEffect(() => {
      onRecordingChange(recordingStatus === 'recording');
    }, [recordingStatus, onRecordingChange]);
    
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
            }
            if (audioContextRef.current && audioContextRef.current.state !== "closed") {
              audioContextRef.current.close();
            }
        }
    }, []);

    const stopRecording = () => {
      if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
      }
      setRecordingStatus("idle");
    };

    const detectSilence = () => {
      if (analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
          const isSilent = dataArrayRef.current.every(v => v === 128);
          if (isSilent) {
              if (!silenceTimerRef.current) {
                  silenceTimerRef.current = setTimeout(stopRecording, SILENCE_THRESHOLD);
              }
          } else {
              if (silenceTimerRef.current) {
                  clearTimeout(silenceTimerRef.current);
                  silenceTimerRef.current = null;
              }
          }
      }
      if (mediaRecorderRef.current?.state === 'recording') {
        requestAnimationFrame(detectSilence);
      }
    }

    const startRecording = async () => {
      if (recordingStatus !== "idle" || isSpeaking) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setRecordingStatus("recording");
        
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 2048;
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);

        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" });
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        mediaRecorderRef.current.onstop = () => {
          setRecordingStatus("processing");
          if(audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            onAudioSubmit(audioBlob);
          }
          audioChunksRef.current = [];
          setRecordingStatus("idle");
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
        };
        mediaRecorderRef.current.start();
        requestAnimationFrame(detectSilence);

      } catch (err) {
        console.error("Error accessing microphone:", err);
        setRecordingStatus("idle");
      }
    };

    useImperativeHandle(ref, () => ({
      startRecording,
      stopRecording,
    }));

    return null; // This component no longer renders a button
  }
);
VoiceRecorder.displayName = "VoiceRecorder";
