
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
    
    const client = new OneSignal.DefaultApi(OneSignal.createConfiguration({
        authMethods: {
            app_key: {
                tokenProvider: {
                    getToken() {
                        return ONE_SIGNAL_REST_API_KEY!;
                    }
                }
            }
        }
    }));

    const notification = new OneSignal.Notification();
    notification.app_id = ONE_SIGNAL_APP_ID;
    notification.include_player_ids = [playerId];
    notification.headings = { en: title };
    notification.contents = { en: body };
    // The web_url should be the base URL. The client-side code will handle routing.
    notification.web_url = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/`;
    // Pass the chatId in the data payload so the client can navigate to the correct chat.
    notification.data = { chatId: chatId };
    notification.web_buttons = [
        { id: 'reply', text: 'Reply' },
        { id: 'mark-read', text: 'Mark as read' }
    ];

    try {
      const response = await client.createNotification(notification);
      console.log("OneSignal notification sent successfully:", response);
    } catch (error: any) {
      console.error("Error sending OneSignal notification", error?.body || error);
    }
  }
);
