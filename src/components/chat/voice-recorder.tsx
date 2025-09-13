"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useToast } from "@/hooks/use-toast";

type Props = {
  onAudioSubmit: (audioBlob: Blob) => void;
  onRecordingChange: (isRecording: boolean) => void;
};

export const VoiceRecorder = forwardRef<{ startRecording: () => void; stopRecording: () => void; }, Props>(
  ({ onAudioSubmit, onRecordingChange }, ref) => {
    const { toast } = useToast();
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    const cleanupStream = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }

    useEffect(() => {
        return () => {
            cleanupStream();
        }
    }, []);

    const stopRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };

    const startRecording = async () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        onRecordingChange(true);

        const options = { mimeType: "audio/webm" };
        const recorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          onRecordingChange(false);
          if(audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            onAudioSubmit(audioBlob);
          }
          audioChunksRef.current = [];
          cleanupStream();
        };
        
        recorder.onerror = (event) => {
            console.error("MediaRecorder error:", event);
            onRecordingChange(false);
            cleanupStream();
        }

        recorder.start();
        
      } catch (err) {
        console.error("Error accessing microphone:", err);
        toast({
            title: "Microphone Error",
            description: "Could not access microphone. Please check permissions.",
            variant: "destructive"
        })
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
