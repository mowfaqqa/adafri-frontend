// components/guards/OrganizationGuard.tsx
"use client";
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useOrganization } from '@/lib/context/organization';
import CreateOrganizationModal from '@/components/modals/CreateOrganizationModal';
import { Spinner } from '@awc/react';
import { useAuth } from '@/hooks/useAuth';

interface OrganizationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Routes that don't require organization membership
const PUBLIC_ROUTES = [
  '/auth',
  '/invite',
  '/profile',
  '/settings/account'
];

// Check if route requires organization
const requiresOrganization = (pathname: string): boolean => {
  // Dashboard routes require organization
  if (pathname.startsWith('/dashboard')) {
    return true;
  }
  
  // Check if it's a public route
  return !PUBLIC_ROUTES.some(route => pathname.startsWith(route));
};

export const OrganizationGuard: React.FC<OrganizationGuardProps> = ({ 
  children, 
  fallback 
}) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { 
    hasOrganizations, 
    isLoadingOrganizations, 
    currentOrganization 
  } = useOrganization();
  
  const pathname = usePathname();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Check if current route requires organization
  const needsOrganization = requiresOrganization(pathname);

  useEffect(() => {
    // Don't do anything while auth is loading
    if (authLoading) return;
    
    // If not authenticated, let AuthGuard handle it
    if (!isAuthenticated) return;
    
    // Don't check org requirements for public routes
    if (!needsOrganization) return;
    
    // Don't do anything while organizations are loading
    if (isLoadingOrganizations) return;
    
    // If user needs organization but doesn't have any, show create modal
    if (needsOrganization && !hasOrganizations) {
      setShowCreateModal(true);
      return;
    }
    
    // If user has organizations but no current one selected, redirect to first org
    if (hasOrganizations && !currentOrganization) {
      // This should be handled by OrganizationProvider, but as fallback
      router.refresh();
      return;
    }
    
  }, [
    authLoading, 
    isAuthenticated, 
    needsOrganization, 
    isLoadingOrganizations, 
    hasOrganizations, 
    currentOrganization,
    router
  ]);

  // Show loading while auth or organizations are loading
  if (authLoading || (isAuthenticated && needsOrganization && isLoadingOrganizations)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, let AuthGuard handle it
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // If route doesn't require organization, render children
  if (!needsOrganization) {
    return <>{children}</>;
  }

  // If user needs organization but doesn't have any, show create modal
  if (needsOrganization && !hasOrganizations) {
    return (
      <>
        {fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Welcome to the Platform!
              </h2>
              <p className="text-gray-600 mb-6">
                You need to be part of an organization to access this feature.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Organization
              </button>
            </div>
          </div>
        )}
        
        <CreateOrganizationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            router.push('/dashboard');
          }}
        />
      </>
    );
  }

  // If user has organizations and current org is selected, render children
  if (hasOrganizations && currentOrganization) {
    return <>{children}</>;
  }

  // Fallback loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Spinner className="w-8 h-8 mx-auto mb-4" />
        <p className="text-gray-600">Setting up your workspace...</p>
      </div>
    </div>
  );
};

// Hook for components to check organization requirements
export const useOrganizationGuard = () => {
  const pathname = usePathname();
  const { hasOrganizations, currentOrganization } = useOrganization();
  
  const needsOrganization = requiresOrganization(pathname);
  const hasRequiredOrganization = needsOrganization ? 
    (hasOrganizations && currentOrganization) : true;
  
  return {
    needsOrganization,
    hasRequiredOrganization,
    canAccessCurrentRoute: hasRequiredOrganization
  };
};