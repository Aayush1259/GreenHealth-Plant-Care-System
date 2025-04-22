/**
 * Client-side Cloudinary utilities (browser-safe)
 * This file provides alternatives to the Node.js Cloudinary SDK functions
 * that work in the browser environment.
 */

/**
 * Upload an image to Cloudinary from a base64 string or url
 * @param file Base64 string or data URL of the image
 * @param folder Folder to upload to in Cloudinary
 * @returns Cloudinary upload result with URL and other metadata
 */
export async function uploadToCloudinary(file: string, folder: string = 'plant-images') {
  try {
    // For client-side uploads, we'll use the upload API directly
    const formData = new FormData();
    
    // If the file is a data URL, we need to convert it to a blob first
    let fileToUpload: Blob;
    if (file.startsWith('data:')) {
      // Convert data URL to blob
      const response = await fetch(file);
      fileToUpload = await response.blob();
    } else {
      // Assuming it's already a blob or url
      fileToUpload = await (await fetch(file)).blob();
    }
    
    formData.append('file', fileToUpload);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
    formData.append('folder', folder);
    
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    
    if (!cloudName) {
      throw new Error('Cloudinary cloud name not provided');
    }
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      success: true
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return {
      url: '',
      publicId: '',
      success: false,
      error
    };
  }
}

/**
 * Delete an image from Cloudinary (requires server-side API call)
 * For client-side, this would typically be done via a server API endpoint
 */
export async function deleteFromCloudinary(publicId: string) {
  try {
    // In browser environments, deletion should be handled by an API endpoint
    const response = await fetch('/api/upload?publicId=' + encodeURIComponent(publicId), {
      method: 'DELETE',
    });
    
    const result = await response.json();
    return {
      success: result.success,
      message: result.message || 'Deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return {
      success: false,
      error
    };
  }
} 