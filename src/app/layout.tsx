// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";

// Import all components directly
import QueryProvider from "@/components/providers/QueryProviders";
import { Toaster } from "@/components/ui/sonner";
import { HotjarInitializer } from "@/components/HotjarInitializer";
import ConditionalAuthWrapper from "@/components/auth/ConditionalAuthWrapper";

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
            <ConditionalAuthWrapper>
              {children}
            </ConditionalAuthWrapper>
            <Toaster richColors />
          </QueryProvider>
        </ProviderErrorBoundary>
      </body>
    </html>
  );
}