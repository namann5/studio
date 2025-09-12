"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Square, VolumeX, Loader2 } from "lucide-react";

type Props = {
  onAudioSubmit: (audioBlob: Blob) => void;
  isSpeaking: boolean;
  stopSpeaking: () => void;
  disabled: boolean;
  onRecordingChange: (isRecording: boolean) => void;
};

export const VoiceRecorder = forwardRef<{ startRecording: () => void; stopRecording: () => void; }, Props>(
  ({ onAudioSubmit, isSpeaking, stopSpeaking, disabled, onRecordingChange }, ref) => {
    const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "processing">("idle");
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
      onRecordingChange(recordingStatus === 'recording');
    }, [recordingStatus, onRecordingChange]);
    
    // Stop recording when component is unmounted
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        }
    }, []);

    const startRecording = async () => {
      if (recordingStatus !== "idle" || isSpeaking) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setRecordingStatus("recording");
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" });
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = () => {
          setRecordingStatus("processing");
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          onAudioSubmit(audioBlob);
          audioChunksRef.current = [];
          setRecordingStatus("idle");
          // Stop all tracks on the stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
        };
        mediaRecorderRef.current.start();
      } catch (err) {
        console.error("Error accessing microphone:", err);
        // You could show a toast notification here
        setRecordingStatus("idle");
      }
    };

    const stopRecording = () => {
      if (mediaRecorderRef.current && recordingStatus === "recording") {
        mediaRecorderRef.current.stop();
      }
    };

    useImperativeHandle(ref, () => ({
      startRecording,
      stopRecording,
    }));

    const handleMicClick = () => {
      if (isSpeaking) {
          stopSpeaking();
          return;
      }
      if (recordingStatus === "idle") {
        startRecording();
      } else {
        stopRecording();
      }
    };
    
    return (
      <Button 
          onClick={handleMicClick} 
          size="icon"
          className="w-20 h-20 rounded-full"
          variant={recordingStatus === "recording" ? "destructive" : "outline"} 
          disabled={disabled || recordingStatus === 'processing'}
      >
        {isSpeaking && <VolumeX className="w-8 h-8" />}
        {!isSpeaking && recordingStatus === "idle" && <Mic className="w-8 h-8" />}
        {!isSpeaking && recordingStatus === "recording" && <Square className="w-8 h-8 animate-pulse" />}
        {!isSpeaking && recordingStatus === "processing" && <Loader2 className="w-8 h-8 animate-spin" />}
      </Button>
    );
  }
);
VoiceRecorder.displayName = "VoiceRecorder";
