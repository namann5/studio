'use server';

/**
 * @fileOverview A flow for assessing the user's initial mood based on voice input.
 *
 * - assessInitialMood - A function that assesses the user's mood from voice input.
 * - InitialMoodAssessmentInput - The input type for the assessInitialMood function.
 * - InitialMoodAssessmentOutput - The return type for the assessInitialMood function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InitialMoodAssessmentInputSchema = z.object({
  voiceInput: z
    .string()
    .describe(
      'The user voice input, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Ensure correct MIME type and Base64 encoding
    ),
});
export type InitialMoodAssessmentInput = z.infer<typeof InitialMoodAssessmentInputSchema>;

const InitialMoodAssessmentOutputSchema = z.object({
  mood: z
    .string()
    .describe('The assessed mood of the user (e.g., happy, sad, angry).'),
  confidence: z
    .number()
    .describe('A number between 0 and 1 indicating the confidence level of the mood assessment.'),
});
export type InitialMoodAssessmentOutput = z.infer<typeof InitialMoodAssessmentOutputSchema>;

export async function assessInitialMood(input: InitialMoodAssessmentInput): Promise<InitialMoodAssessmentOutput> {
  return initialMoodAssessmentFlow(input);
}

const initialMoodAssessmentPrompt = ai.definePrompt({
  name: 'initialMoodAssessmentPrompt',
  input: {schema: InitialMoodAssessmentInputSchema},
  output: {schema: InitialMoodAssessmentOutputSchema},
  prompt: `Analyze the user's voice input and determine their mood.

Voice Input: {{media url=voiceInput}}

Respond with the mood and a confidence level (0-1). Mood should be a simple, single-word descriptor.
Confidence should reflect how sure you are of the mood assessment, given the input.`, // Clear instructions for mood assessment
});

const initialMoodAssessmentFlow = ai.defineFlow(
  {
    name: 'initialMoodAssessmentFlow',
    inputSchema: InitialMoodAssessmentInputSchema,
    outputSchema: InitialMoodAssessmentOutputSchema,
  },
  async input => {
    const {output} = await initialMoodAssessmentPrompt(input);
    return output!;
  }
);
