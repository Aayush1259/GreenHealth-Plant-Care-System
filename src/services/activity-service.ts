import { 
  doc, 
  getDoc, 
  setDoc, 
  addDoc,
  updateDoc, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  orderBy,
  limit,
  getDocs 
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

// Define activity types
export type ActivityType = 'plant_identification' | 'disease_detection' | 'community_post' | 'garden_add' | 'join_community';

// Define activity interface
export interface UserActivity {
  id?: string;
  userId: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: any;
  relatedId?: string; // ID of related entity (plant, post, etc.)
  iconType?: 'leaf' | 'shield' | 'message' | 'flower'; // Icon type to display
}

/**
 * Add a new activity for the user
 */
export const recordUserActivity = async (
  user: User | null, 
  activity: Omit<UserActivity, 'userId' | 'timestamp' | 'id'>
): Promise<string | null> => {
  if (!user) return null;

  try {
    const activitiesRef = collection(firestore, 'userActivities');
    
    const activityData = {
      ...activity,
      userId: user.uid,
      timestamp: serverTimestamp(),
    };
    
    const docRef = await addDoc(activitiesRef, activityData);
    return docRef.id;
  } catch (error) {
    console.error('Error recording user activity:', error);
    return null;
  }
};

/**
 * Get recent activities for a user
 */
export const getUserActivities = async (
  userId: string,
  count: number = 5
): Promise<UserActivity[]> => {
  try {
    const activitiesRef = collection(firestore, 'userActivities');
    const q = query(
      activitiesRef, 
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(count)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as UserActivity));
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return [];
  }
};

/**
 * Get a formatted time string from the timestamp
 */
export const getTimeAgo = (timestamp: any): string => {
  if (!timestamp) return 'Just now';
  
  // Convert Firebase timestamp to JS Date if needed
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Less than a minute
  if (seconds < 60) {
    return 'Just now';
  }
  
  // Less than an hour
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Less than a day
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Less than a week
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days === 1 ? 'Yesterday' : `${days} days ago`}`;
  }
  
  // Less than a month
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  
  // More than a month, show date
  return date.toLocaleDateString();
}; 