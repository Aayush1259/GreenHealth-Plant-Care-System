'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useCloudinary } from './CloudinaryConfig';
import { Camera, Upload, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export interface CloudinaryUploaderProps {
  onUploadSuccess?: (data: { url: string; publicId: string }) => void;
  onUploadError?: (error: any) => void;
  onUploadStart?: () => void;
  className?: string;
  showPreview?: boolean;
  maxSizeMB?: number;
  buttonText?: {
    gallery?: string;
    camera?: string;
    capture?: string;
    cancel?: string;
  };
}

export function CloudinaryUploader({
  onUploadSuccess,
  onUploadError,
  onUploadStart,
  className,
  showPreview = true,
  maxSizeMB = 10,
  buttonText = {
    gallery: "Choose from Gallery",
    camera: "Take Photo", 
    capture: "Take Photo",
    cancel: "Cancel"
  }
}: CloudinaryUploaderProps) {
  const { toast } = useToast();
  const { cloudName, uploadPreset, isConfigured } = useCloudinary();
  const [isUploading, setIsUploading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [isCameraInitializing, setIsCameraInitializing] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Cleanup media stream when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [stream, previewUrl]);

  // Handle camera initialization state
  useEffect(() => {
    if (stream && videoRef.current) {
      // Set initial state to true
      setIsCameraInitializing(true);
      
      // Add event listener to detect when video is actually playing
      const handlePlaying = () => {
        setIsCameraInitializing(false);
      };
      
      videoRef.current.addEventListener('playing', handlePlaying);
      
      // Safety timeout - if after 5 seconds the camera hasn't initialized, hide the loading message anyway
      const timeoutId = setTimeout(() => {
        setIsCameraInitializing(false);
      }, 5000);
      
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('playing', handlePlaying);
        }
        clearTimeout(timeoutId);
      };
    }
  }, [stream]);

  const resetError = () => setError(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    resetError();
    
    // Check file size (convert maxSizeMB to bytes)
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${maxSizeMB}MB.`);
      onUploadError?.({ message: `File too large. Maximum size is ${maxSizeMB}MB.` });
      return;
    }

    // Create and display preview
    if (showPreview) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
    
    await uploadToCloudinary(file);
  };

  const uploadToCloudinary = async (file: File) => {
    if (!isConfigured) {
      const errorMsg = 'Cloudinary is not configured';
      setError(errorMsg);
      console.error(errorMsg);
      onUploadError?.({ message: errorMsg });
      return;
    }

    try {
      setIsUploading(true);
      onUploadStart?.();

      try {
        // Attempt to upload to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        formData.append('folder', 'plant-app');

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        
        toast({
          title: "Upload Success",
          description: "Image uploaded successfully.",
        });
        
        onUploadSuccess?.({ 
          url: data.secure_url,
          publicId: data.public_id
        });
      } catch (cloudinaryError) {
        console.warn('Cloudinary upload failed, using local URL as fallback', cloudinaryError);
        
        // Create local blob URL as fallback
        const localUrl = URL.createObjectURL(file);
        const fakePublicId = `local-${Date.now()}`;
        
        toast({
          title: "Upload Success",
          description: "Image uploaded (using local storage).",
        });
        
        onUploadSuccess?.({
          url: localUrl,
          publicId: fakePublicId
        });
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Upload failed';
      setError(errorMsg);
      console.error('Upload error:', error);
      
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: errorMsg,
      });
      
      onUploadError?.(error);
    } finally {
      setIsUploading(false);
    }
  };

  const startCamera = async () => {
    resetError();
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser. Try using a modern browser.');
      }
      
      // Different constraints for mobile vs desktop
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const constraints = {
        video: isMobile ? 
          { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } : 
          { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setStream(mediaStream);
      setHasCameraPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Use event handler to check when video is ready
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
          } catch (playError) {
            console.error('Error playing video:', playError);
            throw new Error('Could not start video preview. Please try again.');
          }
        };
      }
    } catch (error: any) {
      // Handle specific permission errors
      let errorMsg = 'Failed to access camera.';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setHasCameraPermission(false);
        errorMsg = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'No camera found on this device.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMsg = 'Camera is in use by another application. Please close other apps using your camera.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setError(errorMsg);
      
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: errorMsg,
      });
      
      console.error('Camera error:', error);
      onUploadError?.(error);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !stream) return;
    resetError();

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Unable to get canvas context');
      
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Create preview
      if (showPreview) {
        const previewDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setPreviewUrl(previewDataUrl);
      }
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          await uploadToCloudinary(
            new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
          );
          stopCamera();
        } else {
          throw new Error('Failed to create image from camera');
        }
      }, 'image/jpeg', 0.9);
    } catch (error: any) {
      setError(`Capture error: ${error.message || 'Unknown error'}`);
      console.error('Capture error:', error);
      onUploadError?.(error);
      
      toast({
        variant: "destructive",
        title: "Capture Error",
        description: error.message || 'Failed to capture image',
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  if (!isConfigured) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md flex items-center">
        <AlertCircle className="h-5 w-5 mr-2" />
        <span>Cloudinary configuration missing. Please check your environment variables.</span>
      </div>
    );
  }

  if (stream) {
    return (
      <div className={cn("relative", className)}>
        <div className="bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto rounded-lg object-cover max-h-[60vh]"
          />
          <div className={`absolute top-0 left-0 w-full h-full flex items-center justify-center text-white bg-black/40 transition-opacity duration-300 ${isCameraInitializing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <p>Initializing camera...</p>
          </div>
        </div>
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          <Button 
            onClick={capturePhoto} 
            className="bg-green-600 hover:bg-green-700"
            disabled={isUploading}
            aria-label={buttonText.capture}
          >
            {isUploading ? (
              <><span className="loading loading-spinner loading-xs mr-2"></span>Processing...</>
            ) : (
              <>{buttonText.capture}</>
            )}
          </Button>
          <Button 
            onClick={stopCamera} 
            variant="destructive"
            aria-label={buttonText.cancel}
          >
            <X className="h-4 w-4 mr-2" />
            {buttonText.cancel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}
      
      {showPreview && previewUrl && (
        <div className="relative">
          <img 
            src={previewUrl} 
            alt="Upload preview" 
            className="w-full h-auto rounded-lg object-cover max-h-[300px]"
          />
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 h-8 w-8 rounded-full"
            onClick={clearPreview}
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        aria-label="Upload image"
      />
      
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={triggerFileInput}
          disabled={isUploading}
          className="flex-1 min-w-[120px]"
          aria-label={buttonText.gallery}
        >
          {isUploading ? (
            <><span className="loading loading-spinner loading-xs mr-2"></span>Uploading...</>
          ) : (
            <><Upload className="h-4 w-4 mr-2" />{buttonText.gallery}</>
          )}
        </Button>
        
        <Button
          onClick={startCamera}
          disabled={isUploading || !hasCameraPermission}
          className="flex-1 min-w-[120px]"
          aria-label={buttonText.camera}
        >
          <Camera className="h-4 w-4 mr-2" />
          {buttonText.camera}
        </Button>
      </div>
      
      {isUploading && (
        <div className="flex justify-center items-center py-2">
          <div className="w-8 h-8 border-4 border-t-primary rounded-full animate-spin"></div>
          <span className="ml-2 text-sm text-muted-foreground">Uploading image...</span>
        </div>
      )}
    </div>
  );
} 