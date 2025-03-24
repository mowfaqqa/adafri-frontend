export interface Channel {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  createdBy: {
    id: string;
    username: string;
    fullName: string;
    avatar?: string;
  };
  members: {
    id: string;
    username: string;
    fullName: string;
    avatar?: string;
    lastSeen: Date;
  }[];
  admins: {
    id: string;
    username: string;
    fullName: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
  unreadCount?: number;
}

export interface DirectMessageChannel {
  id: string;
  otherUser: {
    id: string;
    username: string;
    fullName: string;
    avatar?: string;
    lastSeen: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  unreadCount?: number;
}

export interface ChannelCreateData {
  name: string;
  description?: string;
  isPrivate?: boolean;
  members?: string[];
}

export interface ChannelUpdateData {
  name?: string;
  description?: string;
  isPrivate?: boolean;
}

export interface ChannelMemberData {
  userId: string;
}