import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Leaf, Droplet, Check, Plus, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  Timestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { firebaseApp } from '@/lib/firebase';
import { requestNotificationPermission, checkDueReminders } from "@/lib/notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icons } from '@/components/icons';

// Types
type Reminder = {
  id: string;
  title: string;
  description?: string;
  plantId?: string;
  plantName?: string;
  dueDate: any;
  recurrence?: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  reminderType: 'water' | 'fertilize' | 'prune' | 'repot' | 'other';
  completed: boolean;
  notificationSent: boolean;
  createdAt: any;
  userEmail: string;
};

interface ReminderDropdownProps {
  buttonClassName?: string;
  iconClassName?: string;
  onAddReminderClick?: () => void;
}

// Helper function to format a date and time
const formatDateWithTime = (dateObject: Date): string => {
  // Format date part as Month Day, Year
  const datePart = format(dateObject, "MMM d, yyyy");
  
  // Format time in 12-hour format
  const timePart = format(dateObject, "h:mm a");
  
  return `${datePart} at ${timePart}`;
};

export default function ReminderDropdown({ 
  buttonClassName, 
  iconClassName,
  onAddReminderClick
}: ReminderDropdownProps) {
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  
  const auth = getAuth(firebaseApp);
  const db = getFirestore(firebaseApp);
  const user = auth.currentUser;
  
  // Fetch reminders on component mount
  useEffect(() => {
    if (user) {
      loadReminders();
      
      // Set up notifications
      const setupNotifications = async () => {
        await requestNotificationPermission();
        await checkDueReminders();
      };
      
      setupNotifications();
      
      // Check for due reminders periodically
      const notificationInterval = setInterval(() => {
        void checkDueReminders();
      }, 60000); // Check every minute
      
      return () => {
        clearInterval(notificationInterval);
      };
    }
  }, [user]);
  
  const loadReminders = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      const remindersRef = collection(db, 'reminders');
      const q = query(remindersRef, where('userEmail', '==', user.email));
      const querySnapshot = await getDocs(q);
      const remindersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Reminder));
      
      setReminders(remindersData);
    } catch (error) {
      console.error('Error loading reminders:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load your reminders.',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const toggleReminderCompletion = async (reminder: Reminder) => {
    if (!user?.email) return;
    
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
      setReminders(prev => 
        prev.map(r => 
          r.id === reminder.id 
            ? { 
                ...r, 
                completed: updatedCompletion,
                ...(updatedCompletion ? { notificationSent: true } : {})
              } 
            : r
        )
      );
      
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
    }
  };
  
  // Check for overdue reminders to show notification dot
  const hasOverdueReminders = reminders.some(r => 
    !r.completed && r.dueDate && 
    new Date(r.dueDate.toDate?.() || r.dueDate) <= new Date()
  );
  
  // Go to garden/add reminder view
  const handleAddReminderClick = () => {
    if (onAddReminderClick) {
      onAddReminderClick();
    } else {
      router.push('/garden');
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className={cn("relative border-none hover:bg-primary/10", buttonClassName)}
        >
          <Bell className={cn("h-5 w-5", iconClassName)} />
          {hasOverdueReminders && (
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
            onClick={handleAddReminderClick}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add New
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="flex justify-center py-4">
            <Icons.spinner className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : reminders.length === 0 ? (
          <div className="px-2 py-4 text-center">
            <p className="text-sm text-muted-foreground">No reminders added yet.</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2"
              onClick={handleAddReminderClick}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Reminder
            </Button>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto py-1">
            {reminders
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
              
              {reminders.filter(r => !r.completed).length === 0 && (
                <div className="px-2 py-4 text-center">
                  <p className="text-sm text-muted-foreground">No active reminders.</p>
                </div>
              )}
              
              <DropdownMenuSeparator />
              <div className="px-2 py-2">
                <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-xs mb-2">
                  <div className="flex items-center mb-1.5">
                    <Bell className="h-3.5 w-3.5 mr-1.5" />
                    <span className="font-medium">Mobile Notifications</span>
                  </div>
                  <p>
                    Reminders will show as push notifications on your mobile device at the specified time, even when the app is closed.
                  </p>
                </div>
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
                    
                    // Reload reminders after enabling notifications
                    loadReminders();
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
  );
} 