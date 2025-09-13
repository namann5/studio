"use client";

import { useState, useRef, useTransition, useCallback } from "react";
import Image from "next/image";
import { Message } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BrainCircuit, AlertTriangle, Play, Square, Mic } from "lucide-react";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { getAiResponse, getCopingStrategies, getInitialMood } from "@/lib/actions";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const safetyKeywords = ["suicide", "kill myself", "harm myself", "end my life", "hopeless"];

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionState, setSessionState] = useState<"idle" | "active" | "stopped">("idle");
  const [lastBotMessage, setLastBotMessage] = useState("Greetings. I am your AI Sensei. How can I help you today?");
  const [currentMood, setCurrentMood] = useState("calm");
  const [isPending, startTransition] = useTransition();
  const [showSafetyAlert, setShowSafetyAlert] = useState(false);
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const aiAvatar = PlaceHolderImages.find(img => img.id === 'ai-avatar');

  const addMessage = useCallback((role: "user" | "assistant", content: string) => {
    const newMessage = { id: Date.now().toString(), role, content, timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);
    if (role === "assistant") {
      setLastBotMessage(content);
    }
  }, []);

  const handleAiResponse = useCallback(async (transcription: string) => {
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: transcription, timestamp: new Date() };
    const currentHistory = [...messages, userMessage];
    setMessages(prev => [...prev, userMessage]);
  
    startTransition(async () => {
      try {
        const responseText = await getAiResponse(currentHistory, currentMood);
        addMessage("assistant", responseText);
        speak({ text: responseText });
      } catch(error) {
        console.error("Error getting AI response:", error);
        toast({
          title: "Jutsu Failed",
          description: "There was a failure in the response matrix.",
          variant: "destructive"
        });
        const errorResponse = "Apologies, young one. My connection to the spirit world is weak. Could you repeat that?";
        addMessage("assistant", errorResponse);
        speak({ text: errorResponse });
      }
    });
  }, [messages, currentMood, addMessage]);


  const { speak, cancel, speaking } = useSpeechSynthesis({
    onEnd: () => {},
  });

  const startConversation = () => {
    setSessionState("active");
    speak({ text: lastBotMessage });
  };
  
  const endConversation = () => {
    cancel();
    if(isRecording) {
      stopRecording();
    }
    setSessionState("stopped");
    setLastBotMessage("Session ended. Rest well, shinobi.");
  }

  const handleVoiceSubmit = (audioBlob: Blob) => {
    if (sessionState !== 'active') return;

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
                   const errorResponse = "Forgive me, young one. My senses were clouded for a moment. Could you repeat that?";
                   addMessage("assistant", errorResponse);
                   speak({ text: errorResponse });
                }
            };
        } catch (error) {
            console.error("Error Processing Voice", error);
            toast({
              title: "Chakra Disruption",
              description: "There was an issue processing your vocal chakra.",
              variant: "destructive"
            })
            const errorResponse = "My apologies, young one. My senses encountered an anomaly. Please try again.";
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
            const strategyText = `Of course. Here are some new jutsu to practice based on your current chakra:\n\n${strategies.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
            addMessage("assistant", strategyText);
            speak({ text: strategyText });
        } catch (error) {
            toast({
              title: "Training Failed",
              description: "Could not generate new jutsu.",
              variant: "destructive"
            })
            const errorResponse = "I'm afraid I cannot generate new techniques with the current data. We must analyze your chakra further.";
            addMessage("assistant", errorResponse);
            speak({ text: errorResponse });
        }
    });
  }
  
  const startRecording = async () => {
    if (speaking) cancel();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = []; // Clear previous chunks
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleVoiceSubmit(audioBlob);
        stream.getTracks().forEach(track => track.stop()); // Stop the stream tracks
      };
      mediaRecorderRef.current.start();
    } catch (error) {
      console.error("Error accessing microphone", error);
      toast({ title: "Mic Malfunction", description: "Could not establish a link to your communication device.", variant: "destructive" });
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20"></div>
        <div className="relative w-64 h-64">
          {aiAvatar && (
            <Image 
              src={aiAvatar.imageUrl}
              alt={aiAvatar.description}
              width={256}
              height={256}
              className={cn(
                "rounded-full object-cover shadow-lg transition-all duration-500 ease-in-out",
                speaking ? "scale-105 shadow-[0_0_40px_8px_hsl(var(--primary))]" : "scale-100 shadow-[0_0_20px_4px_hsl(var(--primary))]",
                isRecording ? "scale-110 shadow-[0_0_60px_12px_hsl(var(--secondary))]" : "",
                isPending ? "animate-pulse" : ""
              )}
              priority
              data-ai-hint={aiAvatar.imageHint}
            />
          )}
        </div>

        <div className="absolute top-0 right-0 p-4">
            <Button variant="outline" size="sm" onClick={handleGetStrategies} disabled={isPending || speaking || sessionState !== 'active'}>
                <BrainCircuit className="w-4 h-4 mr-2"/>
                New Jutsu
            </Button>
        </div>

        <div className="w-full max-w-2xl text-center px-4 mt-8 relative">
            <p className="text-lg md:text-xl text-primary/80 min-h-[6em] transition-opacity duration-300 font-mono">
                {lastBotMessage}
            </p>
        </div>
        
        <div className="absolute bottom-10 flex flex-col items-center gap-4">
            {sessionState === "idle" && (
                <Button onClick={startConversation} size="lg" className="rounded-full">
                    <Play className="mr-2" /> Begin Training
                </Button>
            )}
            {sessionState === "active" && (
                <>
                  <Button 
                    size="icon"
                    className="rounded-full w-20 h-20 border-2 border-primary/50 bg-primary/20 text-primary hover:bg-primary/30"
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    disabled={isPending || speaking}
                  >
                    <Mic className="w-8 h-8"/>
                  </Button>
                 <Button onClick={endConversation} variant="destructive" size="sm">
                    <Square className="mr-2" /> End Training
                 </Button>
                </>
            )}
             {sessionState === "stopped" && (
                <Button onClick={() => window.location.reload()} size="lg" className="rounded-full">
                    <Play className="mr-2" /> Re-engage
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
                        A Critical Warning!
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Your chakra feels dangerously low, young one. A true shinobi knows when to seek aid. Please, connect with the village's crisis support line. You do not have to carry this burden alone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction asChild>
                        <a href="tel:988">Contact ANBU Support: 988</a>
                    </AlertDialogAction>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Dismiss</Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

    