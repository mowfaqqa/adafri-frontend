// types/email.ts
export interface Email {
  id: string;
  subject: string;
  content: string;
  contentType?: 'text' | 'html';
  from: string;
  to: string;
  timestamp: string;
  createdAt?: string | number;
  status: EmailSegment;
  isUrgent: boolean;
  hasAttachment: boolean;
  category: string;
  isRead: boolean;
  email_id?: string | null;
}


export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  drafts?: T;
}

export interface EmailSendData {
  to: string;
  subject: string;
  content: string;
  email_id: string;
  cc?: string[] | null;
  bcc?: string[] | null;
  signature?: string | null;
}

export interface EmailData {
  inbox: Email[];
  sent: Email[];
  draft: Email[];
  spam: Email[];
  trash: Email[];
}

export type EmailCategory = "inbox" | "sent" | "draft" | "spam" | "agenda";
export type EmailSegment = "all" | "urgent" | string;

// Edited