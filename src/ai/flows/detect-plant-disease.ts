'use server';

/**
 * @fileOverview Detects plant diseases from an image and provides information on symptoms, causes, treatments, and prevention methods.
 *
 * - detectPlantDisease - A function that handles the plant disease detection process.
 * - DetectPlantDiseaseInput - The input type for the detectPlantDisease function.
 * - DetectPlantDiseaseOutput - The return type for the detectPlantDisease function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {getFertilizer, Fertilizer} from '@/services/fertilizer';
import { processImageUrl } from '@/utils/image-utils';

const DetectPlantDiseaseInputSchema = z.object({
  photoUrl: z.string().describe('The URL of the plant photo.'),
  contentType: z.string().optional().describe('The content type of the image.')
});
export type DetectPlantDiseaseInput = z.infer<typeof DetectPlantDiseaseInputSchema>;

const DetectPlantDiseaseOutputSchema = z.object({
  diseaseDetected: z.boolean().describe('Whether a disease was detected in the plant.'),
  diseaseName: z.string().nullable().transform(value => value || '').describe('The name of the detected disease.'),
  detectedPlant: z.string().optional().describe('The name of the plant that was detected.'),
  quickSummary: z.string().optional().describe('A quick summary of the disease detection.'),
  plantCondition: z.string().optional().describe('The current condition of the plant.'),
  symptoms: z.string().optional().describe('The symptoms observed in the plant.'),
  causes: z.string().optional().describe('The likely causes of the disease.'),
  treatments: z.string().optional().describe('Recommended treatments for the disease.'),
  recommendedActions: z.string().optional().describe('Recommended actions to take.'),
  careInstructions: z.string().optional().describe('Detailed care instructions.'),
  prevention: z.string().optional().describe('Prevention measures.'),
  fertilizerRecommendation: z.string().optional().describe('Recommended fertilizer usage.'),
  ecosystemImpact: z.string().optional().describe('The impact on the ecosystem.'),
  additionalTips: z.string().optional().describe('Additional tips and information.'),
  confidence: z.number().optional().describe('Confidence level in disease detection (percentage).'),
});
export type DetectPlantDiseaseOutput = z.infer<typeof DetectPlantDiseaseOutputSchema>;

export async function detectPlantDisease(input: DetectPlantDiseaseInput): Promise<DetectPlantDiseaseOutput> {
  return detectPlantDiseaseFlow(input);
}

const getFertilizerInfo = ai.defineTool({
  name: 'getFertilizerInfo',
  description: 'Retrieves information about a specific fertilizer.',
  inputSchema: z.object({
    fertilizerName: z.string().describe('The name of the fertilizer to retrieve information for.'),
  }),
  outputSchema: z.object({
    name: z.string(),
    description: z.string(),
    npk: z.string(),
  }).nullable(),
},
async input => {
  try {
    const fertilizer = await getFertilizer(input.fertilizerName);
    return fertilizer;
  } catch (e) {
    return null;
  }
});

const prompt = ai.definePrompt({
  name: 'detectPlantDiseasePrompt',
  input: {
    schema: z.object({
      photoUrl: z.string().describe('The URL of the plant photo.'),
      contentType: z.string().optional().describe('The content type of the image.')
    }),
  },
  output: {
    schema: DetectPlantDiseaseOutputSchema,
  },
  tools: [getFertilizerInfo],
  prompt: `You are a plant pathologist AI.
Analyze this image and provide the following:

0. Detected Plant:
   - Identify the plant species visible in the image
   - Be specific about the variety if possible

1. Quick Summary:
   - Provide a one-paragraph overview of your findings
   - Include urgency level (low/medium/high) based on severity

2. Plant Condition:
   - Describe the overall health status
   - Note any visible stress indicators

3. Likely Causes:
   - List the most probable causes for the observed condition
   - Specify if it's a disease, pest, environmental stress, nutrient deficiency, etc.
   - Include the scientific name of any pathogens if applicable

4. Recommended Actions:
   - Provide step-by-step instructions for immediate treatment
   - Include organic and conventional options
   - Specify application methods and frequencies

5. Care Instructions:
   - Detail optimal watering, light, and soil requirements
   - Include any special needs for recovery

6. Prevention Guide:
   - Outline strategies to prevent recurrence
   - Address environmental and care factors that contribute to problems

7. Additional Tips:
   - Provide specialized advice for this specific plant/condition
   - Include any seasonal considerations

8. Ecosystem Impact:
   - Explain how this condition might affect surrounding plants
   - Note any potential spread concerns

9. Basic Disease Information:
   - If a disease is detected, provide background information
   - Include pathogen type, life cycle, and typical progression

10. Detailed Care Instructions:
    - Provide a comprehensive recovery plan
    - Include fertilization recommendations with specific products if appropriate
    - Specify long-term care adjustments needed

Please be thorough and specific in your analysis. Provide a confidence score (percentage) for your diagnosis.

{{media url=photoUrl}}
`,
});

const detectPlantDiseaseFlow = ai.defineFlow<
  typeof DetectPlantDiseaseInputSchema,
  typeof DetectPlantDiseaseOutputSchema
>({
  name: 'detectPlantDiseaseFlow',
  inputSchema: DetectPlantDiseaseInputSchema,
  outputSchema: DetectPlantDiseaseOutputSchema,
}, async input => {
  // Use the new utility function to process the image URL
  try {
    const { processedUrl, contentType } = await processImageUrl(input.photoUrl, input.contentType || 'image/jpeg');
    
    const processedInput = {
      photoUrl: processedUrl,
      contentType: contentType
    };
    
    console.log("detectPlantDiseaseFlow input:", { 
      url: processedInput.photoUrl.substring(0, 50) + "...", 
      contentType: processedInput.contentType 
    });

    try {
      const {output} = await prompt(processedInput);
      
      // Ensure all required fields are present and match the output schema types
      return {
        diseaseDetected: output?.diseaseName ? true : false,
        diseaseName: output?.diseaseName || '', // Empty string instead of null to match schema
        detectedPlant: output?.detectedPlant || "Unknown Plant",
        quickSummary: output?.quickSummary || "Analysis completed",
        plantCondition: output?.plantCondition || "See details below",
        symptoms: output?.symptoms || "",
        causes: output?.causes || "",
        treatments: output?.treatments || "",
        recommendedActions: output?.recommendedActions || "Monitor plant health",
        careInstructions: output?.careInstructions || "",
        prevention: output?.prevention || "",
        fertilizerRecommendation: output?.fertilizerRecommendation || "",
        ecosystemImpact: output?.ecosystemImpact || "",
        additionalTips: output?.additionalTips || "",
        confidence: output?.confidence || 85, // Default confidence if not provided
      };
    } catch (promptError) {
      console.error("Error in plant disease prompt:", promptError);
      // Return a graceful default response on prompt error
      return {
        diseaseDetected: false,
        diseaseName: '', // Empty string instead of null to match schema
        detectedPlant: "Unknown Plant",
        quickSummary: "The analysis could not be completed due to a processing error.",
        plantCondition: "Unable to determine",
        recommendedActions: "Please try again with a clearer image or contact support if the issue persists.",
        confidence: 0
      };
    }
  } catch (error) {
    console.error("Error in plant disease detection:", error);
    // Return a graceful default response on error
    return {
      diseaseDetected: false,
      diseaseName: '', // Empty string instead of null to match schema
      detectedPlant: "Unknown Plant",
      quickSummary: "The analysis could not be completed due to a technical error.",
      plantCondition: "Unable to determine",
      recommendedActions: "Please try again later or contact support if the issue persists.",
      confidence: 0
    };
  }
});
