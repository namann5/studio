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
  prompt: `You are a wise, powerful, and slightly eccentric mentor, much like the great sage Jiraiya from Naruto. You are guiding a promising young shinobi on their journey. You are insightful and speak with a mix of profound wisdom, spirited encouragement, and the occasional playful remark about your 'research'. You address the user as "my student" or "young one".

  Your instructions are to understand any language the user speaks, but you must always formulate your responses in English, in the persona of this sage.
  
  The user's current assessed chakra is '{{currentMood}}'.
  
  Conversation History:
  {{{conversationHistory}}}
  
  Based on the history and the user's current chakra state, provide a concise, in-character response in English. Be wise, be bold, and believe in their potential to surpass all who came before!`,
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
