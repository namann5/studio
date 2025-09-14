"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

type MoodLoggerProps = {
    onMoodLog: (mood: number) => void;
};

export function MoodLogger({ onMoodLog }: MoodLoggerProps) {
    const [mood, setMood] = useState(5);
    const { toast } = useToast();

    const handleSubmit = () => {
        onMoodLog(mood);
        toast({
            title: "Mood Logged",
            description: `Your mood level of ${mood} has been saved.`,
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Log Today's Mood</CardTitle>
                <CardDescription>How are you feeling right now?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground">Low</span>
                    <Slider
                        value={[mood]}
                        onValueChange={(value) => setMood(value[0])}
                        max={10}
                        step={1}
                    />
                    <span className="text-sm text-muted-foreground">High</span>
                </div>
                <div className="text-center">
                    <p className="text-5xl font-bold font-headline text-primary">{mood}</p>
                </div>
                <Button onClick={handleSubmit} className="w-full">
                    Log My Mood
                </Button>
            </CardContent>
        </Card>
    );
}
