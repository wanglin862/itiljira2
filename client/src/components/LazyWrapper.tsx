import React, { Suspense, ComponentType } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  loadingText?: string;
}

// HOC for lazy loading components
export function withLazyLoading<T extends {}>(
  Component: ComponentType<T>,
  loadingText?: string
) {
  const LazyComponent = (props: T) => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner text={loadingText} size="lg" />}>
        <Component {...props} />
      </Suspense>
    </ErrorBoundary>
  );

  LazyComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;
  return LazyComponent;
}

// Generic lazy wrapper component
export default function LazyWrapper({ 
  children, 
  fallback, 
  errorFallback,
  loadingText = "Loading..."
}: LazyWrapperProps) {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback || <LoadingSpinner text={loadingText} size="lg" />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
