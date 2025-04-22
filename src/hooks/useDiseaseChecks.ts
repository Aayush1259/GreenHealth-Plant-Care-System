import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Type definitions
export interface DiseaseCheck {
  id: string;
  diseaseName?: string;
  confidence?: number;
  severity?: string;
  treatment?: string;
  prevention?: string;
  imageUrl?: string;
  createdAt: string;
  plantId: string;
  userId: string;
  plant?: {
    commonName: string;
    scientificName?: string;
  };
  user?: {
    name?: string;
    email: string;
  };
}

export interface CreateDiseaseCheckData {
  diseaseName?: string;
  confidence?: number;
  severity?: string;
  treatment?: string;
  prevention?: string;
  imageUrl?: string;
  plantId: string;
  userId: string;
}

// Fetch all disease checks
const fetchDiseaseChecks = async (): Promise<DiseaseCheck[]> => {
  const response = await fetch('/api/diseases');
  if (!response.ok) {
    throw new Error('Failed to fetch disease checks');
  }
  return response.json();
};

// Create a new disease check
const createDiseaseCheck = async (data: CreateDiseaseCheckData): Promise<DiseaseCheck> => {
  const response = await fetch('/api/diseases', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create disease check');
  }
  
  return response.json();
};

// Hook for fetching disease checks
export function useDiseaseChecks() {
  return useQuery({
    queryKey: ['diseaseChecks'],
    queryFn: fetchDiseaseChecks,
  });
}

// Hook for creating a disease check
export function useCreateDiseaseCheck() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createDiseaseCheck,
    onSuccess: () => {
      // Invalidate and refetch disease checks list query
      queryClient.invalidateQueries({ queryKey: ['diseaseChecks'] });
    },
  });
} 