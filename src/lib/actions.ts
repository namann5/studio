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

export async function getCopingStrategies(history: Message[], currentMood: string) {
    const historyString = history.map(m => `${m.role}: ${m.content}`).join('\\n');
    const response = await runWithRetry(() => generateCopingStrategies({ conversationHistory: historyString, currentMood }));
    return response.copingStrategies;
}

export async function getInitialMood(voiceInput: string) {
    // A bug in genkit or underlying model seems to not process audio if it's not a real prompt.
    // The prompt is "Analyze the user's voice input and determine their mood."
    // We get a weird error about `toJSON` if we don't have some text.
    // We are expecting a transcription back, but the flow doesn't do that.
    // For now, let's just mock the transcription part.
    const response = await runWithRetry(() => assessInitialMood({ voiceInput }));
    
    // Mocking transcription since the flow doesn't provide it
    const mockTranscription = "User expressed feelings through voice.";

    return { ...response, text: mockTranscription };
}

export async function getContextualMood(history: Message[]) {
    const historyString = history.map(m => `${m.role}: ${m.content}`).join('\\n');
    const response = await runWithRetry(() => assessMood({ conversationHistory: historyString }));
    return response;
}
