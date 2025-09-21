import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
  overlay?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6', 
  lg: 'h-8 w-8'
};

export default function LoadingSpinner({ 
  size = 'md', 
  className, 
  text,
  overlay = false
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn(
      'flex items-center justify-center',
      overlay && 'absolute inset-0 bg-background/80 backdrop-blur-sm z-50',
      className
    )}>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className={cn(
          'animate-spin text-primary',
          sizeClasses[size]
        )} />
        {text && (
          <p className="text-sm text-muted-foreground animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div className="relative">
        {spinner}
      </div>
    );
  }

  return spinner;
}
