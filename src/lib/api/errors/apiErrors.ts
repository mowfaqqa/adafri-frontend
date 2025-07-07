// lib/api/errors/apiErrors.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }

  // Check if error requires 2FA
  requiresTwoFactor(): boolean {
    return this.status === 403 && this.message.includes("Two-factor");
  }

  // Check if error is auth-related
  isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  // Check if error is network-related
  isNetworkError(): boolean {
    return this.status === 0 || this.status >= 500;
  }

  // Check if error is validation-related
  isValidationError(): boolean {
    return this.status === 400;
  }
}

export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof TypeError) {
    return new ApiError(0, "Network connection failed");
  }

  return new ApiError(500, "An unexpected error occurred");
};

// lib/api/auth/tokenManager.ts
const TOKEN_STORAGE_KEY = "auth_token";
const REFRESH_TOKEN_STORAGE_KEY = "refresh_token";

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
};

export const setAuthTokens = (
  accessToken: string,
  refreshToken: string
): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
};

export const clearAuthTokens = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
};

export const hasValidToken = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;

  try {
    // Basic JWT validation (you might want to use a proper JWT library)
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch {
    return false;
  }
};

