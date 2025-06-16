"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

const DjombiAuthContext = createContext<DjombiAuthState | null>(null);

interface DjombiAuthProviderProps {
  children: ReactNode;
}

export const DjombiAuthProvider = ({ children }: DjombiAuthProviderProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDjombiAuthenticated, setIsDjombiAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [djombiUser, setDjombiUser] = useState<DjombiUser | null>(null);
  const [djombiToken, setDjombiToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Djombi auth state from localStorage
  useEffect(() => {
    const initializeFromStorage = () => {
      try {
        const isAuthenticated = DjombiProfileService.isDjombiAuthenticated();
        const storedProfile = DjombiProfileService.getStoredUserProfile();
        const { accessToken, refreshToken: storedRefreshToken } = DjombiProfileService.getStoredDjombiTokens();

        setIsDjombiAuthenticated(isAuthenticated);
        setDjombiUser(storedProfile);
        setDjombiToken(accessToken);
        setRefreshToken(storedRefreshToken);
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        console.error('Error initializing Djombi auth from storage:', err);
        setError('Failed to initialize authentication');
      } finally {
        setIsLoading(false);
      }
    };

    // Only run on client side
    if (typeof window !== 'undefined') {
      initializeFromStorage();
    } else {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  // Auto-initialize Djombi when Adafri token is available
  useEffect(() => {
    const checkAndInitializeDjombi = async () => {
      // Only run on client side and when initialized
      if (typeof window === 'undefined' || !isInitialized || isDjombiAuthenticated) {
        return;
      }

      try {
        // Check if Adafri token exists (adjust key name based on your OAuth2 implementation)
        const adafriToken = JSON.parse(localStorage.getItem('access_token')!)

        if (adafriToken.access_token && !isDjombiAuthenticated) {
          setIsLoading(true);
          await initializeDjombi(adafriToken.access_token);
        }
      } catch (err) {
        console.error('Auto-initialization failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAndInitializeDjombi();
  }, [isInitialized, isDjombiAuthenticated]);

  // Initialize Djombi authentication
  const initializeDjombi = async (adafriToken: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await DjombiProfileService.initializeDjombiAuth(adafriToken);

      if (result.success && result.profile && result.tokens) {
        setIsDjombiAuthenticated(true);
        setDjombiUser(result.profile);
        setDjombiToken(result.tokens.accessTokenDjombi);
        setRefreshToken(result.tokens.refreshTokenDjombi);
        setError(null);
        return true;
      } else {
        setError(result.error || 'Failed to initialize Djombi authentication');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Djombi initialization error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh Djombi authentication
  const refreshDjombiAuth = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await DjombiProfileService.refreshDjombiToken();

      if (result.success && result.profile && result.tokens) {
        setIsDjombiAuthenticated(true);
        setDjombiUser(result.profile);
        setDjombiToken(result.tokens.accessTokenDjombi);
        setRefreshToken(result.tokens.refreshTokenDjombi);
        setError(null);
        return true;
      } else {
        // Clear auth on refresh failure
        clearDjombiAuth();
        setError(result.error || 'Failed to refresh authentication');
        return false;
      }
    } catch (err) {
      clearDjombiAuth();
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Djombi refresh error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear Djombi authentication
  const clearDjombiAuth = () => {
    DjombiProfileService.clearDjombiAuth();
    setIsDjombiAuthenticated(false);
    setDjombiUser(null);
    setDjombiToken(null);
    setRefreshToken(null);
    setError(null);
  };

  // Make authenticated API calls
  const makeAuthenticatedCall = async <T = any>(
    endpoint: string, 
    options?: RequestInit
  ): Promise<{ success: boolean; data?: T; error?: string }> => {
    if (!isDjombiAuthenticated || !djombiToken) {
      return {
        success: false,
        error: 'Not authenticated with Djombi'
      };
    }

    return await DjombiProfileService.makeAuthenticatedRequest<T>(endpoint, options);
  };

  const contextValue: DjombiAuthState = {
    isInitialized,
    isDjombiAuthenticated,
    isLoading,
    djombiUser,
    djombiToken,
    refreshToken,
    initializeDjombi,
    refreshDjombiAuth,
    clearDjombiAuth,
    makeAuthenticatedCall,
    error,
  };

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

// HOC for components that require Djombi authentication
export const withDjombiAuth = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return function DjombiAuthenticatedComponent(props: P) {
    const { isDjombiAuthenticated, isLoading, error } = useDjombiAuth();

    if (isLoading) {
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

// Loading component for Djombi initialization
export const DjombiAuthLoader = ({ children }: { children: ReactNode }) => {
  const { isInitialized, isLoading } = useDjombiAuth();

  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Initializing your account...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};