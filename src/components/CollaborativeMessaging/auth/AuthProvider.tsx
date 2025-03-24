"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import useAuthStore from "@/store/messaging/authStore";
import LoginModal from "./LoginModal";
import useModalStore from "@/store/messaging/modalStore";
import RegisterModal from "./RegisterModal";

interface AuthContextType {
  isAuthChecking: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { initializeFromStorage, isAuthenticated } = useAuthStore();
  const { openModal } = useModalStore();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initialize = async () => {
      await initializeFromStorage();
      setIsAuthChecking(false);
    };

    initialize();
  }, [initializeFromStorage]);

  // Handle protected routes
  useEffect(() => {
    if (!isAuthChecking && pathname) {
      const isMessageRoute = pathname.startsWith("/messages");

      if (isMessageRoute && !isAuthenticated) {
        // Open login modal if trying to access messages route without authentication
        openModal("login", { redirectPath: pathname });
      }
    }
  }, [isAuthChecking, pathname, isAuthenticated, openModal, router]);

  return (
    <AuthContext.Provider value={{ isAuthChecking }}>
      {children}
      <LoginModal />
      <RegisterModal />
    </AuthContext.Provider>
  );
};

export default AuthProvider;
