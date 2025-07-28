"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DjombiProfileService } from "@/lib/services/DjombiProfileService";
import { AuthContext } from "@/lib/context/auth";

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
  isInitialized: boolean;
  isDjombiAuthenticated: boolean;
  isLoading: boolean;
  djombiUser: DjombiUser | null;
  djombiToken: string | null;
  refreshToken: string | null;
  initializeDjombi: (adafriToken: string) => Promise<boolean>;
  refreshDjombiAuth: () => Promise<boolean>;
  clearDjombiAuth: () => void;
  makeAuthenticatedCall: <T = any>(
    endpoint: string,
    options?: RequestInit
  ) => Promise<{ success: boolean; data?: T; error?: string }>;
  error: string | null;
}

const QUERY_KEYS = {
  DJOMBI_AUTH: ["djombi", "auth"] as const,
  DJOMBI_PROFILE: ["djombi", "profile"] as const,
  DJOMBI_TOKENS: ["djombi", "tokens"] as const,
} as const;

const DjombiAuthContext = createContext<DjombiAuthState | null>(null);

interface DjombiAuthProviderProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export const DjombiAuthProvider = ({
  children,
  requireAuth = true,
}: DjombiAuthProviderProps) => {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(!requireAuth);
  const [error, setError] = useState<string | null>(null);
  
  // Track initialization attempts to prevent loops
  const initializationInProgress = useRef(false);
  const lastInitializationAttempt = useRef<string | null>(null);

  const adafriAuth = useContext(AuthContext);

  const getStoredAuthState = useCallback(() => {
    if (typeof window === "undefined" || !requireAuth) {
      return {
        isAuthenticated: false,
        profile: null,
        tokens: { accessToken: null, refreshToken: null },
      };
    }

    const isAuthenticated = DjombiProfileService.isDjombiAuthenticated();
    const profile = DjombiProfileService.getStoredUserProfile();
    const tokens = DjombiProfileService.getStoredDjombiTokens();

    return { isAuthenticated, profile, tokens };
  }, [requireAuth]);

  const {
    data: authState,
    isLoading: authLoading,
    error: authError,
    refetch: refetchAuth,
  } = useQuery({
    queryKey: QUERY_KEYS.DJOMBI_AUTH,
    queryFn: getStoredAuthState,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: isInitialized && requireAuth,
  });

  const initializeMutation = useMutation({
    mutationFn: async (adafriToken: string) => {
      // Prevent concurrent initialization attempts
      if (initializationInProgress.current) {
        throw new Error("Initialization already in progress");
      }

      // Prevent duplicate attempts with same token
      if (lastInitializationAttempt.current === adafriToken) {
        throw new Error("Already attempted initialization with this token");
      }

      initializationInProgress.current = true;
      lastInitializationAttempt.current = adafriToken;

      try {
        console.log('🚀 Starting Djombi initialization...');
        const result = await DjombiProfileService.initializeDjombiAuth(adafriToken);
        
        if (!result.success) {
          throw new Error(result.error || "Failed to initialize Djombi authentication");
        }

        console.log('✅ Djombi initialization successful:', result);
        return result;
      } finally {
        initializationInProgress.current = false;
      }
    },
    onSuccess: (data) => {
      console.log('🎉 Djombi auth initialized successfully');
      
      const newAuthState = {
        isAuthenticated: true,
        profile: data.profile,
        tokens: {
          accessToken: data.tokens?.accessTokenDjombi,
          refreshToken: data.tokens?.refreshTokenDjombi,
        },
      };

      queryClient.setQueryData(QUERY_KEYS.DJOMBI_AUTH, newAuthState);
      queryClient.setQueryData(QUERY_KEYS.DJOMBI_PROFILE, data.profile);
      queryClient.setQueryData(QUERY_KEYS.DJOMBI_TOKENS, data.tokens);

      setError(null);
    },
    onError: (error: Error) => {
      console.error('❌ Djombi initialization failed:', error);
      setError(error.message);
      
      // Reset attempt tracking on error to allow retry
      lastInitializationAttempt.current = null;
    },
  });

  // Initialize on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log('🔧 Initializing DjombiAuthProvider...');
      setIsInitialized(true);
      setError(null);
    }
  }, []);

  // Stable initialization function
  const initializeDjombi = useCallback(
    async (adafriToken: string): Promise<boolean> => {
      if (!requireAuth) return true;

      // Prevent duplicate initialization
      if (initializationInProgress.current) {
        console.log('⏳ Initialization already in progress, skipping...');
        return false;
      }

      if (authState?.isAuthenticated) {
        console.log('✅ Already authenticated with Djombi, skipping initialization');
        return true;
      }

      try {
        setError(null);
        await initializeMutation.mutateAsync(adafriToken);
        return true;
      } catch (error) {
        console.error('💥 Initialize Djombi error:', error);
        return false;
      }
    },
    [initializeMutation, requireAuth, authState?.isAuthenticated]
  );

  const refreshDjombiAuth = useCallback(async (): Promise<boolean> => {
    if (!requireAuth) return true;
    
    try {
      setError(null);
      // Implement refresh logic here
      return true;
    } catch (error) {
      console.error('💥 Refresh Djombi error:', error);
      return false;
    }
  }, [requireAuth]);

  const clearDjombiAuth = useCallback(() => {
    if (!requireAuth) return;

    console.log('🧹 Clearing Djombi auth data...');
    
    // Reset tracking variables
    initializationInProgress.current = false;
    lastInitializationAttempt.current = null;

    DjombiProfileService.clearDjombiAuth();

    queryClient.removeQueries({ queryKey: QUERY_KEYS.DJOMBI_AUTH });
    queryClient.removeQueries({ queryKey: QUERY_KEYS.DJOMBI_PROFILE });
    queryClient.removeQueries({ queryKey: QUERY_KEYS.DJOMBI_TOKENS });

    queryClient.setQueryData(QUERY_KEYS.DJOMBI_AUTH, {
      isAuthenticated: false,
      profile: null,
      tokens: { accessToken: null, refreshToken: null },
    });

    setError(null);
  }, [queryClient, requireAuth]);

  const makeAuthenticatedCall = useCallback(
    async <T = any,>(
      endpoint: string,
      options?: RequestInit
    ): Promise<{ success: boolean; data?: T; error?: string }> => {
      if (!requireAuth) {
        return {
          success: false,
          error: "Authentication not enabled for this context",
        };
      }

      if (!authState?.isAuthenticated || !authState.tokens.accessToken) {
        return {
          success: false,
          error: "Not authenticated with Djombi",
        };
      }

      return await DjombiProfileService.makeAuthenticatedRequest<T>(
        endpoint,
        options
      );
    },
    [authState?.isAuthenticated, authState?.tokens.accessToken, requireAuth]
  );

  // Memoized context value
  const contextValue: DjombiAuthState = useMemo(
    () => ({
      isInitialized,
      isDjombiAuthenticated: requireAuth ? authState?.isAuthenticated || false : false,
      isLoading: requireAuth ? authLoading || initializeMutation.isPending : false,
      djombiUser: requireAuth ? authState?.profile || null : null,
      djombiToken: requireAuth ? authState?.tokens.accessToken || null : null,
      refreshToken: requireAuth ? authState?.tokens.refreshToken || null : null,
      initializeDjombi,
      refreshDjombiAuth,
      clearDjombiAuth,
      makeAuthenticatedCall,
      error: requireAuth ? error || (authError as Error)?.message || null : null,
    }),
    [
      isInitialized,
      authState,
      authLoading,
      initializeMutation.isPending,
      initializeDjombi,
      refreshDjombiAuth,
      clearDjombiAuth,
      makeAuthenticatedCall,
      error,
      authError,
      requireAuth,
    ]
  );

  return (
    <DjombiAuthContext.Provider value={contextValue}>
      {children}
    </DjombiAuthContext.Provider>
  );
};

export const useDjombiAuth = (): DjombiAuthState => {
  const context = useContext(DjombiAuthContext);
  if (!context) {
    throw new Error("useDjombiAuth must be used within a DjombiAuthProvider");
  }
  return context;
};

export const withDjombiAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    showLoader?: boolean;
    fallback?: React.ComponentType;
    requireAuth?: boolean;
  }
) => {
  return function DjombiAuthenticatedComponent(props: P) {
    const { isDjombiAuthenticated, isLoading, error, isInitialized } = useDjombiAuth();
    const requireAuth = options?.requireAuth ?? true;

    if (!requireAuth) {
      return <Component {...props} />;
    }

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

export const DjombiAuthLoader = ({
  children,
  requireAuth = true,
}: {
  children: ReactNode;
  requireAuth?: boolean;
}) => {
  const { isInitialized, isLoading } = useDjombiAuth();

  if (!requireAuth) {
    return <>{children}</>;
  }

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

  return <>{children}</>;
};