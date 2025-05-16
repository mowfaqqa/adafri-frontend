"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import useMessagingIntegration from '@/hooks/useMessagingIntegration';
import Spinner from '@/components/custom-ui/modal/custom-spinner';
import MessagingLayout from '@/components/CollaborativeMessaging/chat/MessagingLayout';

const MessagingPage: React.FC = () => {
  const router = useRouter();
  
  // Use our integration hook to ensure authentication is properly set up
  const { 
    isMessagingInitialized,
    isMessagingInitializing, 
    isMessagingAuthenticated,
    messagingError
  } = useMessagingIntegration();
  
  // If still initializing, show loading spinner
  if (isMessagingInitializing) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Initializing messaging...</p>
        </div>
      </div>
    );
  }
  
  // If there was an error initializing, show error message
  if (messagingError && !isMessagingAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-4">Authentication Error</h2>
          <p className="text-gray-700 mb-6">{messagingError}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isMessagingAuthenticated) {
    // Use a React effect for client-side redirect
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      router.push('/auth/login');
    }, [router]);
    
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }
  
  // Authenticated and initialized, render the messaging layout
  return <MessagingLayout />;
};

export default MessagingPage;