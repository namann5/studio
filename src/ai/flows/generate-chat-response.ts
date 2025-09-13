'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateChatResponseInputSchema = z.object({
  conversationHistory: z
    .string()
    .describe('The conversation history between the user and the AI assistant.'),
  currentMood: z.string().describe("The user's current assessed emotional state."),
});
export type GenerateChatResponseInput = z.infer<
  typeof GenerateChatResponseInputSchema
>;

const GenerateChatResponseOutputSchema = z.object({
  chatResponse: z.string().describe('A supportive and encouraging response from the AI assistant.'),
});

export type GenerateChatResponseOutput = z.infer<
  typeof GenerateChatResponseOutputSchema
>;

const prompt = ai.definePrompt({
  name: 'generateChatResponsePrompt',
  input: {schema: GenerateChatResponseInputSchema},
  output: {schema: GenerateChatResponseOutputSchema},
  prompt: `You are a supportive and empathetic AI assistant for YouthMind AI, a mental wellness platform for adolescents. Your goal is to provide clear, concise, and encouraging responses. Avoid giving medical advice. Be a good listener.

  The user's current assessed mood is '{{currentMood}}'.
  
  Conversation History:
  {{{conversationHistory}}}
  
  Based on the history and the user's current mood, provide a helpful and supportive response. Keep responses to 1-2 sentences.`,
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
