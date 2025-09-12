"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Square, VolumeX, Loader2 } from "lucide-react";

type Props = {
  onAudioSubmit: (audioBlob: Blob) => void;
  isSpeaking: boolean;
  stopSpeaking: () => void;
  disabled: boolean;
  onRecordingChange: (isRecording: boolean) => void;
};

export function VoiceRecorder({ onAudioSubmit, isSpeaking, stopSpeaking, disabled, onRecordingChange }: Props) {
  const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "processing">("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    onRecordingChange(recordingStatus === 'recording');
  }, [recordingStatus, onRecordingChange]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        stream.getTracks().forEach(track => track.stop());
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
        disabled={disabled}
    >
      {isSpeaking && <VolumeX className="w-8 h-8" />}
      {!isSpeaking && recordingStatus === "idle" && <Mic className="w-8 h-8" />}
      {!isSpeaking && recordingStatus === "recording" && <Square className="w-8 h-8 animate-pulse" />}
      {!isSpeaking && recordingStatus === "processing" && <Loader2 className="w-8 h-8 animate-spin" />}
    </Button>
  );
}
