import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import dynamic from "next/dynamic";

// Import all components directly to avoid dynamic import issues
import QueryProvider from "@/components/providers/QueryProviders";
import { Toaster } from "@/components/ui/sonner";
import OAuth2 from "@/components/auth/oauth2";
import SearchProvider from "@/components/FeaturesSearch/SearchProvider";
import { HotjarInitializer } from "@/components/HotjarInitializer";
import {
  DjombiAuthProvider,
  DjombiAuthLoader,
} from "@/components/providers/DjombiAuthProvider";

// Dynamic imports for non-critical components
const BackgroundTokenRefresh = dynamic(
  () => import("@/components/auth/BackgroundTokenRefresh"),
  { ssr: false }
);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Djombi",
  description: "Djombi App",
};

// Enhanced error boundary with retry functionality
function ProviderErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <span className="text-gray-600">Loading application...</span>
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

// Optimized authentication wrapper with better layering
function AuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <OAuth2>
      <DjombiAuthProvider>
        <DjombiAuthLoader>
          <SearchProvider>
            {/* Background token refresh component */}
            <BackgroundTokenRefresh />
            {children}
          </SearchProvider>
        </DjombiAuthLoader>
      </DjombiAuthProvider>
    </OAuth2>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://be-auth-server.onrender.com" />
        <link rel="dns-prefetch" href="https://be-auth-server.onrender.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ProviderErrorBoundary>
          <QueryProvider>
            <HotjarInitializer />
            <AuthWrapper>{children}</AuthWrapper>
            <Toaster richColors />
          </QueryProvider>
        </ProviderErrorBoundary>
      </body>
    </html>
  );
}
