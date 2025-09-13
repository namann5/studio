"use client";

import { useState, useRef, useTransition, useCallback, useEffect } from "react";
import Image from "next/image";
import { Message } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BrainCircuit, AlertTriangle, Play, Square, Mic, Bot } from "lucide-react";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { getAiResponse, getCopingStrategies, getInitialMood } from "@/lib/actions";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const safetyKeywords = ["suicide", "kill myself", "harm myself", "end my life", "hopeless"];

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionState, setSessionState] = useState<"idle" | "listening" | "processing" | "speaking" | "stopped">("idle");
  const [lastBotMessage, setLastBotMessage] = useState("Greetings. I am your AI assistant. Speak, and I shall listen.");
  const [currentMood, setCurrentMood] = useState("calm");
  const [isPending, startTransition] = useTransition();
  const [showSafetyAlert, setShowSafetyAlert] = useState(false);
  const { toast } = useToast();
  
  const aiAvatar = PlaceHolderImages.find(img => img.id === 'ai-avatar');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { speak, cancel, speaking } = useSpeechSynthesis({
    onEnd: () => setSessionState(sessionState === 'speaking' ? 'idle' : 'idle'),
  });

  useEffect(() => {
    if (speaking) {
      setSessionState("speaking");
    }
  }, [speaking, sessionState]);

  const addMessage = useCallback((role: "user" | "assistant", content: string) => {
    const newMessage = { id: Date.now().toString(), role, content, timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);
    if (role === "assistant") {
      setLastBotMessage(content);
      speak({ text: content });
    }
  }, [speak]);

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
        const errorResponse = "Apologies. My response systems encountered an error. Could you repeat that?";
        addMessage("assistant", errorResponse);
      }
    });
  }, [messages, currentMood, addMessage, toast]);


  const startConversation = () => {
    setSessionState("idle");
    setLastBotMessage("Greetings. I am your AI assistant. Speak, and I shall listen.");
    speak({ text: "Greetings. I am your AI assistant. Speak, and I shall listen." });
  };
  
  const endConversation = () => {
    if (speaking) cancel();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setSessionState("stopped");
    setLastBotMessage("Session ended. Have a good day.");
  }

  const handleVoiceSubmit = (audioBlob: Blob) => {
    if (sessionState === 'stopped') return;
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.addEventListener("dataavailable", event => {
        audioChunksRef.current.push(event.data);
      });

      mediaRecorderRef.current.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleVoiceSubmit(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      });

      mediaRecorderRef.current.start();
      setSessionState("listening");
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to use the voice feature.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setSessionState("processing");
  };

  const handleGetStrategies = () => {
    if (speaking) cancel();
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
        }
    });
  }
  
  const isListening = sessionState === 'listening';
  const isProcessing = sessionState === 'processing';
  const isSpeaking = sessionState === 'speaking';
  
  const getStatusText = () => {
    if (isListening) return "Listening...";
    if (isProcessing) return "Processing...";
    if (isSpeaking) return "Speaking...";
    if (sessionState === 'stopped') return "Session ended.";
    return lastBotMessage;
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
                "rounded-full object-cover shadow-lg transition-all duration-300 ease-in-out",
                isSpeaking && "shadow-[0_0_40px_8px_hsl(var(--primary))]",
                isListening && "scale-105 shadow-[0_0_25px_4px_hsl(var(--secondary))]",
                isProcessing && "scale-110 shadow-[0_0_50px_10px_hsl(var(--accent))]",
                (isPending || isProcessing) && "animate-pulse"
              )}
              priority
              data-ai-hint={aiAvatar.imageHint}
            />
          )}
        </div>

        <div className="absolute top-0 right-0 p-4">
            <Button variant="outline" size="sm" onClick={handleGetStrategies} disabled={sessionState === 'stopped' || isProcessing || isSpeaking}>
                <BrainCircuit className="w-4 h-4 mr-2"/>
                New Strategies
            </Button>
        </div>

        <div className="w-full max-w-2xl text-center px-4 mt-8 relative">
            <p className="text-lg md:text-xl text-primary/80 min-h-[6em] transition-opacity duration-300 font-mono">
                {getStatusText()}
            </p>
        </div>
        
        <div className="absolute bottom-10 flex flex-col items-center gap-4">
            {sessionState === "idle" && (
                <Button onClick={startConversation} size="lg" className="rounded-full">
                    <Play className="mr-2" /> Begin Session
                </Button>
            )}

            {(sessionState !== "idle" && sessionState !== "stopped") && (
              <Button 
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={cn(
                  "w-20 h-20 rounded-full",
                  isListening ? "bg-red-500 hover:bg-red-600" : "bg-primary"
                )}
              >
                <Mic className="w-8 h-8" />
              </Button>
            )}

            {(isListening || isProcessing || isSpeaking) && (
                  <Button onClick={endConversation} variant="destructive" size="sm">
                    <Square className="mr-2" /> End Session
                  </Button>
            )}
             {sessionState === "stopped" && (
                <Button onClick={() => window.location.reload()} size="lg" className="rounded-full">
                    <Play className="mr-2" /> Restart Session
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
