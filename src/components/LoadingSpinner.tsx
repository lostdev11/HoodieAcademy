"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
  onCancel?: () => void;
  showCancelButton?: boolean;
}

export default function LoadingSpinner({ 
  message = "Loading...", 
  className = "",
  onCancel,
  showCancelButton = false
}: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center min-h-[200px] ${className}`}>
      <Card className="bg-slate-800/50 border-cyan-500/30">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-cyan-400 mb-2">{message}</p>
            <p className="text-gray-400 text-sm">This may take a few moments</p>
            {showCancelButton && onCancel && (
              <div className="mt-4">
                <Button 
                  onClick={onCancel}
                  variant="outline" 
                  size="sm"
                  className="text-gray-400 hover:text-gray-300"
                >
                  Cancel Loading
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
