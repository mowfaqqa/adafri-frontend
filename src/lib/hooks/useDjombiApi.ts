import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { DjombiProfileService, DjombiUser, DjombiServiceResult } from '@/lib/services/DjombiProfileService';
import { useDjombiAuth } from '@/components/providers/DjombiAuthProvider';

// Query Keys Factory
export const djombiQueryKeys = {
  all: ['djombi'] as const,
  auth: () => [...djombiQueryKeys.all, 'auth'] as const,
  profile: () => [...djombiQueryKeys.all, 'profile'] as const,
  tokens: () => [...djombiQueryKeys.all, 'tokens'] as const,
  userProfile: (userId?: string) => [...djombiQueryKeys.profile(), userId] as const,
  // Add more specific query keys as needed
  organizations: () => [...djombiQueryKeys.all, 'organizations'] as const,
  settings: () => [...djombiQueryKeys.all, 'settings'] as const,
} as const;

// Custom hook for user profile with React Query
export const useDjombiProfile = (
  options?: Omit<UseQueryOptions<DjombiUser, Error>, 'queryKey' | 'queryFn'>
) => {
  const { isDjombiAuthenticated } = useDjombiAuth();

  return useQuery({
    queryKey: djombiQueryKeys.userProfile(),
    queryFn: () => {
      const profile = DjombiProfileService.getStoredUserProfile();
      if (!profile) {
        throw new Error('No profile data available');
      }
      return profile;
    },
    enabled: isDjombiAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Custom hook for making authenticated API calls with React Query
export const useDjombiQuery = <TData = any>(
  endpoint: string,
  options?: Omit<UseQueryOptions<TData, Error>, 'queryKey' | 'queryFn'> & {
    queryKey?: readonly unknown[];
  }
) => {
  const { isDjombiAuthenticated, makeAuthenticatedCall } = useDjombiAuth();

  const queryKey = options?.queryKey || ['djombi-api', endpoint];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const result = await makeAuthenticatedCall<TData>(endpoint);
      if (!result.success) {
        throw new Error(result.error || 'API call failed');
      }
      return result.data!;
    },
    enabled: isDjombiAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes('Not authenticated')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
};

// Custom hook for authenticated mutations
export const useDjombiMutation = <TData = any, TVariables = any>(
  endpoint: string,
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'> & {
    method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    invalidateQueries?: readonly unknown[][];
    updateCache?: (data: TData, variables: TVariables) => void;
  }
) => {
  const { makeAuthenticatedCall } = useDjombiAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const requestOptions: RequestInit = {
        method: options?.method || 'POST',
        body: JSON.stringify(variables),
      };

      const result = await makeAuthenticatedCall<TData>(endpoint, requestOptions);
      if (!result.success) {
        throw new Error(result.error || 'Mutation failed');
      }
      return result.data!;
    },
    onSuccess: (data, variables) => {
      // Invalidate specified queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      // Update cache if function provided
      if (options?.updateCache) {
        options.updateCache(data, variables);
      }

      // Call original onSuccess if provided
      options?.onSuccess?.(data, variables, undefined);
    },
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes('Not authenticated')) {
        return false;
      }
      return failureCount < 2;
    },
    ...options,
  });
};

// Hook for background token refresh
export const useBackgroundTokenRefresh = () => {
  const { isDjombiAuthenticated } = useDjombiAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['background-refresh'],
    queryFn: async () => {
      if (DjombiProfileService.shouldRefreshToken()) {
        await DjombiProfileService.backgroundRefresh();
        // Invalidate auth-related queries after refresh
        queryClient.invalidateQueries({ queryKey: djombiQueryKeys.auth() });
        queryClient.invalidateQueries({ queryKey: djombiQueryKeys.tokens() });
      }
      return true;
    },
    enabled: isDjombiAuthenticated,
    refetchInterval: 2 * 60 * 1000, // Check every 2 minutes
    refetchIntervalInBackground: true,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
  });
};

