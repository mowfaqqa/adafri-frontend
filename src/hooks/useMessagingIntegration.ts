import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/lib/context/auth';
import useAuthStore from '@/lib/store/messaging/authStore';
import socketClient from '@/lib/socket/messagingSocketClient/socketClient';
import Cookies from 'js-cookie';
import config from '@/lib/config/messaging';

/**
 * This hook integrates the main application's auth with the messaging subsystem
 * It handles token sharing, user synchronization and socket connection
 */
export const useMessagingIntegration = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Main application auth
  const { token, user, isAuthenticated } = useContext(AuthContext);
  
  // Messaging auth
  const { 
    initialize, 
    isAuthenticated: isMessagingAuthenticated,
    user: messagingUser
  } = useAuthStore();

  // Effect to initialize messaging when main app auth changes
  useEffect(() => {
    const initializeMessaging = async () => {
      if (isAuthenticated && token && !isMessagingAuthenticated) {
        try {
          setIsInitializing(true);
          setError(null);
          
          // Initialize messaging with the main app token
          const success = await initialize(token.access_token);
          
          if (success) {
            setIsInitialized(true);
          } else {
            setError('Failed to initialize messaging');
          }
        } catch (err) {
          console.error('Error initializing messaging:', err);
          setError(err instanceof Error ? err.message : 'Unknown error initializing messaging');
        } finally {
          setIsInitializing(false);
        }
      } else if (!isAuthenticated) {
        // If main app is not authenticated, reset messaging
        if (isInitialized) {
          // Disconnect socket
          socketClient.disconnect();
          
          // Clear tokens
          localStorage.removeItem('messaging_token');
          Cookies.remove(config.tokenCookieName);
          
          setIsInitialized(false);
        }
        
        setIsInitializing(false);
      }
    };

    initializeMessaging();
  }, [isAuthenticated, token, isMessagingAuthenticated, initialize, isInitialized]);

  return {
    isMessagingInitialized: isInitialized,
    isMessagingInitializing: isInitializing,
    isMessagingAuthenticated,
    messagingError: error,
    messagingUser,
    mainUser: user
  };
};

export default useMessagingIntegration;
