// lib/utils/enhancedCookies.ts
/**
 * Enhanced cookie management with organization context support
 * Consolidates all authentication token and organization management
 */

// Enhanced cookie names with organization support
export const COOKIE_NAMES = {
  // Adafri OAuth2 tokens
  ADAFRI_ACCESS_TOKEN: '__frsadfrusrtkn',
  ADAFRI_REFRESH_TOKEN: '__rfrsadfrusrtkn',
  
  // Djombi tokens
  DJOMBI_ACCESS_TOKEN: 'djombi_access_token',
  DJOMBI_REFRESH_TOKEN: 'djombi_refresh_token',
  
  // User info
  USER_EMAIL: 'userEmail',
  USER_NAME: 'userName',
  USER_ID: 'userId',
  
  // Organization context
  CURRENT_ORGANIZATION_ID: 'current_organization_id',
  SELECTED_ORGANIZATION: 'selected_organization',
  
  // Email context
  SELECTED_EMAIL_ID: 'selected_email_id',
  SELECTED_EMAIL_TYPE: 'selected_email_type',
  LINKED_EMAIL_ACCOUNTS: 'linked_email_accounts',
  
  // App state
  AUTH_STATUS: 'auth_status',
  LAST_LOGIN: 'last_login',
  
  // Legacy support
  MESSAGE_TOKEN: 'message_token',
  ACCESS_TOKEN: 'accessToken',
  LINKED_EMAIL_ID: 'linkedEmailId'
} as const;

// Cookie options interface
interface CookieOptions {
  days?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  domain?: string;
  path?: string;
}

// Default cookie options
const DEFAULT_OPTIONS: CookieOptions = {
  days: 7,
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
  sameSite: 'strict',
  path: '/'
};

// Security options for sensitive tokens
const SECURE_TOKEN_OPTIONS: CookieOptions = {
  days: 1,
  secure: true,
  sameSite: 'strict',
  path: '/'
};

/**
 * Set a cookie with enhanced security options
 */
export function setCookie(
  name: string, 
  value: string, 
  options: CookieOptions = {}
): void {
  if (typeof document === 'undefined') return;
  
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  
  if (finalOptions.days && finalOptions.days > 0) {
    const expires = new Date();
    expires.setTime(expires.getTime() + finalOptions.days * 24 * 60 * 60 * 1000);
    cookieString += `; expires=${expires.toUTCString()}`;
  }
  
  if (finalOptions.path) {
    cookieString += `; path=${finalOptions.path}`;
  }
  
  if (finalOptions.domain) {
    cookieString += `; domain=${finalOptions.domain}`;
  }
  
  if (finalOptions.secure) {
    cookieString += '; secure';
  }
  
  if (finalOptions.sameSite) {
    cookieString += `; samesite=${finalOptions.sameSite}`;
  }
  
  document.cookie = cookieString;
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const encodedName = encodeURIComponent(name);
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(encodedName + '=')) {
      return decodeURIComponent(cookie.substring(encodedName.length + 1));
    }
  }
  
  return null;
}

/**
 * Remove a cookie by name
 */
export function removeCookie(name: string, options: Omit<CookieOptions, 'days'> = {}): void {
  if (typeof document === 'undefined') return;
  
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  
  let cookieString = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
  
  if (finalOptions.path) {
    cookieString += `; path=${finalOptions.path}`;
  }
  
  if (finalOptions.domain) {
    cookieString += `; domain=${finalOptions.domain}`;
  }
  
  if (finalOptions.secure) {
    cookieString += '; secure';
  }
  
  if (finalOptions.sameSite) {
    cookieString += `; samesite=${finalOptions.sameSite}`;
  }
  
  document.cookie = cookieString;
}

/**
 * Enhanced Token Management Functions
 */

