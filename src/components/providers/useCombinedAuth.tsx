"use client"
import { useContext, useEffect, useMemo } from 'react';
import { AuthContext } from '@/lib/context/auth';
import { useDjombiAuth } from './DjombiAuthProvider'; // Fixed import path - should match your DjombiAuthProvider location

interface CombinedAuthState {
  // Adafri auth (from your existing OAuth2)
  adafri: {
    user: any | null;
    token: any | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: () => void;
    logout: () => void;
  };
  // Djombi auth
  djombi: {
    user: any | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    makeApiCall: <T = any>(endpoint: string, options?: RequestInit) => Promise<{ success: boolean; data?: T; error?: string }>;
    refresh: () => Promise<boolean>;
    error: string | null;
  };
  // Combined states
  isFullyAuthenticated: boolean;
  isLoading: boolean;
  hasError: boolean;
}

/**
 * Combined auth hook that bridges your existing OAuth2 and DjombiAuthProvider
 * This hook automatically initializes Djombi when Adafri auth is successful
 */
export const useCombinedAuth = (): CombinedAuthState => {
  // Get your existing Adafri auth context
  const adafriAuth = useContext(AuthContext);
  
  // Get Djombi auth context - make sure this import path matches your DjombiAuthProvider file
  const djombiAuth = useDjombiAuth();

  if (!adafriAuth) {
    throw new Error('useCombinedAuth must be used within both OAuth2 and DjombiAuthProvider');
  }

  // Determine if Adafri is authenticated - use the actual isAuthenticated property or fallback to checking token/user
  const isAdafriAuthenticated = adafriAuth.isAuthenticated ?? !!(adafriAuth.token && adafriAuth.user);

  // Auto-initialize Djombi when Adafri authentication is successful
  useEffect(() => {
    const autoInitializeDjombi = async () => {
      // Check if we should initialize Djombi
      const shouldInitialize = 
        isAdafriAuthenticated &&
        adafriAuth.token?.access_token &&
        !(adafriAuth.isLoading ?? false) &&
        !djombiAuth.isDjombiAuthenticated &&
        !djombiAuth.isLoading &&
        djombiAuth.isInitialized;

      if (shouldInitialize) {
        console.log('Auto-initializing Djombi with Adafri token...');
        try {
          // Type assertion to ensure we have the token
          const accessToken = adafriAuth.token?.access_token;
          if (accessToken) {
            const success = await djombiAuth.initializeDjombi(accessToken);
            if (success) {
              console.log('Djombi initialization successful');
            } else {
              console.error('Djombi initialization failed');
            }
          }
        } catch (error) {
          console.error('Error during Djombi auto-initialization:', error);
        }
      }
    };

    autoInitializeDjombi();
  }, [
    isAdafriAuthenticated,
    adafriAuth.token?.access_token,
    adafriAuth.isLoading,
    djombiAuth.isDjombiAuthenticated,
    djombiAuth.isLoading,
    djombiAuth.isInitialized,
    djombiAuth.initializeDjombi
  ]);

  // Clear Djombi auth when Adafri auth is cleared
  useEffect(() => {
    if (!isAdafriAuthenticated && djombiAuth.isDjombiAuthenticated) {
      console.log('Adafri logout detected, clearing Djombi auth...');
      djombiAuth.clearDjombiAuth();
    }
  }, [
    isAdafriAuthenticated, 
    djombiAuth.isDjombiAuthenticated,
    djombiAuth.clearDjombiAuth
  ]);

  // Memoize the return object to provide stable references
  const combinedAuthState = useMemo(() => ({
    // Adafri auth (your existing OAuth2)
    adafri: {
      user: adafriAuth.user ?? null,
      token: adafriAuth.token ?? null,
      isAuthenticated: isAdafriAuthenticated,
      isLoading: adafriAuth.isLoading ?? false,
      login: () => adafriAuth.tryLogin(true),
      logout: () => adafriAuth.tryLogout(true),
    },
    // Djombi auth - memoize to provide stable references
    djombi: {
      user: djombiAuth.djombiUser,
      token: djombiAuth.djombiToken,
      isAuthenticated: djombiAuth.isDjombiAuthenticated,
      isLoading: djombiAuth.isLoading,
      makeApiCall: djombiAuth.makeAuthenticatedCall,
      refresh: djombiAuth.refreshDjombiAuth,
      error: djombiAuth.error,
    },
    // Combined states
    isFullyAuthenticated: isAdafriAuthenticated && djombiAuth.isDjombiAuthenticated,
    isLoading: (adafriAuth.isLoading ?? false) || djombiAuth.isLoading,
    hasError: !!djombiAuth.error,
  }), [
    // Adafri dependencies
    adafriAuth.user,
    adafriAuth.token,
    isAdafriAuthenticated,
    adafriAuth.isLoading,
    adafriAuth.tryLogin,
    adafriAuth.tryLogout,
    // Djombi dependencies - only the values that actually matter
    djombiAuth.djombiUser,
    djombiAuth.djombiToken,
    djombiAuth.isDjombiAuthenticated,
    djombiAuth.isLoading,
    djombiAuth.makeAuthenticatedCall,
    djombiAuth.refreshDjombiAuth,
    djombiAuth.error,
  ]);

  return combinedAuthState;
};

/**
 * Hook for components that only need Djombi authentication status
 * Simpler alternative when you don't need the full combined auth
 */
export const useDjombiOnly = () => {
  const { djombi, isFullyAuthenticated, isLoading, hasError } = useCombinedAuth();
  
  return {
    ...djombi,
    isFullyAuthenticated,
    isLoading,
    hasError,
  };
};

/**
 * Hook for components that only need Adafri authentication status
 * Useful for components that don't need Djombi functionality
 */
