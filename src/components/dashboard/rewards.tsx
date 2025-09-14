"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Zap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const rewards = [
    { icon: <CheckCircle />, title: "First Session", description: "Completed your first session.", unlocked: true },
    { icon: <Zap />, title: "3-Day Streak", description: "Logged in for 3 consecutive days.", unlocked: true },
    { icon: <Star />, title: "Mood Master", description: "Logged your mood for a full week.", unlocked: false },
    { icon: <CheckCircle />, title: "Explorer", description: "Used 5 different coping strategies.", unlocked: false },
    { icon: <Zap />, title: "Consistent", description: "Completed 10 sessions.", unlocked: false },
    { icon: <Star />, title: "Zen Master", description: "Achieved a calm state for 3 days in a row.", unlocked: false },
];

export function Rewards() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Your Rewards</CardTitle>
        <CardDescription>Earn badges for your progress and consistency.</CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 text-center">
                {rewards.map((reward, index) => (
                <Tooltip key={index}>
                    <TooltipTrigger>
                        <div className="flex flex-col items-center gap-2">
                            <div className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${reward.unlocked ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${reward.unlocked ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                                    <div className="[&>svg]:w-8 [&>svg]:h-8 text-white">
                                        {reward.icon}
                                    </div>
                                </div>
                            </div>
                            <Badge variant={reward.unlocked ? "default" : "secondary"}>
                                {reward.unlocked ? 'Unlocked' : 'Locked'}
                            </Badge>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="font-bold">{reward.title}</p>
                        <p className="text-sm text-muted-foreground">{reward.description}</p>
                    </TooltipContent>
                </Tooltip>
                ))}
            </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
