"use client";

import { useEffect } from "react";
import ChatLayout from "@/components/CollaborativeMessaging/chat/ChatLayout";
import useAuthStore from "@/lib/store/messaging/authStore";
import useModalStore from "@/lib/store/messaging/modalStore";
import { useRouter } from "next/navigation";
import Spinner from "@/components/custom-ui/modal/custom-spinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function MessagesPage() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { openModal } = useModalStore();
  const router = useRouter();

  useEffect(() => {
    // If not authenticated and not loading, redirect to home or show login modal
    if (!isAuthenticated && !isLoading) {
      openModal("login", { redirectPath: "/dashboard/messaging" });
    }
  }, [isAuthenticated, isLoading, router, openModal]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Only render chat layout if authenticated
  if (!isAuthenticated) {
    return (
      // <ProtectedRoute>
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-4">Please log in</h1>
            <p className="text-gray-500">
              You need to be logged in to view messages
            </p>
          </div>
        </div>
      // </ProtectedRoute>
    );
  }

  return <ChatLayout />;
}

