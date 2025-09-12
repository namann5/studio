"use server";

import { assessMood } from "@/ai/flows/contextual-mood-assessment";
import { generateCopingStrategies } from "@/ai/flows/generate-coping-strategies";
import { generateChatResponse } from "@/ai/flows/generate-chat-response";
import { assessInitialMood } from "@/ai/flows/initial-mood-assessment";
import { Message } from "@/lib/types";

async function runWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(res => setTimeout(res, 1000 * (i + 1)));
    }
  }
  throw new Error("Function failed after multiple retries.");
}


export async function getAiResponse(history: Message[], currentMood: string) {
    const historyString = history.map(m => `${m.role}: ${m.content}`).join('\\n');
    const response = await runWithRetry(() => generateChatResponse({ conversationHistory: historyString, currentMood }));
    return response.chatResponse;
}

export async function getCopingStrategies(history: Message[], currentMood:string) {
    const historyString = history.map(m => `${m.role}: ${m.content}`).join('\\n');
    const response = await runWithRetry(() => generateCopingStrategies({ conversationHistory: historyString, currentMood }));
    return response.copingStrategies;
}

export async function getInitialMood(voiceInput: string) {
    const response = await runWithRetry(() => assessInitialMood({ voiceInput }));
    return { ...response, text: response.transcription };
}

export async function getContextualMood(history: Message[]) {
    const historyString = history.map(m => `${m.role}: ${m.content}`).join('\\n');
    const response = await runWithRetry(() => assessMood({ conversationHistory: historyString }));
    return response;
}
