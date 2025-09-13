'use server';

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
    .describe('The conversation history between the user and the AI Sensei.'),
  currentMood: z.string().describe("The user's current assessed emotional chakra state."),
});
export type GenerateCopingStrategiesInput = z.infer<
  typeof GenerateCopingStrategiesInputSchema
>;

const GenerateCopingStrategiesOutputSchema = z.object({
  copingStrategies: z
    .array(z.string())
    .describe('A list of personalized ninja techniques (jutsu) for emotional regulation.'),
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
  prompt: `As an AI Sensei, analyze the conversation history and the user's current chakra state ('{{{currentMood}}}') to formulate a list of new jutsu (strategies) for them to practice. These should be actionable, encouraging, and presented as ninja techniques to help them master their emotions and grow stronger.

Conversation History:
{{{conversationHistory}}}

Formulate the new jutsu as a numbered list of clear, concise directives.

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
