"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();

  useEffect(() => {
    // Check for access token in cookies
    const accessToken = Cookies.get('accessToken');
    
    // If no access token, redirect to login page
    if (!accessToken) {
      router.replace('/auth/login');
    }
  }, []); // Empty dependency array means this runs once on component mount

  // Optional: Add a loading state or placeholder while checking authentication
  if (typeof window !== 'undefined' && !Cookies.get('accessToken')) {
    return null; // or return a loading spinner
  }

  return <>{children}</>;
}