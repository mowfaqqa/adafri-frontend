// components/auth/EnhancedOAuth2.tsx
"use client"
import { forwardRef, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Oauth2, Spinner } from '@awc/react';
import { AdfOauth2 } from "@awc/react/legacy/modules.js";

import { AuthContext } from '@/lib/context/auth';
import { AccessToken } from '@/lib/types/auth/types';
import { User } from '@awc/helpers/user';
import { 
  setAuthTokens, 
  setUserInfo, 
  setAuthStatus, 
  clearAllAuthData,
  getPrimaryAccessToken,
  isAuthenticated as checkIsAuthenticated
} from '@/lib/utils/enhancedCookies';
import { DjombiProfileService } from '@/lib/services/DjombiProfileService';

interface OAuth2Props {
  children: React.ReactNode;
  ref?: React.RefObject<AdfOauth2>;
}

const OAuth2 = forwardRef<AdfOauth2, OAuth2Props>((props, ref) => {
  const { children } = props;
  
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [token, setAccessToken] = useState<AccessToken | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [logout, tryLogout] = useState(false);
  const [login, tryLogin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [redirectUri, setRedirectUri] = useState('');
  const [djombiInitialized, setDjombiInitialized] = useState(false);
  
  const reference = useRef<AdfOauth2>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  // Initialize redirect URI
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRedirectUri(window.location.origin + '/auth/login');
      
      // Check existing authentication state on mount
      const existingToken = getPrimaryAccessToken();
      if (existingToken && checkIsAuthenticated()) {
        setIsAuthenticated(true);
        // You might want to validate the token here
      }
    }
  }, []);

  // Handle logout
  useEffect(() => {
    if (logout) {
      console.log('Logout triggered');
      handleLogout();
    }
  }, []);

  // Handle login
  useEffect(() => {
    if (login && reference.current) {
      reference.current?.startOAuthFlow();
    }
  }, [login]);

  // Handle authentication state changes and routing
  useEffect(() => {
    if (!isLoading && isAuthenticated && djombiInitialized) {
      // Only redirect to dashboard from login page
      if (pathname === "/auth/login") {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, djombiInitialized, pathname, router, isLoading]);

  // Initialize Djombi authentication after Adafri OAuth
  const initializeDjombi = async (adafriToken: AccessToken) => {
    try {
      console.log('Initializing Djombi authentication...');
      
      const result = await DjombiProfileService.initializeDjombiAuth(
        adafriToken.access_token
      );
      
      if (result.success && result.tokens && result.profile) {
        // Store all tokens securely
        setAuthTokens({
          adafriAccessToken: result.tokens.accessTokenAdafri,
          djombiAccessToken: result.tokens.accessTokenDjombi,
          djombiRefreshToken: result.tokens.refreshTokenDjombi
        });
        
        // Store user information
        setUserInfo({
          email: result.profile.email,
          firstName: result.profile.first_name,
          lastName: result.profile.last_name,
          userId: result.profile.id
        });
        
        // Update authentication status
        setAuthStatus('authenticated');
        setDjombiInitialized(true);
        
        console.log('Djombi authentication successful');
        return true;
      } else {
        console.error('Djombi authentication failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error initializing Djombi:', error);
      return false;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Clear all authentication data
      clearAllAuthData();
      
      // Reset component state
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setDjombiInitialized(false);
      
      // Reset logout trigger
      tryLogout(false);
      
      // Redirect to login
      router.push('/auth/login');
      
      console.log('Logout completed');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Handle OAuth2 component changes
  const handleOAuthChange = async (e: any) => {
    try {
      setIsLoading(true);
      
      // Handle token received
      if (e.token) {
        console.log('Adafri token received');
        setAccessToken(e.token);
        
        // Store Adafri tokens
        setAuthTokens({
          adafriAccessToken: e.token.access_token,
          adafriRefreshToken: e.token.refresh_token
        });
        
        // Initialize Djombi authentication
        const djombiSuccess = await initializeDjombi(e.token);
        
        if (!djombiSuccess) {
          console.error('Failed to initialize Djombi');
          handleLogout();
          return;
        }
      }
      
      // Handle user received
      if (e.user) {
        console.log('User information received');
        setUser(e.user);
        
        // Store user info if not already stored by Djombi
        if (!djombiInitialized) {
          setUserInfo({
            userId: e.user.uid,
            email: e.user.email
          });
        }
      }
      
      // Set authenticated state when both token and user are available
      if (e.user && e.token && djombiInitialized) {
        setIsAuthenticated(true);
      }
      
      // Handle explicit authentication state
      if (e.isAuthenticated !== undefined) {
        setIsAuthenticated(e.isAuthenticated);
      }
      
      // Handle load end
      if (e.event === 'load_end') {
        if (!e.token || !e.user) {
          // No valid session found, redirect to login
          if (pathname !== '/auth/login') {
            router.push('/auth/login');
          }
        } else {
          // Valid session found, check if user needs to go to dashboard
          if (pathname === "/auth/login" && isAuthenticated && djombiInitialized) {
            router.push('/dashboard');
          }
        }
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error handling OAuth change:', error);
      setIsLoading(false);
      
      // On error, clear authentication and redirect to login
      handleLogout();
    }
  };

  // Context value
  const contextValue = {
    token,
    setAccessToken,
    isLoading,
    setIsLoading,
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
    logout,
    tryLogout,
    login,
    tryLogin,
    redirectUri,
    setRedirectUri,
    djombiInitialized
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      
      {/* OAuth2 Component */}
      {redirectUri.length > 0 && (
        <Oauth2
          ref={reference}
          clientId={process.env.CLIENT_ID}
          redirectUri={redirectUri}
          authorizationEndpoint={process.env.AUTHORIZATION_ENDPOINT}
          userEndpoint={process.env.USERINFO_ENDPOINT}
          responseType={'code'}
          prompt="none"
          tokenEndpoint={process.env.TOKEN_ENDPOINT}
          auto={false}
          onChange={handleOAuthChange}
        />
      )}
      
      {/* Global Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-center">
            <Spinner className="w-8 h-8 mx-auto mb-4" />
            <p className="text-gray-600">Authenticating...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
});

OAuth2.displayName = 'OAuth2';

export default OAuth2;