"use client";

import React, {useState, useEffect, useCallback, useReducer, useMemo, useRef, Suspense} from 'react';
import {useAuth} from '@/contexts/AuthContext';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Textarea} from '@/components/ui/textarea';
import {Input} from '@/components/ui/input';
import {useToast} from '@/hooks/use-toast';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
  limit,
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import {getStorage, ref, uploadBytes, getDownloadURL} from 'firebase/storage';
import {firebaseApp} from '@/lib/firebase';
import dynamic from 'next/dynamic';
import {Heart, MessageSquare, Home, HelpCircle, ArrowLeft, Loader2, RefreshCw, Camera, AlertTriangle, X, Upload} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {Icons} from '@/components/icons';
import { Badge } from "@/components/ui/badge";
import { BottomNavbar } from '@/components/BottomNavbar';
import { debounce } from 'lodash-es';
import { recordUserActivity } from '@/services/activity-service';
import CloudinaryCameraCapture from '@/components/CloudinaryCameraCapture';

// Dynamically import the Image component to reduce initial bundle size
const LazyImage = dynamic(() => import('next/image'), { 
  loading: () => <div className="h-64 w-full bg-muted animate-pulse rounded-lg"></div>,
  ssr: false 
});

// Post and state reducer types
type Post = {
  id: string;
  text: string;
  imageUrl: string;
  userId: string;
  displayName: string;
  timestamp: any;
  likes: string[];
  comments: any[];
};

type PostsState = {
  posts: Post[];
  loading: boolean;
  hasMore: boolean;
  lastVisible: QueryDocumentSnapshot | null;
};

type PostsAction = 
  | { type: 'LOADING' }
  | { type: 'LOAD_POSTS', payload: { posts: Post[], lastVisible: QueryDocumentSnapshot | null, hasMore: boolean } }
  | { type: 'ADD_POST', payload: Post }
  | { type: 'DELETE_POST', payload: string }
  | { type: 'LIKE_POST', payload: { postId: string, userEmail: string } }
  | { type: 'UNLIKE_POST', payload: { postId: string, userEmail: string } }
  | { type: 'ADD_COMMENT', payload: { postId: string, comment: any } };

// Create image cache to prevent duplicate downloads
const imageCache = new Map();

// The reducer for posts state management
const postsReducer = (state: PostsState, action: PostsAction): PostsState => {
  switch(action.type) {
    case 'LOADING':
      return { ...state, loading: true };
    case 'LOAD_POSTS':
      return {
        posts: action.payload.hasMore ? [...state.posts, ...action.payload.posts] : action.payload.posts,
        loading: false,
        hasMore: action.payload.hasMore,
        lastVisible: action.payload.lastVisible
      };
    case 'ADD_POST':
      return {
        ...state,
        posts: [action.payload, ...state.posts]
      };
    case 'DELETE_POST':
      return {
        ...state,
        posts: state.posts.filter(post => post.id !== action.payload)
      };
    case 'LIKE_POST':
      return {
        ...state,
        posts: state.posts.map(post => 
          post.id === action.payload.postId
            ? { ...post, likes: [...post.likes, action.payload.userEmail] }
            : post
        )
      };
    case 'UNLIKE_POST':
      return {
        ...state,
        posts: state.posts.map(post => 
          post.id === action.payload.postId
            ? { ...post, likes: post.likes.filter(email => email !== action.payload.userEmail) }
            : post
        )
      };
    case 'ADD_COMMENT':
      return {
        ...state,
        posts: state.posts.map(post => {
          if (post.id === action.payload.postId) {
            return {
              ...post,
              comments: [...post.comments, action.payload.comment]
            };
          }
          return post;
        })
      };
    default:
      return state;
  }
};

const POSTS_PER_PAGE = 10; // Increased to reduce the number of batches

