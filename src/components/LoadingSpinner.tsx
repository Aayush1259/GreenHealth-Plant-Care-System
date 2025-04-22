import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {}

export const LoadingSpinner = (props: LoadingSpinnerProps) => {
  return (
    <div className="flex justify-center items-center" {...props}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
};

export function LoadingSpinnerOld({ className, ...props }: LoadingSpinnerProps) {
  return (
    <div
      className={cn("animate-spin h-4 w-4", className)}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </div>
  );
} 