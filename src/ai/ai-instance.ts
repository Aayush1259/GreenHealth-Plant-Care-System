import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Disable OpenTelemetry to fix build errors
process.env.OTEL_SDK_DISABLED = 'true';

// Check for missing API key
const apiKey = process.env.GOOGLE_GENAI_API_KEY;
if (!apiKey) {
  console.warn('WARNING: GOOGLE_GENAI_API_KEY is not set. AI features will not work correctly.');
  console.warn('Please set the GOOGLE_GENAI_API_KEY environment variable in your .env file.');
}

// Initialize Google Generative AI directly for proper configuration
const genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');

// Create AI instance with proper configuration
export const ai = genkit({
  promptDir: './src/ai/prompts',
  plugins: [
    googleAI({
      apiKey: apiKey || 'dummy-key', // Use dummy key to prevent runtime errors
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
