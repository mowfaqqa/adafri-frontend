import { User } from "./auth";

/**
 * Message model
 */
export interface Message {
  id: string;
  content: string;
  channelId?: string;
  directMessageId?: string;
  workspaceId: string;
  parentId?: string;
  sender: User;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  isDeleted: boolean;
  reactions?: MessageReaction[];
  attachments?: Attachment[];
  hasThread?: boolean;
  threadCount?: number;
}

/**
 * Message creation data
 */
export interface MessageCreateData {
  content: string;
  channelId?: string;
  directMessageId?: string;
  workspaceId: string;
  parentId?: string;
  attachments?: File[];
}

/**
 * Message update data
 */
export interface MessageUpdateData {
  content: string;
}

/**
 * Message reaction
 */
export interface MessageReaction {
  emoji: string;
  count: number;
  users: {
    id: string;
    username: string;
  }[];
}

/**
 * Message attachment
 */
export interface Attachment {
  id: string;
  url: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  createdAt: Date;
}

/**
 * Reaction data
 */
export interface ReactionData {
  emoji: string;
}

/**
 * Thread data
 */
export interface Thread {
  parentMessage: Message;
  messages: Message[];
  participants: User[];
}

/**
 * Typing indicator
 */
export interface TypingIndicator {
  userId: string;
  username: string;
  channelId?: string;
  dmId?: string;
  workspaceId: string;
}