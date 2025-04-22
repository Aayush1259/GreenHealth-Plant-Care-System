import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  onSnapshot,
  serverTimestamp,
  DocumentReference,
  QueryConstraint
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export type FirestoreDocument = {
  id: string;
  [key: string]: any;
};

/**
 * Custom hook for managing a collection of documents
 */
export function useCollection<T extends FirestoreDocument>(
  collectionPath: string,
  constraints: QueryConstraint[] = [],
  deps: any[] = []
) {
  const [documents, setDocuments] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Reset states when collection path or constraints change
  useEffect(() => {
    setLoading(true);
    setError(null);
  }, [collectionPath, ...deps]);

  // Subscribe to collection changes
  useEffect(() => {
    try {
      const collectionRef = collection(firestore, collectionPath);
      const q = query(collectionRef, ...constraints);
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const results = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as T));
          
          setDocuments(results);
          setLoading(false);
        },
        (err) => {
          console.error('Error getting collection:', err);
          setError(err as Error);
          setLoading(false);
        }
      );
      
      // Cleanup subscription
      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up collection listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [collectionPath, ...constraints, ...deps]);
  
  // Add a document to collection
  const addDocument = useCallback(async (data: Omit<T, 'id'>) => {
    try {
      const collectionRef = collection(firestore, collectionPath);
      
      // Add timestamp
      const docData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collectionRef, docData);
      
      return docRef.id;
    } catch (err) {
      console.error('Error adding document:', err);
      throw err;
    }
  }, [collectionPath]);
  
  // Set a document with a specific ID
  const setDocument = useCallback(async (id: string, data: Omit<T, 'id'>) => {
    try {
      const docRef = doc(firestore, collectionPath, id);
      
      // Add timestamp
      const docData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(docRef, docData);
      
      return id;
    } catch (err) {
      console.error('Error setting document:', err);
      throw err;
    }
  }, [collectionPath]);
  
  // Update an existing document
  const updateDocument = useCallback(async (id: string, data: Partial<Omit<T, 'id'>>) => {
    try {
      const docRef = doc(firestore, collectionPath, id);
      
      // Add timestamp and remove undefined values
      const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
      
      const docData = {
        ...cleanedData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, docData);
      
      return id;
    } catch (err) {
      console.error('Error updating document:', err);
      throw err;
    }
  }, [collectionPath]);
  
  // Delete a document
  const deleteDocument = useCallback(async (id: string) => {
    try {
      const docRef = doc(firestore, collectionPath, id);
      await deleteDoc(docRef);
      
      return id;
    } catch (err) {
      console.error('Error deleting document:', err);
      throw err;
    }
  }, [collectionPath]);
  
  return { 
    documents, 
    loading, 
    error, 
    addDocument, 
    setDocument,
    updateDocument,
    deleteDocument
  };
}

/**
 * Custom hook for managing a single document
 */
