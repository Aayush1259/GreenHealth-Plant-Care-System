"use client";

import React, { useState, useEffect, useReducer, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  DocumentData,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Leaf, Plus, Calendar, X, AlertCircle, ArrowLeft, Camera, AlertTriangle, Droplet, User, Check, Bell, Clock } from 'lucide-react';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { BottomNavbar } from '@/components/BottomNavbar';
import { recordUserActivity } from '@/services/activity-service';
import CloudinaryCameraCapture from '@/components/CloudinaryCameraCapture';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { requestNotificationPermission, checkDueReminders } from "@/lib/notifications";

// Types for plants and reminders
type Plant = {
  id: string;
  name: string;
  species: string;
  imageUrl: string;
  createdAt: any;
  userEmail: string;
};

type Reminder = {
  id: string;
  title: string;
  description?: string;
  plantId?: string;  // Link to specific plant
  plantName?: string; // For display purposes
  dueDate: any;  // Timestamp
  recurrence?: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  recurrenceInterval?: number;
  reminderType: 'water' | 'fertilize' | 'prune' | 'repot' | 'other';
  completed: boolean;
  notificationSent: boolean;
  createdAt: any;
  userEmail: string;
};

type GardenState = {
  plants: Plant[];
  reminders: Reminder[];
  loadingPlants: boolean;
  loadingReminders: boolean;
  addingPlant: boolean;
  addingReminder: boolean;
  deletingItem: boolean;
};

type GardenAction = 
  | { type: 'LOADING_PLANTS' }
  | { type: 'LOADING_REMINDERS' }
  | { type: 'SET_PLANTS', payload: Plant[] }
  | { type: 'SET_REMINDERS', payload: Reminder[] }
  | { type: 'ADDING_PLANT', payload: boolean }
  | { type: 'ADDING_REMINDER', payload: boolean }
  | { type: 'DELETING_ITEM', payload: boolean }
  | { type: 'ADD_PLANT', payload: Plant }
  | { type: 'ADD_REMINDER', payload: Reminder }
  | { type: 'DELETE_PLANT', payload: string }
  | { type: 'DELETE_REMINDER', payload: string }
  | { type: 'UPDATE_REMINDER', payload: { id: string, changes: Partial<Reminder> } };

// Reducer for garden state management
const gardenReducer = (state: GardenState, action: GardenAction): GardenState => {
  switch(action.type) {
    case 'LOADING_PLANTS':
      return { ...state, loadingPlants: true };
    case 'LOADING_REMINDERS':
      return { ...state, loadingReminders: true };
    case 'SET_PLANTS':
      return { ...state, plants: action.payload, loadingPlants: false };
    case 'SET_REMINDERS':
      return { ...state, reminders: action.payload, loadingReminders: false };
    case 'ADDING_PLANT':
      return { ...state, addingPlant: action.payload };
    case 'ADDING_REMINDER':
      return { ...state, addingReminder: action.payload };
    case 'DELETING_ITEM':
      return { ...state, deletingItem: action.payload };
    case 'ADD_PLANT':
      return { ...state, plants: [action.payload, ...state.plants] };
    case 'ADD_REMINDER':
      return { ...state, reminders: [action.payload, ...state.reminders] };
    case 'DELETE_PLANT':
      return { ...state, plants: state.plants.filter(plant => plant.id !== action.payload) };
    case 'DELETE_REMINDER':
      return { ...state, reminders: state.reminders.filter(reminder => reminder.id !== action.payload) };
    case 'UPDATE_REMINDER':
      return { 
        ...state, 
        reminders: state.reminders.map(reminder => 
          reminder.id === action.payload.id 
            ? { ...reminder, ...action.payload.changes } 
            : reminder
        ) 
      };
    default:
      return state;
  }
};

// Helper function to format a date and time
const formatDateWithTime = (dateObject: Date): string => {
  // Format date part as Month Day, Year
  const datePart = format(dateObject, "MMM d, yyyy");
  
  // Format time in 12-hour format
  const timePart = format(dateObject, "h:mm a");
  
  return `${datePart} at ${timePart}`;
};

