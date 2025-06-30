import { getCookie } from "@/lib/utils/cookies";
import { DjombiProfileService } from "@/lib/services/DjombiProfileService";

/**
 * Get linked email ID with priority order: cookies -> localStorage
 */
export const getLinkedEmailId = (): string | null => {
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

/**
 * Get Djombi access token from multiple sources
 */
export const getDjombiAccessToken = (): string | null => {
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

/**
 * Process API response data for draft emails
 */
export const processResponseData = (data: any) => {
  let emailsData: any[] = [];

  if (Array.isArray(data)) {
    emailsData = data;
  } else if (data.data && Array.isArray(data.data)) {
    emailsData = data.data;
  } else if (data.drafts && Array.isArray(data.drafts)) {
    emailsData = data.drafts;
  } else {
    console.log("Response structure different than expected:", data);
    // Look for any array in the response that might contain emails
    for (const key in data) {
      if (Array.isArray(data[key]) && data[key].length > 0) {
        console.log(`Found array in response at key: ${key}`, data[key]);
        emailsData = data[key];
        break;
      }
    }
  }

  if (emailsData.length > 0) {
    console.log("Sample email data structure:", emailsData[0]);
  }

  // Format emails and ensure they have proper structure
  return emailsData.map((email: any) => ({
    ...email,
    id: email.id || email._id || `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    content: email.content || '',
    createdAt: email.createdAt || email.created_at || Date.now(),
    status: "draft"
  }));
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};