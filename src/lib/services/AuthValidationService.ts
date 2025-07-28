// lib/services/AuthValidationService.ts
/**
 * Service to validate authentication tokens and manage auth state
 * Includes backend token validation and proper error handling
 */

interface TokenValidationResponse {
  valid: boolean;
  user?: any;
  organization?: any;
  error?: string;
  needsRefresh?: boolean;
}

interface AuthTokens {
  adafriToken?: string;
  djombiToken?: string;
}

export class AuthValidationService {
  private static readonly BASE_URL = 'https://email-service-latest-agqz.onrender.com/api/v1';
  
  /**
   * Validate Djombi token with backend
   */
  static async validateDjombiToken(token: string): Promise<TokenValidationResponse> {
    try {
      console.log('🔍 Validating Djombi token...');
      
      const response = await fetch(`${this.BASE_URL}/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token_type: 'djombi' })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Djombi token is valid');
        return {
          valid: true,
          user: data.user,
          organization: data.organization
        };
      } else {
        console.log('❌ Djombi token validation failed:', data);
        return {
          valid: false,
          error: data.message || 'Token validation failed',
          needsRefresh: response.status === 401
        };
      }
    } catch (error) {
      console.error('💥 Token validation error:', error);
      return {
        valid: false,
        error: 'Network error during token validation'
      };
    }
  }

  /**
   * Validate Adafri token with backend
   */
  static async validateAdafriToken(token: string): Promise<TokenValidationResponse> {
    try {
      console.log('🔍 Validating Adafri token...');
      
      const response = await fetch(`${this.BASE_URL}/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token_type: 'adafri' })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Adafri token is valid');
        return {
          valid: true,
          user: data.user,
          organization: data.organization
        };
      } else {
        console.log('❌ Adafri token validation failed:', data);
        return {
          valid: false,
          error: data.message || 'Token validation failed',
          needsRefresh: response.status === 401
        };
      }
    } catch (error) {
      console.error('💥 Token validation error:', error);
      return {
        valid: false,
        error: 'Network error during token validation'
      };
    }
  }

  /**
   * Check if token format is valid (basic JWT check)
   */
  static isValidJWTFormat(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Check if starts with 'ey' (common JWT header)
      return token.startsWith('ey');
    } catch {
      return false;
    }
  }

  /**
   * Get token expiry from JWT
   */
  static getTokenExpiry(token: string): Date | null {
    try {
      if (!this.isValidJWTFormat(token)) return null;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp) {
        return new Date(payload.exp * 1000);
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    const expiry = this.getTokenExpiry(token);
    if (!expiry) return true; // Assume expired if can't parse
    
    return new Date() >= expiry;
  }

  /**
   * Validate authentication state with backend
   */
  static async validateAuthState(tokens: AuthTokens): Promise<{
    isValid: boolean;
    user?: any;
    organization?: any;
    errors: string[];
    needsReauth: boolean;
  }> {
    const errors: string[] = [];
    let isValid = false;
    let user = null;
    let organization = null;
    let needsReauth = false;

    // Validate Adafri token first
    if (tokens.adafriToken) {
      if (this.isTokenExpired(tokens.adafriToken)) {
        errors.push('Adafri token is expired');
        needsReauth = true;
      } else {
        const adafriValidation = await this.validateAdafriToken(tokens.adafriToken);
        if (!adafriValidation.valid) {
          errors.push(adafriValidation.error || 'Adafri token invalid');
          if (adafriValidation.needsRefresh) needsReauth = true;
        } else {
          user = adafriValidation.user;
          organization = adafriValidation.organization;
        }
      }
    } else {
      errors.push('Adafri token missing');
      needsReauth = true;
    }

    // Validate Djombi token if Adafri is valid
    if (tokens.djombiToken && !needsReauth) {
      if (this.isTokenExpired(tokens.djombiToken)) {
        errors.push('Djombi token is expired');
        // Don't set needsReauth here, we can refresh Djombi token
      } else {
        const djombiValidation = await this.validateDjombiToken(tokens.djombiToken);
        if (!djombiValidation.valid) {
          errors.push(djombiValidation.error || 'Djombi token invalid');
        } else {
          isValid = true;
          // Use Djombi user data if available, fallback to Adafri
          user = djombiValidation.user || user;
          organization = djombiValidation.organization || organization;
        }
      }
    } else if (!tokens.djombiToken) {
      errors.push('Djombi token missing');
    }

    return {
      isValid,
      user,
      organization,
      errors,
      needsReauth
    };
  }

  /**
   * Refresh Djombi token using Adafri token
   */
  static async refreshDjombiToken(adafriToken: string): Promise<{
    success: boolean;
    tokens?: {
      accessToken: string;
      refreshToken: string;
    };
    user?: any;
    error?: string;
  }> {
    try {
      console.log('🔄 Refreshing Djombi token...');
      
      const response = await fetch(`${this.BASE_URL}/auth/refresh-djombi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adafriToken}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Djombi token refreshed successfully');
        return {
          success: true,
          tokens: {
            accessToken: data.access_token,
            refreshToken: data.refresh_token
          },
          user: data.user
        };
      } else {
        console.error('❌ Failed to refresh Djombi token:', data);
        return {
          success: false,
          error: data.message || 'Token refresh failed'
        };
      }
    } catch (error) {
      console.error('💥 Token refresh error:', error);
      return {
        success: false,
        error: 'Network error during token refresh'
      };
    }
  }

  /**
   * Initialize Djombi authentication with enhanced validation
   */
  static async initializeDjombiAuth(adafriToken: string): Promise<{
    success: boolean;
    tokens?: {
      accessTokenDjombi: string;
      refreshTokenDjombi: string;
    };
    profile?: any;
    error?: string;
  }> {
    try {
      console.log('🚀 Initializing Djombi authentication...');

      // First validate the Adafri token
      if (!this.isValidJWTFormat(adafriToken)) {
        return {
          success: false,
          error: 'Invalid Adafri token format'
        };
      }

      if (this.isTokenExpired(adafriToken)) {
        return {
          success: false,
          error: 'Adafri token is expired. Please log in again.'
        };
      }

      // Validate with backend
      const adafriValidation = await this.validateAdafriToken(adafriToken);
      if (!adafriValidation.valid) {
        return {
          success: false,
          error: adafriValidation.error || 'Adafri token validation failed'
        };
      }

      // Initialize Djombi
      const response = await fetch(`${this.BASE_URL}/auth/initialize-djombi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adafriToken}`
        },
        body: JSON.stringify({
          user_info: adafriValidation.user
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Djombi authentication initialized successfully');
        
        // Store tokens securely
        if (typeof window !== 'undefined') {
          localStorage.setItem('djombi_access_token', data.access_token);
          localStorage.setItem('djombi_refresh_token', data.refresh_token);
          localStorage.setItem('djombi_user_profile', JSON.stringify(data.user));
        }

        return {
          success: true,
          tokens: {
            accessTokenDjombi: data.access_token,
            refreshTokenDjombi: data.refresh_token
          },
          profile: data.user
        };
      } else {
        console.error('❌ Djombi initialization failed:', data);
        return {
          success: false,
          error: data.message || 'Djombi initialization failed'
        };
      }
    } catch (error) {
      console.error('💥 Djombi initialization error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error during initialization'
      };
    }
  }

  /**
   * Clear all authentication data
   */
  static clearAuthData(): void {
    if (typeof window !== 'undefined') {
      const keysToRemove = [
        'djombi_access_token',
        'djombi_refresh_token',
        'djombi_user_profile',
        'accessToken',
        'linkedEmailId',
        'user_organizations_cache'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      // Clear cookies as well
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
    }
  }

  /**
   * Debug authentication state
   */
  static debugAuthState(): void {
    if (typeof window !== 'undefined') {
      console.log('=== AUTH DEBUG ===');
      console.log('Djombi Token:', localStorage.getItem('djombi_access_token')?.substring(0, 20) + '...');
      console.log('Djombi Profile:', localStorage.getItem('djombi_user_profile'));
      console.log('Access Token:', localStorage.getItem('accessToken')?.substring(0, 20) + '...');
      console.log('Linked Email ID:', localStorage.getItem('linkedEmailId'));
      console.log('Cookies:', document.cookie);
      console.log('==================');
    }
  }
}