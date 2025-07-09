import { Email, EmailCategory, EmailSegment } from "@/lib/types/email";
import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { 
  getCookie, 
  getAuthToken, 
  getSelectedLinkedEmailId, 
  getSelectedLinkedEmailType,
  getSelectedLinkedEmail,
  setSelectedLinkedEmail 
} from "@/lib/utils/cookies";
import { DjombiProfileService } from "@/lib/services/DjombiProfileService";

// Helper function to get Djombi access token
const getDjombiAccessToken = (): string | null => {
  try {
    // First try from DjombiProfileService
    const { accessToken } = DjombiProfileService.getStoredDjombiTokens();
    if (accessToken) {
      return accessToken;
    }
    
    // Fallback to localStorage directly
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('djombi_access_token');
      if (storedToken) {
        return storedToken;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error getting Djombi access token:", error);
    return null;
  }
};

// Updated helper function to get linked email ID using cookies
const getLinkedEmailId = (): string | null => {
  try {
    // Use the proper cookie function for selected linked email ID
    const selectedEmailId = getSelectedLinkedEmailId();
    if (selectedEmailId) {
      return selectedEmailId;
    }
    
    // Fallback to old methods for backward compatibility
    const emailIdFromCookie = getCookie('linkedEmailId');
    if (emailIdFromCookie) {
      return emailIdFromCookie;
    }
    
    // Last resort - localStorage (but this should be replaced)
    if (typeof window !== 'undefined') {
      const emailIdFromStorage = localStorage.getItem('linkedEmailId');
      if (emailIdFromStorage) {
        return emailIdFromStorage;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error getting linked email ID:", error);
    return null;
  }
};

// Helper function to get auth items using Djombi tokens and proper email selection
const getAuthFromStorage = () => {
  return {
    djombiToken: getDjombiAccessToken(),
    linkedEmailId: getLinkedEmailId(),
    selectedEmailType: getSelectedLinkedEmailType(),
    regularToken: getAuthToken() // Keep for comparison
  };
};

interface EmailStore {
  // Draft email state
  draftEmail: any;

  // Main email data
  emails: Email[];

  // UI state
  customSegments: string[];
  activeCategory: EmailCategory;
  isLoading: boolean;
  loadingError: string | null;
  
  // Add current selected email info
  selectedEmailId: string | null;
  selectedEmailType: string | null;

  // Add refresh tracking
  lastFetch: Record<string, number>;
  
  // Actions
  fetchEmails: (category: EmailCategory, forceRefresh?: boolean) => Promise<void>;
  addEmail: (emailData: Omit<Email, "id" | "timestamp" | "isUrgent" | "category">) => void;
  moveEmail: (emailId: string, segment: EmailSegment) => void;
  moveEmailToCategory: (emailId: string, category: EmailCategory) => void;
  addSegment: (name: string) => void;
  setActiveCategory: (category: EmailCategory) => void;
  deleteEmail: (id: string) => void;
  saveDraft: (draft: Partial<Email>) => void;
  updateDraft: (data: any) => void;
  removeEmail: (id: string) => void;
  
  // New actions for email type switching
  updateSelectedEmail: (emailId: string, emailType: string | null) => void;
  refreshCurrentCategory: () => void;
}

export const useEmailStore = create<EmailStore>((set, get) => ({
  emails: [],
  customSegments: [],
  activeCategory: "inbox",
  draftEmail: null,
  isLoading: false,
  loadingError: null,
  selectedEmailId: null,
  selectedEmailType: null,
  lastFetch: {},

  // Update selected email and refresh current category
  updateSelectedEmail: (emailId: string, emailType: string | null) => {
    // Update cookies
    setSelectedLinkedEmail(emailId, emailType);
    
    // Update store state
    set({ 
      selectedEmailId: emailId, 
      selectedEmailType: emailType 
    });
    
    // Refresh current category with new email selection
    const currentCategory = get().activeCategory;
    console.log(`Email selection changed to ${emailType} (${emailId}), refreshing ${currentCategory} emails`);
    
    // Clear emails for current category to show fresh data
    set((state) => ({
      emails: state.emails.filter(email => 
        email.category !== currentCategory && email.status !== currentCategory
      )
    }));
    
    // Fetch emails for the current category with new email selection
    get().fetchEmails(currentCategory, true);
  },

  // Refresh current category
  refreshCurrentCategory: () => {
    const currentCategory = get().activeCategory;
    get().fetchEmails(currentCategory, true);
  },

  // Fetch emails from API based on category
  fetchEmails: async (category, forceRefresh = false) => {
    const state = get();
    
    // Update selected email info from cookies
    const selectedEmail = getSelectedLinkedEmail();
    if (selectedEmail) {
      set({ 
        selectedEmailId: selectedEmail.id, 
        selectedEmailType: selectedEmail.type 
      });
    }
    
    // Prevent concurrent fetches of the same category
    if (state.isLoading && !forceRefresh) {
      console.log(`Already fetching ${category} emails, skipping...`);
      return;
    }

    // Check if we need to refresh (avoid fetching too frequently)
    const cacheKey = `${category}_${selectedEmail?.id || 'no_email'}`;
    const lastFetchTime = state.lastFetch[cacheKey] || 0;
    const timeSinceLastFetch = Date.now() - lastFetchTime;
    const MINIMUM_FETCH_INTERVAL = 3000; // 3 seconds
    
    if (!forceRefresh && timeSinceLastFetch < MINIMUM_FETCH_INTERVAL) {
      console.log(`Skipping ${category} fetch for ${selectedEmail?.type || 'unknown'} email, too soon since last fetch`);
      return;
    }

    // Set loading state
    set({ isLoading: true, loadingError: null });

    try {
      // Get authentication details using updated functions
      const linkedEmailId = getLinkedEmailId();
      const djombiToken = getDjombiAccessToken();
      const emailType = getSelectedLinkedEmailType();
      
      console.log("Fetching emails with:", {
        category,
        emailType: emailType || 'no type',
        linkedEmailId: linkedEmailId ? `${linkedEmailId.substring(0, 20)}...` : 'Not found',
        djombiToken: djombiToken ? `${djombiToken.substring(0, 10)}...` : 'Not found'
      });

      // Validate authentication
      if (!linkedEmailId) {
        throw new Error("Email ID missing. Please select an email account in the dropdown.");
      }

      if (!djombiToken) {
        throw new Error("Authentication token missing. Please log in again.");
      }

      // Build the appropriate endpoint based on category
      const baseUrl = 'https://email-service-latest-agqz.onrender.com/api/v1/emails';
      let endpoint = '';

      switch (category) {
        case 'inbox':
          endpoint = `${baseUrl}/inbox`;
          break;
        case 'sent':
          endpoint = `${baseUrl}/sent`;
          break;
        case 'spam':
          endpoint = `${baseUrl}/spam`;
          break;
        case 'draft':
          endpoint = `${baseUrl}/drafts`;
          break;
        default:
          endpoint = `${baseUrl}/inbox`;
          break;
      }

      // Add query parameters - FIXED: use offset=1 instead of offset=0
      const params = new URLSearchParams({
        email_id: linkedEmailId,
        offset: '1', // Fixed: Changed from '1' to '0'
        limit: '20' // Increased limit to get more emails
      });

      const fullUrl = `${endpoint}?${params.toString()}`;
      console.log(`Fetching ${category} emails for ${emailType || 'unknown'} account from:`, fullUrl);

      // Make API request with proper headers
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${djombiToken}`,
          'Accept': 'application/json'
        }
      });

      console.log(`API response for ${category} (${emailType}):`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Get response text first
      const responseText = await response.text();
      console.log(`Raw response for ${category} (${emailType}):`, responseText.substring(0, 500));

      // Parse JSON response
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
      }

      // Handle HTTP errors
      if (!response.ok) {
        console.error(`HTTP error for ${category} (${emailType}):`, response.status, data);
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        } else if (response.status === 403) {
          throw new Error("Access denied. Please check your permissions.");
        } else if (response.status === 404) {
          // 404 might mean no emails found, which is OK
          console.log(`No ${category} emails found for ${emailType} account (404)`);
          processEmailData([], category, emailType);
          return;
        } else {
          throw new Error(`Server error (${response.status}): ${data.message || response.statusText}`);
        }
      }

      // Handle API success/error flags
      if (data.success === false) {
        const errorMessage = data.message || data.error || 'API request failed';
        console.error("API returned error:", errorMessage);
        
        // Check if it's a "no emails" scenario
        if (errorMessage.toLowerCase().includes('no') && 
            (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('found'))) {
          console.log(`API says no ${category} emails found for ${emailType} account`);
          processEmailData([], category, emailType);
          return;
        }
        
        throw new Error(errorMessage);
      }

      // Process successful response
      console.log(`Successfully fetched ${category} data for ${emailType} account:`, data);
      processEmailData(data, category, emailType);

    } catch (error) {
      console.error(`Error fetching ${category} emails:`, error);
      set({
        isLoading: false,
        loadingError: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
    
    // Helper function to process email data from API response
    function processEmailData(data: any, category: EmailCategory, emailType: string | null) {
      console.log(`Processing ${category} email data for ${emailType} account:`, data);
      
      // Initialize emails array
      let emailsData: any[] = [];
      
      // Try to extract emails from various possible response structures
      if (Array.isArray(data)) {
        emailsData = data;
      } else if (data && typeof data === 'object') {
        // Try common property names
        const possibleArrayKeys = [
          'data', 'emails', 'messages', 'items', 'results', 'content',
          category, // Try the category name itself
          `${category}s`, // Try pluralized category
          'inbox', 'sent', 'drafts', 'spam'
        ];
        
        for (const key of possibleArrayKeys) {
          if (data[key] && Array.isArray(data[key])) {
            emailsData = data[key];
            console.log(`Found emails array at key: ${key}`);
            break;
          }
        }
        
        // If still no array found, look for any array property
        if (emailsData.length === 0) {
          for (const key in data) {
            if (Array.isArray(data[key]) && data[key].length > 0) {
              emailsData = data[key];
              console.log(`Found emails array at unexpected key: ${key}`);
              break;
            }
          }
        }
      }

      console.log(`Extracted ${emailsData.length} raw email items for ${category} (${emailType})`);

      // Process and normalize email data
      const processedEmails: Email[] = emailsData.map((item: any, index: number) => {
        // Generate a unique ID if none exists
        const emailId = item.id || 
                       item.email_id || 
                       item._id || 
                       item.messageId || 
                       item.message_id || 
                       `${category}-${emailType}-${Date.now()}-${index}`;

        const email: Email = {
          id: emailId,
          email_id: item.email_id || emailId,
          from: item.from || item.sender || item.From || "unknown@example.com",
          to: item.to || item.recipient || item.To || item.recipients || "",
          subject: item.subject || item.Subject || item.title || "(No Subject)",
          content: item.content || item.body || item.Body || item.text || item.textContent || item.htmlContent || "",
          timestamp: item.timestamp || item.createdAt || item.created_at || item.date || item.Date || new Date().toISOString(),
          createdAt: item.created_at || item.createdAt || item.timestamp || Date.now(),
          isUrgent: Boolean(item.isUrgent || item.is_urgent || item.urgent || item.priority === 'high'),
          hasAttachment: Boolean(item.hasAttachment || item.has_attachment || item.attachments?.length > 0),
          status: category,
          category: category,
          isRead: Boolean(item.isRead || item.is_read || item.read || category === 'sent' || category === 'draft'),
          contentType: item.contentType || item.content_type || item.type || 'text'
        };
        
        return email;
      });

      console.log(`Processed ${processedEmails.length} ${category} emails for ${emailType} account`);

      // Update store state
      set((state) => {
        // Remove existing emails of this category
        const otherEmails = state.emails.filter(email => 
          email.category !== category && email.status !== category
        );
        
        // Combine with new emails
        const allEmails = [...otherEmails, ...processedEmails];
        
        // Update last fetch time with email-specific cache key
        const cacheKey = `${category}_${getSelectedLinkedEmailId() || 'no_email'}`;
        const newLastFetch = {
          ...state.lastFetch,
          [cacheKey]: Date.now()
        };
        
        console.log(`Updated store: ${processedEmails.length} new ${category} emails for ${emailType}, ${allEmails.length} total`);
        
        return {
          emails: allEmails,
          isLoading: false,
          loadingError: null,
          lastFetch: newLastFetch
        };
      });
    }
  },

  // Add a new email
  addEmail: (emailData) => {
    const newEmail: Email = {
      ...emailData,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      isUrgent: false,
      category: emailData.status || get().activeCategory,
      status: emailData.status || get().activeCategory,
      isRead: emailData.status === 'sent' || emailData.status === 'draft',
      // Ensure all required fields from Email interface are set
      from: emailData.from || "",
      to: emailData.to || "",
      subject: emailData.subject || "",
      content: emailData.content || "",
      hasAttachment: emailData.hasAttachment || false,
      contentType: emailData.contentType || 'text',
      createdAt: Date.now()
    };

    // Add to local state immediately for better UX
    set((state) => ({
      emails: [...state.emails, newEmail],
    }));

    console.log("Added email to store:", newEmail);

    // Send to API if it's not a draft
    if (emailData.status !== "draft") {
      const { djombiToken, linkedEmailId } = getAuthFromStorage();

      if (djombiToken && linkedEmailId) {
        console.log("Sending email via API...");
        fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${djombiToken}`,
          },
          body: JSON.stringify({
            to: newEmail.to,
            subject: newEmail.subject,
            content: newEmail.content,
            email_id: linkedEmailId
          })
        })
        .then(async (response) => {
          const responseText = await response.text();
          console.log("Send email response:", response.status, responseText);
          
          if (response.ok) {
            console.log("Email sent successfully");
            // Refresh sent emails after successful send
            setTimeout(() => {
              get().fetchEmails('sent', true);
            }, 1000);
          } else {
            console.error("Failed to send email:", response.status, responseText);
          }
        })
        .catch(error => {
          console.error("Error sending email:", error);
        });
      }
    }
  },

  // Move email between segments (urgent, all)
  moveEmail: (emailId, segment) =>
    set((state) => ({
      emails: state.emails.map((email) =>
        email.id === emailId
          ? { ...email, isUrgent: segment === "urgent" }
          : email
      ),
    })),

  // Move email between categories (inbox, sent, draft, etc.)
  moveEmailToCategory: (emailId, category) => {
    // Update local state
    set((state) => ({
      emails: state.emails.map((email) =>
        email.id === emailId
          ? { ...email, status: category, category: category }
          : email
      ),
    }));

    // Update via API
    const { djombiToken, linkedEmailId } = getAuthFromStorage();

    if (djombiToken && linkedEmailId) {
      fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/${emailId}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${djombiToken}`,
        },
        body: JSON.stringify({ 
          category,
          email_id: linkedEmailId
        })
      }).catch(error => {
        console.error("Error moving email:", error);
      });
    }
  },

  // Add a new segment
  addSegment: (name) =>
    set((state) => ({ customSegments: [...state.customSegments, name] })),

  // Set active category
  setActiveCategory: (category) => {
    set({ activeCategory: category });

    // Always fetch fresh emails for the category
    console.log(`Setting active category to ${category}, fetching emails...`);
    get().fetchEmails(category, true); // Force refresh when changing category
  },

  // Delete email
  deleteEmail: (id) => {
    // Remove from local state
    set((state) => ({
      emails: state.emails.filter((email) => email.id !== id),
    }));

    // Delete via API
    const { djombiToken, linkedEmailId } = getAuthFromStorage();

    if (djombiToken && linkedEmailId) {
      fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/${id}?email_id=${linkedEmailId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${djombiToken}`,
        }
      }).catch(error => {
        console.error("Error deleting email:", error);
      });
    }
  },

  // Save draft
  saveDraft: (draft: Partial<Email>) => {
    if (draft.id) {
      // Update existing draft
      set((state) => ({
        emails: state.emails.map((email) =>
          email.id === draft.id ? { ...email, ...draft } : email
        ),
      }));

      // Update via API
      const { djombiToken, linkedEmailId } = getAuthFromStorage();

      if (djombiToken && linkedEmailId) {
        fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/${draft.id}?email_id=${linkedEmailId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${djombiToken}`,
          },
          body: JSON.stringify({
            to: draft.to,
            subject: draft.subject,
            content: draft.content,
            email_id: linkedEmailId
          })
        }).catch(error => {
          console.error("Error updating draft:", error);
        });
      }
    } else {
      // Create new draft with all required Email properties
      const newDraft: Email = {
        ...draft,
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        status: "draft",
        category: "draft",
        isUrgent: false,
        hasAttachment: !!draft.hasAttachment,
        from: draft.from || "",
        to: draft.to || "",
        subject: draft.subject || "",
        content: draft.content || "",
        isRead: true,
        contentType: draft.contentType || 'text',
        createdAt: Date.now()
      };

      // Add to local state
      set((state) => ({
        emails: [...state.emails, newDraft],
      }));

      // Send to API
      const { djombiToken, linkedEmailId } = getAuthFromStorage();

      if (djombiToken && linkedEmailId) {
        fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${djombiToken}`,
          },
          body: JSON.stringify({
            to: newDraft.to,
            subject: newDraft.subject,
            content: newDraft.content,
            email_id: linkedEmailId
          })
        }).catch(error => {
          console.error("Error creating draft:", error);
        });
      }
    }
  },

  // Remove email from store
  removeEmail: (id: string) => {
    set((state) => ({
      emails: state.emails.filter((email) => email.id !== id)
    }));
  },

  // Update draft state
  updateDraft: (data) => {
    console.log("Updating draft state:", data);
    set({ draftEmail: data });
  },
}));















































