import axios, { AxiosResponse, AxiosInstance } from "axios";

// Types
interface DjombiUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  logo: string | null;
  otp: string | null;
  otp_expire: string | null;
  is_active: boolean;
  twoFactorSecret: string;
  twoFactorEnabled: boolean;
  logged_in: number;
  is_verified: boolean;
  createdAt: string;
  updatedAt: string;
  organization: any | null;
}

interface DjombiMeta {
  access_token: string;
  refresh_token: string;
}

interface DjombiProfileResponse {
  status: string;
  message: string;
  data: DjombiUser;
  meta: DjombiMeta;
}

interface DjombiTokens {
  accessTokenAdafri: string;
  accessTokenDjombi: string;
  refreshTokenDjombi: string;
}

interface DjombiServiceResult {
  success: boolean;
  tokens?: DjombiTokens;
  profile?: DjombiUser;
  error?: string;
}

// Cache interface for in-memory caching
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Local storage keys
const STORAGE_KEYS = {
  DJOMBI_ACCESS_TOKEN: "djombi_access_token",
  DJOMBI_REFRESH_TOKEN: "djombi_refresh_token",
  DJOMBI_USER_PROFILE: "djombi_user_profile",
  DJOMBI_AUTH_STATUS: "djombi_auth_status",
  DJOMBI_CACHE_TIMESTAMP: "djombi_cache_timestamp",
} as const;

// Configuration
const DJOMBI_BASE_URL = "https://be-auth-server.onrender.com/api/v1";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const TOKEN_REFRESH_THRESHOLD = 2 * 60 * 1000; // Refresh 2 minutes before expiry

/**
 * Enhanced Djombi Profile Service with caching and optimization
 */
export class DjombiProfileService {
  private static cache = new Map<string, CacheEntry<any>>();
  private static axiosInstance: AxiosInstance | null = null;
  private static refreshPromise: Promise<DjombiServiceResult> | null = null;

  /**
   * Get or create axios instance with interceptors
   */
  private static getAxiosInstance(): AxiosInstance {
    if (!this.axiosInstance) {
      this.axiosInstance = axios.create({
        baseURL: DJOMBI_BASE_URL,
        timeout: 10000, // 10 seconds timeout
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Request interceptor for automatic token attachment
      this.axiosInstance.interceptors.request.use(
        (config) => {
          const token = this.getStoredDjombiTokens().accessToken;
          if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => Promise.reject(error)
      );

      // Response interceptor for automatic token refresh
      this.axiosInstance.interceptors.response.use(
        (response) => response,
        async (error) => {
          const originalRequest = error.config;

          if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
              // await this.refreshDjombiToken();
              const newToken = this.getStoredDjombiTokens().accessToken;
              if (newToken) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return this.axiosInstance!.request(originalRequest);
              }
            } catch (refreshError) {
              this.clearDjombiAuth();
              return Promise.reject(refreshError);
            }
          }

          return Promise.reject(error);
        }
      );
    }

    return this.axiosInstance;
  }

  /**
   * Generic cache getter with TTL
   */
  private static getCachedData<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Generic cache setter
   */
  private static setCachedData<T>(
    key: string,
    data: T,
    ttl: number = CACHE_TTL
  ): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Check if localStorage data is still valid
   */
  private static isStoredDataValid(): boolean {
    if (typeof window === "undefined") return false;

    const timestamp = localStorage.getItem(STORAGE_KEYS.DJOMBI_CACHE_TIMESTAMP);
    if (!timestamp) return false;

    const now = Date.now();
    const cacheAge = now - parseInt(timestamp, 10);

    return cacheAge < CACHE_TTL;
  }

