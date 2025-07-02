import axiosInstance from './axios';
import config from "@/lib/config/messaging";

export interface InviteRequest {
  email: string;
  role: 'admin' | 'member';
}

export interface InviteResponse {
  id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  createdAt: string;
  updatedAt: string;
}

export interface AcceptInviteRequest {
  token: string;
}

export class InviteTeamService {
  // Send invitation to a team member
  static async sendInvitation(workspaceId: string, inviteData: InviteRequest): Promise<InviteResponse> {
    try {
      const response = await axiosInstance.post(
        `/workspaces/${workspaceId}/invitations`,
        inviteData
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

  // Accept an invitation
  static async acceptInvitation(token: string): Promise<any> {
    try {
      const response = await axiosInstance.post('/workspaces/join', { token });
      return response.data.workspace || response.data;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  // Helper method to extract token from URL (for accept invitation flow)
  static extractTokenFromUrl(url?: string): string | null {
    const currentUrl = url || window.location.href;
    const urlParams = new URLSearchParams(new URL(currentUrl).search);
    return urlParams.get('token');
  }
}