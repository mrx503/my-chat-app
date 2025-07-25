
'use server';
/**
 * @fileOverview A flow to send web push notifications.
 *
 * - sendNotification - A function that sends a push notification.
 * - SendNotificationInput - The input type for the sendNotification function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as webpush from 'web-push';

const SendNotificationInputSchema = z.object({
  subscription: z.any().describe('The PushSubscription object of the recipient.'),
  payload: z.object({
    title: z.string().describe('The title of the notification.'),
    body: z.string().describe('The body text of the notification.'),
    tag: z.string().optional().describe('The tag to group notifications.'),
    icon: z.string().optional().describe('URL of the notification icon.'),
    image: z.string().optional().describe('URL of an image to show in the notification.'),
    badge: z.string().optional().describe('URL of the badge icon.'),
    actions: z.array(z.object({
      action: z.string(),
      title: z.string(),
      icon: z.string().optional()
    })).optional().describe('Interactive action buttons for the notification.')
  }).describe('The notification content.'),
});

export type SendNotificationInput = z.infer<typeof SendNotificationInputSchema>;

export async function sendNotification(input: SendNotificationInput): Promise<void> {
  return sendNotificationFlow(input);
}

const sendNotificationFlow = ai.defineFlow(
  {
    name: 'sendNotificationFlow',
    inputSchema: SendNotificationInputSchema,
    outputSchema: z.void(),
  },
  async ({ subscription, payload }) => {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('Cannot send notification: VAPID keys are not configured in .env file.');
      return;
    }

    webpush.setVapidDetails(
      'mailto:your-email@example.com',
      vapidPublicKey,
      vapidPrivateKey
    );
    
    const sub: webpush.PushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    };

    try {
      await webpush.sendNotification(
        sub,
        JSON.stringify(payload)
      );
    } catch (error) {
      console.error("Error sending push notification", error);
    }
  }
);
