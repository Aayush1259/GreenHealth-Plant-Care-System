'use server';

import { v2 as cloudinary } from 'cloudinary';

// Check if we're in development or production
const isDevelopment = process.env.NODE_ENV === 'development';

// Configure Cloudinary with environment variables
try {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dummy-cloud',
    api_key: process.env.CLOUDINARY_API_KEY || (isDevelopment ? 'development-key' : undefined),
    api_secret: process.env.CLOUDINARY_API_SECRET || (isDevelopment ? 'development-secret' : undefined),
    secure: true
  });
  
  if (isDevelopment && (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET)) {
    console.warn('⚠️ Missing Cloudinary API credentials in development mode - using placeholders');
  }
} catch (error) {
  if (isDevelopment) {
    console.warn('⚠️ Error configuring Cloudinary:', error);
  } else {
    throw error;
  }
}

/**
 * Upload an image to Cloudinary from a base64 string or url
 * @param file Base64 string or URL of the image
 * @param folder Folder to upload to in Cloudinary
 * @returns Cloudinary upload result with URL and other metadata
 */
export async function uploadToCloudinary(file: string, folder: string = 'plant-images') {
  try {
    // Development mode mock if Cloudinary isn't properly configured
    if (isDevelopment && (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET)) {
      console.log('⚠️ Using mock Cloudinary upload in development');
      
      // Return mock data for development
      const timestamp = Date.now();
      return {
        url: `https://res.cloudinary.com/demo/image/upload/sample.jpg?t=${timestamp}`,
        publicId: `mock-public-id-${timestamp}`,
        success: true
      };
    }
    
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'image',
      // Optional transformations
      // transformation: [{ width: 1000, crop: 'limit' }]
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      success: true
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    
    // In development, return mock data on error
    if (isDevelopment) {
      console.log('⚠️ Returning mock data after Cloudinary error');
      const timestamp = Date.now();
      return {
        url: `https://res.cloudinary.com/demo/image/upload/sample.jpg?t=${timestamp}`,
        publicId: `error-mock-id-${timestamp}`,
        success: true
      };
    }
    
    return {
      url: '',
      publicId: '',
      success: false,
      error
    };
  }
}

/**
 * Delete an image from Cloudinary
 * @param publicId The public_id of the image to delete
 * @returns Success status and message
 */
export async function deleteFromCloudinary(publicId: string) {
  try {
    // Development mode mock if Cloudinary isn't properly configured
    if (isDevelopment && (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET)) {
      console.log('⚠️ Using mock Cloudinary delete in development');
      return {
        success: true,
        message: 'ok'
      };
    }
    
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
      message: result.result
    };
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    
    // In development, return success on error
    if (isDevelopment) {
      return {
        success: true,
        message: 'mock delete ok'
      };
    }
    
    return {
      success: false,
      error
    };
  }
} 