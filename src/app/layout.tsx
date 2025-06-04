import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import "./awc.css";
import QueryProvider from "@/components/providers/QueryProviders";
import { Toaster } from "@/components/ui/sonner";
import { HotjarInitializer } from "@/components/HotjarInitializer";
import OAuth2 from "@/components/auth/oauth2";
import SearchProvider from "@/components/FeaturesSearch/SearchProvider";

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
              <QueryProvider>
                <HotjarInitializer />
                <OAuth2>
                  <SearchProvider>
                    {children}
                  </SearchProvider>
                </OAuth2>
                <Toaster richColors />
              </QueryProvider>
          </body>
        </html>
  );
}
