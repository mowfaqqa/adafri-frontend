// Chat interface
export interface WhatsAppChat {
  id: string;
  name: string;
  isGroup: boolean;
  timestamp: number;
  unreadCount: number;
  lastMessage?: string;
  participants?: string[];
  profilePicture?: string;
  pinned?: boolean;
}

// Chat list response
export interface WhatsAppChatsResponse {
  success: boolean;
  chats: WhatsAppChat[];
}

// Chat search response
export interface WhatsAppChatSearchResponse {
  success: boolean;
  results: WhatsAppChat[];
}