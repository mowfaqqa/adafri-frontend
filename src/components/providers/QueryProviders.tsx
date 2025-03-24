"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthProvider from "../CollaborativeMessaging/auth/AuthProvider";

interface QueryProviderProps {
  children: React.ReactNode;
}

const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5 minutes
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
};

export default QueryProvider;