// 6:30pm
// import { Email, EmailCategory, EmailSegment } from "@/lib/types/email";
// import { create } from "zustand";
// import { v4 as uuidv4 } from "uuid";
// import { getCookie, getAuthToken } from "@/lib/utils/cookies";
// import { DjombiProfileService } from "@/lib/services/DjombiProfileService";

// // Helper function to get linked email ID with priority order
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

// // Helper function to get auth items using the correct sources
// const getAuthFromStorage = () => {
//   return {
//     djombiToken: getDjombiAccessToken(),
//     linkedEmailId: getLinkedEmailId(),
//     regularToken: getAuthToken() // Keep for comparison/fallback
//   };
// };

// interface EmailStore {
//   // Draft email state
//   draftEmail: any;

//   // Main email data
//   emails: Email[];

//   // UI state
//   customSegments: string[];
//   activeCategory: EmailCategory;
//   isLoading: boolean;
//   loadingError: string | null;

//   // Actions
//   fetchEmails: (category: EmailCategory) => Promise<void>;
//   addEmail: (emailData: Omit<Email, "id" | "timestamp" | "isUrgent" | "category">) => void;
//   moveEmail: (emailId: string, segment: EmailSegment) => void;
//   moveEmailToCategory: (emailId: string, category: EmailCategory) => void;
//   addSegment: (name: string) => void;
//   setActiveCategory: (category: EmailCategory) => void;
//   deleteEmail: (id: string) => void;
//   saveDraft: (draft: Partial<Email>) => void;
//   updateDraft: (data: any) => void;
//   removeEmail: (id: string) => void;
// }

