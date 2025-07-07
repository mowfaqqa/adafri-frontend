import axiosInstance from './axios';
import config from "@/lib/config/messaging";

export interface InviteRequest {
  email: string;
  message: string; // Changed from role to message
  inviteType?: 'permanent' | 'temporary';
  temporaryDuration?: '1week' | '2weeks' | '1month';
}

export interface InviteResponse {
  id: string;
  email: string;
  invitationType: string; // Changed from role to invitationType
  status: string;
  token?: string;
  temporaryDuration?: number; // Now a number (hours)
  temporaryExpiresAt?: string; // New field for temporary invites
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AcceptInviteRequest {
  token: string;
}

export interface JoinResponse {
  requiresAuth?: boolean;
  email?: string;
  message?: string;
  workspace?: any;
}

export class InviteTeamService {
  // Helper method to convert duration to hours
  private static convertDurationToHours(duration: '1week' | '2weeks' | '1month'): number {
    switch (duration) {
      case '1week':
        return 168; // 24 * 7 hours
      case '2weeks':
        return 336; // 24 * 14 hours
      case '1month':
        return 720; // 24 * 30 hours (assuming 30 days)
      default:
        return 168; // Default to 1 week
    }
  }

  // Helper method to prepare invite data for backend
  private static prepareInviteData(inviteData: InviteRequest): any {
    const backendData: any = {
      email: inviteData.email,
      message: inviteData.message,
    };

    // For temporary invites, add invitationType and convert duration to hours
    if (inviteData.inviteType === 'temporary') {
      backendData.invitationType = 'temporary';
      if (inviteData.temporaryDuration) {
        backendData.temporaryDuration = this.convertDurationToHours(inviteData.temporaryDuration);
      }
    }
    // For permanent invites, we don't send invitationType in the body (backend adds it automatically)

    return backendData;
  }

  // Send invitation to a team member
  static async sendInvitation(workspaceId: string, inviteData: InviteRequest): Promise<InviteResponse> {
    try {
      // Prepare data with duration converted to hours for temporary invites
      const backendData = this.prepareInviteData(inviteData);
      
      const response = await axiosInstance.post(
        `/workspaces/${workspaceId}/invitations`,
        backendData
      );
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

  // Accept an invitation using the updated endpoint
  static async acceptInvitation(token: string): Promise<JoinResponse> {
    try {
      const response = await axiosInstance.post('/workspaces/join', { token });
      return response.data;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  // Helper method to extract token from URL (for accept invitation flow)
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

  // Helper method to format duration for display
  static formatDuration(duration?: string | number): string {
    if (typeof duration === 'number') {
      // Convert hours to readable format
      if (duration >= 720) return `${Math.floor(duration / 720)} Month${Math.floor(duration / 720) > 1 ? 's' : ''}`;
      if (duration >= 168) return `${Math.floor(duration / 168)} Week${Math.floor(duration / 168) > 1 ? 's' : ''}`;
      if (duration >= 24) return `${Math.floor(duration / 24)} Day${Math.floor(duration / 24) > 1 ? 's' : ''}`;
      return `${duration} Hour${duration > 1 ? 's' : ''}`;
    }
    
    switch (duration) {
      case '1week': return '1 Week';
      case '2weeks': return '2 Weeks';
      case '1month': return '1 Month';
      default: return 'Not specified';
    }
  }

  // Helper method to get duration in hours (for display purposes)
  static getDurationInHours(duration?: '1week' | '2weeks' | '1month'): number | null {
    if (!duration) return null;
    return this.convertDurationToHours(duration);
  }

  // Helper method to check if invitation is expired
  static isInvitationExpired(invitation: InviteResponse): boolean {
    if (!invitation.expiresAt) return false;
    return new Date(invitation.expiresAt) < new Date();
  }

  // Helper method to check if temporary invitation is expired
  static isTemporaryInvitationExpired(invitation: InviteResponse): boolean {
    if (invitation.invitationType !== 'temporary' || !invitation.temporaryExpiresAt) return false;
    return new Date(invitation.temporaryExpiresAt) < new Date();
  }

  // Helper method to get invitation type display name
  static getInviteTypeDisplay(invitationType?: string): string {
    switch (invitationType) {
      case 'permanent': return 'Team Member';
      case 'temporary': return 'Temporary Access';
      default: return 'Team Member';
    }
  }

  // Helper method to get remaining time for temporary invitations
  static getRemainingTime(invitation: InviteResponse): string | null {
    if (invitation.invitationType !== 'temporary') return null;
    
    const now = new Date();
    let expiresAt: Date;
    
    // Use temporaryExpiresAt if available, otherwise fall back to expiresAt
    if (invitation.temporaryExpiresAt) {
      expiresAt = new Date(invitation.temporaryExpiresAt);
    } else if (invitation.expiresAt) {
      expiresAt = new Date(invitation.expiresAt);
    } else {
      return null;
    }
    
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
    } else {
      return 'Less than 1 minute remaining';
    }
  }

  // Helper method to handle join invitation response and redirect logic
  static handleJoinResponse(response: JoinResponse, router: any): void {
    if (response.requiresAuth) {
      // Store the current URL to redirect back after login
      const currentUrl = window.location.href;
      localStorage.setItem('redirectAfterLogin', '/dashboard/messaging');
      
      // Redirect to login page
      router.push('/login');
    } else if (response.workspace) {
      // Successfully joined, redirect to messaging dashboard
      router.push('/dashboard/messaging');
    }
  }

  // Helper method to convert duration string to hours for UI selection
  static getHoursFromDurationString(duration: '1week' | '2weeks' | '1month'): number {
    return this.convertDurationToHours(duration);
  }

  // Helper method to convert hours back to duration string for UI display
  static getDurationStringFromHours(hours: number): '1week' | '2weeks' | '1month' | null {
    switch (hours) {
      case 168: return '1week';
      case 336: return '2weeks';
      case 720: return '1month';
      default: return null;
    }
  }
}

































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