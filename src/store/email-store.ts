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
import emailApiService from "@/lib/services/emailApiService";
import { EmailPersistenceManager } from "./EmailPersistenceManager";

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

// Enhanced helper function to get linked email ID with better validation
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
  
  // Enhanced selected email tracking
  selectedEmailId: string | null;
  selectedEmailType: string | null;

  // Better cache management
  lastFetch: Record<string, number>;
  activeFetches: Set<string>; // Track active fetches to prevent duplicates
  
  // Actions
  fetchEmails: (category: EmailCategory, forceRefresh?: boolean) => Promise<void>;
  addEmail: (emailData: Omit<Email, "id" | "timestamp" | "isUrgent" | "category">) => void;
  moveEmail: (emailId: string, segment: EmailSegment | string) => void;
  moveEmailToCategory: (emailId: string, category: EmailCategory) => void;
  addSegment: (name: string) => void;
  setActiveCategory: (category: EmailCategory) => void;
  deleteEmail: (id: string) => void;
  saveDraft: (draft: Partial<Email>) => void;
  updateDraft: (data: any) => void;
  removeEmail: (id: string) => void;
  
  // Enhanced email switching with better coordination
  updateSelectedEmail: (emailId: string, emailType: string | null) => void;
  refreshCurrentCategory: () => void;
  
  // Updated methods for EmailBoard compatibility
  updateEmailStatus: (emailId: string, newStatus: string) => void;
  setEmails: (emails: Email[]) => void;
  
  // NEW: Custom column management methods
  getCustomColumns: () => any[];
  saveCustomColumns: (columns: any[]) => void;
  
  // Debug method
  debugStoreState: () => void;
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
  activeFetches: new Set(),

  // FIXED: Email status update now properly handles urgent and all columns
  updateEmailStatus: (emailId: string, newStatus: string) => {
    console.log(`EmailStore: Updating email ${emailId} status to ${newStatus}`);
    
    set((state) => {
      // Find the email to update
      const emailToUpdate = state.emails.find(email => email.id === emailId);
      
      if (!emailToUpdate) {
        console.warn(`Email with ID ${emailId} not found in store`);
        return state; // No change if email not found
      }
      
      console.log(`Updating email status from ${emailToUpdate.status} to ${newStatus}`);
      
      // Update the email with new status and category
      const updatedEmails = state.emails.map((email) => {
        if (email.id === emailId) {
          const updatedEmail = {
            ...email,
            status: newStatus,
            category: newStatus as EmailCategory,
            // FIXED: Remove isUrgent logic - urgent is now a proper column like follow-up
            // No special handling for urgent column needed
            timestamp: new Date().toISOString()
          };
          
          // Save the status change to persistence
          EmailPersistenceManager.saveEmailStatus(emailId, newStatus);
          
          return updatedEmail;
        }
        return email;
      });

      console.log(`Email status updated locally for email ${emailId} with persistence`);
      
      // Clear any previous error since this is local-only operation
      return { 
        emails: updatedEmails,
        loadingError: null
      };
    });

    console.log(`Email ${emailId} moved to ${newStatus} locally with persistence`);
  },

  // Enhanced setEmails method with persistence application
  setEmails: (emails: Email[]) => {
    console.log(`EmailStore: Setting emails array directly with ${emails.length} emails`);
    
    // Apply persisted statuses before setting emails
    const emailsWithPersistedStatuses = EmailPersistenceManager.applyPersistedStatuses(emails);
    
    set({ emails: [...emailsWithPersistedStatuses] }); // Create new array to ensure reactivity
    
    console.log(`Applied persisted statuses to ${emailsWithPersistedStatuses.length} emails`);
  },

  // Enhanced updateSelectedEmail method with comprehensive validation
  updateSelectedEmail: (emailId: string, emailType: string | null) => {
    const currentState = get();
    
    // Validate inputs
    if (!emailId) {
      console.warn("Cannot update to empty email ID");
      set({ 
        loadingError: "Invalid email selection",
        selectedEmailId: null,
        selectedEmailType: null,
        emails: []
      });
      return;
    }
    
    // Enhanced change detection
    const hasEmailIdChanged = currentState.selectedEmailId !== emailId;
    const hasEmailTypeChanged = currentState.selectedEmailType !== emailType;
    
    if (!hasEmailIdChanged && !hasEmailTypeChanged) {
      console.log("Email selection unchanged, skipping update");
      return;
    }
    
    console.log(`Email selection changing:`, {
      from: {
        id: currentState.selectedEmailId ? currentState.selectedEmailId.substring(0, 20) + '...' : 'null',
        type: currentState.selectedEmailType || 'null'
      },
      to: {
        id: emailId.substring(0, 20) + '...',
        type: emailType || 'null'
      }
    });
    
    // Update cookies first to ensure consistency
    setSelectedLinkedEmail(emailId, emailType);
    
    // Single comprehensive state update
    set({ 
      selectedEmailId: emailId, 
      selectedEmailType: emailType,
      lastFetch: {}, // Clear all cache to force refresh with new email
      activeFetches: new Set(), // Clear active fetches to allow new requests
      emails: [], // Clear existing emails when switching accounts
      loadingError: null // Clear any previous errors
    });
    
    // Trigger immediate refresh for the current category
    const currentCategory = currentState.activeCategory;
    
    console.log(`Triggering refresh of ${currentCategory} emails for new email selection`);
    
    // Use setTimeout to ensure state has fully updated
    setTimeout(() => {
      const newState = get();
      if (!newState.isLoading) {
        console.log("Executing fetchEmails for new email selection");
        get().fetchEmails(currentCategory, true);
      } else {
        console.log("Store is loading, will retry fetch in 500ms");
        setTimeout(() => {
          if (!get().isLoading) {
            get().fetchEmails(currentCategory, true);
          }
        }, 500);
      }
    }, 100);
  },

  // Enhanced refresh method with better validation
  refreshCurrentCategory: () => {
    const currentState = get();
    
    // Multiple safety checks
    if (currentState.isLoading) {
      console.log("Skipping refresh - already loading");
      return;
    }
    
    // Validate email selection
    const selectedEmail = getSelectedLinkedEmail();
    if (!selectedEmail?.id) {
      console.log("Skipping refresh - no email selected");
      set({ 
        loadingError: "Please select an email account from the dropdown",
        emails: []
      });
      return;
    }
    
    // Ensure store state matches cookie state
    if (currentState.selectedEmailId !== selectedEmail.id || 
        currentState.selectedEmailType !== selectedEmail.type) {
      console.log("Store state out of sync with cookies, updating...");
      get().updateSelectedEmail(selectedEmail.id, selectedEmail.type);
      return; // updateSelectedEmail will trigger the refresh
    }
    
    const currentCategory = currentState.activeCategory;
    
    // Clear cache for this category to force fresh fetch
    const cacheKey = `${currentCategory}_${selectedEmail.id}_${selectedEmail.type || 'null'}`;
    const newLastFetch = { ...currentState.lastFetch };
    delete newLastFetch[cacheKey];
    
    // Clear active fetches to allow new request
    const newActiveFetches = new Set(currentState.activeFetches);
    newActiveFetches.delete(cacheKey);
    
    set({ 
      lastFetch: newLastFetch,
      activeFetches: newActiveFetches
    });
    
    console.log(`Manual refresh of ${currentCategory} emails with cache cleared`);
    get().fetchEmails(currentCategory, true);
  },

  // Enhanced fetchEmails with persistence integration
  fetchEmails: async (category, forceRefresh = false) => {
    const state = get();
    
    // Get and validate email info
    const selectedEmail = getSelectedLinkedEmail();
    const emailId = selectedEmail?.id;
    const emailType = selectedEmail?.type;
    
    // Create stable cache key including email type for better cache isolation
    const cacheKey = `${category}_${emailId || 'no_email'}_${emailType || 'null'}`;
    
    // Enhanced duplicate fetch prevention
    if (state.activeFetches.has(cacheKey)) {
      console.log(`Already fetching ${category} emails for ${emailType || 'null'} account, skipping duplicate request`);
      return;
    }
    
    // Intelligent cache checking
    if (!forceRefresh) {
      const lastFetchTime = state.lastFetch[cacheKey] || 0;
      const timeSinceLastFetch = Date.now() - lastFetchTime;
      const MINIMUM_FETCH_INTERVAL = 3000; // 3 seconds to prevent spam
      
      if (timeSinceLastFetch < MINIMUM_FETCH_INTERVAL) {
        console.log(`Skipping ${category} fetch - only ${timeSinceLastFetch}ms since last fetch (minimum: ${MINIMUM_FETCH_INTERVAL}ms)`);
        return;
      }
    }

    // Validate email selection early
    if (!emailId) {
      console.log("No email selected, cannot fetch emails");
      set((prevState) => ({
        loadingError: "Please select an email account from the dropdown",
        isLoading: false,
        emails: [], // Clear emails when no account selected
        activeFetches: new Set([...prevState.activeFetches].filter(key => key !== cacheKey))
      }));
      return;
    }

    // Update store state with loading indicators
    set((prevState) => ({
      isLoading: true,
      loadingError: null,
      activeFetches: new Set([...prevState.activeFetches, cacheKey]),
      // Sync selected email info if it changed
      selectedEmailId: prevState.selectedEmailId !== emailId ? emailId : prevState.selectedEmailId,
      selectedEmailType: prevState.selectedEmailType !== emailType ? emailType : prevState.selectedEmailType
    }));

    try {
      console.log("Fetching emails with EmailApiService:", {
        category,
        emailType: emailType || 'null type',
        emailId: emailId ? `${emailId.substring(0, 20)}...` : 'Not found',
        cacheKey,
        forceRefresh
      });

      // Debug current email selection in the API service
      emailApiService.debugCurrentSelection();

      // Use EmailApiService to fetch emails
      const processedEmails = await emailApiService.fetchEmailsByCategory(category);
      
      console.log(`Successfully fetched ${processedEmails.length} ${category} emails via EmailApiService for ${emailType || 'null'} account`);

      // Apply persisted statuses to fetched emails
      const emailsWithPersistedStatuses = EmailPersistenceManager.applyPersistedStatuses(processedEmails);

      // Single atomic state update with proper cleanup
      set((prevState) => {
        // FIXED: Better email filtering to prevent duplicates
        // Remove emails that match either category OR status for the current category
        const otherEmails = prevState.emails.filter(email => 
          email.category !== category && 
          email.status !== category &&
          email.status.toLowerCase() !== category.toLowerCase()
        );
        
        // Ensure fetched emails have correct category/status and no duplicates
        const categorizedEmails = emailsWithPersistedStatuses.map(email => ({
          ...email,
          category: category,
          status: email.status || category // Use persisted status if available, otherwise use category
        }));
        
        // Remove any duplicates by email ID before combining
        const existingIds = new Set(otherEmails.map(email => email.id));
        const uniqueCategorizedEmails = categorizedEmails.filter(email => 
          !existingIds.has(email.id)
        );
        
        // Combine with existing emails from other categories
        const allEmails = [...otherEmails, ...uniqueCategorizedEmails];
        
        // Update cache and remove from active fetches
        const newLastFetch = {
          ...prevState.lastFetch,
          [cacheKey]: Date.now()
        };
        
        const newActiveFetches = new Set(prevState.activeFetches);
        newActiveFetches.delete(cacheKey);
        
        console.log(`Updated store: ${uniqueCategorizedEmails.length} new ${category} emails, ${allEmails.length} total emails in store (duplicates removed, persistence applied)`);
        
        return {
          emails: allEmails,
          isLoading: false,
          loadingError: null,
          lastFetch: newLastFetch,
          activeFetches: newActiveFetches
        };
      });

    } catch (error) {
      console.error(`Error fetching ${category} emails via EmailApiService:`, error);
      
      // Comprehensive error handling with cleanup
      set((prevState) => {
        const newActiveFetches = new Set(prevState.activeFetches);
        newActiveFetches.delete(cacheKey);
        
        return {
          isLoading: false,
          loadingError: error instanceof Error ? error.message : 'Failed to fetch emails. Please try again.',
          activeFetches: newActiveFetches
        };
      });
    }
  },

  // Enhanced addEmail method with better error handling
  addEmail: (emailData) => {
    const selectedEmail = getSelectedLinkedEmail();
    
    if (!selectedEmail?.id) {
      console.error("Cannot add email: No email account selected");
      set((state) => ({
        loadingError: "Cannot add email: No email account selected"
      }));
      return;
    }

    const newEmail: Email = {
      ...emailData,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      isUrgent: false, // FIXED: Remove special urgent handling
      category: emailData.status || get().activeCategory,
      status: (emailData.status || get().activeCategory) as EmailSegment,
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

    // Save status to persistence
    EmailPersistenceManager.saveEmailStatus(newEmail.id, newEmail.status);

    console.log("Added email to store:", {
      id: newEmail.id,
      status: newEmail.status,
      selectedEmailId: selectedEmail.id.substring(0, 20) + '...'
    });

    // Send to API if it's not a draft
    if (emailData.status !== "draft") {
      console.log("Sending email via EmailApiService...");
      
      // Use EmailApiService to send email (it will automatically use the selected email)
      emailApiService.sendEmail({
        to: newEmail.to,
        subject: newEmail.subject,
        content: newEmail.content,
        email_id: selectedEmail.id // This will be overridden by the service anyway
      })
      .then((response) => {
        console.log("Email sent successfully via EmailApiService:", response);
        
        // Update the email with server ID if provided
        if (response.id || response.data?.id) {
          const serverId = response.id || response.data.id;
          set((state) => ({
            emails: state.emails.map((email) =>
              email.id === newEmail.id ? { ...email, id: serverId } : email
            ),
          }));
        }
        
        // Refresh the current category if it matches the email status
        const currentState = get();
        if (currentState.activeCategory === emailData.status) {
          // Small delay to ensure server has processed the email
          setTimeout(() => {
            get().refreshCurrentCategory();
          }, 1000);
        }
      })
      .catch(error => {
        console.error("Error sending email via EmailApiService:", error);
        set((state) => ({
          loadingError: `Failed to send email: ${error.message}`
        }));
      });
    }
  },

  // FIXED: Enhanced moveEmail method - no more special urgent handling
  moveEmail: (emailId, segment) => {
    console.log(`EmailStore moveEmail: Moving email ${emailId} to ${segment}`);
    
    // Handle both legacy segment-based moves and new status-based moves
    if (typeof segment === 'string' && !['urgent', 'all'].includes(segment)) {
      // This is a status/category move, use updateEmailStatus
      get().updateEmailStatus(emailId, segment);
      return;
    }
    
    // FIXED: Remove legacy urgent handling - urgent is now a proper column
    if (segment === 'urgent') {
      // Treat urgent as a proper status/category move
      get().updateEmailStatus(emailId, 'urgent');
      return;
    }
    
    // Legacy segment-based move for "all" - this maintains backwards compatibility
    if (segment === 'all') {
      // Move back to inbox
      get().updateEmailStatus(emailId, 'inbox');
      return;
    }
    
    console.log(`Unhandled segment type: ${segment}`);
  },

  // Move email between categories (LOCAL ONLY - NO BACKEND SYNC)
  moveEmailToCategory: (emailId, category) => {
    console.log(`EmailStore: Moving email ${emailId} to category ${category} (local only)`);
    
    // Update local state immediately - this is the only operation needed
    set((state) => {
      const emailToUpdate = state.emails.find(email => email.id === emailId);
      
      if (!emailToUpdate) {
        console.warn(`Email with ID ${emailId} not found for category move`);
        return state;
      }
      
      console.log(`Moving email from ${emailToUpdate.status} to ${category}`);
      
      const updatedEmails = state.emails.map((email) => {
        if (email.id === emailId) {
          const updatedEmail = {
            ...email,
            status: category as EmailSegment,
            category: category,
            timestamp: new Date().toISOString()
          };
          
          // Save to persistence
          EmailPersistenceManager.saveEmailStatus(emailId, category);
          
          return updatedEmail;
        }
        return email;
      });

      console.log(`Email moved to ${category} locally with persistence`);
      
      return {
        emails: updatedEmails,
        loadingError: null
      };
    });
  },

  // Add a new segment
  addSegment: (name) =>
    set((state) => ({ customSegments: [...state.customSegments, name] })),

  // Enhanced setActiveCategory with better email validation
  setActiveCategory: (category) => {
    const currentState = get();
    
    // Only fetch if category actually changed
    if (currentState.activeCategory === category) {
      console.log(`Category ${category} already active, skipping fetch`);
      return;
    }
    
    console.log(`Setting active category from ${currentState.activeCategory} to ${category}`);
    set({ activeCategory: category });

    // Validate email selection before fetching
    const selectedEmail = getSelectedLinkedEmail();
    if (selectedEmail?.id && !currentState.isLoading) {
      console.log(`Fetching emails for new category: ${category}`);
      // Don't force refresh on category change - use cache if available
      get().fetchEmails(category, false);
    } else if (!selectedEmail?.id) {
      console.log("No email selected, skipping fetch for category change");
      set({ 
        loadingError: "Please select an email account from the dropdown",
        emails: []
      });
    } else {
      console.log("Already loading, skipping fetch for category change");
    }
  },

  // Delete email using EmailApiService
  deleteEmail: (id) => {
    // Remove from persistence first
    EmailPersistenceManager.removeEmailStatus(id);
    
    // Remove from local state immediately for better UX
    set((state) => ({
      emails: state.emails.filter((email) => email.id !== id),
    }));

    // Delete via EmailApiService (automatically uses selected email)
    emailApiService.deleteDraft(id)
      .then((response) => {
        console.log("Email deleted successfully via EmailApiService:", response);
      })
      .catch(error => {
        console.error("Error deleting email via EmailApiService:", error);
        set((state) => ({
          loadingError: `Failed to delete email: ${error.message}`
        }));
      });
  },

  // Save draft using EmailApiService with validation
  saveDraft: (draft: Partial<Email>) => {
    const selectedEmail = getSelectedLinkedEmail();
    
    if (!selectedEmail?.id) {
      console.error("Cannot save draft: No email account selected");
      set((state) => ({
        loadingError: "Cannot save draft: No email account selected"
      }));
      return;
    }

    if (draft.id) {
      // Update existing draft
      set((state) => ({
        emails: state.emails.map((email) =>
          email.id === draft.id ? { ...email, ...draft } : email
        ),
      }));

      // Save to persistence
      if (draft.id && draft.status) {
        EmailPersistenceManager.saveEmailStatus(draft.id, draft.status);
      }

      // Update via EmailApiService (automatically uses selected email)
      emailApiService.updateDraft({
        id: draft.id,
        to: draft.to || "",
        subject: draft.subject || "",
        content: draft.content || "",
        email_id: selectedEmail.id // This will be overridden anyway
      })
      .then((response) => {
        console.log("Draft updated successfully via EmailApiService:", response);
      })
      .catch(error => {
        console.error("Error updating draft via EmailApiService:", error);
        set((state) => ({
          loadingError: `Failed to update draft: ${error.message}`
        }));
      });
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

      // Add to local state immediately for better UX
      set((state) => ({
        emails: [...state.emails, newDraft],
      }));

      // Save to persistence
      EmailPersistenceManager.saveEmailStatus(newDraft.id, newDraft.status);

      // Create via EmailApiService (automatically uses selected email)
      emailApiService.createDraft({
        to: newDraft.to,
        subject: newDraft.subject,
        content: newDraft.content,
        email_id: selectedEmail.id // This will be overridden anyway
      })
      .then((response) => {
        console.log("Draft created successfully via EmailApiService:", response);
        // Optionally update the local draft with the server-returned ID
        if (response.id || response.data?.id) {
          const serverId = response.id || response.data.id;
          set((state) => ({
            emails: state.emails.map((email) =>
              email.id === newDraft.id ? { ...email, id: serverId } : email
            ),
          }));
        }
      })
      .catch(error => {
        console.error("Error creating draft via EmailApiService:", error);
        // Remove the optimistically added draft on error
        set((state) => ({
          emails: state.emails.filter((email) => email.id !== newDraft.id),
          loadingError: `Failed to create draft: ${error.message}`
        }));
      });
    }
  },

  // Remove email from store
  removeEmail: (id: string) => {
    // Remove from persistence
    EmailPersistenceManager.removeEmailStatus(id);
    
    set((state) => ({
      emails: state.emails.filter((email) => email.id !== id)
    }));
  },

  // Update draft state
  updateDraft: (data) => {
    console.log("Updating draft state:", data);
    set({ draftEmail: data });
  },

  // NEW: Custom column management methods
  getCustomColumns: () => {
    return EmailPersistenceManager.loadCustomColumns();
  },

  saveCustomColumns: (columns: any[]) => {
    EmailPersistenceManager.saveCustomColumns(columns);
  },

  // Debug method to inspect store state
  debugStoreState: () => {
    const state = get();
    const selectedEmail = getSelectedLinkedEmail();
    const persistenceDebug = EmailPersistenceManager.getDebugInfo();
    
    console.log("Email Store Debug State:", {
      storeSelectedEmail: {
        id: state.selectedEmailId ? state.selectedEmailId.substring(0, 20) + '...' : 'null',
        type: state.selectedEmailType || 'null'
      },
      cookieSelectedEmail: {
        id: selectedEmail?.id ? selectedEmail.id.substring(0, 20) + '...' : 'null',
        type: selectedEmail?.type || 'null'
      },
      activeCategory: state.activeCategory,
      emailCount: state.emails.length,
      isLoading: state.isLoading,
      error: state.loadingError,
      activeFetches: Array.from(state.activeFetches),
      cacheKeys: Object.keys(state.lastFetch),
      persistenceManager: persistenceDebug
    });
  },
}));










































