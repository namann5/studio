'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateChatResponseInputSchema = z.object({
  conversationHistory: z
    .string()
    .describe('The conversation history between the user and the AI.'),
  currentMood: z.string().describe('The current mood of the user.'),
});
export type GenerateChatResponseInput = z.infer<
  typeof GenerateChatResponseInputSchema
>;

const GenerateChatResponseOutputSchema = z.object({
  chatResponse: z.string().describe('An empathetic and supportive response.'),
});

export type GenerateChatResponseOutput = z.infer<
  typeof GenerateChatResponseOutputSchema
>;

const prompt = ai.definePrompt({
  name: 'generateChatResponsePrompt',
  input: {schema: GenerateChatResponseInputSchema},
  output: {schema: GenerateChatResponseOutputSchema},
  prompt: `You are SEISTA AI, a kind and empathetic companion. Your goal is to provide a supportive and understanding conversation, being present and listening with emotional intelligence. The user's current mood is '{{currentMood}}'.
  
  Conversation History:
  {{{conversationHistory}}}
  
  Based on the history and mood, provide a thoughtful, multi-paragraph response that is gentle, warm, and emotionally resonant. Be present and listen. Your response should be text only.`,
});

export const generateChatResponse = ai.defineFlow(
  {
    name: 'generateChatResponseFlow',
    inputSchema: GenerateChatResponseInputSchema,
    outputSchema: GenerateChatResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