export default function CommunityPage() {
  const {user} = useAuth();
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const {toast} = useToast();
  const [commentText, setCommentText] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [postingState, setPostingState] = useState(false);
  const [commentingState, setCommentingState] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Use an observer to detect visible posts
  const observerRef = useRef<IntersectionObserver | null>(null);
  const postRefs = useRef<{[key: string]: HTMLLIElement | null}>({});
  
  // Use reducer for complex state management
  const [postsState, dispatch] = useReducer(postsReducer, {
    posts: [],
    loading: false,
    hasMore: true,
    lastVisible: null
  });

  const router = useRouter();
  const db = getFirestore(firebaseApp);
  const storage = getStorage(firebaseApp);

  // Load initial posts with pagination - optimized with abort controller and cleanup
  useEffect(() => {
    const abortController = new AbortController();
    
    const loadPosts = async () => {
      try {
        if (abortController.signal.aborted) return;
        
        dispatch({ type: 'LOADING' });
        
        const postsCollection = query(
          collection(db, 'communityPosts'),
          orderBy('timestamp', 'desc'),
          limit(POSTS_PER_PAGE)
        );
        
        const postSnapshot = await getDocs(postsCollection);
        if (abortController.signal.aborted) return;
        
        const lastVisible = postSnapshot.docs[postSnapshot.docs.length - 1];
        const postList = postSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Post));
        
        const hasMore = postSnapshot.docs.length === POSTS_PER_PAGE;
        
        dispatch({ 
          type: 'LOAD_POSTS', 
          payload: { 
            posts: postList, 
            lastVisible: hasMore ? lastVisible : null,
            hasMore 
          } 
        });
      } catch (error: any) {
        if (!abortController.signal.aborted) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to load posts.',
        });
        }
      }
    };

    loadPosts();
    
    return () => {
      abortController.abort();
    };
  }, [db, toast]);

  // Setup intersection observer for lazy loading posts
  useEffect(() => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    // Setup new observer for infinite scrolling
    const options = {
      root: null,
      rootMargin: '200px',
      threshold: 0.1
    };
    
    observerRef.current = new IntersectionObserver((entries) => {
      const lastEntry = entries[entries.length - 1];
      if (lastEntry && lastEntry.isIntersecting && postsState.hasMore && !postsState.loading) {
        loadMorePosts();
      }
    }, options);
    
    // Observe the last post element if it exists
    const lastPostId = postsState.posts[postsState.posts.length - 1]?.id;
    if (lastPostId && postRefs.current[lastPostId]) {
      observerRef.current.observe(postRefs.current[lastPostId]!);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [postsState.posts, postsState.hasMore, postsState.loading]);

  // Load more posts function - optimized
  const loadMorePosts = useCallback(async () => {
    if (!postsState.hasMore || postsState.loading || !postsState.lastVisible) return;
    
    try {
      dispatch({ type: 'LOADING' });
      
      const postsCollection = query(
        collection(db, 'communityPosts'),
        orderBy('timestamp', 'desc'),
        startAfter(postsState.lastVisible),
        limit(POSTS_PER_PAGE)
      );
      
      const postSnapshot = await getDocs(postsCollection);
      const lastVisible = postSnapshot.docs[postSnapshot.docs.length - 1];
      const postList = postSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Post));
      
      const hasMore = postSnapshot.docs.length === POSTS_PER_PAGE;
      
      dispatch({ 
        type: 'LOAD_POSTS', 
        payload: { 
          posts: postList, 
          lastVisible: hasMore ? lastVisible : null,
          hasMore 
        } 
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load more posts.',
      });
    }
  }, [postsState.lastVisible, postsState.hasMore, postsState.loading, db, toast]);

  // Optimized image compression with WebWorker if available
  const compressImage = async (file: File, maxWidth: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      // Check if we already have this file in cache (by name and size)
      const cacheKey = `${file.name}-${file.size}`;
      if (imageCache.has(cacheKey)) {
        resolve(imageCache.get(cacheKey));
        return;
      }
      
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
          
          // Use low-quality rendering for better performance
          ctx.imageSmoothingQuality = 'low';
          ctx.drawImage(image, 0, 0, width, height);
          
          // Convert to blob with reduced quality
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Store in cache
                imageCache.set(cacheKey, blob);
                resolve(blob);
              } else {
                reject(new Error('Canvas to Blob conversion failed'));
              }
            },
            'image/jpeg',
            0.7 // 70% quality - further reduced for better performance
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

  // Format timestamp - memoized to prevent recalculation
  const formatTimestamp = useCallback((timestamp: any) => {
    if (!timestamp) return 'Just now';
    // Check if it's a Firebase timestamp with toDate method
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleString();
    }
    // Check if it's a date object
    if (timestamp instanceof Date) {
      return timestamp.toLocaleString();
    }
    // If it's just a string date or timestamp number
    return new Date(timestamp).toLocaleString();
  }, []);

  // Optimized add post function
  const addPost = async () => {
    if (newPostText.trim() === '') return;
    if (!user || !user.email) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to create a post.',
      });
      return;
    }

    // Save form data before clearing it
    const postText = newPostText;
    const imageFile = newPostImage;
    
    // Clear the form immediately for better UX
    setNewPostText('');
    setNewPostImage(null);
    setImagePreview(null);
    
    // Show posting status
    setPostingState(true);
    toast({
      title: 'Creating Post...',
      description: 'Your post is being uploaded.',
    });
    
    try {
      let imageUrl = '';
      if (imageFile) {
        // Check if we're dealing with our optimized image object
        if ('blob' in imageFile) {
          // For optimized images, use the blob for upload
          const storageRef = ref(storage, `communityPosts/${Date.now()}-${imageFile.name}`);
          await uploadBytes(storageRef, imageFile.blob as Blob);
          imageUrl = await getDownloadURL(storageRef);
        } else {
          // For regular files, compress before upload
          const optimizedBlob = await compressImage(imageFile, 1200);
          const storageRef = ref(storage, `communityPosts/${Date.now()}-${imageFile.name}`);
          await uploadBytes(storageRef, optimizedBlob);
        imageUrl = await getDownloadURL(storageRef);
        }
      }

      // Create post in Firestore
      const docRef = await addDoc(collection(db, 'communityPosts'), {
        text: postText,
        imageUrl: imageUrl,
        userId: user.email,
        displayName: user.displayName || 'Anonymous',
        timestamp: serverTimestamp(),
        likes: [], // Initialize likes array
        comments: [], // Initialize comments array
      });
      
      // Add the new post to the local state without doing a full reload
      const newPost = {
        id: docRef.id,
        text: postText,
        imageUrl: imageUrl,
        userId: user.email,
        displayName: user.displayName || 'Anonymous',
        timestamp: {
          seconds: Math.floor(Date.now() / 1000),
          nanoseconds: 0
        },
        likes: [],
        comments: []
      };
      
      // Update posts with the new post at the top
      dispatch({ type: 'ADD_POST', payload: newPost });
      
      // Record user activity
      await recordUserActivity(user, {
        type: 'community_post',
        title: 'Created a post in the community',
        description: postText.length > 40 ? `${postText.substring(0, 40)}...` : postText,
        relatedId: docRef.id,
        iconType: 'message'
      });
      
      toast({
        title: 'Post Added!',
        description: 'Your post has been successfully added.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add post.',
      });
    } finally {
      setPostingState(false);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const postDoc = doc(db, 'communityPosts', postId);
      await deleteDoc(postDoc);
      
      dispatch({ type: 'DELETE_POST', payload: postId });
      
      toast({
        title: 'Post Deleted!',
        description: 'Your post has been successfully deleted.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete post.',
      });
    }
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Image must be less than 10MB.",
      });
      return;
    }
    
    try {
      // If the image is large, compress it before previewing
      if (file.size > 2 * 1024 * 1024) {  // Over 2MB
        toast({
          title: "Optimizing Image",
          description: "Large image detected, optimizing for better performance...",
        });
        
        // Compress the image and use the blob directly
        const optimizedBlob = await compressImage(file, 1200);
        
        // Store the original filename for reference
        const originalFilename = file.name;
        
        // Create an object with the properties we need
        const optimizedImage = {
          blob: optimizedBlob,
          name: originalFilename,
          type: 'image/jpeg',
          size: optimizedBlob.size
        };
        
        // Set the optimized image for upload
        setNewPostImage(optimizedImage as unknown as File);
        
        toast({
          title: "Image Optimized",
          description: `Reduced image size by ${Math.round((1 - (optimizedBlob.size / file.size)) * 100)}%. Ready to post!`,
        });
      } else {
        // Small image, use as-is
        setNewPostImage(file);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      // Fall back to original file if optimization fails
      setNewPostImage(file);
      toast({
        title: "Image Ready",
        description: "Your image is ready to upload.",
      });
    }
  };

  const handleCameraCapture = (url: string, publicId: string) => {
    // Set image preview for UI
    setImagePreview(url);
    
    // Fetch the image as a blob to store it properly
    fetch(url)
      .then(response => response.blob())
      .then(async blob => {
        // For consistency with handleImageChange, optimize large images
        let imageToUse;
        
        if (blob.size > 2 * 1024 * 1024) {  // Over 2MB
          toast({
            title: "Optimizing Image",
            description: "Large image detected, optimizing for better performance...",
          });
          
          // Compress the captured image
          const optimizedBlob = await compressImage(new File([blob], `${publicId}.jpg`, { type: 'image/jpeg' }), 1200);
          
          imageToUse = {
            blob: optimizedBlob,
            name: `${publicId}.jpg`,
            type: 'image/jpeg',
            size: optimizedBlob.size
          };
          
          toast({
            title: "Image Optimized",
            description: `Reduced image size by ${Math.round((1 - (optimizedBlob.size / blob.size)) * 100)}%. Ready to post!`,
          });
        } else {
          // Create a file-like object with the properties we need
          imageToUse = {
            blob: blob,
            name: `${publicId}.jpg`,
            type: 'image/jpeg',
            size: blob.size
          };
        }
        
        // Set the captured image for upload
        setNewPostImage(imageToUse as unknown as File);
        setShowCamera(false);
        
        toast({
          title: "Photo Captured",
          description: "Image has been captured successfully and is ready to post.",
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

  const likePost = async (postId: string) => {
    if (!user?.email) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to like a post.',
      });
      return;
    }

    const postDoc = doc(db, 'communityPosts', postId);
    try {
      await updateDoc(postDoc, {
        likes: arrayUnion(user.email),
      });
      
      dispatch({ 
        type: 'LIKE_POST', 
        payload: { postId, userEmail: user.email } 
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to like post.',
      });
    }
  };

  const unlikePost = async (postId: string) => {
    if (!user?.email) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to unlike a post.',
      });
      return;
    }

    const postDoc = doc(db, 'communityPosts', postId);
    try {
      await updateDoc(postDoc, {
        likes: arrayRemove(user.email),
      });
      
      dispatch({ 
        type: 'UNLIKE_POST', 
        payload: { postId, userEmail: user.email } 
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to unlike post.',
      });
    }
  };

  const addComment = async (postId: string) => {
    if (commentText.trim() === '') return;

    if (!user?.email) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to comment.',
      });
      return;
    }

    setCommentingState(true);
    try {
      const postDoc = doc(db, 'communityPosts', postId);
      const newComment = {
        text: commentText,
        userId: user.email,
        displayName: user.displayName || 'Anonymous',
        timestamp: serverTimestamp(),
      };
      
      await updateDoc(postDoc, {
        comments: arrayUnion(newComment),
      });

      const clientComment = {
                    text: commentText,
        userId: user.email,
        displayName: user.displayName || 'Anonymous',
                    timestamp: new Date(),
      };
      
      dispatch({ 
        type: 'ADD_COMMENT', 
        payload: { postId, comment: clientComment } 
      });

      setCommentText('');
      toast({
        title: 'Comment Added!',
        description: 'Your comment has been successfully added.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add comment.',
      });
    } finally {
      setCommentingState(false);
    }
  };

  // Optimize comment handling by using local state for active post
  const handleCommentChange = useCallback((text: string, postId: string) => {
    setCommentText(text);
    setActivePostId(postId);
  }, []);

  // Memoized post component to reduce re-renders
  const PostItem = React.memo(({ post, index }: { post: Post, index: number }) => {
    const isLastPost = index === postsState.posts.length - 1;
    const isUserOwner = user && user.email === post.userId;
    const hasUserLiked = user && user.email && post.likes.includes(user.email);
    const isActivePost = activePostId === post.id;
    
    // Set up ref for intersection observer
    const setPostRef = (el: HTMLLIElement | null) => {
      if (el) {
        postRefs.current[post.id] = el;
        // If this is the last post and we have an observer, observe it
        if (isLastPost && observerRef.current) {
          observerRef.current.observe(el);
        }
      }
    };
    
    return (
      <li 
        ref={setPostRef}
        key={post.id} 
        className="mb-8 border-b border-border/30 pb-4 last:border-b-0 last:mb-0 last:pb-0"
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold">{post.displayName || 'Anonymous'}</h3>
            <p className="text-xs text-muted-foreground">
              {formatTimestamp(post.timestamp)}
            </p>
          </div>
          {isUserOwner && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => deletePost(post.id)}
              aria-label="Delete post"
            >
              Delete
            </Button>
          )}
        </div>

        <p className="mb-4">{post.text}</p>

        {post.imageUrl && (
          <div className="relative h-64 w-full mb-4 rounded-lg overflow-hidden border border-border/30">
            <Suspense fallback={<div className="h-64 w-full bg-muted animate-pulse rounded-lg"></div>}>
              <LazyImage
                src={post.imageUrl}
                alt="Post image"
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZWVlZSIvPjwvc3ZnPg=="
                style={{ objectFit: 'cover' }}
              />
            </Suspense>
          </div>
        )}

        <div className="flex gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => user && user.email && (hasUserLiked ? unlikePost(post.id) : likePost(post.id))}
            disabled={!user}
            className="rounded-full"
          >
            <Heart
              className={`h-5 w-5 mr-1 ${hasUserLiked ? 'text-red-500 fill-red-500' : ''}`}
            />
            <span>{post.likes.length}</span>
          </Button>

          <Badge variant="outline" className="bg-primary/10 text-primary text-xs font-normal px-2 py-1">
            <MessageSquare className="h-4 w-4 mr-1" />
            {post.comments.length} comments
          </Badge>
        </div>

        {user && (
          <div className="flex mb-4">
            <Input
              placeholder="Add a comment..."
              value={isActivePost ? commentText : ''}
              onChange={(e) => handleCommentChange(e.target.value, post.id)}
              className="mr-2 focus:border-primary focus:ring-primary"
            />
            <Button 
              onClick={() => addComment(post.id)} 
              disabled={commentingState || !isActivePost || !commentText.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {commentingState && isActivePost ? <Icons.spinner className="h-4 w-4 animate-spin" /> : 'Add'}
            </Button>
          </div>
        )}

        {post.comments.length > 0 && (
          <div className="pl-4 border-l border-border/30">
            <h4 className="font-medium mb-2">Comments ({post.comments.length})</h4>
            <ul>
              {/* Only render the first 3 comments by default to save memory */}
              {post.comments.slice(0, isActivePost ? undefined : 3).map((comment: any, index: number) => (
                <li key={index} className="mb-2 pb-2 border-b border-border/30 last:border-0">
                  <div className="flex justify-between">
                    <span className="font-medium">{comment.displayName || 'Anonymous'}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(comment.timestamp)}
                    </span>
                  </div>
                  <p>{comment.text}</p>
                </li>
              ))}
              
              {!isActivePost && post.comments.length > 3 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setActivePostId(post.id)}
                  className="text-primary"
                >
                  Show {post.comments.length - 3} more comments
                </Button>
              )}
            </ul>
          </div>
        )}
      </li>
    );
  });

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      // Clear image cache when component unmounts
      imageCache.clear();
      
      // Clear observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      // Clear refs
      postRefs.current = {};
    };
  }, []);

  // Only render visible posts to reduce DOM size
  const visiblePosts = useMemo(() => {
    return postsState.posts.map((post, index) => (
      <PostItem key={post.id} post={post} index={index} />
    ));
  }, [postsState.posts, user?.email, activePostId, commentText, commentingState]);

  return (
    <div className="app-container min-h-screen bg-background pb-20">
      {/* Header - Updated to match Plant Identification page */}
      <header className="app-header">
        <div className="flex items-center">
          <MessageSquare className="h-7 w-7 text-primary mr-2" />
          <h1 className="text-2xl font-bold text-primary">Plant Community</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/10 text-primary text-xs font-normal px-2 py-1">
            Community
          </Badge>
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Button>
        </div>
      </header>

      <section className="mb-6">
        <p className="text-muted-foreground text-sm">
          Connect with fellow plant enthusiasts and share your plant journey.
        </p>
      </section>

      <section className="space-y-4 mb-4">
        {user ? (
          <Card className="border border-border/30 shadow-sm overflow-hidden mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-primary flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> Create Post
              </CardTitle>
              <CardDescription>
                Share your plant journey with the community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea
                placeholder="Share your plant journey..."
                  value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                className="min-h-[100px] focus:border-primary focus:ring-primary"
                />
              
              {showCamera ? (
                <div className="space-y-3">
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
                      folder="community-posts"
                    />
                  </div>
                
                  <div className="text-xs text-muted-foreground bg-amber-50 p-2 rounded-md">
                    <AlertTriangle className="h-3 w-3 inline-block mr-1" />
                    Camera access is required. Please allow permission when prompted.
                  </div>
                </div>
              ) : imagePreview ? (
                <div className="space-y-3">
                  <div className="relative h-40 rounded-lg overflow-hidden border border-border/30">
                    <LazyImage
                      src={imagePreview}
                      alt="Post preview"
                      fill
                      sizes="(max-width: 768px) 100vw, 500px"
                      priority
                      style={{ objectFit: 'cover' }}
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full"
                      onClick={() => {
                        setNewPostImage(null);
                        setImagePreview(null);
                      }}
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCamera(true)}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Take New Photo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                        className="cursor-pointer opacity-0 absolute inset-0 w-full h-full"
                        id="file-upload"
                        aria-label="Upload image"
                />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </Button>
              </div>
                    
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
                  
                  <p className="text-xs text-muted-foreground">Upload or capture an image (optional)</p>
                </div>
              )}
              
              <Button
                onClick={addPost}
                disabled={postingState || newPostText.trim() === ''}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {postingState ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post'
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-border/30 shadow-sm overflow-hidden mb-8">
            <CardContent className="p-6 text-center">
              <p className="mb-4">Sign in to join the discussion and share your plant journey!</p>
              <Button onClick={() => router.push('/login')} className="bg-primary hover:bg-primary/90">Sign In</Button>
            </CardContent>
          </Card>
        )}

        {postsState.posts.length > 0 ? (
          <Card className="border border-border/30 shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-primary flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> Community Posts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-6">
                {visiblePosts}
              </ul>
              
              {postsState.loading && (
                <div className="flex justify-center my-6">
                  <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-border/30 shadow-sm overflow-hidden p-8 text-center">
            <CardContent className="flex flex-col items-center">
              {postsState.loading ? (
                <Icons.spinner className="h-8 w-8 animate-spin text-primary mb-4" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
              )}
              <p className="text-muted-foreground">
                {postsState.loading ? "Loading posts..." : "No posts yet. Be the first to share!"}
              </p>
            </CardContent>
          </Card>
      )}
      </section>
      
      {/* Bottom Navigation */}
      <BottomNavbar />
    </div>
  );
}