// working store
// import { Email, EmailCategory, EmailSegment } from "@/lib/types/email";
// import { create } from "zustand";
// import { v4 as uuidv4 } from "uuid";
// import { 
//   getCookie, 
//   getAuthToken, 
//   getSelectedLinkedEmailId, 
//   getSelectedLinkedEmailType,
//   getSelectedLinkedEmail,
//   setSelectedLinkedEmail 
// } from "@/lib/utils/cookies";
// import { DjombiProfileService } from "@/lib/services/DjombiProfileService";
// import emailApiService from "@/lib/services/emailApiService";

// // Helper function to get Djombi access token
// const getDjombiAccessToken = (): string | null => {
//   try {
//     // First try from DjombiProfileService
//     const { accessToken } = DjombiProfileService.getStoredDjombiTokens();
//     if (accessToken) {
//       return accessToken;
//     }
    
//     // Fallback to localStorage directly
//     if (typeof window !== 'undefined') {
//       const storedToken = localStorage.getItem('djombi_access_token');
//       if (storedToken) {
//         return storedToken;
//       }
//     }
    
//     return null;
//   } catch (error) {
//     console.error("Error getting Djombi access token:", error);
//     return null;
//   }
// };

// // Enhanced helper function to get linked email ID with better validation
// const getLinkedEmailId = (): string | null => {
//   try {
//     // Use the proper cookie function for selected linked email ID
//     const selectedEmailId = getSelectedLinkedEmailId();
//     if (selectedEmailId) {
//       return selectedEmailId;
//     }
    
//     // Fallback to old methods for backward compatibility
//     const emailIdFromCookie = getCookie('linkedEmailId');
//     if (emailIdFromCookie) {
//       return emailIdFromCookie;
//     }
    
