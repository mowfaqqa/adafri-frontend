// types/deals.ts - Deal-specific type definitions
export interface Deal {
  id: string;
  clientName: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  role: string;
  avatar: string;
  stage: string;
  lastActivity: string;
}

export interface DealColumn {
  id: string;
  title: string;
  icon: string;
  gradient: string;
  isCustom?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  status: 'Active Client' | 'Prospection' | 'Supplier' | 'Add Segment' | string;
  lastActivity: string;
  isSelected?: boolean;
  customSegment?: string;
}

export interface DealsViewProps {
  onReconfigure: () => void;
  contactsFromContactView?: Contact[];
}

export interface DealsBoardProps {
  columns: DealColumn[];
  deals: Deal[];
  onDealMove: (dealId: string, targetColumnId: string) => void;
  onRemoveCustomSegment: (segmentName: string) => void;
}

export interface DealColumnProps {
  column: DealColumn;
  deals: Deal[];
  onDealMove: (dealId: string, targetColumnId: string) => void;
  onRemoveCustomSegment: (segmentName: string) => void;
}

export interface DealCardProps {
  deal: Deal;
}

// Utility types
export type DealStage = 'Prospection' | 'Active Client' | 'Negotiation' | 'Closed' | string;
export type ContactStatus = Contact['status'];