// Hook for prefetching common data
export const usePrefetchDjombiData = () => {
  const queryClient = useQueryClient();
  const { isDjombiAuthenticated } = useDjombiAuth();

  const prefetchProfile = () => {
    if (!isDjombiAuthenticated) return;

    queryClient.prefetchQuery({
      queryKey: djombiQueryKeys.userProfile(),
      queryFn: () => {
        const profile = DjombiProfileService.getStoredUserProfile();
        if (!profile) throw new Error('No profile data');
        return profile;
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchApiData = (endpoint: string, queryKey?: readonly unknown[]) => {
    if (!isDjombiAuthenticated) return;

    const key = queryKey || ['djombi-api', endpoint];
    
    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: async () => {
        const result = await DjombiProfileService.makeAuthenticatedRequest(endpoint);
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
      staleTime: 2 * 60 * 1000,
    });
  };

  return {
    prefetchProfile,
    prefetchApiData,
  };
};

// Hook for optimistic updates
export const useOptimisticDjombiUpdate = <TData = any>(
  queryKey: readonly unknown[],
  updateFn: (oldData: TData | undefined, variables: any) => TData
) => {
  const queryClient = useQueryClient();

  const optimisticUpdate = (variables: any) => {
    queryClient.setQueryData(queryKey, (oldData: TData | undefined) =>
      updateFn(oldData, variables)
    );
  };

  const revertUpdate = (previousData: TData | undefined) => {
    queryClient.setQueryData(queryKey, previousData);
  };

  return {
    optimisticUpdate,
    revertUpdate,
  };
};

// Hook for real-time data synchronization
export const useDjombiRealTimeSync = (
  endpoint: string,
  queryKey: readonly unknown[],
  options?: {
    interval?: number;
    enabled?: boolean;
  }
) => {
  const { isDjombiAuthenticated } = useDjombiAuth();

  return useQuery({
    queryKey: [...queryKey, 'realtime'],
    queryFn: async () => {
      const result = await DjombiProfileService.makeAuthenticatedRequest(endpoint);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: isDjombiAuthenticated && (options?.enabled ?? true),
    refetchInterval: options?.interval || 30000, // 30 seconds default
    refetchIntervalInBackground: true,
    staleTime: 0, // Always consider stale for real-time data
    gcTime: 1000, // Short cache time for real-time data
  });
};

// Enhanced mutation hook with optimistic updates
export const useOptimisticDjombiMutation = <TData = any, TVariables = any>(
  endpoint: string,
  queryKey: readonly unknown[],
  options?: {
    method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    optimisticUpdateFn?: (oldData: TData | undefined, variables: TVariables) => TData;
    invalidateQueries?: readonly unknown[][];
  }
) => {
  const queryClient = useQueryClient();
  const { makeAuthenticatedCall } = useDjombiAuth();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const requestOptions: RequestInit = {
        method: options?.method || 'POST',
        body: JSON.stringify(variables),
      };

      const result = await makeAuthenticatedCall<TData>(endpoint, requestOptions);
      if (!result.success) {
        throw new Error(result.error || 'Mutation failed');
      }
      return result.data!;
    },
    onMutate: async (variables: TVariables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TData>(queryKey);

      // Optimistically update
      if (options?.optimisticUpdateFn && previousData !== undefined) {
        queryClient.setQueryData(queryKey, options.optimisticUpdateFn(previousData, variables));
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey });
      
      // Invalidate additional queries if specified
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
    },
  });
};

// Utility hook for cache management
export const useDjombiCacheUtils = () => {
  const queryClient = useQueryClient();

  const clearAllDjombiCache = () => {
    queryClient.removeQueries({ queryKey: djombiQueryKeys.all });
    DjombiProfileService.clearMemoryCache();
  };

  const refreshAllDjombiData = () => {
    queryClient.invalidateQueries({ queryKey: djombiQueryKeys.all });
  };

  const getCacheStats = () => {
    return DjombiProfileService.getCacheStats();
  };

  const preloadData = async () => {
    await DjombiProfileService.preloadUserData();
  };

  return {
    clearAllDjombiCache,
    refreshAllDjombiData,
    getCacheStats,
    preloadData,
  };
};