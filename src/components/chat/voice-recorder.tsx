"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";

type Props = {
  onAudioSubmit: (audioBlob: Blob) => void;
  onRecordingChange: (isRecording: boolean) => void;
};

export const VoiceRecorder = forwardRef<{ startRecording: () => void; stopRecording: () => void; }, Props>(
  ({ onAudioSubmit, onRecordingChange }, ref) => {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        }
    }, []);

    const stopRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        onRecordingChange(true);

        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" });
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = () => {
          onRecordingChange(false);
          if(audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            onAudioSubmit(audioBlob);
          }
          audioChunksRef.current = [];
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
        };

        mediaRecorderRef.current.start();
        
        // Automatically stop recording after a set time to prevent indefinite recording
        setTimeout(() => {
          if (mediaRecorderRef.current?.state === 'recording') {
            stopRecording();
          }
        }, 7000); // Stop after 7 seconds of recording

      } catch (err) {
        console.error("Error accessing microphone:", err);
        onRecordingChange(false);
      }
    };

    useImperativeHandle(ref, () => ({
      startRecording,
      stopRecording,
    }));

    return null; // This component does not render any UI itself
  }
);
VoiceRecorder.displayName = "VoiceRecorder";
