"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Leaf,
  Camera,
  ArrowLeft,
  Home,
  Shield,
  ImagePlus,
  HelpCircle,
  Droplets,
  Heart,
  Info,
  RotateCcw,
  Bookmark,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { identifyPlant } from "@/ai/flows/identify-plant";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import React from "react";
import { BottomNavbar } from "@/components/BottomNavbar";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import CloudinaryCameraCapture from "@/components/CloudinaryCameraCapture";
import {
  blobUrlToDataUrl,
  canvasToDataUrl,
  fileToDataUrl,
} from "@/utils/client-image-utils";
import { getMimeType } from "@/utils/image-utils";
import { useAuth } from "@/contexts/AuthContext";
import { recordUserActivity } from "@/services/activity-service";
import { useCloudinary } from "@/components/CloudinaryConfig";
import { useLocalStorage } from '@/hooks/use-local-storage';
import { ClientOnlyImage } from '@/components/ClientOnlyImage';
import dynamic from 'next/dynamic';

// Plant-themed sample images
const sampleImages = [
  "https://images.pexels.com/photos/736230/pexels-photo-736230.jpeg?auto=compress&cs=tinysrgb&w=500",
  "https://images.pexels.com/photos/1459495/pexels-photo-1459495.jpeg?auto=compress&cs=tinysrgb&w=500",
  "https://images.pexels.com/photos/1470171/pexels-photo-1470171.jpeg?auto=compress&cs=tinysrgb&w=500",
];

// Define a type for the identify results with strict null checking
interface IdentifyPlantResult {
  commonName: string;
  scientificName: string;
  careTips: string;
  detailedAnalysis: string;
  growthHabit: string;
  lifespan: string;
  lightRequirements: string;
  waterRequirements: string;
  soilPreferences: string;
  suitableLocations: string;
  ecosystemImpact: string;
}

// Default values for plant identification
const defaultPlantValues: IdentifyPlantResult = {
  commonName: "Unknown Plant",
  scientificName: "Species not identified",
  careTips: "No care tips available",
  detailedAnalysis: "No detailed analysis available",
  growthHabit: "",
  lifespan: "",
  lightRequirements: "",
  waterRequirements: "",
  soilPreferences: "",
  suitableLocations: "",
  ecosystemImpact: "",
};

// Add PlantIdentificationResult interface
interface PlantIdentificationResult {
  commonName?: string;
  scientificName?: string;
  taxonomy?: Record<string, string>;
  plant_details?: {
    wiki_description?: { value?: string };
    wiki_image?: { value?: string };
    watering?: string[];
    sunlight?: string[];
    propagation?: string[];
  };
  url?: string;
}

// Create a client-only version of the page that skips SSR entirely
const ClientOnlyIdentifyPage = dynamic(
  () => Promise.resolve(IdentifyPlantPageContent),
  { ssr: false }
);

// Export the client-only wrapper as the default component
export default function IdentifyPlantPage() {
  return <ClientOnlyIdentifyPage />;
}