export default function MyGardenPage() {
  const { user, logOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [newPlantName, setNewPlantName] = useState('');
  const [newPlantSpecies, setNewPlantSpecies] = useState('');
  const [newPlantImage, setNewPlantImage] = useState<File | null>(null);
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderDesc, setNewReminderDesc] = useState('');
  const [newReminderDate, setNewReminderDate] = useState<Date | null>(null);
  const [newReminderTime, setNewReminderTime] = useState<string>("12:00");
  const [newReminderType, setNewReminderType] = useState<Reminder['reminderType']>('water');
  const [newReminderRecurrence, setNewReminderRecurrence] = useState<Reminder['recurrence']>('none');
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  // Use reducer for complex state management
  const [gardenState, dispatch] = useReducer(gardenReducer, {
    plants: [],
    reminders: [],
    loadingPlants: false,
    loadingReminders: false,
    addingPlant: false,
    addingReminder: false,
    deletingItem: false
  });

  const auth = getAuth(firebaseApp);
  const storage = getStorage(firebaseApp);
  const db = getFirestore(firebaseApp);

  // Add effect to set isLoaded to true after component mount
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Add effect to redirect if not logged in
  useEffect(() => {
    if (!user && isLoaded) {
      void router.push('/login');
    }
  }, [user, isLoaded, router]);

  // Load plants and reminders when user is authenticated
  useEffect(() => {
    if (user) {
      loadPlants();
      loadReminders();
    }
    
    // Cleanup function to cancel any pending operations
    return () => {
      // This effectively acts as a flag to prevent state updates after unmount
      setIsLoaded(false);
    };
  }, [user]);

  // Set up notifications
  useEffect(() => {
    const setupNotifications = async () => {
      if (user) {
        const hasPermission = await requestNotificationPermission();
        if (hasPermission) {
          // Check for any due reminders
          await checkDueReminders();
        }
      }
    };
    
    setupNotifications();
    
    // Set up a timer to check for reminders every minute
    const notificationInterval = setInterval(() => {
      if (user) {
        void checkDueReminders();
      }
    }, 60000); // Check every minute
    
    return () => {
      clearInterval(notificationInterval);
    };
  }, [user]);

  const loadPlants = async () => {
    if (!user?.email) return;

    try {
      dispatch({ type: 'LOADING_PLANTS' });
      const plantsRef = collection(db, 'plants');
      const q = query(plantsRef, where('userEmail', '==', user.email));
      const querySnapshot = await getDocs(q);
      const plantsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Plant));
      
      dispatch({ type: 'SET_PLANTS', payload: plantsData });
    } catch (error) {
      console.error('Error loading plants:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load your plants. Please try again.',
      });
      
      // Set loading to false even if there's an error
      dispatch({ type: 'SET_PLANTS', payload: [] });
    }
  };

  const loadReminders = async () => {
    if (!user?.email) return;

    try {
      dispatch({ type: 'LOADING_REMINDERS' });
      const remindersRef = collection(db, 'reminders');
      const q = query(remindersRef, where('userEmail', '==', user.email));
      const querySnapshot = await getDocs(q);
      const remindersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Reminder));
      
      dispatch({ type: 'SET_REMINDERS', payload: remindersData });
    } catch (error) {
      console.error('Error loading reminders:', error);
      
      // Set loading to false even if there's an error
      dispatch({ type: 'SET_REMINDERS', payload: [] });
    }
  };

  const addPlant = async () => {
    if (!user?.email) return;
    if (!newPlantName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a plant name.',
      });
      return;
    }

    dispatch({ type: 'ADDING_PLANT', payload: true });
    
    try {
      let imageUrl = '';
      if (newPlantImage) {
        const storageRef = ref(storage, `plants/${user.email}/${Date.now()}_${newPlantImage.name}`);
        await uploadBytes(storageRef, newPlantImage);
        imageUrl = await getDownloadURL(storageRef);
      }

      const newPlantData = {
        userEmail: user.email,
        name: newPlantName,
        species: newPlantSpecies,
        imageUrl,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'plants'), newPlantData);

      // Add to local state
      const newPlant = {
        id: docRef.id,
        ...newPlantData,
        createdAt: new Date() // Use client date for immediate display
      } as Plant;
      
      dispatch({ type: 'ADD_PLANT', payload: newPlant });

      // Record user activity
      await recordUserActivity(user, {
        type: 'garden_add',
        title: `Added ${newPlantName} to garden`,
        description: newPlantSpecies ? `Species: ${newPlantSpecies}` : undefined,
        relatedId: docRef.id,
        iconType: 'flower'
      });

      toast({
        title: 'Success',
        description: 'Plant added to your garden.',
      });

      // Clear form
      setNewPlantName('');
      setNewPlantSpecies('');
      setNewPlantImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error adding plant:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not add plant to your garden.',
      });
    } finally {
      dispatch({ type: 'ADDING_PLANT', payload: false });
    }
  };

  const addReminder = async () => {
    if (!user?.email) return;
    if (!newReminderTitle.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a reminder title.',
      });
      return;
    }

    if (!newReminderDate) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a date for your reminder.',
      });
      return;
    }

    dispatch({ type: 'ADDING_REMINDER', payload: true });
    
    try {
      // Find selected plant name if a plant is selected
      let plantName = null;
      
      if (selectedPlantId && selectedPlantId !== 'none') {
        const selectedPlant = gardenState.plants.find(p => p.id === selectedPlantId);
        plantName = selectedPlant?.name || null;
      }

      // Create a combined date and time
      const combinedDateTime = new Date(newReminderDate);
      if (newReminderTime) {
        const [hours, minutes] = newReminderTime.split(':').map(Number);
        combinedDateTime.setHours(hours, minutes);
      }
      
      const reminderData = {
        userEmail: user.email,
        title: newReminderTitle,
        description: newReminderDesc || null,
        plantId: (selectedPlantId && selectedPlantId !== 'none') ? selectedPlantId : null,
        plantName: plantName,
        dueDate: Timestamp.fromDate(combinedDateTime),
        recurrence: newReminderRecurrence,
        reminderType: newReminderType,
        completed: false,
        notificationSent: false,
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'reminders'), reminderData);

      // Add to local state
      const newReminderObj = {
        id: docRef.id,
        ...reminderData,
        dueDate: combinedDateTime, // Use client date for immediate display
        createdAt: new Date() // Use client date for immediate display
      } as Reminder;
      
      dispatch({ type: 'ADD_REMINDER', payload: newReminderObj });

      toast({
        title: 'Success',
        description: 'Reminder added.',
      });

      // Reset form
      setNewReminderTitle('');
      setNewReminderDesc('');
      setNewReminderDate(null);
      setNewReminderTime("12:00");
      setNewReminderType('water');
      setNewReminderRecurrence('none');
      setSelectedPlantId(null);
      setShowReminderForm(false);
    } catch (error) {
      console.error('Error adding reminder:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not add reminder.',
      });
    } finally {
      dispatch({ type: 'ADDING_REMINDER', payload: false });
    }
  };

  const deletePlant = async (plantId: string) => {
    if (!user?.email) return;

    dispatch({ type: 'DELETING_ITEM', payload: true });
    
    try {
      await deleteDoc(doc(db, 'plants', plantId));
      
      dispatch({ type: 'DELETE_PLANT', payload: plantId });
      
      toast({
        title: 'Success',
        description: 'Plant removed from your garden.',
      });
    } catch (error) {
      console.error('Error deleting plant:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not remove plant.',
      });
    } finally {
      dispatch({ type: 'DELETING_ITEM', payload: false });
    }
  };

  const deleteReminder = async (reminderId: string) => {
    if (!user?.email) return;

    dispatch({ type: 'DELETING_ITEM', payload: true });
    
    try {
      await deleteDoc(doc(db, 'reminders', reminderId));
      
      dispatch({ type: 'DELETE_REMINDER', payload: reminderId });
      
      toast({
        title: 'Success',
        description: 'Reminder removed.',
      });
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not remove reminder.',
      });
    } finally {
      dispatch({ type: 'DELETING_ITEM', payload: false });
    }
  };

  const toggleReminderCompletion = async (reminder: Reminder) => {
    if (!user?.email) return;

    dispatch({ type: 'DELETING_ITEM', payload: true });
    
    try {
      const reminderRef = doc(db, 'reminders', reminder.id);
      
      // Toggle the completion status
      const updatedCompletion = !reminder.completed;
      
      await updateDoc(reminderRef, {
        completed: updatedCompletion,
        // If marking as complete, also mark notification as sent to prevent further notifications
        ...(updatedCompletion ? { notificationSent: true } : {})
      });
      
      // Update local state
      dispatch({ 
        type: 'UPDATE_REMINDER', 
        payload: {
          id: reminder.id,
          changes: { 
            completed: updatedCompletion,
            ...(updatedCompletion ? { notificationSent: true } : {})
          }
        }
      });
      
      toast({
        title: updatedCompletion ? 'Marked as complete' : 'Marked as incomplete',
        description: reminder.title,
      });
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update reminder status.',
      });
    } finally {
      dispatch({ type: 'DELETING_ITEM', payload: false });
    }
  };

  const handleImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: "Image must be less than 5MB.",
        });
        return;
      }
      
      setNewPlantImage(file);
      
      // Create preview using URL.createObjectURL for better performance
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
      
      // Clean up the object URL when no longer needed
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [toast]);

  const handleCameraCapture = (url: string, publicId: string) => {
    setImagePreview(url);
    
    // Fetch the image as a blob to store it properly
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const file = new File([blob], `${publicId}.jpg`, { type: 'image/jpeg' });
        setNewPlantImage(file);
        setShowCamera(false);
        
        toast({
          title: "Photo Captured",
          description: "Image has been captured successfully.",
        });
      })
      .catch(error => {
        console.error('Error processing captured image:', error);
        toast({
          variant: "destructive",
          title: "Capture Error",
          description: "Failed to process captured image. Please try again.",
        });
      });
  };

  // Memoized plant card component to reduce re-renders
  const PlantCard = useCallback(({ plant }: { plant: Plant }) => (
    <Card key={plant.id} className="overflow-hidden border border-border/30 shadow-sm">
      <div className="relative h-48 sm:h-40">
        {plant.imageUrl ? (
          <Image
            src={plant.imageUrl}
            alt={plant.name}
            fill
            sizes="(max-width: 768px) 100vw, 300px"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZWVlZSIvPjwvc3ZnPg=="
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-primary/5">
            <Leaf className="h-16 w-16 text-primary/30" />
          </div>
        )}
        <button
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-sm"
          onClick={() => deletePlant(plant.id)}
          disabled={gardenState.deletingItem}
          aria-label={`Delete ${plant.name}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <CardContent className="pt-4">
        <h3 className="font-semibold text-lg">{plant.name}</h3>
        {plant.species && (
          <p className="text-sm text-muted-foreground">{plant.species}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Added: {plant.createdAt?.toDate ? new Date(plant.createdAt.toDate()).toLocaleDateString() : 'Recently'}
        </p>
      </CardContent>
    </Card>
  ), [gardenState.deletingItem]);

  const handleDeletePlant = useCallback((plantId: string) => {
    deletePlant(plantId);
  }, [deletePlant]);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="app-container min-h-screen bg-background pb-28">
      {/* Header - Updated to match Plant Identification page */}
      <header className="app-header">
        <div className="flex items-center">
          <Leaf className="h-7 w-7 text-primary mr-2" />
          <h1 className="text-2xl font-bold text-primary">My Garden</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/10 text-primary text-xs font-normal px-2 py-1">
            {gardenState.plants.length} {gardenState.plants.length === 1 ? 'Plant' : 'Plants'}
          </Badge>
          
          {/* Notification Bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="relative border-none hover:bg-primary/10"
              >
                <Bell className="h-5 w-5" />
                {gardenState.reminders.filter(r => 
                  !r.completed && r.dueDate && 
                  new Date(r.dueDate.toDate?.() || r.dueDate) <= new Date()
                ).length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex justify-between items-center">
                <span>Reminders</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs"
                  onClick={() => setShowReminderForm(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add New
                </Button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {gardenState.loadingReminders ? (
                <div className="flex justify-center py-4">
                  <Icons.spinner className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : gardenState.reminders.length === 0 ? (
                <div className="px-2 py-4 text-center">
                  <p className="text-sm text-muted-foreground">No reminders added yet.</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setShowReminderForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Reminder
                  </Button>
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto py-1">
                  {gardenState.reminders
                    .filter(r => !r.completed)
                    .sort((a, b) => {
                      const dateA = new Date(a.dueDate.toDate?.() || a.dueDate);
                      const dateB = new Date(b.dueDate.toDate?.() || b.dueDate);
                      return dateA.getTime() - dateB.getTime();
                    })
                    .map(reminder => (
                      <div key={reminder.id} className="px-2 py-2 hover:bg-muted/50 rounded-md mx-1">
                        <div className="flex items-start gap-2">
                          <div className={cn(
                            "mt-0.5 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                            reminder.reminderType === 'water' && "bg-blue-100 text-blue-600",
                            reminder.reminderType === 'fertilize' && "bg-green-100 text-green-600",
                            reminder.reminderType === 'prune' && "bg-amber-100 text-amber-600",
                            reminder.reminderType === 'repot' && "bg-orange-100 text-orange-600",
                            reminder.reminderType === 'other' && "bg-primary/10 text-primary"
                          )}>
                            {reminder.reminderType === 'water' && <Droplet className="h-4 w-4" />}
                            {reminder.reminderType === 'fertilize' && <div className="h-4 w-4 flex items-center justify-center">🌱</div>}
                            {reminder.reminderType === 'prune' && <div className="h-4 w-4 flex items-center justify-center">✂️</div>}
                            {reminder.reminderType === 'repot' && <div className="h-4 w-4 flex items-center justify-center">🪴</div>}
                            {reminder.reminderType === 'other' && <Calendar className="h-4 w-4" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <h4 className="font-medium text-sm">{reminder.title}</h4>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5 -mr-1 -mt-1"
                                onClick={() => toggleReminderCompletion(reminder)}
                              >
                                <div className="h-4 w-4 rounded-full border border-muted-foreground/30 hover:border-primary/50" />
                              </Button>
                            </div>
                            
                            {reminder.dueDate && (
                              <p className={cn(
                                "text-xs mt-1",
                                new Date(reminder.dueDate.toDate?.() || reminder.dueDate) < new Date() 
                                  ? "text-red-500 font-medium" 
                                  : "text-muted-foreground"
                              )}>
                                Due: {reminder.dueDate.toDate 
                                  ? formatDateWithTime(new Date(reminder.dueDate.toDate()))
                                  : formatDateWithTime(new Date(reminder.dueDate))
                                }
                                {new Date(reminder.dueDate.toDate?.() || reminder.dueDate) < new Date() && 
                                  ' (Overdue)'}
                              </p>
                            )}
                            
                            {reminder.plantName && (
                              <p className="text-xs text-green-600 mt-0.5 flex items-center">
                                <Leaf className="h-3 w-3 mr-1" />
                                {reminder.plantName}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {gardenState.reminders.filter(r => !r.completed).length === 0 && (
                      <div className="px-2 py-4 text-center">
                        <p className="text-sm text-muted-foreground">No active reminders.</p>
                      </div>
                    )}
                    
                    <DropdownMenuSeparator />
                    <div className="px-2 py-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={async () => {
                          const hasPermission = await requestNotificationPermission();
                          if (hasPermission) {
                            toast({
                              title: "Notifications Enabled",
                              description: "You'll receive reminders for your plants."
                            });
                          } else {
                            toast({
                              variant: "destructive",
                              title: "Notifications Blocked",
                              description: "Please enable notifications in your browser settings."
                            });
                          }
                        }}
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        Enable Notifications
                      </Button>
                    </div>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Button>
        </div>
      </header>

      <section className="mb-6">
        <p className="text-muted-foreground text-sm">
          Manage your plants and care schedule in one place.
        </p>
      </section>

      {/* Plants Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">My Plants</h2>

        {/* Add New Plant Form */}
        <Card className="border border-border/30 shadow-sm overflow-hidden mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-primary flex items-center gap-2">
              <Plus className="h-5 w-5" /> Add a New Plant
            </CardTitle>
            <CardDescription>
              Add plants to your collection to track care and growth
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="plant-name">Plant Name</Label>
              <Input
                id="plant-name"
                placeholder="E.g., My Monstera"
                value={newPlantName}
                onChange={(e) => setNewPlantName(e.target.value)}
                className="mt-1 focus:border-primary focus:ring-primary"
              />
            </div>
            <div>
              <Label htmlFor="plant-species">Species (Optional)</Label>
              <Input
                id="plant-species"
                placeholder="E.g., Monstera Deliciosa"
                value={newPlantSpecies}
                onChange={(e) => setNewPlantSpecies(e.target.value)}
                className="mt-1 focus:border-primary focus:ring-primary"
              />
            </div>
            <div>
              <Label htmlFor="plant-image" className="block mb-1">Image (Optional)</Label>
              
              {showCamera ? (
                <div className="mb-4">
                  <CloudinaryCameraCapture 
                    onCaptureSuccess={handleCameraCapture}
                    onCaptureError={(error) => {
                      toast({
                        variant: "destructive",
                        title: "Camera Error",
                        description: error?.message || "Failed to access camera",
                      });
                      setShowCamera(false);
                    }}
                    buttonText="Take Photo"
                    folder="garden-plants"
                  />
                </div>
              ) : imagePreview ? (
                <div className="relative h-40 mb-2 rounded-lg overflow-hidden border border-border/30">
                  <Image
                    src={imagePreview}
                    alt="Plant preview"
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    priority
                    style={{ objectFit: 'cover' }}
                  />
                  <button
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    onClick={() => {
                      setNewPlantImage(null);
                      setImagePreview(null);
                    }}
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border border-dashed border-border/50 bg-primary/5 rounded-lg p-4 text-center mb-2">
                  <label htmlFor="plant-image" className="cursor-pointer block">
                    <Leaf className="h-8 w-8 mx-auto text-primary/50 mb-2" />
                    <span className="text-sm text-muted-foreground">Click to select an image</span>
                  </label>
                </div>
              )}
              
              {!showCamera && !imagePreview && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('plant-image')?.click()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Choose Image
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowCamera(true)}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                </div>
              )}

              {showCamera && (
                <div className="text-xs text-muted-foreground mt-1 mb-1 bg-amber-50 p-2 rounded-md">
                  <AlertTriangle className="h-3 w-3 inline-block mr-1" />
                  Camera access is required. Please allow permission when prompted.
                </div>
              )}
              
              {!showCamera && imagePreview && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => setShowCamera(true)}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take New Photo
                </Button>
              )}
              
              <Input
                id="plant-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-primary hover:bg-primary/90"
              onClick={addPlant}
              disabled={gardenState.addingPlant || !newPlantName.trim()}
            >
              {gardenState.addingPlant ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Plant
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Plant Grid */}
        {gardenState.loadingPlants ? (
          <div className="flex justify-center py-8">
            <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Existing Plants */}
            {gardenState.plants.map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>
        )}
            
        {!gardenState.loadingPlants && gardenState.plants.length === 0 && (
          <Card className="p-8 text-center border border-dashed border-border/30 bg-primary/5 shadow-sm">
            <CardContent className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Leaf className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground">No plants added yet.</p>
              <p className="text-muted-foreground text-sm mt-1">Add your first plant to get started!</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Reminders Section */}
      <section className="mb-20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Care Reminders</h2>
          <Badge variant="outline" className="bg-primary/10 text-primary text-xs font-normal px-2 py-1">
            {gardenState.reminders.length} {gardenState.reminders.length === 1 ? 'Reminder' : 'Reminders'}
          </Badge>
        </div>
        <Card className="border border-border/30 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-primary flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Add Reminder
            </CardTitle>
            <CardDescription>Set reminders for watering, fertilizing, etc.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Input
                placeholder="E.g., Water the monstera on Sundays"
                value={newReminderTitle}
                onChange={(e) => setNewReminderTitle(e.target.value)}
                className="focus:border-primary focus:ring-primary"
              />
              <Button 
                className="shrink-0 bg-primary hover:bg-primary/90 shadow-sm"
                onClick={() => setShowReminderForm(true)}
                disabled={gardenState.addingReminder}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                <span className="sr-only md:not-sr-only md:inline-flex">Add</span>
              </Button>
            </div>
          </CardContent>
          <CardContent>
            <div className="space-y-3">
              {gardenState.loadingReminders ? (
                <div className="flex justify-center py-4">
                  <Icons.spinner className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : gardenState.reminders.length === 0 ? (
                <div className="p-4 text-center bg-primary/5 rounded-lg border border-dashed border-border/30">
                  <p className="text-sm text-muted-foreground">No reminders yet. Add one above!</p>
                </div>
              ) : (
                gardenState.reminders.map((reminder) => (
                  <div 
                    key={reminder.id} 
                    className={cn(
                      "rounded-lg border overflow-hidden transition-all duration-200",
                      reminder.completed ? 
                        "border-border/20 bg-muted/10" : 
                        "border-border/30 hover:border-primary/30",
                      reminder.dueDate && new Date(reminder.dueDate.toDate?.() || reminder.dueDate) < new Date() && !reminder.completed ? 
                        "shadow-[0_0_0_1px] shadow-red-200" : ""
                    )}
                  >
                    <div className={cn(
                      "h-1.5 w-full",
                      reminder.reminderType === 'water' && "bg-blue-500",
                      reminder.reminderType === 'fertilize' && "bg-green-500",
                      reminder.reminderType === 'prune' && "bg-amber-500",
                      reminder.reminderType === 'repot' && "bg-orange-500",
                      reminder.reminderType === 'other' && "bg-primary",
                      reminder.completed && "opacity-30"
                    )} />
                    
                    <div className="p-4">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "mt-0.5 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                            reminder.reminderType === 'water' && "bg-blue-100 text-blue-600",
                            reminder.reminderType === 'fertilize' && "bg-green-100 text-green-600",
                            reminder.reminderType === 'prune' && "bg-amber-100 text-amber-600",
                            reminder.reminderType === 'repot' && "bg-orange-100 text-orange-600",
                            reminder.reminderType === 'other' && "bg-primary/10 text-primary",
                            reminder.completed && "opacity-40"
                          )}>
                            {reminder.reminderType === 'water' && <Droplet className="h-4 w-4" />}
                            {reminder.reminderType === 'fertilize' && <div className="h-4 w-4 flex items-center justify-center">🌱</div>}
                            {reminder.reminderType === 'prune' && <div className="h-4 w-4 flex items-center justify-center">✂️</div>}
                            {reminder.reminderType === 'repot' && <div className="h-4 w-4 flex items-center justify-center">🪴</div>}
                            {reminder.reminderType === 'other' && <Calendar className="h-4 w-4" />}
                    </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className={cn(
                              "font-medium text-base line-clamp-1",
                              reminder.completed && "text-muted-foreground line-through"
                            )}>
                              {reminder.title}
                            </h4>
                            
                            {reminder.description && (
                              <p className={cn(
                                "text-sm text-muted-foreground mt-0.5 line-clamp-2",
                                reminder.completed && "line-through opacity-70"
                              )}>
                                {reminder.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap gap-2 mt-2">
                              {reminder.recurrence && reminder.recurrence !== 'none' && (
                                <div className="inline-flex items-center rounded-full border text-xs font-semibold px-2 py-0 h-5 bg-primary/5 border-primary/10">
                                  <span className="mr-1 opacity-70">
                                    {reminder.recurrence === 'daily' && '📅'}
                                    {reminder.recurrence === 'weekly' && '📆'}
                                    {reminder.recurrence === 'biweekly' && '🗓️'}
                                    {reminder.recurrence === 'monthly' && '📅'}
                                  </span>
                                  {reminder.recurrence === 'daily' && 'Daily'}
                                  {reminder.recurrence === 'weekly' && 'Weekly'}
                                  {reminder.recurrence === 'biweekly' && 'Bi-weekly'}
                                  {reminder.recurrence === 'monthly' && 'Monthly'}
                                </div>
                              )}
                              
                              {reminder.plantId && reminder.plantName && (
                                <div className="inline-flex items-center rounded-full border text-xs font-semibold px-2 py-0 h-5 bg-green-50 text-green-800 border-green-200">
                                  <Leaf className="h-3 w-3 mr-1 text-green-600" />
                                  {reminder.plantName}
                                </div>
                              )}
                              
                              {reminder.dueDate && (
                                <div className={cn(
                                  "text-xs",
                                  new Date(reminder.dueDate.toDate?.() || reminder.dueDate) < new Date() && !reminder.completed
                                    ? "text-red-500" 
                                    : "text-muted-foreground"
                                )}>
                                  <Calendar className="h-3 w-3 inline mr-1" />
                                  {reminder.dueDate.toDate 
                                    ? formatDateWithTime(new Date(reminder.dueDate.toDate()))
                                    : formatDateWithTime(new Date(reminder.dueDate))
                                  }
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-1 items-start">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-full"
                            onClick={() => toggleReminderCompletion(reminder)}
                          >
                            <div className={cn(
                              "h-5 w-5 rounded-full border flex items-center justify-center",
                              reminder.completed 
                                ? "bg-primary border-primary" 
                                : "border-muted-foreground/30 hover:border-primary/50"
                            )}>
                              {reminder.completed && <Check className="h-3 w-3 text-white" />}
                            </div>
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => deleteReminder(reminder.id)}
                      disabled={gardenState.deletingItem}
                      aria-label="Delete reminder"
                    >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* New Reminder Dialog */}
      <Dialog open={showReminderForm} onOpenChange={setShowReminderForm}>
        <DialogContent className="sm:max-w-[525px] p-0 overflow-hidden border-none rounded-xl">
          <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-6 border-b">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-5 w-5 text-primary" />
                <DialogTitle className="text-xl font-bold text-primary">Add New Reminder</DialogTitle>
              </div>
              <DialogDescription className="text-muted-foreground">
                Create a reminder for your plant care tasks.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="space-y-3">
              <Label htmlFor="title" className="text-sm font-medium">
                Title
              </Label>
              <Input
                id="title"
                placeholder="Water the monstera"
                value={newReminderTitle}
                onChange={(e) => setNewReminderTitle(e.target.value)}
                className="border-border/50 focus-visible:ring-primary"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="description" className="text-sm font-medium">
                Description (Optional)
              </Label>
              <Input
                id="description"
                placeholder="Use filtered water"
                value={newReminderDesc}
                onChange={(e) => setNewReminderDesc(e.target.value)}
                className="border-border/50 focus-visible:ring-primary"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <Label htmlFor="plant" className="text-sm font-medium">
                  Plant (Optional)
                </Label>
                <Select value={selectedPlantId || 'none'} onValueChange={setSelectedPlantId}>
                  <SelectTrigger className="border-border/50 focus:ring-primary bg-white">
                    <SelectValue placeholder="Select a plant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center">
                        <div className="h-4 w-4 mr-2 opacity-40">🪴</div>
                        None
                      </div>
                    </SelectItem>
                    {gardenState.plants.map(plant => (
                      <SelectItem key={plant.id} value={plant.id}>
                        <div className="flex items-center">
                          <Leaf className="h-4 w-4 mr-2 text-green-600" />
                          {plant.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal border-border/50 focus:ring-primary bg-white",
                        !newReminderDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4 text-primary" />
                      {newReminderDate ? format(newReminderDate, "PPP") : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={newReminderDate || undefined}
                      onSelect={(date) => setNewReminderDate(date || null)}
                      initialFocus
                      className="border rounded-md"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="time" className="text-sm font-medium flex items-center">
                Time 
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Important for push notifications
                </span>
              </Label>
              <div className="relative">
                <Input
                  id="time"
                  type="time"
                  value={newReminderTime}
                  onChange={(e) => setNewReminderTime(e.target.value)}
                  className="border-border/50 focus-visible:ring-primary pl-10"
                />
                <div className="absolute left-3 top-2.5 text-primary">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Set a specific time to receive a mobile notification reminder, even when the app is closed.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <Label htmlFor="type" className="text-sm font-medium">Reminder Type</Label>
                <Select 
                  value={newReminderType} 
                  onValueChange={(value) => setNewReminderType(value as Reminder['reminderType'])}
                >
                  <SelectTrigger className="border-border/50 focus:ring-primary bg-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="water">
                      <div className="flex items-center">
                        <Droplet className="mr-2 h-4 w-4 text-blue-500" />
                        Water
                      </div>
                    </SelectItem>
                    <SelectItem value="fertilize">
                      <div className="flex items-center">
                        <div className="h-4 w-4 mr-2 flex items-center justify-center">🌱</div>
                        Fertilize
                      </div>
                    </SelectItem>
                    <SelectItem value="prune">
                      <div className="flex items-center">
                        <div className="h-4 w-4 mr-2 flex items-center justify-center">✂️</div>
                        Prune
                      </div>
                    </SelectItem>
                    <SelectItem value="repot">
                      <div className="flex items-center">
                        <div className="h-4 w-4 mr-2 flex items-center justify-center">🪴</div>
                        Repot
                      </div>
                    </SelectItem>
                    <SelectItem value="other">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-primary" />
                        Other
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="recurrence" className="text-sm font-medium">Recurrence</Label>
                <Select 
                  value={newReminderRecurrence} 
                  onValueChange={(value) => setNewReminderRecurrence(value as Reminder['recurrence'])}
                >
                  <SelectTrigger className="border-border/50 focus:ring-primary bg-white">
                    <SelectValue placeholder="Select recurrence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center">
                        <X className="mr-2 h-4 w-4 text-muted-foreground" />
                        No Repeat
                      </div>
                    </SelectItem>
                    <SelectItem value="daily">
                      <div className="flex items-center">
                        <div className="mr-2 h-4 w-4 flex items-center justify-center">📅</div>
                        Daily
                      </div>
                    </SelectItem>
                    <SelectItem value="weekly">
                      <div className="flex items-center">
                        <div className="mr-2 h-4 w-4 flex items-center justify-center">📆</div>
                        Weekly
                      </div>
                    </SelectItem>
                    <SelectItem value="biweekly">
                      <div className="flex items-center">
                        <div className="mr-2 h-4 w-4 flex items-center justify-center">🗓️</div>
                        Every 2 Weeks
                      </div>
                    </SelectItem>
                    <SelectItem value="monthly">
                      <div className="flex items-center">
                        <div className="mr-2 h-4 w-4 flex items-center justify-center">📅</div>
                        Monthly
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-muted/30 border-t flex items-center justify-between">
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const hasPermission = await requestNotificationPermission();
                  if (hasPermission) {
                    toast({
                      title: "Notifications Enabled",
                      description: "You'll receive reminders for your plants."
                    });
                  } else {
                    toast({
                      variant: "destructive",
                      title: "Notifications Blocked",
                      description: "Please enable notifications in your browser settings."
                    });
                  }
                }}
                className="flex items-center gap-1.5 border-border/50 focus:ring-primary"
              >
                <Bell className="h-4 w-4" />
                Enable Notifications
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowReminderForm(false)}
                className="border-border/50 focus:ring-primary"
              >
                Cancel
              </Button>
              <Button 
                onClick={addReminder} 
                disabled={!newReminderTitle || !newReminderDate || gardenState.addingReminder}
                className="bg-primary hover:bg-primary/90"
              >
                {gardenState.addingReminder ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Reminder
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sign Out Button */}
      <div className="fixed bottom-20 right-4 z-10">
        <Button 
          onClick={() => {
            logOut();
            router.push('/'); 
          }}
          variant="destructive"
          size="sm"
          className="rounded-full shadow-md"
        >
          Sign Out
        </Button>
      </div>

      {/* Bottom Navigation */}
      <BottomNavbar />
    </div>
  );
}
