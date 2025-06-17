// types/email.ts
export interface Email {
    id: string;
    subject: string;
    content: string;
    from: string;
    to: string;
    timestamp: string;
    status: string;
    isUrgent: boolean;
    hasAttachment: boolean;
    category: string;
    isRead: boolean;
}

export interface EmailColumn {
    id: string;
    title: string;
    icon?: any;
    gradient?: string;
}

export type TabType = "viewAll" | "urgent" | "archive";

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