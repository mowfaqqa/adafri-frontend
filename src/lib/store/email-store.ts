import { Email, EmailCategory, EmailSegment } from "@/lib/types/email";
import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
// import {
//   getCookie,
//   getAuthToken,
//   getSelectedLinkedEmailId,
//   getSelectedLinkedEmailType,
//   getSelectedLinkedEmail,
//   setSelectedLinkedEmail
// } from "@/lib/utils/cookies";
import { DjombiProfileService } from "@/lib/services/DjombiProfileService";
import { AuthValidationService } from "@/lib/services/AuthValidationService";
import {
  getCookie,
  getSelectedLinkedEmailId,
  getSelectedLinkedEmailType,
  getSelectedLinkedEmail,
  getCurrentOrganization,
  setSelectedLinkedEmail,
} from "../utils/enhancedCookies";

// Enhanced helper to get validated auth state with organization context
const getValidatedAuthStateWithOrg = async () => {
  const djombiToken = getDjombiAccessToken();
  const linkedEmailId = getLinkedEmailId();
  const selectedEmailType = getSelectedLinkedEmailType();
  const currentOrgId = getCurrentOrganization();

  // Basic validation
  if (!djombiToken) {
    throw new Error("Authentication token missing. Please log in again.");
  }

  if (!linkedEmailId) {
    throw new Error(
      "Email ID missing. Please select an email account in the dropdown."
    );
  }

  if (!currentOrgId) {
    throw new Error(
      "Organization context missing. Please select an organization."
    );
  }

  // Validate token format
  if (!AuthValidationService.isValidJWTFormat(djombiToken)) {
    throw new Error(
      "Invalid authentication token format. Please log in again."
    );
  }

  // Check if token is expired
  if (AuthValidationService.isTokenExpired(djombiToken)) {
    throw new Error("Authentication token has expired. Please log in again.");
  }

  return {
    djombiToken,
    linkedEmailId,
    selectedEmailType,
    organizationId: currentOrgId,
  };
};

