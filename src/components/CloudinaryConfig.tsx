'use client';

import React, { createContext, useContext, ReactNode } from 'react';

// Cloudinary configuration interface
interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  isConfigured: boolean;
  useFallbackStorage: boolean;
}

// Default values with fallback settings
const defaultConfig: CloudinaryConfig = {
  cloudName: 'demo', // Cloudinary demo account as fallback
  uploadPreset: 'unsigned_upload', // Common preset name as fallback
  isConfigured: false,
  useFallbackStorage: true
};

// Create context
const CloudinaryContext = createContext<CloudinaryConfig>(defaultConfig);

// Props for the provider
interface CloudinaryProviderProps {
  children: ReactNode;
  cloudName?: string;
  uploadPreset?: string;
}

export function CloudinaryProvider({
  children,
  cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '',
}: CloudinaryProviderProps) {
  // Validate configuration
  const isConfigured = Boolean(cloudName && uploadPreset);
  
  // If not configured, use client-side storage by default
  const useFallbackStorage = !isConfigured;
  
  // Provide quiet warning in development only
  if (!isConfigured && typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.warn('Cloudinary is not properly configured. Using local storage fallback for images.');
    console.warn('To configure Cloudinary, add these to your .env.local file:');
    console.warn('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.warn('NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset');
  }

  const value = {
    // Use the provided values or fallbacks if empty
    cloudName: cloudName || defaultConfig.cloudName,
    uploadPreset: uploadPreset || defaultConfig.uploadPreset,
    isConfigured,
    useFallbackStorage
  };

  return (
    <CloudinaryContext.Provider value={value}>
      {children}
    </CloudinaryContext.Provider>
  );
}

// Custom hook to use the Cloudinary context
export function useCloudinary() {
  const context = useContext(CloudinaryContext);
  
  if (context === undefined) {
    throw new Error('useCloudinary must be used within a CloudinaryProvider');
  }
  
  return context;
}

// For settings up via environment variables
// Add to your .env.local:
// NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
// NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset 