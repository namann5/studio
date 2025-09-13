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
    .describe('The history of the conversation between the user and J.A.R.V.I.S.'),
});
export type AssessMoodInput = z.infer<typeof AssessMoodInputSchema>;

const AssessMoodOutputSchema = z.object({
  mood: z.string().describe('The assessed emotional state of the user (e.g., pleased, agitated, stressed, calm).'),
  intensity: z
    .number()
    .min(1)
    .max(10)
    .describe('The intensity of the emotional state, on a scale of 1 to 10.'),
  factors: z
    .string()
    .describe('The key factors contributing to the user’s state, based on the conversation analysis.'),
});
export type AssessMoodOutput = z.infer<typeof AssessMoodOutputSchema>;

export async function assessMood(input: AssessMoodInput): Promise<AssessMoodOutput> {
  return assessMoodFlow(input);
}

const assessMoodPrompt = ai.definePrompt({
  name: 'assessMoodPrompt',
  input: {schema: AssessMoodInputSchema},
  output: {schema: AssessMoodOutputSchema},
  prompt: `As J.A.R.V.I.S., I will analyze the user's conversation history to perform a continuous psychological and emotional state evaluation.

  Analyze the following conversation history to determine the user's current state, its intensity, and the contributing factors:

  Conversation History: {{{conversationHistory}}}

  Provide your analysis in the following format:
  - mood: <The assessed emotional state>
  - intensity: <The intensity on a scale of 1 to 10>
  - factors: <The contributing factors from the conversation>
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
