
'use server';
/**
 * @fileOverview A flow to send web push notifications.
 *
 * - sendPushNotification - A function that sends a push notification.
 * - SendPushNotificationInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import webpush from 'web-push';

// Define the input schema for Zod
const PushSubscriptionSchema = z.object({
  endpoint: z.string(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

const SendPushNotificationInputSchema = z.object({
  subscription: PushSubscriptionSchema,
  payload: z.string().describe("A JSON string containing the notification payload (title, body, url, etc)."),
});

export type SendPushNotificationInput = z.infer<typeof SendPushNotificationInputSchema>;

export async function sendPushNotification(input: SendPushNotificationInput): Promise<void> {
  return sendPushNotificationFlow(input);
}

const sendPushNotificationFlow = ai.defineFlow(
  {
    name: 'sendPushNotificationFlow',
    inputSchema: SendPushNotificationInputSchema,
    outputSchema: z.void(),
  },
  async ({ subscription, payload }) => {
    const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error('Cannot send notification: VAPID keys are not configured in .env file.');
      return;
    }
    
    webpush.setVapidDetails(
      'mailto:<someone@example.com>',
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    try {
      await webpush.sendNotification(subscription, payload);
      console.log('Push notification sent successfully.');
    } catch (error: any) {
      console.error('Error sending push notification:', error);
      // If the subscription is expired or invalid, you might want to remove it from the database.
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.error('Subscription has expired or is no longer valid: ', error);
        // Here you would typically trigger an action to remove the subscription from your database.
      }
    }
  }
);