//     // Last resort - localStorage (but this should be replaced)
//     if (typeof window !== 'undefined') {
//       const emailIdFromStorage = localStorage.getItem('linkedEmailId');
//       if (emailIdFromStorage) {
//         return emailIdFromStorage;
//       }
//     }
    
//     return null;
//   } catch (error) {
//     console.error("Error getting linked email ID:", error);
//     return null;
//   }
// };

// // Helper function to get auth items using Djombi tokens and proper email selection
// const getAuthFromStorage = () => {
//   return {
//     djombiToken: getDjombiAccessToken(),
//     linkedEmailId: getLinkedEmailId(),
//     selectedEmailType: getSelectedLinkedEmailType(),
//     regularToken: getAuthToken() // Keep for comparison
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
  
//   // Enhanced selected email tracking
//   selectedEmailId: string | null;
//   selectedEmailType: string | null;

//   // Better cache management
//   lastFetch: Record<string, number>;
//   activeFetches: Set<string>; // Track active fetches to prevent duplicates
  
//   // Actions
//   fetchEmails: (category: EmailCategory, forceRefresh?: boolean) => Promise<void>;
//   addEmail: (emailData: Omit<Email, "id" | "timestamp" | "isUrgent" | "category">) => void;
//   moveEmail: (emailId: string, segment: EmailSegment) => void;
//   moveEmailToCategory: (emailId: string, category: EmailCategory) => void;
//   addSegment: (name: string) => void;
//   setActiveCategory: (category: EmailCategory) => void;
//   deleteEmail: (id: string) => void;
//   saveDraft: (draft: Partial<Email>) => void;
//   updateDraft: (data: any) => void;
//   removeEmail: (id: string) => void;
  
//   // Enhanced email switching with better coordination
//   updateSelectedEmail: (emailId: string, emailType: string | null) => void;
//   refreshCurrentCategory: () => void;
  
//   // Debug method
//   debugStoreState: () => void;
// }

// export const useEmailStore = create<EmailStore>((set, get) => ({
//   emails: [],
//   customSegments: [],
//   activeCategory: "inbox",
//   draftEmail: null,
//   isLoading: false,
//   loadingError: null,
//   selectedEmailId: null,
//   selectedEmailType: null,
//   lastFetch: {},
//   activeFetches: new Set(),

//   // Enhanced updateSelectedEmail method with comprehensive validation
//   updateSelectedEmail: (emailId: string, emailType: string | null) => {
//     const currentState = get();
    
//     // Validate inputs
//     if (!emailId) {
//       console.warn("Cannot update to empty email ID");
//       set({ 
//         loadingError: "Invalid email selection",
//         selectedEmailId: null,
//         selectedEmailType: null,
//         emails: []
//       });
//       return;
//     }
    
//     // Enhanced change detection
//     const hasEmailIdChanged = currentState.selectedEmailId !== emailId;
//     const hasEmailTypeChanged = currentState.selectedEmailType !== emailType;
    
//     if (!hasEmailIdChanged && !hasEmailTypeChanged) {
//       console.log("Email selection unchanged, skipping update");
//       return;
//     }
    
//     console.log(`Email selection changing:`, {
//       from: {
//         id: currentState.selectedEmailId ? currentState.selectedEmailId.substring(0, 20) + '...' : 'null',
//         type: currentState.selectedEmailType || 'null'
//       },
//       to: {
//         id: emailId.substring(0, 20) + '...',
//         type: emailType || 'null'
//       }
//     });
    
//     // Update cookies first to ensure consistency
//     setSelectedLinkedEmail(emailId, emailType);
    
//     // Single comprehensive state update
//     set({ 
//       selectedEmailId: emailId, 
//       selectedEmailType: emailType,
//       lastFetch: {}, // Clear all cache to force refresh with new email
//       activeFetches: new Set(), // Clear active fetches to allow new requests
//       emails: [], // Clear existing emails when switching accounts
//       loadingError: null // Clear any previous errors
//     });
    
//     // Trigger immediate refresh for the current category
//     const currentCategory = currentState.activeCategory;
    
//     console.log(`Triggering refresh of ${currentCategory} emails for new email selection`);
    
//     // Use setTimeout to ensure state has fully updated
//     setTimeout(() => {
//       const newState = get();
//       if (!newState.isLoading) {
//         console.log("Executing fetchEmails for new email selection");
//         get().fetchEmails(currentCategory, true);
//       } else {
//         console.log("Store is loading, will retry fetch in 500ms");
//         setTimeout(() => {
//           if (!get().isLoading) {
//             get().fetchEmails(currentCategory, true);
//           }
//         }, 500);
//       }
//     }, 100);
//   },

//   // Enhanced refresh method with better validation
//   refreshCurrentCategory: () => {
//     const currentState = get();
    
//     // Multiple safety checks
//     if (currentState.isLoading) {
//       console.log("Skipping refresh - already loading");
//       return;
//     }
    
//     // Validate email selection
//     const selectedEmail = getSelectedLinkedEmail();
//     if (!selectedEmail?.id) {
//       console.log("Skipping refresh - no email selected");
//       set({ 
//         loadingError: "Please select an email account from the dropdown",
//         emails: []
//       });
//       return;
//     }
    
//     // Ensure store state matches cookie state
//     if (currentState.selectedEmailId !== selectedEmail.id || 
//         currentState.selectedEmailType !== selectedEmail.type) {
//       console.log("Store state out of sync with cookies, updating...");
//       get().updateSelectedEmail(selectedEmail.id, selectedEmail.type);
//       return; // updateSelectedEmail will trigger the refresh
//     }
    
//     const currentCategory = currentState.activeCategory;
    
//     // Clear cache for this category to force fresh fetch
//     const cacheKey = `${currentCategory}_${selectedEmail.id}_${selectedEmail.type || 'null'}`;
//     const newLastFetch = { ...currentState.lastFetch };
//     delete newLastFetch[cacheKey];
    
//     // Clear active fetches to allow new request
//     const newActiveFetches = new Set(currentState.activeFetches);
//     newActiveFetches.delete(cacheKey);
    
//     set({ 
//       lastFetch: newLastFetch,
//       activeFetches: newActiveFetches
//     });
    
//     console.log(`Manual refresh of ${currentCategory} emails with cache cleared`);
//     get().fetchEmails(currentCategory, true);
//   },

//   // Enhanced fetchEmails with comprehensive validation and error handling
//   fetchEmails: async (category, forceRefresh = false) => {
//     const state = get();
    
//     // Get and validate email info
//     const selectedEmail = getSelectedLinkedEmail();
//     const emailId = selectedEmail?.id;
//     const emailType = selectedEmail?.type;
    
//     // Create stable cache key including email type for better cache isolation
//     const cacheKey = `${category}_${emailId || 'no_email'}_${emailType || 'null'}`;
    
//     // Enhanced duplicate fetch prevention
//     if (state.activeFetches.has(cacheKey)) {
//       console.log(`Already fetching ${category} emails for ${emailType || 'null'} account, skipping duplicate request`);
//       return;
//     }
    
//     // Intelligent cache checking
//     if (!forceRefresh) {
//       const lastFetchTime = state.lastFetch[cacheKey] || 0;
//       const timeSinceLastFetch = Date.now() - lastFetchTime;
//       const MINIMUM_FETCH_INTERVAL = 3000; // 3 seconds to prevent spam
      
//       if (timeSinceLastFetch < MINIMUM_FETCH_INTERVAL) {
//         console.log(`Skipping ${category} fetch - only ${timeSinceLastFetch}ms since last fetch (minimum: ${MINIMUM_FETCH_INTERVAL}ms)`);
//         return;
//       }
//     }

//     // Validate email selection early
//     if (!emailId) {
//       console.log("No email selected, cannot fetch emails");
//       set((prevState) => ({
//         loadingError: "Please select an email account from the dropdown",
//         isLoading: false,
//         emails: [], // Clear emails when no account selected
//         activeFetches: new Set([...prevState.activeFetches].filter(key => key !== cacheKey))
//       }));
//       return;
//     }

//     // Update store state with loading indicators
//     set((prevState) => ({
//       isLoading: true,
//       loadingError: null,
//       activeFetches: new Set([...prevState.activeFetches, cacheKey]),
//       // Sync selected email info if it changed
//       selectedEmailId: prevState.selectedEmailId !== emailId ? emailId : prevState.selectedEmailId,
//       selectedEmailType: prevState.selectedEmailType !== emailType ? emailType : prevState.selectedEmailType
//     }));

//     try {
//       console.log("Fetching emails with EmailApiService:", {
//         category,
//         emailType: emailType || 'null type',
//         emailId: emailId ? `${emailId.substring(0, 20)}...` : 'Not found',
//         cacheKey,
//         forceRefresh
//       });

//       // Debug current email selection in the API service
//       emailApiService.debugCurrentSelection();

//       // Use EmailApiService to fetch emails
//       const processedEmails = await emailApiService.fetchEmailsByCategory(category);
      
//       console.log(`Successfully fetched ${processedEmails.length} ${category} emails via EmailApiService for ${emailType || 'null'} account`);

//       // Single atomic state update with proper cleanup
//       set((prevState) => {
//         // Keep emails from other categories, replace only current category
//         const otherEmails = prevState.emails.filter(email => 
//           email.category !== category && email.status !== category
//         );
        
//         // Ensure fetched emails have correct category/status
//         const categorizedEmails = processedEmails.map(email => ({
//           ...email,
//           category: category,
//           status: category
//         }));
        
//         // Combine with existing emails from other categories
//         const allEmails = [...otherEmails, ...categorizedEmails];
        
//         // Update cache and remove from active fetches
//         const newLastFetch = {
//           ...prevState.lastFetch,
//           [cacheKey]: Date.now()
//         };
        
//         const newActiveFetches = new Set(prevState.activeFetches);
//         newActiveFetches.delete(cacheKey);
        
//         console.log(`Updated store: ${categorizedEmails.length} new ${category} emails, ${allEmails.length} total emails in store`);
        
//         return {
//           emails: allEmails,
//           isLoading: false,
//           loadingError: null,
//           lastFetch: newLastFetch,
//           activeFetches: newActiveFetches
//         };
//       });

//     } catch (error) {
//       console.error(`Error fetching ${category} emails via EmailApiService:`, error);
      
//       // Comprehensive error handling with cleanup
//       set((prevState) => {
//         const newActiveFetches = new Set(prevState.activeFetches);
//         newActiveFetches.delete(cacheKey);
        
//         return {
//           isLoading: false,
//           loadingError: error instanceof Error ? error.message : 'Failed to fetch emails. Please try again.',
//           activeFetches: newActiveFetches
//         };
//       });
//     }
//   },

//   // Enhanced addEmail method with better error handling
//   addEmail: (emailData) => {
//     const selectedEmail = getSelectedLinkedEmail();
    
//     if (!selectedEmail?.id) {
//       console.error("Cannot add email: No email account selected");
//       set((state) => ({
//         loadingError: "Cannot add email: No email account selected"
//       }));
//       return;
//     }

//     const newEmail: Email = {
//       ...emailData,
//       id: uuidv4(),
//       timestamp: new Date().toISOString(),
//       isUrgent: false,
//       category: emailData.status || get().activeCategory,
//       status: emailData.status || get().activeCategory,
//       isRead: emailData.status === 'sent' || emailData.status === 'draft',
//       // Ensure all required fields from Email interface are set
//       from: emailData.from || "",
//       to: emailData.to || "",
//       subject: emailData.subject || "",
//       content: emailData.content || "",
//       hasAttachment: emailData.hasAttachment || false,
//       contentType: emailData.contentType || 'text',
//       createdAt: Date.now()
//     };

//     // Add to local state immediately for better UX
//     set((state) => ({
//       emails: [...state.emails, newEmail],
//     }));

