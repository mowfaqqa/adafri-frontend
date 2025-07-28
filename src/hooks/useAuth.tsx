"use client";
import { AuthContext } from "@/lib/context/auth";
import React, { useContext } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * AuthGuard component that ensures user is authenticated before rendering children
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback = <div>Please log in to access this feature.</div>,
}) => {
  const { user, token, isLoading } = useContext(AuthContext);

  // Show loading state while checking auth
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Show fallback if not authenticated
  if (!user || !token) {
    return <>{fallback}</>;
  }

  // User is authenticated, render children
  return <>{children}</>;
};

/**
 * Hook to check if user is authenticated
 */
export const useAuth = () => {
  const { user, token, isLoading } = useContext(AuthContext);

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    userId: user?.uid || null,
  };
};