  /**
   * Check if user is authenticated with Djombi (cached)
   */
  static isDjombiAuthenticated(): boolean {
    // Check memory cache first
    const cached = this.getCachedData<boolean>("auth_status");
    if (cached !== null) return cached;

    if (typeof window === "undefined") return false;

    const djombiToken = localStorage.getItem(STORAGE_KEYS.DJOMBI_ACCESS_TOKEN);
    const authStatus = localStorage.getItem(STORAGE_KEYS.DJOMBI_AUTH_STATUS);
    const isValid = this.isStoredDataValid();

    const isAuthenticated = !!(
      djombiToken &&
      authStatus === "authenticated" &&
      isValid
    );

    // Cache the result
    this.setCachedData("auth_status", isAuthenticated, 30000); // 30 seconds cache

    return isAuthenticated;
  }

  /**
   * Get stored Djombi tokens (cached)
   */
  static getStoredDjombiTokens(): {
    accessToken: string | null;
    refreshToken: string | null;
  } {
    // Check memory cache first
    const cached = this.getCachedData<{
      accessToken: string | null;
      refreshToken: string | null;
    }>("tokens");
    if (cached) return cached;

    if (typeof window === "undefined")
      return { accessToken: null, refreshToken: null };

    const tokens = {
      accessToken: localStorage.getItem(STORAGE_KEYS.DJOMBI_ACCESS_TOKEN),
      refreshToken: localStorage.getItem(STORAGE_KEYS.DJOMBI_REFRESH_TOKEN),
    };

    // Cache the result
    this.setCachedData("tokens", tokens, 60000); // 1 minute cache

    return tokens;
  }

  /**
   * Get stored user profile (cached)
   */
  static getStoredUserProfile(): DjombiUser | null {
    // Check memory cache first
    const cached = this.getCachedData<DjombiUser>("profile");
    if (cached) return cached;

    if (typeof window === "undefined") return null;

    const profileData = localStorage.getItem(STORAGE_KEYS.DJOMBI_USER_PROFILE);
    if (!profileData) return null;

    try {
      const profile = JSON.parse(profileData) as DjombiUser;

      // Cache the result
      this.setCachedData("profile", profile);

      return profile;
    } catch {
      return null;
    }
  }

  /**
   * Store Djombi authentication data with timestamp
   */
  private static storeDjombiAuth(
    tokens: DjombiTokens,
    profile: DjombiUser
  ): void {
    if (typeof window === "undefined") return;

    const now = Date.now().toString();

    localStorage.setItem(
      STORAGE_KEYS.DJOMBI_ACCESS_TOKEN,
      tokens.accessTokenDjombi
    );
    localStorage.setItem(
      STORAGE_KEYS.DJOMBI_REFRESH_TOKEN,
      tokens.refreshTokenDjombi
    );
    localStorage.setItem(
      STORAGE_KEYS.DJOMBI_USER_PROFILE,
      JSON.stringify(profile)
    );
    localStorage.setItem(STORAGE_KEYS.DJOMBI_AUTH_STATUS, "authenticated");
    localStorage.setItem(STORAGE_KEYS.DJOMBI_CACHE_TIMESTAMP, now);

    // Update memory cache
    this.setCachedData("auth_status", true);
    this.setCachedData("tokens", {
      accessToken: tokens.accessTokenDjombi,
      refreshToken: tokens.refreshTokenDjombi,
    });
    this.setCachedData("profile", profile);
  }

