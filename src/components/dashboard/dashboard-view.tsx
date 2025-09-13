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
        summary: "Practiced the 'Calm Mind' jutsu to prepare for the Chunin Exams.",
        transcript: [
            { role: "user", text: "I'm feeling really anxious about the exams tomorrow." },
            { role: "ai", text: "It is natural to feel the weight of this mission. A calm mind is your sharpest kunai. Let us practice controlling your chakra flow." },
        ]
    },
    {
        date: "3 days ago",
        summary: "Discussed feelings of isolation after a solo mission.",
        transcript: [
            { role: "user", text: "I've been feeling a bit lonely lately." },
            { role: "ai", text: "Even the strongest shinobi needs their village. Remember the bonds you have forged. I am here to listen, young one." },
        ]
    }
];

export function DashboardView() {
  return (
    <div className="h-screen flex flex-col">
        <header className="p-4 border-b flex items-center bg-background">
            <h1 className="text-xl font-bold font-headline">Shinobi Progress Report</h1>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Weekly Chakra Fluctuation</CardTitle>
                    <CardDescription>A visualization of your emotional chakra levels over the past week.</CardDescription>
                </CardHeader>
                <CardContent>
                    <MoodChart data={moodData} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Encrypted Mission Logs</CardTitle>
                    <CardDescription>Review summaries of your past training sessions. Your scrolls are sealed and private.</CardDescription>
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