// Enhanced helper function to get Djombi access token
const getDjombiAccessToken = (): string | null => {
  try {
    // First try from DjombiProfileService
    const { accessToken } = DjombiProfileService.getStoredDjombiTokens();
    if (accessToken && AuthValidationService.isValidJWTFormat(accessToken)) {
      return accessToken;
    }

    // Fallback to localStorage directly
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("djombi_access_token");
      if (storedToken && AuthValidationService.isValidJWTFormat(storedToken)) {
        return storedToken;
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting Djombi access token:", error);
    return null;
  }
};

// Enhanced helper function to get linked email ID with validation
const getLinkedEmailId = (): string | null => {
  try {
    const selectedEmailId = getSelectedLinkedEmailId();
    if (selectedEmailId) {
      return selectedEmailId;
    }

    const emailIdFromCookie = getCookie("linkedEmailId");
    if (emailIdFromCookie) {
      return emailIdFromCookie;
    }

    if (typeof window !== "undefined") {
      const emailIdFromStorage = localStorage.getItem("linkedEmailId");
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

  // Current selected email and organization info
  selectedEmailId: string | null;
  selectedEmailType: string | null;
  currentOrganizationId: string | null;

  // Enhanced refresh tracking
  lastFetch: Record<string, number>;
  fetchAttempts: Record<string, number>;

  // Actions
  fetchEmails: (
    category: EmailCategory,
    forceRefresh?: boolean
  ) => Promise<void>;
  addEmail: (
    emailData: Omit<Email, "id" | "timestamp" | "isUrgent" | "category">
  ) => void;
  moveEmail: (emailId: string, segment: EmailSegment) => void;
  moveEmailToCategory: (emailId: string, category: EmailCategory) => void;
  addSegment: (name: string) => void;
  setActiveCategory: (category: EmailCategory) => void;
  deleteEmail: (id: string) => void;
  saveDraft: (draft: Partial<Email>) => void;
  updateDraft: (data: any) => void;
  removeEmail: (id: string) => void;

  // Organization and email context actions
  updateSelectedEmail: (emailId: string, emailType: string | null) => void;
  updateOrganizationContext: (orgId: string) => void;
  refreshCurrentCategory: () => void;

  // Error recovery actions
  retryLastFetch: () => void;
  clearError: () => void;
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
  currentOrganizationId: null,
  lastFetch: {},
  fetchAttempts: {},

  // Enhanced error recovery
  retryLastFetch: () => {
    const currentCategory = get().activeCategory;
    get().fetchEmails(currentCategory, true);
  },

  clearError: () => {
    set({ loadingError: null });
  },

  // Update organization context
  updateOrganizationContext: (orgId: string) => {
    console.log(`🏢 Organization context updated to: ${orgId}`);
    set({
      currentOrganizationId: orgId,
      loadingError: null, // Clear any previous errors
    });

    // Refresh current category with new organization context
    const currentCategory = get().activeCategory;

    // Clear existing emails to force refresh
    set((state) => ({
      emails: [],
      fetchAttempts: {}, // Reset all attempt counters
    }));

    // Fetch emails with new organization context
    setTimeout(() => {
      get().fetchEmails(currentCategory, true);
    }, 500); // Small delay to ensure organization context is set
  },

  // Update selected email and refresh current category
  updateSelectedEmail: (emailId: string, emailType: string | null) => {
    // Update cookies
    setSelectedLinkedEmail(emailId, emailType);

    // Update store state
    set({
      selectedEmailId: emailId,
      selectedEmailType: emailType,
      loadingError: null, // Clear any previous errors
    });

    // Refresh current category with new email selection
    const currentCategory = get().activeCategory;
    console.log(
      `📧 Email selection changed to ${emailType} (${emailId}), refreshing ${currentCategory} emails`
    );

    // Clear emails for current category to show fresh data
    set((state) => ({
      emails: state.emails.filter(
        (email) =>
          email.category !== currentCategory && email.status !== currentCategory
      ),
      fetchAttempts: {
        ...state.fetchAttempts,
        [`${currentCategory}_${emailId}_${emailType}`]: 0, // Reset attempt counter for new selection
      },
    }));

    // Fetch emails for the current category with new email selection
    get().fetchEmails(currentCategory, true);
  },

  // Refresh current category
  refreshCurrentCategory: () => {
    const currentCategory = get().activeCategory;
    get().fetchEmails(currentCategory, true);
  },

  // Enhanced fetch emails with organization context
  fetchEmails: async (category, forceRefresh = false) => {
    const state = get();

    // Update selected email and organization info from cookies/storage
    const selectedEmail = getSelectedLinkedEmail();
    const currentOrgId = getCurrentOrganization();

    if (selectedEmail) {
      set({
        selectedEmailId: selectedEmail.id,
        selectedEmailType: selectedEmail.type,
      });
    }

    if (currentOrgId) {
      set({ currentOrganizationId: currentOrgId });
    }

    // Prevent concurrent fetches of the same category
    if (state.isLoading && !forceRefresh) {
      console.log(`⏳ Already fetching ${category} emails, skipping...`);
      return;
    }

    // Enhanced cache key with organization context
    const cacheKey = `${category}_${selectedEmail?.id || "no_email"}_${selectedEmail?.type || "unknown"}_${currentOrgId || "no_org"}`;
    const lastFetchTime = state.lastFetch[cacheKey] || 0;
    const timeSinceLastFetch = Date.now() - lastFetchTime;
    const MINIMUM_FETCH_INTERVAL = 2000;
    const MAX_RETRY_ATTEMPTS = 3;

    // Check retry attempts
    const attemptCount = state.fetchAttempts[cacheKey] || 0;
    if (attemptCount >= MAX_RETRY_ATTEMPTS && !forceRefresh) {
      console.log(
        `❌ Max retry attempts reached for ${category}, skipping automatic fetch`
      );
      set({
        loadingError: `Failed to load ${category} emails after ${MAX_RETRY_ATTEMPTS} attempts. Please try refreshing manually.`,
      });
      return;
    }

    if (!forceRefresh && timeSinceLastFetch < MINIMUM_FETCH_INTERVAL) {
      console.log(`⏭️ Skipping ${category} fetch, too soon since last fetch`);
      return;
    }

    // Set loading state and clear previous errors
    set({
      isLoading: true,
      loadingError: null,
      fetchAttempts: {
        ...state.fetchAttempts,
        [cacheKey]: attemptCount + 1,
      },
    });

    try {
      console.log(
        `🚀 Fetching ${category} emails (attempt ${attemptCount + 1}/${MAX_RETRY_ATTEMPTS})...`
      );

      // Enhanced authentication validation with organization context
      const authState = await getValidatedAuthStateWithOrg();

      console.log("📋 Fetching emails with validated auth and organization:", {
        category,
        emailType: authState.selectedEmailType || "no type",
        linkedEmailId: authState.linkedEmailId
          ? `${authState.linkedEmailId.substring(0, 20)}...`
          : "Not found",
        organizationId: authState.organizationId
          ? `${authState.organizationId.substring(0, 20)}...`
          : "Not found",
        djombiToken: authState.djombiToken
          ? `${authState.djombiToken.substring(0, 10)}...`
          : "Not found",
      });

      // Build the appropriate endpoint based on category
      const baseUrl =
        "https://email-service-latest-agqz.onrender.com/api/v1/emails";
      let endpoint = "";

      switch (category) {
        case "inbox":
          endpoint = `${baseUrl}/inbox`;
          break;
        case "sent":
          endpoint = `${baseUrl}/sent`;
          break;
        case "spam":
          endpoint = `${baseUrl}/spam`;
          break;
        case "draft":
          endpoint = `${baseUrl}/drafts`;
          break;
        default:
          endpoint = `${baseUrl}/inbox`;
          break;
      }

      // Enhanced query parameters with organization context
      const params = new URLSearchParams({
        email_id: authState.linkedEmailId,
        organization_id: authState.organizationId, // Add organization context
        offset: "0",
        limit: "50",
      });

      const fullUrl = `${endpoint}?${params.toString()}`;
      console.log(`📡 Making API request to: ${fullUrl}`);

      // Make API request with enhanced headers including organization context
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.djombiToken}`,
          Accept: "application/json",
          "X-Email-Type": authState.selectedEmailType || "unknown",
          "X-Organization-ID": authState.organizationId, // Include organization in headers
          "X-Request-ID": `${category}-${Date.now()}`, // For debugging
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(
        `📨 API response for ${category} (${authState.selectedEmailType}):`,
        {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get("content-type"),
        }
      );

      // Get response text first for better error handling
      const responseText = await response.text();
      console.log(
        `📄 Raw response preview: ${responseText.substring(0, 200)}...`
      );

      // Parse JSON response with better error handling
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("❌ JSON parse error:", parseError);
        throw new Error(
          `Invalid response format from server. Please try again later.`
        );
      }

      // Enhanced HTTP error handling with specific organization context errors
      if (!response.ok) {
        console.error(`❌ HTTP error for ${category}:`, response.status, data);

        let errorMessage = "";
        switch (response.status) {
          case 401:
            errorMessage = "Authentication failed. Please log in again.";
            AuthValidationService.clearAuthData();
            break;
          case 403:
            if (data.message?.includes("Organization")) {
              errorMessage =
                "Organization context is required. Please ensure you have selected a valid organization.";
            } else {
              errorMessage = "Access denied. Please check your permissions.";
            }
            break;
          case 404:
            console.log(
              `ℹ️ No ${category} emails found for ${authState.selectedEmailType} account (404)`
            );
            processEmailData([], category, authState.selectedEmailType);
            return;
          case 422:
            errorMessage =
              "Invalid organization or email context. Please refresh and try again.";
            break;
          case 429:
            errorMessage =
              "Too many requests. Please wait a moment and try again.";
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = "Server error. Please try again in a few moments.";
            break;
          default:
            errorMessage = `Server error (${response.status}): ${data.message || response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Handle API success/error flags
      if (data.success === false) {
        const errorMessage = data.message || data.error || "API request failed";
        console.error("❌ API returned error:", errorMessage);

        // Check if it's a "no emails" scenario vs actual error
        if (
          errorMessage.toLowerCase().includes("no") &&
          (errorMessage.toLowerCase().includes("email") ||
            errorMessage.toLowerCase().includes("found") ||
            errorMessage.toLowerCase().includes("message"))
        ) {
          console.log(`ℹ️ API says no ${category} emails found`);
          processEmailData([], category, authState.selectedEmailType);
          return;
        }

        throw new Error(errorMessage);
      }

      // Process successful response
      console.log(`✅ Successfully fetched ${category} data`);
      processEmailData(data, category, authState.selectedEmailType);

      // Reset attempt counter on success
      set((state) => ({
        fetchAttempts: {
          ...state.fetchAttempts,
          [cacheKey]: 0,
        },
      }));
    } catch (error: any) {
      console.error(`💥 Error fetching ${category} emails:`, error);

      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error?.name === "AbortError") {
        errorMessage =
          "Request timed out. Please check your connection and try again.";
      }

      set({
        isLoading: false,
        loadingError: errorMessage,
      });
    }

    // Helper function to process email data (same as before but with enhanced logging)
    function processEmailData(
      data: any,
      category: EmailCategory,
      emailType: string | null
    ) {
      try {
        console.log(
          `🔄 Processing ${category} email data for ${emailType} account`
        );

        let emailsData: any[] = [];

        if (Array.isArray(data)) {
          emailsData = data;
        } else if (data && typeof data === "object") {
          const possibleArrayKeys = [
            "data",
            "emails",
            "messages",
            "items",
            "results",
            "content",
            category,
            `${category}s`,
            "inbox",
            "sent",
            "drafts",
            "spam",
          ];

          for (const key of possibleArrayKeys) {
            if (data[key] && Array.isArray(data[key])) {
              emailsData = data[key];
              console.log(
                `✅ Found emails array at key: ${key} (${emailsData.length} items)`
              );
              break;
            }
          }

          if (emailsData.length === 0) {
            for (const key in data) {
              if (Array.isArray(data[key]) && data[key].length > 0) {
                emailsData = data[key];
                console.log(
                  `⚠️ Found emails array at unexpected key: ${key} (${emailsData.length} items)`
                );
                break;
              }
            }
          }
        }

        console.log(
          `📊 Extracted ${emailsData.length} raw email items for ${category} (${emailType})`
        );

        // Process emails (same logic as before)
        const processedEmails: Email[] = emailsData.map(
          (item: any, index: number) => {
            try {
              const emailId =
                item.id ||
                item.email_id ||
                item._id ||
                item.messageId ||
                item.message_id ||
                `${category}-${emailType}-${Date.now()}-${index}`;

              const email: Email = {
                id: String(emailId),
                email_id: item.email_id || emailId,
                from:
                  item.from ||
                  item.sender ||
                  item.From ||
                  item.fromAddress ||
                  "unknown@example.com",
                to:
                  item.to ||
                  item.recipient ||
                  item.To ||
                  item.recipients ||
                  item.toAddress ||
                  "",
                subject:
                  item.subject ||
                  item.Subject ||
                  item.title ||
                  item.summary ||
                  "(No Subject)",
                content:
                  item.content ||
                  item.body ||
                  item.Body ||
                  item.text ||
                  item.textContent ||
                  item.htmlContent ||
                  item.message ||
                  "",
                timestamp:
                  item.timestamp ||
                  item.createdAt ||
                  item.created_at ||
                  item.date ||
                  item.Date ||
                  item.receivedDate ||
                  new Date().toISOString(),
                createdAt:
                  item.created_at ||
                  item.createdAt ||
                  item.timestamp ||
                  Date.now(),
                isUrgent: Boolean(
                  item.isUrgent ||
                    item.is_urgent ||
                    item.urgent ||
                    item.priority === "high" ||
                    item.importance === "high"
                ),
                hasAttachment: Boolean(
                  item.hasAttachment ||
                    item.has_attachment ||
                    item.attachments?.length > 0 ||
                    item.hasAttachments
                ),
                status: category,
                category: category,
                isRead: Boolean(
                  item.isRead ||
                    item.is_read ||
                    item.read ||
                    category === "sent" ||
                    category === "draft"
                ),
                contentType:
                  item.contentType ||
                  item.content_type ||
                  item.type ||
                  (item.content?.includes("<") ? "html" : "text"),
              };

              return email;
            } catch (itemError) {
              console.warn(
                `⚠️ Error processing email item at index ${index}:`,
                itemError
              );
              return {
                id: `error-${Date.now()}-${index}`,
                email_id: `error-${Date.now()}-${index}`,
                from: "unknown@example.com",
                to: "",
                subject: "(Error loading email)",
                content: "This email could not be loaded properly.",
                timestamp: new Date().toISOString(),
                createdAt: Date.now(),
                isUrgent: false,
                hasAttachment: false,
                status: category,
                category: category,
                isRead: true,
                contentType: "text",
              } as Email;
            }
          }
        );

        console.log(
          `✅ Successfully processed ${processedEmails.length} ${category} emails`
        );

        // Update store state with enhanced cache management
        set((state) => {
          const otherEmails = state.emails.filter(
            (email) => email.category !== category && email.status !== category
          );

          const allEmails = [...otherEmails, ...processedEmails].sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

          // Enhanced cache key with organization context
          const currentOrgId = getCurrentOrganization();
          const cacheKey = `${category}_${getSelectedLinkedEmailId() || "no_email"}_${emailType || "unknown"}_${currentOrgId || "no_org"}`;
          const newLastFetch = {
            ...state.lastFetch,
            [cacheKey]: Date.now(),
          };

          console.log(
            `📦 Updated store: ${processedEmails.length} new ${category} emails, ${allEmails.length} total`
          );

          return {
            emails: allEmails,
            isLoading: false,
            loadingError: null,
            lastFetch: newLastFetch,
          };
        });
      } catch (processingError) {
        console.error(`💥 Error processing email data:`, processingError);
        set({
          isLoading: false,
          loadingError: `Failed to process ${category} emails. Please try again.`,
        });
      }
    }
  },

  // Enhanced add email with organization context
  addEmail: (emailData) => {
    try {
      const newEmail: Email = {
        ...emailData,
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        isUrgent: false,
        category: emailData.status || get().activeCategory,
        status: emailData.status || get().activeCategory,
        isRead: emailData.status === "sent" || emailData.status === "draft",
        from: emailData.from || "",
        to: emailData.to || "",
        subject: emailData.subject || "",
        content: emailData.content || "",
        hasAttachment: emailData.hasAttachment || false,
        contentType: emailData.contentType || "text",
        createdAt: Date.now(),
      };

      // Add to local state immediately for better UX
      set((state) => ({
        emails: [newEmail, ...state.emails],
      }));

      console.log("✅ Added email to store:", newEmail);

      // Send to API if it's not a draft
      if (emailData.status !== "draft") {
        sendEmailToAPIWithOrg(newEmail);
      }
    } catch (error) {
      console.error("❌ Error adding email:", error);
      set({ loadingError: "Failed to add email. Please try again." });
    }
  },

  // Enhanced move email with organization context
  moveEmail: (emailId, segment) =>
    set((state) => ({
      emails: state.emails.map((email) =>
        email.id === emailId
          ? { ...email, isUrgent: segment === "urgent" }
          : email
      ),
    })),

  moveEmailToCategory: (emailId, category) => {
    try {
      // Update local state
      set((state) => ({
        emails: state.emails.map((email) =>
          email.id === emailId
            ? { ...email, status: category, category: category }
            : email
        ),
      }));

      // Update via API with organization context
      updateEmailCategoryAPIWithOrg(emailId, category);
    } catch (error) {
      console.error("❌ Error moving email:", error);
      set({ loadingError: "Failed to move email. Please try again." });
    }
  },

  addSegment: (name) =>
    set((state) => ({ customSegments: [...state.customSegments, name] })),

  setActiveCategory: (category) => {
    set({
      activeCategory: category,
      loadingError: null, // Clear errors when switching categories
    });

    console.log(
      `📂 Setting active category to ${category}, fetching emails...`
    );
    setTimeout(() => {
      get().fetchEmails(category, true);
    }, 100);
  },

  deleteEmail: (id) => {
    try {
      // Remove from local state
      set((state) => ({
        emails: state.emails.filter((email) => email.id !== id),
      }));

      // Delete via API with organization context
      deleteEmailAPIWithOrg(id);
    } catch (error) {
      console.error("❌ Error deleting email:", error);
      set({ loadingError: "Failed to delete email. Please try again." });
    }
  },

  saveDraft: (draft: Partial<Email>) => {
    try {
      if (draft.id) {
        // Update existing draft
        set((state) => ({
          emails: state.emails.map((email) =>
            email.id === draft.id ? { ...email, ...draft } : email
          ),
        }));

        // Update via API with organization context
        updateDraftAPIWithOrg(draft);
      } else {
        // Create new draft
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
          contentType: draft.contentType || "text",
          createdAt: Date.now(),
        };

        // Add to local state
        set((state) => ({
          emails: [newDraft, ...state.emails],
        }));

        // Send to API with organization context
        createDraftAPIWithOrg(newDraft);
      }
    } catch (error) {
      console.error("❌ Error saving draft:", error);
      set({ loadingError: "Failed to save draft. Please try again." });
    }
  },

  removeEmail: (id: string) => {
    set((state) => ({
      emails: state.emails.filter((email) => email.id !== id),
    }));
  },

  updateDraft: (data) => {
    console.log("📝 Updating draft state:", data);
    set({ draftEmail: data });
  },
}));

