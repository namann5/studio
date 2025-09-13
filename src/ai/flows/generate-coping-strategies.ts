// use server'

/**
 * @fileOverview Generates personalized strategic recommendations based on conversation history and current mood.
 *
 * - generateCopingStrategies - A function that generates strategic recommendations.
 * - GenerateCopingStrategiesInput - The input type for the generateCopingStrategies function.
 * - GenerateCopingStrategiesOutput - The return type for the generateCopingStrategies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCopingStrategiesInputSchema = z.object({
  conversationHistory: z
    .string()
    .describe('The conversation history between the user and J.A.R.V.I.S.'),
  currentMood: z.string().describe("The user's current assessed emotional state."),
});
export type GenerateCopingStrategiesInput = z.infer<
  typeof GenerateCopingStrategiesInputSchema
>;

const GenerateCopingStrategiesOutputSchema = z.object({
  copingStrategies: z
    .array(z.string())
    .describe('A list of personalized strategic recommendations.'),
});
export type GenerateCopingStrategiesOutput = z.infer<
  typeof GenerateCopingStrategiesOutputSchema
>;

export async function generateCopingStrategies(
  input: GenerateCopingStrategiesInput
): Promise<GenerateCopingStrategiesOutput> {
  return generateCopingStrategiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCopingStrategiesPrompt',
  input: {schema: GenerateCopingStrategiesInputSchema},
  output: {schema: GenerateCopingStrategiesOutputSchema},
  prompt: `As J.A.R.V.I.S., analyze the conversation history and the user's current state ('{{{currentMood}}}') to formulate a list of strategic recommendations. These should be actionable, logical, and presented as tactical options to optimize the user's well-being and performance.

Conversation History:
{{{conversationHistory}}}

Formulate the recommendations as a numbered list of clear, concise directives.

1. ...
2. ...
3. ...
`,
});

const generateCopingStrategiesFlow = ai.defineFlow(
  {
    name: 'generateCopingStrategiesFlow',
    inputSchema: GenerateCopingStrategiesInputSchema,
    outputSchema: GenerateCopingStrategiesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
