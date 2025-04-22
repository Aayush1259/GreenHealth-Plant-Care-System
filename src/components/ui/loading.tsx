import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  /** Size of the loading indicator */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Variant of the loading indicator */
  variant?: "default" | "primary" | "secondary" | "ghost";
  /** Text to display alongside the loading indicator */
  text?: string;
  /** Whether to center the loading indicator */
  centered?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Loading indicator component
 */
export function Loading({
  size = "md",
  variant = "default",
  text,
  centered = false,
  className,
}: LoadingProps) {
  // Size mappings
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-10 w-10",
  };

  // Variant mappings
  const variantClasses = {
    default: "text-muted-foreground",
    primary: "text-primary",
    secondary: "text-secondary",
    ghost: "text-gray-400",
  };

  // Container classes
  const containerClasses = cn(
    "flex items-center gap-2",
    centered && "justify-center",
    className
  );

  return (
    <div className={containerClasses}>
      <Loader2
        className={cn(
          "animate-spin",
          sizeClasses[size],
          variantClasses[variant]
        )}
        aria-hidden="true"
      />
      {text && (
        <span
          className={cn(
            "text-sm font-medium",
            variantClasses[variant]
          )}
        >
          {text}
        </span>
      )}
      <span className="sr-only">Loading</span>
    </div>
  );
}

/**
 * Full page loading overlay
 */
export function LoadingOverlay({
  message = "Loading...",
  variant = "primary",
  transparent = false,
}: {
  message?: string;
  variant?: "default" | "primary" | "secondary" | "ghost";
  transparent?: boolean;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center",
        transparent ? "bg-background/80" : "bg-background"
      )}
    >
      <Loading size="lg" variant={variant} text={message} />
    </div>
  );
}

/**
 * Loading spinner for buttons or small containers
 */
export function LoadingSpinner({
  size = "sm",
  className,
}: {
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
  };

  return (
    <Loader2
      className={cn("animate-spin", sizeClasses[size], className)}
      aria-hidden="true"
    />
  );
}

/**
 * Loading placeholder for content that's still loading
 */
export function LoadingPlaceholder({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-4 w-full animate-pulse rounded bg-muted"
          style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
        />
      ))}
    </div>
  );
} 