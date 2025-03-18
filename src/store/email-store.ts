/* eslint-disable @typescript-eslint/no-explicit-any */
import { Email, EmailCategory, EmailSegment } from "@/lib/types/email";
import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

// Helper function to get auth items from localStorage
const getAuthFromLocalStorage = () => {
  if (typeof window === 'undefined') return { accessToken: null, linkedEmailId: null };

  return {
    accessToken: localStorage.getItem('accessToken'),
    linkedEmailId: localStorage.getItem('linkedEmailId')
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
}

export const useEmailStore = create<EmailStore>((set, get) => ({
  emails: [
    {
      id: "1",
      from: "danielodedara@gmail.com",
      to: "test@example.com",
      subject: "Welcome to Adafri Dashboard",
      content: "Welcome to your new dashboard!",
      timestamp: "05/12 - 14:48",
      isUrgent: false,
      hasAttachment: true,
      status: "inbox",
      category: "inbox",
    },
    {
      id: "2",
      from: "danielodedara@gmail.com",
      to: "test@example.com",
      subject: "Adafri",
      content: "Welcome to your new dashboard!",
      timestamp: "05/12 - 14:48",
      isUrgent: false,
      hasAttachment: true,
      status: "sent",
      category: "sent",
    },
    {
      id: "3",
      from: "danielodedara@gmail.com",
      to: "test@example.com",
      subject: "Welcome to Adafri Dashboard",
      content: "Welcome to your new dashboard!",
      timestamp: "05/12 - 14:48",
      isUrgent: false,
      hasAttachment: true,
      status: "sent",
      category: "sent",
    },
    {
      id: "4",
      from: "danielodedara@gmail.com",
      to: "test@example.com",
      subject: "Welcome to Adafri Dashboard",
      content: "Welcome to your new dashboard!",
      timestamp: "05/12 - 14:48",
      isUrgent: false,
      hasAttachment: true,
      status: "draft",
      category: "sent",
    },
  ],
  customSegments: [],
  activeCategory: "inbox",
  draftEmail: null,
  isLoading: false,
  loadingError: null,

  // Fetch emails from API based on category
  // Fetch emails from API based on category
  fetchEmails: async (category) => {
    // Set loading state
    set({ isLoading: true, loadingError: null });

    try {
      // Get auth data from localStorage
      const emailId = localStorage.getItem('emailId') || '';

      // Validate email ID
      if (!emailId) {
        throw new Error("Email ID missing. Please link your email first.");
      }

      // Build the appropriate endpoint based on category
      let endpoint = '';

      if (category === 'inbox' || category === 'sent' || category === 'draft' || category === 'spam') {
        endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/${category}?email_id=${emailId}`;
      } else {
        endpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${emailId}`;
      }

      // Make API request
      const response = await fetch(endpoint);

      // Handle API errors
      if (!response.ok) {
        throw new Error(`Failed to fetch ${category} emails: ${response.statusText}`);
      }

      // Parse response
      const data = await response.json();

      // Update store with fetched emails
      set((state) => ({
        emails: [
          ...state.emails.filter(email => email.status !== category), // Remove old emails of this category
          ...data.map((item: any) => ({
            id: item.id || crypto.randomUUID(),
            from: item.from || "unknown@example.com",
            to: item.to || "",
            subject: item.subject || "(No Subject)",
            content: item.content || "",
            timestamp: item.timestamp || new Date().toLocaleString(),
            isUrgent: item.isUrgent || false,
            hasAttachment: item.hasAttachment || false,
            status: category,
            category: category
          }))
        ],
        isLoading: false
      }));
    } catch (error) {
      console.error("Error fetching emails:", error);
      set({
        isLoading: false,
        loadingError: error instanceof Error ? error.message : 'Unknown error fetching emails'
      });
    }
  },

  // Add a new email
  addEmail: (emailData) => {
    const newEmail = {
      ...emailData,
      id: uuidv4(),
      timestamp: new Date().toLocaleString(),
      isUrgent: false,
      category: get().activeCategory,
      status: emailData.status || get().activeCategory,
    };

    // Add to local state
    set((state) => ({
      emails: [...state.emails, newEmail],
    }));

    // Send to API if it's not a draft
    if (emailData.status !== "draft") {
      const { accessToken, linkedEmailId } = getAuthFromLocalStorage();

      if (accessToken && linkedEmailId) {
        // Send email via API
        fetch('/api/emails/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Email-Id': linkedEmailId,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newEmail)
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
    const { accessToken, linkedEmailId } = getAuthFromLocalStorage();

    if (accessToken && linkedEmailId) {
      fetch(`/api/emails/${emailId}/move`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Email-Id': linkedEmailId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category })
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
    const { accessToken, linkedEmailId } = getAuthFromLocalStorage();

    if (accessToken && linkedEmailId) {
      fetch(`/api/emails/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Email-Id': linkedEmailId
        }
      }).catch(error => {
        console.error("Error deleting email:", error);
      });
    }
  },

  // Save draft
  saveDraft: (draft) => {
    if (draft.id) {
      // Update existing draft
      set((state) => ({
        emails: state.emails.map((email) =>
          email.id === draft.id ? { ...email, ...draft } : email
        ),
      }));

      // Update via API
      const { accessToken, linkedEmailId } = getAuthFromLocalStorage();

      if (accessToken && linkedEmailId) {
        fetch(`/api/emails/drafts/${draft.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Email-Id': linkedEmailId,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(draft)
        }).catch(error => {
          console.error("Error updating draft:", error);
        });
      }
    } else {
      // Create new draft
      // const newDraft = {
      //   ...draft,
      //   id: draft.id,
      //   timestamp: new Date().toLocaleString(),
      //   status: "draft",
      //   category: "draft",
      //   isUrgent: false,
      //   hasAttachment: !!draft.hasAttachment
      // };

      // //  Add to local state
      // set((state) => ({
      //   emails: [...state.emails, newDraft],
      // }));

      // Send to API
      const { accessToken, linkedEmailId } = getAuthFromLocalStorage();

      if (accessToken && linkedEmailId) {
        fetch('/api/emails/drafts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Email-Id': linkedEmailId,
            'Content-Type': 'application/json'
          },
          // body: JSON.stringify(newDraft)
        }).catch(error => {
          console.error("Error saving draft:", error);
        });
      }
    }
  },

  // removeEmail: (id) => set((state) => ({ 
  //   emails: state.emails.filter((email) => email.id !== id) 
  // })),

  // Update draft state
  // updateDraft: (data) => {
  //   console.log("Updating draft state:", data);
  //   set({ draftEmail: data });
  // },
}));





























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