// export const useEmailStore = create<EmailStore>((set, get) => ({
//   emails: [],
//   customSegments: [],
//   activeCategory: "inbox",
//   draftEmail: null,
//   isLoading: false,
//   loadingError: null,

//   // Fetch emails from API based on category
//   fetchEmails: async (category) => {
//       // Set loading state
//       set({ isLoading: true, loadingError: null });

//       try {
//         // Get email ID using the enhanced function
//         const emailId = getLinkedEmailId();

//         // Validate email ID
//         if (!emailId) {
//           throw new Error("Email ID missing. Please link your email first.");
//         }

//         // Get Djombi auth token
//         const djombiToken = getDjombiAccessToken();
        
//         if (!djombiToken) {
//           throw new Error("Djombi authentication token missing. Please log in again.");
//         }

//         console.log("Fetching emails with:", {
//           category,
//           emailId: `${emailId.substring(0, 10)}...`,
//           djombiToken: `${djombiToken.substring(0, 10)}...`
//         });

//         // Build the appropriate endpoint based on category with offset and limit
//         let endpoint = '';

//         if (category === 'inbox') {
//           endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(emailId)}&offset=1&limit=20`;
//         } else if (category === 'sent') {
//           endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/sent?email_id=${encodeURIComponent(emailId)}&offset=1&limit=20`;
//         } else if (category === 'spam') {
//           endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/spam?email_id=${encodeURIComponent(emailId)}&offset=1&limit=20`;
//         } else if (category === 'draft') {
//           // Use the specific drafts endpoint that works in EmailDraft.tsx
//           endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts?email_id=${encodeURIComponent(emailId)}&offset=1&limit=20`;
//         } else {
//           // Default to inbox
//           endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(emailId)}&offset=1&limit=20`;
//         }

//         console.log("Fetching from endpoint:", endpoint);

//         try {
//           // Make API request with Djombi authorization header using fetch
//           const response = await fetch(endpoint, {
//             headers: {
//               'Content-Type': 'application/json',
//               'Authorization': `Bearer ${djombiToken}` // Use Djombi token
//             }
//           });

//           console.log("GET response status:", response.status);

//           // Handle API errors
//           if (!response.ok) {
//             console.error(`Failed to fetch ${category} emails. Status: ${response.status}`);
            
//             // Try POST method as fallback (similar to EmailSent and EmailDraft pattern)
//             console.log(`GET request failed for ${category}, trying POST fallback...`);
            
//             let postEndpoint = '';
//             if (category === 'draft') {
//               postEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts?email_id=${encodeURIComponent(emailId)}&offset=1&limit=20`;
//             } else {
//               postEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/${category}?email_id=${encodeURIComponent(emailId)}&offset=1&limit=20`;
//             }
            
//             const postResponse = await fetch(postEndpoint, {
//               method: 'POST',
//               headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${djombiToken}` // Use Djombi token
//               },
//               body: JSON.stringify({
//                 email_id: emailId,
//                 content: ""
//               })
//             });
            
//             if (!postResponse.ok) {
//               throw new Error(`Failed to fetch ${category} emails: ${postResponse.statusText}`);
//             }
            
//             const postData = await postResponse.json();
//             console.log("POST response data:", postData);
            
//             // Check for success/error in POST response
//             if (postData.success === false) {
//               const errorMessage = postData.message || `API POST request failed for ${category}`;
//               console.error("API POST error:", errorMessage);
//               throw new Error(`API POST error: ${errorMessage}`);
//             }
            
//             processEmailData(postData, category);
//             return;
//           }

//           // Parse response
//           const responseText = await response.text();
//           let data;
          
//           try {
//             data = JSON.parse(responseText);
//           } catch (error) {
//             console.error("Error parsing response:", error, responseText);
//             throw new Error("Invalid response format from server");
//           }

//           console.log("GET response data:", data);
          
//           // Check for success/error in GET response
//           if (data.success === false) {
//             const errorMessage = data.message || `API request failed for ${category}`;
//             console.error("API error:", errorMessage);
//             throw new Error(`API error: ${errorMessage}`);
//           }

//           processEmailData(data, category);
          
//         } catch (fetchError) {
//           console.error("Fetch error:", fetchError);
//           throw fetchError;
//         }

//       } catch (error) {
//         console.error("Error fetching emails:", error);
//         set({
//           isLoading: false,
//           loadingError: error instanceof Error ? error.message : 'Unknown error fetching emails'
//         });
//       }
      
//       // Helper function to process email data from API response
//       function processEmailData(data: any, category: string) {
//         console.log(`Processing ${category} response data:`, data);
        
//         // Process the data, handling different possible response formats
//         let emailsData = [];
        
//         if (Array.isArray(data)) {
//           emailsData = data;
//         } else if (data.data && Array.isArray(data.data)) {
//           emailsData = data.data;
//         } else if (data[category] && Array.isArray(data[category])) {
//           emailsData = data[category];
//         } else if (data.drafts && Array.isArray(data.drafts)) {
//           // Handle drafts specific response format
//           emailsData = data.drafts;
//         } else if (data.sent && Array.isArray(data.sent)) {
//           // Handle sent specific response format
//           emailsData = data.sent;
//         } else if (data.emails && Array.isArray(data.emails)) {
//           // Handle emails specific response format
//           emailsData = data.emails;
//         } else if (typeof data === 'object') {
//           // If we can't find an obvious array, look for any array property
//           for (const key in data) {
//             if (Array.isArray(data[key]) && data[key].length > 0) {
//               console.log(`Found array in response at key: ${key}`, data[key]);
//               emailsData = data[key];
//               break;
//             }
//           }
//         }