// Set authentication tokens securely
export function setAuthTokens(tokens: {
  adafriAccessToken?: string;
  adafriRefreshToken?: string;
  djombiAccessToken?: string;
  djombiRefreshToken?: string;
}): void {
  if (tokens.adafriAccessToken) {
    setCookie(COOKIE_NAMES.ADAFRI_ACCESS_TOKEN, tokens.adafriAccessToken, SECURE_TOKEN_OPTIONS);
  }
  
  if (tokens.adafriRefreshToken) {
    setCookie(COOKIE_NAMES.ADAFRI_REFRESH_TOKEN, tokens.adafriRefreshToken, {
      ...SECURE_TOKEN_OPTIONS,
      days: 30
    });
  }
  
  if (tokens.djombiAccessToken) {
    setCookie(COOKIE_NAMES.DJOMBI_ACCESS_TOKEN, tokens.djombiAccessToken, SECURE_TOKEN_OPTIONS);
  }
  
  if (tokens.djombiRefreshToken) {
    setCookie(COOKIE_NAMES.DJOMBI_REFRESH_TOKEN, tokens.djombiRefreshToken, {
      ...SECURE_TOKEN_OPTIONS,
      days: 30
    });
  }
}

// Get all authentication tokens
export function getAuthTokens(): {
  adafriAccessToken: string | null;
  adafriRefreshToken: string | null;
  djombiAccessToken: string | null;
  djombiRefreshToken: string | null;
} {
  return {
    adafriAccessToken: getCookie(COOKIE_NAMES.ADAFRI_ACCESS_TOKEN),
    adafriRefreshToken: getCookie(COOKIE_NAMES.ADAFRI_REFRESH_TOKEN),
    djombiAccessToken: getCookie(COOKIE_NAMES.DJOMBI_ACCESS_TOKEN),
    djombiRefreshToken: getCookie(COOKIE_NAMES.DJOMBI_REFRESH_TOKEN)
  };
}

// Get primary access token (prioritize Djombi, fallback to Adafri)
export function getPrimaryAccessToken(): string | null {
  const tokens = getAuthTokens();
  return tokens.djombiAccessToken || tokens.adafriAccessToken || getCookie(COOKIE_NAMES.MESSAGE_TOKEN);
}

/**
 * Enhanced Organization Management Functions
 */

// Set current organization with enhanced context
export function setCurrentOrganization(organizationId: string, organizationData?: any): void {
  setCookie(COOKIE_NAMES.CURRENT_ORGANIZATION_ID, organizationId, { days: 30 });
  
  if (organizationData) {
    setCookie(COOKIE_NAMES.SELECTED_ORGANIZATION, JSON.stringify(organizationData), { days: 30 });
  }
}

// Get current organization ID
export function getCurrentOrganization(): string | null {
  return getCookie(COOKIE_NAMES.CURRENT_ORGANIZATION_ID);
}

// Get current organization data
export function getCurrentOrganizationData(): any | null {
  const orgData = getCookie(COOKIE_NAMES.SELECTED_ORGANIZATION);
  if (orgData) {
    try {
      return JSON.parse(orgData);
    } catch {
      return null;
    }
  }
  return null;
}

// Remove current organization
export function removeCurrentOrganization(): void {
  removeCookie(COOKIE_NAMES.CURRENT_ORGANIZATION_ID);
  removeCookie(COOKIE_NAMES.SELECTED_ORGANIZATION);
}

/**
 * Enhanced Email Account Management Functions
 */

// Set selected linked email with enhanced context
export function setSelectedLinkedEmail(emailId: string, emailType: string | null, emailData?: any): void {
  setCookie(COOKIE_NAMES.SELECTED_EMAIL_ID, emailId, { days: 30 });
  setCookie(COOKIE_NAMES.LINKED_EMAIL_ID, emailId, { days: 30 }); // Legacy support
  
  if (emailType) {
    setCookie(COOKIE_NAMES.SELECTED_EMAIL_TYPE, emailType, { days: 30 });
  }
  
  // Store additional email account data if provided
  if (emailData) {
    const existingAccounts = getLinkedEmailAccounts();
    const updatedAccounts = {
      ...existingAccounts,
      [emailId]: {
        id: emailId,
        type: emailType,
        ...emailData,
        lastSelected: new Date().toISOString()
      }
    };
    setCookie(COOKIE_NAMES.LINKED_EMAIL_ACCOUNTS, JSON.stringify(updatedAccounts), { days: 30 });
  }
}

