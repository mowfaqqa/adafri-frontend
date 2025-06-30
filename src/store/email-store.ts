import { Email, EmailCategory, EmailSegment } from "@/lib/types/email";
import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { getCookie, getAuthToken } from "@/lib/utils/cookies";
import { DjombiProfileService } from "@/lib/services/DjombiProfileService";

// Helper function to get Djombi access token
const getDjombiAccessToken = (): string | null => {
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
};

// Helper function to get linked email ID
const getLinkedEmailId = (): string | null => {
  // First try cookies
  const emailIdFromCookie = getCookie('linkedEmailId');
  if (emailIdFromCookie) {
    return emailIdFromCookie;
  }
  
  // Then try localStorage
  if (typeof window !== 'undefined') {
    const emailIdFromStorage = localStorage.getItem('linkedEmailId');
    if (emailIdFromStorage) {
      return emailIdFromStorage;
    }
  }
  
  return null;
};

// Helper function to get auth items using Djombi tokens
const getAuthFromStorage = () => {
  return {
    djombiToken: getDjombiAccessToken(),
    linkedEmailId: getLinkedEmailId(),
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

  // Actions
  fetchEmails: (category: EmailCategory) => Promise<void>;
  addEmail: (emailData: Omit<Email, "id" | "timestamp" | "isUrgent" | "category">) => void;
  moveEmail: (emailId: string, segment: EmailSegment) => void;
  moveEmailToCategory: (emailId: string, category: EmailCategory) => void;
  addSegment: (name: string) => void;
  setActiveCategory: (category: EmailCategory) => void;
  deleteEmail: (id: string) => void;
  saveDraft: (draft: Partial<Email>) => void;
  updateDraft: (data: any) => void;
  removeEmail: (id: string) => void;
}

export const useEmailStore = create<EmailStore>((set, get) => ({
  emails: [],
  customSegments: [],
  activeCategory: "inbox",
  draftEmail: null,
  isLoading: false,
  loadingError: null,

  // Fetch emails from API based on category
  fetchEmails: async (category) => {
    // Set loading state
    set({ isLoading: true, loadingError: null });

    try {
      // Get linked email ID using enhanced function
      const linkedEmailId = getLinkedEmailId();
      console.log("Linked Email ID:", linkedEmailId);

      // Validate email ID
      if (!linkedEmailId) {
        throw new Error("Email ID missing. Please link your email first.");
      }

      // Get Djombi access token
      const djombiToken = getDjombiAccessToken();
      console.log("Djombi token retrieved:", djombiToken ? `${djombiToken.substring(0, 10)}...` : 'No Djombi token found');
      
      if (!djombiToken) {
        throw new Error("Djombi authentication token missing. Please log in again.");
      }

      // Build the appropriate endpoint based on category with proper URL parameters
      let endpoint = '';

      if (category === 'inbox' || category === 'sent' || category === 'spam') {
        endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/${category}?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
      } else if (category === 'draft') {
        endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
      } else {
        // Default to inbox with proper parameters
        endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
      }

      console.log(`Fetching ${category} emails from:`, endpoint);

      // Make API request with Djombi authorization header
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${djombiToken}` // Use Djombi token
        }
      });

      console.log(`API response status for ${category}:`, response.status);

      // Handle API errors
      if (!response.ok) {
        console.error(`Failed to fetch ${category} emails. Status: ${response.status}`);
        
        // For draft emails, try the alternative POST method
        if (category === 'draft') {
          const postEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts';
          const postResponse = await fetch(postEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${djombiToken}` // Use Djombi token
            },
            body: JSON.stringify({
              email_id: linkedEmailId,
              content: ""
            })
          });
          
          if (!postResponse.ok) {
            throw new Error(`Failed to fetch ${category} emails: ${postResponse.status} ${postResponse.statusText}`);
          }
          
          const postData = await postResponse.json();
          processEmailData(postData, category);
          return;
        } else {
          const errorText = await response.text();
          throw new Error(`Failed to fetch ${category} emails: ${response.status} ${response.statusText} - ${errorText}`);
        }
      }

      // Parse response
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
        console.log(`Parsed ${category} response:`, data);
      } catch (error) {
        console.error("Error parsing response:", error, responseText);
        throw new Error("Invalid response format from server");
      }

      processEmailData(data, category);
    } catch (error) {
      console.error(`Error fetching ${category} emails:`, error);
      set({
        isLoading: false,
        loadingError: error instanceof Error ? error.message : 'Unknown error fetching emails'
      });
    }
    
    // Helper function to process email data from API response
    function processEmailData(data: any, category: string) {
      // Process the data, handling different possible response formats
      let emailsData = [];
      
      if (Array.isArray(data)) {
        emailsData = data;
      } else if (data.data && Array.isArray(data.data)) {
        emailsData = data.data;
      } else if (data[category] && Array.isArray(data[category])) {
        emailsData = data[category];
      } else if (data.drafts && Array.isArray(data.drafts)) {
        // Handle drafts specific response format
        emailsData = data.drafts;
      } else if (data.emails && Array.isArray(data.emails)) {
        // Handle emails specific response format
        emailsData = data.emails;
      } else if (typeof data === 'object') {
        // If we can't find an obvious array, look for any array property
        for (const key in data) {
          if (Array.isArray(data[key]) && data[key].length > 0) {
            emailsData = data[key];
            break;
          }
        }
      }

      // If we still don't have an array, create an empty one
      if (!Array.isArray(emailsData)) {
        console.warn(`Could not find email array in ${category} response:`, data);
        emailsData = [];
      }

      console.log(`Processing ${emailsData.length} ${category} emails`);

      // Update store with fetched emails
      set((state) => ({
        emails: [
          ...state.emails.filter(email => email.status !== category), // Remove old emails of this category
          ...emailsData.map((item: any) => ({
            id: item.id || item.email_id || item._id || uuidv4(), // Use appropriate ID field
            email_id: item.email_id || item.id || item._id, // Store the original email_id
            from: item.from || "unknown@example.com",
            to: item.to || "",
            subject: item.subject || "(No Subject)",
            content: item.content || "",
            timestamp: item.timestamp || new Date().toLocaleString(),
            createdAt: item.created_at || item.createdAt || Date.now(),
            isUrgent: item.isUrgent || false,
            hasAttachment: item.hasAttachment || false,
            status: category,
            category: category,
            isRead: item.isRead || false,
            contentType: item.contentType || 'text'
          }))
        ],
        isLoading: false
      }));
    }
  },

  // Add a new email
  addEmail: (emailData) => {
    const newEmail: Email = {
      ...emailData,
      id: uuidv4(),
      timestamp: new Date().toLocaleString(),
      isUrgent: false,
      category: get().activeCategory,
      status: emailData.status || get().activeCategory,
      isRead: false,
      // Ensure all required fields from Email interface are set
      from: emailData.from || "",
      to: emailData.to || "",
      subject: emailData.subject || "",
      content: emailData.content || "",
      hasAttachment: emailData.hasAttachment || false,
      contentType: emailData.contentType || 'text'
    };

    // Add to local state
    set((state) => ({
      emails: [...state.emails, newEmail],
    }));

    // Send to API if it's not a draft
    if (emailData.status !== "draft") {
      const { djombiToken, linkedEmailId } = getAuthFromStorage();

      if (djombiToken && linkedEmailId) {
        // Send email via API using Djombi token
        fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${djombiToken}`, // Use Djombi token
          },
          body: JSON.stringify({
            ...newEmail,
            email_id: linkedEmailId
          })
        }).catch(error => {
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
          'Authorization': `Bearer ${djombiToken}`, // Use Djombi token
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

    // Fetch emails for this category if we don't have any yet
    const state = get();
    const categoryEmails = state.emails.filter(email => email.status === category);

    if (categoryEmails.length === 0 && !state.isLoading) {
      get().fetchEmails(category);
    }
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
          'Authorization': `Bearer ${djombiToken}`, // Use Djombi token
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
            'Authorization': `Bearer ${djombiToken}`, // Use Djombi token
          },
          body: JSON.stringify({
            ...draft,
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
        timestamp: new Date().toLocaleString(),
        status: "draft",
        category: "draft",
        isUrgent: false,
        hasAttachment: !!draft.hasAttachment,
        // Add required fields that might be missing in the partial draft
        from: draft.from || "",
        to: draft.to || "",
        subject: draft.subject || "",
        content: draft.content || "",
        isRead: true, // For drafts, set as read
        contentType: draft.contentType || 'text'
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
            'Authorization': `Bearer ${djombiToken}`, // Use Djombi token
          },
          body: JSON.stringify({
            ...newDraft,
            email_id: linkedEmailId
          })
        }).catch(error => {
          console.error("Error creating draft:", error);
        });
      }
    }
  },

  // Fixed parameter name to match the interface
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
