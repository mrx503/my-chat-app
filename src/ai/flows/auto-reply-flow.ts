'use server';
/**
 * @fileOverview An AI agent that generates automatic replies.
 * 
 * - generateReply - A function that handles the auto-reply generation process.
 * - AutoReplyInput - The input type for the generateReply function.
 * - AutoReplyOutput - The return type for the generateReply function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoReplyInputSchema = z.object({
  message: z.string().describe('The message to reply to.'),
});
export type AutoReplyInput = z.infer<typeof AutoReplyInputSchema>;

const AutoReplyOutputSchema = z.object({
  reply: z.string().describe('The generated reply.'),
});
export type AutoReplyOutput = z.infer<typeof AutoReplyOutputSchema>;

export async function generateReply(input: AutoReplyInput): Promise<AutoReplyOutput> {
  return autoReplyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autoReplyPrompt',
  input: {schema: AutoReplyInputSchema},
  output: {schema: AutoReplyOutputSchema},
  prompt: `You are an AI assistant helping a user manage their chat messages. The user has activated an "auto-reply" feature. Your task is to generate a short, conversational, and helpful reply to the incoming message on their behalf.

Keep the replies brief and natural, as if the user is busy and responding quickly.

Incoming message: {{{message}}}

Generate a suitable reply.`,
});

const autoReplyFlow = ai.defineFlow(
  {
    name: 'autoReplyFlow',
    inputSchema: AutoReplyInputSchema,
    outputSchema: AutoReplyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
