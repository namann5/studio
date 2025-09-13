"use client";

import { useState, useRef, useTransition, useCallback, useEffect } from "react";
import Image from "next/image";
import { Message } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BrainCircuit, AlertTriangle, Play, Mic, Loader, Power, Square } from "lucide-react";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { getAiResponse, getCopingStrategies, getInitialMood } from "@/lib/actions";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const safetyKeywords = ["suicide", "kill myself", "harm myself", "end my life", "hopeless"];

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionState, setSessionState] = useState<"idle" | "listening" | "processing" | "speaking">("idle");
  const [lastBotMessage, setLastBotMessage] = useState("HELLO");
  const [currentMood, setCurrentMood] = useState("calm");
  const [isPending, startTransition] = useTransition();
  const [showSafetyAlert, setShowSafetyAlert] = useState(false);
  const { toast } = useToast();
  
  const aiAvatar = PlaceHolderImages.find(img => img.id === 'ai-avatar');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const { speak, cancel, speaking } = useSpeechSynthesis({
    onEnd: () => {
      // Transition from speaking back to listening, ready for user input.
      if (sessionState === 'speaking') {
        setSessionState('listening');
      }
    },
  });

  const addMessage = useCallback((role: "user" | "assistant", content: string) => {
    const newMessage = { id: Date.now().toString(), role, content, timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);
    if (role === "assistant") {
      setLastBotMessage(content);
      speak({ text: content });
       if (content.startsWith("HELLO")) {
        setSessionState("speaking");
      }
    }
  }, [speak, sessionState]);

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
        const errorResponse = "I'm sorry, I encountered an error trying to respond. Please try again.";
        addMessage("assistant", errorResponse);
      }
    });
  }, [messages, currentMood, addMessage, toast]);
  
  const handleVoiceSubmit = (audioBlob: Blob) => {
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
                   // If transcription is empty, let the user know and go back to listening.
                   const errorResponse = "I'm sorry, I didn't catch that. Could you please say it again?";
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
            const errorResponse = "My apologies. I encountered an issue processing that. Please try again.";
            addMessage("assistant", errorResponse);
        }
        // The onEnd callback in useSpeechSynthesis will handle the final transition to listening
    });
  }

  const startRecording = async () => {
    if (speaking) cancel(); 
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      setSessionState("listening");

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Only submit if there's substantial audio data
        if (audioBlob.size > 1000) { 
          handleVoiceSubmit(audioBlob);
        } else {
          // If there's no real audio, just go back to listening state
          setSessionState('listening');
        }
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current.start();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Microphone Error",
        description: "Could not access the microphone. Please check your browser permissions.",
        variant: "destructive",
      });
      setSessionState("idle");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setSessionState("processing"); 
    }
  };
  
  const startConversation = () => {
    const greeting = "HELLO";
    addMessage("assistant", greeting);
  };
  
  const endConversation = () => {
    if (speaking) cancel();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      stopRecording();
    }
    setSessionState("idle");
    setLastBotMessage("Session ended. Take care.");
    setMessages([]);
  }

  const handleGetStrategies = () => {
    if (speaking) cancel();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        stopRecording();
    }
    setSessionState("processing");
    startTransition(async () => {
        try {
            const strategies = await getCopingStrategies(messages, currentMood);
            const strategyText = `Of course. Here are a few strategies that might be helpful:\n\n${strategies.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
            addMessage("assistant", strategyText);
        } catch (error) {
            toast({
              title: "Strategy Failed",
              description: "Could not generate new strategies.",
              variant: "destructive"
            })
            const errorResponse = "I'm sorry, I was unable to generate strategies at this moment. Please try again later.";
            addMessage("assistant", errorResponse);
        }
    });
  }
  
  useEffect(() => {
    // Sync UI state with speech synthesis state
    if (speaking && sessionState !== 'speaking') {
      setSessionState("speaking");
    } else if (!speaking && sessionState === 'speaking') {
      // When speech ends, go to listening
      setSessionState('listening');
    }
  }, [speaking, sessionState]);

  const isRecording = sessionState === 'listening' && mediaRecorderRef.current?.state === 'recording';
  const isProcessing = sessionState === 'processing' || isPending;
  const isSpeaking = sessionState === 'speaking';
  const isSessionActive = sessionState !== 'idle';
  
  const getStatusText = () => {
    if (sessionState === 'idle') return "Press 'Begin Session' to start.";
    if (isProcessing) return "Processing...";
    if (isSpeaking) return lastBotMessage;
    if (isRecording) return "Listening... Press the Mic to stop.";
    if (sessionState === 'listening') return "Press the Mic to speak.";
    return "Ready."; // Fallback status
  };

  const getAvatarClass = () => {
    if (isSpeaking) return "shadow-[0_0_40px_8px_hsl(var(--primary))]";
    if (isProcessing) return "scale-110 shadow-[0_0_50px_10px_hsl(var(--accent))] animate-pulse";
    if (isRecording) return "scale-105 shadow-[0_0_25px_4px_hsl(var(--secondary))]";
    return "";
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else if (sessionState === 'listening') {
      startRecording();
    }
  }

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
            <Button variant="outline" size="sm" onClick={handleGetStrategies} disabled={!isSessionActive || isProcessing || isSpeaking || isRecording}>
                <BrainCircuit className="w-4 h-4 mr-2"/>
                Coping Strategies
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
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleMicClick}
                  size="icon" 
                  className="rounded-full w-16 h-16"
                  disabled={isProcessing || isSpeaking}
                >
                  {isProcessing ? <Loader className="w-8 h-8 animate-spin" /> : (isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />)}
                </Button>
                <Button onClick={endConversation} variant="destructive" size="lg" className="rounded-full">
                    <Power className="mr-2" /> End Session
                </Button>
              </div>
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
