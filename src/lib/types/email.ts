// types/email.ts
export interface Email {
  id?: string; // Make id optional for new emails
  from: string;
  to: string;
  subject: string;
  content: string;
  timestamp?: string; // Make timestamp optional for new emails
  isUrgent?: boolean; // Make optional for new emails
  hasAttachment: boolean;
  status: EmailCategory;
  category?: string; // Make category optional for new emails
}

export interface EmailData {
  to: string;
  subject: string;
  content: string;
  email_id: string;
  cc?: string[] | null;
  bcc?: string[] | null;
  signature?: string | null;
}

export type EmailCategory = "inbox" | "sent" | "draft" | "spam" | "agenda";
export type EmailSegment = "all" | "urgent" | string;

// Edited