//     console.log("Added email to store:", {
//       id: newEmail.id,
//       status: newEmail.status,
//       selectedEmailId: selectedEmail.id.substring(0, 20) + '...'
//     });

//     // Send to API if it's not a draft
//     if (emailData.status !== "draft") {
//       console.log("Sending email via EmailApiService...");
      
//       // Use EmailApiService to send email (it will automatically use the selected email)
//       emailApiService.sendEmail({
//         to: newEmail.to,
//         subject: newEmail.subject,
//         content: newEmail.content,
//         email_id: selectedEmail.id // This will be overridden by the service anyway
//       })
//       .then((response) => {
//         console.log("Email sent successfully via EmailApiService:", response);
        
//         // Update the email with server ID if provided
//         if (response.id || response.data?.id) {
//           const serverId = response.id || response.data.id;
//           set((state) => ({
//             emails: state.emails.map((email) =>
//               email.id === newEmail.id ? { ...email, id: serverId } : email
//             ),
//           }));
//         }
        
//         // Refresh the current category if it matches the email status
//         const currentState = get();
//         if (currentState.activeCategory === emailData.status) {
//           // Small delay to ensure server has processed the email
//           setTimeout(() => {
//             get().refreshCurrentCategory();
//           }, 1000);
//         }
//       })
//       .catch(error => {
//         console.error("Error sending email via EmailApiService:", error);
//         set((state) => ({
//           loadingError: `Failed to send email: ${error.message}`
//         }));
//       });
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

//   // Move email between categories using EmailApiService
//   moveEmailToCategory: (emailId, category) => {
//     // Update local state immediately for better UX
//     set((state) => ({
//       emails: state.emails.map((email) =>
//         email.id === emailId
//           ? { ...email, status: category, category: category }
//           : email
//       ),
//     }));

//     // Update via EmailApiService (automatically uses selected email)
//     emailApiService.moveEmail(emailId, category)
//       .then((response) => {
//         console.log("Email moved successfully via EmailApiService:", response);
//       })
//       .catch(error => {
//         console.error("Error moving email via EmailApiService:", error);
//         // Revert local state change on error
//         set((state) => ({
//           emails: state.emails.map((email) =>
//             email.id === emailId
//               ? { ...email, status: email.category, category: email.category }
//               : email
//           ),
//           loadingError: `Failed to move email: ${error.message}`
//         }));
//       });
//   },

//   // Add a new segment
//   addSegment: (name) =>
//     set((state) => ({ customSegments: [...state.customSegments, name] })),

//   // Enhanced setActiveCategory with better email validation
//   setActiveCategory: (category) => {
//     const currentState = get();
    
//     // Only fetch if category actually changed
//     if (currentState.activeCategory === category) {
//       console.log(`Category ${category} already active, skipping fetch`);
//       return;
//     }
    
//     console.log(`Setting active category from ${currentState.activeCategory} to ${category}`);
//     set({ activeCategory: category });

//     // Validate email selection before fetching
//     const selectedEmail = getSelectedLinkedEmail();
//     if (selectedEmail?.id && !currentState.isLoading) {
//       console.log(`Fetching emails for new category: ${category}`);
//       // Don't force refresh on category change - use cache if available
//       get().fetchEmails(category, false);
//     } else if (!selectedEmail?.id) {
//       console.log("No email selected, skipping fetch for category change");
//       set({ 
//         loadingError: "Please select an email account from the dropdown",
//         emails: []
//       });
//     } else {
//       console.log("Already loading, skipping fetch for category change");
//     }
//   },

//   // Delete email using EmailApiService
//   deleteEmail: (id) => {
//     // Remove from local state immediately for better UX
//     set((state) => ({
//       emails: state.emails.filter((email) => email.id !== id),
//     }));

//     // Delete via EmailApiService (automatically uses selected email)
//     emailApiService.deleteDraft(id)
//       .then((response) => {
//         console.log("Email deleted successfully via EmailApiService:", response);
//       })
//       .catch(error => {
//         console.error("Error deleting email via EmailApiService:", error);
//         set((state) => ({
//           loadingError: `Failed to delete email: ${error.message}`
//         }));
//       });
//   },

//   // Save draft using EmailApiService with validation
//   saveDraft: (draft: Partial<Email>) => {
//     const selectedEmail = getSelectedLinkedEmail();
    
//     if (!selectedEmail?.id) {
//       console.error("Cannot save draft: No email account selected");
//       set((state) => ({
//         loadingError: "Cannot save draft: No email account selected"
//       }));
//       return;
//     }

//     if (draft.id) {
//       // Update existing draft
//       set((state) => ({
//         emails: state.emails.map((email) =>
//           email.id === draft.id ? { ...email, ...draft } : email
//         ),
//       }));

//       // Update via EmailApiService (automatically uses selected email)
//       emailApiService.updateDraft({
//         id: draft.id,
//         to: draft.to || "",
//         subject: draft.subject || "",
//         content: draft.content || "",
//         email_id: selectedEmail.id // This will be overridden anyway
//       })
//       .then((response) => {
//         console.log("Draft updated successfully via EmailApiService:", response);
//       })
//       .catch(error => {
//         console.error("Error updating draft via EmailApiService:", error);
//         set((state) => ({
//           loadingError: `Failed to update draft: ${error.message}`
//         }));
//       });
//     } else {
//       // Create new draft with all required Email properties
//       const newDraft: Email = {
//         ...draft,
//         id: uuidv4(),
//         timestamp: new Date().toISOString(),
//         status: "draft",
//         category: "draft",
//         isUrgent: false,
//         hasAttachment: !!draft.hasAttachment,
//         from: draft.from || "",
//         to: draft.to || "",
//         subject: draft.subject || "",
//         content: draft.content || "",
//         isRead: true,
//         contentType: draft.contentType || 'text',
//         createdAt: Date.now()
//       };

//       // Add to local state immediately for better UX
//       set((state) => ({
//         emails: [...state.emails, newDraft],
//       }));

//       // Create via EmailApiService (automatically uses selected email)
//       emailApiService.createDraft({
//         to: newDraft.to,
//         subject: newDraft.subject,
//         content: newDraft.content,
//         email_id: selectedEmail.id // This will be overridden anyway
//       })
//       .then((response) => {
//         console.log("Draft created successfully via EmailApiService:", response);
//         // Optionally update the local draft with the server-returned ID
//         if (response.id || response.data?.id) {
//           const serverId = response.id || response.data.id;
//           set((state) => ({
//             emails: state.emails.map((email) =>
//               email.id === newDraft.id ? { ...email, id: serverId } : email
//             ),
//           }));
//         }
//       })
//       .catch(error => {
//         console.error("Error creating draft via EmailApiService:", error);
//         // Remove the optimistically added draft on error
//         set((state) => ({
//           emails: state.emails.filter((email) => email.id !== newDraft.id),
//           loadingError: `Failed to create draft: ${error.message}`
//         }));
//       });
//     }
//   },

//   // Remove email from store
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

//   // Debug method to inspect store state
//   debugStoreState: () => {
//     const state = get();
//     const selectedEmail = getSelectedLinkedEmail();
    
//     console.log("Email Store Debug State:", {
//       storeSelectedEmail: {
//         id: state.selectedEmailId ? state.selectedEmailId.substring(0, 20) + '...' : 'null',
//         type: state.selectedEmailType || 'null'
//       },
//       cookieSelectedEmail: {
//         id: selectedEmail?.id ? selectedEmail.id.substring(0, 20) + '...' : 'null',
//         type: selectedEmail?.type || 'null'
//       },
//       activeCategory: state.activeCategory,
//       emailCount: state.emails.length,
//       isLoading: state.isLoading,
//       error: state.loadingError,
//       activeFetches: Array.from(state.activeFetches),
//       cacheKeys: Object.keys(state.lastFetch)
//     });
//   },
// }));












































// 9:50
// import { Email, EmailCategory, EmailSegment } from "@/lib/types/email";
// import { create } from "zustand";
// import { v4 as uuidv4 } from "uuid";
// import { 
//   getCookie, 
//   getAuthToken, 
//   getSelectedLinkedEmailId, 
//   getSelectedLinkedEmailType,
//   getSelectedLinkedEmail,
//   setSelectedLinkedEmail 
// } from "@/lib/utils/cookies";
// import { DjombiProfileService } from "@/lib/services/DjombiProfileService";
// import emailApiService from "@/lib/services/emailApiService";

// // Helper function to get Djombi access token
// const getDjombiAccessToken = (): string | null => {
//   try {
//     // First try from DjombiProfileService
//     const { accessToken } = DjombiProfileService.getStoredDjombiTokens();
//     if (accessToken) {
//       return accessToken;
//     }
    
//     // Fallback to localStorage directly
//     if (typeof window !== 'undefined') {
//       const storedToken = localStorage.getItem('djombi_access_token');
//       if (storedToken) {
//         return storedToken;
//       }
//     }
    
//     return null;
//   } catch (error) {
//     console.error("Error getting Djombi access token:", error);
//     return null;
//   }
// };

// // Updated helper function to get linked email ID using cookies
// const getLinkedEmailId = (): string | null => {
//   try {
//     // Use the proper cookie function for selected linked email ID
//     const selectedEmailId = getSelectedLinkedEmailId();
//     if (selectedEmailId) {
//       return selectedEmailId;
//     }
    
//     // Fallback to old methods for backward compatibility
//     const emailIdFromCookie = getCookie('linkedEmailId');
//     if (emailIdFromCookie) {
//       return emailIdFromCookie;
//     }
    
//     // Last resort - localStorage (but this should be replaced)
//     if (typeof window !== 'undefined') {
//       const emailIdFromStorage = localStorage.getItem('linkedEmailId');
//       if (emailIdFromStorage) {
//         return emailIdFromStorage;
//       }
//     }
    
//     return null;
//   } catch (error) {
//     console.error("Error getting linked email ID:", error);
//     return null;
//   }
// };

// // Helper function to get auth items using Djombi tokens and proper email selection
// const getAuthFromStorage = () => {
//   return {
//     djombiToken: getDjombiAccessToken(),
//     linkedEmailId: getLinkedEmailId(),
//     selectedEmailType: getSelectedLinkedEmailType(),
//     regularToken: getAuthToken() // Keep for comparison
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
  
//   // Add current selected email info
//   selectedEmailId: string | null;
//   selectedEmailType: string | null;

//   // Add refresh tracking - FIXED: Better cache management
//   lastFetch: Record<string, number>;
//   activeFetches: Set<string>; // Track active fetches to prevent duplicates
  
//   // Actions
//   fetchEmails: (category: EmailCategory, forceRefresh?: boolean) => Promise<void>;
//   addEmail: (emailData: Omit<Email, "id" | "timestamp" | "isUrgent" | "category">) => void;
//   moveEmail: (emailId: string, segment: EmailSegment) => void;
//   moveEmailToCategory: (emailId: string, category: EmailCategory) => void;
//   addSegment: (name: string) => void;
//   setActiveCategory: (category: EmailCategory) => void;
//   deleteEmail: (id: string) => void;
//   saveDraft: (draft: Partial<Email>) => void;
//   updateDraft: (data: any) => void;
//   removeEmail: (id: string) => void;
  
//   // FIXED: Better email switching without infinite loops
//   updateSelectedEmail: (emailId: string, emailType: string | null) => void;
//   refreshCurrentCategory: () => void;
// }

// export const useEmailStore = create<EmailStore>((set, get) => ({
//   emails: [],
//   customSegments: [],
//   activeCategory: "inbox",
//   draftEmail: null,
//   isLoading: false,
//   loadingError: null,
//   selectedEmailId: null,
//   selectedEmailType: null,
//   lastFetch: {},
//   activeFetches: new Set(), // FIXED: Track active fetches

//   // FIXED: Update selected email without causing infinite loops
//   updateSelectedEmail: (emailId: string, emailType: string | null) => {
//     const currentState = get();
    