// Get selected linked email with enhanced context
export function getSelectedLinkedEmail(): { id: string; type: string | null; data?: any } | null {
  const emailId = getCookie(COOKIE_NAMES.SELECTED_EMAIL_ID) || getCookie(COOKIE_NAMES.LINKED_EMAIL_ID);
  const emailType = getCookie(COOKIE_NAMES.SELECTED_EMAIL_TYPE);
  
  if (emailId) {
    const accounts = getLinkedEmailAccounts();
    const emailData = accounts[emailId];
    
    return {
      id: emailId,
      type: emailType,
      data: emailData
    };
  }
  
  return null;
}

// Get selected linked email ID only
export function getSelectedLinkedEmailId(): string | null {
  return getCookie(COOKIE_NAMES.SELECTED_EMAIL_ID) || getCookie(COOKIE_NAMES.LINKED_EMAIL_ID);
}

// Get selected linked email type
export function getSelectedLinkedEmailType(): string | null {
  return getCookie(COOKIE_NAMES.SELECTED_EMAIL_TYPE);
}

// Get all linked email accounts
export function getLinkedEmailAccounts(): Record<string, any> {
  const accounts = getCookie(COOKIE_NAMES.LINKED_EMAIL_ACCOUNTS);
  if (accounts) {
    try {
      return JSON.parse(accounts);
    } catch {
      return {};
    }
  }
  return {};
}

// Remove selected email
export function removeSelectedLinkedEmail(): void {
  removeCookie(COOKIE_NAMES.SELECTED_EMAIL_ID);
  removeCookie(COOKIE_NAMES.SELECTED_EMAIL_TYPE);
  removeCookie(COOKIE_NAMES.LINKED_EMAIL_ID); // Legacy support
}

/**
 * Enhanced User Information Management
 */

// Set user information with enhanced context
export function setUserInfo(userInfo: {
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  userId?: string;
  organizationId?: string;
}): void {
  if (userInfo.email) {
    setCookie(COOKIE_NAMES.USER_EMAIL, userInfo.email);
  }
  
  if (userInfo.name) {
    setCookie(COOKIE_NAMES.USER_NAME, userInfo.name);
  } else if (userInfo.firstName && userInfo.lastName) {
    setCookie(COOKIE_NAMES.USER_NAME, `${userInfo.firstName}.${userInfo.lastName}`);
  }
  
  if (userInfo.userId) {
    setCookie(COOKIE_NAMES.USER_ID, userInfo.userId);
  }
  
  if (userInfo.organizationId) {
    setCurrentOrganization(userInfo.organizationId);
  }
}

// Get user information with enhanced context
export function getUserInfo(): {
  email: string | null;
  name: string | null;
  firstName: string;
  lastName: string;
  userId: string | null;
  organizationId: string | null;
  accessToken: string | null;
} {
  const userName = getCookie(COOKIE_NAMES.USER_NAME);
  let firstName = '';
  let lastName = '';
  
  if (userName) {
    const nameParts = userName.split('.');
    firstName = nameParts[0] || '';
    lastName = nameParts[1] || '';
  }
  
  return {
    email: getCookie(COOKIE_NAMES.USER_EMAIL),
    name: userName,
    firstName,
    lastName,
    userId: getCookie(COOKIE_NAMES.USER_ID),
    organizationId: getCurrentOrganization(),
    accessToken: getPrimaryAccessToken()
  };
}

/**
 * Enhanced Authentication Status Management
 */

// Set authentication status with organization context
export function setAuthStatus(status: 'authenticated' | 'unauthenticated', organizationId?: string): void {
  setCookie(COOKIE_NAMES.AUTH_STATUS, status);
  if (status === 'authenticated') {
    setCookie(COOKIE_NAMES.LAST_LOGIN, new Date().toISOString());
    if (organizationId) {
      setCurrentOrganization(organizationId);
    }
  }
}

