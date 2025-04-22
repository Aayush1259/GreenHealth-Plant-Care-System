"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Leaf, Shield, Camera, ArrowLeft, Home, ImagePlus, HelpCircle, ShieldCheck, Info, Pill, Globe, Lightbulb, Check } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { detectPlantDisease } from "@/ai/flows/detect-plant-disease";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import { Badge } from "@/components/ui/badge";
import React from 'react';
import Link from "next/link";
import { Upload } from "lucide-react";
import { BottomNavbar } from '@/components/BottomNavbar';
import { CloudinaryUploader } from '@/components/CloudinaryUploader';
import CloudinaryCameraCapture from '@/components/CloudinaryCameraCapture';
import { blobUrlToDataUrl, canvasToDataUrl } from '@/utils/client-image-utils';
import { useAuth } from '@/contexts/AuthContext';
import { recordUserActivity } from '@/services/activity-service';

// Define a type for the disease results
interface DiseaseResult {
  diseaseDetected: boolean;
  diseaseName: string | null;
  detectedPlant?: string;
  quickSummary?: string;
  plantCondition?: string;
  symptoms?: string;
  causes?: string;
  treatments?: string;
  recommendedActions?: string;
  careInstructions?: string;
  prevention?: string;
  fertilizerRecommendation?: string;
  ecosystemImpact?: string;
  additionalTips?: string;
  confidence?: number;
}

// Plant disease sample images
const sampleImages = [
  'https://images.pexels.com/photos/7728689/pexels-photo-7728689.jpeg?auto=compress&cs=tinysrgb&w=500',
  'https://images.pexels.com/photos/6597437/pexels-photo-6597437.jpeg?auto=compress&cs=tinysrgb&w=500',
  'https://images.pexels.com/photos/2907636/pexels-photo-2907636.jpeg?auto=compress&cs=tinysrgb&w=500',
];

