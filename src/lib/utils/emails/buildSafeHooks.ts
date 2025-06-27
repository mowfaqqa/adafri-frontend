/**
 * Build-safe utility functions to prevent Next.js build errors
 * These functions handle SSR/SSG compatibility issues
 */

import { useEffect, useState, useCallback } from 'react';

/**
 * Safe localStorage access that works during SSR/build
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`Error reading from localStorage key "${key}":`, error);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Error writing to localStorage key "${key}":`, error);
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Error removing from localStorage key "${key}":`, error);
      return false;
    }
  }
};

/**
 * Hook to safely check if we're in the browser (hydrated)
 * This prevents hydration mismatch errors
 */
export const useIsClient = (): boolean => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
};

/**
 * Hook for safe localStorage access with SSR support
 */
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] => {
  const isClient = useIsClient();
  
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isClient) {
      return initialValue;
    }
    
    try {
      const item = safeLocalStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error parsing localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (isClient) {
        safeLocalStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};

/**
 * Build-safe function to get authentication data
 */
export const getBuildSafeAuthData = () => {
  if (typeof window === 'undefined') {
    return {
      djombiToken: null,
      linkedEmailId: null,
      userProfile: null
    };
  }

  return {
    djombiToken: safeLocalStorage.getItem('djombi_access_token'),
    linkedEmailId: safeLocalStorage.getItem('linkedEmailId'),
    userProfile: (() => {
      try {
        const profile = safeLocalStorage.getItem('djombi_user_profile');
        return profile ? JSON.parse(profile) : null;
      } catch {
        return null;
      }
    })()
  };
};

/**
 * Safe fetch wrapper that handles build-time issues
 */
export const safeFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response | null> => {
  if (typeof window === 'undefined') {
    console.warn('Fetch called during SSR, skipping...');
    return null;
  }

  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.error('Safe fetch error:', error);
    return null;
  }
};

/**
 * Hook that safely handles async operations during build
 * Usage: const { data, loading, error } = useSafeAsync(useCallback(() => fetchData(), [dependency1, dependency2]));
 */
export const useSafeAsync = <T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList = []
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
} => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isClient = useIsClient();

  // Memoize the async function to prevent unnecessary re-renders
  const memoizedAsyncFn = useCallback(asyncFn, deps);

  useEffect(() => {
    if (!isClient) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    memoizedAsyncFn()
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isClient, memoizedAsyncFn]);

  return { data, loading, error };
};

/**
 * Debounced hook to prevent excessive API calls
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for handling component mounting state
 */
export const useMounted = (): boolean => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return mounted;
};