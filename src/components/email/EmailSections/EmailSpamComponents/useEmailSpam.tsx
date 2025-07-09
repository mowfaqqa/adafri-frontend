import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { Email } from "@/lib/types/email";
import { useEmailStore } from "@/store/email-store";
import { getSelectedLinkedEmailId, getSelectedLinkedEmailType, getSelectedLinkedEmail } from "@/lib/utils/cookies";
import { AuthContext } from "@/lib/context/auth";
import { useCombinedAuth } from "@/components/providers/useCombinedAuth";
import emailApiService from "@/lib/services/emailApiService";

export const useEmailSpam = () => {
  // Use email store following EmailSent pattern
  const { 
    emails, 
    isLoading, 
    loadingError, 
    fetchEmails,
    setActiveCategory,
    activeCategory,
    refreshCurrentCategory,
    moveEmailToCategory
  } = useEmailStore();
  
  const { token, user } = useContext(AuthContext);
  const { djombi } = useCombinedAuth();
  const djombiTokens = djombi.token || "";
  
  // Local state for UI only - following EmailSent pattern
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Track component state without causing re-renders - following EmailSent pattern
  const isInitialized = useRef(false);
  const currentEmailId = useRef<string | null>(null);
  const hasLoadedSpamEmails = useRef(false);

  // Enhanced refresh function that resets cache - following EmailSent pattern
  const handleRefresh = useCallback(() => {
    console.log('Manual refresh triggered for spam emails');
    setIsRefreshing(true);
    hasLoadedSpamEmails.current = false; // Reset to allow fresh fetch
    
    // Use the store's refresh method to maintain consistency
    refreshCurrentCategory();
    
    // Reset refreshing state after a delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, [refreshCurrentCategory]);

  // Single initialization effect - following EmailSent pattern
  useEffect(() => {
    if (!isInitialized.current) {
      console.log('EmailSpam component initializing');
      setMounted(true);
      setActiveCategory('spam');
      isInitialized.current = true;
      
      // Get initial email ID
      const emailId = getSelectedLinkedEmailId();
      currentEmailId.current = emailId;
      console.log('Initial email ID for spam:', emailId);
    }
  }, []); // Empty deps - only run once

  // Listen for changes in emails array to refresh display - following EmailSent pattern
  useEffect(() => {
    const spamEmails = emails.filter(email => 
      email.status === "spam" || email.category === "spam"
    );
    
    // If we have spam emails but haven't loaded them before, mark as loaded
    if (spamEmails.length > 0 && !hasLoadedSpamEmails.current) {
      console.log('Found spam emails in store, marking as loaded');
      hasLoadedSpamEmails.current = true;
    }
  }, [emails]); // React to changes in emails array

  // Separate effect for fetching emails with better conditions - following EmailSent pattern
  useEffect(() => {
    const emailId = getSelectedLinkedEmailId();
    const emailType = getSelectedLinkedEmailType();
    
    // Check if email account changed
    const emailChanged = currentEmailId.current !== emailId;
    if (emailChanged) {
      console.log('Email account changed, resetting spam emails cache');
      currentEmailId.current = emailId;
      hasLoadedSpamEmails.current = false; // Reset cache on email change
    }
    
    // Only fetch if all conditions are met and we haven't loaded yet
    const shouldFetch = (
      isInitialized.current &&
      activeCategory === 'spam' &&
      emailId && 
      djombiTokens && 
      !isLoading &&
      !hasLoadedSpamEmails.current // Only fetch once per email account
    );

    if (shouldFetch) {
      console.log('Fetching spam emails:', {
        emailId: emailId?.substring(0, 20) + '...',
        emailType,
        activeCategory,
        hasLoadedBefore: hasLoadedSpamEmails.current
      });
      
      hasLoadedSpamEmails.current = true; // Mark as loaded
      fetchEmails('spam', false); // Don't force refresh on initial load
    } else {
      console.log('Skipping spam emails fetch:', {
        isInitialized: isInitialized.current,
        activeCategory,
        hasEmailId: !!emailId,
        hasToken: !!djombiTokens,
        isLoading,
        hasLoaded: hasLoadedSpamEmails.current
      });
    }
  }, [activeCategory, djombiTokens, isLoading, fetchEmails]);

  // Get spam emails from store - following EmailSent pattern
  const getSpamEmails = useCallback(() => {
    return emails.filter(email => 
      email.status === "spam" || email.category === "spam"
    );
  }, [emails]);

  // Handle moving email from spam to inbox using EmailApiService pattern
  const handleMoveToInbox = useCallback(async (emailId: string) => {
    try {
      console.log(`Moving email ${emailId} from spam to inbox...`);
      
      // Use the store's moveEmailToCategory method which uses EmailApiService internally
      moveEmailToCategory(emailId, 'inbox');
      
      console.log(`Email ${emailId} moved to inbox successfully`);
      
    } catch (error) {
      console.error('Error moving email to inbox:', error);
      throw error; // Re-throw to handle in UI
    }
  }, [moveEmailToCategory]);

  // Get current email selection info for debugging
  const getCurrentEmailSelection = useCallback(() => {
    const selectedEmail = getSelectedLinkedEmail();
    return {
      id: selectedEmail?.id ? selectedEmail.id.substring(0, 20) + '...' : 'None',
      type: selectedEmail?.type || 'None'
    };
  }, []);

  // Return values following EmailSent pattern
  return {
    uniqueSpamEmails: getSpamEmails(),
    isLoading,
    error: loadingError,
    isRefreshing,
    handleRefresh,
    handleMoveToInbox,
    mounted,
    // Additional debugging info
    currentEmailSelection: getCurrentEmailSelection(),
    hasLoadedSpamEmails: hasLoadedSpamEmails.current
  };
};











































// 29/6/2025 03:00
// import { useState, useEffect, useContext, useCallback } from "react";
// import { Email } from "@/lib/types/email";
// import { useEmailStore } from "@/lib/store/email-store";
// import { getCookie } from "@/lib/utils/cookies";
// import { AuthContext } from "@/lib/context/auth";
// import axios from "axios";
// import { useCombinedAuth } from "@/components/providers/useCombinedAuth";
// import { DjombiProfileService } from "@/lib/services/DjombiProfileService";

// // Helper function to get Djombi access token
// const getDjombiAccessToken = (): string | null => {
//   // First try from DjombiProfileService
//   const { accessToken } = DjombiProfileService.getStoredDjombiTokens();
//   if (accessToken) {
//     return accessToken;
//   }
  
//   // Fallback to localStorage directly
//   if (typeof window !== 'undefined') {
//     const storedToken = localStorage.getItem('djombi_access_token');
//     if (storedToken) {
//       return storedToken;
//     }
//   }
  
//   return null;
// };

// // Helper function to get linked email ID
// const getLinkedEmailId = (): string | null => {
//   // First try cookies
//   const emailIdFromCookie = getCookie('linkedEmailId');
//   if (emailIdFromCookie) {
//     return emailIdFromCookie;
//   }
  
//   // Then try localStorage
//   if (typeof window !== 'undefined') {
//     const emailIdFromStorage = localStorage.getItem('linkedEmailId');
//     if (emailIdFromStorage) {
//       return emailIdFromStorage;
//     }
//   }
  
//   return null;
// };

// export const useEmailSpam = () => {
//   const { emails, addEmail } = useEmailStore();
  
//   // Move all hooks to the top level of the custom hook
//   const { token, user } = useContext(AuthContext);
//   const { djombi } = useCombinedAuth();
  
//   const [apiSpamEmails, setApiSpamEmails] = useState<Email[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   // Helper function to process response data
//   const processResponseData = useCallback((data: any) => {
//     console.log("Processing spam response data:", data);
    
//     // Check if data contains emails (handle different response structures)
//     let emailsData: any[] = [];
    
//     if (Array.isArray(data)) {
//       emailsData = data;
//     } else if (data.data && Array.isArray(data.data)) {
//       emailsData = data.data;
//     } else if (data.spam && Array.isArray(data.spam)) {
//       emailsData = data.spam;
//     } else if (data.emails && Array.isArray(data.emails)) {
//       emailsData = data.emails;
//     } else {
//       console.log("Response structure different than expected:", data);
//       // Look for any array in the response that might contain emails
//       for (const key in data) {
//         if (Array.isArray(data[key]) && data[key].length > 0) {
//           console.log(`Found array in response at key: ${key}`, data[key]);
//           emailsData = data[key];
//           break;
//         }
//       }
//     }
    
//     if (emailsData.length === 0) {
//       console.log("No spam emails found in the response");
//       setApiSpamEmails([]);
//       return;
//     }
    
//     console.log("Sample email data structure:", emailsData[0]);
//     console.log(`Found ${emailsData.length} spam emails in response`);
    
//     // First, filter out invalid emails, then map them to the correct structure
//     const validEmailsData = emailsData.filter(email => email && typeof email === 'object');
    
//     // Now map the valid emails to the correct structure
//     const formattedEmails: Email[] = validEmailsData.map((email: any): Email => {
//       return {
//         id: email.id || email._id || `spam-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
//         subject: email.subject || 'No Subject',
//         content: email.content || '',
//         contentType: email.contentType || 'text',
//         from: email.from || email.sender || 'Unknown Sender',
//         to: email.to || email.recipient || '',
//         timestamp: email.timestamp || email.createdAt || email.created_at || new Date().toISOString(),
//         status: "read",
//         isUrgent: Boolean(email.isUrgent || email.is_urgent || false),
//         hasAttachment: Boolean(email.hasAttachment || email.has_attachment || false),
//         category: "spam",
//         isRead: true,
//         email_id: email.email_id || null
//       };
//     });
    
//     console.log(`Processed ${formattedEmails.length} spam emails`);
    
//     // Add to email store first
//     formattedEmails.forEach(email => {
//       // Check if email already exists in store to prevent duplicates
//       const exists = emails.some(e => e.id === email.id);
//       if (!exists) {
//         addEmail({
//           ...email,
//         });
//       }
//     });
    
//     setApiSpamEmails(formattedEmails);
//   }, [emails, addEmail]);
  
//   // Use useCallback to memoize the function and include dependencies
//   const fetchSpamEmails = useCallback(async () => {
//     setIsLoading(true);
//     setError(null);
    
//     try {
//       console.log("Starting fetchSpamEmails...");

//       // Get Djombi access token using utility function
//       const djombiToken = getDjombiAccessToken();
//       console.log("Djombi token retrieved:", djombiToken ? `${djombiToken.substring(0, 10)}...` : 'No Djombi token found');
      
//       if (!djombiToken) {
//         throw new Error('No Djombi access token available. Please log in again.');
//       }
      
//       // Get linked email ID using utility function
//       const linkedEmailId = getLinkedEmailId();
//       console.log("Linked Email ID:", linkedEmailId);
      
//       if (!linkedEmailId) {
//         console.log("Checking localStorage for linkedEmailId...");
//         if (typeof window !== 'undefined') {
//           const storageKeys = Object.keys(localStorage);
//           console.log("Available localStorage keys:", storageKeys);
//           console.log("linkedEmailId value:", localStorage.getItem('linkedEmailId'));
//         }
//         throw new Error('No linked email ID found. Please link your email first.');
//       }
      
//       // Use axios with proper URL encoding and parameters
//       const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/spam?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//       console.log("Fetching from API endpoint:", apiEndpoint);
      
//       const response = await axios.get(apiEndpoint, {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${djombiToken}` // Use Djombi token
//         }
//       });
      
//       console.log("GET response status:", response.status);
//       console.log("GET response data:", response.data);
      
//       // Check for success/error in response
//       if (response.data.success === false) {
//         const errorMessage = response.data.message || 'API request failed';
//         console.error("API error:", errorMessage);
//         throw new Error(`API error: ${errorMessage}`);
//       }
      
//       processResponseData(response.data);
//     } catch (err) {
//       console.error('Failed to fetch spam emails:', err);
      
//       // Enhanced error logging
//       if (err instanceof Error) {
//         console.error('Error details:', {
//           message: err.message,
//           name: err.name,
//           stack: err.stack
//         });
//       }
      
//       if (axios.isAxiosError(err)) {
//         console.error('Axios error details:', {
//           status: err.response?.status,
//           statusText: err.response?.statusText,
//           data: err.response?.data,
//           headers: err.response?.headers
//         });
//       }
      
//       setError(err instanceof Error ? err.message : 'Failed to fetch spam emails');
      
//       // Fallback to local data if API fails
//       const localSpamEmails = emails.filter(email => email.category === "spam");
//       if (localSpamEmails.length > 0) {
//         console.log("Using local spam emails as fallback");
//         setApiSpamEmails(localSpamEmails);
//       } else {
//         setApiSpamEmails([]);
//       }
//     } finally {
//       setIsLoading(false);
//       setIsRefreshing(false);
//     }
//   }, [token, djombi.token, emails, processResponseData]);
  
//   // Handle moving email from spam to inbox
//   const handleMoveToInbox = useCallback(async (emailId: string) => {
//     try {
//       // Get Djombi access token
//       const djombiToken = getDjombiAccessToken();
      
//       if (!djombiToken) {
//         throw new Error('No Djombi access token found');
//       }
      
//       // Get linked email ID
//       const linkedEmailId = getLinkedEmailId();
      
//       if (!linkedEmailId) {
//         throw new Error('No linked email ID found');
//       }

//       console.log(`Moving email ${emailId} from spam to inbox...`);

//       // Make API call to move email from spam to inbox
//       const response = await axios.post(
//         `https://email-service-latest-agqz.onrender.com/api/v1/emails/move`,
//         {
//           email_id: linkedEmailId,
//           message_id: emailId,
//           from_folder: 'spam',
//           to_folder: 'inbox'
//         },
//         {
//           headers: {
//             'Authorization': `Bearer ${djombiToken}`, // Use Djombi token
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       console.log(`Email ${emailId} moved to inbox successfully:`, response.data);
      
//       // Update local state - remove from spam emails
//       setApiSpamEmails(prev => prev.filter(email => email.id !== emailId));
      
//       // Combine spam emails from store and API to find the email
//       const allSpamEmails = [
//         ...emails.filter(email => email.category === "spam"),
//         ...apiSpamEmails
//       ];
      
//       const emailToUpdate = allSpamEmails.find(email => email.id === emailId);
//       if (emailToUpdate) {
//         addEmail({
//           ...emailToUpdate,
//           status: "inbox",
//         //   category: "inbox"
//         });
//       }

//     } catch (error) {
//       console.error('Error moving email to inbox:', error);
      
//       if (axios.isAxiosError(error)) {
//         console.error('Move email error details:', {
//           status: error.response?.status,
//           statusText: error.response?.statusText,
//           data: error.response?.data
//         });
//       }
      
//       throw error; // Re-throw to handle in UI
//     }
//   }, [emails, apiSpamEmails, addEmail]);

//   const handleRefresh = useCallback(() => {
//     setIsRefreshing(true);
//     fetchSpamEmails();
//   }, [fetchSpamEmails]);

//   useEffect(() => {
//     fetchSpamEmails();
//   }, [fetchSpamEmails]);

//   // Combine spam emails from store and API
//   const allSpamEmails = [
//     ...emails.filter(email => email.category === "spam"),
//     ...apiSpamEmails
//   ];
  
//   // Remove duplicates by id
//   const uniqueSpamEmails = allSpamEmails.filter(
//     (email, index, self) => 
//       index === self.findIndex(e => e.id === email.id)
//   );

//   return {
//     uniqueSpamEmails,
//     isLoading,
//     error,
//     isRefreshing,
//     handleRefresh,
//     handleMoveToInbox
//   };
// };