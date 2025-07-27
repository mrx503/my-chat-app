
'use server';
/**
 * @fileOverview A flow to send web push notifications via OneSignal.
 *
 * - sendOneSignalNotification - A function that sends a push notification.
 * - SendOneSignalNotificationInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as OneSignal from '@onesignal/node-onesignal';

const SendOneSignalNotificationInputSchema = z.object({
  playerId: z.string().describe("The OneSignal Player ID of the recipient."),
  title: z.string().describe("The title of the notification."),
  body: z.string().describe("The body text of the notification."),
  chatId: z.string().describe("The ID of the chat to open on click."),
});

export type SendOneSignalNotificationInput = z.infer<typeof SendOneSignalNotificationInputSchema>;

export async function sendOneSignalNotification(input: SendOneSignalNotificationInput): Promise<void> {
  return sendOneSignalNotificationFlow(input);
}

const sendOneSignalNotificationFlow = ai.defineFlow(
  {
    name: 'sendOneSignalNotificationFlow',
    inputSchema: SendOneSignalNotificationInputSchema,
    outputSchema: z.void(),
  },
  async ({ playerId, title, body, chatId }) => {
    const ONE_SIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONE_SIGNAL_APP_ID;
    const ONE_SIGNAL_REST_API_KEY = process.env.ONE_SIGNAL_REST_API_KEY;

    if (!ONE_SIGNAL_APP_ID || !ONE_SIGNAL_REST_API_KEY) {
      console.error('Cannot send notification: OneSignal keys are not configured in .env file.');
      return;
    }
    
    const configuration = OneSignal.createConfiguration({
        userKey: 'unused', // This is not used but required by the SDK type
        appKey: ONE_SIGNAL_REST_API_KEY,
    });
    const client = new OneSignal.DefaultApi(configuration);

    const notification = new OneSignal.Notification();
    notification.app_id = ONE_SIGNAL_APP_ID;
    notification.include_player_ids = [playerId];
    notification.headings = { en: title };
    notification.contents = { en: body };
    notification.web_url = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/chat/${chatId}`;
    notification.web_buttons = [
        { id: 'reply', text: 'Reply' },
        { id: 'mark-read', text: 'Mark as read' }
    ];

    try {
      await client.createNotification(notification);
    } catch (error: any) {
      console.error("Error sending OneSignal notification", error?.body || error);
    }
  }
);
