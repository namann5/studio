// use server'

/**
 * @fileOverview Generates personalized coping strategies based on conversation history and current mood.
 *
 * - generateCopingStrategies - A function that generates coping strategies.
 * - GenerateCopingStrategiesInput - The input type for the generateCopingStrategies function.
 * - GenerateCopingStrategiesOutput - The return type for the generateCopingStrategies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCopingStrategiesInputSchema = z.object({
  conversationHistory: z
    .string()
    .describe('The conversation history between the user and the AI.'),
  currentMood: z.string().describe('The current mood of the user.'),
});
export type GenerateCopingStrategiesInput = z.infer<
  typeof GenerateCopingStrategiesInputSchema
>;

const GenerateCopingStrategiesOutputSchema = z.object({
  copingStrategies: z
    .array(z.string())
    .describe('A list of personalized coping strategies.'),
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
  prompt: `Based on the conversation history:

{{{conversationHistory}}}

and the user's current mood: {{{currentMood}}},

generate a list of personalized coping strategies that the user can use to improve their mood and well-being. Return the strategies as a numbered list, each strategy should be actionable and specific:

1.  ...
2.  ...
3.  ...
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