//     // Check if this is actually a change
//     if (currentState.selectedEmailId === emailId && currentState.selectedEmailType === emailType) {
//       console.log("Email selection unchanged, skipping update");
//       return;
//     }
    
//     console.log(`Email selection changing from ${currentState.selectedEmailType} (${currentState.selectedEmailId}) to ${emailType} (${emailId})`);
    
//     // Update cookies
//     setSelectedLinkedEmail(emailId, emailType);
    
//     // Update store state
//     set({ 
//       selectedEmailId: emailId, 
//       selectedEmailType: emailType,
//       // FIXED: Don't clear emails immediately - let fetch handle it
//       lastFetch: {} // Clear cache to force refresh with new email
//     });
    
//     // FIXED: Only refresh if we're not already loading
//     if (!currentState.isLoading) {
//       const currentCategory = currentState.activeCategory;
//       console.log(`Refreshing ${currentCategory} emails for new email selection`);
//       get().fetchEmails(currentCategory, true);
//     }
//   },

//   // FIXED: Safer refresh that checks loading state
//   refreshCurrentCategory: () => {
//     const currentState = get();
//     if (!currentState.isLoading) {
//       const currentCategory = currentState.activeCategory;
//       console.log(`Manual refresh of ${currentCategory} emails`);
//       get().fetchEmails(currentCategory, true);
//     } else {
//       console.log("Skipping refresh - already loading");
//     }
//   },

//   // FIXED: Fetch emails with proper infinite loop prevention
//   fetchEmails: async (category, forceRefresh = false) => {
//     const state = get();
    
//     // FIXED: Create proper cache key first
//     const selectedEmail = getSelectedLinkedEmail();
//     const cacheKey = `${category}_${selectedEmail?.id || 'no_email'}`;
    
//     // FIXED: Prevent duplicate concurrent fetches
//     if (state.activeFetches.has(cacheKey)) {
//       console.log(`Already fetching ${category} emails for ${selectedEmail?.type}, skipping duplicate request`);
//       return;
//     }
    
//     // FIXED: Better cache check - only skip if not forced and recently fetched
//     if (!forceRefresh) {
//       const lastFetchTime = state.lastFetch[cacheKey] || 0;
//       const timeSinceLastFetch = Date.now() - lastFetchTime;
//       const MINIMUM_FETCH_INTERVAL = 5000; // FIXED: Increased to 5 seconds
      
//       if (timeSinceLastFetch < MINIMUM_FETCH_INTERVAL) {
//         console.log(`Skipping ${category} fetch - only ${timeSinceLastFetch}ms since last fetch (minimum: ${MINIMUM_FETCH_INTERVAL}ms)`);
//         return;
//       }
//     }

//     // FIXED: Update selected email info from cookies only once
//     if (selectedEmail && (state.selectedEmailId !== selectedEmail.id || state.selectedEmailType !== selectedEmail.type)) {
//       set({ 
//         selectedEmailId: selectedEmail.id, 
//         selectedEmailType: selectedEmail.type 
//       });
//     }

//     // FIXED: Mark this fetch as active and set loading state
//     set((prevState) => ({
//       isLoading: true,
//       loadingError: null,
//       activeFetches: new Set([...prevState.activeFetches, cacheKey])
//     }));

//     try {
//       // Get selected email details
//       const linkedEmailId = getLinkedEmailId();
//       const emailType = getSelectedLinkedEmailType();
      
//       console.log("Fetching emails with EmailApiService:", {
//         category,
//         emailType: emailType || 'no type',
//         linkedEmailId: linkedEmailId ? `${linkedEmailId.substring(0, 20)}...` : 'Not found',
//         cacheKey
//       });

//       // Validate email ID
//       if (!linkedEmailId) {
//         throw new Error("Email ID missing. Please select an email account in the dropdown.");
//       }

//       // FIXED: Use EmailApiService to fetch emails
//       const processedEmails = await emailApiService.fetchEmailsByCategory(category);
      
//       console.log(`Successfully fetched ${processedEmails.length} ${category} emails via EmailApiService`);

//       // FIXED: Update store state with proper cache management
//       set((prevState) => {
//         // Remove existing emails of this category
//         const otherEmails = prevState.emails.filter(email => 
//           email.category !== category && email.status !== category
//         );
        
//         // Combine with new emails
//         const allEmails = [...otherEmails, ...processedEmails];
        
//         // FIXED: Update cache and remove from active fetches
//         const newLastFetch = {
//           ...prevState.lastFetch,
//           [cacheKey]: Date.now()
//         };
        
//         const newActiveFetches = new Set(prevState.activeFetches);
//         newActiveFetches.delete(cacheKey);
        
//         console.log(`Updated store: ${processedEmails.length} new ${category} emails, ${allEmails.length} total`);
        
//         return {
//           emails: allEmails,
//           isLoading: false,
//           loadingError: null,
//           lastFetch: newLastFetch,
//           activeFetches: newActiveFetches
//         };
//       });

//     } catch (error) {
//       console.error(`Error fetching ${category} emails via EmailApiService:`, error);
      
//       // FIXED: Clean up active fetches on error
//       set((prevState) => {
//         const newActiveFetches = new Set(prevState.activeFetches);
//         newActiveFetches.delete(cacheKey);
        
//         return {
//           isLoading: false,
//           loadingError: error instanceof Error ? error.message : 'Unknown error occurred',
//           activeFetches: newActiveFetches
//         };
//       });
//     }
//   },

//   // Add a new email using EmailApiService
//   addEmail: (emailData) => {
//     const newEmail: Email = {
//       ...emailData,
//       id: uuidv4(),
//       timestamp: new Date().toISOString(),
//       isUrgent: false,
//       category: emailData.status || get().activeCategory,
//       status: emailData.status || get().activeCategory,
//       isRead: emailData.status === 'sent' || emailData.status === 'draft',
//       // Ensure all required fields from Email interface are set
//       from: emailData.from || "",
//       to: emailData.to || "",
//       subject: emailData.subject || "",
//       content: emailData.content || "",
//       hasAttachment: emailData.hasAttachment || false,
//       contentType: emailData.contentType || 'text',
//       createdAt: Date.now()
//     };

//     // Add to local state immediately for better UX
//     set((state) => ({
//       emails: [...state.emails, newEmail],
//     }));

//     console.log("Added email to store:", newEmail);

//     // Send to API if it's not a draft
//     if (emailData.status !== "draft") {
//       const linkedEmailId = getLinkedEmailId();

//       if (linkedEmailId) {
//         console.log("Sending email via EmailApiService...");
        
//         // Use EmailApiService to send email
//         emailApiService.sendEmail({
//           to: newEmail.to,
//           subject: newEmail.subject,
//           content: newEmail.content,
//           email_id: linkedEmailId
//         })
//         .then((response) => {
//           console.log("Email sent successfully via EmailApiService:", response);
//           // FIXED: Refresh sent emails after delay without forcing if already loading
//           setTimeout(() => {
//             const currentState = get();
//             if (!currentState.isLoading) {
//               get().fetchEmails('sent', true);
//             }
//           }, 1000);
//         })
//         .catch(error => {
//           console.error("Error sending email via EmailApiService:", error);
//           set((state) => ({
//             loadingError: `Failed to send email: ${error.message}`
//           }));
//         });
//       } else {
//         console.error("Cannot send email: No linked email ID found");
//         set((state) => ({
//           loadingError: "Cannot send email: No email account selected"
//         }));
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

//   // Move email between categories using EmailApiService
//   moveEmailToCategory: (emailId, category) => {
//     // Update local state immediately for better UX
//     set((state) => ({
//       emails: state.emails.map((email) =>
//         email.id === emailId
//           ? { ...email, status: category, category: category }
//           : email
//       ),
//     }));

//     // Update via EmailApiService
//     emailApiService.moveEmail(emailId, category)
//       .then((response) => {
//         console.log("Email moved successfully via EmailApiService:", response);
//       })
//       .catch(error => {
//         console.error("Error moving email via EmailApiService:", error);
//         // Revert local state change on error
//         set((state) => ({
//           emails: state.emails.map((email) =>
//             email.id === emailId
//               ? { ...email, status: email.category, category: email.category }
//               : email
//           ),
//           loadingError: `Failed to move email: ${error.message}`
//         }));
//       });
//   },

//   // Add a new segment
//   addSegment: (name) =>
//     set((state) => ({ customSegments: [...state.customSegments, name] })),

//   // FIXED: Set active category without always forcing refresh
//   setActiveCategory: (category) => {
//     const currentState = get();
    
//     // FIXED: Only fetch if category actually changed
//     if (currentState.activeCategory === category) {
//       console.log(`Category ${category} already active, skipping fetch`);
//       return;
//     }
    
//     console.log(`Setting active category from ${currentState.activeCategory} to ${category}`);
//     set({ activeCategory: category });

//     // FIXED: Only fetch if we have valid email selection and not already loading
//     const selectedEmail = getSelectedLinkedEmail();
//     if (selectedEmail && !currentState.isLoading) {
//       console.log(`Fetching emails for new category: ${category}`);
//       // FIXED: Don't force refresh on category change - use cache if available
//       get().fetchEmails(category, false);
//     } else if (!selectedEmail) {
//       console.log("No email selected, skipping fetch for category change");
//     } else {
//       console.log("Already loading, skipping fetch for category change");
//     }
//   },

//   // Delete email using EmailApiService
//   deleteEmail: (id) => {
//     // Remove from local state immediately for better UX
//     set((state) => ({
//       emails: state.emails.filter((email) => email.id !== id),
//     }));

//     // Delete via EmailApiService
//     emailApiService.deleteDraft(id)
//       .then((response) => {
//         console.log("Email deleted successfully via EmailApiService:", response);
//       })
//       .catch(error => {
//         console.error("Error deleting email via EmailApiService:", error);
//         set((state) => ({
//           loadingError: `Failed to delete email: ${error.message}`
//         }));
//       });
//   },

//   // Save draft using EmailApiService
//   saveDraft: (draft: Partial<Email>) => {
//     const linkedEmailId = getLinkedEmailId();
    
//     if (!linkedEmailId) {
//       console.error("Cannot save draft: No linked email ID found");
//       set((state) => ({
//         loadingError: "Cannot save draft: No email account selected"
//       }));
//       return;
//     }

//     if (draft.id) {
//       // Update existing draft
//       set((state) => ({
//         emails: state.emails.map((email) =>
//           email.id === draft.id ? { ...email, ...draft } : email
//         ),
//       }));

//       // Update via EmailApiService
//       emailApiService.updateDraft({
//         id: draft.id,
//         to: draft.to || "",
//         subject: draft.subject || "",
//         content: draft.content || "",
//         email_id: linkedEmailId
//       })
//       .then((response) => {
//         console.log("Draft updated successfully via EmailApiService:", response);
//       })
//       .catch(error => {
//         console.error("Error updating draft via EmailApiService:", error);
//         set((state) => ({
//           loadingError: `Failed to update draft: ${error.message}`
//         }));
//       });
//     } else {
//       // Create new draft with all required Email properties
//       const newDraft: Email = {
//         ...draft,
//         id: uuidv4(),
//         timestamp: new Date().toISOString(),
//         status: "draft",
//         category: "draft",
//         isUrgent: false,
//         hasAttachment: !!draft.hasAttachment,
//         from: draft.from || "",
//         to: draft.to || "",
//         subject: draft.subject || "",
//         content: draft.content || "",
//         isRead: true,
//         contentType: draft.contentType || 'text',
//         createdAt: Date.now()
//       };

//       // Add to local state immediately for better UX
//       set((state) => ({
//         emails: [...state.emails, newDraft],
//       }));

