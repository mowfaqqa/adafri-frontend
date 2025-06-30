"use client"
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DjombiProfileService } from '@/lib/services/DjombiProfileService';

interface DjombiUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  logo: string | null;
  otp: string | null;
  otp_expire: string | null;
  is_active: boolean;
  twoFactorSecret: string;
  twoFactorEnabled: boolean;
  logged_in: number;
  is_verified: boolean;
  createdAt: string;
  updatedAt: string;
  organization: any | null;
}

interface DjombiAuthState {
  // Authentication status
  isInitialized: boolean;
  isDjombiAuthenticated: boolean;
  isLoading: boolean;
  
  // User data
  djombiUser: DjombiUser | null;
  djombiToken: string | null;
  refreshToken: string | null;
  
  // Methods
  initializeDjombi: (adafriToken: string) => Promise<boolean>;
  refreshDjombiAuth: () => Promise<boolean>;
  clearDjombiAuth: () => void;
  makeAuthenticatedCall: <T = any>(endpoint: string, options?: RequestInit) => Promise<{ success: boolean; data?: T; error?: string }>;
  
  // Error state
  error: string | null;
}

// React Query Keys
const QUERY_KEYS = {
  DJOMBI_AUTH: ['djombi', 'auth'] as const,
  DJOMBI_PROFILE: ['djombi', 'profile'] as const,
  DJOMBI_TOKENS: ['djombi', 'tokens'] as const,
} as const;

const DjombiAuthContext = createContext<DjombiAuthState | null>(null);

interface DjombiAuthProviderProps {
  children: ReactNode;
}

