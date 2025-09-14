"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MoodChart } from "./mood-chart";
import { Bot, User } from "lucide-react";
import { MoodLogger } from "./mood-logger";
import { Rewards } from "./rewards";
import { MoodEntry } from "@/lib/types";

// Mock data
const initialMoodData: MoodEntry[] = [
    { date: "Mon", mood: 7 },
    { date: "Tue", mood: 5 },
    { date: "Wed", mood: 6 },
    { date: "Thu", mood: 8 },
    { date: "Fri", mood: 7 },
    { date: "Sat", mood: 9 },
    { date: "Sun", mood: 8 },
];

const conversationHistory = [
    {
        date: "Yesterday",
        summary: "Talked about feeling anxious about exams.",
        transcript: [
            { role: "user", text: "I'm feeling really anxious about the exams tomorrow." },
            { role: "ai", text: "It's completely normal to feel anxious before a big test. Let's maybe explore some ways to manage that anxiety." },
        ]
    },
    {
        date: "3 days ago",
        summary: "Discussed feelings of isolation.",
        transcript: [
            { role: "user", text: "I've been feeling a bit lonely lately." },
            { role: "ai", text: "Thank you for sharing that. Feeling lonely can be tough. I'm here to listen." },
        ]
    }
];

export function DashboardView() {
  const [moodData, setMoodData] = useState<MoodEntry[]>(initialMoodData);

  const handleMoodLog = (newMood: number) => {
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'short' });
    
    setMoodData(currentData => {
        const existingEntryIndex = currentData.findIndex(d => d.date === dayOfWeek);
        if (existingEntryIndex > -1) {
            const updatedData = [...currentData];
            updatedData[existingEntryIndex] = { ...updatedData[existingEntryIndex], mood: newMood };
            return updatedData;
        } else {
            // This case is simplified; in a real app, you'd manage dates more robustly
            return [...currentData.slice(-6), { date: dayOfWeek, mood: newMood }];
        }
    });
  };

  return (
    <div className="h-screen flex flex-col">
        <header className="p-4 border-b flex items-center bg-background">
            <h1 className="text-xl font-bold font-headline">Your Wellness Dashboard</h1>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 space-y-8">
            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Weekly Mood Trends</CardTitle>
                        <CardDescription>A visualization of your emotional wellness over the past week.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MoodChart data={moodData} />
                    </CardContent>
                </Card>
                <MoodLogger onMoodLog={handleMoodLog} />
            </div>
            
            <Rewards />

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Encrypted Conversation History</CardTitle>
                    <CardDescription>Review summaries of your past sessions. Your data is private and secure.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {conversationHistory.map((item, index) => (
                            <AccordionItem value={`item-${index}`} key={index}>
                                <AccordionTrigger>
                                    <div className="flex justify-between w-full pr-4">
                                        <span>{item.summary}</span>
                                        <span className="text-muted-foreground text-sm">{item.date}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-4 p-2 bg-muted/50 rounded-md">
                                        {item.transcript.map((line, lineIndex) => (
                                            <div key={lineIndex} className="flex items-start gap-3">
                                                {line.role === 'ai' ? <Bot className="w-5 h-5 text-primary flex-shrink-0 mt-1" /> : <User className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />}
                                                <p className="text-sm">{line.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
