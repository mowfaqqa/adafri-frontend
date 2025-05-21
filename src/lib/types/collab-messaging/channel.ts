import { User } from "./auth";
import { Workspace } from "./workspace";

/**
 * Channel model
 */
export interface Channel {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isArchived?: boolean;
  unreadCount?: number;
  lastActivity?: Date;
  members?: ChannelMember[];
  workspace?: Workspace;
}

/**
 * Channel creation data
 */
export interface ChannelCreateData {
  name: string;
  description?: string;
  isPrivate: boolean;
  workspaceId: string;
}

/**
 * Channel update data
 */
export interface ChannelUpdateData {
  name?: string;
  description?: string;
  isPrivate?: boolean;
  isArchived?: boolean;
}

/**
 * Channel member with role
 */
export interface ChannelMember {
  id: string;
  userId: string;
  channelId: string;
  role: 'admin' | 'member';
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

/**
 * Channel member data for adding/updating members
 */
export interface ChannelMemberData {
  userId: string;
  role?: 'admin' | 'member';
}

/**
 * Direct Message Channel
 */
export interface DirectMessageChannel {
  id: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
  participants: User[];
  otherUser?: User;
  unreadCount?: number;
  lastMessage?: {
    content: string;
    createdAt: Date;
    senderId: string;
  };
}