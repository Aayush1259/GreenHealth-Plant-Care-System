'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { auth, firestore } from '@/lib/firebase';
import { 
  createUserDocument, 
  getUserProfile, 
  updateUserProfile, 
  UserProfile 
} from '@/services/user-service';

// Define the types for the context
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, name: string) => Promise<User>;
  logOut: () => Promise<void>;
  signInWithGoogle: () => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (data: Partial<UserProfile>) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// Create the provider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes and fetch profile
  useEffect(() => {
    setLoading(true); // Start loading when auth state might change
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
          if (!profile) {
            await createUserDocument(user);
            const newProfile = await getUserProfile(user.uid);
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(null); // Reset profile on error
        }
      } else {
        setUserProfile(null); // Clear profile when logged out
      }
      
      setLoading(false); // Finish loading after user/profile state is settled
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<User> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  // Create a new user with email and password
  const signUp = async (email: string, password: string, name: string): Promise<User> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      await firebaseUpdateProfile(user, { displayName: name });
      await createUserDocument(user, { displayName: name });
      return user;
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  // Sign out
  const logOut = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async (): Promise<User> => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await createUserDocument(user);
      return user;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  // Update user profile (includes updating local userProfile state)
  const updateUser = async (data: Partial<UserProfile>): Promise<void> => {
    if (!user) throw new Error('No user is signed in');
    try {
      const authUpdates: { displayName?: string; photoURL?: string } = {};
      
      // Ensure we pass string or undefined to firebaseUpdateProfile
      if (data.displayName !== undefined) {
        authUpdates.displayName = typeof data.displayName === 'string' ? data.displayName : undefined;
      }
      if (data.photoURL !== undefined) {
        authUpdates.photoURL = typeof data.photoURL === 'string' ? data.photoURL : undefined;
      }
      
      if (Object.keys(authUpdates).length > 0) {
        await firebaseUpdateProfile(user, authUpdates);
      }
      
      // Ensure we pass a string to firebaseUpdateEmail
      if (data.email !== undefined && typeof data.email === 'string' && data.email !== user.email) {
        await firebaseUpdateEmail(user, data.email);
      }
      
      // Update Firestore document (this can handle nulls if your schema allows)
      await updateUserProfile(user.uid, data);
      
      // Refresh user profile state
      const updatedProfile = await getUserProfile(user.uid);
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  // Update password
  const updatePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!user || !user.email) throw new Error('User not properly signed in for password update');
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await firebaseUpdatePassword(user, newPassword);
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  };

  // Create the value object
  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    logOut,
    signInWithGoogle,
    resetPassword,
    updateUser,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 