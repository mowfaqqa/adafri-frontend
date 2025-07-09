import { useEffect, useRef, useCallback } from 'react';
import { getSelectedLinkedEmail } from '@/lib/utils/cookies';

interface EmailAccountChangeDetail {
  emailId: string;
  type: string | null;
  email: string;
  accountType: string;
}

interface UseEmailAccountListenerProps {
  onEmailAccountChange?: (detail: EmailAccountChangeDetail) => void;
  onRefreshNeeded?: () => void;
}

export const useEmailAccountListener = ({ 
  onEmailAccountChange, 
  onRefreshNeeded 
}: UseEmailAccountListenerProps = {}) => {
  
  // FIXED: Use refs to store callbacks to prevent effect re-runs
  const onEmailAccountChangeRef = useRef(onEmailAccountChange);
  const onRefreshNeededRef = useRef(onRefreshNeeded);
  
  // FIXED: Update refs when callbacks change without triggering effect
  useEffect(() => {
    onEmailAccountChangeRef.current = onEmailAccountChange;
  }, [onEmailAccountChange]);
  
  useEffect(() => {
    onRefreshNeededRef.current = onRefreshNeeded;
  }, [onRefreshNeeded]);

  useEffect(() => {
    const handleEmailAccountChange = (event: CustomEvent<EmailAccountChangeDetail>) => {
      console.log('Email account changed:', event.detail);
      
      // FIXED: Use refs to call current callbacks
      if (onEmailAccountChangeRef.current) {
        onEmailAccountChangeRef.current(event.detail);
      }
      
      if (onRefreshNeededRef.current) {
        onRefreshNeededRef.current();
      }
    };

    // Listen for email account change events
    window.addEventListener('emailAccountChanged', handleEmailAccountChange as EventListener);

    return () => {
      window.removeEventListener('emailAccountChanged', handleEmailAccountChange as EventListener);
    };
  }, []); // FIXED: Empty dependency array - only runs once

  // FIXED: Memoize helper function to prevent unnecessary re-renders
  const getCurrentSelectedEmail = useCallback(() => {
    return getSelectedLinkedEmail();
  }, []);

  return {
    getCurrentSelectedEmail
  };
};