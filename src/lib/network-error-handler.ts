/**
 * Enhanced Network Error Handler
 * This module provides comprehensive error handling for API calls with better user feedback and debugging.
 */

import { toast } from "@/hooks/use-toast";

// Define specific error types
export type NetworkErrorType = 
  | 'connection'   // Network connection issues
  | 'timeout'      // Request timeout
  | 'server'       // Server errors (500 range)
  | 'client'       // Client errors (400 range)
  | 'auth'         // Authentication errors (401, 403)
  | 'notFound'     // Resource not found (404)
  | 'rate'         // Rate limiting (429)
  | 'unknown';     // Unidentified errors

export interface NetworkErrorDetails {
  type: NetworkErrorType;
  status?: number;
  message: string;
  originalError?: any;
  endpoint?: string;
  retryable: boolean;
}

/**
 * Parses an error into a standardized NetworkErrorDetails object
 */
export const parseNetworkError = (error: any, endpoint?: string): NetworkErrorDetails => {
  // Default error details
  const details: NetworkErrorDetails = {
    type: 'unknown',
    message: 'An unknown error occurred',
    retryable: false,
    endpoint
  };

  // Handle fetch API errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    details.type = 'connection';
    details.message = 'Unable to connect to the server. Please check your internet connection.';
    details.retryable = true;
  }
  // Handle timeout errors
  else if (error.name === 'AbortError' || (error.message && error.message.includes('timeout'))) {
    details.type = 'timeout';
    details.message = 'Request timed out. Please try again.';
    details.retryable = true;
  }
  // Handle HTTP errors
  else if (error.status || error.statusCode) {
    const status = error.status || error.statusCode;
    details.status = status;

    if (status === 401 || status === 403) {
      details.type = 'auth';
      details.message = status === 401 
        ? 'Your session has expired. Please log in again.' 
        : 'You don\'t have permission to perform this action.';
      details.retryable = status === 401; // 401 can be retried after re-auth, 403 typically not
    }
    else if (status === 404) {
      details.type = 'notFound';
      details.message = 'The requested resource was not found.';
      details.retryable = false;
    }
    else if (status === 429) {
      details.type = 'rate';
      details.message = 'Rate limit exceeded. Please try again later.';
      details.retryable = true;
    }
    else if (status >= 500) {
      details.type = 'server';
      details.message = 'The server encountered an error. Please try again later.';
      details.retryable = true;
    }
    else if (status >= 400) {
      details.type = 'client';
      details.message = error.message || 'Invalid request. Please check your input and try again.';
      details.retryable = false;
    }
  }

  // Store the original error for debugging
  details.originalError = error;

  return details;
};

/**
 * Main error handler function that processes errors and provides appropriate feedback
 */
export const handleNetworkError = (
  error: any, 
  endpoint?: string, 
  options?: {
    silent?: boolean;
    fallbackAction?: () => void;
    retryAction?: () => Promise<any>;
  }
): NetworkErrorDetails => {
  const errorDetails = parseNetworkError(error, endpoint);
  
  // Log the error for debugging
  console.error(`API Error (${errorDetails.type})`, {
    endpoint,
    status: errorDetails.status,
    message: errorDetails.message,
    error: errorDetails.originalError
  });
  
  // Show toast notification unless silent mode is requested
  if (!options?.silent) {
    toast({
      variant: 'destructive',
      title: getErrorTitle(errorDetails.type),
      description: errorDetails.message,
      action: errorDetails.retryable && options?.retryAction ? {
        label: 'Retry',
        onClick: () => options.retryAction?.()
      } : undefined
    });
  }
  
  // Execute fallback action if provided
  if (options?.fallbackAction) {
    options.fallbackAction();
  }
  
  // Return detailed error info for further handling if needed
  return errorDetails;
};

/**
 * Get a user-friendly error title based on error type
 */
const getErrorTitle = (type: NetworkErrorType): string => {
  switch (type) {
    case 'connection':
      return 'Connection Error';
    case 'timeout':
      return 'Request Timeout';
    case 'server':
      return 'Server Error';
    case 'client':
      return 'Request Error';
    case 'auth':
      return 'Authentication Error';
    case 'notFound':
      return 'Not Found';
    case 'rate':
      return 'Rate Limit Exceeded';
    default:
      return 'Error';
  }
};

/**
 * Wraps an API call with proper error handling
 */
export const withErrorHandling = async <T>(
  apiCall: () => Promise<T>,
  endpoint?: string,
  options?: {
    silent?: boolean;
    fallbackAction?: () => void;
    fallbackValue?: T;
    retryAction?: () => Promise<T>;
  }
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    handleNetworkError(error, endpoint, options);
    
    // Return fallback value if provided
    if (options?.fallbackValue !== undefined) {
      return options.fallbackValue;
    }
    
    // Re-throw the error for further handling
    throw error;
  }
}; 