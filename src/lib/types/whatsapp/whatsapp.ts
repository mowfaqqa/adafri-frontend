/* eslint-disable @typescript-eslint/no-explicit-any */
// WhatsApp client status enum
export enum WhatsAppClientStatus {
  NOT_INITIALIZED = "NOT_INITIALIZED",
  INITIALIZING = "INITIALIZING",
  QR_READY = "QR_READY",
  AUTHENTICATED = "AUTHENTICATED",
  CONNECTED = "CONNECTED",
  AUTH_FAILURE = "AUTH_FAILURE",
  DISCONNECTED = "DISCONNECTED",
  ALREADY_CONNECTED = "ALREADY_CONNECTED",
}

// WhatsApp message type enum
export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  AUDIO = "audio",
  DOCUMENT = "document",
  LOCATION = "location",
  CONTACT = "contact",
  OTHER = "other",
}

// WhatsApp client status response
export interface WhatsAppStatusResponse {
  success: boolean;
  status: WhatsAppClientStatus;
  qrCode?: string;
}

// WhatsApp QR code response
export interface WhatsAppQRResponse {
  success: boolean;
  qrCode: string;
}

// WhatsApp profile info
export interface WhatsAppProfile {
  id: string;
  name: string;
  number?: string;
  about?: string;
  status?: string;
  profilePicture?: string;
  connected: boolean;
}

// WhatsApp profile response
export interface WhatsAppProfileResponse {
  success: boolean;
  profile: WhatsAppProfile;
}

// WhatsApp message interface
export interface WhatsAppMessage {
  id: string;
  body: string;
  type: MessageType;
  timestamp: number;
  from: string;
  to: string;
  author?: string;
  isForwarded: boolean;
  isStatus: boolean;
  isGroup: boolean;
  isFromMe: boolean;
  hasMedia: boolean;
  hasQuotedMsg: boolean;
  chatId?: string;
  quotedMsg?: WhatsAppMessage;
  media?: {
    mimetype: string;
    data: string;
    filename?: string;
  };
}

// WhatsApp messages response
export interface WhatsAppMessagesResponse {
  success: boolean;
  messages: WhatsAppMessage[];
}

// WhatsApp message search response
export interface WhatsAppMessageSearchResponse {
  success: boolean;
  results: WhatsAppMessage[];
}

// WhatsApp send message request
export interface WhatsAppSendMessageRequest {
  chatId: string;
  message: string;
}

// WhatsApp send message response
export interface WhatsAppSendMessageResponse {
  success: boolean;
  messageId: string;
}

// WhatsApp send bulk message request
export interface WhatsAppSendBulkMessageRequest {
  chatIds: string[];
  message: string;
}

// WhatsApp send bulk message result
export interface WhatsAppSendBulkMessageResult {
  chatId: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

// WhatsApp send bulk message response
export interface WhatsAppSendBulkMessageResponse {
  success: boolean;
  totalSent: number;
  totalFailed: number;
  results: WhatsAppSendBulkMessageResult[];
  errors: WhatsAppSendBulkMessageResult[];
}

// Socket.io WhatsApp events
export enum WhatsAppSocketEvent {
  WHATSAPP_QR = "whatsapp-qr",
  WHATSAPP_AUTHENTICATED = "whatsapp-authenticated",
  WHATSAPP_AUTH_FAILURE = "whatsapp-auth-failure",
  WHATSAPP_READY = "whatsapp-ready",
  WHATSAPP_MESSAGE = "whatsapp-message",
  WHATSAPP_DISCONNECTED = "whatsapp-disconnected",
}

// Socket.io WhatsApp event data types
export interface WhatsAppSocketEventData {
  [WhatsAppSocketEvent.WHATSAPP_QR]: { qrCode: string };
  [WhatsAppSocketEvent.WHATSAPP_AUTHENTICATED]: undefined;
  [WhatsAppSocketEvent.WHATSAPP_AUTH_FAILURE]: { error: string };
  [WhatsAppSocketEvent.WHATSAPP_READY]: { info: any };
  [WhatsAppSocketEvent.WHATSAPP_MESSAGE]: WhatsAppMessage;
  [WhatsAppSocketEvent.WHATSAPP_DISCONNECTED]: { reason: string };
}
