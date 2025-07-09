import axiosInstance from './axios';

export interface InviteRequest {
  email: string;
  message: string;
  inviteType?: 'permanent' | 'temporary';
  temporaryDuration?: '1week' | '2weeks' | '1month';
}

export interface InviteResponse {
  id: string;
  email: string;
  invitationType: string;
  status: string;
  token?: string;
  temporaryDuration?: number;
  temporaryExpiresAt?: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JoinResponse {
  success: boolean;
  message?: string;
  workspace?: any;
  requiresAuth?: boolean;
}

export class InviteTeamService {
  // Helper method to convert duration to hours
  private static convertDurationToHours(duration: '1week' | '2weeks' | '1month'): number {
    switch (duration) {
      case '1week': return 168;
      case '2weeks': return 336;
      case '1month': return 720;
      default: return 168;
    }
  }

  // Helper method to prepare invite data for backend
  private static prepareInviteData(inviteData: InviteRequest): any {
    const backendData: any = {
      email: inviteData.email,
      message: inviteData.message,
    };

    if (inviteData.inviteType === 'temporary') {
      backendData.invitationType = 'temporary';
      if (inviteData.temporaryDuration) {
        backendData.temporaryDuration = this.convertDurationToHours(inviteData.temporaryDuration);
      }
    }

    return backendData;
  }

  // Send invitation to a team member
  static async sendInvitation(workspaceId: string, inviteData: InviteRequest): Promise<InviteResponse> {
    try {
      const backendData = this.prepareInviteData(inviteData);
      const response = await axiosInstance.post(`/workspaces/${workspaceId}/invitations`, backendData);
      return response.data.invitation || response.data;
    } catch (error) {
      console.error('Error sending invitation:', error);
      throw error;
    }
  }

  // Send multiple invitations
  static async sendMultipleInvitations(
    workspaceId: string, 
    invites: InviteRequest[]
  ): Promise<InviteResponse[]> {
    try {
      const promises = invites.map(invite => 
        this.sendInvitation(workspaceId, invite)
      );
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error sending multiple invitations:', error);
      throw error;
    }
  }

  // Get list of invitations for a workspace
  static async getInvitations(workspaceId: string): Promise<InviteResponse[]> {
    try {
      const response = await axiosInstance.get(`/workspaces/${workspaceId}/invitations`);
      return response.data.invitations || response.data;
    } catch (error) {
      console.error('Error fetching invitations:', error);
      throw error;
    }
  }

