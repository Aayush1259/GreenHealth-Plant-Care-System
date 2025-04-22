"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { User, Home, Bot, Leaf, Camera, Mail, LogOut, Settings, Image as ImageIcon, PenSquare, Lock, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from '@/contexts/AuthContext'; 
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseApp } from '@/lib/firebase';
import { cn, getInitials } from '@/lib/utils';
import { BottomNavbar } from '@/components/BottomNavbar';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Import the user service
import { uploadProfilePicture } from '@/services/user-service';

// Define a schema for profile form validation
const profileFormSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, userProfile, logOut, updateUser } = useAuth();
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [prefLoading, setPrefLoading] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize the form with validation
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: '',
      email: '',
    },
  });

  // Initialize Firebase storage
  const storage = typeof window !== 'undefined' ? getStorage(firebaseApp) : null;
  
  useEffect(() => {
    setIsLoaded(true);
    if (user) {
      form.reset({
        displayName: user.displayName || '',
        email: user.email || '',
      });
      setImageUrl(user.photoURL || '');
      
      // Load user preferences from Firestore if available
      if (userProfile) {
        setPushNotifications(userProfile.pushNotifications ?? true);
        setEmailNotifications(userProfile.emailNotifications ?? true);
      }
    }
  }, [user, form, userProfile]);

  // Handle redirect if not authenticated
  useEffect(() => {
    const checkAuth = setTimeout(() => {
      if (isLoaded && !user) {
        router.push('/login');
      }
    }, 1000);
    
    return () => clearTimeout(checkAuth);
  }, [router, user, isLoaded]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Icons.spinner className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium mb-4">Please sign in to access your profile</p>
          <Button onClick={() => router.push('/login')}>Sign In</Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ProfileFormValues) => {
    setFormLoading(true);
    try {
      // If values haven't changed, don't update
      if (data.displayName === user.displayName && data.email === user.email) {
        toast({
          title: "No Changes",
          description: "No changes were detected.",
        });
        setFormLoading(false);
        return;
      }
      
      // Update user profile without handling image upload (already done)
      await updateUser({
        displayName: data.displayName,
        email: data.email,
      });
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        variant: "destructive",
        title: "Update Error",
        description: error.message || "Failed to update profile.",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Profile image must be less than 5MB.",
      });
      return;
    }
    
    // Create a temporary preview immediately for better UX
    const objectUrl = URL.createObjectURL(file);
    setImageUrl(objectUrl);
    setProfileImage(file);
    
    // Start upload immediately but don't block the UI
    setImageLoading(true);
    
    // Use a timeout to let the UI update first
    setTimeout(async () => {
      try {
        if (user) {
          // Optimize image: compress images over 1MB to improve upload speed
          // while maintaining image quality with a reasonable width (800px)
          const optimizedImage = file.size > 1024 * 1024 
            ? await compressImage(file, 800) // Compress if over 1MB
            : file;
          
          // Upload the optimized image
          const photoURL = await uploadProfilePicture(user.uid, optimizedImage);
          
          // Update the user profile with the new photo URL
          await updateUser({ photoURL });
          setImageUrl(photoURL);
          
          toast({
            title: "Profile Picture Updated",
            description: "Your profile picture has been updated successfully.",
          });
        }
      } catch (error) {
        console.error('Image upload error:', error);
        toast({
          variant: "destructive",
          title: "Upload Error",
          description: "Failed to upload profile image. Please try again.",
        });
      } finally {
        setImageLoading(false);
      }
    }, 0);
  };
  
  // Add image compression function
  const compressImage = async (file: File, maxWidth: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const image = new window.Image();
        image.onload = () => {
          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          let width = image.width;
          let height = image.height;
          
          // Calculate new dimensions
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          
          // Set canvas dimensions and draw
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(image, 0, 0, width, height);
          
          // Convert to blob with reduced quality
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Canvas to Blob conversion failed'));
              }
            },
            'image/jpeg',
            0.8 // 80% quality
          );
        };
        
        image.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        if (typeof readerEvent.target?.result === 'string') {
          image.src = readerEvent.target.result;
        } else {
          reject(new Error('FileReader did not produce a valid result'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('FileReader error'));
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      router.push('/login');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign Out Error",
        description: error.message || "Failed to sign out.",
      });
    }
  };

  // Add savePreferences function
  const savePreferences = async () => {
    if (!user) return;
    
    setPrefLoading(true);
    try {
      const prefsToUpdate: Partial<UserProfile> = {
        pushNotifications,
        emailNotifications,
      };

      await updateUserProfile(user.uid, prefsToUpdate);

      toast({
        title: "Preferences Updated",
        description: "Your notification and theme settings have been saved.",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        variant: "destructive",
        title: "Save Error",
        description: "Failed to save preferences.",
      });
    } finally {
      setPrefLoading(false);
    }
  };

  return (
    <div className={cn("min-h-screen bg-background pt-6 pb-24 px-4", isLoaded ? 'opacity-100' : 'opacity-0', "transition-opacity duration-500")}>
      {/* Header */}
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </header>

      <div className="max-w-md mx-auto">
        {/* Profile Header */}
        <Card className="border-green-100 shadow-sm mb-6">
          <CardContent className="pt-6 pb-4 text-center">
            <div className="relative mx-auto mb-4">
              <Avatar className="h-24 w-24 mx-auto mb-2 border-4 border-white shadow-md">
                {imageUrl ? (
                  <AvatarImage src={imageUrl} alt={user.displayName || "User"} />
                ) : (
                  <AvatarFallback className="bg-green-100 text-green-800 text-xl">
                    {getInitials(user.displayName || user.email || "User")}
                  </AvatarFallback>
                )}
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
              </Avatar>
              <div className="absolute bottom-0 right-0">
                <label htmlFor="profile-image" className="cursor-pointer">
                  <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white shadow-md">
                    <Camera className="h-4 w-4" />
                  </div>
                  <input 
                    id="profile-image" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="hidden"
                    aria-label="Upload profile image"
                  />
                </label>
              </div>
            </div>
            <h2 className="text-xl font-semibold">{user.displayName || 'User'}</h2>
            <p className="text-muted-foreground text-sm">{user.email}</p>
            <div className="flex justify-center mt-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 text-xs font-medium px-3 py-1 border-green-200 rounded-full">
                Plant Enthusiast
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          {/* Account Tab */}
          <TabsContent value="account">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card className="border-green-100 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl text-green-700 flex items-center gap-2">
                      <User className="h-5 w-5" /> Account Details
                    </CardTitle>
                    <CardDescription>
                      Update your personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="focus:border-green-500 focus:ring-green-500"
                              disabled={formLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              className="focus:border-green-500 focus:ring-green-500"
                              disabled={formLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      disabled={formLoading || !form.formState.isDirty && !profileImage} 
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {formLoading ? (
                        <>
                          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> 
                          Updating...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </Form>
            
            <Card className="border-green-100 shadow-sm mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-green-700 flex items-center gap-2">
                  <Lock className="h-5 w-5" /> Security
                </CardTitle>
                <CardDescription>
                  Manage your account security
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/change-password')}
                >
                  <Lock className="h-4 w-4 mr-2 text-green-600" />
                  Change Password
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-red-100 shadow-sm mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-red-600 flex items-center gap-2">
                  <LogOut className="h-5 w-5" /> Sign Out
                </CardTitle>
                <CardDescription>
                  Sign out from your account
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="border-green-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-green-700 flex items-center gap-2">
                  <Settings className="h-5 w-5" /> Preferences
                </CardTitle>
                <CardDescription>
                  Configure your app preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications" className="text-base font-medium">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications about plant care and updates</p>
                  </div>
                  <Switch 
                    id="push-notifications" 
                    checked={pushNotifications} 
                    onCheckedChange={setPushNotifications} 
                    aria-label="Toggle push notifications"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications" className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email updates about your plants</p>
                  </div>
                  <Switch 
                    id="email-notifications" 
                    checked={emailNotifications} 
                    onCheckedChange={setEmailNotifications} 
                    aria-label="Toggle email notifications"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={savePreferences}
                  disabled={prefLoading}
                >
                  {prefLoading ? (
                    <>
                      <LoadingSpinner className="mr-2" /> Saving...
                    </>
                  ) : (
                    'Save Preferences'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavbar />
    </div>
  );
} 