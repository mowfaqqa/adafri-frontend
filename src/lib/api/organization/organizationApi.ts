// lib/api/organizationApi.ts
const API_BASE_URL = 'https://email-service-latest-agqz.onrender.com/api/v1';

export interface CreateOrganizationData {
  business_name: string;
  business_address: string;
  business_phone: string;
  business_taxId: string;
  business_industry: string;
}

export interface Organization {
  id: string;
  business_name: string;
  business_address: string;
  business_phone: string;
  business_taxId: string;
  business_industry: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  role: string;
  permissions: string[];
  twoFactorEnabled: boolean;
  organization: Organization;
}

export interface OrganizationsResponse {
  status: string;
  message: string;
  data: OrganizationMember[];
}

export interface CreateOrganizationResponse {
  status: string;
  message: string;
  data: Organization;
}

export interface SwitchOrganizationData {
  organizationId: string;
}

export interface SwitchOrganizationResponse {
  status: string;
  message: string;
  data?: any;
}

class OrganizationApiService {
  private getDjombiAuthData(): {
    accessToken: string | null;
    refreshToken: string | null;
    authStatus: any;
    cacheTimestamp: number | null;
    isAuthenticated: boolean;
  } {
    if (typeof window === 'undefined') {
      return {
        accessToken: null,
        refreshToken: null,
        authStatus: null,
        cacheTimestamp: null,
        isAuthenticated: false
      };
    }
    
    try {
      // Get djombi access token
      let accessToken = null;
      const djombiTokenData = localStorage.getItem('djombi_access_token');
      if (djombiTokenData) {
        try {
          const parsedToken = JSON.parse(djombiTokenData);
          accessToken = parsedToken.access_token || parsedToken;
        } catch {
          // If it's not JSON, treat as plain string
          accessToken = djombiTokenData;
        }
      }
      
      // Fallback: try to get from djombi_tokens
      if (!accessToken) {
        const djombiTokens = localStorage.getItem('djombi_tokens');
        if (djombiTokens) {
          const tokens = JSON.parse(djombiTokens);
          accessToken = tokens.accessTokenDjombi;
        }
      }

      // Get djombi refresh token
      let refreshToken = null;
      const djombiRefreshTokenData = localStorage.getItem('djombi_refresh_token');
      if (djombiRefreshTokenData) {
        try {
          const parsedRefreshToken = JSON.parse(djombiRefreshTokenData);
          refreshToken = parsedRefreshToken.refresh_token || parsedRefreshToken;
        } catch {
          // If it's not JSON, treat as plain string
          refreshToken = djombiRefreshTokenData;
        }
      }

      // Fallback: try to get refresh token from djombi_tokens
      if (!refreshToken) {
        const djombiTokens = localStorage.getItem('djombi_tokens');
        if (djombiTokens) {
          const tokens = JSON.parse(djombiTokens);
          refreshToken = tokens.refreshTokenDjombi;
        }
      }

      // Get djombi auth status
      let authStatus = null;
      const djombiAuthStatusData = localStorage.getItem('djombi_auth_status');
      if (djombiAuthStatusData) {
        try {
          authStatus = JSON.parse(djombiAuthStatusData);
        } catch {
          authStatus = djombiAuthStatusData;
        }
      }

      // Get djombi cache timestamp
      let cacheTimestamp = null;
      const djombiCacheTimestampData = localStorage.getItem('djombi_cache_timestamp');
      if (djombiCacheTimestampData) {
        try {
          cacheTimestamp = JSON.parse(djombiCacheTimestampData);
        } catch {
          cacheTimestamp = parseInt(djombiCacheTimestampData, 10);
        }
      }

      // Check if authentication is valid
      const isAuthenticated = !!(accessToken && authStatus !== 'expired' && authStatus !== 'invalid');

      // Check if cache is still valid (optional - you can set your own cache duration)
      const cacheValidDuration = 60 * 60 * 1000; // 1 hour in milliseconds
      const isCacheValid = cacheTimestamp ? 
        (Date.now() - cacheTimestamp) < cacheValidDuration : false;

      return {
        accessToken,
        refreshToken,
        authStatus,
        cacheTimestamp,
        isAuthenticated: isAuthenticated && (isCacheValid || !cacheTimestamp)
      };
    } catch (error) {
      console.error('Error getting Djombi auth data:', error);
      return {
        accessToken: null,
        refreshToken: null,
        authStatus: null,
        cacheTimestamp: null,
        isAuthenticated: false
      };
    }
  }