//       // Create via EmailApiService
//       emailApiService.createDraft({
//         to: newDraft.to,
//         subject: newDraft.subject,
//         content: newDraft.content,
//         email_id: linkedEmailId
//       })
//       .then((response) => {
//         console.log("Draft created successfully via EmailApiService:", response);
//         // Optionally update the local draft with the server-returned ID
//         if (response.id || response.data?.id) {
//           const serverId = response.id || response.data.id;
//           set((state) => ({
//             emails: state.emails.map((email) =>
//               email.id === newDraft.id ? { ...email, id: serverId } : email
//             ),
//           }));
//         }
//       })
//       .catch(error => {
//         console.error("Error creating draft via EmailApiService:", error);
//         // Remove the optimistically added draft on error
//         set((state) => ({
//           emails: state.emails.filter((email) => email.id !== newDraft.id),
//           loadingError: `Failed to create draft: ${error.message}`
//         }));
//       });
//     }
//   },

//   // Remove email from store
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














































































// 7/8/2025
// import { Email, EmailCategory, EmailSegment } from "@/lib/types/email";
// import { create } from "zustand";
// import { v4 as uuidv4 } from "uuid";
// import { getCookie, getAuthToken } from "@/lib/utils/cookies";
// import { DjombiProfileService } from "@/lib/services/DjombiProfileService";

// // Helper function to get Djombi access token
// const getDjombiAccessToken = (): string | null => {
//   try {
//     // First try from DjombiProfileService
//     const { accessToken } = DjombiProfileService.getStoredDjombiTokens();
//     if (accessToken) {
//       return accessToken;
//     }
    
//     // Fallback to localStorage directly
//     if (typeof window !== 'undefined') {
//       const storedToken = localStorage.getItem('djombi_access_token');
//       if (storedToken) {
//         return storedToken;
//       }
//     }
    
//     return null;
//   } catch (error) {
//     console.error("Error getting Djombi access token:", error);
//     return null;
//   }
// };

// // Helper function to get linked email ID
// const getLinkedEmailId = (): string | null => {
//   try {
//     // First try cookies
//     const emailIdFromCookie = getCookie('linkedEmailId');
//     if (emailIdFromCookie) {
//       return emailIdFromCookie;
//     }
    
//     // Then try localStorage
//     if (typeof window !== 'undefined') {
//       const emailIdFromStorage = localStorage.getItem('linkedEmailId');
//       if (emailIdFromStorage) {
//         return emailIdFromStorage;
//       }
//     }
    
//     return null;
//   } catch (error) {
//     console.error("Error getting linked email ID:", error);
//     return null;
//   }
// };

// // Helper function to get auth items using Djombi tokens
// const getAuthFromStorage = () => {
//   return {
//     djombiToken: getDjombiAccessToken(),
//     linkedEmailId: getLinkedEmailId(),
//     regularToken: getAuthToken() // Keep for comparison
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

//   // Add refresh tracking
//   lastFetch: Record<string, number>;
  
//   // Actions
//   fetchEmails: (category: EmailCategory, forceRefresh?: boolean) => Promise<void>;
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
//   lastFetch: {},

//   // Fetch emails from API based on category
//   fetchEmails: async (category, forceRefresh = false) => {
//     const state = get();
    
//     // Prevent concurrent fetches of the same category
//     if (state.isLoading && !forceRefresh) {
//       console.log(`Already fetching ${category} emails, skipping...`);
//       return;
//     }

//     // Check if we need to refresh (avoid fetching too frequently)
//     const lastFetchTime = state.lastFetch[category] || 0;
//     const timeSinceLastFetch = Date.now() - lastFetchTime;
//     const MINIMUM_FETCH_INTERVAL = 5000; // 5 seconds
    
//     if (!forceRefresh && timeSinceLastFetch < MINIMUM_FETCH_INTERVAL) {
//       console.log(`Skipping ${category} fetch, too soon since last fetch`);
//       return;
//     }

//     // Set loading state
//     set({ isLoading: true, loadingError: null });

//     try {
//       // Get authentication details
//       const linkedEmailId = getLinkedEmailId();
//       const djombiToken = getDjombiAccessToken();
      
//       console.log("Fetching emails with:", {
//         category,
//         linkedEmailId: linkedEmailId ? `${linkedEmailId.substring(0, 20)}...` : 'Not found',
//         djombiToken: djombiToken ? `${djombiToken.substring(0, 10)}...` : 'Not found'
//       });

//       // Validate authentication
//       if (!linkedEmailId) {
//         throw new Error("Email ID missing. Please link your email account in settings.");
//       }

//       if (!djombiToken) {
//         throw new Error("Authentication token missing. Please log in again.");
//       }

//       // Build the appropriate endpoint based on category
//       const baseUrl = 'https://email-service-latest-agqz.onrender.com/api/v1/emails';
//       let endpoint = '';

//       switch (category) {
//         case 'inbox':
//           endpoint = `${baseUrl}/inbox`;
//           break;
//         case 'sent':
//           endpoint = `${baseUrl}/sent`;
//           break;
//         case 'spam':
//           endpoint = `${baseUrl}/spam`;
//           break;
//         case 'draft':
//           endpoint = `${baseUrl}/drafts`;
//           break;
//         default:
//           endpoint = `${baseUrl}/inbox`;
//           break;
//       }

//       // Add query parameters
//       const params = new URLSearchParams({
//         email_id: linkedEmailId,
//         offset: '0', // Changed from 1 to 0 (more standard)
//         limit: '100' // Increased limit to get more emails
//       });

//       const fullUrl = `${endpoint}?${params.toString()}`;
//       console.log(`Fetching ${category} emails from:`, fullUrl);

//       // Make API request with proper headers
//       const response = await fetch(fullUrl, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${djombiToken}`,
//           'Accept': 'application/json'
//         }
//       });

//       console.log(`API response for ${category}:`, {
//         status: response.status,
//         statusText: response.statusText,
//         headers: Object.fromEntries(response.headers.entries())
//       });

//       // Get response text first
//       const responseText = await response.text();
//       console.log(`Raw response for ${category}:`, responseText.substring(0, 500));

//       // Parse JSON response
//       let data;
//       try {
//         data = responseText ? JSON.parse(responseText) : {};
//       } catch (parseError) {
//         console.error("JSON parse error:", parseError);
//         throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
//       }

//       // Handle HTTP errors
//       if (!response.ok) {
//         console.error(`HTTP error for ${category}:`, response.status, data);
        
//         // Handle specific error cases
//         if (response.status === 401) {
//           throw new Error("Authentication failed. Please log in again.");
//         } else if (response.status === 403) {
//           throw new Error("Access denied. Please check your permissions.");
//         } else if (response.status === 404) {
//           // 404 might mean no emails found, which is OK
//           console.log(`No ${category} emails found (404)`);
//           processEmailData([], category);
//           return;
//         } else {
//           throw new Error(`Server error (${response.status}): ${data.message || response.statusText}`);
//         }
//       }

//       // Handle API success/error flags
//       if (data.success === false) {
//         const errorMessage = data.message || data.error || 'API request failed';
//         console.error("API returned error:", errorMessage);
        
//         // Check if it's a "no emails" scenario
//         if (errorMessage.toLowerCase().includes('no') && 
//             (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('found'))) {
//           console.log(`API says no ${category} emails found`);
//           processEmailData([], category);
//           return;
//         }
        
//         throw new Error(errorMessage);
//       }

//       // Process successful response
//       console.log(`Successfully fetched ${category} data:`, data);
//       processEmailData(data, category);

//     } catch (error) {
//       console.error(`Error fetching ${category} emails:`, error);
//       set({
//         isLoading: false,
//         loadingError: error instanceof Error ? error.message : 'Unknown error occurred'
//       });
//     }
    
//     // Helper function to process email data from API response
//     function processEmailData(data: any, category: EmailCategory) {
//       console.log(`Processing ${category} email data:`, data);
      
//       // Initialize emails array
//       let emailsData: any[] = [];
      
//       // Try to extract emails from various possible response structures
//       if (Array.isArray(data)) {
//         emailsData = data;
//       } else if (data && typeof data === 'object') {
//         // Try common property names
//         const possibleArrayKeys = [
//           'data', 'emails', 'messages', 'items', 'results', 'content',
//           category, // Try the category name itself
//           `${category}s`, // Try pluralized category
//           'inbox', 'sent', 'drafts', 'spam'
//         ];
        
//         for (const key of possibleArrayKeys) {
//           if (data[key] && Array.isArray(data[key])) {
//             emailsData = data[key];
//             console.log(`Found emails array at key: ${key}`);
//             break;
//           }
//         }
        
//         // If still no array found, look for any array property
//         if (emailsData.length === 0) {
//           for (const key in data) {
//             if (Array.isArray(data[key]) && data[key].length > 0) {
//               emailsData = data[key];
//               console.log(`Found emails array at unexpected key: ${key}`);
//               break;
//             }
//           }
//         }
//       }

//       console.log(`Extracted ${emailsData.length} raw email items for ${category}`);

//       // Process and normalize email data
//       const processedEmails: Email[] = emailsData.map((item: any, index: number) => {
//         // Generate a unique ID if none exists
//         const emailId = item.id || 
//                        item.email_id || 
//                        item._id || 
//                        item.messageId || 
//                        item.message_id || 
//                        `${category}-${Date.now()}-${index}`;

//         const email: Email = {
//           id: emailId,
//           email_id: item.email_id || emailId,
//           from: item.from || item.sender || item.From || "unknown@example.com",
//           to: item.to || item.recipient || item.To || item.recipients || "",
//           subject: item.subject || item.Subject || item.title || "(No Subject)",
//           content: item.content || item.body || item.Body || item.text || item.textContent || item.htmlContent || "",
//           timestamp: item.timestamp || item.createdAt || item.created_at || item.date || item.Date || new Date().toISOString(),
//           createdAt: item.created_at || item.createdAt || item.timestamp || Date.now(),
//           isUrgent: Boolean(item.isUrgent || item.is_urgent || item.urgent || item.priority === 'high'),
//           hasAttachment: Boolean(item.hasAttachment || item.has_attachment || item.attachments?.length > 0),
//           status: category,
//           category: category,
//           isRead: Boolean(item.isRead || item.is_read || item.read || category === 'sent' || category === 'draft'),
//           contentType: item.contentType || item.content_type || item.type || 'text'
//         };
        
//         return email;
//       });

//       console.log(`Processed ${processedEmails.length} ${category} emails`);

//       // Update store state
//       set((state) => {
//         // Remove existing emails of this category
//         const otherEmails = state.emails.filter(email => 
//           email.category !== category && email.status !== category
//         );
        
//         // Combine with new emails
//         const allEmails = [...otherEmails, ...processedEmails];
        
//         // Update last fetch time
//         const newLastFetch = {
//           ...state.lastFetch,
//           [category]: Date.now()
//         };
        
//         console.log(`Updated store: ${processedEmails.length} new ${category} emails, ${allEmails.length} total`);
        
//         return {
//           emails: allEmails,
//           isLoading: false,
//           loadingError: null,
//           lastFetch: newLastFetch
//         };
//       });
//     }
//   },

//   // Add a new email
//   addEmail: (emailData) => {
//     const newEmail: Email = {
//       ...emailData,
//       id: uuidv4(),
//       timestamp: new Date().toISOString(),
//       isUrgent: false,
//       category: emailData.status || get().activeCategory,
//       status: emailData.status || get().activeCategory,
//       isRead: emailData.status === 'sent' || emailData.status === 'draft',
//       // Ensure all required fields from Email interface are set
//       from: emailData.from || "",
//       to: emailData.to || "",
//       subject: emailData.subject || "",
//       content: emailData.content || "",
//       hasAttachment: emailData.hasAttachment || false,
//       contentType: emailData.contentType || 'text',
//       createdAt: Date.now()
//     };