//         // If we still don't have an array, create an empty one
//         if (!Array.isArray(emailsData)) {
//           console.warn("Could not find email array in response:", data);
//           emailsData = [];
//         }

//         console.log(`Found ${emailsData.length} ${category} emails in response`);

//         // Update store with fetched emails
//         set((state) => ({
//           emails: [
//             ...state.emails.filter(email => email.status !== category), // Remove old emails of this category
//             ...emailsData.map((item: any) => ({
//               id: item.id || item.email_id || item._id || uuidv4(), // Use appropriate ID field
//               email_id: item.email_id || item.id || item._id, // Store the original email_id
//               from: item.from || item.sender || "unknown@example.com",
//               to: item.to || item.recipient || "",
//               subject: item.subject || "(No Subject)",
//               content: item.content || "",
//               contentType: item.contentType || 'text',
//               timestamp: item.timestamp || item.createdAt || item.created_at || new Date().toISOString(),
//               createdAt: item.created_at || item.createdAt || Date.now(),
//               isUrgent: Boolean(item.isUrgent || item.is_urgent || false),
//               hasAttachment: Boolean(item.hasAttachment || item.has_attachment || false),
//               status: category,
//               category: category,
//               isRead: category === 'sent' ? true : (item.isRead || false) // Sent emails are always read
//             }))
//           ],
//           isLoading: false
//         }));
//       }
//     },

//   // Add a new email
//   addEmail: (emailData) => {
//     const newEmail: Email = {
//       ...emailData,
//       id: uuidv4(),
//       timestamp: new Date().toLocaleString(),
//       isUrgent: false,
//       category: get().activeCategory,
//       status: emailData.status || get().activeCategory,
//       isRead: false,
//       // Ensure all required fields from Email interface are set
//       from: emailData.from || "",
//       to: emailData.to || "",
//       subject: emailData.subject || "",
//       content: emailData.content || "",
//       hasAttachment: emailData.hasAttachment || false
//     };

//     // Add to local state
//     set((state) => ({
//       emails: [...state.emails, newEmail],
//     }));

//     // Send to API if it's not a draft
//     if (emailData.status !== "draft") {
//       const { djombiToken, linkedEmailId } = getAuthFromStorage();

//       // if (djombiToken && linkedEmailId) {
//       //   // Send email via API using Djombi token
//       //   fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails/send', {
//       //     method: 'POST',
//       //     headers: {
//       //       'Content-Type': 'application/json',
//       //       'Authorization': `Bearer ${djombiToken}`, // Use Djombi token
//       //     },
//       //     body: JSON.stringify({
//       //       ...newEmail,
//       //       email_id: linkedEmailId
//       //     })
//       //   }).catch(error => {
//       //     console.error("Error sending email:", error);
//       //   });
//       // }
//     }
//   },

//   // Move email between segments (urgent, all)
//   moveEmail: (emailId, segment) =>
//     set((state) => ({
//       emails: state.emails.map((email) =>
//         email.id === emailId
//           ? { ...email, isUrgent: segment === "urgent" }
//           : email
//       ),
//     })),

//   // Move email between categories (inbox, sent, draft, etc.)
//   moveEmailToCategory: (emailId, category) => {
//     // Update local state
//     set((state) => ({
//       emails: state.emails.map((email) =>
//         email.id === emailId
//           ? { ...email, status: category, category: category }
//           : email
//       ),
//     }));

//     // Update via API
//     const { djombiToken, linkedEmailId } = getAuthFromStorage();

//     if (djombiToken && linkedEmailId) {
//       fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/${emailId}/move`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${djombiToken}`, // Use Djombi token
//         },
//         body: JSON.stringify({ 
//           category,
//           email_id: linkedEmailId
//         })
//       }).catch(error => {
//         console.error("Error moving email:", error);
//       });
//     }
//   },

//   // Add a new segment
//   addSegment: (name) =>
//     set((state) => ({ customSegments: [...state.customSegments, name] })),

//   // Set active category
//   setActiveCategory: (category) => {
//     set({ activeCategory: category });

//     // Fetch emails for this category if we don't have any yet
//     const state = get();
//     const categoryEmails = state.emails.filter(email => email.status === category);

//     if (categoryEmails.length === 0 && !state.isLoading) {
//       get().fetchEmails(category);
//     }
//   },

//   // Delete email
//   deleteEmail: (id) => {
//     // Remove from local state
//     set((state) => ({
//       emails: state.emails.filter((email) => email.id !== id),
//     }));

//     // Delete via API
//     const { djombiToken, linkedEmailId } = getAuthFromStorage();

//     if (djombiToken && linkedEmailId) {
//       fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/${id}?email_id=${linkedEmailId}`, {
//         method: 'DELETE',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${djombiToken}`, // Use Djombi token
//         }
//       }).catch(error => {
//         console.error("Error deleting email:", error);
//       });
//     }
//   },

//   // Save draft
//   saveDraft: (draft: Partial<Email>) => {
//     if (draft.id) {
//       // Update existing draft
//       set((state) => ({
//         emails: state.emails.map((email) =>
//           email.id === draft.id ? { ...email, ...draft } : email
//         ),
//       }));

//       // Update via API
//       const { djombiToken, linkedEmailId } = getAuthFromStorage();

//       if (djombiToken && linkedEmailId) {
//         fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/${draft.id}?email_id=${linkedEmailId}`, {
//           method: 'PUT',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${djombiToken}`, // Use Djombi token
//           },
//           body: JSON.stringify({
//             ...draft,
//             email_id: linkedEmailId
//           })
//         }).catch(error => {
//           console.error("Error updating draft:", error);
//         });
//       }
//     } else {
//       // Create new draft with all required Email properties
//       const newDraft: Email = {
//         ...draft,
//         id: uuidv4(),
//         timestamp: new Date().toLocaleString(),
//         status: "draft",
//         category: "draft",
//         isUrgent: false,
//         hasAttachment: !!draft.hasAttachment,
//         // Add required fields that might be missing in the partial draft
//         from: draft.from || "",
//         to: draft.to || "",
//         subject: draft.subject || "",
//         content: draft.content || "",
//         isRead: true // For drafts, set as read
//       };

//       // Add to local state
//       set((state) => ({
//         emails: [...state.emails, newDraft],
//       }));

//       // Send to API
//       const { djombiToken, linkedEmailId } = getAuthFromStorage();

//       if (djombiToken && linkedEmailId) {
//         fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${djombiToken}`, // Use Djombi token
//           },
//           body: JSON.stringify({
//             ...newDraft,
//             email_id: linkedEmailId
//           })
//         }).catch(error => {
//           console.error("Error creating draft:", error);
//         });
//       }
//     }
//   },

//   // Fixed parameter name to match the interface
//   removeEmail: (id: string) => {
//     set((state) => ({
//       emails: state.emails.filter((email) => email.id !== id)
//     }));
//   },

//   // Update draft state
//   updateDraft: (data) => {
//     console.log("Updating draft state:", data);
//     set({ draftEmail: data });
//   },
// }));


























































// import { Email, EmailCategory, EmailSegment } from "@/lib/types/email";
// import { create } from "zustand";
// import { v4 as uuidv4 } from "uuid";
// import { getCookie, getAuthToken } from "@/lib/utils/cookies";

// // Helper function to get auth items from cookies
// const getAuthFromCookies = () => {
//   if (typeof document === 'undefined') return { token: null, linkedEmailId: null };

//   return {
//     token: getCookie('accessToken'),
//     linkedEmailId: getCookie('linkedEmailId')
//   };
// };

// interface EmailStore {
//   // Draft email state
//   draftEmail: any;

//   // Main email data
//   emails: Email[];

//   // UI state
//   customSegments: string[];
//   activeCategory: EmailCategory;
//   isLoading: boolean;
//   loadingError: string | null;

