'use server';

import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary-server';

/**
 * Server action to upload an image to Cloudinary
 */
export async function uploadImageToCloudinary(image: string, folder?: string) {
  try {
    const result = await uploadToCloudinary(image, folder);
    return result;
  } catch (error) {
    console.error('Error in server action:', error);
    return {
      url: '',
      publicId: '',
      success: false,
      error
    };
  }
}

/**
 * Server action to delete an image from Cloudinary
 */
export async function deleteImageFromCloudinary(publicId: string) {
  try {
    const result = await deleteFromCloudinary(publicId);
    return result;
  } catch (error) {
    console.error('Error in server action:', error);
    return {
      success: false,
      error
    };
  }
} 