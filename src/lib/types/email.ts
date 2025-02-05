// types/email.ts
export interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  content: string;
  timestamp: string;
  isUrgent: boolean;
  hasAttachment: boolean;
  status: "sent" | "draft" | "inbox" | "spam";
  category: string;
}

export type EmailCategory = "inbox" | "sent" | "draft" | "spam" | "agenda";
export type EmailSegment = "all" | "urgent" | string;
