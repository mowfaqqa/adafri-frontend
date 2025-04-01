export interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    username: string;
    fullName: string;
    avatar?: string;
  };
  channelId?: string;
  directMessageId?: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  isDeleted?: boolean;
  attachments?: Attachment[];
  reactions?: Reaction[];
  hasThread?: boolean;
  threadCount?: number;
}

export interface Attachment {
  id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  url: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: {
    id: string;
    username: string;
    fullName: string;
  }[];
}

export interface Thread {
  parentMessage: Message;
  messages: Message[];
  participants: {
    id: string;
    username: string;
    fullName: string;
    avatar?: string;
  }[];
}

export interface MessageCreateData {
  content: string;
  channelId?: string;
  directMessageId?: string;
  parentId?: string;
  attachments?: File[];
}

export interface MessageUpdateData {
  content: string;
}

export interface ReactionData {
  emoji: string;
}

export interface TypingIndicator {
  userId: string;
  username: string;
  channelId?: string;
  dmId?: string;
}