export default function DiseaseDetectionPage() {
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [detectedPlant, setDetectedPlant] = useState('');
  const [quickSummary, setQuickSummary] = useState('');
  const [plantCondition, setPlantCondition] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [causes, setCauses] = useState('');
  const [treatments, setTreatments] = useState('');
  const [recommendedActions, setRecommendedActions] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [prevention, setPrevention] = useState('');
  const [fertilizerRecommendation, setFertilizerRecommendation] = useState('');
  const [ecosystemImpact, setEcosystemImpact] = useState('');
  const [additionalTips, setAdditionalTips] = useState('');
  const [diseaseDetected, setDiseaseDetected] = useState(false);
  const [diseaseName, setDiseaseName] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useCamera, setUseCamera] = useState<boolean>(false); // State to toggle camera view
  const { toast } = useToast();
    const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [diseaseResults, setDiseaseResults] = useState<DiseaseResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(error => {
            console.error('Error playing video:', error);
            toast({
              variant: 'destructive',
              title: 'Camera Error',
              description: 'Failed to start camera preview. Please try again.',
            });
          });
        }
        setStream(stream);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    if (useCamera) {
      getCameraPermission();
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          track.stop();
          stream.removeTrack(track);
        });
        videoRef.current.srcObject = null;
      }
    };
  }, [useCamera, toast]);

  const handleCaptureClick = async () => {
    if (!useCamera) {
      setUseCamera(true);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(mediaStream);
    if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        toast({
          variant: 'destructive',
          title: 'Camera Error',
          description: 'Could not access camera. Please check permissions.',
        });
        setUseCamera(false);
      }
    } else {
      handleCaptureImage();
    }
  };

  const handleCaptureImage = async () => {
    if (videoRef.current && stream) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(
        videoRef.current,
        0,
        0,
        canvas.width,
        canvas.height
      );
      
      // Use our utility to get the data URL directly
      const imageUrl = canvasToDataUrl(canvas, 'image/jpeg', 0.9);
      setPhotoUrl(imageUrl);
      setImagePreview(imageUrl);
      setUseCamera(false);
      
      // Stop the camera stream
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid File',
        description: 'Please upload a valid image (JPEG, PNG).',
      });
      return;
    }

    // Check file size (limit to 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Please upload an image smaller than 5MB.',
      });
      return;
    }

    setLoading(true);
    try {
      // Save local URL for fallback
      const localUrl = URL.createObjectURL(file);
      
      // Get values from environment variables
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'unsigned_upload';
      
      // Check if we should use local storage
      const useFallbackStorage = !cloudName || !uploadPreset || cloudName === 'demo';
      
      // If using fallback storage, skip Cloudinary upload
      if (useFallbackStorage) {
        setPhotoUrl(localUrl);
        toast({
          title: 'Image Uploaded Successfully',
          description: '',
        });
        return;
      }
      
      // Try to upload to Cloudinary
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        
        formData.append('upload_preset', uploadPreset);
        formData.append('folder', 'disease-detection');
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Using Cloudinary for image storage');
        }
        
        const response = await fetch(cloudinaryUrl, {
          method: 'POST',
          body: formData,
          mode: 'cors',
        });
        
        if (!response.ok) {
          let errorMessage = 'Upload failed';
          try {
            if (response.headers.get('content-type')?.includes('application/json')) {
              const errorData = await response.json();
              // Simplify error handling - avoid detailed console error logging
              errorMessage = errorData.error?.message || `Upload failed with status: ${response.status}`;
            } else {
              errorMessage = `Upload failed with status: ${response.status}`;
            }
          } catch (jsonError) {
            console.warn('Error parsing error response');
          }
          
          // Handle preset not found error gracefully
          if (errorMessage.includes('Upload preset not found')) {
            console.warn(`Using local image storage as fallback. Cloudinary preset "${uploadPreset}" not found.`);
            throw new Error("Using local storage fallback");
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        if (!data.secure_url) {
          throw new Error('Invalid response from Cloudinary');
        }
        
        // Success! Use the Cloudinary URL
        setPhotoUrl(data.secure_url);
        toast({
          title: 'Image Uploaded Successfully',
          description: '',
        });
      } catch (cloudinaryError) {
        // Cloudinary upload failed, use local URL fallback
        console.warn('Cloudinary upload failed, using local URL fallback:', cloudinaryError);
        setPhotoUrl(localUrl);
        toast({
          title: 'Image Uploaded Successfully',
          description: '',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Error',
        description: error instanceof Error ? error.message : 'Failed to upload image. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDetectDisease = async () => {
    if (!photoUrl) {
      toast({
        variant: 'destructive',
        title: 'No Image',
        description: 'Please upload or capture an image first.',
      });
      return;
    }

    setLoading(true);
    setDiseaseResults(null);

    try {
      // Convert blob URLs to data URLs first on the client side
      let processedUrl = photoUrl;
      let contentType = 'image/jpeg'; // Default
      
      // Handle blob URLs by converting to data URLs first
      if (photoUrl.startsWith('blob:')) {
        try {
          processedUrl = await blobUrlToDataUrl(photoUrl);
          const contentTypeMatch = processedUrl.match(/^data:([^;]+);/);
          if (contentTypeMatch) {
            contentType = contentTypeMatch[1];
          }
        } catch (error) {
          console.error('Error converting blob URL:', error);
          toast({
            variant: 'destructive',
            title: 'Image Processing Error',
            description: 'Failed to process image. Please try again with a different image.',
          });
          setLoading(false);
          return;
        }
      }
      // Extract content type from data URLs
      else if (photoUrl.startsWith('data:')) {
        const contentTypeMatch = photoUrl.match(/^data:([^;]+);/);
        if (contentTypeMatch) {
          contentType = contentTypeMatch[1];
        }
      }
      // Determine content type for other URLs
      else if (photoUrl.includes('cloudinary.com') || photoUrl.includes('unsplash.com')) {
        if (photoUrl.endsWith('.jpg') || photoUrl.endsWith('.jpeg')) {
          contentType = 'image/jpeg';
        } else if (photoUrl.endsWith('.png')) {
          contentType = 'image/png';
        } else if (photoUrl.endsWith('.gif')) {
          contentType = 'image/gif';
        } else if (photoUrl.endsWith('.webp')) {
          contentType = 'image/webp';
        }
      }
      
      console.log("Detecting disease with:", { 
        photoUrl: processedUrl.substring(0, 50) + "...", 
        contentType 
      });
      
      const result = await detectPlantDisease({ 
        photoUrl: processedUrl,
        contentType
      });
      
      console.log("Disease detection results:", result);
      
      // Create a default/fallback result if the API returns undefined or null
      const safeResult = result || {
        diseaseDetected: false,
        diseaseName: null,
        detectedPlant: "Unknown Plant",
        quickSummary: "Analysis could not be completed",
        plantCondition: "Unable to determine",
        recommendedActions: "Please try again with a clearer image"
      };
      
      setDiseaseResults(safeResult);
      
      // Record user activity if disease was detected
      if (user && safeResult) {
        const isHealthy = !safeResult.diseaseDetected || 
          (safeResult.diseaseName === "Healthy Plant") || 
          (safeResult.diseaseName === null);
        
        const activityTitle = isHealthy
          ? `Plant checked: Healthy ${safeResult.detectedPlant || 'Plant'}`
          : `Disease detected: ${safeResult.diseaseName || 'Unknown disease'}`;
        
        const activityDescription = isHealthy
          ? `No disease detected on ${safeResult.detectedPlant || 'plant'}`
          : `Problem detected on ${safeResult.detectedPlant || 'plant'}: ${safeResult.diseaseName}`;
          
        await recordUserActivity(user, {
          type: 'disease_detection',
          title: activityTitle,
          description: activityDescription,
          iconType: 'shield'
        });
      }
      
      toast({
        title: safeResult.diseaseDetected ? "Disease Detected" : "Plant Analyzed",
        description: safeResult.diseaseName || "No specific disease detected. See results below.",
      });
    } catch (error) {
      console.error('Error detecting disease:', error);
      toast({
        variant: 'destructive',
        title: 'Detection Error',
        description: 'Failed to detect plant disease. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

    const handleSampleImageClick = (imageUrl: string) => {
        setPhotoUrl(imageUrl);
    };

  const handleReset = () => {
    setPhotoUrl('');
    setImagePreview('');
    setDiseaseResults(null);
    setUseCamera(false);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Add new handler functions for Cloudinary
  const handleCloudinaryUploadSuccess = (url: string, publicId: string) => {
    setPhotoUrl(url);
    // Store publicId if needed
    
    toast({
      title: 'Image Uploaded Successfully',
      description: '',
    });
  };
  
  const handleCameraSuccess = (url: string, publicId: string) => {
    setPhotoUrl(url);
    
    toast({
      title: 'Image Uploaded Successfully',
      description: 'Image has been successfully uploaded.',
    });
  };

  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').then(
        registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        },
        err => {
          console.log('Service Worker registration failed:', err);
        }
      );
    });
  }

  return (
    <div className={`app-container ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
      {/* Header */}
      <header className="app-header">
        <div className="flex items-center">
          <Shield className="h-7 w-7 text-primary mr-2" />
          <h1 className="text-2xl font-bold text-primary">Disease Detection</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Button>
        </div>
      </header>

      <section className="mb-6">
        <p className="text-muted-foreground text-sm">
          Upload or capture a photo of your plant to detect potential diseases and get treatment recommendations.
        </p>
      </section>

      <Card className="border border-border/30 shadow-sm overflow-hidden mb-8">
        <CardContent className="p-4 space-y-4">
           {/* Image Upload Preview */}
          <div className="relative w-full h-60 rounded-lg overflow-hidden">
            {!photoUrl ? (
              <div className="w-full h-full rounded-md overflow-hidden flex flex-col items-center justify-center bg-muted/30">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                  <Shield className="h-8 w-8 text-amber-700" />
                </div>
                <p className="text-sm font-medium text-center">Upload or take a photo<br />to diagnose your plant</p>
              </div>
            ) : (
              <Image
                src={photoUrl}
                alt="Plant Image"
                fill
                priority
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 500px"
              />
            )}
            </div>

          {/* Camera view when active */}
          {useCamera && (
            <div className="relative w-full h-60 rounded-lg overflow-hidden mb-4 bg-black">
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                <Button
                  onClick={() => {
                    if (!videoRef.current) return;
                    
                    const captureAndUpload = async () => {
                      setLoading(true);
                      
                      try {
                        // 1. Capture image from camera
                        const canvas = document.createElement('canvas');
                        const videoElement = videoRef.current;
                        if (!videoElement) {
                          throw new Error('Video element not available');
                        }
                        
                        canvas.width = videoElement.videoWidth;
                        canvas.height = videoElement.videoHeight;
                        
                        const ctx = canvas.getContext('2d');
                        if (!ctx) throw new Error('Unable to get canvas context');
                        
                        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                        
                        // 2. Create blob from canvas
                        const blob = await new Promise<Blob>((resolve, reject) => {
                          canvas.toBlob((result) => {
                            if (result) {
                              resolve(result);
                            } else {
                              reject(new Error('Failed to create blob from canvas'));
                            }
                          }, 'image/jpeg', 0.9);
                        });
                        
                        // Save blob URL for fallback
                        const localUrl = URL.createObjectURL(blob);
                        
                        // Get values from environment variables
                        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
                        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'unsigned_upload';
                        
                        // Check if we should use local storage
                        const useFallbackStorage = !cloudName || !uploadPreset || cloudName === 'demo';
                        
                        // If using fallback storage, skip Cloudinary upload
                        if (useFallbackStorage) {
                          setPhotoUrl(localUrl);
                          toast({
                            title: 'Image Uploaded Successfully',
                            description: '',
                          });
                          setUseCamera(false);
                          return;
                        }
                        
                        // Try to upload to Cloudinary
                        try {
                          const formData = new FormData();
                          formData.append('file', new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' }));
                          
                          const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
                          
                          formData.append('upload_preset', uploadPreset);
                          formData.append('folder', 'disease-detection');
                          
                          if (process.env.NODE_ENV === 'development') {
                            console.log('Using Cloudinary for image storage');
                          }
                          
                          const response = await fetch(cloudinaryUrl, {
                            method: 'POST',
                            body: formData,
                            mode: 'cors',
                          });
                          
                          if (!response.ok) {
                            let errorMessage = 'Upload failed';
                            try {
                              if (response.headers.get('content-type')?.includes('application/json')) {
                                const errorData = await response.json();
                                // Simplify error handling - avoid detailed console error logging
                                errorMessage = errorData.error?.message || `Upload failed with status: ${response.status}`;
                                } else {
                                errorMessage = `Upload failed with status: ${response.status}`;
                              }
                            } catch (jsonError) {
                              console.warn('Error parsing error response');
                            }
                            
                            // Handle preset not found error gracefully
                            if (errorMessage.includes('Upload preset not found')) {
                              console.warn(`Using local image storage as fallback. Cloudinary preset "${uploadPreset}" not found.`);
                              throw new Error("Using local storage fallback");
                            }
                            
                            throw new Error(errorMessage);
                          }
                          
                          const data = await response.json();
                          if (!data.secure_url) {
                            throw new Error('Invalid response from Cloudinary');
                          }
                          
                          // Success! Use the Cloudinary URL
                          setPhotoUrl(data.secure_url);
                          toast({
                            title: 'Image Uploaded Successfully',
                            description: '',
                          });
                        } catch (cloudinaryError) {
                          // Cloudinary upload failed, use local URL fallback
                          console.warn('Cloudinary upload failed, using local URL fallback:', cloudinaryError);
                          setPhotoUrl(localUrl);
                          toast({
                            title: 'Image Uploaded Successfully',
                            description: '',
                          });
                        }
                        
                        // Always close camera after capture
                        setUseCamera(false);
                        
                      } catch (error) {
                        console.error('Capture error:', error);
                        toast({
                          variant: 'destructive',
                          title: 'Capture Error',
                          description: error instanceof Error ? error.message : 'Failed to process image. Please try again.',
                        });
                      } finally {
                        setLoading(false);
                      }
                    };
                    
                    captureAndUpload();
                  }}
                  className="bg-white text-black hover:bg-gray-100"
                >
                  Capture Photo
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setUseCamera(false)}
                >
                  Cancel
                  </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              className="flex items-center justify-center p-6 border-amber-100"
              onClick={() => setUseCamera(true)}
            >
              <Camera className="h-5 w-5 mr-2 text-amber-600" />
              Take Photo
            </Button>

            <Button 
              variant="outline" 
              className="flex items-center justify-center p-6 border-amber-100" 
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const handleFileUpload = async () => {
                      setLoading(true);
                      
                      try {
                        // Save local URL for fallback
                        const localUrl = URL.createObjectURL(file);
                        
                        // Get values from environment variables
                        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
                        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'unsigned_upload';
                        
                        // Check if we should use local storage
                        const useFallbackStorage = !cloudName || !uploadPreset || cloudName === 'demo';
                        
                        // If using fallback storage, skip Cloudinary upload
                        if (useFallbackStorage) {
                          setPhotoUrl(localUrl);
                          toast({
                            title: 'Image Uploaded Successfully',
                            description: '',
                          });
                          return;
                        }
                        
                        // Try to upload to Cloudinary
                        try {
                          const formData = new FormData();
                          formData.append('file', file);
                          
                          const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
                          
                          formData.append('upload_preset', uploadPreset);
                          formData.append('folder', 'disease-detection');
                          
                          if (process.env.NODE_ENV === 'development') {
                            console.log('Using Cloudinary for image storage');
                          }
                          
                          const response = await fetch(cloudinaryUrl, {
                            method: 'POST',
                            body: formData,
                            mode: 'cors',
                          });
                          
                          if (!response.ok) {
                            let errorMessage = 'Upload failed';
                            try {
                              if (response.headers.get('content-type')?.includes('application/json')) {
                                const errorData = await response.json();
                                // Simplify error handling - avoid detailed console error logging
                                errorMessage = errorData.error?.message || `Upload failed with status: ${response.status}`;
                                } else {
                                errorMessage = `Upload failed with status: ${response.status}`;
                              }
                            } catch (jsonError) {
                              console.warn('Error parsing error response');
                            }
                            
                            // Handle preset not found error gracefully
                            if (errorMessage.includes('Upload preset not found')) {
                              console.warn(`Using local image storage as fallback. Cloudinary preset "${uploadPreset}" not found.`);
                              throw new Error("Using local storage fallback");
                            }
                            
                            throw new Error(errorMessage);
                          }
                          
                          const data = await response.json();
                          if (!data.secure_url) {
                            throw new Error('Invalid response from Cloudinary');
                          }
                          
                          // Success! Use the Cloudinary URL
                          setPhotoUrl(data.secure_url);
                          toast({
                            title: 'Image Uploaded Successfully',
                            description: '',
                          });
                        } catch (cloudinaryError) {
                          // Cloudinary upload failed, use local URL fallback
                          console.warn('Cloudinary upload failed, using local URL fallback:', cloudinaryError);
                          setPhotoUrl(localUrl);
                          toast({
                            title: 'Image Uploaded Successfully',
                            description: '',
                          });
                        }
                      } catch (error) {
                        console.error('Upload error:', error);
                        toast({
                          variant: 'destructive',
                          title: 'Upload Error',
                          description: error instanceof Error ? error.message : 'Failed to upload image. Please try again.',
                        });
                      } finally {
                        setLoading(false);
                      }
                    };
                    
                    handleFileUpload();
                  }
                };
                input.click();
              }}
            >
              <ImagePlus className="h-5 w-5 mr-2 text-amber-600" />
              Choose from Gallery
              </Button>
            </div>

             {/* Sample Images */}
             <div className="mt-4">
              <p className="text-center text-sm text-muted-foreground mb-3">Or try with a sample:</p>
              <div className="flex justify-center space-x-4">
                    {sampleImages.map((imageUrl, index) => (
                <div 
                  key={index}
                    className="relative w-24 h-24 rounded-md overflow-hidden border border-amber-100 cursor-pointer transition-all hover:opacity-90 hover:border-primary hover:shadow-md"
                  onClick={() => handleSampleImageClick(imageUrl)}
                >
                        <Image
                            src={imageUrl}
                      alt={`Plant disease sample ${index + 1}`}
                    fill
                    className="object-cover"
                      sizes="96px"
                  />
                </div>
                    ))}
                </div>
            </div>

          <Button 
            onClick={handleDetectDisease} 
            disabled={loading || !photoUrl}
            className="w-full"
          >
            {loading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> 
                Analyzing Plant...
              </>
            ) : (
              <>Detect Disease</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Disease detection results section */}
      {diseaseResults ? (
        <div className="mb-20">
          {/* Summary Card */}
          <Card className="mb-4 border-green-100 overflow-hidden">
            <CardHeader className="bg-green-50/50 pb-3 border-b border-green-100">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl text-green-700 flex items-center">
                  <Leaf className="mr-2 h-5 w-5" />
                  Plant Analysis Results
              </CardTitle>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {diseaseResults.confidence ? `${diseaseResults.confidence}% Confidence` : "Analysis Complete"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-4">
              {/* Plant and Disease Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50/30 p-4 rounded-lg border border-green-100">
                  <h3 className="text-base font-medium text-green-800 mb-1">Identified Plant</h3>
                  <p className="text-base text-green-700">
                    {diseaseResults.detectedPlant || "Unknown Plant"}
                  </p>
                </div>
                
                <div className={`p-4 rounded-lg border ${diseaseResults.diseaseName && diseaseResults.diseaseName !== "Healthy Plant" 
                  ? "bg-amber-50/30 border-amber-100" 
                  : "bg-green-50/30 border-green-100"}`}>
                  <h3 className="text-base font-medium text-green-800 mb-1">Plant Condition</h3>
                  <p className={`text-base ${diseaseResults.diseaseName && diseaseResults.diseaseName !== "Healthy Plant" 
                    ? "text-amber-700" 
                    : "text-green-700"}`}>
                    {diseaseResults.diseaseName || "Healthy Plant"}
                  </p>
                </div>
              </div>
              
              {/* Quick Summary */}
              {diseaseResults.quickSummary && (
                <div className="mb-6 bg-background p-4 rounded-lg border">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Info className="mr-2 h-4 w-4 text-primary" />
                    Problem Overview
                  </h3>
                  <p className="text-sm text-muted-foreground">{diseaseResults.quickSummary}</p>
                </div>
              )}
              
              {/* Key Actions - Immediate recommendations */}
              {diseaseResults.recommendedActions && (
                <section className="mb-4">
                  <h3 className="text-base font-semibold mb-2">Recommended Actions</h3>
                  <div className="space-y-2">
                    {diseaseResults.recommendedActions.split('\n').filter(part => part.trim()).map((part, idx) => {
                      // Parse out the method and description, accounting for different formats
                      let method = '';
                      let description = '';
                      
                      // Check for Markdown format: **Method:** Description
                      const markdownMatch = part.match(/^\*\*([^*:]+):?\*\*\s*(.+)/);
                      // Check for simple format: Method: Description
                      const colonMatch = !markdownMatch && part.match(/^([^:]+):\s*(.+)/);
                      
                      if (markdownMatch) {
                        method = markdownMatch[1].trim();
                        description = markdownMatch[2].trim();
                      } else if (colonMatch) {
                        method = colonMatch[1].trim();
                        description = colonMatch[2].trim();
                      } else {
                        // If no specific format, use the whole line
                        description = part.trim();
                      }
                      
                      return (
                        <div key={idx} className="flex gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0"></div>
                          <div>
                            {method && <span className="font-medium">{method} </span>}
                            {description && <span className="text-muted-foreground">{description}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </CardContent>
          </Card>

          {/* Detailed Analysis Tabs */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Shield className="mr-2 h-5 w-5 text-primary" />
                Detailed Analysis
              </CardTitle>
              <CardDescription>
                Explore comprehensive information about your plant's condition
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-2">
              <Accordion type="multiple" className="w-full">
                {/* Diagnosis Section */}
                <AccordionItem value="diagnosis" className="border rounded-md mb-3 shadow-sm">
                  <AccordionTrigger className="text-sm font-medium px-3 py-2 bg-secondary/50 hover:bg-secondary text-foreground hover:no-underline rounded-t-md">
                    <div className="flex items-center w-full">
                      <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center mr-2">
                        <Info className="h-4 w-4 text-amber-600" />
                      </div>
                      <span>Diagnosis & Symptoms</span>
                      {(diseaseResults.plantCondition || diseaseResults.symptoms) && (
                        <Badge variant="outline" className="ml-auto text-[10px] bg-green-50 border-green-200">Key Info</Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0 py-0 overflow-hidden">
                    <div className="grid grid-cols-1 divide-y divide-border/50">
                      {/* Plant Condition */}
                      {diseaseResults.plantCondition && (
                        <div className="p-4">
                          <h4 className="font-medium mb-2 text-sm flex items-center">
                            <Leaf className="h-4 w-4 text-amber-600 mr-2" />
                            Plant Condition
                          </h4>
                          <div className="text-sm text-muted-foreground space-y-2">
                            {diseaseResults.plantCondition.split('\n').filter(line => line.trim()).map((line, index) => (
                              <p key={index}>{line.replace(/\*\*/g, '')}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Symptoms */}
                      {diseaseResults.symptoms && (
                        <div className="p-4">
                          <h4 className="font-medium mb-2 text-sm flex items-center">
                            <Check className="h-4 w-4 text-red-600 mr-2" />
                            Visible Symptoms
                          </h4>
                          <div className="text-sm text-muted-foreground space-y-2">
                            {diseaseResults.symptoms.split('\n').filter(line => line.trim()).map((line, index) => (
                              <p key={index}>{line.replace(/\*\*/g, '')}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    </AccordionContent>
                  </AccordionItem>

                {/* Treatment Section */}
                <AccordionItem value="treatment" className="border rounded-md mb-3 shadow-sm">
                  <AccordionTrigger className="text-sm font-medium px-3 py-2 bg-secondary/50 hover:bg-secondary text-foreground hover:no-underline rounded-t-md">
                    <div className="flex items-center w-full">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                        <Pill className="h-4 w-4 text-blue-600" />
                      </div>
                      <span>Treatment & Care</span>
                      {(diseaseResults.treatments || diseaseResults.careInstructions) && (
                        <Badge variant="outline" className="ml-auto text-[10px] bg-green-50 border-green-200">Important</Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0 py-0 overflow-hidden">
                    <div className="grid grid-cols-1 divide-y divide-border/50">
                      {/* Causes */}
                      {diseaseResults.causes && (
                        <div className="p-4">
                          <h4 className="font-medium mb-2 text-sm flex items-center">
                            <Info className="h-4 w-4 text-amber-600 mr-2" />
                            Likely Causes
                          </h4>
                          <div className="text-sm text-muted-foreground space-y-2">
                            {diseaseResults.causes.split('\n').filter(line => line.trim()).map((line, i) => {
                              const cleanLine = line.replace(/\*\*/g, '');
                              return (
                                <div key={i} className={i === 0 ? "" : "ml-4 mt-2"}>
                                  {cleanLine.startsWith("- ") ? (
                                    <div className="flex items-start">
                                      <div className="h-2 w-2 rounded-full bg-amber-200 mt-1.5 mr-2"></div>
                                      <p>{cleanLine.substring(2)}</p>
                                    </div>
                                  ) : (
                                    <p>{cleanLine}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Treatments */}
                      {diseaseResults.treatments && (
                        <section className="mb-4">
                          <h3 className="text-base font-semibold mb-2">Treatment Options</h3>
                          <div className="space-y-2">
                            {diseaseResults.treatments.split('\n').filter(part => part.trim()).map((part, idx) => {
                              // Parse out the method and description, accounting for different formats
                              let method = '';
                              let description = '';
                              
                              // Check for Markdown format: **Method:** Description
                              const markdownMatch = part.match(/^\*\*([^*:]+):?\*\*\s*(.+)/);
                              // Check for simple format: Method: Description
                              const colonMatch = !markdownMatch && part.match(/^([^:]+):\s*(.+)/);
                              
                              if (markdownMatch) {
                                method = markdownMatch[1].trim();
                                description = markdownMatch[2].trim();
                              } else if (colonMatch) {
                                method = colonMatch[1].trim();
                                description = colonMatch[2].trim();
                              } else {
                                // If no specific format, use the whole line
                                description = part.trim();
                              }
                              
                              return (
                                <div key={idx} className="flex gap-2">
                                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0"></div>
                                  <div>
                                    {method && <span className="font-medium">{method} </span>}
                                    {description && <span className="text-muted-foreground">{description}</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      )}

                      {/* Care Instructions */}
                      {diseaseResults.careInstructions && (
                        <div className="p-4">
                          <h4 className="font-medium mb-2 text-sm flex items-center">
                            <Leaf className="h-4 w-4 text-green-600 mr-2" />
                            Care Instructions
                          </h4>
                          <div className="text-sm text-muted-foreground space-y-2">
                            <p>{diseaseResults.careInstructions.replace(/\*\*/g, '')}</p>
                            
                            {diseaseResults.fertilizerRecommendation && (
                              <div className="mt-3 pt-3 border-t border-border/50">
                                <p className="font-medium mb-1 text-sm">Fertilizer Recommendations:</p>
                                <p>{diseaseResults.fertilizerRecommendation.replace(/\*\*/g, '')}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    </AccordionContent>
                  </AccordionItem>

                {/* Prevention Section */}
                <AccordionItem value="prevention" className="border rounded-md mb-3 shadow-sm">
                  <AccordionTrigger className="text-sm font-medium px-3 py-2 bg-secondary/50 hover:bg-secondary text-foreground hover:no-underline rounded-t-md">
                    <div className="flex items-center w-full">
                      <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center mr-2">
                        <Shield className="h-4 w-4 text-green-600" />
                      </div>
                      <span>Prevention & Long-term Care</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0 py-0 overflow-hidden">
                    <div className="grid grid-cols-1 divide-y divide-border/50">
                      {/* Prevention */}
                      {diseaseResults.prevention && (
                        <div className="p-4">
                          <h4 className="font-medium mb-2 text-sm flex items-center">
                            <Shield className="h-4 w-4 text-green-600 mr-2" />
                            Prevention Guide
                          </h4>
                          <div className="text-sm text-muted-foreground space-y-3">
                            {diseaseResults.prevention.split('\n').filter(line => line.trim()).map((part, index) => {
                              // Clean up any markdown formatting
                              const cleanPart = part.replace(/\*\*/g, '');
                              
                              // Check if starts with a bullet point or number
                              const isBulletPoint = cleanPart.trim().startsWith("- ") || cleanPart.trim().match(/^\d+\./);
                              
                              if (isBulletPoint) {
                                return (
                                  <div key={index} className="flex items-start ml-2">
                                    <div className="h-2 w-2 rounded-full bg-green-200 mt-1.5 mr-2"></div>
                                    <p>{cleanPart.replace(/^- /, "").replace(/^\d+\.\s*/, "")}</p>
                                  </div>
                                );
                              } else {
                                // Check if it's a section title (all caps or with **)
                                const isSectionTitle = cleanPart.match(/^[A-Z\s]{5,}$/) || part.includes("**");
                                
                                if (isSectionTitle) {
                                  return (
                                    <p key={index} className="font-medium text-green-700 mt-3">
                                      {cleanPart}
                                    </p>
                                  );
                                }
                                
                                return <p key={index}>{cleanPart}</p>;
                              }
                            })}
                          </div>
                        </div>
                      )}

                      {/* Additional Tips */}
                      {diseaseResults.additionalTips && (
                        <div className="p-4">
                          <h4 className="font-medium mb-2 text-sm flex items-center">
                            <Lightbulb className="h-4 w-4 text-amber-600 mr-2" />
                            Additional Tips
                          </h4>
                          <div className="text-sm text-muted-foreground space-y-2">
                            {diseaseResults.additionalTips && diseaseResults.additionalTips.split('\n').filter(line => line.trim()).map((tip, index) => {
                              // Clean up any markdown formatting
                              const cleanTip = tip.replace(/\*\*/g, '');
                              
                              // Check if this is a numbered item
                              const isNumbered = cleanTip.trim().match(/^\d+\.\s/);
                              
                              if (isNumbered) {
                                const number = cleanTip.match(/^(\d+)\./)?.[1] || '';
                                const content = cleanTip.replace(/^\d+\.\s*/, '');
                                
                                return (
                                  <div key={index} className="flex items-start gap-2 mb-2">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-medium text-xs">
                                      {number}
                                    </span>
                                    <p>{content}</p>
                                  </div>
                                );
                              }
                              
                              // Check if it's a header (with ** formatting)
                              if (tip.includes('**')) {
                                return (
                                  <p key={index} className="font-medium text-amber-700 mt-3">
                                    {cleanTip}
                                  </p>
                                );
                              }
                              
                              return <p key={index}>{cleanTip}</p>;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    </AccordionContent>
                  </AccordionItem>

                {/* Advanced Information Section */}
                {diseaseResults.ecosystemImpact && (
                  <AccordionItem value="advanced" className="border rounded-md mb-3 shadow-sm">
                    <AccordionTrigger className="text-sm font-medium px-3 py-2 bg-secondary/50 hover:bg-secondary text-foreground hover:no-underline rounded-t-md">
                      <div className="flex items-center w-full">
                        <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center mr-2">
                          <Globe className="h-4 w-4 text-violet-600" />
                        </div>
                        <span>Environmental Considerations</span>
                        <Badge variant="outline" className="ml-auto text-[10px] bg-violet-50 border-violet-200">Expert</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-0 py-0 overflow-hidden">
                      <div className="p-4">
                        <h4 className="font-medium mb-2 text-sm flex items-center">
                          <Globe className="h-4 w-4 text-violet-600 mr-2" />
                          Ecosystem Impact
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-2">
                          {diseaseResults.ecosystemImpact.split('\n').filter(line => line.trim()).map((line, index) => (
                            <p key={index}>{line.replace(/\*\*/g, '')}</p>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      ) : null}

        {/* Bottom Navigation */}
      <BottomNavbar />
    </div>
  );
}