// Move all the existing page content to this internal component
function IdentifyPlantPageContent() {
  const [photoUrl, setPhotoUrl] = useLocalStorage<string>("identify_photo_url", "");
  const [commonName, setCommonName] = useLocalStorage<string>("identify_common_name", "");
  const [scientificName, setScientificName] = useLocalStorage<string>("identify_scientific_name", "");
  const [careTips, setCareTips] = useLocalStorage<string>("identify_care_tips", "");
  const [detailedAnalysis, setDetailedAnalysis] = useLocalStorage<string>("identify_detailed_analysis", "");
  const [growthHabit, setGrowthHabit] = useLocalStorage<string>("identify_growth_habit", "");
  const [lifespan, setLifespan] = useLocalStorage<string>("identify_lifespan", "");
  const [lightRequirements, setLightRequirements] = useLocalStorage<string>("identify_light_requirements", "");
  const [waterRequirements, setWaterRequirements] = useLocalStorage<string>("identify_water_requirements", "");
  const [soilPreferences, setSoilPreferences] = useLocalStorage<string>("identify_soil_preferences", "");
  const [suitableLocations, setSuitableLocations] = useLocalStorage<string>("identify_suitable_locations", "");
  const [ecosystemImpact, setEcosystemImpact] = useLocalStorage<string>("identify_ecosystem_impact", "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useCamera, setUseCamera] = useState(false); // State to toggle camera view
  const { toast } = useToast();
  const router = useRouter();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { user } = useAuth();
  // Get Cloudinary config at component level
  const cloudinaryConfig = useCloudinary();
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((error) => {
            console.error("Error playing video:", error);
            toast({
              variant: "destructive",
              title: "Camera Error",
              description: "Failed to start camera preview. Please try again.",
            });
          });
        }
        setStream(stream);
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
        toast({
          variant: "destructive",
          title: "Camera Access Denied",
          description:
            "Please enable camera permissions in your browser settings to use this feature.",
        });
      }
    };

    if (useCamera) {
      getCameraPermission();
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => {
          track.stop();
          stream.removeTrack(track);
        });
        videoRef.current.srcObject = null;
      }
    };
  }, [useCamera, toast]);

  const handleCloudinaryUploadSuccess = (url: string, publicId: string) => {
    setPhotoUrl(url);
    // Store publicId if needed for future reference
    // setPhotoPublicId(publicId);
    
    toast({
      title: "Image Uploaded",
      description: "Image has been successfully uploaded.",
    });
  };
  
  const handleCameraSuccess = (url: string, publicId: string) => {
    setPhotoUrl(url);
    // Store publicId if needed for future reference
    // setPhotoPublicId(publicId);
    
    toast({
      title: "Photo Captured",
      description: "Image has been successfully captured.",
    });
  };

  const handleCaptureImage = async () => {
    if (videoRef.current && stream) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext("2d");
      
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        // Use our utility to get a data URL directly
        const imageUrl = canvasToDataUrl(canvas, "image/jpeg", 0.9);
        setPhotoUrl(imageUrl);
        setUseCamera(false);
      }
      
      // Stop camera stream
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const resetIdentificationState = useCallback(() => {
    setCommonName(defaultPlantValues.commonName);
    setScientificName(defaultPlantValues.scientificName);
    setCareTips(defaultPlantValues.careTips);
    setDetailedAnalysis(defaultPlantValues.detailedAnalysis);
    setGrowthHabit(defaultPlantValues.growthHabit);
    setLifespan(defaultPlantValues.lifespan);
    setLightRequirements(defaultPlantValues.lightRequirements);
    setWaterRequirements(defaultPlantValues.waterRequirements);
    setSoilPreferences(defaultPlantValues.soilPreferences);
    setSuitableLocations(defaultPlantValues.suitableLocations);
    setEcosystemImpact(defaultPlantValues.ecosystemImpact);
  }, []);

  const handleIdentifyPlant = async (file: File) => {
    setLoading(true);
    setError(null);
    let localPreviewUrl = "";

    try {
      if (!file) {
        throw new Error("No file provided for identification");
      }

      // Create a preview URL for the UI - Save to state only after component is mounted
      localPreviewUrl = URL.createObjectURL(file);
      
      // Set state asynchronously to avoid hydration issues
      setTimeout(() => {
        setPhotoUrl(localPreviewUrl);
      }, 0);

      // Convert the file to a data URL for the API call
      const dataUrl = await fileToDataUrl(file);
      const mimeType = getMimeType(file);

      if (!dataUrl) {
        throw new Error("Failed to convert image to data URL");
      }

      let result;
      let retryAttempt = 0;

      // Implement retry logic for server errors
      while (retryAttempt < MAX_RETRIES) {
        try {
          result = await identifyPlant({
            photoUrl: dataUrl,
            contentType: mimeType,
            imageFile: file,
          });

          // Break the loop if we get a valid result
          if (result && typeof result === "object") {
            break;
          }

          // If result is invalid but no error thrown, increment retry counter
          retryAttempt++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retryAttempt)); // Exponential backoff
        } catch (apiError) {
          console.error(`API call attempt ${retryAttempt + 1} failed:`, apiError);
          retryAttempt++;
          if (retryAttempt === MAX_RETRIES) {
            throw apiError;
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * retryAttempt));
        }
      }

      // Validate the final result
      if (!result || typeof result !== "object") {
        throw new Error("Invalid response from identification service after retries");
      }

      // Create a sanitized result object with default values for missing fields
      const sanitizedResult: IdentifyPlantResult = {
        commonName: result.commonName || defaultPlantValues.commonName,
        scientificName: result.scientificName || defaultPlantValues.scientificName,
        careTips: result.careTips || defaultPlantValues.careTips,
        detailedAnalysis: result.detailedAnalysis || defaultPlantValues.detailedAnalysis,
        growthHabit: result.growthHabit || defaultPlantValues.growthHabit,
        lifespan: result.lifespan || defaultPlantValues.lifespan,
        lightRequirements: result.lightRequirements || defaultPlantValues.lightRequirements,
        waterRequirements: result.waterRequirements || defaultPlantValues.waterRequirements,
        soilPreferences: result.soilPreferences || defaultPlantValues.soilPreferences,
        suitableLocations: result.suitableLocations || defaultPlantValues.suitableLocations,
        ecosystemImpact: result.ecosystemImpact || (result as any).potentialProblems || defaultPlantValues.ecosystemImpact,
      };

      // Update state with sanitized values
      setCommonName(sanitizedResult.commonName);
      setScientificName(sanitizedResult.scientificName);
      setCareTips(sanitizedResult.careTips);
      setDetailedAnalysis(sanitizedResult.detailedAnalysis);
      setGrowthHabit(sanitizedResult.growthHabit);
      setLifespan(sanitizedResult.lifespan);
      setLightRequirements(sanitizedResult.lightRequirements);
      setWaterRequirements(sanitizedResult.waterRequirements);
      setSoilPreferences(sanitizedResult.soilPreferences);
      setSuitableLocations(sanitizedResult.suitableLocations);
      setEcosystemImpact(sanitizedResult.ecosystemImpact);

      // Record user activity only if we have a valid identification
      if (user && sanitizedResult.commonName !== defaultPlantValues.commonName) {
        try {
        await recordUserActivity(user, {
            type: "plant_identification",
            title: `Identified ${sanitizedResult.commonName}`,
            description: `Scientific name: ${sanitizedResult.scientificName}`,
            iconType: "leaf",
          });
        } catch (activityError) {
          console.error("Error recording user activity:", activityError);
        }
      }

      // Show success message
      if (sanitizedResult.commonName !== defaultPlantValues.commonName) {
      toast({
          title: "Success",
          description: "Plant identified successfully!",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Identification Failed",
          description: "Could not identify the plant. Please try with a clearer image.",
        });
      }

      // Reset retry count on success
      setRetryCount(0);
    } catch (error) {
      console.error("Error identifying plant:", error);
      setError(error instanceof Error ? error.message : "Failed to identify plant");

      // Increment retry count
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);

      // Reset state to defaults on error
      resetIdentificationState();

      toast({
        variant: "destructive",
        title: "Error",
        description: newRetryCount >= MAX_RETRIES 
          ? "Maximum retry attempts reached. Please try again later."
          : "Failed to identify plant. Please try again.",
      });
    } finally {
      setLoading(false);
      // Clean up the local preview URL if it was created
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    }
  };

  const handleSampleImageClick = async (imageUrl: string) => {
    setLoading(true);
    setError(null);
    setPhotoUrl(imageUrl); // Show sample image immediately

    try {
      // Fetch the image and create a File object
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch sample image: ${response.statusText}`);
      }
      const blob = await response.blob();
      // Try to determine a filename or use a default
      const filename =
        imageUrl.substring(imageUrl.lastIndexOf("/") + 1) || "sample-image.jpg";
      const file = new File([blob], filename, {
        type: blob.type || "image/jpeg",
      });

      // Call handleIdentifyPlant with the created File object
      // handleIdentifyPlant will convert it to dataUrl before calling the server
      await handleIdentifyPlant(file);
    } catch (error) {
      console.error("Error processing sample image:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to process sample image"
      );
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process sample image. Please try again.",
      });
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setLoading(true);
      
      // First, get local URL from the file for fallback
      let localUrl = "";
      try {
        const reader = new FileReader();
        await new Promise<void>((resolve, reject) => {
          reader.onload = () => {
            localUrl = reader.result as string;
            resolve();
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } catch (localError) {
        console.error("Error creating local URL:", localError);
      }

      // Use the cloudinary config from component level
      const { cloudName, uploadPreset, isConfigured, useFallbackStorage } =
        cloudinaryConfig;

      // If fallback storage is preferred or Cloudinary is not configured, use local storage
      if (useFallbackStorage || !isConfigured) {
        if (localUrl) {
          setPhotoUrl(localUrl);
          toast({
            title: "Image Uploaded Successfully",
            description: "",
          });
          return;
        } else {
          throw new Error("Could not create local URL for image");
        }
      }

      // Only log Cloudinary settings in development
      if (process.env.NODE_ENV === "development") {
        console.log("Using Cloudinary for image storage");
      }

      // Try to upload to Cloudinary
      try {
        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);
        formData.append("folder", "plant-identification");

        // Attempt upload without detailed logs
        const response = await fetch(cloudinaryUrl, {
          method: "POST",
          body: formData,
          mode: "cors",
        });
        
        if (!response.ok) {
          let errorMessage = "Upload failed";
          try {
            if (
              response.headers.get("content-type")?.includes("application/json")
            ) {
              const errorData = await response.json();
              // Simplify error handling - avoid detailed console error logging
              errorMessage =
                errorData.error?.message ||
                  `Upload failed with status: ${response.status}`;
            } else {
              errorMessage = `Upload failed with status: ${response.status}`;
            }
          } catch (jsonError) {
            console.warn("Error parsing error response");
          }

          // Simplified error handling for upload preset error
          if (errorMessage.includes("Upload preset not found")) {
            console.warn(
              `Using local image storage as fallback. Cloudinary preset "${uploadPreset}" not found.`
            );
            
            // Fallback to local URL
            if (localUrl) {
              setPhotoUrl(localUrl);
              toast({
                title: "Image Uploaded",
                description: "Using local browser storage as fallback.",
              });
              return;
            }
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        if (!data.secure_url) {
          throw new Error("Invalid response from Cloudinary");
        }
        
        // Success! Use the Cloudinary URL
        setPhotoUrl(data.secure_url);
        toast({
          title: "Image Uploaded Successfully",
          description: "",
        });
      } catch (cloudinaryError) {
        // Cloudinary upload failed, use local URL fallback
        console.warn(
          "Cloudinary upload failed, using local URL fallback:",
          cloudinaryError
        );
        
        if (localUrl) {
          setPhotoUrl(localUrl);
          toast({
            title: "Image Uploaded Successfully",
            description: "",
          });
        } else {
          throw new Error("Could not upload or create local URL for image");
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to upload image. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup function to handle component unmount
      if (photoUrl && photoUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(photoUrl);
        } catch (e) {
          console.warn('Failed to revoke object URL:', e);
        }
      }
    };
  }, [photoUrl]);

  const isBlobUrl = (url: string) => {
    return url && url.startsWith('blob:');
  };

  const getImageComponent = () => {
    if (!photoUrl) {
  return (
        <div className="w-full h-full rounded-md overflow-hidden flex flex-col items-center justify-center bg-muted/30">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Leaf className="h-8 w-8 text-primary" />
          </div>
          <p className="text-sm font-medium text-center">
            Upload or take a photo
            <br />
            to identify your plant
          </p>
        </div>
      );
    }

    // Use ClientOnlyImage for all image display
    return (
      <ClientOnlyImage
        src={photoUrl}
        alt="Plant Image"
        fill
        priority
        className="object-contain"
        sizes="(max-width: 768px) 100vw, 500px"
      />
    );
  };

  // Update the PlantIdentificationResults component
  const PlantIdentificationResults = ({ plantData, progress }: { plantData: PlantIdentificationResult; progress: number }) => {
    const [showAllTips, setShowAllTips] = useState(false);
    
    if (!plantData) return null;
    
    // Extract data
    const { commonName, scientificName, taxonomy, plant_details = {}, url } = plantData;
    const { wiki_description = {}, wiki_image = {}, watering, sunlight, propagation = [] } = plant_details;
    
    const description = wiki_description.value || "No description available.";
    const imageUrl = wiki_image.value || url;
    
    // Extract care tips
    const careTips = [
      ...(Array.isArray(watering) ? watering.map(w => `Water: ${w}`) : []),
      ...(Array.isArray(sunlight) ? sunlight.map(s => `Light: ${s}`) : []),
      ...(Array.isArray(propagation) ? propagation.map(p => `Propagation: ${p}`) : [])
    ];
    
    // Display first 3 tips by default
    const displayedTips = showAllTips ? careTips : careTips.slice(0, 3);
    const hasMoreTips = careTips.length > 3;
    
    return (
      <div className="bg-background rounded-xl p-4 shadow-sm space-y-6 animate-fadeIn">
        {/* Summary Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-xl p-4 shadow-sm border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold text-green-800 dark:text-green-300">Plant Identification</h3>
            <div className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs px-2.5 py-1 rounded-full font-medium border border-green-200 dark:border-green-700">
              Identified
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {commonName && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Common Name</p>
                  <h4 className="text-lg font-semibold text-green-700 dark:text-green-400">{commonName}</h4>
                </div>
              )}
              
              {scientificName && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Scientific Name</p>
                  <p className="text-sm italic">{scientificName}</p>
                </div>
              )}
            </div>
            
            <div className="relative h-32 rounded-lg overflow-hidden border border-green-200 dark:border-green-800">
              {imageUrl ? (
                <Image 
                  src={imageUrl} 
                  alt={commonName || "Identified plant"} 
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-green-50 dark:bg-green-900">
                  <Leaf className="h-10 w-10 text-green-300" />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Details Card */}
        <div className="rounded-xl border shadow-sm bg-background">
          <div className="p-4 border-b">
            <h3 className="font-medium">Detailed Analysis</h3>
          </div>
          
          <div className="p-4">
            <Accordion type="single" collapsible className="w-full">
              {description && (
                <AccordionItem value="overview">
                  <AccordionTrigger className="text-base font-medium">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      <span>Overview</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-sm space-y-2">
                      <p>{description}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {taxonomy && Object.keys(taxonomy).length > 0 && (
                <AccordionItem value="taxonomy">
                  <AccordionTrigger className="text-base font-medium">
                    <div className="flex items-center gap-2">
                      <Leaf className="h-4 w-4" />
                      <span>Taxonomy</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {Object.entries(taxonomy).map(([key, value]) => (
                        value && (
                          <div key={key} className="space-y-1">
                            <p className="text-xs text-muted-foreground">{key.charAt(0).toUpperCase() + key.slice(1)}</p>
                            <p className="font-medium">{value as string}</p>
                          </div>
                        )
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {(Array.isArray(watering) || Array.isArray(sunlight)) && (
                <AccordionItem value="growing">
                  <AccordionTrigger className="text-base font-medium">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4" />
                      <span>Growing Requirements</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 text-sm">
                      {Array.isArray(watering) && watering.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium">Watering</p>
                          <ul className="list-disc list-inside space-y-1 ml-1">
                            {watering.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {Array.isArray(sunlight) && sunlight.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium">Sunlight</p>
                          <ul className="list-disc list-inside space-y-1 ml-1">
                            {sunlight.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {careTips.length > 0 && (
                <AccordionItem value="care">
                  <AccordionTrigger className="text-base font-medium">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      <span>Care and Maintenance</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <ul className="list-disc list-inside space-y-2 ml-1">
                        {displayedTips.map((tip, index) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                      
                      {hasMoreTips && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2 text-xs"
                          onClick={() => setShowAllTips(!showAllTips)}
                        >
                          {showAllTips ? "Show fewer tips" : `Show ${careTips.length - 3} more tips`}
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button onClick={() => window.location.reload()} className="flex-1">
            <RotateCcw className="h-4 w-4 mr-2" />
            Identify Another Plant
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              toast({
                title: "Information Saved",
                description: "Plant details have been saved to your collection.",
              });
            }}
          >
            <Bookmark className="h-4 w-4 mr-2" />
            Save to Collection
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container opacity-100 transition-opacity duration-500">
      {/* Header */}
      <header className="app-header mb-6">
        <div className="flex items-center">
          <Leaf className="h-7 w-7 text-green-600 mr-2" />
          <h1 className="text-2xl font-bold text-green-700">
            Plant Identification
          </h1>
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
          Upload or capture a photo of any plant to identify its species and get
          detailed care information.
        </p>
      </section>

      <Card className="border border-border/30 shadow-sm overflow-hidden mb-8">
        <CardContent className="p-4 space-y-4">
          {/* Image Upload Preview */}
          <div className="relative w-full h-60 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
            {getImageComponent()}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              className="flex items-center justify-center p-6 border-green-100 hover:border-green-300 hover:bg-green-50/40 transition-colors"
              onClick={() => setUseCamera(true)}
            >
              <Camera className="h-5 w-5 mr-2 text-green-600" />
              Take Photo
            </Button>

            <Button 
              variant="outline" 
              className="flex items-center justify-center p-6 border-green-100 hover:border-green-300 hover:bg-green-50/40 transition-colors" 
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    uploadFile(file);
                  }
                };
                input.click();
              }}
            >
              <ImagePlus className="h-5 w-5 mr-2 text-green-600" />
              Choose from Gallery
            </Button>
          </div>

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
                  onClick={handleCaptureImage}
                  className="bg-white text-green-700 hover:bg-gray-100 border border-green-100"
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

          {/* Sample Images */}
          <div className="mt-4">
            <p className="text-center text-sm text-muted-foreground mb-3">
              Or try with a sample:
            </p>
            <div className="flex justify-center space-x-4">
              {sampleImages.map((imageUrl, index) => (
                <div 
                  key={index}
                  className="relative w-24 h-24 rounded-md overflow-hidden border border-green-100 cursor-pointer transition-all hover:opacity-90 hover:border-primary hover:shadow-md"
                  onClick={() => handleSampleImageClick(imageUrl)}
                >
                  <div className="absolute inset-0 bg-black/5 hover:bg-black/0 transition-colors"></div>
                  <ClientOnlyImage
                    src={imageUrl}
                    alt={`Plant sample ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={() => {
              // Get the last part of the URL which should be the filename
              const filename = photoUrl.split('/').pop() || 'image.jpg';
              
              // If we already have an image (photoUrl is set), use that
              if (photoUrl) {
                // For blob URLs, we already have the file in memory
                if (photoUrl.startsWith('blob:')) {
                  // We need to fetch the blob and create a File from it
                  fetch(photoUrl)
                    .then(res => res.blob())
                    .then(blob => {
                      // Create a File object
                      const file = new File([blob], filename, { type: blob.type });
                      handleIdentifyPlant(file);
                    })
                    .catch(err => {
                      console.error("Error processing blob URL:", err);
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Failed to process image. Please try uploading again."
                      });
                    });
                } 
                // For remote URLs like sample images, need to fetch and convert
                else if (photoUrl.startsWith('http')) {
                  setLoading(true);
                  fetch(photoUrl)
                    .then(res => res.blob())
                    .then(blob => {
                      const file = new File([blob], filename, { 
                        type: blob.type || 'image/jpeg' 
                      });
                      handleIdentifyPlant(file);
                    })
                    .catch(err => {
                      setLoading(false);
                      console.error("Error fetching image:", err);
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Failed to process image. Please try uploading again."
                      });
                    });
                }
              } 
              // Only if we don't have an image, prompt for one
              else {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    handleIdentifyPlant(file);
                  }
                };
                input.click();
              }
            }}
            disabled={loading || !photoUrl}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> 
                Identifying...
              </>
            ) : (
              <>Identify Plant</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Display Results */}
      {!loading && commonName && (
        <PlantIdentificationResults 
          plantData={{
            commonName,
            scientificName,
            plant_details: {
              wiki_description: { value: detailedAnalysis },
              watering: waterRequirements ? [waterRequirements] : [],
              sunlight: lightRequirements ? [lightRequirements] : [],
              propagation: careTips ? [careTips] : []
            }
          }}
          progress={100}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavbar />
    </div>
  );
}