export function useDocument<T extends Omit<FirestoreDocument, 'id'>>(
  collectionPath: string,
  docId: string | null,
  deps: any[] = []
) {
  const [document, setDocument] = useState<(T & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Reset states when document path changes
  useEffect(() => {
    setLoading(true);
    setError(null);
  }, [collectionPath, docId, ...deps]);

  // Subscribe to document changes
  useEffect(() => {
    if (!docId) {
      setDocument(null);
      setLoading(false);
      return;
    }
    
    try {
      const docRef = doc(firestore, collectionPath, docId);
      
      const unsubscribe = onSnapshot(docRef, 
        (snapshot) => {
          if (snapshot.exists()) {
            setDocument({
              id: snapshot.id,
              ...snapshot.data()
            } as T & { id: string });
          } else {
            setDocument(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error('Error getting document:', err);
          setError(err as Error);
          setLoading(false);
        }
      );
      
      // Cleanup subscription
      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up document listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [collectionPath, docId, ...deps]);
  
  // Update document
  const updateData = useCallback(async (data: Partial<T>) => {
    if (!docId) {
      throw new Error('Document ID is required for update');
    }
    
    try {
      const docRef = doc(firestore, collectionPath, docId);
      
      // Remove undefined values
      const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
      
      // Add timestamp
      const updateData = {
        ...cleanedData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, updateData);
      
      return docId;
    } catch (err) {
      console.error('Error updating document:', err);
      throw err;
    }
  }, [collectionPath, docId]);
  
  // Delete document
  const deleteData = useCallback(async () => {
    if (!docId) {
      throw new Error('Document ID is required for deletion');
    }
    
    try {
      const docRef = doc(firestore, collectionPath, docId);
      await deleteDoc(docRef);
      
      return docId;
    } catch (err) {
      console.error('Error deleting document:', err);
      throw err;
    }
  }, [collectionPath, docId]);
  
  // Set document (overwrite)
  const setData = useCallback(async (data: T) => {
    if (!docId) {
      throw new Error('Document ID is required for set');
    }
    
    try {
      const docRef = doc(firestore, collectionPath, docId);
      
      // Add timestamp
      const docData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(docRef, docData);
      
      return docId;
    } catch (err) {
      console.error('Error setting document:', err);
      throw err;
    }
  }, [collectionPath, docId]);
  
  return { 
    document, 
    loading, 
    error, 
    updateData, 
    deleteData, 
    setData 
  };
}

/**
 * Custom hook for user-specific data with authentication
 */
export function useUserCollection<T extends FirestoreDocument>(
  collectionPath: string,
  constraints: QueryConstraint[] = [],
  deps: any[] = []
) {
  const { user } = useAuth();
  const userConstraints = user ? [where('userId', '==', user.uid), ...constraints] : constraints;
  
  return useCollection<T>(collectionPath, userConstraints, [user?.uid, ...deps]);
}

/**
 * Type for an optimistic document that includes metadata
 */
export type OptimisticDocument<T extends FirestoreDocument> = T & {
  _isOptimistic?: boolean;
  createdAt: Date | any;
  updatedAt: Date | any;
};

/**
 * Custom hook for optimistic updates to Firestore
 */
export function useOptimisticCollection<T extends FirestoreDocument>(
  collectionPath: string,
  constraints: QueryConstraint[] = [],
  deps: any[] = []
) {
  const { 
    documents, 
    loading, 
    error, 
    addDocument, 
    updateDocument, 
    deleteDocument 
  } = useCollection<T>(collectionPath, constraints, deps);
  
  const [optimisticDocuments, setOptimisticDocuments] = useState<OptimisticDocument<T>[]>([]);
  
  // When the real documents change, update optimistic state
  useEffect(() => {
    setOptimisticDocuments(documents as OptimisticDocument<T>[]);
  }, [documents]);
  
  // Add a document with optimistic update
  const optimisticAdd = async (data: Omit<T, 'id'>) => {
    // Create a temporary ID
    const tempId = `temp-${Date.now()}`;
    
    // Create optimistic document
    const optimisticDoc: OptimisticDocument<T> = {
      id: tempId,
      ...data as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      _isOptimistic: true
    };
    
    // Update local state optimistically
    setOptimisticDocuments(prev => [...prev, optimisticDoc]);
    
    try {
      // Perform the actual operation
      const newId = await addDocument(data);
      
      // Update optimistic state by replacing the temp document with real one
      setOptimisticDocuments(prev => 
        prev.filter(doc => doc.id !== tempId)
      );
      
      return newId;
    } catch (error) {
      // Revert optimistic update in case of error
      setOptimisticDocuments(prev => 
        prev.filter(doc => doc.id !== tempId)
      );
      throw error;
    }
  };
  
  // Update a document with optimistic update
  const optimisticUpdate = async (id: string, data: Partial<Omit<T, 'id'>>) => {
    // Find the document to update
    const docToUpdate = optimisticDocuments.find(doc => doc.id === id);
    
    if (!docToUpdate) {
      throw new Error(`Document with ID ${id} not found`);
    }
    
    // Create updated document
    const updatedDoc: OptimisticDocument<T> = {
      ...docToUpdate,
      ...data as any,
      updatedAt: new Date(),
      _isOptimistic: true
    };
    
    // Update local state optimistically
    setOptimisticDocuments(prev => 
      prev.map(doc => doc.id === id ? updatedDoc : doc)
    );
    
    try {
      // Perform the actual operation
      await updateDocument(id, data);
      return id;
    } catch (error) {
      // Revert optimistic update in case of error
      setOptimisticDocuments(prev => 
        prev.map(doc => doc.id === id ? docToUpdate : doc)
      );
      throw error;
    }
  };
  
  // Delete a document with optimistic update
  const optimisticDelete = async (id: string) => {
    // Find the document to delete
    const docToDelete = optimisticDocuments.find(doc => doc.id === id);
    
    if (!docToDelete) {
      throw new Error(`Document with ID ${id} not found`);
    }
    
    // Update local state optimistically
    setOptimisticDocuments(prev => 
      prev.filter(doc => doc.id !== id)
    );
    
    try {
      // Perform the actual operation
      await deleteDocument(id);
      return id;
    } catch (error) {
      // Revert optimistic update in case of error
      setOptimisticDocuments(prev => [...prev, docToDelete]);
      throw error;
    }
  };
  
  return {
    documents: optimisticDocuments,
    loading,
    error,
    addDocument: optimisticAdd,
    updateDocument: optimisticUpdate,
    deleteDocument: optimisticDelete,
    // Keep the original methods available as well
    originalAddDocument: addDocument,
    originalUpdateDocument: updateDocument,
    originalDeleteDocument: deleteDocument
  };
} 