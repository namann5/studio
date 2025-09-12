"use client";

import { cn } from "@/lib/utils";
import { Bot, Mic, Loader2 } from "lucide-react";

type AiVisualizerProps = {
  isSpeaking: boolean;
  isThinking: boolean;
  isRecording: boolean;
};

export function AiVisualizer({ isSpeaking, isThinking, isRecording }: AiVisualizerProps) {
  const state = isSpeaking ? "speaking" : isThinking ? "thinking" : isRecording ? "recording" : "idle";

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      <div
        className={cn(
          "absolute inset-0 rounded-full bg-primary/10 transition-all duration-500",
          {
            "scale-100": state === "idle",
            "scale-110 animate-pulse": state === "speaking",
            "scale-95 border-2 border-dashed border-primary": state === "thinking",
            "scale-105 border-2 border-destructive": state === "recording",
          }
        )}
      />
      <div
        className={cn(
          "absolute inset-4 rounded-full bg-primary/20 transition-all duration-500",
           {
            "scale-100": state === "idle",
            "scale-105 animate-pulse delay-100": state === "speaking",
            "scale-95": state === "thinking",
            "scale-100": state === "recording",
          }
        )}
      />
      <div className="relative flex items-center justify-center w-40 h-40 rounded-full bg-background shadow-lg">
        {state === 'thinking' && <Loader2 className="w-12 h-12 text-primary animate-spin" />}
        {state === 'speaking' && <Bot className="w-12 h-12 text-primary" />}
        {state === 'recording' && <Mic className="w-12 h-12 text-destructive" />}
        {state === 'idle' && <Bot className="w-12 h-12 text-primary/50" />}
      </div>
    </div>
  );
}
