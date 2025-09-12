"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Message } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Loader2, AlertTriangle } from "lucide-react";
import { VoiceRecorder } from "./voice-recorder";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { getAiResponse, getCopingStrategies, getInitialMood } from "@/lib/actions";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { AiVisualizer } from "./ai-visualizer";

const safetyKeywords = ["suicide", "kill myself", "harm myself", "end my life", "hopeless"];

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastBotMessage, setLastBotMessage] = useState("Hello, I'm SEISTA AI. I'm here to listen. How are you feeling today? Use the microphone to talk to me.");
  const [currentMood, setCurrentMood] = useState("neutral");
  const [isPending, startTransition] = useTransition();
  const [showSafetyAlert, setShowSafetyAlert] = useState(false);
  const { speak, cancel, speaking } = useSpeechSynthesis();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);

  const addMessage = (role: "user" | "assistant", content: string) => {
    const newMessage = { id: Date.now().toString(), role, content, timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);
    if (role === "assistant") {
      setLastBotMessage(content);
    }
  };

  const onSpeechEnd = () => {
    setLastBotMessage("");
  }
  
  const handleVoiceSubmit = async (audioBlob: Blob) => {
    setIsRecording(false);
    startTransition(async () => {
        try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result as string;
                addMessage("user", "[Voice Input]");
                const { mood, confidence, text } = await getInitialMood(base64Audio);

                if (text) {
                  const lowercasedText = text.toLowerCase();
                  if (safetyKeywords.some(keyword => lowercasedText.includes(keyword))) {
                    setShowSafetyAlert(true);
                  }
                }
                
                setCurrentMood(mood);
                
                const responseText = await getAiResponse(messages, mood);
                addMessage("assistant", responseText);
                speak({ text: responseText, onEnd: onSpeechEnd });
            };
        } catch (error) {
            toast({
              title: "Error",
              description: "Could not process voice input.",
              variant: "destructive"
            })
            const errorResponse = "Sorry, I had trouble understanding that. Could you try again?";
            addMessage("assistant", errorResponse);
            speak({ text: errorResponse, onEnd: onSpeechEnd });
        }
    });
  }

  const handleGetStrategies = () => {
    startTransition(async () => {
        try {
            const strategies = await getCopingStrategies(messages, currentMood);
            const strategyText = `Here are a few ideas that might help:\n\n${strategies.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
            addMessage("assistant", strategyText);
            speak({ text: strategyText, onEnd: onSpeechEnd });
        } catch (error) {
            toast({
              title: "Error",
              description: "Could not generate coping strategies.",
              variant: "destructive"
            })
            const errorResponse = "I'm having trouble coming up with strategies right now. Let's talk more first.";
            addMessage("assistant", errorResponse);
            speak({ text: errorResponse, onEnd: onSpeechEnd });
        }
    });
  }

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden">
        <AiVisualizer isSpeaking={speaking} isThinking={isPending} isRecording={isRecording} />

        <div className="absolute top-0 right-0 p-4">
            <Button variant="outline" size="sm" onClick={handleGetStrategies} disabled={isPending || speaking}>
                <BrainCircuit className="w-4 h-4 mr-2"/>
                Coping Strategies
            </Button>
        </div>

        <div className="w-full max-w-2xl text-center px-4">
            <p className="text-lg md:text-xl text-foreground/80 min-h-[6em] transition-opacity duration-300"
               style={{ opacity: speaking ? 1 : 0 }}
            >
                {lastBotMessage}
            </p>
        </div>
        
        <div className="absolute bottom-10">
            <VoiceRecorder 
                onAudioSubmit={handleVoiceSubmit} 
                isSpeaking={speaking} 
                stopSpeaking={cancel} 
                disabled={isPending}
                onRecordingChange={setIsRecording}
            />
        </div>
      <SafetyAlertDialog open={showSafetyAlert} onOpenChange={setShowSafetyAlert} />
    </div>
  );
}

function SafetyAlertDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="text-destructive w-6 h-6" />
                        Important: Your Safety Matters
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        It sounds like you are going through a difficult time. Please know that there is help available. For immediate support, please contact a crisis hotline. You are not alone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction asChild>
                        <a href="tel:988">Call 988 (Crisis & Suicide Lifeline)</a>
                    </AlertDialogAction>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
