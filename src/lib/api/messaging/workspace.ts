import axiosInstance from "./axios";
import {
  Workspace,
  WorkspaceCreateData,
  WorkspaceMember,
  WorkspaceInvitation,
} from "@/lib/types/collab-messaging/workspace";

/**
 * Get all workspaces for current user
 */
export const getWorkspaces = async (): Promise<Workspace[]> => {
  try {
    const response = await axiosInstance.get<{ workspaces: Workspace[] }>("/workspaces");
    return response.data.workspaces;
  } catch (error) {
    console.error("Get workspaces error:", error);
    throw error;
  }
};

/**
 * Get a workspace by ID
 */
export const getWorkspaceById = async (workspaceId: string): Promise<Workspace> => {
  try {
    const response = await axiosInstance.get<{ workspace: Workspace }>(`/workspaces/${workspaceId}`);
    return response.data.workspace;
  } catch (error) {
    console.error("Get workspace error:", error);
    throw error;
  }
};

/**
 * Create a new workspace
 */
export const createWorkspace = async (workspaceData: WorkspaceCreateData): Promise<Workspace> => {
  try {
    const response = await axiosInstance.post<{ workspace: Workspace }>("/workspaces", workspaceData);
    return response.data.workspace;
  } catch (error) {
    console.error("Create workspace error:", error);
    throw error;
  }
};

/**
 * Update a workspace
 */
export const updateWorkspace = async (
  workspaceId: string,
  workspaceData: Partial<WorkspaceCreateData>
): Promise<Workspace> => {
  try {
    const response = await axiosInstance.put<{ workspace: Workspace }>(
      `/workspaces/${workspaceId}`,
      workspaceData
    );
    return response.data.workspace;
  } catch (error) {
    console.error("Update workspace error:", error);
    throw error;
  }
};

/**
 * Update workspace logo
 */
export const updateWorkspaceLogo = async (workspaceId: string, file: File): Promise<{ logo: string }> => {
  try {
    const formData = new FormData();
    formData.append("logo", file);

    const response = await axiosInstance.put<{ logo: string }>(
      `/workspaces/${workspaceId}/logo`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Update workspace logo error:", error);
    throw error;
  }
};

/**
 * Get workspace members
 */
export const getWorkspaceMembers = async (workspaceId: string): Promise<WorkspaceMember[]> => {
  try {
    const response = await axiosInstance.get<{ members: WorkspaceMember[] }>(
      `/workspaces/${workspaceId}/members`
    );
    return response.data.members;
  } catch (error) {
    console.error("Get workspace members error:", error);
    throw error;
  }
};

/**
 * Update member role
 */
export const updateMemberRole = async (
  workspaceId: string,
  userId: string,
  role: 'owner' | 'admin' | 'member'
): Promise<WorkspaceMember> => {
  try {
    const response = await axiosInstance.put<{ member: WorkspaceMember }>(
      `/workspaces/${workspaceId}/members/${userId}`,
      { role }
    );
    return response.data.member;
  } catch (error) {
    console.error("Update member role error:", error);
    throw error;
  }
};

/**
 * Remove member from workspace
 */
export const removeMember = async (workspaceId: string, userId: string): Promise<{ message: string }> => {
  try {
    const response = await axiosInstance.delete<{ message: string }>(
      `/workspaces/${workspaceId}/members/${userId}`
    );
    return response.data;
  } catch (error) {
    console.error("Remove member error:", error);
    throw error;
  }
};

/**
 * Create workspace invitation
 */
export const inviteToWorkspace = async (
  workspaceId: string,
  email: string,
  role: 'admin' | 'member' = 'member'
): Promise<WorkspaceInvitation> => {
  try {
    const response = await axiosInstance.post<{ invitation: WorkspaceInvitation }>(
      `/workspaces/${workspaceId}/invitations`,
      { email, role }
    );
    return response.data.invitation;
  } catch (error) {
    console.error("Invite to workspace error:", error);
    throw error;
  }
};

/**
 * Get workspace invitations
 */
export const getWorkspaceInvitations = async (workspaceId: string): Promise<WorkspaceInvitation[]> => {
  try {
    const response = await axiosInstance.get<{ invitations: WorkspaceInvitation[] }>(
      `/workspaces/${workspaceId}/invitations`
    );
    return response.data.invitations;
  } catch (error) {
    console.error("Get workspace invitations error:", error);
    throw error;
  }
};

/**
 * Cancel invitation
 */
export const cancelInvitation = async (
  workspaceId: string,
  invitationId: string
): Promise<{ message: string }> => {
  try {
    const response = await axiosInstance.delete<{ message: string }>(
      `/workspaces/${workspaceId}/invitations/${invitationId}`
    );
    return response.data;
  } catch (error) {
    console.error("Cancel invitation error:", error);
    throw error;
  }
};

/**
 * Accept workspace invitation
 */
export const acceptInvitation = async (token: string): Promise<Workspace> => {
  try {
    const response = await axiosInstance.post<{ workspace: Workspace }>(
      `/workspaces/join`,
      { token }
    );
    return response.data.workspace;
  } catch (error) {
    console.error("Accept invitation error:", error);
    throw error;
  }
};