import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  plantPreferences?: string[];
  gardenZone?: string;
  expertise?: 'beginner' | 'intermediate' | 'advanced';
  pushNotifications?: boolean;
  emailNotifications?: boolean;
  notificationSettings?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  lastLogin?: any;
  role?: 'user' | 'admin';
}

export const createUserDocument = async (user: User, additionalData?: Partial<UserProfile>): Promise<void> => {
  if (!user) return;

  const userRef = doc(firestore, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  // Only create a new document if it doesn't exist
  if (!snapshot.exists()) {
    const { email, displayName, photoURL } = user;
    
    try {
      await setDoc(userRef, {
        uid: user.uid,
        email,
        displayName: displayName || additionalData?.displayName || '',
        photoURL: photoURL || additionalData?.photoURL || '',
        createdAt: serverTimestamp(),
        ...(additionalData || {})
      });
    } catch (error) {
      console.error('Error creating user document', error);
      throw error;
    }
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(firestore, 'users', uid));
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  try {
    // Remove undefined values
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    await updateDoc(doc(firestore, 'users', uid), {
      ...cleanData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const getUserByEmail = async (email: string): Promise<UserProfile | null> => {
  try {
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return userDoc.data() as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
};

export async function updateUserPreferences(
  uid: string,
  preferences: {
    plantPreferences?: string[];
    gardenZone?: string;
    expertise?: 'beginner' | 'intermediate' | 'advanced';
    pushNotifications?: boolean;
    emailNotifications?: boolean;
  }
): Promise<void> {
  try {
    const userRef = doc(firestore, 'users', uid);
    
    // Remove undefined values to avoid overwriting with undefined
    const cleanedPreferences = Object.fromEntries(
      Object.entries(preferences).filter(([_, v]) => v !== undefined)
    );
    
    await updateDoc(userRef, {
      ...cleanedPreferences,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
}

export async function uploadProfilePicture(
  uid: string, 
  file: File | Blob
): Promise<string> {
  try {
    // Create storage reference
    const storageRef = ref(storage, `users/${uid}/profile-picture`);
    
    // Upload file
    const uploadTask = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(uploadTask.ref);
    
    // Update user profile with new photo URL
    await updateUserProfile(uid, { photoURL: downloadURL });
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
} 