// Enhanced helper functions for API calls with organization context
async function sendEmailToAPIWithOrg(email: Email) {
  try {
    const authState = await getValidatedAuthStateWithOrg();

    console.log("📤 Sending email via API with organization context...");
    const response = await fetch(
      "https://email-service-latest-agqz.onrender.com/api/v1/emails/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.djombiToken}`,
          "X-Organization-ID": authState.organizationId,
        },
        body: JSON.stringify({
          to: email.to,
          subject: email.subject,
          content: email.content,
          email_id: authState.linkedEmailId,
          organization_id: authState.organizationId,
        }),
      }
    );

    const responseText = await response.text();
    console.log("📤 Send email response:", response.status, responseText);

    if (response.ok) {
      console.log("✅ Email sent successfully");
      setTimeout(() => {
        useEmailStore.getState().fetchEmails("sent", true);
      }, 1000);
    } else {
      console.error("❌ Failed to send email:", response.status, responseText);
    }
  } catch (error) {
    console.error("💥 Error sending email:", error);
  }
}

async function updateEmailCategoryAPIWithOrg(
  emailId: string,
  category: EmailCategory
) {
  try {
    const authState = await getValidatedAuthStateWithOrg();

    await fetch(
      `https://email-service-latest-agqz.onrender.com/api/v1/emails/${emailId}/move`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.djombiToken}`,
          "X-Organization-ID": authState.organizationId,
        },
        body: JSON.stringify({
          category,
          email_id: authState.linkedEmailId,
          organization_id: authState.organizationId,
        }),
      }
    );
  } catch (error) {
    console.error("💥 Error moving email:", error);
  }
}

async function deleteEmailAPIWithOrg(emailId: string) {
  try {
    const authState = await getValidatedAuthStateWithOrg();

    await fetch(
      `https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/${emailId}?email_id=${authState.linkedEmailId}&organization_id=${authState.organizationId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.djombiToken}`,
          "X-Organization-ID": authState.organizationId,
        },
      }
    );
  } catch (error) {
    console.error("💥 Error deleting email:", error);
  }
}

async function updateDraftAPIWithOrg(draft: Partial<Email>) {
  try {
    const authState = await getValidatedAuthStateWithOrg();

    await fetch(
      `https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/${draft.id}?email_id=${authState.linkedEmailId}&organization_id=${authState.organizationId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.djombiToken}`,
          "X-Organization-ID": authState.organizationId,
        },
        body: JSON.stringify({
          to: draft.to,
          subject: draft.subject,
          content: draft.content,
          email_id: authState.linkedEmailId,
          organization_id: authState.organizationId,
        }),
      }
    );
  } catch (error) {
    console.error("💥 Error updating draft:", error);
  }
}

async function createDraftAPIWithOrg(draft: Email) {
  try {
    const authState = await getValidatedAuthStateWithOrg();

    await fetch(
      "https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.djombiToken}`,
          "X-Organization-ID": authState.organizationId,
        },
        body: JSON.stringify({
          to: draft.to,
          subject: draft.subject,
          content: draft.content,
          email_id: authState.linkedEmailId,
          organization_id: authState.organizationId,
        }),
      }
    );
  } catch (error) {
    console.error("💥 Error creating draft:", error);
  }
}