export const useAdafriOnly = () => {
  const { adafri } = useCombinedAuth();
  return adafri;
};


















































// "use client"
// import { useContext, useEffect } from 'react';
// import { AuthContext } from '@/lib/context/auth';
// import { useDjombiAuth } from './DjombiAuthProvider'; // Fixed import path - should match your DjombiAuthProvider location

// interface CombinedAuthState {
//   // Adafri auth (from your existing OAuth2)
//   adafri: {
//     user: any | null;
//     token: any | null;
//     isAuthenticated: boolean;
//     isLoading: boolean;
//     login: () => void;
//     logout: () => void;
//   };
//   // Djombi auth
//   djombi: {
//     user: any | null;
//     token: string | null;
//     isAuthenticated: boolean;
//     isLoading: boolean;
//     makeApiCall: <T = any>(endpoint: string, options?: RequestInit) => Promise<{ success: boolean; data?: T; error?: string }>;
//     refresh: () => Promise<boolean>;
//     error: string | null;
//   };
//   // Combined states
//   isFullyAuthenticated: boolean;
//   isLoading: boolean;
//   hasError: boolean;
// }

// /**
//  * Combined auth hook that bridges your existing OAuth2 and DjombiAuthProvider
//  * This hook automatically initializes Djombi when Adafri auth is successful
//  */
// export const useCombinedAuth = (): CombinedAuthState => {
//   // Get your existing Adafri auth context
//   const adafriAuth = useContext(AuthContext);
  
//   // Get Djombi auth context - make sure this import path matches your DjombiAuthProvider file
//   const djombiAuth = useDjombiAuth();

//   if (!adafriAuth) {
//     throw new Error('useCombinedAuth must be used within both OAuth2 and DjombiAuthProvider');
//   }

//   // Determine if Adafri is authenticated - use the actual isAuthenticated property or fallback to checking token/user
//   const isAdafriAuthenticated = adafriAuth.isAuthenticated ?? !!(adafriAuth.token && adafriAuth.user);

//   // Auto-initialize Djombi when Adafri authentication is successful
//   useEffect(() => {
//     const autoInitializeDjombi = async () => {
//       // Check if we should initialize Djombi
//       const shouldInitialize = 
//         isAdafriAuthenticated &&
//         adafriAuth.token?.access_token &&
//         !(adafriAuth.isLoading ?? false) &&
//         !djombiAuth.isDjombiAuthenticated &&
//         !djombiAuth.isLoading &&
//         djombiAuth.isInitialized;

//       if (shouldInitialize) {
//         console.log('Auto-initializing Djombi with Adafri token...');
//         try {
//           // Type assertion to ensure we have the token
//           const accessToken = adafriAuth.token?.access_token;
//           if (accessToken) {
//             const success = await djombiAuth.initializeDjombi(accessToken);
//             if (success) {
//               console.log('Djombi initialization successful');
//             } else {
//               console.error('Djombi initialization failed');
//             }
//           }
//         } catch (error) {
//           console.error('Error during Djombi auto-initialization:', error);
//         }
//       }
//     };

//     autoInitializeDjombi();
//   }, [
//     isAdafriAuthenticated,
//     adafriAuth.token?.access_token,
//     adafriAuth.isLoading,
//     djombiAuth.isDjombiAuthenticated,
//     djombiAuth.isLoading,
//     djombiAuth.isInitialized,
//     djombiAuth.initializeDjombi
//   ]);

//   // Clear Djombi auth when Adafri auth is cleared
//   useEffect(() => {
//     if (!isAdafriAuthenticated && djombiAuth.isDjombiAuthenticated) {
//       console.log('Adafri logout detected, clearing Djombi auth...');
//       djombiAuth.clearDjombiAuth();
//     }
//   }, [
//     isAdafriAuthenticated, 
//     djombiAuth.isDjombiAuthenticated,
//     djombiAuth.clearDjombiAuth
//   ]);

//   return {
//     // Adafri auth (your existing OAuth2)
//     adafri: {
//       user: adafriAuth.user ?? null,
//       token: adafriAuth.token ?? null,
//       isAuthenticated: isAdafriAuthenticated,
//       isLoading: adafriAuth.isLoading ?? false,
//       login: () => adafriAuth.tryLogin(true),
//       logout: () => adafriAuth.tryLogout(true),
//     },
//     // Djombi auth
//     djombi: {
//       user: djombiAuth.djombiUser,
//       token: djombiAuth.djombiToken,
//       isAuthenticated: djombiAuth.isDjombiAuthenticated,
//       isLoading: djombiAuth.isLoading,
//       makeApiCall: djombiAuth.makeAuthenticatedCall,
//       refresh: djombiAuth.refreshDjombiAuth,
//       error: djombiAuth.error,
//     },
//     // Combined states
//     isFullyAuthenticated: isAdafriAuthenticated && djombiAuth.isDjombiAuthenticated,
//     isLoading: (adafriAuth.isLoading ?? false) || djombiAuth.isLoading,
//     hasError: !!djombiAuth.error,
//   };
// };

// /**
//  * Hook for components that only need Djombi authentication status
//  * Simpler alternative when you don't need the full combined auth
//  */
// export const useDjombiOnly = () => {
//   const { djombi, isFullyAuthenticated, isLoading, hasError } = useCombinedAuth();
  
//   return {
//     ...djombi,
//     isFullyAuthenticated,
//     isLoading,
//     hasError,
//   };
// };

// /**
//  * Hook for components that only need Adafri authentication status
//  * Useful for components that don't need Djombi functionality
//  */
// export const useAdafriOnly = () => {
//   const { adafri } = useCombinedAuth();
//   return adafri;
// };