//   // Actions
//   fetchEmails: (category: EmailCategory) => Promise<void>;
//   addEmail: (emailData: Omit<Email, "id" | "timestamp" | "isUrgent" | "category">) => void;
//   moveEmail: (emailId: string, segment: EmailSegment) => void;
//   moveEmailToCategory: (emailId: string, category: EmailCategory) => void;
//   addSegment: (name: string) => void;
//   setActiveCategory: (category: EmailCategory) => void;
//   deleteEmail: (id: string) => void;
//   saveDraft: (draft: Partial<Email>) => void;
//   updateDraft: (data: any) => void;
//   removeEmail: (id: string) => void; // Fixed parameter name
// }

// export const useEmailStore = create<EmailStore>((set, get) => ({
//   emails: [
//     // {
//     //   id: "1",
//     //   from: "danielodedara@gmail.com",
//     //   to: "test@example.com",
//     //   subject: "Welcome to Adafri Dashboard",
//     //   content: "Welcome to your new dashboard!",
//     //   timestamp: "05/12 - 14:48",
//     //   isUrgent: false,
//     //   hasAttachment: true,
//     //   status: "inbox",
//     //   category: "inbox",
//     // },
//     // {
//     //   id: "2",
//     //   from: "danielodedara@gmail.com",
//     //   to: "test@example.com",
//     //   subject: "Adafri",
//     //   content: "Welcome to your new dashboard!",
//     //   timestamp: "05/12 - 14:48",
//     //   isUrgent: false,
//     //   hasAttachment: true,
//     //   status: "sent",
//     //   category: "sent",
//     // },
//   ],
//   customSegments: [],
//   activeCategory: "inbox",
//   draftEmail: null,
//   isLoading: false,
//   loadingError: null,

//   // Fetch emails from API based on category
//   fetchEmails: async (category) => {
//     // Set loading state
//     set({ isLoading: true, loadingError: null });

//     try {
//       // Get email ID from cookies instead of localStorage
//       const emailId = getCookie('linkedEmailId') || '';

//       // Validate email ID
//       if (!emailId) {
//         throw new Error("Email ID missing. Please link your email first.");
//       }

//       // Get auth token from cookies
//       const token = getAuthToken();
      
//       if (!token) {
//         throw new Error("Authentication token missing. Please log in again.");
//       }

//       // Build the appropriate endpoint based on category
//       let endpoint = '';

//       if (category === 'inbox' || category === 'sent' || category === 'spam') {
//         endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/${category}?email_id=${emailId}`;
//       } else if (category === 'draft') {
//         // Use the specific drafts endpoint that works in EmailDraft.tsx
//         endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts?email_id=${emailId}`;
//       } else {
//         endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${emailId}`;
//       }

//       // Make API request with authorization header
//       const response = await fetch(endpoint, {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         }
//       });

//       // Handle API errors
//       if (!response.ok) {
//         console.error(`Failed to fetch ${category} emails. Status: ${response.status}`);
        
//         // For draft emails, try the alternative POST method as in EmailDraft.tsx
//         if (category === 'draft') {
//           const postEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts';
//           const postResponse = await fetch(postEndpoint, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//               'Authorization': `Bearer ${token}`
//             },
//             body: JSON.stringify({
//               email_id: emailId,
//               content: ""
//             })
//           });
          
//           if (!postResponse.ok) {
//             throw new Error(`Failed to fetch ${category} emails: ${postResponse.statusText}`);
//           }
          
//           const postData = await postResponse.json();
//           processEmailData(postData, category);
//           return;
//         } else {
//           throw new Error(`Failed to fetch ${category} emails: ${response.statusText}`);
//         }
//       }

//       // Parse response
//       const responseText = await response.text();
//       let data;
      
//       try {
//         data = JSON.parse(responseText);
//       } catch (error) {
//         console.error("Error parsing response:", error, responseText);
//         throw new Error("Invalid response format from server");
//       }

//       processEmailData(data, category);
//     } catch (error) {
//       console.error("Error fetching emails:", error);
//       set({
//         isLoading: false,
//         loadingError: error instanceof Error ? error.message : 'Unknown error fetching emails'
//       });
//     }
    
//     // Helper function to process email data from API response
//     function processEmailData(data: any, category: string) {
//       // Process the data, handling different possible response formats
//       let emailsData = [];
      
//       if (Array.isArray(data)) {
//         emailsData = data;
//       } else if (data.data && Array.isArray(data.data)) {
//         emailsData = data.data;
//       } else if (data[category] && Array.isArray(data[category])) {
//         emailsData = data[category];
//       } else if (data.drafts && Array.isArray(data.drafts)) {
//         // Handle drafts specific response format
//         emailsData = data.drafts;
//       } else if (typeof data === 'object') {
//         // If we can't find an obvious array, look for any array property
//         for (const key in data) {
//           if (Array.isArray(data[key]) && data[key].length > 0) {
//             emailsData = data[key];
//             break;
//           }
//         }
//       }

//       // If we still don't have an array, create an empty one
//       if (!Array.isArray(emailsData)) {
//         console.warn("Could not find email array in response:", data);
//         emailsData = [];
//       }

//       // Update store with fetched emails
//       set((state) => ({
//         emails: [
//           ...state.emails.filter(email => email.status !== category), // Remove old emails of this category
//           ...emailsData.map((item: any) => ({
//             id: item.id || item.email_id || item._id || uuidv4(), // Use appropriate ID field
//             email_id: item.email_id || item.id || item._id, // Store the original email_id
//             from: item.from || "unknown@example.com",
//             to: item.to || "",
//             subject: item.subject || "(No Subject)",
//             content: item.content || "",
//             timestamp: item.timestamp || new Date().toLocaleString(),
//             createdAt: item.created_at || item.createdAt || Date.now(),
//             isUrgent: item.isUrgent || false,
//             hasAttachment: item.hasAttachment || false,
//             status: category,
//             category: category,
//             isRead: item.isRead || false
//           }))
//         ],
//         isLoading: false
//       }));
//     }
//   },

//   // Add a new email
//   addEmail: (emailData) => {
//     const newEmail: Email = {
//       ...emailData,
//       id: uuidv4(),
//       timestamp: new Date().toLocaleString(),
//       isUrgent: false,
//       category: get().activeCategory,
//       status: emailData.status || get().activeCategory,
//       isRead: false, // Add this missing required field
//       // Ensure all required fields from Email interface are set
//       from: emailData.from || "",
//       to: emailData.to || "",
//       subject: emailData.subject || "",
//       content: emailData.content || "",
//       hasAttachment: emailData.hasAttachment || false
//     };

//     // Add to local state
//     set((state) => ({
//       emails: [...state.emails, newEmail],
//     }));

//     // Send to API if it's not a draft
//     if (emailData.status !== "draft") {
//       const { token, linkedEmailId } = getAuthFromCookies();

//       if (token && linkedEmailId) {
//         // Send email via API
//         fetch('https://email-service-latest-agqz.onrender.com/api/emails/send', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`,
//             'X-Email-Id': linkedEmailId
//           },
//           body: JSON.stringify(newEmail)
//         }).catch(error => {
//           console.error("Error sending email:", error);
//         });
//       }
//     }
//   },

//   // Move email between segments (urgent, all)
//   moveEmail: (emailId, segment) =>
//     set((state) => ({
//       emails: state.emails.map((email) =>
//         email.id === emailId
//           ? { ...email, isUrgent: segment === "urgent" }
//           : email
//       ),
//     })),

//   // Move email between categories (inbox, sent, draft, etc.)
//   moveEmailToCategory: (emailId, category) => {
//     // Update local state
//     set((state) => ({
//       emails: state.emails.map((email) =>
//         email.id === emailId
//           ? { ...email, status: category, category: category }
//           : email
//       ),
//     }));

//     // Update via API
//     const { token, linkedEmailId } = getAuthFromCookies();

//     if (token && linkedEmailId) {
//       fetch(`/api/emails/${emailId}/move`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//           'X-Email-Id': linkedEmailId
//         },
//         body: JSON.stringify({ category })
//       }).catch(error => {
//         console.error("Error moving email:", error);
//       });
//     }
//   },

//   // Add a new segment
//   addSegment: (name) =>
//     set((state) => ({ customSegments: [...state.customSegments, name] })),

