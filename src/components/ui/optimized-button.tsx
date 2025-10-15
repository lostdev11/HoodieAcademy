import * as React from "react"
import { Button, ButtonProps } from "./button"
import { Loader2 } from "lucide-react"

export interface OptimizedButtonProps extends ButtonProps {
  /**
   * Whether the button is in a loading state
   */
  isLoading?: boolean
  
  /**
   * Debounce delay in milliseconds (default: 300ms)
   */
  debounceMs?: number
  
  /**
   * Custom loading text
   */
  loadingText?: string
  
  /**
   * Whether to show a spinner icon when loading
   */
  showSpinner?: boolean
}

/**
 * Optimized Button component with built-in debouncing and loading states
 * 
 * Features:
 * - Automatic debouncing of click events
 * - Loading state management
 * - Disabled state during loading
 * - Instant visual feedback
 * 
 * @example
 * <OptimizedButton
 *   onClick={async () => await saveData()}
 *   isLoading={isSaving}
 *   loadingText="Saving..."
 * >
 *   Save
 * </OptimizedButton>
 */
const OptimizedButton = React.forwardRef<HTMLButtonElement, OptimizedButtonProps>(
  ({ 
    children, 
    onClick, 
    isLoading = false, 
    disabled = false,
    debounceMs = 300,
    loadingText,
    showSpinner = true,
    className,
    ...props 
  }, ref) => {
    const [isProcessing, setIsProcessing] = React.useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const lastClickRef = React.useRef<number>(0);

    // Cleanup timeout on unmount
    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        // Prevent click if already processing or loading
        if (isProcessing || isLoading || disabled) {
          event.preventDefault();
          return;
        }

        const now = Date.now();
        const timeSinceLastClick = now - lastClickRef.current;

        // Debounce: ignore clicks that happen too quickly
        if (timeSinceLastClick < debounceMs) {
          event.preventDefault();
          return;
        }

        lastClickRef.current = now;

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set processing state for instant feedback
        setIsProcessing(true);

        // Execute the click handler
        if (onClick) {
          const result = onClick(event);

          // If onClick returns a promise, wait for it
          if (result instanceof Promise) {
            result
              .finally(() => {
                // Keep processing state for minimum duration for better UX
                timeoutRef.current = setTimeout(() => {
                  setIsProcessing(false);
                }, 150);
              });
          } else {
            // For sync operations, reset after debounce period
            timeoutRef.current = setTimeout(() => {
              setIsProcessing(false);
            }, debounceMs);
          }
        } else {
          setIsProcessing(false);
        }
      },
      [onClick, isProcessing, isLoading, disabled, debounceMs]
    );

    const isButtonDisabled = disabled || isLoading || isProcessing;
    const showLoadingState = isLoading || isProcessing;

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        disabled={isButtonDisabled}
        className={className}
        {...props}
      >
        {showLoadingState ? (
          <>
            {showSpinner && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);

OptimizedButton.displayName = "OptimizedButton";

export { OptimizedButton };

