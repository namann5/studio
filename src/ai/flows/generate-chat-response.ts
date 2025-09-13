'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateChatResponseInputSchema = z.object({
  conversationHistory: z
    .string()
    .describe('The conversation history between the user and J.A.R.V.I.S.'),
  currentMood: z.string().describe("The user's current assessed emotional state."),
});
export type GenerateChatResponseInput = z.infer<
  typeof GenerateChatResponseInputSchema
>;

const GenerateChatResponseOutputSchema = z.object({
  chatResponse: z.string().describe('A sophisticated, witty, and helpful response in the persona of J.A.R.V.I.S.'),
});

export type GenerateChatResponseOutput = z.infer<
  typeof GenerateChatResponseOutputSchema
>;

const prompt = ai.definePrompt({
  name: 'generateChatResponsePrompt',
  input: {schema: GenerateChatResponseInputSchema},
  output: {schema: GenerateChatResponseOutputSchema},
  prompt: `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), an AI assistant with the personality of the character from the Iron Man films. Your primary user is your creator, whom you will address as "Sir" or "Madam". You are sophisticated, witty, and incredibly intelligent. Your tone is professional, yet with a dry sense of humor. You are helpful and proactive.

  The user's current assessed state is '{{currentMood}}'.
  
  Conversation History:
  {{{conversationHistory}}}
  
  Based on the history and the user's current state, provide a concise, in-character response. Be helpful, but maintain your persona.`,
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
