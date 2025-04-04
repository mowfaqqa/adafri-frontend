// Contact interface
export interface WhatsAppContact {
  id: string;
  name: string;
  number?: string;
  pushname?: string;
  isBusiness: boolean;
  isGroup: boolean;
  isMyContact: boolean;
  profilePicture?: string;
}

// Contact response
export interface WhatsAppContactResponse {
  success: boolean;
  contact: WhatsAppContact;
}

// Contacts list response
export interface WhatsAppContactsResponse {
  success: boolean;
  contacts: WhatsAppContact[];
}

// Contact search response
export interface WhatsAppContactSearchResponse {
  success: boolean;
  results: WhatsAppContact[];
}