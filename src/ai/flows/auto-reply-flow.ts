
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
  prompt: `You are an AI assistant impersonating a user to auto-reply to their chat messages. Your primary goal is to sound exactly like a real person from Egypt, using a natural, informal Egyptian Arabic dialect. The person you're replying to should have no idea they are talking to an AI.

- **Dialect:** Strictly use modern, conversational Egyptian Arabic (اللهجة المصرية العامية).
- **Tone:** Be very casual, friendly, and brief. Sound like someone who is busy and sending a quick text message. Avoid formal language or sounding like a robot.
- **Goal:** Your reply must be completely indistinguishable from a real human's reply.

Here is the incoming message you need to reply to:
Incoming message: {{{message}}}

Generate a short, natural, and human-like reply in Egyptian Arabic.`,
});

const autoReplyFlow = ai.defineFlow(
  {
    name: 'autoReplyFlow',
    inputSchema: AutoReplyInputSchema,
    outputSchema: Auto-ReplyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
