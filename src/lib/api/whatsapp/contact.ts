import ApiClient from "./client";
import {
  WhatsAppContactResponse,
  WhatsAppContactSearchResponse,
} from "../../types/whatsapp/";

// Contact API client
class ContactApi extends ApiClient {
  constructor() {
    // Set base path for WhatsApp contact endpoints
    super("/whatsapp");
  }

  // Get contact details
  async getContact(contactId: string): Promise<WhatsAppContactResponse> {
    return this.get<WhatsAppContactResponse>(`/contacts/${contactId}`);
  }

  // Search contacts
  async searchContacts(query: string): Promise<WhatsAppContactSearchResponse> {
    return this.get<WhatsAppContactSearchResponse>("/contacts/search", {
      query,
    });
  }
}

// Export singleton instance
const Contact = new ContactApi();
export default Contact;