  // Accept an invitation using the correct endpoint
  static async acceptInvitation(token: string): Promise<JoinResponse> {
    try {
      const response = await axiosInstance.post('/workspaces/join', { token });
      return response.data;
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  // Helper method to extract token from URL
  static extractTokenFromUrl(url?: string): string | null {
    try {
      const currentUrl = url || window.location.href;
      const urlObj = new URL(currentUrl);
      return urlObj.searchParams.get('token');
    } catch (error) {
      console.error('Error parsing URL for token:', error);
      return null;
    }
  }

  // Helper method to validate token format
  static validateToken(token: string): boolean {
    return !!(token && token.length > 0 && typeof token === 'string');
  }
}























































// this afternoon 7/9
// import axiosInstance from './axios';
// import config from "@/lib/config/messaging";

// export interface InviteRequest {
//   email: string;
//   message: string; // Changed from role to message
//   inviteType?: 'permanent' | 'temporary';
//   temporaryDuration?: '1week' | '2weeks' | '1month';
// }

// export interface InviteResponse {
//   id: string;
//   email: string;
//   invitationType: string; // Changed from role to invitationType
//   status: string;
//   token?: string;
//   temporaryDuration?: number; // Now a number (hours)
//   temporaryExpiresAt?: string; // New field for temporary invites
//   expiresAt?: string;
//   createdAt?: string;
//   updatedAt?: string;
// }

// export interface AcceptInviteRequest {
//   token: string;
// }

// export interface JoinResponse {
//   requiresAuth?: boolean;
//   email?: string;
//   message?: string;
//   workspace?: any;
// }

// export class InviteTeamService {
//   // Helper method to get access token from localStorage (matching your axios setup)
//   private static getAccessToken(): string | null {
//     try {
//       const tokenData = localStorage.getItem("access_token");
//       if (tokenData) {
//         const parsed = JSON.parse(tokenData);
//         return parsed.access_token || null;
//       }
//       return null;
//     } catch (error) {
//       console.error('Error parsing access token from localStorage:', error);
//       return null;
//     }
//   }

//   // Helper method to convert duration to hours
//   private static convertDurationToHours(duration: '1week' | '2weeks' | '1month'): number {
//     switch (duration) {
//       case '1week':
//         return 168; // 24 * 7 hours
//       case '2weeks':
//         return 336; // 24 * 14 hours
//       case '1month':
//         return 720; // 24 * 30 hours (assuming 30 days)
//       default:
//         return 168; // Default to 1 week
//     }
//   }

//   // Helper method to prepare invite data for backend
//   private static prepareInviteData(inviteData: InviteRequest): any {
//     const backendData: any = {
//       email: inviteData.email,
//       message: inviteData.message,
//     };

//     // For temporary invites, add invitationType and convert duration to hours
//     if (inviteData.inviteType === 'temporary') {
//       backendData.invitationType = 'temporary';
//       if (inviteData.temporaryDuration) {
//         backendData.temporaryDuration = this.convertDurationToHours(inviteData.temporaryDuration);
//       }
//     }
//     // For permanent invites, we don't send invitationType in the body (backend adds it automatically)

//     return backendData;
//   }

//   // Send invitation to a team member
//   static async sendInvitation(workspaceId: string, inviteData: InviteRequest): Promise<InviteResponse> {
//     try {
//       // Prepare data with duration converted to hours for temporary invites
//       const backendData = this.prepareInviteData(inviteData);
      
//       const response = await axiosInstance.post(
//         `/workspaces/${workspaceId}/invitations`,
//         backendData
//       );
//       return response.data.invitation || response.data;
//     } catch (error) {
//       console.error('Error sending invitation:', error);
//       throw error;
//     }
//   }

//   // Send multiple invitations
//   static async sendMultipleInvitations(
//     workspaceId: string, 
//     invites: InviteRequest[]
//   ): Promise<InviteResponse[]> {
//     try {
//       const promises = invites.map(invite => 
//         this.sendInvitation(workspaceId, invite)
//       );
//       return await Promise.all(promises);
//     } catch (error) {
//       console.error('Error sending multiple invitations:', error);
//       throw error;
//     }
//   }

//   // Get list of invitations for a workspace
//   static async getInvitations(workspaceId: string): Promise<InviteResponse[]> {
//     try {
//       const response = await axiosInstance.get(`/workspaces/${workspaceId}/invitations`);
//       return response.data.invitations || response.data;
//     } catch (error) {
//       console.error('Error fetching invitations:', error);
//       throw error;
//     }
//   }

//   // Accept an invitation using the updated endpoint
//   static async acceptInvitation(token: string): Promise<JoinResponse> {
//     try {
//       // Log the request details for debugging (remove in production)
//       const accessToken = this.getAccessToken();
//       console.log('Making join request with:', {
//         token: token.substring(0, 10) + '...',
//         hasAccessToken: !!accessToken,
//         accessTokenLength: accessToken?.length || 0,
//         endpoint: '/workspaces/join'
//       });

//       const response = await axiosInstance.post('/workspaces/join', { token });
      
//       console.log('Join response:', {
//         status: response.status,
//         hasWorkspace: !!response.data.workspace,
//         requiresAuth: response.data.requiresAuth
//       });

//       return response.data;
//     } catch (error: any) {
//       console.error('Error accepting invitation:', {
//         status: error?.response?.status,
//         message: error?.response?.data?.message || error.message,
//         token: token?.substring(0, 10) + '...',
//         hasLocalStorageToken: !!this.getAccessToken()
//       });
//       throw error;
//     }
//   }

//   // Helper method to extract token from URL (for accept invitation flow)
//   static extractTokenFromUrl(url?: string): string | null {
//     try {
//       const currentUrl = url || window.location.href;
//       const urlObj = new URL(currentUrl);
//       return urlObj.searchParams.get('token');
//     } catch (error) {
//       console.error('Error parsing URL for token:', error);
//       return null;
//     }
//   }

//   // Helper method to validate token format
//   static validateToken(token: string): boolean {
//     return !!(token && token.length > 0 && typeof token === 'string');
//   }

//   // Helper method to format duration for display
//   static formatDuration(duration?: string | number): string {
//     if (typeof duration === 'number') {
//       // Convert hours to readable format
//       if (duration >= 720) return `${Math.floor(duration / 720)} Month${Math.floor(duration / 720) > 1 ? 's' : ''}`;
//       if (duration >= 168) return `${Math.floor(duration / 168)} Week${Math.floor(duration / 168) > 1 ? 's' : ''}`;
//       if (duration >= 24) return `${Math.floor(duration / 24)} Day${Math.floor(duration / 24) > 1 ? 's' : ''}`;
//       return `${duration} Hour${duration > 1 ? 's' : ''}`;
//     }
    
//     switch (duration) {
//       case '1week': return '1 Week';
//       case '2weeks': return '2 Weeks';
//       case '1month': return '1 Month';
//       default: return 'Not specified';
//     }
//   }

//   // Helper method to get duration in hours (for display purposes)
//   static getDurationInHours(duration?: '1week' | '2weeks' | '1month'): number | null {
//     if (!duration) return null;
//     return this.convertDurationToHours(duration);
//   }

//   // Helper method to check if invitation is expired
//   static isInvitationExpired(invitation: InviteResponse): boolean {
//     if (!invitation.expiresAt) return false;
//     return new Date(invitation.expiresAt) < new Date();
//   }

//   // Helper method to check if temporary invitation is expired
//   static isTemporaryInvitationExpired(invitation: InviteResponse): boolean {
//     if (invitation.invitationType !== 'temporary' || !invitation.temporaryExpiresAt) return false;
//     return new Date(invitation.temporaryExpiresAt) < new Date();
//   }

//   // Helper method to get invitation type display name
//   static getInviteTypeDisplay(invitationType?: string): string {
//     switch (invitationType) {
//       case 'permanent': return 'Team Member';
//       case 'temporary': return 'Temporary Access';
//       default: return 'Team Member';
//     }
//   }

//   // Helper method to get remaining time for temporary invitations
//   static getRemainingTime(invitation: InviteResponse): string | null {
//     if (invitation.invitationType !== 'temporary') return null;
    
//     const now = new Date();
//     let expiresAt: Date;
    
//     // Use temporaryExpiresAt if available, otherwise fall back to expiresAt
//     if (invitation.temporaryExpiresAt) {
//       expiresAt = new Date(invitation.temporaryExpiresAt);
//     } else if (invitation.expiresAt) {
//       expiresAt = new Date(invitation.expiresAt);
//     } else {
//       return null;
//     }
    
//     const diff = expiresAt.getTime() - now.getTime();
    
//     if (diff <= 0) return 'Expired';
    
//     const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//     const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//     const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
//     if (days > 0) {
//       return `${days} day${days > 1 ? 's' : ''} remaining`;
//     } else if (hours > 0) {
//       return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
//     } else if (minutes > 0) {
//       return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
//     } else {
//       return 'Less than 1 minute remaining';
//     }
//   }

//   // Helper method to handle join invitation response and redirect logic
//   static handleJoinResponse(response: JoinResponse, router: any): void {
//     if (response.requiresAuth) {
//       // Store the current URL to redirect back after login
//       const currentUrl = window.location.href;
//       localStorage.setItem('redirectAfterLogin', '/dashboard/messaging');
      
//       // Redirect to login page
//       router.push('/login');
//     } else if (response.workspace) {
//       // Successfully joined, redirect to messaging dashboard
//       router.push('/dashboard/messaging');
//     }
//   }

//   // Helper method to convert duration string to hours for UI selection
//   static getHoursFromDurationString(duration: '1week' | '2weeks' | '1month'): number {
//     return this.convertDurationToHours(duration);
//   }

//   // Helper method to convert hours back to duration string for UI display
//   static getDurationStringFromHours(hours: number): '1week' | '2weeks' | '1month' | null {
//     switch (hours) {
//       case 168: return '1week';
//       case 336: return '2weeks';
//       case 720: return '1month';
//       default: return null;
//     }
//   }
// }













































































// // Updated with djombi auth support
// import axios, { AxiosInstance } from 'axios';
// import config from "@/lib/config/messaging";
// import { DjombiProfileService } from "@/lib/services/DjombiProfileService";

// export interface InviteRequest {
//   email: string;
//   message: string; // Changed from role to message
//   inviteType?: 'permanent' | 'temporary';
//   temporaryDuration?: '1week' | '2weeks' | '1month';
// }

// export interface InviteResponse {
//   id: string;
//   email: string;
//   invitationType: string; // Changed from role to invitationType
//   status: string;
//   token?: string;
//   temporaryDuration?: number; // Now a number (hours)
//   temporaryExpiresAt?: string; // New field for temporary invites
//   expiresAt?: string;
//   createdAt?: string;
//   updatedAt?: string;
// }

// export interface AcceptInviteRequest {
//   token: string;
// }

// export interface JoinResponse {
//   requiresAuth?: boolean;
//   email?: string;
//   message?: string;
//   workspace?: any;
// }

// export class InviteTeamService {
//   // Create authenticated axios instance with djombi token
//   private static createAuthenticatedAxios(): AxiosInstance {
//     const instance = axios.create({
//       baseURL: config.apiBaseUrl || 'https://your-api-base-url.com/api/v1', // Update with your actual base URL
//       timeout: 30000,
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });

//     // Add request interceptor to include djombi auth token
//     instance.interceptors.request.use(
//       (config) => {
//         const token = this.getDjombiToken();
//         if (token) {
//           config.headers.Authorization = `Bearer ${token}`;
//           console.log(`Making ${config.method?.toUpperCase()} request to ${config.url} with djombi token`);
//         } else {
//           console.warn('No djombi token available for request');
//         }
//         return config;
//       },
//       (error) => {
//         console.error('Request interceptor error:', error);
//         return Promise.reject(error);
//       }
//     );

//     // Add response interceptor for better error handling
//     instance.interceptors.response.use(
//       (response) => {
//         return response;
//       },
//       (error) => {
//         console.error('Response interceptor error:', error);
        
//         // Handle specific error cases
//         if (error.response?.status === 401) {
//           console.error('Authentication failed - djombi token may be invalid or expired');
//         } else if (error.response?.status === 403) {
//           console.error('Access denied - insufficient permissions');
//         }
        
//         return Promise.reject(error);
//       }
//     );

//     return instance;
//   }

//   // Get Djombi access token using the same pattern as other components
//   private static getDjombiToken(): string | null {
//     try {
//       // First try from DjombiProfileService
//       const { accessToken } = DjombiProfileService.getStoredDjombiTokens();
//       if (accessToken) {
//         return accessToken;
//       }
      
//       // Fallback to localStorage directly
//       if (typeof window !== 'undefined') {
//         const storedToken = localStorage.getItem('djombi_access_token');
//         if (storedToken) {
//           return storedToken;
//         }
//       }
      
//       return null;
//     } catch (error) {
//       console.error("Error getting Djombi access token:", error);
//       return null;
//     }
//   }

//   // Validate that we have a djombi token before making requests
//   private static validateAuth(): void {
//     const token = this.getDjombiToken();
//     if (!token) {
//       throw new Error('No djombi authentication token available. Please log in again.');
//     }
//   }

//   // Helper method to convert duration to hours
//   private static convertDurationToHours(duration: '1week' | '2weeks' | '1month'): number {
//     switch (duration) {
//       case '1week':
//         return 168; // 24 * 7 hours
//       case '2weeks':
//         return 336; // 24 * 14 hours
//       case '1month':
//         return 720; // 24 * 30 hours (assuming 30 days)
//       default:
//         return 168; // Default to 1 week
//     }
//   }

//   // Helper method to prepare invite data for backend
//   private static prepareInviteData(inviteData: InviteRequest): any {
//     const backendData: any = {
//       email: inviteData.email,
//       message: inviteData.message,
//     };

//     // For temporary invites, add invitationType and convert duration to hours
//     if (inviteData.inviteType === 'temporary') {
//       backendData.invitationType = 'temporary';
//       if (inviteData.temporaryDuration) {
//         backendData.temporaryDuration = this.convertDurationToHours(inviteData.temporaryDuration);
//       }
//     }
//     // For permanent invites, we don't send invitationType in the body (backend adds it automatically)

//     return backendData;
//   }

//   // Send invitation to a team member with djombi auth
//   static async sendInvitation(workspaceId: string, inviteData: InviteRequest): Promise<InviteResponse> {
//     try {
//       // Validate authentication first
//       this.validateAuth();
      
//       console.log('Sending invitation with djombi auth:', {
//         workspaceId,
//         email: inviteData.email,
//         inviteType: inviteData.inviteType,
//         hasToken: !!this.getDjombiToken()
//       });

//       // Prepare data with duration converted to hours for temporary invites
//       const backendData = this.prepareInviteData(inviteData);
      
//       const axiosInstance = this.createAuthenticatedAxios();
//       const response = await axiosInstance.post(
//         `/workspaces/${workspaceId}/invitations`,
//         backendData
//       );
      
//       console.log('Invitation sent successfully:', response.data);
//       return response.data.invitation || response.data;
//     } catch (error) {
//       console.error('Error sending invitation:', error);
      
//       // Enhanced error handling
//       if (axios.isAxiosError(error)) {
//         if (error.response?.status === 401) {
//           throw new Error('Authentication failed. Please log in again.');
//         } else if (error.response?.status === 403) {
//           throw new Error('Access denied. You do not have permission to send invitations.');
//         } else if (error.response?.status === 409) {
//           throw new Error('User is already invited or is a member of this workspace.');
//         } else if (error.response?.data?.message) {
//           throw new Error(error.response.data.message);
//         }
//       }
      
//       throw error;
//     }
//   }

//   // Send multiple invitations with djombi auth
//   static async sendMultipleInvitations(
//     workspaceId: string, 
//     invites: InviteRequest[]
//   ): Promise<InviteResponse[]> {
//     try {
//       // Validate authentication first
//       this.validateAuth();
      
//       console.log(`Sending ${invites.length} invitations with djombi auth to workspace ${workspaceId}`);

//       const promises = invites.map(invite => 
//         this.sendInvitation(workspaceId, invite)
//       );
      
//       const results = await Promise.all(promises);
//       console.log(`Successfully sent ${results.length} invitations`);
      
//       return results;
//     } catch (error) {
//       console.error('Error sending multiple invitations:', error);
//       throw error;
//     }
//   }

//   // Get list of invitations for a workspace with djombi auth
//   static async getInvitations(workspaceId: string): Promise<InviteResponse[]> {
//     try {
//       // Validate authentication first
//       this.validateAuth();
      
//       console.log('Fetching invitations with djombi auth for workspace:', workspaceId);

//       const axiosInstance = this.createAuthenticatedAxios();
//       const response = await axiosInstance.get(`/workspaces/${workspaceId}/invitations`);
      
//       console.log('Invitations fetched successfully:', response.data);
//       return response.data.invitations || response.data;
//     } catch (error) {
//       console.error('Error fetching invitations:', error);
      
//       // Enhanced error handling
//       if (axios.isAxiosError(error)) {
//         if (error.response?.status === 401) {
//           throw new Error('Authentication failed. Please log in again.');
//         } else if (error.response?.status === 403) {
//           throw new Error('Access denied. You do not have permission to view invitations.');
//         } else if (error.response?.status === 404) {
//           throw new Error('Workspace not found.');
//         } else if (error.response?.data?.message) {
//           throw new Error(error.response.data.message);
//         }
//       }
      
//       throw error;
//     }
//   }

//   // Accept an invitation using the updated endpoint with djombi auth
//   static async acceptInvitation(token: string): Promise<JoinResponse> {
//     try {
//       // Note: This endpoint might not require djombi auth since it uses the invitation token
//       // But we'll include it for consistency
//       console.log('Accepting invitation with token and djombi auth');

//       const axiosInstance = this.createAuthenticatedAxios();
//       const response = await axiosInstance.post('/workspaces/join', { token });
      
//       console.log('Invitation accepted successfully:', response.data);
//       return response.data;
//     } catch (error) {
//       console.error('Error accepting invitation:', error);
      
//       // Enhanced error handling
//       if (axios.isAxiosError(error)) {
//         if (error.response?.status === 400) {
//           throw new Error('Invalid or expired invitation token.');
//         } else if (error.response?.status === 401) {
//           throw new Error('Authentication failed. Please log in again.');
//         } else if (error.response?.status === 409) {
//           throw new Error('You are already a member of this workspace.');
//         } else if (error.response?.data?.message) {
//           throw new Error(error.response.data.message);
//         }
//       }
      
//       throw error;
//     }
//   }

//   // Helper method to check authentication status
//   static isAuthenticated(): boolean {
//     return !!this.getDjombiToken();
//   }

//   // Helper method to get current user info (if available)
//   static getCurrentUserInfo(): any {
//     try {
//       return DjombiProfileService.getStoredUserProfile();
//     } catch (error) {
//       console.error('Error getting user info:', error);
//       return null;
//     }
//   }

//   // Helper method to extract token from URL (for accept invitation flow)
//   static extractTokenFromUrl(url?: string): string | null {
//     try {
//       const currentUrl = url || window.location.href;
//       const urlObj = new URL(currentUrl);
//       return urlObj.searchParams.get('token');
//     } catch (error) {
//       console.error('Error parsing URL for token:', error);
//       return null;
//     }
//   }

//   // Helper method to validate token format
//   static validateToken(token: string): boolean {
//     return !!(token && token.length > 0 && typeof token === 'string');
//   }

//   // Helper method to format duration for display
//   static formatDuration(duration?: string | number): string {
//     if (typeof duration === 'number') {
//       // Convert hours to readable format
//       if (duration >= 720) return `${Math.floor(duration / 720)} Month${Math.floor(duration / 720) > 1 ? 's' : ''}`;
//       if (duration >= 168) return `${Math.floor(duration / 168)} Week${Math.floor(duration / 168) > 1 ? 's' : ''}`;
//       if (duration >= 24) return `${Math.floor(duration / 24)} Day${Math.floor(duration / 24) > 1 ? 's' : ''}`;
//       return `${duration} Hour${duration > 1 ? 's' : ''}`;
//     }
    
//     switch (duration) {
//       case '1week': return '1 Week';
//       case '2weeks': return '2 Weeks';
//       case '1month': return '1 Month';
//       default: return 'Not specified';
//     }
//   }

//   // Helper method to get duration in hours (for display purposes)
//   static getDurationInHours(duration?: '1week' | '2weeks' | '1month'): number | null {
//     if (!duration) return null;
//     return this.convertDurationToHours(duration);
//   }

//   // Helper method to check if invitation is expired
//   static isInvitationExpired(invitation: InviteResponse): boolean {
//     if (!invitation.expiresAt) return false;
//     return new Date(invitation.expiresAt) < new Date();
//   }

//   // Helper method to check if temporary invitation is expired
//   static isTemporaryInvitationExpired(invitation: InviteResponse): boolean {
//     if (invitation.invitationType !== 'temporary' || !invitation.temporaryExpiresAt) return false;
//     return new Date(invitation.temporaryExpiresAt) < new Date();
//   }

//   // Helper method to get invitation type display name
//   static getInviteTypeDisplay(invitationType?: string): string {
//     switch (invitationType) {
//       case 'permanent': return 'Team Member';
//       case 'temporary': return 'Temporary Access';
//       default: return 'Team Member';
//     }
//   }

//   // Helper method to get remaining time for temporary invitations
//   static getRemainingTime(invitation: InviteResponse): string | null {
//     if (invitation.invitationType !== 'temporary') return null;
    
//     const now = new Date();
//     let expiresAt: Date;
    
//     // Use temporaryExpiresAt if available, otherwise fall back to expiresAt
//     if (invitation.temporaryExpiresAt) {
//       expiresAt = new Date(invitation.temporaryExpiresAt);
//     } else if (invitation.expiresAt) {
//       expiresAt = new Date(invitation.expiresAt);
//     } else {
//       return null;
//     }
    
//     const diff = expiresAt.getTime() - now.getTime();
    
//     if (diff <= 0) return 'Expired';
    
//     const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//     const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//     const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
//     if (days > 0) {
//       return `${days} day${days > 1 ? 's' : ''} remaining`;
//     } else if (hours > 0) {
//       return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
//     } else if (minutes > 0) {
//       return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
//     } else {
//       return 'Less than 1 minute remaining';
//     }
//   }

//   // Helper method to handle join invitation response and redirect logic
//   static handleJoinResponse(response: JoinResponse, router: any): void {
//     if (response.requiresAuth) {
//       // Store the current URL to redirect back after login
//       const currentUrl = window.location.href;
//       localStorage.setItem('redirectAfterLogin', '/dashboard/messaging');
      
//       // Redirect to login page
//       router.push('/login');
//     } else if (response.workspace) {
//       // Successfully joined, redirect to messaging dashboard
//       router.push('/dashboard/messaging');
//     }
//   }

//   // Helper method to convert duration string to hours for UI selection
//   static getHoursFromDurationString(duration: '1week' | '2weeks' | '1month'): number {
//     return this.convertDurationToHours(duration);
//   }

//   // Helper method to convert hours back to duration string for UI display
//   static getDurationStringFromHours(hours: number): '1week' | '2weeks' | '1month' | null {
//     switch (hours) {
//       case 168: return '1week';
//       case 336: return '2weeks';
//       case 720: return '1month';
//       default: return null;
//     }
//   }
// }



























































// // // working auth for POST and GET 4:56
// import axiosInstance from './axios';
// import config from "@/lib/config/messaging";

// export interface InviteRequest {
//   email: string;
//   message: string; // Changed from role to message
//   inviteType?: 'permanent' | 'temporary';
//   temporaryDuration?: '1week' | '2weeks' | '1month';
// }

// export interface InviteResponse {
//   id: string;
//   email: string;
//   invitationType: string; // Changed from role to invitationType
//   status: string;
//   token?: string;
//   temporaryDuration?: number; // Now a number (hours)
//   temporaryExpiresAt?: string; // New field for temporary invites
//   expiresAt?: string;
//   createdAt?: string;
//   updatedAt?: string;
// }

// export interface AcceptInviteRequest {
//   token: string;
// }

// export interface JoinResponse {
//   requiresAuth?: boolean;
//   email?: string;
//   message?: string;
//   workspace?: any;
// }

// export class InviteTeamService {
//   // Helper method to convert duration to hours
//   private static convertDurationToHours(duration: '1week' | '2weeks' | '1month'): number {
//     switch (duration) {
//       case '1week':
//         return 168; // 24 * 7 hours
//       case '2weeks':
//         return 336; // 24 * 14 hours
//       case '1month':
//         return 720; // 24 * 30 hours (assuming 30 days)
//       default:
//         return 168; // Default to 1 week
//     }
//   }

//   // Helper method to prepare invite data for backend
//   private static prepareInviteData(inviteData: InviteRequest): any {
//     const backendData: any = {
//       email: inviteData.email,
//       message: inviteData.message,
//     };

//     // For temporary invites, add invitationType and convert duration to hours
//     if (inviteData.inviteType === 'temporary') {
//       backendData.invitationType = 'temporary';
//       if (inviteData.temporaryDuration) {
//         backendData.temporaryDuration = this.convertDurationToHours(inviteData.temporaryDuration);
//       }
//     }
//     // For permanent invites, we don't send invitationType in the body (backend adds it automatically)

//     return backendData;
//   }

//   // Send invitation to a team member
//   static async sendInvitation(workspaceId: string, inviteData: InviteRequest): Promise<InviteResponse> {
//     try {
//       // Prepare data with duration converted to hours for temporary invites
//       const backendData = this.prepareInviteData(inviteData);
      
//       const response = await axiosInstance.post(
//         `/workspaces/${workspaceId}/invitations`,
//         backendData
//       );
//       return response.data.invitation || response.data;
//     } catch (error) {
//       console.error('Error sending invitation:', error);
//       throw error;
//     }
//   }

//   // Send multiple invitations
//   static async sendMultipleInvitations(
//     workspaceId: string, 
//     invites: InviteRequest[]
//   ): Promise<InviteResponse[]> {
//     try {
//       const promises = invites.map(invite => 
//         this.sendInvitation(workspaceId, invite)
//       );
//       return await Promise.all(promises);
//     } catch (error) {
//       console.error('Error sending multiple invitations:', error);
//       throw error;
//     }
//   }

//   // Get list of invitations for a workspace
//   static async getInvitations(workspaceId: string): Promise<InviteResponse[]> {
//     try {
//       const response = await axiosInstance.get(`/workspaces/${workspaceId}/invitations`);
//       return response.data.invitations || response.data;
//     } catch (error) {
//       console.error('Error fetching invitations:', error);
//       throw error;
//     }
//   }

//   // Accept an invitation using the updated endpoint
//   static async acceptInvitation(token: string): Promise<JoinResponse> {
//     try {
//       const response = await axiosInstance.post('/workspaces/join', { token });
//       return response.data;
//     } catch (error) {
//       console.error('Error accepting invitation:', error);
//       throw error;
//     }
//   }

//   // Helper method to extract token from URL (for accept invitation flow)
//   static extractTokenFromUrl(url?: string): string | null {
//     try {
//       const currentUrl = url || window.location.href;
//       const urlObj = new URL(currentUrl);
//       return urlObj.searchParams.get('token');
//     } catch (error) {
//       console.error('Error parsing URL for token:', error);
//       return null;
//     }
//   }

//   // Helper method to validate token format
//   static validateToken(token: string): boolean {
//     return !!(token && token.length > 0 && typeof token === 'string');
//   }

//   // Helper method to format duration for display
//   static formatDuration(duration?: string | number): string {
//     if (typeof duration === 'number') {
//       // Convert hours to readable format
//       if (duration >= 720) return `${Math.floor(duration / 720)} Month${Math.floor(duration / 720) > 1 ? 's' : ''}`;
//       if (duration >= 168) return `${Math.floor(duration / 168)} Week${Math.floor(duration / 168) > 1 ? 's' : ''}`;
//       if (duration >= 24) return `${Math.floor(duration / 24)} Day${Math.floor(duration / 24) > 1 ? 's' : ''}`;
//       return `${duration} Hour${duration > 1 ? 's' : ''}`;
//     }
    
//     switch (duration) {
//       case '1week': return '1 Week';
//       case '2weeks': return '2 Weeks';
//       case '1month': return '1 Month';
//       default: return 'Not specified';
//     }
//   }

//   // Helper method to get duration in hours (for display purposes)
//   static getDurationInHours(duration?: '1week' | '2weeks' | '1month'): number | null {
//     if (!duration) return null;
//     return this.convertDurationToHours(duration);
//   }

//   // Helper method to check if invitation is expired
//   static isInvitationExpired(invitation: InviteResponse): boolean {
//     if (!invitation.expiresAt) return false;
//     return new Date(invitation.expiresAt) < new Date();
//   }

//   // Helper method to check if temporary invitation is expired
//   static isTemporaryInvitationExpired(invitation: InviteResponse): boolean {
//     if (invitation.invitationType !== 'temporary' || !invitation.temporaryExpiresAt) return false;
//     return new Date(invitation.temporaryExpiresAt) < new Date();
//   }

//   // Helper method to get invitation type display name
//   static getInviteTypeDisplay(invitationType?: string): string {
//     switch (invitationType) {
//       case 'permanent': return 'Team Member';
//       case 'temporary': return 'Temporary Access';
//       default: return 'Team Member';
//     }
//   }

//   // Helper method to get remaining time for temporary invitations
//   static getRemainingTime(invitation: InviteResponse): string | null {
//     if (invitation.invitationType !== 'temporary') return null;
    
//     const now = new Date();
//     let expiresAt: Date;
    
//     // Use temporaryExpiresAt if available, otherwise fall back to expiresAt
//     if (invitation.temporaryExpiresAt) {
//       expiresAt = new Date(invitation.temporaryExpiresAt);
//     } else if (invitation.expiresAt) {
//       expiresAt = new Date(invitation.expiresAt);
//     } else {
//       return null;
//     }
    
//     const diff = expiresAt.getTime() - now.getTime();
    
//     if (diff <= 0) return 'Expired';
    
//     const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//     const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//     const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
//     if (days > 0) {
//       return `${days} day${days > 1 ? 's' : ''} remaining`;
//     } else if (hours > 0) {
//       return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
//     } else if (minutes > 0) {
//       return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
//     } else {
//       return 'Less than 1 minute remaining';
//     }
//   }

//   // Helper method to handle join invitation response and redirect logic
//   static handleJoinResponse(response: JoinResponse, router: any): void {
//     if (response.requiresAuth) {
//       // Store the current URL to redirect back after login
//       const currentUrl = window.location.href;
//       localStorage.setItem('redirectAfterLogin', '/dashboard/messaging');
      
//       // Redirect to login page
//       router.push('/login');
//     } else if (response.workspace) {
//       // Successfully joined, redirect to messaging dashboard
//       router.push('/dashboard/messaging');
//     }
//   }

//   // Helper method to convert duration string to hours for UI selection
//   static getHoursFromDurationString(duration: '1week' | '2weeks' | '1month'): number {
//     return this.convertDurationToHours(duration);
//   }

//   // Helper method to convert hours back to duration string for UI display
//   static getDurationStringFromHours(hours: number): '1week' | '2weeks' | '1month' | null {
//     switch (hours) {
//       case 168: return '1week';
//       case 336: return '2weeks';
//       case 720: return '1month';
//       default: return null;
//     }
//   }
// }


























// import axiosInstance from './axios';
// import config from "@/lib/config/messaging";

// export interface InviteRequest {
//   email: string;
//   message: string; // Changed from role to message
//   inviteType?: 'permanent' | 'temporary';
//   temporaryDuration?: '1week' | '2weeks' | '1month';
// }

// export interface InviteResponse {
//   id: string;
//   email: string;
//   invitationType: string; // Changed from role to invitationType
//   status: string;
//   token?: string;
//   temporaryDuration?: number; // Now a number (hours)
//   temporaryExpiresAt?: string; // New field for temporary invites
//   expiresAt?: string;
//   createdAt?: string;
//   updatedAt?: string;
// }

// export interface AcceptInviteRequest {
//   token: string;
// }

// export interface JoinResponse {
//   requiresAuth?: boolean;
//   email?: string;
//   message?: string;
//   workspace?: any;
// }

// export class InviteTeamService {
//   // Helper method to get auth headers with access token
//   private static getAuthHeaders(): Record<string, string> {
//     const accessToken = localStorage.getItem('access_token');
//     if (accessToken && accessToken.trim() !== '') {
//       return {
//         'Authorization': `Bearer ${accessToken.trim()}`,
//         'Content-Type': 'application/json'
//       };
//     }
//     return {
//       'Content-Type': 'application/json'
//     };
//   }

//   // Helper method to convert duration to hours
//   private static convertDurationToHours(duration: '1week' | '2weeks' | '1month'): number {
//     switch (duration) {
//       case '1week':
//         return 168; // 24 * 7 hours
//       case '2weeks':
//         return 336; // 24 * 14 hours
//       case '1month':
//         return 720; // 24 * 30 hours (assuming 30 days)
//       default:
//         return 168; // Default to 1 week
//     }
//   }

//   // Helper method to prepare invite data for backend
//   private static prepareInviteData(inviteData: InviteRequest): any {
//     const backendData: any = {
//       email: inviteData.email,
//       message: inviteData.message,
//     };

//     // For temporary invites, add invitationType and convert duration to hours
//     if (inviteData.inviteType === 'temporary') {
//       backendData.invitationType = 'temporary';
//       if (inviteData.temporaryDuration) {
//         backendData.temporaryDuration = this.convertDurationToHours(inviteData.temporaryDuration);
//       }
//     }
//     // For permanent invites, we don't send invitationType in the body (backend adds it automatically)

//     return backendData;
//   }

//   // Send invitation to a team member
//   static async sendInvitation(workspaceId: string, inviteData: InviteRequest): Promise<InviteResponse> {
//     try {
//       // Prepare data with duration converted to hours for temporary invites
//       const backendData = this.prepareInviteData(inviteData);
      
//       const response = await axiosInstance.post(
//         `/workspaces/${workspaceId}/invitations`,
//         backendData,
//         {
//           headers: this.getAuthHeaders()
//         }
//       );
//       return response.data.invitation || response.data;
//     } catch (error) {
//       console.error('Error sending invitation:', error);
//       throw error;
//     }
//   }

//   // Send multiple invitations
//   static async sendMultipleInvitations(
//     workspaceId: string, 
//     invites: InviteRequest[]
//   ): Promise<InviteResponse[]> {
//     try {
//       const promises = invites.map(invite => 
//         this.sendInvitation(workspaceId, invite)
//       );
//       return await Promise.all(promises);
//     } catch (error) {
//       console.error('Error sending multiple invitations:', error);
//       throw error;
//     }
//   }

//   // Get list of invitations for a workspace
//   static async getInvitations(workspaceId: string): Promise<InviteResponse[]> {
//     try {
//       const response = await axiosInstance.get(`/workspaces/${workspaceId}/invitations`, {
//         headers: this.getAuthHeaders()
//       });
//       return response.data.invitations || response.data;
//     } catch (error) {
//       console.error('Error fetching invitations:', error);
//       throw error;
//     }
//   }

//   // Accept an invitation using the updated endpoint with proper authentication
//   static async acceptInvitation(token: string): Promise<JoinResponse> {
//     try {
//       const accessToken = localStorage.getItem('access_token');
      
//       // If no access token, return requiresAuth immediately without making request
//       if (!accessToken || accessToken.trim() === '') {
//         console.log('No access token found, requiring authentication');
//         return {
//           requiresAuth: true,
//           message: 'Authentication required to accept invitation'
//         };
//       }

//       console.log('Making authenticated request to join workspace');
//       const response = await axiosInstance.post(
//         '/workspaces/join', 
//         { token },
//         {
//           headers: this.getAuthHeaders()
//         }
//       );
//       return response.data;
//     } catch (error: any) {
//       console.error('Error accepting invitation:', error);
      
//       // Handle 401 specifically
//       if (error.response?.status === 401) {
//         console.log('Received 401, clearing invalid token');
//         localStorage.removeItem('access_token'); // Clear invalid token
//         return {
//           requiresAuth: true,
//           message: 'Your session has expired. Please log in again.'
//         };
//       }
      
//       throw error;
//     }
//   }

//   // Alternative method for accepting invitation when user might not be authenticated
//   static async checkInvitation(token: string): Promise<JoinResponse> {
//     try {
//       const accessToken = localStorage.getItem('access_token');
      
//       // Try to get invitation details first (this might not require auth)
//       const response = await axiosInstance.get(`/workspaces/join/check?token=${token}`, {
//         headers: accessToken ? this.getAuthHeaders() : { 'Content-Type': 'application/json' }
//       });
      
//       return response.data;
//     } catch (error: any) {
//       console.error('Error checking invitation:', error);
      
//       // If endpoint doesn't exist, fall back to acceptInvitation
//       if (error.response?.status === 404) {
//         return this.acceptInvitation(token);
//       }
      
//       // Handle auth errors
//       if (error.response?.status === 401) {
//         return {
//           requiresAuth: true,
//           message: 'Please log in to view this invitation'
//         };
//       }
      
//       throw error;
//     }
//   }

//   // Helper method to extract token from URL (for accept invitation flow)
//   static extractTokenFromUrl(url?: string): string | null {
//     try {
//       const currentUrl = url || window.location.href;
//       const urlObj = new URL(currentUrl);
//       return urlObj.searchParams.get('token');
//     } catch (error) {
//       console.error('Error parsing URL for token:', error);
//       return null;
//     }
//   }

//   // Helper method to validate token format
//   static validateToken(token: string): boolean {
//     return !!(token && token.length > 0 && typeof token === 'string');
//   }

//   // Helper method to check if user is authenticated
//   static isAuthenticated(): boolean {
//     const accessToken = localStorage.getItem('access_token');
//     return !!accessToken;
//   }

//   // Helper method to format duration for display
//   static formatDuration(duration?: string | number): string {
//     if (typeof duration === 'number') {
//       // Convert hours to readable format
//       if (duration >= 720) return `${Math.floor(duration / 720)} Month${Math.floor(duration / 720) > 1 ? 's' : ''}`;
//       if (duration >= 168) return `${Math.floor(duration / 168)} Week${Math.floor(duration / 168) > 1 ? 's' : ''}`;
//       if (duration >= 24) return `${Math.floor(duration / 24)} Day${Math.floor(duration / 24) > 1 ? 's' : ''}`;
//       return `${duration} Hour${duration > 1 ? 's' : ''}`;
//     }
    
//     switch (duration) {
//       case '1week': return '1 Week';
//       case '2weeks': return '2 Weeks';
//       case '1month': return '1 Month';
//       default: return 'Not specified';
//     }
//   }

//   // Helper method to get duration in hours (for display purposes)
//   static getDurationInHours(duration?: '1week' | '2weeks' | '1month'): number | null {
//     if (!duration) return null;
//     return this.convertDurationToHours(duration);
//   }

//   // Helper method to check if invitation is expired
//   static isInvitationExpired(invitation: InviteResponse): boolean {
//     if (!invitation.expiresAt) return false;
//     return new Date(invitation.expiresAt) < new Date();
//   }

//   // Helper method to check if temporary invitation is expired
//   static isTemporaryInvitationExpired(invitation: InviteResponse): boolean {
//     if (invitation.invitationType !== 'temporary' || !invitation.temporaryExpiresAt) return false;
//     return new Date(invitation.temporaryExpiresAt) < new Date();
//   }

//   // Helper method to get invitation type display name
//   static getInviteTypeDisplay(invitationType?: string): string {
//     switch (invitationType) {
//       case 'permanent': return 'Team Member';
//       case 'temporary': return 'Temporary Access';
//       default: return 'Team Member';
//     }
//   }

//   // Helper method to get remaining time for temporary invitations
//   static getRemainingTime(invitation: InviteResponse): string | null {
//     if (invitation.invitationType !== 'temporary') return null;
    
//     const now = new Date();
//     let expiresAt: Date;
    
//     // Use temporaryExpiresAt if available, otherwise fall back to expiresAt
//     if (invitation.temporaryExpiresAt) {
//       expiresAt = new Date(invitation.temporaryExpiresAt);
//     } else if (invitation.expiresAt) {
//       expiresAt = new Date(invitation.expiresAt);
//     } else {
//       return null;
//     }
    
//     const diff = expiresAt.getTime() - now.getTime();
    
//     if (diff <= 0) return 'Expired';
    
//     const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//     const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//     const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
//     if (days > 0) {
//       return `${days} day${days > 1 ? 's' : ''} remaining`;
//     } else if (hours > 0) {
//       return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
//     } else if (minutes > 0) {
//       return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
//     } else {
//       return 'Less than 1 minute remaining';
//     }
//   }

//   // Helper method to handle join invitation response and redirect logic
//   static handleJoinResponse(response: JoinResponse, router: any): void {
//     if (response.requiresAuth) {
//       // Store the current URL to redirect back after login
//       const currentUrl = window.location.href;
//       localStorage.setItem('redirectAfterLogin', '/dashboard/messaging');
      
//       // Redirect to login page
//       router.push('/login');
//     } else if (response.workspace) {
//       // Successfully joined, redirect to messaging dashboard
//       router.push('/dashboard/messaging');
//     }
//   }

//   // Helper method to convert duration string to hours for UI selection
//   static getHoursFromDurationString(duration: '1week' | '2weeks' | '1month'): number {
//     return this.convertDurationToHours(duration);
//   }

//   // Helper method to convert hours back to duration string for UI display
//   static getDurationStringFromHours(hours: number): '1week' | '2weeks' | '1month' | null {
//     switch (hours) {
//       case 168: return '1week';
//       case 336: return '2weeks';
//       case 720: return '1month';
//       default: return null;
//     }
//   }
// }




































































// import axiosInstance from './axios';
// import config from "@/lib/config/messaging";

// export interface InviteRequest {
//   email: string;
//   message: string; // Changed from role to message
//   inviteType?: 'permanent' | 'temporary';
//   temporaryDuration?: '1week' | '2weeks' | '1month';
// }

// export interface InviteResponse {
//   id: string;
//   email: string;
//   invitationType: string; // Changed from role to invitationType
//   status: string;
//   token?: string;
//   temporaryDuration?: number; // Now a number (hours)
//   temporaryExpiresAt?: string; // New field for temporary invites
//   expiresAt?: string;
//   createdAt?: string;
//   updatedAt?: string;
// }

// export interface AcceptInviteRequest {
//   token: string;
// }

// export interface JoinResponse {
//   requiresAuth?: boolean;
//   email?: string;
//   message?: string;
//   workspace?: any;
// }

// export class InviteTeamService {
//   // Helper method to convert duration to hours
//   private static convertDurationToHours(duration: '1week' | '2weeks' | '1month'): number {
//     switch (duration) {
//       case '1week':
//         return 168; // 24 * 7 hours
//       case '2weeks':
//         return 336; // 24 * 14 hours
//       case '1month':
//         return 720; // 24 * 30 hours (assuming 30 days)
//       default:
//         return 168; // Default to 1 week
//     }
//   }

//   // Helper method to prepare invite data for backend
//   private static prepareInviteData(inviteData: InviteRequest): any {
//     const backendData: any = {
//       email: inviteData.email,
//       message: inviteData.message,
//     };

//     // For temporary invites, add invitationType and convert duration to hours
//     if (inviteData.inviteType === 'temporary') {
//       backendData.invitationType = 'temporary';
//       if (inviteData.temporaryDuration) {
//         backendData.temporaryDuration = this.convertDurationToHours(inviteData.temporaryDuration);
//       }
//     }
//     // For permanent invites, we don't send invitationType in the body (backend adds it automatically)

//     return backendData;
//   }

//   // Send invitation to a team member
//   static async sendInvitation(workspaceId: string, inviteData: InviteRequest): Promise<InviteResponse> {
//     try {
//       // Prepare data with duration converted to hours for temporary invites
//       const backendData = this.prepareInviteData(inviteData);
      
//       const response = await axiosInstance.post(
//         `https://messaging-a1v0.onrender.com/api/workspaces/${workspaceId}/invitations`,
//         backendData
//       );
//       return response.data.invitation || response.data;
//     } catch (error) {
//       console.error('Error sending invitation:', error);
//       throw error;
//     }
//   }

//   // Send multiple invitations
//   static async sendMultipleInvitations(
//     workspaceId: string, 
//     invites: InviteRequest[]
//   ): Promise<InviteResponse[]> {
//     try {
//       const promises = invites.map(invite => 
//         this.sendInvitation(workspaceId, invite)
//       );
//       return await Promise.all(promises);
//     } catch (error) {
//       console.error('Error sending multiple invitations:', error);
//       throw error;
//     }
//   }

//   // Get list of invitations for a workspace
//   static async getInvitations(workspaceId: string): Promise<InviteResponse[]> {
//     try {
//       const response = await axiosInstance.get(
//         `https://messaging-a1v0.onrender.com/api/workspaces/${workspaceId}/invitations`
//       );
//       return response.data.invitations || response.data;
//     } catch (error) {
//       console.error('Error fetching invitations:', error);
//       throw error;
//     }
//   }

//   // Accept an invitation using the updated endpoint
//   static async acceptInvitation(token: string): Promise<JoinResponse> {
//     try {
//       const response = await axiosInstance.post(
//         'https://messaging-a1v0.onrender.com/api/workspaces/join', 
//         { token }
//       );
//       return response.data;
//     } catch (error) {
//       console.error('Error accepting invitation:', error);
//       throw error;
//     }
//   }

//   // Helper method to extract token from URL (for accept invitation flow)
//   static extractTokenFromUrl(url?: string): string | null {
//     try {
//       const currentUrl = url || window.location.href;
//       const urlObj = new URL(currentUrl);
//       return urlObj.searchParams.get('token');
//     } catch (error) {
//       console.error('Error parsing URL for token:', error);
//       return null;
//     }
//   }

//   // Helper method to validate token format
//   static validateToken(token: string): boolean {
//     return !!(token && token.length > 0 && typeof token === 'string');
//   }

//   // Helper method to format duration for display
//   static formatDuration(duration?: string | number): string {
//     if (typeof duration === 'number') {
//       // Convert hours to readable format
//       if (duration >= 720) return `${Math.floor(duration / 720)} Month${Math.floor(duration / 720) > 1 ? 's' : ''}`;
//       if (duration >= 168) return `${Math.floor(duration / 168)} Week${Math.floor(duration / 168) > 1 ? 's' : ''}`;
//       if (duration >= 24) return `${Math.floor(duration / 24)} Day${Math.floor(duration / 24) > 1 ? 's' : ''}`;
//       return `${duration} Hour${duration > 1 ? 's' : ''}`;
//     }
    
//     switch (duration) {
//       case '1week': return '1 Week';
//       case '2weeks': return '2 Weeks';
//       case '1month': return '1 Month';
//       default: return 'Not specified';
//     }
//   }

//   // Helper method to get duration in hours (for display purposes)
//   static getDurationInHours(duration?: '1week' | '2weeks' | '1month'): number | null {
//     if (!duration) return null;
//     return this.convertDurationToHours(duration);
//   }

//   // Helper method to check if invitation is expired
//   static isInvitationExpired(invitation: InviteResponse): boolean {
//     if (!invitation.expiresAt) return false;
//     return new Date(invitation.expiresAt) < new Date();
//   }

//   // Helper method to check if temporary invitation is expired
//   static isTemporaryInvitationExpired(invitation: InviteResponse): boolean {
//     if (invitation.invitationType !== 'temporary' || !invitation.temporaryExpiresAt) return false;
//     return new Date(invitation.temporaryExpiresAt) < new Date();
//   }

//   // Helper method to get invitation type display name
//   static getInviteTypeDisplay(invitationType?: string): string {
//     switch (invitationType) {
//       case 'permanent': return 'Team Member';
//       case 'temporary': return 'Temporary Access';
//       default: return 'Team Member';
//     }
//   }

//   // Helper method to get remaining time for temporary invitations
//   static getRemainingTime(invitation: InviteResponse): string | null {
//     if (invitation.invitationType !== 'temporary') return null;
    
//     const now = new Date();
//     let expiresAt: Date;
    
//     // Use temporaryExpiresAt if available, otherwise fall back to expiresAt
//     if (invitation.temporaryExpiresAt) {
//       expiresAt = new Date(invitation.temporaryExpiresAt);
//     } else if (invitation.expiresAt) {
//       expiresAt = new Date(invitation.expiresAt);
//     } else {
//       return null;
//     }
    
//     const diff = expiresAt.getTime() - now.getTime();
    
//     if (diff <= 0) return 'Expired';
    
//     const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//     const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//     const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
//     if (days > 0) {
//       return `${days} day${days > 1 ? 's' : ''} remaining`;
//     } else if (hours > 0) {
//       return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
//     } else if (minutes > 0) {
//       return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
//     } else {
//       return 'Less than 1 minute remaining';
//     }
//   }

//   // Helper method to handle join invitation response and redirect logic
//   static handleJoinResponse(response: JoinResponse, router: any): void {
//     if (response.requiresAuth) {
//       // Store the current URL to redirect back after login
//       const currentUrl = window.location.href;
//       localStorage.setItem('redirectAfterLogin', '/dashboard/messaging');
      
//       // Redirect to login page
//       router.push('/login');
//     } else if (response.workspace) {
//       // Successfully joined, redirect to messaging dashboard
//       router.push('/dashboard/messaging');
//     }
//   }

//   // Helper method to convert duration string to hours for UI selection
//   static getHoursFromDurationString(duration: '1week' | '2weeks' | '1month'): number {
//     return this.convertDurationToHours(duration);
//   }

//   // Helper method to convert hours back to duration string for UI display
//   static getDurationStringFromHours(hours: number): '1week' | '2weeks' | '1month' | null {
//     switch (hours) {
//       case 168: return '1week';
//       case 336: return '2weeks';
//       case 720: return '1month';
//       default: return null;
//     }
//   }
// }
































































// 7/7/2025
// import axiosInstance from './axios';
// import config from "@/lib/config/messaging";

// export interface InviteRequest {
//   email: string;
//   role: 'admin' | 'member';
//   inviteType?: 'permanent' | 'temporary';
//   temporaryDuration?: '1week' | '2weeks' | '1month';
// }

// export interface InviteResponse {
//   id: string;
//   email: string;
//   role: string;
//   status: string;
//   token: string;
//   inviteType?: string;
//   temporaryDuration?: string;
//   expiresAt?: string;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface AcceptInviteRequest {
//   token: string;
// }

// export class InviteTeamService {
//   // Helper method to convert duration to hours
//   private static convertDurationToHours(duration: '1week' | '2weeks' | '1month'): number {
//     switch (duration) {
//       case '1week':
//         return 24 * 7; // 168 hours
//       case '2weeks':
//         return 24 * 14; // 336 hours
//       case '1month':
//         return 24 * 30; // 720 hours (assuming 30 days)
//       default:
//         return 24 * 7; // Default to 1 week
//     }
//   }

//   // Helper method to prepare invite data for backend
//   private static prepareInviteData(inviteData: InviteRequest): any {
//     const backendData: any = {
//       email: inviteData.email,
//       role: inviteData.role,
//     };

//     // Add invite type if specified
//     if (inviteData.inviteType) {
//       backendData.inviteType = inviteData.inviteType;
//     }

//     // Convert duration to hours if it's a temporary invite
//     if (inviteData.inviteType === 'temporary' && inviteData.temporaryDuration) {
//       backendData.temporaryDurationHours = this.convertDurationToHours(inviteData.temporaryDuration);
//       // Keep the original duration for reference (optional)
//       backendData.temporaryDurationDisplay = inviteData.temporaryDuration;
//     }

//     return backendData;
//   }

//   // Send invitation to a team member
//   static async sendInvitation(workspaceId: string, inviteData: InviteRequest): Promise<InviteResponse> {
//     try {
//       // Prepare data with duration converted to hours
//       const backendData = this.prepareInviteData(inviteData);
      
//       const response = await axiosInstance.post(
//         `/workspaces/${workspaceId}/invitations`,
//         backendData
//       );
//       return response.data.invitation || response.data;
//     } catch (error) {
//       console.error('Error sending invitation:', error);
//       throw error;
//     }
//   }

//   // Send multiple invitations
//   static async sendMultipleInvitations(
//     workspaceId: string, 
//     invites: InviteRequest[]
//   ): Promise<InviteResponse[]> {
//     try {
//       const promises = invites.map(invite => 
//         this.sendInvitation(workspaceId, invite)
//       );
//       return await Promise.all(promises);
//     } catch (error) {
//       console.error('Error sending multiple invitations:', error);
//       throw error;
//     }
//   }

//   // Get list of invitations for a workspace
//   static async getInvitations(workspaceId: string): Promise<InviteResponse[]> {
//     try {
//       const response = await axiosInstance.get(`/workspaces/${workspaceId}/invitations`);
//       return response.data.invitations || response.data;
//     } catch (error) {
//       console.error('Error fetching invitations:', error);
//       throw error;
//     }
//   }

//   // Accept an invitation using the correct endpoint
//   static async acceptInvitation(token: string): Promise<any> {
//     try {
//       const response = await axiosInstance.post('/workspaces/join', { token });
//       return response.data.workspace || response.data;
//     } catch (error) {
//       console.error('Error accepting invitation:', error);
//       throw error;
//     }
//   }

//   // Helper method to extract token from URL (for accept invitation flow)
//   static extractTokenFromUrl(url?: string): string | null {
//     try {
//       const currentUrl = url || window.location.href;
//       const urlObj = new URL(currentUrl);
//       return urlObj.searchParams.get('token');
//     } catch (error) {
//       console.error('Error parsing URL for token:', error);
//       return null;
//     }
//   }

//   // Helper method to validate token format (optional)
//   static validateToken(token: string): boolean {
//     return !!(token && token.length > 0 && typeof token === 'string');
//   }

//   // Helper method to format duration for display
//   static formatDuration(duration?: string): string {
//     switch (duration) {
//       case '1week': return '1 Week';
//       case '2weeks': return '2 Weeks';
//       case '1month': return '1 Month';
//       default: return 'Not specified';
//     }
//   }

//   // Helper method to get duration in hours (for display purposes)
//   static getDurationInHours(duration?: '1week' | '2weeks' | '1month'): number | null {
//     if (!duration) return null;
//     return this.convertDurationToHours(duration);
//   }

//   // Helper method to check if invitation is expired
//   static isInvitationExpired(invitation: InviteResponse): boolean {
//     if (!invitation.expiresAt) return false;
//     return new Date(invitation.expiresAt) < new Date();
//   }

//   // Helper method to get invitation type display name
//   static getInviteTypeDisplay(inviteType?: string): string {
//     switch (inviteType) {
//       case 'permanent': return 'Team Member';
//       case 'temporary': return 'Temporary Access';
//       default: return 'Team Member';
//     }
//   }

//   // Helper method to get remaining time for temporary invitations
//   static getRemainingTime(invitation: InviteResponse): string | null {
//     if (!invitation.expiresAt || invitation.inviteType !== 'temporary') return null;
    
//     const now = new Date();
//     const expiresAt = new Date(invitation.expiresAt);
//     const diff = expiresAt.getTime() - now.getTime();
    
//     if (diff <= 0) return 'Expired';
    
//     const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//     const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
//     if (days > 0) {
//       return `${days} day${days > 1 ? 's' : ''} remaining`;
//     } else if (hours > 0) {
//       return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
//     } else {
//       return 'Less than 1 hour remaining';
//     }
//   }
// }












































// import axiosInstance from './axios';
// import config from "@/lib/config/messaging";

// export interface InviteRequest {
//   email: string;
//   role: 'admin' | 'member';
//   inviteType?: 'teammate' | 'temporary';
//   temporaryDuration?: '1week' | '2weeks' | '1month';
// }

// export interface InviteResponse {
//   id: string;
//   email: string;
//   role: string;
//   status: string;
//   token: string;
//   inviteType?: string;
//   temporaryDuration?: string;
//   expiresAt?: string;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface AcceptInviteRequest {
//   token: string;
// }

// export class InviteTeamService {
//   // Send invitation to a team member
//   static async sendInvitation(workspaceId: string, inviteData: InviteRequest): Promise<InviteResponse> {
//     try {
//       const response = await axiosInstance.post(
//         `/workspaces/${workspaceId}/invitations`,
//         inviteData
//       );
//       return response.data.invitation || response.data;
//     } catch (error) {
//       console.error('Error sending invitation:', error);
//       throw error;
//     }
//   }

//   // Send multiple invitations
//   static async sendMultipleInvitations(
//     workspaceId: string, 
//     invites: InviteRequest[]
//   ): Promise<InviteResponse[]> {
//     try {
//       const promises = invites.map(invite => 
//         this.sendInvitation(workspaceId, invite)
//       );
//       return await Promise.all(promises);
//     } catch (error) {
//       console.error('Error sending multiple invitations:', error);
//       throw error;
//     }
//   }

//   // Get list of invitations for a workspace
//   static async getInvitations(workspaceId: string): Promise<InviteResponse[]> {
//     try {
//       const response = await axiosInstance.get(`/workspaces/${workspaceId}/invitations`);
//       return response.data.invitations || response.data;
//     } catch (error) {
//       console.error('Error fetching invitations:', error);
//       throw error;
//     }
//   }

//   // Accept an invitation using the correct endpoint
//   static async acceptInvitation(token: string): Promise<any> {
//     try {
//       const response = await axiosInstance.post('/workspaces/join', { token });
//       return response.data.workspace || response.data;
//     } catch (error) {
//       console.error('Error accepting invitation:', error);
//       throw error;
//     }
//   }

//   // Helper method to extract token from URL (for accept invitation flow)
//   static extractTokenFromUrl(url?: string): string | null {
//     try {
//       const currentUrl = url || window.location.href;
//       const urlObj = new URL(currentUrl);
//       return urlObj.searchParams.get('token');
//     } catch (error) {
//       console.error('Error parsing URL for token:', error);
//       return null;
//     }
//   }

//   // Helper method to validate token format (optional)
//   static validateToken(token: string): boolean {
//     return !!(token && token.length > 0 && typeof token === 'string');
//   }

//   // Helper method to format duration for display
//   static formatDuration(duration?: string): string {
//     switch (duration) {
//       case '1week': return '1 Week';
//       case '2weeks': return '2 Weeks';
//       case '1month': return '1 Month';
//       default: return 'Not specified';
//     }
//   }

//   // Helper method to check if invitation is expired
//   static isInvitationExpired(invitation: InviteResponse): boolean {
//     if (!invitation.expiresAt) return false;
//     return new Date(invitation.expiresAt) < new Date();
//   }

//   // Helper method to get invitation type display name
//   static getInviteTypeDisplay(inviteType?: string): string {
//     switch (inviteType) {
//       case 'teammate': return 'Team Member';
//       case 'temporary': return 'Temporary Access';
//       default: return 'Team Member';
//     }
//   }
// }



































// import axiosInstance from './axios';
// import config from "@/lib/config/messaging";

// export interface InviteRequest {
//   email: string;
//   role: 'admin' | 'member';
// }

// export interface InviteResponse {
//   id: string;
//   email: string;
//   role: string;
//   status: string;
//   token: string;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface AcceptInviteRequest {
//   token: string;
// }

// export class InviteTeamService {
//   // Send invitation to a team member
//   static async sendInvitation(workspaceId: string, inviteData: InviteRequest): Promise<InviteResponse> {
//     try {
//       const response = await axiosInstance.post(
//         `/workspaces/${workspaceId}/invitations`,
//         inviteData
//       );
//       return response.data.invitation || response.data;
//     } catch (error) {
//       console.error('Error sending invitation:', error);
//       throw error;
//     }
//   }

//   // Send multiple invitations
//   static async sendMultipleInvitations(
//     workspaceId: string, 
//     invites: InviteRequest[]
//   ): Promise<InviteResponse[]> {
//     try {
//       const promises = invites.map(invite => 
//         this.sendInvitation(workspaceId, invite)
//       );
//       return await Promise.all(promises);
//     } catch (error) {
//       console.error('Error sending multiple invitations:', error);
//       throw error;
//     }
//   }

//   // Get list of invitations for a workspace
//   static async getInvitations(workspaceId: string): Promise<InviteResponse[]> {
//     try {
//       const response = await axiosInstance.get(`/workspaces/${workspaceId}/invitations`);
//       return response.data.invitations || response.data;
//     } catch (error) {
//       console.error('Error fetching invitations:', error);
//       throw error;
//     }
//   }

//   // Accept an invitation using the new endpoint
//   static async acceptInvitation(token: string): Promise<any> {
//     try {
//       const response = await axiosInstance.post('/workspaces/join', { token });
//       return response.data.workspace || response.data;
//     } catch (error) {
//       console.error('Error accepting invitation:', error);
//       throw error;
//     }
//   }

//    // Helper method to extract token from URL (for accept invitation flow)
//   static extractTokenFromUrl(url?: string): string | null {
//     try {
//       const currentUrl = url || window.location.href;
//       const urlObj = new URL(currentUrl);
//       return urlObj.searchParams.get('token');
//     } catch (error) {
//       console.error('Error parsing URL for token:', error);
//       return null;
//     }
//   }

//   // Helper method to validate token format (optional)
//   static validateToken(token: string): boolean {
//     return !!(token && token.length > 0 && typeof token === 'string');
//   }

// }










































// import axiosInstance from './axios';
// import config from "@/lib/config/messaging";

// export interface InviteRequest {
//   email: string;
//   role: 'admin' | 'member';
// }

// export interface InviteResponse {
//   id: string;
//   email: string;
//   role: string;
//   status: string;
//   token: string;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface AcceptInviteRequest {
//   token: string;
// }

// export class InviteTeamService {
//   // Send invitation to a team member
//   static async sendInvitation(workspaceId: string, inviteData: InviteRequest): Promise<InviteResponse> {
//     try {
//       const response = await axiosInstance.post(
//         `/workspaces/${workspaceId}/invitations`,
//         inviteData
//       );
//       return response.data.invitation || response.data;
//     } catch (error) {
//       console.error('Error sending invitation:', error);
//       throw error;
//     }
//   }

//   // Send multiple invitations
//   static async sendMultipleInvitations(
//     workspaceId: string, 
//     invites: InviteRequest[]
//   ): Promise<InviteResponse[]> {
//     try {
//       const promises = invites.map(invite => 
//         this.sendInvitation(workspaceId, invite)
//       );
//       return await Promise.all(promises);
//     } catch (error) {
//       console.error('Error sending multiple invitations:', error);
//       throw error;
//     }
//   }

//   // Get list of invitations for a workspace
//   static async getInvitations(workspaceId: string): Promise<InviteResponse[]> {
//     try {
//       const response = await axiosInstance.get(`/workspaces/${workspaceId}/invitations`);
//       return response.data.invitations || response.data;
//     } catch (error) {
//       console.error('Error fetching invitations:', error);
//       throw error;
//     }
//   }

//   // Accept an invitation
//   static async acceptInvitation(token: string): Promise<any> {
//     try {
//       const response = await axiosInstance.post('/workspaces/join', { token });
//       return response.data.workspace || response.data;
//     } catch (error) {
//       console.error('Error accepting invitation:', error);
//       throw error;
//     }
//   }

//   // Helper method to extract token from URL (for accept invitation flow)
//   static extractTokenFromUrl(url?: string): string | null {
//     const currentUrl = url || window.location.href;
//     const urlParams = new URLSearchParams(new URL(currentUrl).search);
//     return urlParams.get('token');
//   }
// }