export const DjombiAuthProvider = ({ children }: DjombiAuthProviderProps) => {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized functions to check stored auth state
  const getStoredAuthState = useCallback(() => {
    if (typeof window === 'undefined') {
      return {
        isAuthenticated: false,
        profile: null,
        tokens: { accessToken: null, refreshToken: null }
      };
    }

    const isAuthenticated = DjombiProfileService.isDjombiAuthenticated();
    const profile = DjombiProfileService.getStoredUserProfile();
    const tokens = DjombiProfileService.getStoredDjombiTokens();

    return { isAuthenticated, profile, tokens };
  }, []);

  // React Query for Djombi authentication state
  const {
    data: authState,
    isLoading: authLoading,
    error: authError,
    refetch: refetchAuth
  } = useQuery({
    queryKey: QUERY_KEYS.DJOMBI_AUTH,
    queryFn: getStoredAuthState,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: isInitialized, // Only run when initialized
  });

  // Auto-initialize mutation
  const initializeMutation = useMutation({
    mutationFn: async (adafriToken: string) => {
      const result = await DjombiProfileService.initializeDjombiAuth(adafriToken);
      if (!result.success) {
        throw new Error(result.error || 'Failed to initialize Djombi authentication');
      }
      return result;
    },
    onSuccess: (data) => {
      // Update all related queries
      queryClient.setQueryData(QUERY_KEYS.DJOMBI_AUTH, {
        isAuthenticated: true,
        profile: data.profile,
        tokens: {
          accessToken: data.tokens?.accessTokenDjombi,
          refreshToken: data.tokens?.refreshTokenDjombi
        }
      });

      queryClient.setQueryData(QUERY_KEYS.DJOMBI_PROFILE, data.profile);
      queryClient.setQueryData(QUERY_KEYS.DJOMBI_TOKENS, data.tokens);
      
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
      console.error('Djombi initialization error:', error);
    }
  });

  // Refresh token mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const result = await DjombiProfileService.refreshDjombiToken();
      if (!result.success) {
        throw new Error(result.error || 'Failed to refresh authentication');
      }
      return result;
    },
    onSuccess: (data) => {
      // Update queries with fresh data
      queryClient.setQueryData(QUERY_KEYS.DJOMBI_AUTH, {
        isAuthenticated: true,
        profile: data.profile,
        tokens: {
          accessToken: data.tokens?.accessTokenDjombi,
          refreshToken: data.tokens?.refreshTokenDjombi
        }
      });

      queryClient.setQueryData(QUERY_KEYS.DJOMBI_PROFILE, data.profile);
      queryClient.setQueryData(QUERY_KEYS.DJOMBI_TOKENS, data.tokens);
      
      setError(null);
    },
    onError: (error: Error) => {
      // Clear auth on refresh failure
      clearDjombiAuth();
      setError(error.message);
      console.error('Djombi refresh error:', error);
    }
  });

  // Initialize from localStorage on mount
  useEffect(() => {
    const initializeFromStorage = () => {
      try {
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        console.error('Error initializing Djombi auth from storage:', err);
        setError('Failed to initialize authentication');
        setIsInitialized(true); // Still mark as initialized to prevent infinite loading
      }
    };

    if (typeof window !== 'undefined') {
      initializeFromStorage();
    } else {
      setIsInitialized(true);
    }
  }, []);

  // Auto-initialize Djombi when Adafri token is available
  useEffect(() => {
    const checkAndInitializeDjombi = async () => {
      if (typeof window === 'undefined' || !isInitialized || authState?.isAuthenticated) {
        return;
      }

      try {
        const adafriTokenData = localStorage.getItem('access_token');
        if (adafriTokenData) {
          const parsedToken = JSON.parse(adafriTokenData);
          if (parsedToken.access_token && !initializeMutation.isPending) {
            initializeMutation.mutate(parsedToken.access_token);
          }
        }
      } catch (err) {
        console.error('Auto-initialization failed:', err);
      }
    };

    checkAndInitializeDjombi();
  }, [isInitialized, authState?.isAuthenticated, initializeMutation]);

  // Memoized methods
  const initializeDjombi = useCallback(async (adafriToken: string): Promise<boolean> => {
    try {
      setError(null);
      await initializeMutation.mutateAsync(adafriToken);
      return true;
    } catch (error) {
      return false;
    }
  }, [initializeMutation]);

  const refreshDjombiAuth = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      await refreshMutation.mutateAsync();
      return true;
    } catch (error) {
      return false;
    }
  }, [refreshMutation]);

  const clearDjombiAuth = useCallback(() => {
    DjombiProfileService.clearDjombiAuth();
    
    // Clear all related queries
    queryClient.removeQueries({ queryKey: QUERY_KEYS.DJOMBI_AUTH });
    queryClient.removeQueries({ queryKey: QUERY_KEYS.DJOMBI_PROFILE });
    queryClient.removeQueries({ queryKey: QUERY_KEYS.DJOMBI_TOKENS });
    
    // Reset to default state
    queryClient.setQueryData(QUERY_KEYS.DJOMBI_AUTH, {
      isAuthenticated: false,
      profile: null,
      tokens: { accessToken: null, refreshToken: null }
    });
    
    setError(null);
  }, [queryClient]);

  // Cached authenticated request function
  const makeAuthenticatedCall = useCallback(async <T = any>(
    endpoint: string, 
    options?: RequestInit
  ): Promise<{ success: boolean; data?: T; error?: string }> => {
    if (!authState?.isAuthenticated || !authState.tokens.accessToken) {
      return {
        success: false,
        error: 'Not authenticated with Djombi'
      };
    }

    return await DjombiProfileService.makeAuthenticatedRequest<T>(endpoint, options);
  }, [authState?.isAuthenticated, authState?.tokens.accessToken]);

  // Memoized context value
  const contextValue: DjombiAuthState = useMemo(() => ({
    isInitialized,
    isDjombiAuthenticated: authState?.isAuthenticated || false,
    isLoading: authLoading || initializeMutation.isPending || refreshMutation.isPending,
    djombiUser: authState?.profile || null,
    djombiToken: authState?.tokens.accessToken || null,
    refreshToken: authState?.tokens.refreshToken || null,
    initializeDjombi,
    refreshDjombiAuth,
    clearDjombiAuth,
    makeAuthenticatedCall,
    error: error || (authError as Error)?.message || null,
  }), [
    isInitialized,
    authState,
    authLoading,
    initializeMutation.isPending,
    refreshMutation.isPending,
    initializeDjombi,
    refreshDjombiAuth,
    clearDjombiAuth,
    makeAuthenticatedCall,
    error,
    authError
  ]);

  return (
    <DjombiAuthContext.Provider value={contextValue}>
      {children}
    </DjombiAuthContext.Provider>
  );
};

// Custom hook to use Djombi authentication
export const useDjombiAuth = (): DjombiAuthState => {
  const context = useContext(DjombiAuthContext);
  if (!context) {
    throw new Error('useDjombiAuth must be used within a DjombiAuthProvider');
  }
  return context;
};

// Enhanced HOC with better loading and error states
export const withDjombiAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    showLoader?: boolean;
    fallback?: React.ComponentType;
  }
) => {
  return function DjombiAuthenticatedComponent(props: P) {
    const { isDjombiAuthenticated, isLoading, error, isInitialized } = useDjombiAuth();

    if (!isInitialized || isLoading) {
      if (options?.showLoader === false) return null;
      
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Setting up your account...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="text-red-600 mb-2">Authentication Error</div>
            <div className="text-gray-600 text-sm">{error}</div>
          </div>
        </div>
      );
    }

    if (!isDjombiAuthenticated) {
      if (options?.fallback) {
        const FallbackComponent = options.fallback;
        return <FallbackComponent />;
      }
      
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="text-gray-600">Please log in to continue</div>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

// Optimized loading component
export const DjombiAuthLoader = ({ children }: { children: ReactNode }) => {
  const { isInitialized, isLoading } = useDjombiAuth();

  // Show minimal loading state
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Initializing...</div>
        </div>
      </div>
    );
  }

  // Don't show loading for subsequent auth operations
  return <>{children}</>;
};