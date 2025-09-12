"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Square, Volume2, VolumeX, Loader2 } from "lucide-react";

type Props = {
  onAudioSubmit: (audioBlob: Blob) => void;
  isSpeaking: boolean;
  stopSpeaking: () => void;
  disabled: boolean;
};

export function VoiceRecorder({ onAudioSubmit, isSpeaking, stopSpeaking, disabled }: Props) {
  const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "processing">("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setRecordingStatus("recording");
      mediaRecorderRef.current = new MediaRecorder(stream);
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
    if (recordingStatus === "idle") {
      startRecording();
    } else {
      stopRecording();
    }
  };
  
  if (isSpeaking) {
    return (
        <Button onClick={stopSpeaking} size="icon" variant="destructive">
            <VolumeX className="w-5 h-5" />
        </Button>
    )
  }

  return (
    <Button onClick={handleMicClick} size="icon" variant={recordingStatus === "recording" ? "destructive" : "outline"} disabled={disabled}>
      {recordingStatus === "idle" && <Mic className="w-5 h-5" />}
      {recordingStatus === "recording" && <Square className="w-5 h-5 animate-pulse" />}
      {recordingStatus === "processing" && <Loader2 className="w-5 h-5 animate-spin" />}
    </Button>
  );
}
