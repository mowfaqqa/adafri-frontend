// components/auth/ConditionalAuthWrapper.tsx
"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import OAuth2 from "@/components/auth/oauth2";
import SearchProvider from "@/components/FeaturesSearch/SearchProvider";
import {
  DjombiAuthProvider,
  DjombiAuthLoader,
} from "@/components/providers/DjombiAuthProvider";
import BackgroundTokenRefresh from "@/components/auth/BackgroundTokenRefresh";

interface ConditionalAuthWrapperProps {
  children: ReactNode;
}

// Define routes that are completely public (no auth providers at all)
const COMPLETELY_PUBLIC_ROUTES = [
  "/", // Landing page only
];

// Define routes that need OAuth2 but not Djombi (auth flow pages)
const OAUTH_ONLY_ROUTES = [
  "/auth/login", // Login page
];

// Define routes that require full authentication (OAuth2 + Djombi)
const PROTECTED_ROUTES_PATTERNS = ["/dashboard"];

// Check if a path is completely public (no auth providers needed)
const isCompletelyPublic = (pathname: string): boolean => {
  return COMPLETELY_PUBLIC_ROUTES.includes(pathname);
};

// Check if a path needs OAuth2 only
const needsOAuthOnly = (pathname: string): boolean => {
  return OAUTH_ONLY_ROUTES.some((route) => pathname.startsWith(route));
};

// Check if a path requires full authentication (OAuth2 + Djombi)
const requiresFullAuth = (pathname: string): boolean => {
  return PROTECTED_ROUTES_PATTERNS.some((pattern) =>
    pathname.startsWith(pattern)
  );
};

// Full authentication wrapper for protected routes
function FullAuthWrapper({ children }: { children: ReactNode }) {
  return (
    <OAuth2>
      <DjombiAuthProvider requireAuth={true}>
        <DjombiAuthLoader requireAuth={true}>
          <SearchProvider>
            <BackgroundTokenRefresh />
            {children}
          </SearchProvider>
        </DjombiAuthLoader>
      </DjombiAuthProvider>
    </OAuth2>
  );
}

// OAuth2 only wrapper for auth pages
function OAuth2OnlyWrapper({ children }: { children: ReactNode }) {
  return (
    <OAuth2>
      <DjombiAuthProvider requireAuth={false}>
        <DjombiAuthLoader requireAuth={false}>
          <SearchProvider>{children}</SearchProvider>
        </DjombiAuthLoader>
      </DjombiAuthProvider>
    </OAuth2>
  );
}

// Public wrapper for completely public pages
function PublicWrapper({ children }: { children: ReactNode }) {
  return <SearchProvider>{children}</SearchProvider>;
}

export default function ConditionalAuthWrapper({
  children,
}: ConditionalAuthWrapperProps) {
  const pathname = usePathname();

  // Landing page only - completely public, no auth providers
  if (isCompletelyPublic(pathname)) {
    return <PublicWrapper>{children}</PublicWrapper>;
  }

  // Auth flow pages - OAuth2 only (no Djombi auth)
  if (needsOAuthOnly(pathname)) {
    return <OAuth2OnlyWrapper>{children}</OAuth2OnlyWrapper>;
  }

  // Dashboard and other protected routes - full authentication chain
  if (requiresFullAuth(pathname)) {
    return <FullAuthWrapper>{children}</FullAuthWrapper>;
  }

  // Default fallback for any unknown routes - treat as public
  return <PublicWrapper>{children}</PublicWrapper>;
}
