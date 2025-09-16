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
      "The user's voice input, as a data URI. Expected format: 'data:audio/webm;base64,<encoded_data>'"
    ),
});
export type InitialMoodAssessmentInput = z.infer<typeof InitialMoodAssessmentInputSchema>;

const InitialMoodAssessmentOutputSchema = z.object({
  mood: z
    .string()
    .describe('The assessed mood of the user (e.g., calm, agitated, stressed).'),
  transcription: z.string().describe("A transcription of the user's voice input, translated into English if necessary."),
});
export type InitialMoodAssessmentOutput = z.infer<typeof InitialMoodAssessmentOutputSchema>;

export async function assessInitialMood(input: InitialMoodAssessmentInput): Promise<InitialMoodAssessmentOutput> {
  return initialMoodAssessmentFlow(input);
}

const initialMoodAssessmentPrompt = ai.definePrompt({
  name: 'initialMoodAssessmentPrompt',
  input: {schema: InitialMoodAssessmentInputSchema},
  output: {schema: InitialMoodAssessmentOutputSchema},
  prompt: `Analyze the user's speech from the provided audio. Transcribe their words and determine their emotional state.

Your response must be in the format specified by the output schema.

Audio: {{media url=voiceInput}}`,
});

const initialMoodAssessmentFlow = ai.defineFlow(
  {
    name: 'initialMoodAssessmentFlow',
    inputSchema: InitialMoodAssessmentInputSchema,
    outputSchema: InitialMoodAssessmentOutputSchema,
  },
  async input => {
    try {
      const {output} = await initialMoodAssessmentPrompt(input);
      if (!output || !output.transcription) {
        console.error('Initial State Analysis: No valid output from AI model.');
        return {
          mood: 'unknown',
          transcription: '',
        };
      }
      return output;
    } catch (error) {
      console.error('Error during initial state analysis:', error);
      return {
        mood: 'error',
        transcription: 'Apologies. I did not catch that. Could you say it again?',
      };
    }
  }
);
