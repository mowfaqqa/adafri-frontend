// Enhanced useCombinedAuth with Organization Context
"use client"
import { useContext, useEffect, useRef, useCallback } from 'react';
import { AuthContext } from '@/lib/context/auth';
import { useDjombiAuth } from './DjombiAuthProvider';
import { useOrganization } from '@/lib/context/organization';

interface CombinedAuthState {
  adafri: {
    user: any | null;
    token: any | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: () => void;
    logout: () => void;
  };
  djombi: {
    user: any | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    makeApiCall: <T = any>(endpoint: string, options?: RequestInit) => Promise<{ success: boolean; data?: T; error?: string }>;
    refresh: () => Promise<boolean>;
    error: string | null;
  };
  organization: {
    current: any | null;
    isLoading: boolean;
    hasOrganizations: boolean;
    switch: (orgId: string) => Promise<boolean>;
  };
  isFullyAuthenticated: boolean;
  isLoading: boolean;
  hasError: boolean;
}

export const useCombinedAuth = (): CombinedAuthState => {
  const adafriAuth = useContext(AuthContext);
  const djombiAuth = useDjombiAuth();
  const organizationContext = useOrganization();

  // Use refs to track initialization state and prevent loops
  const initializationAttempted = useRef(false);
  const currentAdafriToken = useRef<string | null>(null);
  const orgInitialized = useRef(false);

  if (!adafriAuth) {
    throw new Error('useCombinedAuth must be used within both OAuth2 and DjombiAuthProvider');
  }

  const isAdafriAuthenticated = adafriAuth.isAuthenticated ?? !!(adafriAuth.token && adafriAuth.user);

  // Enhanced initialization that includes organization setup
  const initializeDjombiIfNeeded = useCallback(async () => {
    const accessToken = adafriAuth.token?.access_token;
    
    // Prevent duplicate initialization attempts
    if (
      !isAdafriAuthenticated ||
      !accessToken ||
      (adafriAuth.isLoading ?? false) ||
      djombiAuth.isDjombiAuthenticated ||
      djombiAuth.isLoading ||
      !djombiAuth.isInitialized ||
      initializationAttempted.current ||
      currentAdafriToken.current === accessToken
    ) {
      return;
    }

    console.log('🚀 Initializing Djombi with organization context...');
    initializationAttempted.current = true;
    currentAdafriToken.current = accessToken;

    try {
      const success = await djombiAuth.initializeDjombi(accessToken);
      if (success) {
        console.log('✅ Djombi initialization successful');
        
        // After Djombi init, ensure organizations are loaded
        if (!orgInitialized.current && !organizationContext.isLoadingOrganizations) {
          console.log('🏢 Loading organizations after Djombi init...');
          orgInitialized.current = true;
          await organizationContext.loadOrganizations();
        }
      } else {
        console.error('❌ Djombi initialization failed');
        // Reset flags on failure to allow retry
        initializationAttempted.current = false;
        currentAdafriToken.current = null;
        orgInitialized.current = false;
      }
    } catch (error) {
      console.error('💥 Error during Djombi initialization:', error);
      initializationAttempted.current = false;
      currentAdafriToken.current = null;
      orgInitialized.current = false;
    }
  }, [
    isAdafriAuthenticated,
    adafriAuth.token?.access_token,
    adafriAuth.isLoading,
    djombiAuth.isDjombiAuthenticated,
    djombiAuth.isLoading,
    djombiAuth.isInitialized,
    djombiAuth.initializeDjombi,
    organizationContext.loadOrganizations,
    organizationContext.isLoadingOrganizations,
  ]);

  // Effect for Djombi initialization
  useEffect(() => {
    initializeDjombiIfNeeded();
  }, [initializeDjombiIfNeeded]);

  // Effect for clearing auth on logout
  useEffect(() => {
    if (!isAdafriAuthenticated && djombiAuth.isDjombiAuthenticated) {
      console.log('🚪 Adafri logout detected, clearing all auth...');
      djombiAuth.clearDjombiAuth();
      organizationContext.clearOrganizationData();
      // Reset initialization flags
      initializationAttempted.current = false;
      currentAdafriToken.current = null;
      orgInitialized.current = false;
    }
  }, [isAdafriAuthenticated, djombiAuth.isDjombiAuthenticated, djombiAuth.clearDjombiAuth, organizationContext.clearOrganizationData]);

  // Reset initialization flags when Adafri token changes
  useEffect(() => {
    const newToken = adafriAuth.token?.access_token;
    if (newToken !== currentAdafriToken.current) {
      initializationAttempted.current = false;
      orgInitialized.current = false;
    }
  }, [adafriAuth.token?.access_token]);

  // Determine if fully authenticated (including organization context)
  const isFullyAuthenticated = isAdafriAuthenticated && 
                              djombiAuth.isDjombiAuthenticated && 
                              organizationContext.hasOrganizations && 
                              !!organizationContext.currentOrganization;

  return {
    adafri: {
      user: adafriAuth.user ?? null,
      token: adafriAuth.token ?? null,
      isAuthenticated: isAdafriAuthenticated,
      isLoading: adafriAuth.isLoading ?? false,
      login: () => adafriAuth.tryLogin(true),
      logout: () => adafriAuth.tryLogout(true),
    },
    djombi: {
      user: djombiAuth.djombiUser,
      token: djombiAuth.djombiToken,
      isAuthenticated: djombiAuth.isDjombiAuthenticated,
      isLoading: djombiAuth.isLoading,
      makeApiCall: djombiAuth.makeAuthenticatedCall,
      refresh: djombiAuth.refreshDjombiAuth,
      error: djombiAuth.error,
    },
    organization: {
      current: organizationContext.currentOrganization,
      isLoading: organizationContext.isLoadingOrganizations,
      hasOrganizations: organizationContext.hasOrganizations,
      switch: organizationContext.switchOrganization,
    },
    isFullyAuthenticated,
    isLoading: (adafriAuth.isLoading ?? false) || 
               djombiAuth.isLoading || 
               organizationContext.isLoadingOrganizations,
    hasError: !!djombiAuth.error,
  };
};

export const useDjombiOnly = () => {
  const { djombi, isFullyAuthenticated, isLoading, hasError } = useCombinedAuth();
  
  return {
    ...djombi,
    isFullyAuthenticated,
    isLoading,
    hasError,
  };
};

export const useAdafriOnly = () => {
  const { adafri } = useCombinedAuth();
  return adafri;
};