// Get authentication status
export function getAuthStatus(): 'authenticated' | 'unauthenticated' | null {
  const status = getCookie(COOKIE_NAMES.AUTH_STATUS);
  return status as 'authenticated' | 'unauthenticated' | null;
}

// Check if fully authenticated (including organization context)
export function isFullyAuthenticated(): boolean {
  const status = getAuthStatus();
  const hasToken = !!getPrimaryAccessToken();
  const hasOrganization = !!getCurrentOrganization();
  return status === 'authenticated' && hasToken && hasOrganization;
}

// Check if authenticated (without organization requirement)
export function isAuthenticated(): boolean {
  const status = getAuthStatus();
  const hasToken = !!getPrimaryAccessToken();
  return status === 'authenticated' && hasToken;
}

/**
 * Enhanced Data Clearing Functions
 */

// Clear all authentication data
export function clearAllAuthData(): void {
  // Remove all auth-related cookies
  Object.values(COOKIE_NAMES).forEach(cookieName => {
    removeCookie(cookieName);
  });
  
  // Clear any localStorage auth data
  if (typeof window !== 'undefined') {
    const authKeys = [
      'djombi_access_token',
      'djombi_refresh_token',
      'djombi_user_profile',
      'user_organizations_cache',
      'access_token',
      'linkedEmailId',
      'selectedEmailType'
    ];
    
    authKeys.forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

// Clear organization-specific data
export function clearOrganizationData(): void {
  removeCurrentOrganization();
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user_organizations_cache');
  }
}

// Clear email-specific data
export function clearEmailData(): void {
  removeSelectedLinkedEmail();
  removeCookie(COOKIE_NAMES.LINKED_EMAIL_ACCOUNTS);
}

/**
 * Enhanced Utility Functions
 */

// Get authentication header with context
export function getAuthHeader(): string | null {
  const token = getPrimaryAccessToken();
  return token ? `Bearer ${token}` : null;
}

// Get request headers with full context
export function getRequestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const authHeader = getAuthHeader();
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }
  
  const organizationId = getCurrentOrganization();
  if (organizationId) {
    headers['X-Organization-ID'] = organizationId;
  }
  
  const emailInfo = getSelectedLinkedEmail();
  if (emailInfo) {
    headers['X-Email-ID'] = emailInfo.id;
    if (emailInfo.type) {
      headers['X-Email-Type'] = emailInfo.type;
    }
  }
  
  return headers;
}

// Legacy compatibility functions
export function getAuthToken(): string | null {
  return getPrimaryAccessToken();
}

export function getDjombiToken(): string | null {
  return getCookie(COOKIE_NAMES.DJOMBI_ACCESS_TOKEN) || 
         getCookie(COOKIE_NAMES.ADAFRI_ACCESS_TOKEN);
}

// Token validation utilities
export function isJWT(token: string): boolean {
  return token.includes('.') && token.split('.').length === 3 && token.startsWith('ey');
}

export function formatAuthHeader(token: string): string {
  return isJWT(token) ? `Bearer ${token}` : token;
}

// Session management with organization context
export function refreshSession(): void {
  const tokens = getAuthTokens();
  const organizationId = getCurrentOrganization();
  
  if ((tokens.djombiAccessToken || tokens.adafriAccessToken) && organizationId) {
    setAuthStatus('authenticated', organizationId);
  }
}

// Enhanced debug function
export function debugAuthState(): void {
  console.log('=== ENHANCED AUTH STATE DEBUG ===');
  console.log('Tokens:', getAuthTokens());
  console.log('User Info:', getUserInfo());
  console.log('Auth Status:', getAuthStatus());
  console.log('Organization ID:', getCurrentOrganization());
  console.log('Organization Data:', getCurrentOrganizationData());
  console.log('Selected Email:', getSelectedLinkedEmail());
  console.log('Linked Accounts:', getLinkedEmailAccounts());
  console.log('Is Fully Authenticated:', isFullyAuthenticated());
  console.log('Request Headers:', getRequestHeaders());
  console.log('===================================');
}