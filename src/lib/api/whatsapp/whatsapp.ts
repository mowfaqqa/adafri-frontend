import ApiClient from "./client";
import {
  WhatsAppStatusResponse,
  WhatsAppQRResponse,
  WhatsAppSendMessageRequest,
  WhatsAppSendMessageResponse,
  WhatsAppProfileResponse,
  WhatsAppSendBulkMessageRequest,
  WhatsAppSendBulkMessageResponse,
  WhatsAppMessageSearchResponse,
  WhatsAppMessagesResponse,
} from "../../types/whatsapp/";

// WhatsApp API client
class WhatsAppApi extends ApiClient {
  constructor() {
    // Set base path for WhatsApp endpoints
    super("/whatsapp");
  }

  // Initialize WhatsApp client
  async initClient(): Promise<WhatsAppStatusResponse> {
    return this.post<WhatsAppStatusResponse>("/init");
  }

  // Get WhatsApp client status
  async getStatus(): Promise<WhatsAppStatusResponse> {
    return this.get<WhatsAppStatusResponse>("/status");
  }

  // Get QR code for authentication
  async getQRCode(): Promise<WhatsAppQRResponse> {
    return this.get<WhatsAppQRResponse>("/qr");
  }

  // Logout/Disconnect WhatsApp client
  async logout(): Promise<{ success: boolean; message: string }> {
    return this.post<{ success: boolean; message: string }>("/logout");
  }
  async getChatMessages(
    chatId: string,
    limit?: number
  ): Promise<WhatsAppMessagesResponse> {
    return this.get<WhatsAppMessagesResponse>(`/chats/${chatId}/messages`, {
      limit,
    });
  }
  // Check if WhatsApp is connected
  async isConnected(): Promise<{ success: boolean; isConnected: boolean }> {
    return this.get<{ success: boolean; isConnected: boolean }>(
      "/is-connected"
    );
  }

  // Get WhatsApp profile info
  async getProfile(): Promise<WhatsAppProfileResponse> {
    return this.get<WhatsAppProfileResponse>("/profile");
  }

  // Send text message
  async sendTextMessage(
    data: WhatsAppSendMessageRequest
  ): Promise<WhatsAppSendMessageResponse> {
    return this.post<WhatsAppSendMessageResponse>("/send", data);
  }

  // Send media message
  async sendMediaMessage(
    chatId: string,
    media: File,
    caption?: string
  ): Promise<WhatsAppSendMessageResponse> {
    return this.uploadFile<WhatsAppSendMessageResponse>(
      "/send-media",
      media,
      "media",
      { chatId, caption }
    );
  }

  // Send bulk messages
  async sendBulkMessages(
    data: WhatsAppSendBulkMessageRequest
  ): Promise<WhatsAppSendBulkMessageResponse> {
    return this.post<WhatsAppSendBulkMessageResponse>("/send-bulk", data);
  }

  // Search messages
  async searchMessages(
    query: string,
    chatId?: string
  ): Promise<WhatsAppMessageSearchResponse> {
    return this.get<WhatsAppMessageSearchResponse>("/messages/search", {
      query,
      chatId,
    });
  }
}

// Export singleton instance
const WhatsApp = new WhatsAppApi();
export default WhatsApp;
