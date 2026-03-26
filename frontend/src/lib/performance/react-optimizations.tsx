import React, { memo, useMemo, useCallback, lazy, Suspense } from 'react';
import dynamic from 'next/dynamic';

/**
 * React Performance Optimizations
 * تحسينات أداء React للمنصة
 */

// ============== 1. Memoization Helpers ==============

/**
 * HOC لتحسين أداء المكونات
 */
export function withMemo<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return memo(Component, propsAreEqual);
}

/**
 * Custom hook لـ memoized values
 */
export function useDeepMemo<T>(factory: () => T, deps: React.DependencyList): T {
  const ref = React.useRef<{ value: T; deps: React.DependencyList }>();

  if (!ref.current || !areArraysEqual(deps, ref.current.deps)) {
    ref.current = { value: factory(), deps };
  }

  return ref.current.value;
}

// ============== 2. Lazy Loading Components ==============

// Lazy load heavy components
export const LazyVideoPlayer = lazy(() => import('@/components/VideoPlayer'));
export const LazyChat = lazy(() => import('@/components/CourseChat'));
export const LazyDashboard = lazy(() => import('@/app/teacher/dashboard/page'));
export const LazyAdminPanel = lazy(() => import('@/app/admin/panel/page'));

/**
 * Loading Component for Suspense
 */
export const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
  </div>
);

/**
 * Wrapper for lazy loaded components
 */
export function LazyComponent({ 
  component: Component, 
  fallback = <LoadingFallback />,
  ...props 
}: any) {
  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
}

// ============== 3. Image Optimization ==============

/**
 * Optimized Image Component
 */
export const OptimizedImage = memo(({ 
  src, 
  alt, 
  width, 
  height, 
  priority = false,
  loading = 'lazy' as const,
  ...props 
}: any) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  return (
    <div className="relative" style={{ width, height }}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : loading}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-gray-400">⚠️</span>
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// ============== 4. Virtual Scrolling ==============

/**
 * Virtual List Component for large lists
 */
export function VirtualList<T>({ 
  items, 
  itemHeight, 
  containerHeight, 
  renderItem,
  overscan = 3 
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1, 
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;
  
  return (
    <div 
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============== 5. Debounce & Throttle ==============

/**
 * Debounce hook
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
  
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Throttle hook
 */
export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastUpdated = React.useRef<number>(Date.now());
  
  React.useEffect(() => {
    const now = Date.now();
    
    if (now >= lastUpdated.current + interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, interval);
      
      return () => clearTimeout(timer);
    }
  }, [value, interval]);
  
  return throttledValue;
}

// ============== 6. Code Splitting Helpers ==============

/**
 * Dynamic import with loading state
 */
export function useDynamicImport<T = any>(
  importFunc: () => Promise<{ default: T }>
): [T | null, boolean, Error | null] {
  const [component, setComponent] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  
  React.useEffect(() => {
    setLoading(true);
    importFunc()
      .then(module => {
        setComponent(() => module.default);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);
  
  return [component, loading, error];
}

// ============== 7. Intersection Observer ==============

/**
 * Hook for lazy loading on scroll
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  
  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, [ref, options]);
  
  return isIntersecting;
}

// Helper function
function areArraysEqual(a: React.DependencyList, b: React.DependencyList): boolean {
  if (a.length !== b.length) return false;
  
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  
  return true;
}

// ============== 8. Web Workers Support ==============

/**
 * Hook for using Web Workers
 */
export function useWebWorker<T, R>(
  workerFunction: (data: T) => R
): [(data: T) => Promise<R>, boolean] {
  const [loading, setLoading] = React.useState(false);
  const workerRef = React.useRef<Worker>();
  
  React.useEffect(() => {
    // Create worker blob
    const blob = new Blob([`
      self.onmessage = function(e) {
        const result = (${workerFunction.toString()})(e.data);
        self.postMessage(result);
      }
    `], { type: 'application/javascript' });
    
    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);
    
    return () => {
      workerRef.current?.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  }, []);
  
  const runWorker = useCallback((data: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }
      
      setLoading(true);
      
      workerRef.current.onmessage = (e) => {
        resolve(e.data);
        setLoading(false);
      };
      
      workerRef.current.onerror = (error) => {
        reject(error);
        setLoading(false);
      };
      
      workerRef.current.postMessage(data);
    });
  }, []);
  
  return [runWorker, loading];
}

export default {
  withMemo,
  useDeepMemo,
  LazyComponent,
  OptimizedImage,
  VirtualList,
  useDebounce,
  useThrottle,
  useDynamicImport,
  useIntersectionObserver,
  useWebWorker
};
