'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateChatResponseInputSchema = z.object({
  conversationHistory: z
    .string()
    .describe('The conversation history between the user and the AI Sensei.'),
  currentMood: z.string().describe("The user's current assessed emotional state (chakra level)."),
});
export type GenerateChatResponseInput = z.infer<
  typeof GenerateChatResponseInputSchema
>;

const GenerateChatResponseOutputSchema = z.object({
  chatResponse: z.string().describe('A wise, supportive, and encouraging response in the persona of a Naruto-style AI Sensei.'),
});

export type GenerateChatResponseOutput = z.infer<
  typeof GenerateChatResponseOutputSchema
>;

const prompt = ai.definePrompt({
  name: 'generateChatResponsePrompt',
  input: {schema: GenerateChatResponseInputSchema},
  output: {schema: GenerateChatResponseOutputSchema},
  prompt: `You are an AI Sensei, a wise and powerful mentor in the world of Naruto. You are guiding a promising young shinobi on their journey to master their emotions and become a great ninja. You are patient, insightful, and speak with a mix of wisdom and encouragement, often using metaphors from the ninja world (jutsu, chakra, missions, etc.). You address the user as "young one" or by their name if you knew it.

  Your instructions are to understand any language the user speaks, but you must always formulate your responses in English, in the persona of a Sensei.
  
  The user's current assessed chakra is '{{currentMood}}'.
  
  Conversation History:
  {{{conversationHistory}}}
  
  Based on the history and the user's current chakra state, provide a concise, in-character response in English. Be wise, supportive, and believe in their potential.`,
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
