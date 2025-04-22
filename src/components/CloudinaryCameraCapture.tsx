import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, AlertTriangle } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary-client';
import { useToast } from '@/hooks/use-toast';

interface CloudinaryCameraCaptureProps {
  onCaptureSuccess: (url: string, publicId: string) => void;
  onCaptureError?: (error: any) => void;
  buttonClassName?: string;
  buttonText?: string;
  folder?: string;
}

export default function CloudinaryCameraCapture({
  onCaptureSuccess,
  onCaptureError,
  buttonClassName = '',
  buttonText = 'Take Photo',
  folder = 'plant-images'
}: CloudinaryCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  // Check if camera is available when component mounts
  useEffect(() => {
    const checkCameraAvailability = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setErrorMessage('Camera not supported on this device or browser.');
          return;
        }
        
        // Just check if camera is available without actually starting it
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        
        if (!hasCamera) {
          setErrorMessage('No camera detected on this device.');
        }
      } catch (error) {
        console.error('Error checking camera:', error);
      }
    };
    
    checkCameraAvailability();
  }, []);
  
  // Cleanup function to ensure camera is properly stopped when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);
  
  // Function to request camera access and start video
  const startCamera = async () => {
    setErrorMessage(null);
    
    try {
      setIsCapturing(true);
      
      // First check if the browser supports mediaDevices
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
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setHasCameraPermission(true);
      setUseCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
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
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      setUseCamera(false);
      
      // Handle specific permission errors
      let errorMsg = 'Failed to access camera.';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'No camera found on this device.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMsg = 'Camera is in use by another application. Please close other apps using your camera.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      
      if (onCaptureError) {
        onCaptureError(error);
      }
      
      toast({
        variant: 'destructive',
        title: 'Camera Error',
        description: errorMsg,
      });
    } finally {
      setIsCapturing(false);
    }
  };
  
  // Function to capture image and upload to Cloudinary
  const captureImage = async () => {
    if (!videoRef.current) return;
    
    try {
      setIsCapturing(true);
      
      // Create canvas and draw the current video frame
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Convert to data URL (base64)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      try {
        // Try uploading to Cloudinary first
      const result = await uploadToCloudinary(dataUrl, folder);
      
      if (result.success) {
        // Stop camera stream
        stopCamera();
        
        // Callback with URL
        onCaptureSuccess(result.url, result.publicId);
        
        toast({
          title: 'Photo Captured',
          description: 'Image has been successfully captured and uploaded.',
        });
      } else {
          // If Cloudinary upload fails, use local storage as fallback
          console.warn('Cloudinary upload failed, using local URL as fallback');
          
          // Create a blob from the data URL
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          
          // Create a local URL for the blob
          const localUrl = URL.createObjectURL(blob);
          const fakePublicId = `local-${Date.now()}`;
          
          // Stop camera stream
          stopCamera();
          
          // Callback with local URL
          onCaptureSuccess(localUrl, fakePublicId);
          
          toast({
            title: 'Photo Captured',
            description: 'Image has been captured successfully (using local storage).',
          });
        }
      } catch (error) {
        console.error('Error with Cloudinary, using local URL instead:', error);
        
        // Create a blob from the data URL as fallback
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        
        // Create a local URL for the blob
        const localUrl = URL.createObjectURL(blob);
        const fakePublicId = `local-${Date.now()}`;
        
        // Stop camera stream
        stopCamera();
        
        // Callback with local URL
        onCaptureSuccess(localUrl, fakePublicId);
        
        toast({
          title: 'Photo Captured',
          description: 'Image has been captured successfully (using local storage).',
        });
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      
      if (onCaptureError) {
        onCaptureError(error);
      }
      
      toast({
        variant: 'destructive',
        title: 'Capture Error',
        description: 'Failed to capture and upload image. Please try again.',
      });
    } finally {
      setIsCapturing(false);
    }
  };
  
  // Function to stop camera stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
      });
      videoRef.current.srcObject = null;
    }
    
    setUseCamera(false);
  };
  
  // Toggle camera on/off
  const toggleCamera = () => {
    if (useCamera) {
      stopCamera();
    } else {
      startCamera();
    }
  };
  
  return (
    <div className="w-full">
      {errorMessage && (
        <div className="mb-3 p-3 bg-amber-50 text-amber-800 rounded-md flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 text-amber-600" />
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}
      
      {useCamera && (
        <div className="relative w-full rounded-lg overflow-hidden bg-black mb-4">
          <video 
            ref={videoRef} 
            className="w-full aspect-video object-cover rounded-md" 
            autoPlay 
            playsInline
            muted 
          />
          
          <div className="absolute bottom-3 left-0 w-full flex justify-center">
            <Button 
              onClick={captureImage} 
              disabled={isCapturing || !hasCameraPermission}
              className="bg-white/80 hover:bg-white text-black"
            >
              {isCapturing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Capture Photo'
              )}
            </Button>
          </div>
        </div>
      )}
      
      <Button 
        type="button" 
        variant="outline" 
        className={buttonClassName}
        onClick={toggleCamera}
        disabled={isCapturing}
      >
        {isCapturing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading Camera...
          </>
        ) : (
          <>
            <Camera className="mr-2 h-4 w-4" />
            {useCamera ? "Close Camera" : buttonText}
          </>
        )}
      </Button>
    </div>
  );
} 