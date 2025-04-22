/**
 * Image utility functions for handling various image formats and conversions
 */

/**
 * Converts a blob or data URL to a format suitable for AI processing
 * This function handles different URL formats and ensures proper contentType
 */
export async function processImageUrl(url: string, defaultContentType: string = 'image/jpeg'): Promise<{ 
  processedUrl: string; 
  contentType: string;
  mimeType: string;
}> {
  let contentType = defaultContentType;
  let mimeType = defaultContentType;

  // Already a data URL
  if (url.startsWith('data:')) {
    const contentTypeMatch = url.match(/^data:([^;]+);/);
    contentType = contentTypeMatch ? contentTypeMatch[1] : defaultContentType;
    mimeType = contentType;
    return { processedUrl: url, contentType, mimeType };
  }
  
  // Blob URL - cannot be fetched directly in server components
  if (url.startsWith('blob:')) {
    return { processedUrl: url, contentType: defaultContentType, mimeType: defaultContentType };
  }
  
  // Handle file paths
  if (url.includes('/') || url.includes('\\')) {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
      default:
        contentType = defaultContentType;
    }
    mimeType = contentType;
  }
  
  // Handle Cloudinary and other remote URLs
  if (url.includes('cloudinary.com') || url.includes('unsplash.com')) {
    if (url.endsWith('.jpg') || url.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (url.endsWith('.png')) {
      contentType = 'image/png';
    } else if (url.endsWith('.gif')) {
      contentType = 'image/gif';
    } else if (url.endsWith('.webp')) {
      contentType = 'image/webp';
    }
    mimeType = contentType;
  }
  
  return { processedUrl: url, contentType, mimeType };
}

/**
 * Extracts content type from a data URL
 */
export function getContentTypeFromDataUrl(dataUrl: string, defaultType: string = 'image/jpeg'): string {
  const contentTypeMatch = dataUrl.match(/^data:([^;]+);/);
  return contentTypeMatch ? contentTypeMatch[1] : defaultType;
}

/**
 * Converts a File object to a data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Gets the MIME type from a File object or falls back to a default
 */
export function getMimeType(file: File | null, defaultType: string = 'image/jpeg'): string {
  if (!file) return defaultType;
  return file.type || defaultType;
} 