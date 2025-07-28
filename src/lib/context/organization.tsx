// lib/context/organization.tsx
"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { organizationApi, OrganizationMember } from '@/lib/api/organization/organizationApi';

import { setCookie, getCookie, removeCookie } from '@/lib/utils/cookies';
import { useAuth } from '@/hooks/useAuth';

// Constants
const CURRENT_ORG_COOKIE = 'current_organization_id';
const ORG_CACHE_KEY = 'user_organizations_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Types
export interface OrganizationContextType {
  // State
  organizations: OrganizationMember[];
  currentOrganization: OrganizationMember | null;
  isLoadingOrganizations: boolean;
  hasOrganizations: boolean;
  userRole: "ADMIN" | "MEMBER" | "GUEST" | "OWNER" | null;
  
  // Actions
  loadOrganizations: () => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<boolean>;
  createOrganization: (data: any) => Promise<boolean>;
  refreshOrganizations: () => Promise<void>;
  clearOrganizationData: () => void;
  
  // Computed
  canManageMembers: boolean;
  canInviteMembers: boolean;
  canUpdateSettings: boolean;
}

// Context
const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

// Hook
export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
};

// Provider Component
interface OrganizationProviderProps {
  children: React.ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const { isAuthenticated, token, user } = useAuth();
  
  // State
  const [organizations, setOrganizations] = useState<OrganizationMember[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<OrganizationMember | null>(null);
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(false);

  // Computed values
  const hasOrganizations = organizations.length > 0;
  const userRole = (currentOrganization?.role as "ADMIN" | "MEMBER" | "GUEST" | "OWNER" | null) || null;
  const canManageMembers = userRole === 'ADMIN' || userRole === 'OWNER';
  const canInviteMembers = canManageMembers;
  const canUpdateSettings = canManageMembers;

  // Cache management
  const getCachedOrganizations = useCallback((): OrganizationMember[] | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = localStorage.getItem(ORG_CACHE_KEY);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      
      if (now - timestamp > CACHE_DURATION) {
        localStorage.removeItem(ORG_CACHE_KEY);
        return null;
      }
      
      return data;
    } catch {
      localStorage.removeItem(ORG_CACHE_KEY);
      return null;
    }
  }, []);

  const setCachedOrganizations = useCallback((orgs: OrganizationMember[]) => {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData = {
        data: orgs,
        timestamp: Date.now()
      };
      localStorage.setItem(ORG_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache organizations:', error);
    }
  }, []);

  // Load organizations
  const loadOrganizations = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setOrganizations([]);
      setCurrentOrganization(null);
      return;
    }

    setIsLoadingOrganizations(true);
    
    try {
      // Try cache first
      const cached = getCachedOrganizations();
      if (cached) {
        setOrganizations(cached);
        
        // Set current organization from cache
        const currentOrgId = getCookie(CURRENT_ORG_COOKIE);
        if (currentOrgId) {
          const currentOrg = cached.find(org => org.organization.id === currentOrgId);
          if (currentOrg) {
            setCurrentOrganization(currentOrg);
            setIsLoadingOrganizations(false);
            return;
          }
        }
        
        // If no current org set, use first available
        if (cached.length > 0) {
          setCurrentOrganization(cached[0]);
          setCookie(CURRENT_ORG_COOKIE, cached[0].organization.id, 30);
        }
        
        setIsLoadingOrganizations(false);
        return;
      }

      // Fetch from API
      const response = await organizationApi.getOrganizations();
      const orgs = response.data;
      
      setOrganizations(orgs);
      setCachedOrganizations(orgs);
      
      // Set current organization
      const currentOrgId = getCookie(CURRENT_ORG_COOKIE);
      let currentOrg = null;
      
      if (currentOrgId) {
        currentOrg = orgs.find(org => org.organization.id === currentOrgId);
      }
      
      // If no valid current org, use first available
      if (!currentOrg && orgs.length > 0) {
        currentOrg = orgs[0];
        setCookie(CURRENT_ORG_COOKIE, orgs[0].organization.id, 30);
      }
      
      setCurrentOrganization(currentOrg!);
      
    } catch (error) {
      console.error('Failed to load organizations:', error);
      setOrganizations([]);
      setCurrentOrganization(null);
    } finally {
      setIsLoadingOrganizations(false);
    }
  }, [isAuthenticated, token, getCachedOrganizations, setCachedOrganizations]);

  // Switch organization
  const switchOrganization = useCallback(async (organizationId: string): Promise<boolean> => {
    try {
      const response = await organizationApi.switchOrganization({ organizationId });
      
      if (response.status === 'success') {
        // Update current organization
        const newCurrentOrg = organizations.find(org => org.organization.id === organizationId);
        if (newCurrentOrg) {
          setCurrentOrganization(newCurrentOrg);
          setCookie(CURRENT_ORG_COOKIE, organizationId, 30);
          
          // Update tokens if provided
          if (response.meta?.access_token) {
            setCookie('djombi_access_token', response.meta.access_token, 30);
          }
          if (response.meta?.refresh_token) {
            setCookie('djombi_refresh_token', response.meta.refresh_token, 30);
          }
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Failed to switch organization:', error);
      return false;
    }
  }, [organizations]);

  // Create organization
  const createOrganization = useCallback(async (data: any): Promise<boolean> => {
    try {
      const response = await organizationApi.createOrganization(data);
      
      if (response.status === 'success') {
        // Refresh organizations list
        await refreshOrganizations();
        
        // Set as current organization
        const newOrg = response.data;
        setCookie(CURRENT_ORG_COOKIE, newOrg.id, 30);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to create organization:', error);
      return false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh organizations
  const refreshOrganizations = useCallback(async () => {
    // Clear cache
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ORG_CACHE_KEY);
    }
    
    // Reload
    await loadOrganizations();
  }, [loadOrganizations]);

  // Clear organization data
  const clearOrganizationData = useCallback(() => {
    setOrganizations([]);
    setCurrentOrganization(null);
    removeCookie(CURRENT_ORG_COOKIE);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ORG_CACHE_KEY);
    }
  }, []);

  // Load organizations on auth change
  useEffect(() => {
    if (isAuthenticated) {
      loadOrganizations();
    } else {
      clearOrganizationData();
    }
  }, [isAuthenticated, loadOrganizations, clearOrganizationData]);

  // Context value
  const value: OrganizationContextType = {
    // State
    organizations,
    currentOrganization,
    isLoadingOrganizations,
    hasOrganizations,
    userRole,
    
    // Actions
    loadOrganizations,
    switchOrganization,
    createOrganization,
    refreshOrganizations,
    clearOrganizationData,
    
    // Computed
    canManageMembers,
    canInviteMembers,
    canUpdateSettings,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};