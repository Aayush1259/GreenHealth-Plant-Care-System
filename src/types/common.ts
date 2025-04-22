import { Timestamp } from 'firebase/firestore';

export interface FirebaseError {
  code: string;
  message: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UserData {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PlantData {
  id: string;
  name: string;
  species?: string;
  imageUrl?: string;
  health?: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ReminderData {
  id: string;
  title: string;
  description?: string;
  dueDate: Timestamp;
  completed: boolean;
  userId: string;
  plantId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ErrorHandler = (error: unknown) => void;
export type SuccessHandler<T = void> = (data: T) => void; 