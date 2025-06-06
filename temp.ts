"use server";
/**
 * @fileOverview An AI-powered assistant for plant care advice.
 *
 * - askGreenAiAssistant - A function that handles the plant care question and returns personalized advice.
 * - AskGreenAiAssistantInput - The input type for the askGreenAiAssistant function.
 * - AskGreenAiAssistantOutput - The return type for the askGreenAiAssistant function.
 */

import { ai } from "@/ai/ai-instance";
import { z } from "genkit";
import { getFertilizer, Fertilizer } from "@/services/fertilizer";
import { getMockResponse } from "../mock-response";

const AskGreenAiAssistantInputSchema = z.object({
  question: z.string().describe("The question about plant care."),
});
export type AskGreenAiAssistantInput = z.infer<
  typeof AskGreenAiAssistantInputSchema
>;

const AskGreenAiAssistantOutputSchema = z.object({
  advice: z.string().describe("Personalized advice for plant care."),
});
export type AskGreenAiAssistantOutput = z.infer<
  typeof AskGreenAiAssistantOutputSchema
>;

export async function askGreenAiAssistant(
  input: AskGreenAiAssistantInput,
): Promise<AskGreenAiAssistantOutput> {
  try {
    // Check if we have an API key
    if (!process.env.GOOGLE_GENAI_API_KEY) {
      console.log("No API key found, using mock response");
      return {
        advice: getMockResponse(input.question),
      };
    }

    try {
      // Regular AI processing with Gemini API
      return await askGreenAiAssistantFlow(input);
    } catch (aiError) {
      console.error("Error in AI processing:", aiError);
      console.log("AI generated an error response, falling back to mock");
      return {
        advice: getMockResponse(input.question),
      };
    }
  } catch (error) {
    console.error("Error in AI assistant:", error);
    // Fallback to mock response on error
    return {
      advice: getMockResponse(input.question),
    };
  }
}

const fertilizerTool = ai.defineTool(
  {
    name: "getFertilizerInfo",
    description: "Retrieves information about a specific fertilizer.",
    inputSchema: z.object({
      fertilizerName: z
        .string()
        .describe("The name of the fertilizer to retrieve information about."),
    }),
    outputSchema: z.object({
      name: z.string(),
      description: z.string(),
      npk: z.string(),
    }),
  },
  async (input) => {
    return getFertilizer(input.fertilizerName);
  },
);

const prompt = ai.definePrompt({
  name: "askGreenAiAssistantPrompt",
  input: {
    schema: z.object({
      question: z.string().describe("The question about plant care."),
    }),
  },
  output: {
    schema: z.object({
      advice: z.string().describe("Personalized advice for plant care."),
    }),
  },
  tools: [fertilizerTool],
  prompt: `You are a specialized AI assistant providing expert advice ONLY about plants, trees, and leaves.

IMPORTANT RESTRICTIONS:
- You MUST ONLY answer questions related to plants, trees, leaves, gardening, plant care, plant identification, plant diseases, or plant-related topics.
- If the user asks about ANY other topic not related to plants (e.g., animals, technology, politics, etc.), politely inform them that you can only assist with plant-related inquiries.
- Your response format for non-plant questions should be: "I'm specialized in plant knowledge only. I can help with questions about plants, trees, gardening, or plant care. Please ask me something about plants!"

For plant-related questions, you should address topics including:
- Plant care, growth, and maintenance
- Plant identification and characteristics
- Plant diseases and treatments
- Regional plants and native flora (e.g., "What plants are found in Gujarat?")
- Geographic distribution of plants (e.g., "Where are rubber trees typically grown?")
- Plant habitats and growing conditions
- Gardening techniques and best practices
- Plant uses (culinary, medicinal, decorative)
- Seasonal considerations for plants
- Fertilizers and soil conditions
- Cultural significance of plants in different regions and traditions
- Plant names in different languages (e.g., "What is the Gujarati name for Jasmine?")
- Historical and traditional uses of plants in different cultures
- Religious or spiritual significance of plants in various traditions

Provide detailed, accurate, and helpful information based on the specific question asked.
Use the getFertilizerInfo tool if the user asks about a specific fertilizer.
Be thorough but concise in your explanations.

When answering questions about plant names in different languages or cultural contexts:
1. Provide the proper translation if you know it
2. Include the scientific name when possible
3. Mention any cultural significance associated with the plant in that culture
4. If relevant, briefly explain how the plant is used traditionally in that culture

Question: {{{question}}}`,
});

const askGreenAiAssistantFlow = ai.defineFlow<
  typeof AskGreenAiAssistantInputSchema,
  typeof AskGreenAiAssistantOutputSchema
>(
  {
    name: "askGreenAiAssistantFlow",
    inputSchema: AskGreenAiAssistantInputSchema,
    outputSchema: AskGreenAiAssistantOutputSchema,
  },
  async (input) => {
    try {
      if (!process.env.GOOGLE_GENAI_API_KEY) {
        console.warn(
          "Google Gemini API key not found in environment variables",
        );
        return {
          advice: getMockResponse(input.question),
        };
      }

      const result = await prompt({
        question: input.question,
      });

      // Enhanced validation of output
      if (!result || !result.output) {
        console.error("AI prompt returned null or undefined result");
        return {
          advice: getMockResponse(input.question),
        };
      }

      // Ensure advice property exists and is a non-empty string
      if (
        typeof result.output.advice !== "string" ||
        !result.output.advice.trim()
      ) {
        console.error("AI prompt returned empty or invalid advice");
        return {
          advice: getMockResponse(input.question),
        };
      }

      return result.output;
    } catch (error) {
      console.error("Error in Green AI Assistant:", error);
      return {
        advice: getMockResponse(input.question),
      };
    }
  },
);
