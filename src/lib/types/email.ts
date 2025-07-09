// types/email.ts
export interface Email {
  id: string;
  subject: string;
  content: string;
  contentType?: 'text' | 'html' | 'mime';
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
  cc?: string[];
  bcc?: string[];
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

// Additional interfaces from email2.ts
export interface EmailColumn {
  id: string;
  title: string;
  icon?: string; // Updated to support emoji/icon strings
  gradient?: string;
}

export type TabType = "inbox" | "urgent" | "follow-up";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: any;
  gradient: string;
}

export interface EmailCompose {
  to: string;
  subject: string;
  content: string;
  attachments?: File[];
}

export interface EmailFilter {
  searchTerm: string;
  dateRange: string;
  hasAttachment: boolean | null;
  isRead: boolean | null;
}

export type EmailAccountType = "personal" | "professional";

export interface PaginationState {
  [columnId: string]: {
    currentPage: number;
    itemsPerPage: number;
  };
}