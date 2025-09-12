"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Image from "next/image";
import { Message } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BrainCircuit, AlertTriangle, Play, Square } from "lucide-react";
import { VoiceRecorder } from "./voice-recorder";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { getAiResponse, getCopingStrategies, getInitialMood } from "@/lib/actions";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const safetyKeywords = ["suicide", "kill myself", "harm myself", "end my life", "hopeless"];

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionState, setSessionState] = useState<"idle" | "active" | "stopped">("idle");
  const [lastBotMessage, setLastBotMessage] = useState("Hey, it's me. I'm here and ready to listen. Tell me everything that's on your mind.");
  const [currentMood, setCurrentMood] = useState("neutral");
  const [isPending, startTransition] = useTransition();
  const [showSafetyAlert, setShowSafetyAlert] = useState(false);
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  
  const voiceRecorderRef = useRef<{ startRecording: () => void; stopRecording: () => void }>(null);

  const onSpeechEnd = () => {
    if (sessionState === "active" && voiceRecorderRef.current) {
      voiceRecorderRef.current.startRecording();
    }
  }
  
  const { speak, cancel, speaking } = useSpeechSynthesis({ onEnd: onSpeechEnd });

  const startConversation = () => {
    setSessionState("active");
    speak({ text: lastBotMessage });
  };
  
  const endConversation = () => {
      cancel();
      if (voiceRecorderRef.current) {
          voiceRecorderRef.current.stopRecording();
      }
      setSessionState("stopped");
      setLastBotMessage("Our session has ended. Press 'Start' to begin again whenever you're ready.");
  }

  const addMessage = (role: "user" | "assistant", content: string) => {
    const newMessage = { id: Date.now().toString(), role, content, timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);
    if (role === "assistant") {
      setLastBotMessage(content);
    }
  };
  
  const handleVoiceSubmit = async (audioBlob: Blob) => {
    setIsRecording(false);
    if (sessionState !== 'active') return;

    startTransition(async () => {
        try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result as string;
                addMessage("user", "[Voice Input]");
                const { mood, confidence, transcription } = await getInitialMood(base64Audio);

                if (transcription) {
                  const lowercasedText = transcription.toLowerCase();
                  if (safetyKeywords.some(keyword => lowercasedText.includes(keyword))) {
                    setShowSafetyAlert(true);
                  }
                }
                
                setCurrentMood(mood);
                
                const responseText = await getAiResponse(messages, mood);
                addMessage("assistant", responseText);
                speak({ text: responseText });
            };
        } catch (error) {
            toast({
              title: "Error",
              description: "Could not process voice input.",
              variant: "destructive"
            })
            const errorResponse = "Sorry, I had trouble understanding that. Could you try again?";
            addMessage("assistant", errorResponse);
            speak({ text: errorResponse });
        }
    });
  }

  const handleGetStrategies = () => {
    if (speaking) cancel();
    startTransition(async () => {
        try {
            const strategies = await getCopingStrategies(messages, currentMood);
            const strategyText = `Here are a few ideas that might help:\n\n${strategies.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
            addMessage("assistant", strategyText);
            speak({ text: strategyText });
        } catch (error) {
            toast({
              title: "Error",
              description: "Could not generate coping strategies.",
              variant: "destructive"
            })
            const errorResponse = "I'm having trouble coming up with strategies right now. Let's talk more first.";
            addMessage("assistant", errorResponse);
            speak({ text: errorResponse });
        }
    });
  }

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden">
        <div className="relative w-64 h-64">
          <Image 
            src="/seista.jpeg"
            alt="AI Assistant"
            width={256}
            height={256}
            className={cn(
              "rounded-full object-cover shadow-lg transition-transform duration-500",
              speaking ? "scale-110" : "scale-100",
              isRecording ? "ring-4 ring-primary ring-offset-4 ring-offset-background" : "",
              isPending ? "animate-pulse" : ""
            )}
            priority
          />
        </div>

        <div className="absolute top-0 right-0 p-4">
            <Button variant="outline" size="sm" onClick={handleGetStrategies} disabled={isPending || speaking || sessionState !== 'active'}>
                <BrainCircuit className="w-4 h-4 mr-2"/>
                Coping Strategies
            </Button>
        </div>

        <div className="w-full max-w-2xl text-center px-4 mt-8">
            <p className="text-lg md:text-xl text-foreground/80 min-h-[6em] transition-opacity duration-300">
                {lastBotMessage}
            </p>
        </div>
        
        <div className="absolute bottom-10 flex flex-col items-center gap-4">
            {sessionState === "idle" && (
                <Button onClick={startConversation} size="lg" className="rounded-full">
                    <Play className="mr-2" /> Start Conversation
                </Button>
            )}
            {sessionState === "active" && (
                <>
                 <VoiceRecorder 
                    ref={voiceRecorderRef}
                    onAudioSubmit={handleVoiceSubmit} 
                    isSpeaking={speaking} 
                    disabled={isPending}
                    onRecordingChange={setIsRecording}
                 />
                 <Button onClick={endConversation} variant="destructive" size="sm">
                    <Square className="mr-2" /> End Conversation
                 </Button>
                </>
            )}
             {sessionState === "stopped" && (
                <Button onClick={() => window.location.reload()} size="lg" className="rounded-full">
                    <Play className="mr-2" /> Start New Session
                </Button>
            )}
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