//   // Set active category
//   setActiveCategory: (category) => {
//     set({ activeCategory: category });

//     // Fetch emails for this category if we don't have any yet
//     const state = get();
//     const categoryEmails = state.emails.filter(email => email.status === category);

//     if (categoryEmails.length === 0 && !state.isLoading) {
//       get().fetchEmails(category);
//     }
//   },

//   // Delete email
//   deleteEmail: (id) => {
//     // Remove from local state
//     set((state) => ({
//       emails: state.emails.filter((email) => email.id !== id),
//     }));

//     // Delete via API
//     const { token, linkedEmailId } = getAuthFromCookies();

//     if (token && linkedEmailId) {
//       fetch(`https://email-service-latest-agqz.onrender.com/api/emails/drafts/${id}`, {
//         method: 'DELETE',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//           'X-Email-Id': linkedEmailId
//         }
//       }).catch(error => {
//         console.error("Error deleting email:", error);
//       });
//     }
//   },

//   // Save draft
//   // Save draft
// saveDraft: (draft: Partial<Email>) => {
//   if (draft.id) {
//     // Update existing draft
//     set((state) => ({
//       emails: state.emails.map((email) =>
//         email.id === draft.id ? { ...email, ...draft } : email
//       ),
//     }));

//     // Update via API
//     const { token, linkedEmailId } = getAuthFromCookies();

//     if (token && linkedEmailId) {
//       fetch(`https://email-service-latest-agqz.onrender.com/api/emails/drafts/${draft.id}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//           'X-Email-Id': linkedEmailId
//         },
//         body: JSON.stringify(draft)
//       }).catch(error => {
//         console.error("Error updating draft:", error);
//       });
//     }
//   } else {
//     // Create new draft with all required Email properties
//     const newDraft: Email = {
//       ...draft,
//       id: uuidv4(),
//       timestamp: new Date().toLocaleString(),
//       status: "draft",
//       category: "draft",
//       isUrgent: false,
//       hasAttachment: !!draft.hasAttachment,
//       // Add required fields that might be missing in the partial draft
//       from: draft.from || "",
//       to: draft.to || "",
//       subject: draft.subject || "",
//       content: draft.content || "",
//       isRead: true // For drafts, set as read
//     };

//     // Add to local state
//     set((state) => ({
//       emails: [...state.emails, newDraft],
//     }));

//     // Send to API code remains the same...
//   }
// },

//   // Fixed parameter name to match the interface
//   removeEmail: (id: string) => {
//     set((state) => ({
//       emails: state.emails.filter((email) => email.id !== id)
//     }));
//   },

//   // Update draft state
//   updateDraft: (data) => {
//     console.log("Updating draft state:", data);
//     set({ draftEmail: data });
//   },
// }));






















//  import { Email, EmailCategory, EmailSegment } from "@/lib/types/email";
// import { create } from "zustand";
// import { v4 as uuidv4 } from "uuid";
// import { getCookie, getAuthToken } from "@/lib/utils/cookies";

// // Helper function to get auth items from cookies
// const getAuthFromCookies = () => {
//   if (typeof document === 'undefined') return { token: null, linkedEmailId: null };

//   return {
//     token: getCookie('accessToken'),
//     linkedEmailId: getCookie('linkedEmailId')
//   };
// };

// interface EmailStore {
//   // Draft email state
//   draftEmail: any;

//   // Main email data
//   emails: Email[];

//   // UI state
//   customSegments: string[];
//   activeCategory: EmailCategory;
//   isLoading: boolean;
//   loadingError: string | null;

//   // Actions
//   fetchEmails: (category: EmailCategory) => Promise<void>;
//   addEmail: (emailData: Omit<Email, "id" | "timestamp" | "isUrgent" | "category">) => void;
//   moveEmail: (emailId: string, segment: EmailSegment) => void;
//   moveEmailToCategory: (emailId: string, category: EmailCategory) => void;
//   addSegment: (name: string) => void;
//   setActiveCategory: (category: EmailCategory) => void;
//   deleteEmail: (id: string) => void;
//   saveDraft: (draft: Partial<Email>) => void;
//   updateDraft: (data: any) => void;
// }

// export const useEmailStore = create<EmailStore>((set, get) => ({
//   emails: [
//     {
//       id: "1",
//       from: "danielodedara@gmail.com",
//       to: "test@example.com",
//       subject: "Welcome to Adafri Dashboard",
//       content: "Welcome to your new dashboard!",
//       timestamp: "05/12 - 14:48",
//       isUrgent: false,
//       hasAttachment: true,
//       status: "inbox",
//       category: "inbox",
//     },
//     {
//       id: "2",
//       from: "danielodedara@gmail.com",
//       to: "test@example.com",
//       subject: "Adafri",
//       content: "Welcome to your new dashboard!",
//       timestamp: "05/12 - 14:48",
//       isUrgent: false,
//       hasAttachment: true,
//       status: "sent",
//       category: "sent",
//     },
//   ],
//   customSegments: [],
//   activeCategory: "inbox",
//   draftEmail: null,
//   isLoading: false,
//   loadingError: null,

//   // Fetch emails from API based on category
//   fetchEmails: async (category) => {
//     // Set loading state
//     set({ isLoading: true, loadingError: null });

//     try {
//       // Get email ID from cookies instead of localStorage
//       const emailId = getCookie('linkedEmailId') || '';

//       // Validate email ID
//       if (!emailId) {
//         throw new Error("Email ID missing. Please link your email first.");
//       }

//       // Build the appropriate endpoint based on category
//       let endpoint = '';

//       if (category === 'inbox' || category === 'sent' || category === 'draft' || category === 'spam') {
//         endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/${category}?email_id=${emailId}`;
//       } else {
//         endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${emailId}`;
//       }

//       // Get auth token from cookies
//       const token = getAuthToken();
      
//       // Make API request with authorization header
//       const response = await fetch(endpoint, {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         }
//       });

//       // Handle API errors
//       if (!response.ok) {
//         throw new Error(`Failed to fetch ${category} emails: ${response.statusText}`);
//       }

//       // Parse response
//       const responseText = await response.text();
//       let data;
      
//       try {
//         data = JSON.parse(responseText);
//       } catch (error) {
//         console.error("Error parsing response:", error, responseText);
//         throw new Error("Invalid response format from server");
//       }

//       // Process the data, handling different possible response formats
//       let emailsData = [];
      
//       if (Array.isArray(data)) {
//         emailsData = data;
//       } else if (data.data && Array.isArray(data.data)) {
//         emailsData = data.data;
//       } else if (data[category] && Array.isArray(data[category])) {
//         emailsData = data[category];
//       } else if (typeof data === 'object') {
//         // If we can't find an obvious array, look for any array property
//         for (const key in data) {
//           if (Array.isArray(data[key]) && data[key].length > 0) {
//             emailsData = data[key];
//             break;
//           }
//         }
//       }

//       // If we still don't have an array, create an empty one
//       if (!Array.isArray(emailsData)) {
//         console.warn("Could not find email array in response:", data);
//         emailsData = [];
//       }

//       // Update store with fetched emails
//       set((state) => ({
//         emails: [
//           ...state.emails.filter(email => email.status !== category), // Remove old emails of this category
//           ...emailsData.map((item: any) => ({
//             id: item.email_id || item.id || crypto.randomUUID(), // Use email_id if available
//             email_id: item.email_id || item.id, // Store the original email_id
//             from: item.from || "unknown@example.com",
//             to: item.to || "",
//             subject: item.subject || "(No Subject)",
//             content: item.content || "",
//             timestamp: item.timestamp || new Date().toLocaleString(),
//             createdAt: item.created_at || Date.now(),
//             isUrgent: item.isUrgent || false,
//             hasAttachment: item.hasAttachment || false,
//             status: category,
//             category: category
//           }))
//         ],
//         isLoading: false
//       }));
//     } catch (error) {
//       console.error("Error fetching emails:", error);
//       set({
//         isLoading: false,
//         loadingError: error instanceof Error ? error.message : 'Unknown error fetching emails'
//       });
//     }
//   },

//   // Add a new email
//   addEmail: (emailData) => {
//     const newEmail = {
//       ...emailData,
//       id: uuidv4(),
//       timestamp: new Date().toLocaleString(),
//       isUrgent: false,
//       category: get().activeCategory,
//       status: emailData.status || get().activeCategory,
//     };

