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
  input: {schema: z.object({ voiceInput: z.string() })},
  output: {schema: InitialMoodAssessmentOutputSchema},
  prompt: `Analyze the user's speech from the provided audio. Transcribe their words into English, even if they speak another language like Hindi. Also, analyze their vocal tone to determine their emotional state.

Respond with your analysis in the specified format.

Audio: {{media url=voiceInput mimeType='audio/webm'}}`,
});

const initialMoodAssessmentFlow = ai.defineFlow(
  {
    name: 'initialMoodAssessmentFlow',
    inputSchema: InitialMoodAssessmentInputSchema,
    outputSchema: InitialMoodAssessmentOutputSchema,
  },
  async input => {
    // Check for valid base64 data.
    if (!input.voiceInput || !input.voiceInput.startsWith('data:audio/webm;base64,') || input.voiceInput.split(',')[1].length < 100) {
      console.error('Initial State Analysis: Invalid or empty voice input data URI.');
      return {
        mood: 'unknown',
        transcription: '',
      };
    }

    try {
      const {output} = await initialMoodAssessmentPrompt(input);
      if (!output) {
        throw new Error('No output from AI model.');
      }
      return output;
    } catch (error) {
      console.error('Error during initial state analysis:', error);
      return {
        mood: 'error',
        transcription: 'Apologies, Sir. My audio sensors failed to parse that. Could you please repeat your statement?',
      };
    }
  }
);