//     // Add to local state immediately for better UX
//     set((state) => ({
//       emails: [...state.emails, newEmail],
//     }));

//     console.log("Added email to store:", newEmail);

//     // Send to API if it's not a draft
//     if (emailData.status !== "draft") {
//       const { djombiToken, linkedEmailId } = getAuthFromStorage();

//       if (djombiToken && linkedEmailId) {
//         console.log("Sending email via API...");
//         fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails/send', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${djombiToken}`,
//           },
//           body: JSON.stringify({
//             to: newEmail.to,
//             subject: newEmail.subject,
//             content: newEmail.content,
//             email_id: linkedEmailId
//           })
//         })
//         .then(async (response) => {
//           const responseText = await response.text();
//           console.log("Send email response:", response.status, responseText);
          
//           if (response.ok) {
//             console.log("Email sent successfully");
//             // Refresh sent emails after successful send
//             setTimeout(() => {
//               get().fetchEmails('sent', true);
//             }, 1000);
//           } else {
//             console.error("Failed to send email:", response.status, responseText);
//           }
//         })
//         .catch(error => {
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
//     const { djombiToken, linkedEmailId } = getAuthFromStorage();

//     if (djombiToken && linkedEmailId) {
//       fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/${emailId}/move`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${djombiToken}`,
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

//     // Always fetch fresh emails for the category
//     console.log(`Setting active category to ${category}, fetching emails...`);
//     get().fetchEmails(category, true); // Force refresh when changing category
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
//           'Authorization': `Bearer ${djombiToken}`,
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
//             'Authorization': `Bearer ${djombiToken}`,
//           },
//           body: JSON.stringify({
//             to: draft.to,
//             subject: draft.subject,
//             content: draft.content,
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
//         timestamp: new Date().toISOString(),
//         status: "draft",
//         category: "draft",
//         isUrgent: false,
//         hasAttachment: !!draft.hasAttachment,
//         from: draft.from || "",
//         to: draft.to || "",
//         subject: draft.subject || "",
//         content: draft.content || "",
//         isRead: true,
//         contentType: draft.contentType || 'text',
//         createdAt: Date.now()
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
//             'Authorization': `Bearer ${djombiToken}`,
//           },
//           body: JSON.stringify({
//             to: newDraft.to,
//             subject: newDraft.subject,
//             content: newDraft.content,
//             email_id: linkedEmailId
//           })
//         }).catch(error => {
//           console.error("Error creating draft:", error);
//         });
//       }
//     }
//   },

//   // Remove email from store
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

// // Helper function to get auth items using Djombi tokens
// const getAuthFromStorage = () => {
//   return {
//     djombiToken: getDjombiAccessToken(),
//     linkedEmailId: getLinkedEmailId(),
//     regularToken: getAuthToken() // Keep for comparison
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
//     // Set loading state
//     set({ isLoading: true, loadingError: null });

//     try {
//       // Get linked email ID using enhanced function
//       const linkedEmailId = getLinkedEmailId();
//       console.log("Linked Email ID:", linkedEmailId);

//       // Validate email ID
//       if (!linkedEmailId) {
//         throw new Error("Email ID missing. Please link your email first.");
//       }

//       // Get Djombi access token
//       const djombiToken = getDjombiAccessToken();
//       console.log("Djombi token retrieved:", djombiToken ? `${djombiToken.substring(0, 10)}...` : 'No Djombi token found');
      
//       if (!djombiToken) {
//         throw new Error("Djombi authentication token missing. Please log in again.");
//       }

//       // Build the appropriate endpoint based on category with correct parameters
//       let endpoint = '';

//       if (category === 'inbox') {
//         endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=50`;
//       } else if (category === 'sent') {
//         endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/sent?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=50`;
//       } else if (category === 'spam') {
//         endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/spam?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=50`;
//       } else if (category === 'draft') {
//         endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=50`;
//       } else {
//         // Default to inbox
//         endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=50`;
//       }

//       console.log(`Fetching ${category} emails from:`, endpoint);

//       // Make API request with Djombi authorization header
//       const response = await fetch(endpoint, {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${djombiToken}`
//         },
//         method: 'GET'
//       });

//       console.log(`API response status for ${category}:`, response.status);
//       console.log(`API response headers:`, response.headers);

//       // Parse response first to see what we get
//       const responseText = await response.text();
//       console.log(`Raw response for ${category}:`, responseText);

//       let data;
//       try {
//         data = JSON.parse(responseText);
//         console.log(`Parsed ${category} response:`, data);
//       } catch (error) {
//         console.error("Error parsing response:", error, responseText);
//         throw new Error("Invalid response format from server");
//       }

//       // Handle different response scenarios
//       if (!response.ok) {
//         console.error(`Failed to fetch ${category} emails. Status: ${response.status}`);
        
//         // Check if it's a "no emails found" type of response vs a real error
//         if (response.status === 404 || 
//             (data && data.message && data.message.toLowerCase().includes('not found')) ||
//             (data && data.message && data.message.toLowerCase().includes('no emails'))) {
//           console.log(`No ${category} emails found - setting empty array`);
//           processEmailData([], category);
//           return;
//         }
        
//         throw new Error(`Failed to fetch ${category} emails: ${response.status} ${response.statusText} - ${responseText}`);
//       }

//       // Check for success/error in response data
//       if (data.success === false) {
//         const errorMessage = data.message || 'API request failed';
//         console.error("API error:", errorMessage);
        
//         // If it's a "no emails" message, treat as empty result
//         if (errorMessage.toLowerCase().includes('no') && errorMessage.toLowerCase().includes('email')) {
//           console.log(`API says no ${category} emails - setting empty array`);
//           processEmailData([], category);
//           return;
//         }
        
//         throw new Error(`API error: ${errorMessage}`);
//       }

//       // Process successful response
//       processEmailData(data, category);

//     } catch (error) {
//       console.error(`Error fetching ${category} emails:`, error);
//       set({
//         isLoading: false,
//         loadingError: error instanceof Error ? error.message : 'Unknown error fetching emails'
//       });
//     }
    
//     // Helper function to process email data from API response
//     function processEmailData(data: any, category: string) {
//       console.log(`Processing ${category} email data:`, data);
      
//       // Process the data, handling different possible response formats
//       let emailsData = [];
      
//       if (Array.isArray(data)) {
//         emailsData = data;
//       } else if (data.data && Array.isArray(data.data)) {
//         emailsData = data.data;
//       } else if (data[category] && Array.isArray(data[category])) {
//         emailsData = data[category];
//       } else if (data.drafts && Array.isArray(data.drafts)) {
//         emailsData = data.drafts;
//       } else if (data.sent && Array.isArray(data.sent)) {
//         emailsData = data.sent;
//       } else if (data.sentEmails && Array.isArray(data.sentEmails)) {
//         emailsData = data.sentEmails;
//       } else if (data.emails && Array.isArray(data.emails)) {
//         emailsData = data.emails;
//       } else if (data.inbox && Array.isArray(data.inbox)) {
//         emailsData = data.inbox;
//       } else if (data.spam && Array.isArray(data.spam)) {
//         emailsData = data.spam;
//       } else if (data.result && Array.isArray(data.result)) {
//         emailsData = data.result;
//       } else if (data.items && Array.isArray(data.items)) {
//         emailsData = data.items;
//       } else if (data.messages && Array.isArray(data.messages)) {
//         emailsData = data.messages;
//       } else if (typeof data === 'object') {
//         // If we can't find an obvious array, look for any array property
//         console.log("Searching for array in response object...");
//         for (const key in data) {
//           if (Array.isArray(data[key])) {
//             console.log(`Found array at key: ${key}`, data[key]);
//             emailsData = data[key];
//             break;
//           }
//         }
//       }

//       // If we still don't have an array, create an empty one
//       if (!Array.isArray(emailsData)) {
//         console.warn(`Could not find email array in ${category} response:`, data);
//         emailsData = [];
//       }

//       console.log(`Processing ${emailsData.length} ${category} emails`);

//       // Map the emails to the correct format
//       const processedEmails = emailsData.map((item: any, index: number) => {
//         const email: Email = {
//           id: item.id || item.email_id || item._id || item.messageId || item.message_id || `${category}-${Date.now()}-${index}`,
//           email_id: item.email_id || item.id || item._id,
//           from: item.from || item.sender || item.From || "unknown@example.com",
//           to: item.to || item.recipient || item.To || item.recipients || "",
//           subject: item.subject || item.Subject || "(No Subject)",
//           content: item.content || item.body || item.Body || item.textContent || item.htmlContent || "",
//           timestamp: item.timestamp || item.createdAt || item.created_at || item.date || item.Date || new Date().toISOString(),
//           createdAt: item.created_at || item.createdAt || Date.now(),
//           isUrgent: Boolean(item.isUrgent || item.is_urgent || item.priority === 'high'),
//           hasAttachment: Boolean(item.hasAttachment || item.has_attachment || item.attachments),
//           status: category,
//           category: category,
//           isRead: Boolean(item.isRead || item.is_read || category === 'sent' || category === 'draft'),
//           contentType: item.contentType || item.content_type || 'text'
//         };
        
//         console.log(`Processed email ${index + 1}:`, email);
//         return email;
//       });

//       // Update store - REPLACE emails of this category instead of filtering/appending
//       set((state) => {
//         // Remove old emails of this category
//         const otherEmails = state.emails.filter(email => 
//           email.status !== category && email.category !== category
//         );
        
//         // Add new emails
//         const newEmails = [...otherEmails, ...processedEmails];
        
//         console.log(`Updated store with ${processedEmails.length} ${category} emails. Total emails: ${newEmails.length}`);
        
//         return {
//           emails: newEmails,
//           isLoading: false
//         };
//       });
//     }
//   },

//   // Add a new email
//   addEmail: (emailData) => {
//     const newEmail: Email = {
//       ...emailData,
//       id: uuidv4(),
//       timestamp: new Date().toISOString(),
//       isUrgent: false,
//       category: emailData.status || get().activeCategory,
//       status: emailData.status || get().activeCategory,
//       isRead: emailData.status === 'sent' || emailData.status === 'draft',
//       // Ensure all required fields from Email interface are set
//       from: emailData.from || "",
//       to: emailData.to || "",
//       subject: emailData.subject || "",
//       content: emailData.content || "",
//       hasAttachment: emailData.hasAttachment || false,
//       contentType: emailData.contentType || 'text'
//     };

//     // Add to local state immediately for better UX
//     set((state) => ({
//       emails: [...state.emails, newEmail],
//     }));

//     console.log("Added email to store:", newEmail);

//     // Send to API if it's not a draft
//     if (emailData.status !== "draft") {
//       const { djombiToken, linkedEmailId } = getAuthFromStorage();

//       if (djombiToken && linkedEmailId) {
//         console.log("Sending email via API...");
//         // Send email via API using Djombi token
//         fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails/send', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${djombiToken}`,
//           },
//           body: JSON.stringify({
//             to: newEmail.to,
//             subject: newEmail.subject,
//             content: newEmail.content,
//             email_id: linkedEmailId
//           })
//         })
//         .then(async (response) => {
//           const responseText = await response.text();
//           console.log("Send email response:", response.status, responseText);
          
//           if (response.ok) {
//             console.log("Email sent successfully");
//             // After sending, refresh the sent emails to get the actual sent email from server
//             setTimeout(() => {
//               get().fetchEmails('sent');
//             }, 1000);
//           } else {
//             console.error("Failed to send email:", response.status, responseText);
//           }
//         })
//         .catch(error => {
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
//     const { djombiToken, linkedEmailId } = getAuthFromStorage();

//     if (djombiToken && linkedEmailId) {
//       fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/${emailId}/move`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${djombiToken}`,
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

