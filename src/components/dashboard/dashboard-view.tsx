"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MoodChart } from "./mood-chart";
import { Bot, User } from "lucide-react";

// Mock data
const moodData = [
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
        summary: "Discussed feelings of anxiety about an upcoming presentation.",
        transcript: [
            { role: "user", text: "I'm feeling really anxious about my presentation tomorrow." },
            { role: "ai", text: "It's completely understandable to feel that way. Presentations can be nerve-wracking. What about it is making you most anxious?" },
        ]
    },
    {
        date: "3 days ago",
        summary: "Talked about feeling lonely and explored ways to connect with others.",
        transcript: [
            { role: "user", text: "I've been feeling a bit lonely lately." },
            { role: "ai", text: "I'm sorry to hear that. Loneliness is a tough feeling. I'm here to listen if you'd like to talk more about it." },
        ]
    }
];

export function DashboardView() {
  return (
    <div className="h-screen flex flex-col">
        <header className="p-4 border-b flex items-center bg-background">
            <h1 className="text-xl font-bold font-headline">Your Progress</h1>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Weekly Mood Trend</CardTitle>
                    <CardDescription>A look at your mood fluctuations over the past week.</CardDescription>
                </CardHeader>
                <CardContent>
                    <MoodChart data={moodData} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Encrypted Conversation History</CardTitle>
                    <CardDescription>Review summaries of your past conversations. Your data is always private.</CardDescription>
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
