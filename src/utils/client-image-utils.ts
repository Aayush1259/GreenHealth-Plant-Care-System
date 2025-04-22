/**
 * Client-side utilities for handling image conversion and processing
 * These functions should only be used in client components or event handlers
 */

/**
 * Converts a blob URL to a data URL
 * This is needed because server components can't directly fetch blob URLs
 */
export async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
  try {
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch blob URL: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (error) => {
        reject(new Error(`FileReader error: ${error}`));
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting blob URL to data URL:", error);
    throw error;
  }
}

/**
 * Converts a File object to a data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = (error) => {
      reject(new Error(`FileReader error: ${error}`));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a canvas to a data URL with the specified MIME type and quality
 */
export function canvasToDataUrl(
  canvas: HTMLCanvasElement, 
  mimeType: string = 'image/jpeg', 
  quality: number = 0.8
): string {
  return canvas.toDataURL(mimeType, quality);
} 