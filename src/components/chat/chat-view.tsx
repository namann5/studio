"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Message } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Bot, BrainCircuit, Loader2, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./message-bubble";
import { VoiceRecorder } from "./voice-recorder";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { getAiResponse, getCopingStrategies, getInitialMood } from "@/lib/actions";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Avatar } from "../ui/avatar";

const safetyKeywords = ["suicide", "kill myself", "harm myself", "end my life", "hopeless"];

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMood, setCurrentMood] = useState("neutral");
  const [isPending, startTransition] = useTransition();
  const [showSafetyAlert, setShowSafetyAlert] = useState(false);
  const { speak, cancel, speaking } = useSpeechSynthesis();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const checkForSafetyAlert = (text: string) => {
    if (safetyKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
      setShowSafetyAlert(true);
    }
  };

  const addMessage = (role: "user" | "assistant", content: string) => {
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), role, content, timestamp: new Date() },
    ]);
  };
  
  const handleVoiceSubmit = async (audioBlob: Blob) => {
    startTransition(async () => {
        try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result as string;
                const { mood, confidence, text } = await getInitialMood(base64Audio);
                checkForSafetyAlert(text);

                setCurrentMood(mood);
                
                const response = await getAiResponse(messages, mood);
                speak({ text: response });
            };
        } catch (error) {
            toast({
              title: "Error",
              description: "Could not process voice input.",
              variant: "destructive"
            })
            const errorResponse = "Sorry, I had trouble understanding that. Could you try again?";
            speak({ text: errorResponse });
        }
    });
  }

  const handleGetStrategies = () => {
    startTransition(async () => {
        try {
            const strategies = await getCopingStrategies(messages, currentMood);
            const strategyText = `Here are a few ideas that might help:\n\n${strategies.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
            speak({ text: strategyText });
        } catch (error) {
            toast({
              title: "Error",
              description: "Could not generate coping strategies.",
              variant: "destructive"
            })
            const errorResponse = "I'm having trouble coming up with strategies right now. Let's talk more first.";
            speak({ text: errorResponse });
        }
    });
  }


  return (
    <div className="h-screen flex flex-col bg-muted/20">
      <header className="p-4 border-b flex items-center justify-between bg-background">
        <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary"/>
            <h1 className="text-xl font-bold font-headline">AI Conversation</h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleGetStrategies} disabled={isPending}>
            <BrainCircuit className="w-4 h-4 mr-2"/>
            Coping Strategies
        </Button>
      </header>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="max-w-4xl mx-auto space-y-6">
            <MessageBubble message={{
                id: '0',
                role: 'assistant',
                content: "Hello, I'm SEISTA AI. I'm here to listen. How are you feeling today? Use the microphone to talk to me.",
                timestamp: new Date()
            }} />
          {isPending && (
            <div className="flex items-start gap-4">
              <Avatar className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </Avatar>
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">SEISTA is thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <footer className="p-4 border-t bg-background">
        <div className="max-w-4xl mx-auto flex justify-center items-center">
          <VoiceRecorder onAudioSubmit={handleVoiceSubmit} isSpeaking={speaking} stopSpeaking={cancel} disabled={isPending} />
        </div>
      </footer>
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