//     // Add to local state
//     set((state) => ({
//       emails: [...state.emails, newEmail],
//     }));

//     // Send to API if it's not a draft
//     if (emailData.status !== "draft") {
//       const { token, linkedEmailId } = getAuthFromCookies();

//       if (token && linkedEmailId) {
//         // Send email via API
//         fetch('/api/emails/send', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`,
//             'X-Email-Id': linkedEmailId
//           },
//           body: JSON.stringify(newEmail)
//         }).catch(error => {
//           console.error("Error sending email:", error);
//         });
//       }
//     }
//   },

//   // Move email between segments (urgent, all)
//   moveEmail: (emailId, segment) =>
//     set((state) => ({
//       emails: state.emails.map((email) =>
//         email.id === emailId
//           ? { ...email, isUrgent: segment === "urgent" }
//           : email
//       ),
//     })),

//   // Move email between categories (inbox, sent, draft, etc.)
//   moveEmailToCategory: (emailId, category) => {
//     // Update local state
//     set((state) => ({
//       emails: state.emails.map((email) =>
//         email.id === emailId
//           ? { ...email, status: category, category: category }
//           : email
//       ),
//     }));

//     // Update via API
//     const { token, linkedEmailId } = getAuthFromCookies();

//     if (token && linkedEmailId) {
//       fetch(`/api/emails/${emailId}/move`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//           'X-Email-Id': linkedEmailId
//         },
//         body: JSON.stringify({ category })
//       }).catch(error => {
//         console.error("Error moving email:", error);
//       });
//     }
//   },

//   // Add a new segment
//   addSegment: (name) =>
//     set((state) => ({ customSegments: [...state.customSegments, name] })),

//   // Set active category
//   setActiveCategory: (category) => {
//     set({ activeCategory: category });

//     // Fetch emails for this category if we don't have any yet
//     const state = get();
//     const categoryEmails = state.emails.filter(email => email.status === category);

//     if (categoryEmails.length === 0 && !state.isLoading) {
//       get().fetchEmails(category);
//     }
//   },

//   // Delete email
//   deleteEmail: (id) => {
//     // Remove from local state
//     set((state) => ({
//       emails: state.emails.filter((email) => email.id !== id),
//     }));

//     // Delete via API
//     const { token, linkedEmailId } = getAuthFromCookies();

//     if (token && linkedEmailId) {
//       fetch(`/api/emails/${id}`, {
//         method: 'DELETE',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//           'X-Email-Id': linkedEmailId
//         }
//       }).catch(error => {
//         console.error("Error deleting email:", error);
//       });
//     }
//   },

//   // Save draft
//   saveDraft: (draft) => {
//     if (draft.id) {
//       // Update existing draft
//       set((state) => ({
//         emails: state.emails.map((email) =>
//           email.id === draft.id ? { ...email, ...draft } : email
//         ),
//       }));

//       // Update via API
//       const { token, linkedEmailId } = getAuthFromCookies();

//       if (token && linkedEmailId) {
//         fetch(`/api/emails/drafts/${draft.id}`, {
//           method: 'PUT',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`,
//             'X-Email-Id': linkedEmailId
//           },
//           body: JSON.stringify(draft)
//         }).catch(error => {
//           console.error("Error updating draft:", error);
//         });
//       }
//     } else {
//       // Create new draft
//       const newDraft = {
//         ...draft,
//         id: uuidv4(),
//         timestamp: new Date().toLocaleString(),
//         status: "draft",
//         category: "draft",
//         isUrgent: false,
//         hasAttachment: !!draft.hasAttachment
//       };

//       // Add to local state
//       // set((state) => ({
//       //   emails: [...state.emails, newDraft],
//       // }));

//       // Send to API
//       const { token, linkedEmailId } = getAuthFromCookies();

//       if (token && linkedEmailId) {
//         fetch('/api/emails/drafts', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`,
//             'X-Email-Id': linkedEmailId
//           },
//           body: JSON.stringify(newDraft)
//         }).catch(error => {
//           console.error("Error saving draft:", error);
//         });
//       }
//     }
//   },

//   removeEmail: (email_id) => set((state) => ({
//     emails: state.emails.filter((email) => email.id !== email_id)
//   })),

//   // Update draft state
//   updateDraft: (data) => {
//     console.log("Updating draft state:", data);
//     set({ draftEmail: data });
//   },
// }));


























/* eslint-disable @typescript-eslint/no-explicit-any */
// import { Email, EmailCategory, EmailSegment } from "@/lib/types/email";
// import { create } from "zustand";
// import { v4 as uuidv4 } from "uuid";
// import { getCookie, getAuthToken } from "@/lib/utils/cookies"; // Import from your cookie utilities

// // Helper function to get auth items from cookies
// const getAuthFromCookies = () => {
//   if (typeof document === 'undefined') return { token: null, linkedEmailId: null };

//   return {
//     token: getCookie('accessToken'),
//     linkedEmailId: getCookie('linkedEmailId')
//   };
// };

// interface EmailStore {
//   // Draft email state
//   draftEmail: any;

//   // Main email data
//   emails: Email[];

//   // UI state
//   customSegments: string[];
//   activeCategory: EmailCategory;
//   isLoading: boolean;
//   loadingError: string | null;

//   // Actions
//   fetchEmails: (category: EmailCategory) => Promise<void>;
//   addEmail: (emailData: Omit<Email, "id" | "timestamp" | "isUrgent" | "category">) => void;
//   moveEmail: (emailId: string, segment: EmailSegment) => void;
//   moveEmailToCategory: (emailId: string, category: EmailCategory) => void;
//   addSegment: (name: string) => void;
//   setActiveCategory: (category: EmailCategory) => void;
//   deleteEmail: (id: string) => void;
//   saveDraft: (draft: Partial<Email>) => void;
//   updateDraft: (data: any) => void;
// }

// export const useEmailStore = create<EmailStore>((set, get) => ({
//   emails: [
//     {
//       id: "1",
//       from: "danielodedara@gmail.com",
//       to: "test@example.com",
//       subject: "Welcome to Adafri Dashboard",
//       content: "Welcome to your new dashboard!",
//       timestamp: "05/12 - 14:48",
//       isUrgent: false,
//       hasAttachment: true,
//       status: "inbox",
//       category: "inbox",
//     },
//     {
//       id: "2",
//       from: "danielodedara@gmail.com",
//       to: "test@example.com",
//       subject: "Adafri",
//       content: "Welcome to your new dashboard!",
//       timestamp: "05/12 - 14:48",
//       isUrgent: false,
//       hasAttachment: true,
//       status: "sent",
//       category: "sent",
//     },
//   ],
//   customSegments: [],
//   activeCategory: "inbox",
//   draftEmail: null,
//   isLoading: false,
//   loadingError: null,

//   // Fetch emails from API based on category
//   fetchEmails: async (category) => {
//     // Set loading state
//     set({ isLoading: true, loadingError: null });

//     try {
//       // Get email ID from cookies instead of localStorage
//       const emailId = getCookie('linkedEmailId') || '';

//       // Validate email ID
//       if (!emailId) {
//         throw new Error("Email ID missing. Please link your email first.");
//       }

//       // Build the appropriate endpoint based on category
//       let endpoint = '';

//       if (category === 'inbox' || category === 'sent' || category === 'draft' || category === 'spam') {
//         endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/${category}?email_id=${emailId}`;
//       } else {
//         endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${emailId}`;
//       }

//       // Get auth token from cookies
//       const token = getAuthToken();
      
//       // Make API request with authorization header
//       const response = await fetch(endpoint, {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         }
//       });

//       // Handle API errors
//       if (!response.ok) {
//         throw new Error(`Failed to fetch ${category} emails: ${response.statusText}`);
//       }

//       // Parse response
//       const data = await response.json();

