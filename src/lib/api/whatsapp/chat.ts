import ApiClient from "./client";
import {
  WhatsAppChatsResponse,
  WhatsAppMessagesResponse,
  WhatsAppChatSearchResponse,
} from "../../types/whatsapp/";

// Chat API client
class ChatApi extends ApiClient {
  constructor() {
    // Set base path for WhatsApp chat endpoints
    super("/whatsapp");
  }

  // Get all chats
  async getChats(): Promise<WhatsAppChatsResponse> {
    return this.get<WhatsAppChatsResponse>("/chats");
  }

  // Get chat messages
  async getChatMessages(
    chatId: string,
    limit?: number
  ): Promise<WhatsAppMessagesResponse> {
    return this.get<WhatsAppMessagesResponse>(`/chats/${chatId}/messages`, {
      limit,
    });
  }

  // Search chats
  async searchChats(query: string): Promise<WhatsAppChatSearchResponse> {
    return this.get<WhatsAppChatSearchResponse>("/chats/search", { query });
  }
}

// Export singleton instance
const Chat = new ChatApi();
export default Chat
