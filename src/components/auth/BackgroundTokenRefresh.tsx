"use client"
import { useEffect } from 'react';
import { useBackgroundTokenRefresh, usePrefetchDjombiData } from '@/lib/hooks/useDjombiApi';
import { useDjombiAuth } from '@/components/providers/DjombiAuthProvider';

/**
 * Background Token Refresh Component
 * Handles automatic token refresh and data prefetching
 */
export default function BackgroundTokenRefresh() {
  const { isDjombiAuthenticated, isInitialized } = useDjombiAuth();
  const { prefetchProfile, prefetchApiData } = usePrefetchDjombiData();
  
  // Background token refresh
  useBackgroundTokenRefresh();

  // Prefetch critical data when authenticated
  useEffect(() => {
    if (isDjombiAuthenticated && isInitialized) {
      // Prefetch user profile
      prefetchProfile();
      
      // Prefetch other common API endpoints
      // Add your commonly used endpoints here
      // prefetchApiData('/organizations');
      // prefetchApiData('/settings');
    }
  }, [isDjombiAuthenticated, isInitialized, prefetchProfile, prefetchApiData]);

  // This component doesn't render anything
  return null;
}