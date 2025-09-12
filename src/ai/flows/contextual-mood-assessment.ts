// use server'

/**
 * @fileOverview This file defines a Genkit flow for assessing the user's mood contextually throughout a conversation.
 *
 * - assessMood - An async function that takes conversation history as input and returns a mood assessment.
 * - AssessMoodInput - The input type for the assessMood function, including conversation history.
 * - AssessMoodOutput - The output type for the assessMood function, representing the mood assessment result.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AssessMoodInputSchema = z.object({
  conversationHistory: z
    .string()
    .describe('The history of the conversation between the user and the AI.'),
});
export type AssessMoodInput = z.infer<typeof AssessMoodInputSchema>;

const AssessMoodOutputSchema = z.object({
  mood: z.string().describe('The assessed mood of the user (e.g., happy, sad, angry, anxious).'),
  intensity: z
    .number()
    .min(1)
    .max(10)
    .describe('The intensity of the mood, on a scale of 1 to 10.'),
  factors: z
    .string()
    .describe('The factors contributing to the user’s mood, based on the conversation history.'),
});
export type AssessMoodOutput = z.infer<typeof AssessMoodOutputSchema>;

export async function assessMood(input: AssessMoodInput): Promise<AssessMoodOutput> {
  return assessMoodFlow(input);
}

const assessMoodPrompt = ai.definePrompt({
  name: 'assessMoodPrompt',
  input: {schema: AssessMoodInputSchema},
  output: {schema: AssessMoodOutputSchema},
  prompt: `You are an AI assistant designed to assess the mood of the user based on their conversation history.

  Analyze the following conversation history to determine the user's current mood, its intensity, and the contributing factors:

  Conversation History: {{{conversationHistory}}}

  Provide your assessment in the following format:
  - mood: <the assessed mood>
  - intensity: <the intensity of the mood on a scale of 1 to 10>
  - factors: <the factors contributing to the mood>
  `,
});

const assessMoodFlow = ai.defineFlow(
  {
    name: 'assessMoodFlow',
    inputSchema: AssessMoodInputSchema,
    outputSchema: AssessMoodOutputSchema,
  },
  async input => {
    const {output} = await assessMoodPrompt(input);
    return output!;
  }
);
