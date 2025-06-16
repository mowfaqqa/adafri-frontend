import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from 'react';

// Import all components directly to avoid dynamic import issues
import QueryProvider from "@/components/providers/QueryProviders";
import { Toaster } from "@/components/ui/sonner";
import OAuth2 from "@/components/auth/oauth2"; // Your existing OAuth2 component
import SearchProvider from "@/components/FeaturesSearch/SearchProvider";
import { HotjarInitializer } from "@/components/HotjarInitializer";
import { DjombiAuthProvider, DjombiAuthLoader } from "@/components/providers/DjombiAuthProvider";


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

// Error boundary component for better error handling
function ProviderErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading...</span>
      </div>
    }>
      {children}
    </Suspense>
  );
}

// Authentication wrapper component that layers the providers correctly
function AuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <OAuth2>
      {/* 
        DjombiAuthProvider is placed inside OAuth2 so it can:
        1. Access the AuthContext from OAuth2
        2. Automatically initialize when Adafri auth is successful
        3. Clear when Adafri auth is cleared
      */}
      <DjombiAuthProvider>
        <DjombiAuthLoader>
          <SearchProvider>
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ProviderErrorBoundary>
          <QueryProvider>
            <HotjarInitializer />
            <AuthWrapper>
              {children}
            </AuthWrapper>
            <Toaster richColors />
          </QueryProvider>
        </ProviderErrorBoundary>
      </body>
    </html>
  );
}
































// import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
// import "./globals.css";
// import { Suspense } from 'react';

// // Import all components directly to avoid dynamic import issues
// import QueryProvider from "@/components/providers/QueryProviders";
// import { Toaster } from "@/components/ui/sonner";
// import OAuth2 from "@/components/auth/oauth2";
// import SearchProvider from "@/components/FeaturesSearch/SearchProvider";
// import { HotjarInitializer } from "@/components/HotjarInitializer";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// export const metadata: Metadata = {
//   title: "Djombi",
//   description: "Djombi App",
// };

// // Error boundary component for better error handling
// function ProviderErrorBoundary({ children }: { children: React.ReactNode }) {
//   return (
//     <Suspense fallback={<div>Loading...</div>}>
//       {children}
//     </Suspense>
//   );
// }

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <body
//         className={`${geistSans.variable} ${geistMono.variable} antialiased`}
//       >
//         <ProviderErrorBoundary>
//           <QueryProvider>
//             <HotjarInitializer />
//             <OAuth2>
//               <SearchProvider>
//                 {children}
//               </SearchProvider>
//             </OAuth2>
//             <Toaster richColors />
//           </QueryProvider>
//         </ProviderErrorBoundary>
//       </body>
//     </html>
//   );
// }















































// import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
// import "./globals.css";
// // import "./awc.css";
// import QueryProvider from "@/components/providers/QueryProviders";
// import { Toaster } from "@/components/ui/sonner";
// import { HotjarInitializer } from "@/components/HotjarInitializer";
// import OAuth2 from "@/components/auth/oauth2";
// import SearchProvider from "@/components/FeaturesSearch/SearchProvider";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// export const metadata: Metadata = {
//   title: "Djombi",
//   description: "Djombi App",
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//         <html lang="en">
//           <body
//             className={`${geistSans.variable} ${geistMono.variable} antialiased`}
//           >
//               <QueryProvider>
//                 <HotjarInitializer />
//                 <OAuth2>
//                   <SearchProvider>
//                     {children}
//                   </SearchProvider>
//                 </OAuth2>
//                 <Toaster richColors />
//               </QueryProvider>
//           </body>
//         </html>
//   );
// }
