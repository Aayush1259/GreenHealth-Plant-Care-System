// src/ai/flows/identify-plant.ts
'use server';

/**
 * @fileOverview Identifies the species of a plant from an image and provides information about it.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
import { processImageUrl } from '@/utils/image-utils';

const IdentifyPlantInputSchema = z.object({
  photoUrl: z.string().describe('The URL of the plant photo.'),
  contentType: z.string().optional().describe('The content type of the image.'),
  imageFile: z
    .custom<File | Blob>((val) => {
      // Allow undefined/null for server-side calls
      if (!val && typeof window === 'undefined') return true;
      if (!val) return false;
      return val instanceof File || val instanceof Blob;
    }, 'Must be a File or Blob object')
    .optional()
    .describe('The image file of the plant.'),
});
export type IdentifyPlantInput = z.infer<typeof IdentifyPlantInputSchema>;

const IdentifyPlantOutputSchema = z.object({
  commonName: z.string().describe('The common name of the identified plant.'),
  scientificName: z.string().describe('The scientific name of the identified plant.'),
  careTips: z.string().describe('Tips on how to care for the identified plant.'),
  detailedAnalysis: z.string().optional().describe('Detailed analysis of the plant.'),
  growthHabit: z.string().optional().describe('The growth habit of the plant.'),
  lifespan: z.string().optional().describe('The typical lifespan of the plant.'),
  lightRequirements: z.string().optional().describe('The light requirements for the plant.'),
  waterRequirements: z.string().optional().describe('The water requirements for the plant.'),
  soilPreferences: z.string().optional().describe('The soil preferences for the plant.'),
  suitableLocations: z.string().optional().describe('Suitable locations for growing the plant.'),
  ecosystemImpact: z.string().optional().describe('The ecological impact of the plant, including benefits to wildlife, pollinators, and environmental contributions.'),
});
export type IdentifyPlantOutput = z.infer<typeof IdentifyPlantOutputSchema>;

interface IdentifyPlantParams {
  photoUrl: string;
  contentType?: string;
  imageFile?: File | Blob;
}

/**
 * Public API: never throws, always returns a full IdentifyPlantOutput.
 */
export async function identifyPlant({
  photoUrl,
  contentType,
  imageFile,
}: IdentifyPlantParams): Promise<IdentifyPlantOutput> {
  try {
    return await identifyPlantFlow({
      photoUrl,
      contentType: contentType || '',
      ...(imageFile ? { imageFile } : {}),
    });
  } catch (error) {
    console.error('identifyPlant wrapper error:', error);
    return {
      commonName: 'Unknown Plant',
      scientificName: 'Species not identified',
      careTips: '',
      detailedAnalysis: '',
      growthHabit: '',
      lifespan: '',
      lightRequirements: '',
      waterRequirements: '',
      soilPreferences: '',
      suitableLocations: '',
      ecosystemImpact: '',
    };
  }
}

/**
 * Server-side only variant, also never throws.
 */
export async function serverIdentifyPlant(
  photoUrl: string,
  contentType: string = 'image/jpeg'
): Promise<IdentifyPlantOutput> {
  try {
    return await identifyPlantFlow({ photoUrl, contentType });
  } catch (error) {
    console.error('serverIdentifyPlant error:', error);
    return {
      commonName: 'Error Processing Request',
      scientificName: 'Processing Error',
      careTips: 'Our AI service is currently unavailable. Please try again later.',
      detailedAnalysis: 'There was a problem processing your request. Please try again later.',
      growthHabit: '',
      lifespan: '',
      lightRequirements: '',
      waterRequirements: '',
      soilPreferences: '',
      suitableLocations: '',
      ecosystemImpact: '',
    };
  }
}

const prompt = ai.definePrompt({
  name: 'identifyPlantPrompt',
  input: {
    schema: z.object({
      photoUrl: z.string(),
      contentType: z.string().optional(),
    }),
  },
  output: {
    schema: IdentifyPlantOutputSchema,
  },
  prompt: `You are an expert botanist. Identify the plant species in the image provided.

Analyze the image carefully and provide detailed information about the plant species, including:
1. Common name
2. Scientific name (genus and species)
3. Care tips and maintenance requirements
4. Growth habit and physical characteristics 
5. Light, water, and soil requirements
6. Suitable growing locations (indoor, outdoor, etc.)
7. Lifespan and growth cycle
8. Ecosystem impact - describe how this plant contributes to the ecosystem, such as:
   - Benefits to wildlife (e.g., food source, shelter)
   - Support for pollinators (bees, butterflies, etc.)
   - Soil health contributions
   - Carbon sequestration or other environmental benefits
   - Native habitat restoration potential
   - Biodiversity value

Format your analysis as structured data. For care tips, use bullet points. For ecosystem impact, list specific benefits with brief explanations.

Photo: {{media url=photoUrl}}`,
});

export const identifyPlantFlow = ai.defineFlow<
  typeof IdentifyPlantInputSchema,
  typeof IdentifyPlantOutputSchema
>(
  {
    name: 'identifyPlantFlow',
    inputSchema: IdentifyPlantInputSchema,
    outputSchema: IdentifyPlantOutputSchema,
  },
  async (input) => {
    try {
      const { processedUrl, contentType } = await processImageUrl(
        input.photoUrl,
        input.contentType || 'image/jpeg'
      );

      const result = await prompt({ photoUrl: processedUrl, contentType });
      const out = result?.output;

      if (out) {
        return {
          commonName: out.commonName || 'Unknown Plant',
          scientificName: out.scientificName || 'Species not identified',
          careTips: out.careTips || '',
          detailedAnalysis: out.detailedAnalysis || '',
          growthHabit: out.growthHabit || '',
          lifespan: out.lifespan || '',
          lightRequirements: out.lightRequirements || '',
          waterRequirements: out.waterRequirements || '',
          soilPreferences: out.soilPreferences || '',
          suitableLocations: out.suitableLocations || '',
          ecosystemImpact: out.ecosystemImpact || (out as any).potentialProblems || '',
        };
      } else {
        console.error('AI prompt returned no output');
        return {
          commonName: 'Unknown Plant',
          scientificName: 'Species not identified',
          careTips: '',
          detailedAnalysis: '',
          growthHabit: '',
          lifespan: '',
          lightRequirements: '',
          waterRequirements: '',
          soilPreferences: '',
          suitableLocations: '',
          ecosystemImpact: '',
        };
      }
    } catch (err) {
      console.error('identifyPlantFlow error:', err);
      return {
        commonName: 'Unknown Plant',
        scientificName: 'Species not identified',
        careTips: '',
        detailedAnalysis: '',
        growthHabit: '',
        lifespan: '',
        lightRequirements: '',
        waterRequirements: '',
        soilPreferences: '',
        suitableLocations: '',
        ecosystemImpact: '',
      };
    }
  }
);
