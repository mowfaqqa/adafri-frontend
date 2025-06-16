// types.ts
export type DocumentType = 'invoice' | 'quote';
export type InvoiceTemplate = 'modern' | 'classic' | 'minimal' | 'professional';

export interface CompanyInfo {
  name: string;
  logo?: string;
  address: string;
  email: string;
  phone: string;
  taxId?: string;
  companyId?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
}

export interface DocumentData {
  id: string;
  type: DocumentType;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  validUntil?: string;
  status: string;
  companyInfo: CompanyInfo;
  toCompany: string;
  toContact: string;
  toAddress: string;
  toEmail: string;
  toPhone: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  notes: string;
  terms: string;
  paymentMethod?: string;
}