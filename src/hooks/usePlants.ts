import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Type definitions
export interface Plant {
  id: string;
  commonName: string;
  scientificName?: string;
  detailedAnalysis?: string;
  growthHabit?: string;
  lifespan?: string;
  lightRequirements?: string;
  waterRequirements?: string;
  soilPreferences?: string;
  suitableLocations?: string;
  potentialProblems?: string;
  careTips?: string;
  imageUrl?: string;
  createdAt: string;
  userId: string;
  user?: {
    name?: string;
    email: string;
  };
}

export interface CreatePlantData {
  commonName: string;
  scientificName?: string;
  detailedAnalysis?: string;
  growthHabit?: string;
  lifespan?: string;
  lightRequirements?: string;
  waterRequirements?: string;
  soilPreferences?: string;
  suitableLocations?: string;
  potentialProblems?: string;
  careTips?: string;
  imageUrl?: string;
  userId: string;
}

// Fetch all plants
const fetchPlants = async (): Promise<Plant[]> => {
  const response = await fetch('/api/plants');
  if (!response.ok) {
    throw new Error('Failed to fetch plants');
  }
  return response.json();
};

// Create a new plant
const createPlant = async (data: CreatePlantData): Promise<Plant> => {
  const response = await fetch('/api/plants', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create plant');
  }
  
  return response.json();
};

// Hook for fetching plants
export function usePlants() {
  return useQuery({
    queryKey: ['plants'],
    queryFn: fetchPlants,
  });
}

// Hook for creating a plant
export function useCreatePlant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createPlant,
    onSuccess: () => {
      // Invalidate and refetch plants list query
      queryClient.invalidateQueries({ queryKey: ['plants'] });
    },
  });
} 