  /**
   * Clear Djombi authentication data
   */
  static clearDjombiAuth(): void {
    if (typeof window === "undefined") return;

    // Clear localStorage
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });

    // Clear memory cache
    this.cache.clear();
  }

  /**
   * Get Djombi profile with caching and deduplication
   */
  static async getDjombiProfile(
    accessTokenAdafri: string
  ): Promise<DjombiServiceResult> {
    if (!accessTokenAdafri) {
      return {
        success: false,
        error: "Adafri access token is required",
      };
    }

    // Check if we have valid cached data
    if (this.isDjombiAuthenticated()) {
      const profile = this.getStoredUserProfile();
      const tokens = this.getStoredDjombiTokens();

      if (profile && tokens.accessToken && tokens.refreshToken) {
        return {
          success: true,
          tokens: {
            accessTokenAdafri,
            accessTokenDjombi: tokens.accessToken,
            refreshTokenDjombi: tokens.refreshToken,
          },
          profile,
        };
      }
    }

    try {
      const axiosInstance = this.getAxiosInstance();

      const response: AxiosResponse<DjombiProfileResponse> =
        await axiosInstance.get("/accounts/profile", {
          headers: {
            Authorization: `Bearer ${accessTokenAdafri}`,
          },
        });

      if (response.data.status !== "success") {
        return {
          success: false,
          error: response.data.message || "Failed to get Djombi profile",
        };
      }

      const { data: profileData, meta } = response.data;
      const {
        access_token: accessTokenDjombi,
        refresh_token: refreshTokenDjombi,
      } = meta;

      if (!accessTokenDjombi) {
        return {
          success: false,
          error: "Djombi access token not received",
        };
      }

      const tokens: DjombiTokens = {
        accessTokenAdafri,
        accessTokenDjombi,
        refreshTokenDjombi,
      };

      // Store with caching
      this.storeDjombiAuth(tokens, profileData);

      return {
        success: true,
        tokens,
        profile: profileData,
      };
    } catch (error) {
      console.error("Error getting Djombi profile:", error);

      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to get Djombi profile";

        return {
          success: false,
          error: errorMessage,
        };
      }

      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  }

  /**
   * Initialize Djombi integration with deduplication
   */
  static async initializeDjombiAuth(
    accessTokenAdafri: string
  ): Promise<DjombiServiceResult> {
    // Check if already authenticated with valid cache
    if (this.isDjombiAuthenticated()) {
      const profile = this.getStoredUserProfile();
      const tokens = this.getStoredDjombiTokens();

      if (profile && tokens.accessToken && tokens.refreshToken) {
        return {
          success: true,
          tokens: {
            accessTokenAdafri,
            accessTokenDjombi: tokens.accessToken,
            refreshTokenDjombi: tokens.refreshToken,
          },
          profile,
        };
      }
    }

    return await this.getDjombiProfile(accessTokenAdafri);
  }

  /**
   * Refresh Djombi token with deduplication
   */
  // static async refreshDjombiToken(
  //   refreshToken?: string
  // ): Promise<DjombiServiceResult> {
  //   // Prevent multiple simultaneous refresh attempts
  //   if (this.refreshPromise) {
  //     return await this.refreshPromise;
  //   }

  //   // this.refreshPromise = this._performTokenRefresh(refreshToken);

  //   try {
  //     const result = await this.refreshPromise;
  //     return result!;
  //   } finally {
  //     this.refreshPromise = null;
  //   }
  // }

  /**
   * Internal token refresh implementation
   */
  // private static async _performTokenRefresh(
  //   refreshToken?: string
  // ): Promise<DjombiServiceResult> {
  //   try {
  //     const tokenToUse =
  //       refreshToken || this.getStoredDjombiTokens().refreshToken;

  //     if (!tokenToUse) {
  //       return {
  //         success: false,
  //         error: "Refresh token is required",
  //       };
  //     }

  //     const axiosInstance = this.getAxiosInstance();

  //     const response: AxiosResponse<DjombiProfileResponse> =
  //       await axiosInstance.post("/auth/refresh", {
  //         refresh_token: tokenToUse,
  //       });

  //     if (response.data.status !== "success") {
  //       this.clearDjombiAuth();
  //       return {
  //         success: false,
  //         error: response.data.message || "Failed to refresh token",
  //       };
  //     }

  //     const { data: profileData, meta } = response.data;
  //     const {
  //       access_token: accessTokenDjombi,
  //       refresh_token: refreshTokenDjombi,
  //     } = meta;

  //     const tokens: DjombiTokens = {
  //       accessTokenAdafri: "",
  //       accessTokenDjombi,
  //       refreshTokenDjombi,
  //     };

  //     // Update storage and cache
  //     this.storeDjombiAuth(tokens, profileData);

  //     return {
  //       success: true,
  //       tokens,
  //       profile: profileData,
  //     };
  //   } catch (error) {
  //     console.error("Error refreshing Djombi token:", error);
  //     this.clearDjombiAuth();

  //     if (axios.isAxiosError(error)) {
  //       return {
  //         success: false,
  //         error:
  //           error.response?.data?.message ||
  //           error.message ||
  //           "Failed to refresh token",
  //       };
  //     }

  //     return {
  //       success: false,
  //       error: "An unexpected error occurred during token refresh",
  //     };
  //   }
  // }

  /**
   * Make authenticated API calls with automatic retry and caching
   */
  static async makeAuthenticatedRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const { accessToken } = this.getStoredDjombiTokens();

    if (!accessToken) {
      return {
        success: false,
        error: "No Djombi access token available",
      };
    }

    try {
      // Use axios instance which handles token refresh automatically
      const axiosInstance = this.getAxiosInstance();

      const axiosOptions: any = {
        method: options.method || "GET",
        url: endpoint,
        data: options.body ? JSON.parse(options.body as string) : undefined,
        headers: options.headers,
      };

      const response = await axiosInstance.request(axiosOptions);

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Request failed",
      };
    }
  }

  /**
   * Preload and cache user data for faster subsequent access
   */
  static async preloadUserData(): Promise<void> {
    if (!this.isDjombiAuthenticated()) return;

    try {
      // Preload profile data if not cached
      if (!this.getCachedData("profile")) {
        this.getStoredUserProfile();
      }

      // Preload tokens if not cached
      if (!this.getCachedData("tokens")) {
        this.getStoredDjombiTokens();
      }
    } catch (error) {
      console.warn("Failed to preload user data:", error);
    }
  }

  /**
   * Check if token needs refresh soon
   */
  static shouldRefreshToken(): boolean {
    if (typeof window === "undefined") return false;

    const timestamp = localStorage.getItem(STORAGE_KEYS.DJOMBI_CACHE_TIMESTAMP);
    if (!timestamp) return false;

    const now = Date.now();
    const tokenAge = now - parseInt(timestamp, 10);

    // Refresh if token is older than threshold
    return tokenAge > CACHE_TTL - TOKEN_REFRESH_THRESHOLD;
  }

  /**
   * Background token refresh - non-blocking
   */
  static async backgroundRefresh(): Promise<void> {
    if (!this.shouldRefreshToken()) return;

    try {
      // await this.refreshDjombiToken();
    } catch (error) {
      console.warn("Background token refresh failed:", error);
    }
  }

  /**
   * Clear memory cache only (keep localStorage)
   */
  static clearMemoryCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics for debugging
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * React Hook for Djombi authentication with caching
 */
export const useDjombiAuth = () => {
  const isDjombiAuthenticated = DjombiProfileService.isDjombiAuthenticated();
  const userProfile = DjombiProfileService.getStoredUserProfile();
  const { accessToken: djombiToken } =
    DjombiProfileService.getStoredDjombiTokens();

  const initializeDjombi = async (adafriToken: string) => {
    return await DjombiProfileService.initializeDjombiAuth(adafriToken);
  };

  // const refreshDjombiAuth = async () => {
  //   return await DjombiProfileService.refreshDjombiToken();
  // };

  const logout = () => {
    DjombiProfileService.clearDjombiAuth();
  };

  const makeApiCall = async <T = any>(
    endpoint: string,
    options?: RequestInit
  ) => {
    return await DjombiProfileService.makeAuthenticatedRequest<T>(
      endpoint,
      options
    );
  };

  return {
    isDjombiAuthenticated,
    userProfile,
    djombiToken,
    initializeDjombi,
    // refreshDjombiAuth,
    logout,
    makeApiCall,
  };
};

// Export types for use in other files
export type {
  DjombiProfileResponse,
  DjombiTokens,
  DjombiServiceResult,
  DjombiUser,
  DjombiMeta,
};
