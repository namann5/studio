import { config } from 'dotenv';
config();

import '@/ai/flows/initial-mood-assessment.ts';
import '@/ai/flows/generate-coping-strategies.ts';
import '@/ai/flows/contextual-mood-assessment.ts';
import '@/ai/flows/generate-chat-response.ts';
import '@/ai/flows/convert-audio-to-wav.ts';
