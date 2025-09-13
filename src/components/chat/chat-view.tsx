"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { Message } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BrainCircuit, AlertTriangle, Loader, Mic, StopCircle } from "lucide-react";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { getAiResponse, getCopingStrategies, getInitialMood } from "@/lib/actions";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

const safetyKeywords = ["suicide", "kill myself", "harm myself", "end my life", "hopeless"];

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionState, setSessionState] = useState<"idle" | "recording" | "processing" | "speaking">("idle");
  const [lastBotMessage, setLastBotMessage] = useState("Hello! I'm here to listen. Click the mic to start speaking.");
  const [currentMood, setCurrentMood] = useState("calm");
  const [isPending, startTransition] = useTransition();
  const [showSafetyAlert, setShowSafetyAlert] = useState(false);
  const { toast } = useToast();
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  const aiAvatar = PlaceHolderImages.find(img => img.id === 'ai-avatar');

  const { speak, cancel, speaking } = useSpeechSynthesis({
    onEnd: () => {
      if (sessionState === 'speaking') {
        setSessionState('idle');
      }
    },
  });

  const addMessage = useCallback((role: "user" | "assistant", content: string) => {
    const newMessage = { id: Date.now().toString(), role, content, timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);
    if (role === "assistant") {
      setLastBotMessage(content);
      speak({ text: content });
      setSessionState("speaking");
    }
  }, [speak]);
  
  const handleVoiceSubmit = useCallback((audioBlob: Blob) => {
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
            
            const userMessage: Message = { id: Date.now().toString(), role: 'user', content: transcription, timestamp: new Date() };
            const currentHistory = [...messages, userMessage];
            setMessages(prev => [...prev, userMessage]);

            try {
              const responseText = await getAiResponse(currentHistory, mood);
              addMessage("assistant", responseText);
            } catch(error) {
              console.error("Error getting AI response:", error);
              toast({
                title: "Response Error",
                description: "There was an error generating a response.",
                variant: "destructive"
              });
              setSessionState("idle");
            }
          } else {
             addMessage("assistant", "I'm sorry, I didn't catch that. Could you please say it again?");
          }
        };
      } catch (error) {
        console.error("Error Processing Voice", error);
        toast({
          title: "Audio Processing Error",
          description: "There was an issue processing your audio.",
          variant: "destructive"
        })
        addMessage("assistant", "My apologies. I encountered an issue processing that. Please try again.");
      }
    });
  }, [messages, addMessage, toast]);


  const startRecording = async () => {
    if (speaking) cancel();

    if (!hasMicPermission) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            setHasMicPermission(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            setHasMicPermission(false);
            setSessionState("idle");
            return;
        }
    }
    
    // Ensure we have a stream before proceeding
    if (!streamRef.current) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            setHasMicPermission(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            setHasMicPermission(false);
            setSessionState("idle");
            return;
        }
    }

    setSessionState("recording");

    mediaRecorderRef.current = new MediaRecorder(streamRef.current);
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        handleVoiceSubmit(audioBlob);
        // Stop all tracks on the stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    mediaRecorderRef.current.start();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setSessionState("processing"); 
  };
  
  const handleMicButtonClick = () => {
    if (sessionState === "recording") {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  useEffect(() => {
    return () => {
      if (speaking) cancel();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  }, [speaking, cancel]);


  const isProcessing = sessionState === 'processing' || isPending;
  const isSpeaking = sessionState === 'speaking';
  const isRecording = sessionState === 'recording';
  
  const getStatusText = () => {
    if (hasMicPermission === false) return "Microphone access is required. Please enable it in your browser settings.";
    if (isProcessing) return "Processing...";
    if (isSpeaking) return lastBotMessage;
    if (isRecording) return "Listening...";
    return lastBotMessage;
  };

  const getAvatarClass = () => {
    if (isSpeaking) return "shadow-[0_0_40px_8px_hsl(var(--primary))]";
    if (isProcessing) return "scale-110 shadow-[0_0_50px_10px_hsl(var(--accent))] animate-pulse";
    if (isRecording) return "scale-105 shadow-[0_0_25px_4px_hsl(var(--secondary))]";
    return "";
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern bg-center [mask-image:radial-gradient(ellipse_at_center,white_20%,transparent_70%)] opacity-30"></div>
        
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
            <Button variant="outline" size="sm" onClick={() => {}} disabled={isRecording || isProcessing || isSpeaking}>
                <BrainCircuit className="w-4 h-4 mr-2"/>
                Coping Strategies
            </Button>
        </div>

        <div className="w-full max-w-2xl text-center px-4 mt-8 relative">
            <p className="text-lg md:text-xl text-primary/80 min-h-[4em] transition-opacity duration-300 font-mono">
                {getStatusText()}
            </p>
            {hasMicPermission === false && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Microphone Access Denied</AlertTitle>
                <AlertDescription>
                  This application requires microphone access to function. Please enable it in your browser settings.
                </AlertDescription>
              </Alert>
            )}
        </div>
        
        <div className="absolute bottom-10 flex flex-col items-center gap-4">
            <Button 
                onClick={handleMicButtonClick} 
                size="lg" 
                className="rounded-full w-24 h-24"
                disabled={isProcessing || isSpeaking}
            >
                {isProcessing ? <Loader className="w-8 h-8 animate-spin" /> : (isRecording ? <StopCircle className="w-8 h-8" /> : <Mic className="w-8 h-8" />)}
            </Button>
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
