import { User } from "./auth";

/**
 * Workspace model
 */
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  isDefault?: boolean;
  members?: WorkspaceMember[];
}

/**
 * Workspace creation data
 */
export interface WorkspaceCreateData {
  name: string;
  description?: string;
  logo?: string;
}

/**
 * Workspace member with role
 */
export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: 'owner' | 'admin' | 'member';
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

/**
 * Workspace invitation
 */
export interface WorkspaceInvitation {
  id: string;
  email: string;
  role: 'admin' | 'member';
  workspaceId: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  workspace?: Workspace;
}

/**
 * Workspace settings
 */
export interface WorkspaceSettings {
  id: string;
  workspaceId: string;
  allowGuestUsers: boolean;
  allowUserInvitations: boolean;
  allowFileSharing: boolean;
  maxFileSize: number;
  createdAt: Date;
  updatedAt: Date;
}