//     // Always fetch fresh emails for the category to ensure we have latest data
//     const state = get();
//     if (!state.isLoading) {
//       console.log(`Setting active category to ${category}, fetching emails...`);
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
//           'Authorization': `Bearer ${djombiToken}`,
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
//             'Authorization': `Bearer ${djombiToken}`,
//           },
//           body: JSON.stringify({
//             to: draft.to,
//             subject: draft.subject,
//             content: draft.content,
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
//         timestamp: new Date().toISOString(),
//         status: "draft",
//         category: "draft",
//         isUrgent: false,
//         hasAttachment: !!draft.hasAttachment,
//         // Add required fields that might be missing in the partial draft
//         from: draft.from || "",
//         to: draft.to || "",
//         subject: draft.subject || "",
//         content: draft.content || "",
//         isRead: true, // For drafts, set as read
//         contentType: draft.contentType || 'text'
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
//             'Authorization': `Bearer ${djombiToken}`,
//           },
//           body: JSON.stringify({
//             to: newDraft.to,
//             subject: newDraft.subject,
//             content: newDraft.content,
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










































































// 6/30/2025 12:00  
// import { Email, EmailCategory, EmailSegment } from "@/lib/types/email";
// import { create } from "zustand";
// import { v4 as uuidv4 } from "uuid";
// import { getCookie, getAuthToken } from "@/lib/utils/cookies";
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

// // Helper function to get auth items using Djombi tokens
// const getAuthFromStorage = () => {
//   return {
//     djombiToken: getDjombiAccessToken(),
//     linkedEmailId: getLinkedEmailId(),
//     regularToken: getAuthToken() // Keep for comparison
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
//     // Set loading state
//     set({ isLoading: true, loadingError: null });

//     try {
//       // Get linked email ID using enhanced function
//       const linkedEmailId = getLinkedEmailId();
//       console.log("Linked Email ID:", linkedEmailId);

//       // Validate email ID
//       if (!linkedEmailId) {
//         throw new Error("Email ID missing. Please link your email first.");
//       }

//       // Get Djombi access token
//       const djombiToken = getDjombiAccessToken();
//       console.log("Djombi token retrieved:", djombiToken ? `${djombiToken.substring(0, 10)}...` : 'No Djombi token found');
      
//       if (!djombiToken) {
//         throw new Error("Djombi authentication token missing. Please log in again.");
//       }

//       // Build the appropriate endpoint based on category with correct offset parameter
//       let endpoint = '';

//       if (category === 'inbox' || category === 'sent' || category === 'spam') {
//         // Keep offset=1 as it works for drafts
//         endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/${category}?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//       } else if (category === 'draft') {
//         // Keep offset=1 as it works for drafts
//         endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//       } else {
//         // Default to inbox with proper parameters
//         endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//       }

//       console.log(`Fetching ${category} emails from:`, endpoint);

//       // Make API request with Djombi authorization header
//       const response = await fetch(endpoint, {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${djombiToken}` // Use Djombi token
//         }
//       });

//       console.log(`API response status for ${category}:`, response.status);

//       // Handle API errors
//       if (!response.ok) {
//         console.error(`Failed to fetch ${category} emails. Status: ${response.status}`);
        
//         // Log the error response for debugging
//         const errorText = await response.text();
//         console.error(`API Error Response:`, errorText);
        
//         // For draft emails, try the alternative POST method
//         if (category === 'draft') {
//           const postEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts';
//           const postResponse = await fetch(postEndpoint, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//               'Authorization': `Bearer ${djombiToken}` // Use Djombi token
//             },
//             body: JSON.stringify({
//               email_id: linkedEmailId,
//               content: ""
//             })
//           });
          
//           if (!postResponse.ok) {
//             const postErrorText = await postResponse.text();
//             console.error("POST Draft Error:", postErrorText);
//             throw new Error(`Failed to fetch ${category} emails: ${postResponse.status} ${postResponse.statusText} - ${postErrorText}`);
//           }
          
//           const postData = await postResponse.json();
//           processEmailData(postData, category);
//           return;
//         } 
//         // Add POST fallback for sent emails (same pattern as drafts)
//         else if (category === 'sent') {
//           const postEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/sent';
//           const postResponse = await fetch(postEndpoint, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//               'Authorization': `Bearer ${djombiToken}` // Use Djombi token
//             },
//             body: JSON.stringify({
//               email_id: linkedEmailId,
//               offset: 1,
//               limit: 20
//             })
//           });
          
//           if (!postResponse.ok) {
//             const postErrorText = await postResponse.text();
//             console.error("POST Sent Error:", postErrorText);
//             throw new Error(`Failed to fetch ${category} emails: ${postResponse.status} ${postResponse.statusText} - ${postErrorText}`);
//           }
          
//           const postData = await postResponse.json();
//           processEmailData(postData, category);
//           return;
//         }
//         // Add POST fallback for spam emails (same pattern as drafts)
//         else if (category === 'spam') {
//           const postEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/spam';
//           const postResponse = await fetch(postEndpoint, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//               'Authorization': `Bearer ${djombiToken}` // Use Djombi token
//             },
//             body: JSON.stringify({
//               email_id: linkedEmailId,
//               offset: 1,
//               limit: 20
//             })
//           });
          
//           if (!postResponse.ok) {
//             const postErrorText = await postResponse.text();
//             console.error("POST Spam Error:", postErrorText);
//             throw new Error(`Failed to fetch ${category} emails: ${postResponse.status} ${postResponse.statusText} - ${postErrorText}`);
//           }
          
//           const postData = await postResponse.json();
//           processEmailData(postData, category);
//           return;
//         }
//         else {
//           throw new Error(`Failed to fetch ${category} emails: ${response.status} ${response.statusText} - ${errorText}`);
//         }
//       }

//       // Parse response
//       const responseText = await response.text();
//       let data;
      
//       try {
//         data = JSON.parse(responseText);
//         console.log(`Parsed ${category} response:`, data);
//       } catch (error) {
//         console.error("Error parsing response:", error, responseText);
//         throw new Error("Invalid response format from server");
//       }

//       processEmailData(data, category);
//     } catch (error) {
//       console.error(`Error fetching ${category} emails:`, error);
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
//       } else if (data.emails && Array.isArray(data.emails)) {
//         // Handle emails specific response format
//         emailsData = data.emails;
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
//         console.warn(`Could not find email array in ${category} response:`, data);
//         emailsData = [];
//       }

//       console.log(`Processing ${emailsData.length} ${category} emails`);

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
//             isRead: item.isRead || false,
//             contentType: item.contentType || 'text'
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
//       isRead: false,
//       // Ensure all required fields from Email interface are set
//       from: emailData.from || "",
//       to: emailData.to || "",
//       subject: emailData.subject || "",
//       content: emailData.content || "",
//       hasAttachment: emailData.hasAttachment || false,
//       contentType: emailData.contentType || 'text'
//     };

//     // Add to local state
//     set((state) => ({
//       emails: [...state.emails, newEmail],
//     }));

//     // Send to API if it's not a draft
//     if (emailData.status !== "draft") {
//       const { djombiToken, linkedEmailId } = getAuthFromStorage();

//       if (djombiToken && linkedEmailId) {
//         // Send email via API using Djombi token
//         fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails/send', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${djombiToken}`, // Use Djombi token
//           },
//           body: JSON.stringify({
//             ...newEmail,
//             email_id: linkedEmailId
//           })
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
//         isRead: true, // For drafts, set as read
//         contentType: draft.contentType || 'text'
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

// // Helper function to get auth items using Djombi tokens
// const getAuthFromStorage = () => {
//   return {
//     djombiToken: getDjombiAccessToken(),
//     linkedEmailId: getLinkedEmailId(),
//     regularToken: getAuthToken() // Keep for comparison
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
//     // Set loading state
//     set({ isLoading: true, loadingError: null });

//     try {
//       // Get linked email ID using enhanced function
//       const linkedEmailId = getLinkedEmailId();
//       console.log("Linked Email ID:", linkedEmailId);

//       // Validate email ID
//       if (!linkedEmailId) {
//         throw new Error("Email ID missing. Please link your email first.");
//       }

//       // Get Djombi access token
//       const djombiToken = getDjombiAccessToken();
//       console.log("Djombi token retrieved:", djombiToken ? `${djombiToken.substring(0, 10)}...` : 'No Djombi token found');
      
//       if (!djombiToken) {
//         throw new Error("Djombi authentication token missing. Please log in again.");
//       }

//       // Build the appropriate endpoint based on category with proper URL parameters
//       let endpoint = '';

//       if (category === 'inbox' || category === 'sent' || category === 'spam') {
//         endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/${category}?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//       } else if (category === 'draft') {
//         endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//       } else {
//         // Default to inbox with proper parameters
//         endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//       }

//       console.log(`Fetching ${category} emails from:`, endpoint);

//       // Make API request with Djombi authorization header
//       const response = await fetch(endpoint, {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${djombiToken}` // Use Djombi token
//         }
//       });

//       console.log(`API response status for ${category}:`, response.status);

//       // Handle API errors
//       if (!response.ok) {
//         console.error(`Failed to fetch ${category} emails. Status: ${response.status}`);
        
//         // For draft emails, try the alternative POST method
//         if (category === 'draft') {
//           const postEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts';
//           const postResponse = await fetch(postEndpoint, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//               'Authorization': `Bearer ${djombiToken}` // Use Djombi token
//             },
//             body: JSON.stringify({
//               email_id: linkedEmailId,
//               content: ""
//             })
//           });
          
//           if (!postResponse.ok) {
//             throw new Error(`Failed to fetch ${category} emails: ${postResponse.status} ${postResponse.statusText}`);
//           }
          
//           const postData = await postResponse.json();
//           processEmailData(postData, category);
//           return;
//         } else {
//           const errorText = await response.text();
//           throw new Error(`Failed to fetch ${category} emails: ${response.status} ${response.statusText} - ${errorText}`);
//         }
//       }

//       // Parse response
//       const responseText = await response.text();
//       let data;
      
//       try {
//         data = JSON.parse(responseText);
//         console.log(`Parsed ${category} response:`, data);
//       } catch (error) {
//         console.error("Error parsing response:", error, responseText);
//         throw new Error("Invalid response format from server");
//       }

//       processEmailData(data, category);
//     } catch (error) {
//       console.error(`Error fetching ${category} emails:`, error);
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
//       } else if (data.emails && Array.isArray(data.emails)) {
//         // Handle emails specific response format
//         emailsData = data.emails;
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
//         console.warn(`Could not find email array in ${category} response:`, data);
//         emailsData = [];
//       }

//       console.log(`Processing ${emailsData.length} ${category} emails`);

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
//             isRead: item.isRead || false,
//             contentType: item.contentType || 'text'
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
//       isRead: false,
//       // Ensure all required fields from Email interface are set
//       from: emailData.from || "",
//       to: emailData.to || "",
//       subject: emailData.subject || "",
//       content: emailData.content || "",
//       hasAttachment: emailData.hasAttachment || false,
//       contentType: emailData.contentType || 'text'
//     };

//     // Add to local state
//     set((state) => ({
//       emails: [...state.emails, newEmail],
//     }));

//     // Send to API if it's not a draft
//     if (emailData.status !== "draft") {
//       const { djombiToken, linkedEmailId } = getAuthFromStorage();

//       if (djombiToken && linkedEmailId) {
//         // Send email via API using Djombi token
//         fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails/send', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${djombiToken}`, // Use Djombi token
//           },
//           body: JSON.stringify({
//             ...newEmail,
//             email_id: linkedEmailId
//           })
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
//         isRead: true, // For drafts, set as read
//         contentType: draft.contentType || 'text'
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


















































// // import { Email, EmailCategory, EmailSegment } from "@/lib/types/email";
// import { create } from "zustand";
// import { v4 as uuidv4 } from "uuid";
// // import { getCookie, getAuthToken } from "@/lib/utils/cookies";

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
