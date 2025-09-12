"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Image from "next/image";
import { Message } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BrainCircuit, AlertTriangle } from "lucide-react";
import { VoiceRecorder } from "./voice-recorder";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { getAiResponse, getCopingStrategies, getInitialMood } from "@/lib/actions";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const safetyKeywords = ["suicide", "kill myself", "harm myself", "end my life", "hopeless"];

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastBotMessage, setLastBotMessage] = useState("Hey, it's me. I'm here and ready to listen. Tell me everything that's on your mind.");
  const [currentMood, setCurrentMood] = useState("neutral");
  const [isPending, startTransition] = useTransition();
  const [showSafetyAlert, setShowSafetyAlert] = useState(false);
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  
  const voiceRecorderRef = useRef<{ startRecording: () => void; stopRecording: () => void }>(null);

  const onSpeechEnd = () => {
    setLastBotMessage("");
    voiceRecorderRef.current?.startRecording();
  }
  
  const { speak, cancel, speaking } = useSpeechSynthesis({ onEnd: onSpeechEnd });

  useEffect(() => {
    speak({ text: lastBotMessage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addMessage = (role: "user" | "assistant", content: string) => {
    const newMessage = { id: Date.now().toString(), role, content, timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);
    if (role === "assistant") {
      setLastBotMessage(content);
    }
  };
  
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
            src="/siesta.jpg"
            alt="AI Assistant"
            width={256}
            height={256}
            className={cn(
              "rounded-full object-cover shadow-lg transition-transform duration-500",
              speaking ? "scale-110" : "scale-100",
              isPending ? "animate-pulse" : ""
            )}
            priority
          />
        </div>

        <div className="absolute top-0 right-0 p-4">
            <Button variant="outline" size="sm" onClick={handleGetStrategies} disabled={isPending || speaking}>
                <BrainCircuit className="w-4 h-4 mr-2"/>
                Coping Strategies
            </Button>
        </div>

        <div className="w-full max-w-2xl text-center px-4 mt-8">
            <p className="text-lg md:text-xl text-foreground/80 min-h-[6em] transition-opacity duration-300"
               style={{ opacity: speaking || isPending ? 1 : 0 }}
            >
                {lastBotMessage}
            </p>
        </div>
        
        <div className="absolute bottom-10 opacity-0 pointer-events-none">
            <VoiceRecorder 
                ref={voiceRecorderRef}
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
