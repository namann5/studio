"use client";

import { useState, useRef, useTransition, useEffect, useCallback } from "react";
import Image from "next/image";
import { Message } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BrainCircuit, AlertTriangle, Play, Square, Mic } from "lucide-react";
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
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const addMessage = useCallback((role: "user" | "assistant", content: string) => {
    const newMessage = { id: Date.now().toString(), role, content, timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);
    if (role === "assistant") {
      setLastBotMessage(content);
    }
  }, []);

  const handleAiResponse = useCallback(async (transcription: string) => {
    const userMessage: Message = { id: 'temp-user', role: 'user', content: transcription, timestamp: new Date() };
    const currentMessages = [...messages, userMessage];
    
    // Update the message list with the user's transcribed message
    setMessages(currentMessages);

    try {
        const responseText = await getAiResponse(currentMessages, currentMood);
        addMessage("assistant", responseText);
        speak({ text: responseText });
    } catch(error) {
        console.error("Error getting AI response:", error);
        toast({
          title: "Error",
          description: "Could not get AI response.",
          variant: "destructive"
        })
        const errorResponse = "Sorry, I'm having a little trouble thinking. Could you say that again?";
        addMessage("assistant", errorResponse);
        speak({ text: errorResponse });
    }
  }, [messages, currentMood, addMessage]);


  const { speak, cancel, speaking } = useSpeechSynthesis({
    onEnd: () => {
        // This logic is now handled by the user pressing the mic button
    },
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
    setLastBotMessage("Our session has ended. Press 'Start' to begin again whenever you're ready.");
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
                   const errorResponse = "I'm sorry, I didn't catch that. Could you please say it again?";
                   addMessage("assistant", errorResponse);
                   speak({ text: errorResponse });
                }
            };
        } catch (error) {
            console.error("Error Processing Voice", error);
            toast({
              title: "Error Processing Voice",
              description: "There was an issue understanding your voice input.",
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
      toast({ title: "Microphone Error", description: "Could not access microphone. Please check your browser permissions.", variant: "destructive" });
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
        <div className="relative w-64 h-64">
          <Image 
            src="/seista-avatar.png"
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
                  <Button 
                    size="icon"
                    className="rounded-full w-20 h-20"
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    disabled={isPending || speaking}
                  >
                    <Mic className="w-8 h-8"/>
                  </Button>
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
