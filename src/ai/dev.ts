
import { config } from 'dotenv';
config({ path: `.env.local` });

import '@/ai/flows/analyze-sentiment.ts';
import '@/ai/flows/auto-reply-flow.ts';
import '@/ai/flows/send-push-notification.ts';