  private async refreshTokenIfNeeded(): Promise<string | null> {
    const authData = this.getDjombiAuthData();
    
    // If we have a valid access token, use it
    if (authData.isAuthenticated && authData.accessToken) {
      return authData.accessToken;
    }

    // If we have a refresh token, try to refresh
    if (authData.refreshToken && authData.authStatus !== 'expired') {
      try {
        // You can implement token refresh logic here
        // For now, we'll just log and return null
        console.log('Token refresh needed but not implemented');
        return null;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return null;
      }
    }

    return null;
  }

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      // Get authentication data
      const authData = this.getDjombiAuthData();
      
      console.log('Djombi Auth Data:', {
        hasAccessToken: !!authData.accessToken,
        hasRefreshToken: !!authData.refreshToken,
        authStatus: authData.authStatus,
        cacheTimestamp: authData.cacheTimestamp,
        isAuthenticated: authData.isAuthenticated,
        cacheAge: authData.cacheTimestamp ? Date.now() - authData.cacheTimestamp : null
      });

      // Try to get a valid access token
      let accessToken = authData.accessToken;
      
      if (!authData.isAuthenticated) {
        // Try to refresh token if needed
        accessToken = await this.refreshTokenIfNeeded();
      }

      if (!accessToken) {
        throw new Error('Djombi authentication token not found or expired. Please log in again.');
      }

      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Clear invalid auth data
          this.clearInvalidAuthData();
          throw new Error('Authentication failed. Please log in again.');
        }
        
        // Try to get error message from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Ignore JSON parsing errors
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private clearInvalidAuthData(): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Update auth status to expired
      localStorage.setItem('djombi_auth_status', JSON.stringify('expired'));
      
      // Optionally clear tokens (uncomment if you want to clear them)
      // localStorage.removeItem('djombi_access_token');
      // localStorage.removeItem('djombi_refresh_token');
      // localStorage.removeItem('djombi_tokens');
      
      console.log('Marked Djombi auth as expired');
    } catch (error) {
      console.error('Error clearing invalid auth data:', error);
    }
  }

  async getOrganizations(): Promise<OrganizationsResponse> {
    return this.makeRequest<OrganizationsResponse>('/organizations');
  }

  async createOrganization(data: CreateOrganizationData): Promise<CreateOrganizationResponse> {
    return this.makeRequest<CreateOrganizationResponse>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async switchOrganization(data: SwitchOrganizationData): Promise<SwitchOrganizationResponse> {
    return this.makeRequest<SwitchOrganizationResponse>('/organizations/switch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const organizationApi = new OrganizationApiService();














































// // lib/api/organizationApi.ts
// const API_BASE_URL = 'https://email-service-latest-agqz.onrender.com/api/v1';

// export interface CreateOrganizationData {
//   business_name: string;
//   business_address: string;
//   business_phone: string;
//   business_taxId: string;
//   business_industry: string;
// }

// export interface Organization {
//   id: string;
//   business_name: string;
//   business_address: string;
//   business_phone: string;
//   business_taxId: string;
//   business_industry: string;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface OrganizationMember {
//   role: string;
//   permissions: string[];
//   twoFactorEnabled: boolean;
//   organization: Organization;
// }

// export interface OrganizationsResponse {
//   status: string;
//   message: string;
//   data: OrganizationMember[];
// }

// export interface CreateOrganizationResponse {
//   status: string;
//   message: string;
//   data: Organization;
// }

// export interface SwitchOrganizationData {
//   organizationId: string;
// }

// export interface SwitchOrganizationResponse {
//   status: string;
//   message: string;
//   data?: any;
// }

// class OrganizationApiService {
//   private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
//     try {
//       const response = await fetch(`${API_BASE_URL}${url}`, {
//         headers: {
//           'Content-Type': 'application/json',
//           ...options.headers,
//         },
//         ...options,
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       return await response.json();
//     } catch (error) {
//       console.error('API request failed:', error);
//       throw error;
//     }
//   }

//   async getOrganizations(): Promise<OrganizationsResponse> {
//     return this.makeRequest<OrganizationsResponse>('/organizations');
//   }

//   async createOrganization(data: CreateOrganizationData): Promise<CreateOrganizationResponse> {
//     return this.makeRequest<CreateOrganizationResponse>('/organizations', {
//       method: 'POST',
//       body: JSON.stringify(data),
//     });
//   }

//   async switchOrganization(data: SwitchOrganizationData): Promise<SwitchOrganizationResponse> {
//     return this.makeRequest<SwitchOrganizationResponse>('/organizations/switch', {
//       method: 'POST',
//       body: JSON.stringify(data),
//     });
//   }
// }

// export const organizationApi = new OrganizationApiService();