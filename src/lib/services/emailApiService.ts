import axios, { AxiosResponse } from 'axios';
import { Email, EmailCategory } from '@/lib/types/email';
import { getSelectedLinkedEmailId, getSelectedLinkedEmailType, getSelectedLinkedEmail } from '@/lib/utils/cookies';
import { DjombiProfileService } from '@/lib/services/DjombiProfileService';

// Email API Response interfaces
interface EmailListResponse {
  success?: boolean;
  message?: string;
  count?: number;
  data?: any[];
  emails?: any[];
  sent?: any[];
  inbox?: any[];
  drafts?: any[];
  spam?: any[];
  [key: string]: any;
}

interface SendEmailRequest {
  to: string;
  subject: string;
  content: string;
  email_id: string;
}

interface CreateDraftRequest {
  to: string;
  subject: string;
  content: string;
  email_id: string;
}

interface UpdateDraftRequest extends CreateDraftRequest {
  id: string;
}

class EmailApiService {
  private baseURL = 'https://email-service-latest-agqz.onrender.com/api/v1/emails';
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getDjombiToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for better error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        console.error('Response interceptor error:', error);
        
        // Handle specific error cases
        if (error.response?.status === 401) {
          console.error('Authentication failed');
        } else if (error.response?.status === 403) {
          console.error('Access denied');
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Get Djombi access token
  private getDjombiToken(): string | null {
    try {
      // First try from DjombiProfileService
      const { accessToken } = DjombiProfileService.getStoredDjombiTokens();
      if (accessToken) {
        return accessToken;
      }
      
      // Fallback to localStorage directly
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('djombi_access_token');
        if (storedToken) {
          return storedToken;
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error getting Djombi access token:", error);
      return null;
    }
  }

  // Enhanced method to get the currently selected email with validation
  private getCurrentSelectedEmail(): { id: string; type: string | null } | null {
    try {
      // Get selected email from cookies
      const selectedEmail = getSelectedLinkedEmail();
      
      if (selectedEmail && selectedEmail.id) {
        console.log('Using selected email from cookies:', {
          id: selectedEmail.id.substring(0, 20) + '...',
          type: selectedEmail.type || 'null'
        });
        return selectedEmail;
      }
      
      // Fallback to individual cookie methods
      const emailId = getSelectedLinkedEmailId();
      const emailType = getSelectedLinkedEmailType();
      
      if (emailId) {
        console.log('Using fallback email selection:', {
          id: emailId.substring(0, 20) + '...',
          type: emailType || 'null'
        });
        return { id: emailId, type: emailType };
      }
      
      console.warn('No email selected - user must select an email account');
      return null;
      
    } catch (error) {
      console.error('Error getting selected email:', error);
      return null;
    }
  }

  // Process email data from API response
  private processEmailData(data: any, category: EmailCategory): Email[] {
    console.log(`Processing ${category} email data:`, data);
    
    // Initialize emails array
    let emailsData: any[] = [];
    
    // Try to extract emails from various possible response structures
    if (Array.isArray(data)) {
      emailsData = data;
    } else if (data && typeof data === 'object') {
      // Try common property names
      const possibleArrayKeys = [
        'data', 'emails', 'messages', 'items', 'results', 'content',
        category, // Try the category name itself
        `${category}s`, // Try pluralized category
        'inbox', 'sent', 'drafts', 'spam'
      ];
      
      for (const key of possibleArrayKeys) {
        if (data[key] && Array.isArray(data[key])) {
          emailsData = data[key];
          console.log(`Found emails array at key: ${key}`);
          break;
        }
      }
      
      // If still no array found, look for any array property
      if (emailsData.length === 0) {
        for (const key in data) {
          if (Array.isArray(data[key]) && data[key].length > 0) {
            emailsData = data[key];
            console.log(`Found emails array at unexpected key: ${key}`);
            break;
          }
        }
      }
    }

    console.log(`Extracted ${emailsData.length} raw email items for ${category}`);

    // Process and normalize email data
    const processedEmails: Email[] = emailsData.map((item: any, index: number) => {
      // Generate a unique ID if none exists
      const emailId = item.id || 
                     item.email_id || 
                     item._id || 
                     item.messageId || 
                     item.message_id || 
                     `${category}-${Date.now()}-${index}`;

      const email: Email = {
        id: emailId,
        email_id: item.email_id || emailId,
        from: item.from || item.sender || item.From || "unknown@example.com",
        to: item.to || item.recipient || item.To || item.recipients || "",
        subject: item.subject || item.Subject || item.title || "(No Subject)",
        content: item.content || item.body || item.Body || item.text || item.textContent || item.htmlContent || "",
        timestamp: item.timestamp || item.createdAt || item.created_at || item.date || item.Date || new Date().toISOString(),
        createdAt: item.created_at || item.createdAt || item.timestamp || Date.now(),
        isUrgent: Boolean(item.isUrgent || item.is_urgent || item.urgent || item.priority === 'high'),
        hasAttachment: Boolean(item.hasAttachment || item.has_attachment || item.attachments?.length > 0),
        status: category,
        category: category,
        isRead: Boolean(item.isRead || item.is_read || item.read || category === 'sent' || category === 'draft'),
        contentType: item.contentType || item.content_type || item.type || 'text'
      };
      
      return email;
    });

    console.log(`Processed ${processedEmails.length} ${category} emails`);
    return processedEmails;
  }

  // Enhanced fetch emails by category with proper email validation
  async fetchEmailsByCategory(category: EmailCategory): Promise<Email[]> {
    try {
      // Get currently selected email with validation
      const selectedEmail = this.getCurrentSelectedEmail();
      
      console.log(`Fetching ${category} emails for selected email:`, {
        emailType: selectedEmail?.type || 'no type',
        emailId: selectedEmail?.id ? `${selectedEmail.id.substring(0, 20)}...` : 'Not found',
      });

      // Validate email selection
      if (!selectedEmail || !selectedEmail.id) {
        throw new Error("Email ID missing. Please select an email account in the dropdown.");
      }

      // Build the appropriate endpoint based on category
      let endpoint = '';
      switch (category) {
        case 'inbox':
          endpoint = '/inbox';
          break;
        case 'sent':
          endpoint = '/sent';
          break;
        case 'spam':
          endpoint = '/spam';
          break;
        case 'draft':
          endpoint = '/drafts';
          break;
        default:
          endpoint = '/inbox';
          break;
      }

      // Add query parameters with the selected email ID
      const params = {
        email_id: selectedEmail.id, // Use the selected email ID
        offset: 1, // Keep offset=1 as requested
        limit: 100
      };

      console.log(`Making API request to: ${endpoint}`, {
        email_id: selectedEmail.id.substring(0, 20) + '...',
        email_type: selectedEmail.type,
        params
      });

      // Make API request
      const response: AxiosResponse<EmailListResponse> = await this.axiosInstance.get(endpoint, {
        params
      });

      console.log(`API response for ${category}:`, {
        status: response.status,
        statusText: response.statusText,
        dataKeys: Object.keys(response.data),
        success: response.data.success,
        message: response.data.message
      });

      // Handle API success/error flags
      if (response.data.success === false) {
        const errorMessage = response.data.message || 'API request failed';
        console.error("API returned error:", errorMessage);
        
        // Check if it's a "no emails" scenario
        if (errorMessage.toLowerCase().includes('no') && 
            (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('found'))) {
          console.log(`API says no ${category} emails found for selected email`);
          return [];
        }
        
        throw new Error(errorMessage);
      }

      // Process successful response
      const processedEmails = this.processEmailData(response.data, category);
      
      console.log(`Successfully fetched ${processedEmails.length} ${category} emails for email type: ${selectedEmail.type}`);
      
      return processedEmails;

    } catch (error) {
      console.error(`Error fetching ${category} emails:`, error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.log(`${category} emails endpoint returned 404 - no emails exist for selected account`);
          return [];
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (error.response?.status === 403) {
          throw new Error('Access denied. Please check your permissions.');
        }
      }
      
      throw error;
    }
  }

  // Send email with proper email validation
  async sendEmail(emailData: SendEmailRequest): Promise<any> {
    try {
      // Validate email selection before sending
      const selectedEmail = this.getCurrentSelectedEmail();
      if (!selectedEmail?.id) {
        throw new Error('No email account selected. Please select an email account.');
      }

      // Use the selected email ID
      const sendData = {
        ...emailData,
        email_id: selectedEmail.id
      };

      console.log('Sending email with selected account:', {
        email_id: selectedEmail.id.substring(0, 20) + '...',
        email_type: selectedEmail.type,
        to: sendData.to,
        subject: sendData.subject
      });
      
      const response = await this.axiosInstance.post('/send', sendData);
      
      console.log('Send email response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  // Create draft with proper email validation
  async createDraft(draftData: CreateDraftRequest): Promise<any> {
    try {
      // Validate email selection before creating draft
      const selectedEmail = this.getCurrentSelectedEmail();
      if (!selectedEmail?.id) {
        throw new Error('No email account selected. Please select an email account.');
      }

      // Use the selected email ID
      const createData = {
        ...draftData,
        email_id: selectedEmail.id
      };

      console.log('Creating draft with selected account:', {
        email_id: selectedEmail.id.substring(0, 20) + '...',
        email_type: selectedEmail.type,
        subject: createData.subject
      });
      
      const response = await this.axiosInstance.post('/drafts', createData);
      
      console.log('Create draft response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating draft:', error);
      throw error;
    }
  }

  // Update draft with proper email validation
  async updateDraft(draftData: UpdateDraftRequest): Promise<any> {
    try {
      // Validate email selection before updating draft
      const selectedEmail = this.getCurrentSelectedEmail();
      if (!selectedEmail?.id) {
        throw new Error('No email account selected. Please select an email account.');
      }

      console.log('Updating draft with selected account:', {
        email_id: selectedEmail.id.substring(0, 20) + '...',
        email_type: selectedEmail.type,
        draft_id: draftData.id
      });
      
      const { id, ...updateData } = draftData;
      const response = await this.axiosInstance.put(`/drafts/${id}`, {
        ...updateData,
        email_id: selectedEmail.id // Use selected email ID
      });
      
      console.log('Update draft response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating draft:', error);
      throw error;
    }
  }

  // Delete draft with proper email validation
  async deleteDraft(draftId: string): Promise<any> {
    try {
      const selectedEmail = this.getCurrentSelectedEmail();
      if (!selectedEmail?.id) {
        throw new Error('No email account selected. Please select an email account.');
      }

      console.log('Deleting draft with selected account:', {
        email_id: selectedEmail.id.substring(0, 20) + '...',
        email_type: selectedEmail.type,
        draft_id: draftId
      });
      
      const response = await this.axiosInstance.delete(`/drafts/${draftId}`, {
        params: { email_id: selectedEmail.id }
      });
      
      console.log('Delete draft response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error deleting draft:', error);
      throw error;
    }
  }

  // Move email to category with proper email validation
  async moveEmail(emailId: string, category: EmailCategory): Promise<any> {
    try {
      const selectedEmail = this.getCurrentSelectedEmail();
      if (!selectedEmail?.id) {
        throw new Error('No email account selected. Please select an email account.');
      }

      console.log('Moving email with selected account:', {
        email_id: selectedEmail.id.substring(0, 20) + '...',
        email_type: selectedEmail.type,
        target_category: category,
        email_to_move: emailId
      });
      
      const response = await this.axiosInstance.put(`/${emailId}/move`, {
        category,
        email_id: selectedEmail.id // Use selected email ID
      });
      
      console.log('Move email response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error moving email:', error);
      throw error;
    }
  }

  // Debug method to check current email selection
  public debugCurrentSelection(): void {
    const selectedEmail = this.getCurrentSelectedEmail();
    console.log('Current email selection debug:', {
      hasSelection: !!selectedEmail,
      id: selectedEmail?.id ? selectedEmail.id.substring(0, 20) + '...' : 'None',
      type: selectedEmail?.type || 'None',
      timestamp: new Date().toISOString()
    });
  }
}

// Export a singleton instance
export const emailApiService = new EmailApiService();
export default emailApiService;