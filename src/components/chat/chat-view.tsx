"use client";

import { useState, useRef, useTransition, useCallback, useEffect } from "react";
import Image from "next/image";
import { Message } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BrainCircuit, AlertTriangle, Play, Square, Mic, Loader, Power } from "lucide-react";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { getAiResponse, getCopingStrategies, getInitialMood } from "@/lib/actions";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useVAD } from "@ricky0123/vad-react";

const safetyKeywords = ["suicide", "kill myself", "harm myself", "end my life", "hopeless"];

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionState, setSessionState] = useState<"idle" | "listening" | "processing" | "speaking">("idle");
  const [lastBotMessage, setLastBotMessage] = useState("Greetings. Speak, and I shall listen.");
  const [currentMood, setCurrentMood] = useState("calm");
  const [isPending, startTransition] = useTransition();
  const [showSafetyAlert, setShowSafetyAlert] = useState(false);
  const { toast } = useToast();
  
  const aiAvatar = PlaceHolderImages.find(img => img.id === 'ai-avatar');

  const { speak, cancel, speaking } = useSpeechSynthesis({
    onEnd: () => {
      setSessionState(current => (current === 'speaking' ? 'listening' : current));
    },
  });

  const vad = useVAD({
    onSpeechEnd: (audio) => {
      if (sessionState === 'listening') {
        const audioBlob = new Blob([audio], { type: 'audio/webm' });
        handleVoiceSubmit(audioBlob);
      }
    },
    startOnLoad: false,
  });

  useEffect(() => {
    if (speaking && sessionState !== 'speaking') {
      setSessionState("speaking");
    } else if (!speaking && sessionState === 'speaking' && vad.listening) {
      setSessionState('listening');
    }
  }, [speaking, sessionState, vad.listening]);

  const addMessage = useCallback((role: "user" | "assistant", content: string) => {
    const newMessage = { id: Date.now().toString(), role, content, timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);
    if (role === "assistant") {
      setLastBotMessage(content);
      vad.pause();
      speak({ text: content });
    }
  }, [speak, vad]);

  const handleAiResponse = useCallback(async (transcription: string) => {
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: transcription, timestamp: new Date() };
    const currentHistory = [...messages, userMessage];
    setMessages(prev => [...prev, userMessage]);
  
    startTransition(async () => {
      try {
        const responseText = await getAiResponse(currentHistory, currentMood);
        addMessage("assistant", responseText);
      } catch(error) {
        console.error("Error getting AI response:", error);
        toast({
          title: "Response Error",
          description: "There was an error generating a response.",
          variant: "destructive"
        });
        const errorResponse = "Apologies. My response systems encountered an error. Please try again.";
        addMessage("assistant", errorResponse);
      } finally {
        vad.start();
      }
    });
  }, [messages, currentMood, addMessage, toast, vad]);

  const startConversation = () => {
    vad.start();
    setSessionState("listening");
    const greeting = "Greetings. Speak, and I shall listen.";
    addMessage("assistant", greeting);
  };
  
  const endConversation = () => {
    if (speaking) cancel();
    vad.pause();
    setSessionState("idle");
    setLastBotMessage("Session ended. Have a good day.");
  }

  const handleVoiceSubmit = (audioBlob: Blob) => {
    if (sessionState !== 'listening') return;
    setSessionState("processing");

    startTransition(async () => {
        try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result as string;
                
                const { mood, transcription } = await getInitialMood(base64Audio);

                if (transcription) {
                  const lowercasedText = transcription.toLowerCase();
                  if (safetyKeywords.some(keyword => lowercasedText.includes(keyword))) {
                    setShowSafetyAlert(true);
                  }
                  setCurrentMood(mood);
                  await handleAiResponse(transcription);
                } else {
                   const errorResponse = "It seems I'm still not detecting any speech. Please know I'm here and ready to listen whenever you're ready to share, with no pressure at all.";
                   addMessage("assistant", errorResponse);
                }
            };
        } catch (error) {
            console.error("Error Processing Voice", error);
            toast({
              title: "Audio Processing Error",
              description: "There was an issue processing your audio.",
              variant: "destructive"
            })
            const errorResponse = "My apologies. My sensors encountered an anomaly. Please try again.";
            addMessage("assistant", errorResponse);
        }
    });
  }

  const handleGetStrategies = () => {
    if (speaking) cancel();
    vad.pause();
    setSessionState("processing");
    startTransition(async () => {
        try {
            const strategies = await getCopingStrategies(messages, currentMood);
            const strategyText = `Of course. Here are some new strategies to practice based on your current state:\n\n${strategies.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
            addMessage("assistant", strategyText);
        } catch (error) {
            toast({
              title: "Strategy Failed",
              description: "Could not generate new strategies.",
              variant: "destructive"
            })
            const errorResponse = "I'm afraid I cannot generate new techniques at this time. Please try again later.";
            addMessage("assistant", errorResponse);
        } finally {
            vad.start();
        }
    });
  }

  const isListening = sessionState === 'listening';
  const isProcessing = sessionState === 'processing';
  const isSpeaking = sessionState === 'speaking';
  const isSessionActive = sessionState !== 'idle';
  const isUserSpeaking = vad.userSpeaking;
  
  const getStatusText = () => {
    if (sessionState === 'idle') return "Press 'Begin Session' to start.";
    if (isProcessing) return "Processing...";
    if (isSpeaking) return lastBotMessage;
    if (isListening && isUserSpeaking) return "I'm listening...";
    if (isListening && !isUserSpeaking) return "I'm ready, speak whenever you are.";
    return lastBotMessage;
  };

  const getAvatarClass = () => {
    if (isSpeaking) return "shadow-[0_0_40px_8px_hsl(var(--primary))]";
    if (isProcessing || isPending) return "scale-110 shadow-[0_0_50px_10px_hsl(var(--accent))] animate-pulse";
    if (isListening && isUserSpeaking) return "scale-105 shadow-[0_0_25px_4px_hsl(var(--secondary))]";
    return "";
  };
  
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        
        {vad.loading && (
          <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-20">
              <Loader className="w-12 h-12 text-primary animate-spin" />
              <p className="mt-4 text-lg text-primary/80 font-mono">Loading AI Sensors...</p>
          </div>
        )}

        <div className="relative w-64 h-64">
          {aiAvatar && (
            <Image 
              src={aiAvatar.imageUrl}
              alt={aiAvatar.description}
              width={256}
              height={256}
              className={cn(
                "rounded-full object-cover shadow-lg transition-all duration-300 ease-in-out",
                getAvatarClass()
              )}
              priority
              data-ai-hint={aiAvatar.imageHint}
            />
          )}
        </div>

        <div className="absolute top-0 right-0 p-4">
            <Button variant="outline" size="sm" onClick={handleGetStrategies} disabled={!isSessionActive || isProcessing || isSpeaking}>
                <BrainCircuit className="w-4 h-4 mr-2"/>
                New Strategies
            </Button>
        </div>

        <div className="w-full max-w-2xl text-center px-4 mt-8 relative">
            <p className="text-lg md:text-xl text-primary/80 min-h-[4em] transition-opacity duration-300 font-mono">
                {getStatusText()}
            </p>
        </div>
        
        <div className="absolute bottom-10 flex flex-col items-center gap-4">
            {!isSessionActive ? (
                <Button onClick={startConversation} size="lg" className="rounded-full">
                    <Play className="mr-2" /> Begin Session
                </Button>
            ) : (
                <Button onClick={endConversation} variant="destructive" size="lg" className="rounded-full">
                    <Power className="mr-2" /> End Session
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
                        Important Alert
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        It sounds like you are in significant distress. Please know that help is available. You can connect with a crisis support line to talk to someone. You do not have to go through this alone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction asChild>
                        <a href="tel:988">Contact Support: 988</a>
                    </AlertDialogAction>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Dismiss</Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