//       // Update store with fetched emails
//       set((state) => ({
//         emails: [
//           ...state.emails.filter(email => email.status !== category), // Remove old emails of this category
//           ...data.map((item: any) => ({
//             id: item.email_id || item.id || crypto.randomUUID(), // Use email_id if available
//             email_id: item.email_id || item.id, // Store the original email_id
//             from: item.from || "unknown@example.com",
//             to: item.to || "",
//             subject: item.subject || "(No Subject)",
//             content: item.content || "",
//             timestamp: item.timestamp || new Date().toLocaleString(),
//             createdAt: item.created_at || Date.now(),
//             isUrgent: item.isUrgent || false,
//             hasAttachment: item.hasAttachment || false,
//             status: category,
//             category: category
//           }))
//         ],
//         isLoading: false
//       }));
//     } catch (error) {
//       console.error("Error fetching emails:", error);
//       set({
//         isLoading: false,
//         loadingError: error instanceof Error ? error.message : 'Unknown error fetching emails'
//       });
//     }
//   },

//   // Add a new email
//   addEmail: (emailData) => {
//     const newEmail = {
//       ...emailData,
//       id: uuidv4(),
//       timestamp: new Date().toLocaleString(),
//       isUrgent: false,
//       category: get().activeCategory,
//       status: emailData.status || get().activeCategory,
//     };

//     // Add to local state
//     set((state) => ({
//       emails: [...state.emails, newEmail],
//     }));

//     // Send to API if it's not a draft
//     if (emailData.status !== "draft") {
//       const { token, linkedEmailId } = getAuthFromCookies();

//       if (token && linkedEmailId) {
//         // Send email via API
//         fetch('/api/emails/send', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`,
//             'X-Email-Id': linkedEmailId
//           },
//           body: JSON.stringify(newEmail)
//         }).catch(error => {
//           console.error("Error sending email:", error);
//         });
//       }
//     }
//   },

//   // Move email between segments (urgent, all)
//   moveEmail: (emailId, segment) =>
//     set((state) => ({
//       emails: state.emails.map((email) =>
//         email.id === emailId
//           ? { ...email, isUrgent: segment === "urgent" }
//           : email
//       ),
//     })),

//   // Move email between categories (inbox, sent, draft, etc.)
//   moveEmailToCategory: (emailId, category) => {
//     // Update local state
//     set((state) => ({
//       emails: state.emails.map((email) =>
//         email.id === emailId
//           ? { ...email, status: category, category: category }
//           : email
//       ),
//     }));

//     // Update via API
//     const { token, linkedEmailId } = getAuthFromCookies();

//     if (token && linkedEmailId) {
//       fetch(`/api/emails/${emailId}/move`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//           'X-Email-Id': linkedEmailId
//         },
//         body: JSON.stringify({ category })
//       }).catch(error => {
//         console.error("Error moving email:", error);
//       });
//     }
//   },

//   // Add a new segment
//   addSegment: (name) =>
//     set((state) => ({ customSegments: [...state.customSegments, name] })),

//   // Set active category
//   setActiveCategory: (category) => {
//     set({ activeCategory: category });

//     // Fetch emails for this category if we don't have any yet
//     const state = get();
//     const categoryEmails = state.emails.filter(email => email.status === category);

//     if (categoryEmails.length === 0 && !state.isLoading) {
//       get().fetchEmails(category);
//     }
//   },

//   // Delete email
//   deleteEmail: (id) => {
//     // Remove from local state
//     set((state) => ({
//       emails: state.emails.filter((email) => email.id !== id),
//     }));

//     // Delete via API
//     const { token, linkedEmailId } = getAuthFromCookies();

//     if (token && linkedEmailId) {
//       fetch(`/api/emails/${id}`, {
//         method: 'DELETE',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//           'X-Email-Id': linkedEmailId
//         }
//       }).catch(error => {
//         console.error("Error deleting email:", error);
//       });
//     }
//   },

//   // Save draft
//   saveDraft: (draft) => {
//     if (draft.id) {
//       // Update existing draft
//       set((state) => ({
//         emails: state.emails.map((email) =>
//           email.id === draft.id ? { ...email, ...draft } : email
//         ),
//       }));

//       // Update via API
//       const { token, linkedEmailId } = getAuthFromCookies();

//       if (token && linkedEmailId) {
//         fetch(`/api/emails/drafts/${draft.id}`, {
//           method: 'PUT',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`,
//             'X-Email-Id': linkedEmailId
//           },
//           body: JSON.stringify(draft)
//         }).catch(error => {
//           console.error("Error updating draft:", error);
//         });
//       }
//     } else {
//       // Create new draft
//       const newDraft = {
//         ...draft,
//         id: uuidv4(),
//         timestamp: new Date().toLocaleString(),
//         status: "draft",
//         category: "draft",
//         isUrgent: false,
//         hasAttachment: !!draft.hasAttachment
//       };

//       // Add to local state
//       // set((state) => ({
//       //   emails: [...state.emails, newDraft],
//       // }));

//       // Send to API
//       const { token, linkedEmailId } = getAuthFromCookies();

//       if (token && linkedEmailId) {
//         fetch('/api/emails/drafts', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`,
//             'X-Email-Id': linkedEmailId
//           },
//           body: JSON.stringify(newDraft)
//         }).catch(error => {
//           console.error("Error saving draft:", error);
//         });
//       }
//     }
//   },

//   removeEmail: (email_id) => set((state) => ({
//     emails: state.emails.filter((email) => email.id !== email_id)
//   })),

//   // Update draft state
//   updateDraft: (data) => {
//     console.log("Updating draft state:", data);
//     set({ draftEmail: data });
//   },
// }));





























// import { Email, EmailCategory, EmailSegment } from "@/lib/types/email";
// import { create } from "zustand";
// import { v4 as uuidv4 } from "uuid";

// interface EmailStore {
//   draftEmail: any;
//   emails: Email[];
//   customSegments: string[];
//   activeCategory: EmailCategory;
//   addEmail: (
//     emailData: Omit<Email, "id" | "timestamp" | "isUrgent" | "category">
//   ) => void;
//   moveEmail: (emailId: string, segment: EmailSegment) => void;
//   addSegment: (name: string) => void;
//   setActiveCategory: (category: EmailCategory) => void;
//   deleteEmail: (id: string) => void;
//   saveDraft: (draft: Partial<Email>) => void;
//   updateDraft: (data: any) => void;
// }

// export const useEmailStore = create<EmailStore>((set) => ({
//   emails: [
//     {
//       id: "1",
//       from: "danielodedara@gmail.com",
//       to: "test@example.com",
//       subject: "Welcome to Adafri Dashboard",
//       content: "Welcome to your new dashboard!",
//       timestamp: "05/12 - 14:48",
//       isUrgent: false,
//       hasAttachment: true,
//       status: "inbox",
//       category: "inbox",
//     },
//     {
//       id: "1",
//       from: "danielodedara@gmail.com",
//       to: "test@example.com",
//       subject: "Welcome to Adafri Dashboard",
//       content: "Welcome to your new dashboard!",
//       timestamp: "05/12 - 14:48",
//       isUrgent: false,
//       hasAttachment: true,
//       status: "sent",
//       category: "sent",
//     },
//   ],
//   customSegments: [],
//   activeCategory: "inbox",
//   draftEmail: null,
//   addEmail: (emailData) =>
//     set((state) => ({
//       emails: [
//         ...state.emails,
//         {
//           ...emailData,
//           id: uuidv4(),
//           timestamp: new Date().toLocaleString(),
//           isUrgent: false,
//           category: state.activeCategory,
//           status: emailData.status || state.activeCategory,
//         },
//       ],
//     })),
//   moveEmail: (emailId, segment) =>
//     set((state) => ({
//       emails: state.emails.map((email) =>
//         email.id === emailId
//           ? { ...email, isUrgent: segment === "urgent" }
//           : email
//       ),
//     })),
//   addSegment: (name) =>
//     set((state) => ({ customSegments: [...state.customSegments, name] })),
//   setActiveCategory: (category) => set({ activeCategory: category }),
//   deleteEmail: (id) =>
//     set((state) => ({
//       emails: state.emails.filter((email) => email.id !== id),
//     })),
//   saveDraft: (draft) =>
//     set((state) => {
//       if (draft.id) {
//         return {
//           emails: state.emails.map((email) =>
//             email.id === draft.id ? { ...email, ...draft } : email
//           ),
//         };
//       }
//       return state;
//     }),
//     updateDraft: (data) => {
//       console.log("Updating draft state:", data);
//       set({ draftEmail: data });
//     },
// }));
