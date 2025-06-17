import axios, { AxiosResponse } from 'axios';

// Types based on actual API response
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

// Local storage keys
const STORAGE_KEYS = {
  DJOMBI_ACCESS_TOKEN: 'djombi_access_token',
  DJOMBI_REFRESH_TOKEN: 'djombi_refresh_token',
  DJOMBI_USER_PROFILE: 'djombi_user_profile',
  DJOMBI_AUTH_STATUS: 'djombi_auth_status'
} as const;

// Configuration
const DJOMBI_BASE_URL = 'https://be-auth-server.onrender.com/api/v1';

/**
 * Enhanced Djombi Profile Service with localStorage integration
 */
export class DjombiProfileService {
  
  /**
   * Check if user is authenticated with Djombi
   */
  static isDjombiAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    
    const djombiToken = localStorage.getItem(STORAGE_KEYS.DJOMBI_ACCESS_TOKEN);
    const authStatus = localStorage.getItem(STORAGE_KEYS.DJOMBI_AUTH_STATUS);
    
    return !!(djombiToken && authStatus === 'authenticated');
  }

  /**
   * Get stored Djombi tokens
   */
  static getStoredDjombiTokens(): { accessToken: string | null; refreshToken: string | null } {
    if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };
    
    return {
      accessToken: localStorage.getItem(STORAGE_KEYS.DJOMBI_ACCESS_TOKEN),
      refreshToken: localStorage.getItem(STORAGE_KEYS.DJOMBI_REFRESH_TOKEN)
    };
  }

  /**
   * Get stored user profile
   */
  static getStoredUserProfile(): DjombiUser | null {
    if (typeof window === 'undefined') return null;
    
    const profileData = localStorage.getItem(STORAGE_KEYS.DJOMBI_USER_PROFILE);
    if (!profileData) return null;
    
    try {
      return JSON.parse(profileData) as DjombiUser;
    } catch {
      return null;
    }
  }

  /**
   * Store Djombi authentication data in localStorage
   */
  private static storeDjombiAuth(tokens: DjombiTokens, profile: DjombiUser): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(STORAGE_KEYS.DJOMBI_ACCESS_TOKEN, tokens.accessTokenDjombi);
    localStorage.setItem(STORAGE_KEYS.DJOMBI_REFRESH_TOKEN, tokens.refreshTokenDjombi);
    localStorage.setItem(STORAGE_KEYS.DJOMBI_USER_PROFILE, JSON.stringify(profile));
    localStorage.setItem(STORAGE_KEYS.DJOMBI_AUTH_STATUS, 'authenticated');
  }

  /**
   * Clear Djombi authentication data from localStorage
   */
  static clearDjombiAuth(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(STORAGE_KEYS.DJOMBI_ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.DJOMBI_REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.DJOMBI_USER_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.DJOMBI_AUTH_STATUS);
  }

  /**
   * Get Djombi profile and token using Adafri access token
   * Automatically stores the result in localStorage
   */
  static async getDjombiProfile(accessTokenAdafri: string): Promise<DjombiServiceResult> {
    try {
      if (!accessTokenAdafri) {
        return {
          success: false,
          error: 'Adafri access token is required'
        };
      }

      const response: AxiosResponse<DjombiProfileResponse> = await axios.get(
        `${DJOMBI_BASE_URL}/accounts/profile`,
        {
          headers: {
            Authorization: `Bearer ${accessTokenAdafri}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Check if the response indicates success
      if (response.data.status !== 'success') {
        return {
          success: false,
          error: response.data.message || 'Failed to get Djombi profile'
        };
      }

      const { data: profileData, meta } = response.data;
      const { access_token: accessTokenDjombi, refresh_token: refreshTokenDjombi } = meta;

      if (!accessTokenDjombi) {
        return {
          success: false,
          error: 'Djombi access token not received'
        };
      }

      const tokens: DjombiTokens = {
        accessTokenAdafri,
        accessTokenDjombi,
        refreshTokenDjombi
      };

      // Store in localStorage
      this.storeDjombiAuth(tokens, profileData);

      return {
        success: true,
        tokens,
        profile: profileData
      };

    } catch (error) {
      console.error('Error getting Djombi profile:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Failed to get Djombi profile';
        
        return {
          success: false,
          error: errorMessage
        };
      }

      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }

  /**
   * Initialize Djombi integration automatically when Adafri auth is successful
   * This should be called after successful Adafri authentication
   */
  static async initializeDjombiAuth(accessTokenAdafri: string): Promise<DjombiServiceResult> {
    // Check if already authenticated with Djombi
    if (this.isDjombiAuthenticated()) {
      const profile = this.getStoredUserProfile();
      const { accessToken: accessTokenDjombi, refreshToken: refreshTokenDjombi } = this.getStoredDjombiTokens();
      
      if (profile && accessTokenDjombi && refreshTokenDjombi) {
        return {
          success: true,
          tokens: {
            accessTokenAdafri,
            accessTokenDjombi,
            refreshTokenDjombi
          },
          profile
        };
      }
    }

    // Get fresh Djombi profile and tokens
    return await this.getDjombiProfile(accessTokenAdafri);
  }

  /**
   * Refresh Djombi access token using refresh token
   * Automatically updates localStorage
   */
  static async refreshDjombiToken(refreshToken?: string): Promise<DjombiServiceResult> {
    try {
      const tokenToUse = refreshToken || this.getStoredDjombiTokens().refreshToken;
      
      if (!tokenToUse) {
        return {
          success: false,
          error: 'Refresh token is required'
        };
      }

      const response: AxiosResponse<DjombiProfileResponse> = await axios.post(
        `${DJOMBI_BASE_URL}/auth/refresh`,
        { refresh_token: tokenToUse },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status !== 'success') {
        // If refresh fails, clear stored auth
        this.clearDjombiAuth();
        return {
          success: false,
          error: response.data.message || 'Failed to refresh token'
        };
      }

      const { data: profileData, meta } = response.data;
      const { access_token: accessTokenDjombi, refresh_token: refreshTokenDjombi } = meta;

      const tokens: DjombiTokens = {
        accessTokenAdafri: '', // Will need to be updated separately
        accessTokenDjombi,
        refreshTokenDjombi
      };

      // Update localStorage
      this.storeDjombiAuth(tokens, profileData);

      return {
        success: true,
        tokens,
        profile: profileData
      };

    } catch (error) {
      console.error('Error refreshing Djombi token:', error);
      
      // Clear auth on refresh failure
      this.clearDjombiAuth();
      
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.message || error.message || 'Failed to refresh token'
        };
      }

      return {
        success: false,
        error: 'An unexpected error occurred during token refresh'
      };
    }
  }

  /**
   * Make authenticated API calls using stored Djombi token
   */
  static async makeAuthenticatedRequest<T = any>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const { accessToken } = this.getStoredDjombiTokens();
    
    if (!accessToken) {
      return {
        success: false,
        error: 'No Djombi access token available'
      };
    }

    try {
      const response = await fetch(`${DJOMBI_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        // Try to refresh token if unauthorized
        if (response.status === 401) {
          const refreshResult = await this.refreshDjombiToken();
          if (refreshResult.success) {
            // Retry the request with new token
            return this.makeAuthenticatedRequest(endpoint, options);
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request failed'
      };
    }
  }
}

/**
 * React Hook for Djombi authentication
 */
export const useDjombiAuth = () => {
  const isDjombiAuthenticated = DjombiProfileService.isDjombiAuthenticated();
  const userProfile = DjombiProfileService.getStoredUserProfile();
  const { accessToken: djombiToken } = DjombiProfileService.getStoredDjombiTokens();

  const initializeDjombi = async (adafriToken: string) => {
    return await DjombiProfileService.initializeDjombiAuth(adafriToken);
  };

  const refreshDjombiAuth = async () => {
    return await DjombiProfileService.refreshDjombiToken();
  };

  const logout = () => {
    DjombiProfileService.clearDjombiAuth();
  };

  const makeApiCall = async <T = any>(endpoint: string, options?: RequestInit) => {
    return await DjombiProfileService.makeAuthenticatedRequest<T>(endpoint, options);
  };

  return {
    isDjombiAuthenticated,
    userProfile,
    djombiToken,
    initializeDjombi,
    refreshDjombiAuth,
    logout,
    makeApiCall
  };
};

// Export types for use in other files
export type { 
  DjombiProfileResponse, 
  DjombiTokens, 
  DjombiServiceResult, 
  DjombiUser, 
  DjombiMeta 
};













































// import axios, { AxiosResponse } from 'axios';

// // Types based on actual API response
// interface DjombiUser {
//   id: string;
//   email: string;
//   first_name: string;
//   last_name: string;
//   logo: string | null;
//   otp: string | null;
//   otp_expire: string | null;
//   is_active: boolean;
//   twoFactorSecret: string;
//   twoFactorEnabled: boolean;
//   logged_in: number;
//   is_verified: boolean;
//   createdAt: string;
//   updatedAt: string;
//   organization: any | null;
// }

// interface DjombiMeta {
//   access_token: string;
//   refresh_token: string;
// }

// interface DjombiProfileResponse {
//   status: string;
//   message: string;
//   data: DjombiUser;
//   meta: DjombiMeta;
// }

// interface DjombiTokens {
//   accessTokenAdafri: string;
//   accessTokenDjombi: string;
//   refreshTokenDjombi: string;
// }

// interface DjombiServiceResult {
//   success: boolean;
//   tokens?: DjombiTokens;
//   profile?: DjombiUser;
//   error?: string;
// }

// // Configuration
// const DJOMBI_BASE_URL = 'https://be-auth-server.onrender.com/api/v1';

// /**
//  * Service to handle Djombi profile operations
//  */
// export class DjombiProfileService {
  
//   /**
//    * Get Djombi profile and token using Adafri access token
//    * @param accessTokenAdafri - The Adafri access token from useAuth
//    * @returns Promise with tokens and profile data
//    */
//   static async getDjombiProfile(accessTokenAdafri: string): Promise<DjombiServiceResult> {
//     try {
//       if (!accessTokenAdafri) {
//         return {
//           success: false,
//           error: 'Adafri access token is required'
//         };
//       }

//       const response: AxiosResponse<DjombiProfileResponse> = await axios.get(
//         `${DJOMBI_BASE_URL}/accounts/profile`,
//         {
//           headers: {
//             Authorization: `Bearer ${accessTokenAdafri}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       // Check if the response indicates success
//       if (response.data.status !== 'success') {
//         return {
//           success: false,
//           error: response.data.message || 'Failed to get Djombi profile'
//         };
//       }

//       const { data: profileData, meta } = response.data;
//       const { access_token: accessTokenDjombi, refresh_token: refreshTokenDjombi } = meta;

//       if (!accessTokenDjombi) {
//         return {
//           success: false,
//           error: 'Djombi access token not received'
//         };
//       }

//       return {
//         success: true,
//         tokens: {
//           accessTokenAdafri,
//           accessTokenDjombi,
//           refreshTokenDjombi
//         },
//         profile: profileData
//       };

//     } catch (error) {
//       console.error('Error getting Djombi profile:', error);
      
//       if (axios.isAxiosError(error)) {
//         const errorMessage = error.response?.data?.message || 
//                            error.response?.data?.error || 
//                            error.message || 
//                            'Failed to get Djombi profile';
        
//         return {
//           success: false,
//           error: errorMessage
//         };
//       }

//       return {
//         success: false,
//         error: 'An unexpected error occurred'
//       };
//     }
//   }

//   /**
//    * Initialize Djombi integration - gets profile and returns both tokens
//    * @param accessTokenAdafri - The Adafri access token from useAuth
//    * @returns Promise with initialization result
//    */
//   static async initializeDjombi(accessTokenAdafri: string): Promise<DjombiServiceResult> {
//     return await this.getDjombiProfile(accessTokenAdafri);
//   }

//   /**
//    * Refresh Djombi access token using refresh token
//    * @param refreshToken - The Djombi refresh token
//    * @returns Promise with new tokens
//    */
//   static async refreshDjombiToken(refreshToken: string): Promise<DjombiServiceResult> {
//     try {
//       if (!refreshToken) {
//         return {
//           success: false,
//           error: 'Refresh token is required'
//         };
//       }

//       // This endpoint might be different - adjust based on your API documentation
//       const response: AxiosResponse<DjombiProfileResponse> = await axios.post(
//         `${DJOMBI_BASE_URL}/auth/refresh`,
//         { refresh_token: refreshToken },
//         {
//           headers: {
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       if (response.data.status !== 'success') {
//         return {
//           success: false,
//           error: response.data.message || 'Failed to refresh token'
//         };
//       }

//       const { data: profileData, meta } = response.data;
//       const { access_token: accessTokenDjombi, refresh_token: refreshTokenDjombi } = meta;

//       return {
//         success: true,
//         tokens: {
//           accessTokenAdafri: '', // Original Adafri token not available in refresh
//           accessTokenDjombi,
//           refreshTokenDjombi
//         },
//         profile: profileData
//       };

//     } catch (error) {
//       console.error('Error refreshing Djombi token:', error);
      
//       if (axios.isAxiosError(error)) {
//         return {
//           success: false,
//           error: error.response?.data?.message || error.message || 'Failed to refresh token'
//         };
//       }

//       return {
//         success: false,
//         error: 'An unexpected error occurred during token refresh'
//       };
//     }
//   }
// }

// /**
//  * Hook-like function to use with your auth system
//  * @param useAuth - Your existing useAuth hook
//  * @returns Function to get Djombi profile with current auth state
//  */
// export const createDjombiProfileGetter = (useAuth: () => any) => {
//   return async (): Promise<DjombiServiceResult> => {
//     const { token: accessTokenAdafri, isAuthenticated } = useAuth();
    
//     if (!isAuthenticated || !accessTokenAdafri) {
//       return {
//         success: false,
//         error: 'User not authenticated or token not available'
//       };
//     }

//     return await DjombiProfileService.getDjombiProfile(accessTokenAdafri);
//   };
// };

// /**
//  * Utility function for direct usage
//  * @param accessTokenAdafri - The Adafri access token
//  * @returns Promise with Djombi profile and token
//  */
// export const getDjombiProfileAndToken = async (
//   accessTokenAdafri: string
// ): Promise<DjombiServiceResult> => {
//   return await DjombiProfileService.getDjombiProfile(accessTokenAdafri);
// };

// // Export types for use in other files
// export type { 
//   DjombiProfileResponse, 
//   DjombiTokens, 
//   DjombiServiceResult, 
//   DjombiUser, 
//   DjombiMeta 
// };