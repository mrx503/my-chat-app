
'use server';
/**
 * @fileOverview A flow to send web push notifications.
 *
 * - sendNotification - A function that sends a push notification.
 * - SendNotificationInput - The input type for the sendNotification function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as webpush from 'web-push';
import type { PushSubscription } from '@/lib/types';

const SendNotificationInputSchema = z.object({
  subscription: z.any().describe('The PushSubscription object of the recipient.'),
  payload: z.object({
    title: z.string().describe('The title of the notification.'),
    body: z.string().describe('The body text of the notification.'),
    url: z.string().url().describe('The URL to open when the notification is clicked.'),
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

    // Initialize web-push inside the flow to ensure env variables are loaded.
    webpush.setVapidDetails(
      'mailto:your-email@example.com',
      vapidPublicKey,
      vapidPrivateKey
    );
    
    // The subscription object from Firestore might not be in the exact format web-push expects.
    // Ensure it matches the PushSubscription interface.
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
      // Optional: If the subscription is invalid (e.g., 410 Gone),
      // you might want to remove it from your database.
    }
  }
);
