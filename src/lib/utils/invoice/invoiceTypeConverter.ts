// invoiceTypeConverter.ts
import type { DocumentData, CompanyInfo, Contact } from '@/lib/types/invoice/types';

// Your existing InvoiceData interface
interface InvoiceData {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  fromCompany: string;
  fromAddress: string;
  fromEmail: string;
  fromPhone: string;
  toCompany: string;
  toContact: string;
  toAddress: string;
  toEmail: string;
  toPhone: string;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  notes: string;
  terms: string;
  paymentMethod: string;
}

// Your existing Contact interface
interface B2BContact {
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

export class InvoiceTypeConverter {
  /**
   * Convert InvoiceData to DocumentData for InvoiceModal
   */
  static invoiceDataToDocumentData(invoiceData: InvoiceData): DocumentData {
    return {
      id: invoiceData.id,
      type: 'invoice', // You might want to determine this based on some field
      invoiceNumber: invoiceData.invoiceNumber,
      date: invoiceData.date,
      dueDate: invoiceData.dueDate,
      validUntil: '', // Not used for invoices
      status: invoiceData.status,
      companyInfo: {
        name: invoiceData.fromCompany,
        address: invoiceData.fromAddress,
        email: invoiceData.fromEmail,
        phone: invoiceData.fromPhone,
      },
      toCompany: invoiceData.toCompany,
      toContact: invoiceData.toContact,
      toAddress: invoiceData.toAddress,
      toEmail: invoiceData.toEmail,
      toPhone: invoiceData.toPhone,
      items: invoiceData.items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total
      })),
      subtotal: invoiceData.subtotal,
      taxRate: invoiceData.taxRate,
      taxAmount: invoiceData.taxAmount,
      discountRate: invoiceData.discountRate,
      discountAmount: invoiceData.discountAmount,
      total: invoiceData.total,
      notes: invoiceData.notes,
      terms: invoiceData.terms,
      paymentMethod: invoiceData.paymentMethod
    };
  }

  /**
   * Convert DocumentData to InvoiceData for B2BFlowManager
   */
  static documentDataToInvoiceData(documentData: DocumentData): InvoiceData {
    return {
      id: documentData.id,
      invoiceNumber: documentData.invoiceNumber,
      date: documentData.date,
      dueDate: documentData.dueDate,
      status: documentData.status as 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled',
      fromCompany: documentData.companyInfo.name,
      fromAddress: documentData.companyInfo.address,
      fromEmail: documentData.companyInfo.email,
      fromPhone: documentData.companyInfo.phone,
      toCompany: documentData.toCompany,
      toContact: documentData.toContact,
      toAddress: documentData.toAddress,
      toEmail: documentData.toEmail,
      toPhone: documentData.toPhone,
      items: documentData.items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total
      })),
      subtotal: documentData.subtotal,
      taxRate: documentData.taxRate,
      taxAmount: documentData.taxAmount,
      discountRate: documentData.discountRate,
      discountAmount: documentData.discountAmount,
      total: documentData.total,
      notes: documentData.notes,
      terms: documentData.terms,
      paymentMethod: documentData.paymentMethod || ''
    };
  }

  /**
   * Convert B2BContact to Contact for InvoiceModal
   */
  static b2bContactToContact(b2bContact: B2BContact): Contact {
    return {
      id: b2bContact.id,
      name: b2bContact.name,
      email: b2bContact.email,
      phone: b2bContact.phone,
      company: b2bContact.company
    };
  }

  /**
   * Convert array of B2BContacts to Contacts
   */
  static b2bContactsToContacts(b2bContacts: B2BContact[]): Contact[] {
    return b2bContacts.map(contact => this.b2bContactToContact(contact));
  }

  /**
   * Create default company info from invoice data
   */
  static createCompanyInfoFromInvoice(invoiceData: InvoiceData): CompanyInfo {
    return {
      name: invoiceData.fromCompany,
      address: invoiceData.fromAddress,
      email: invoiceData.fromEmail,
      phone: invoiceData.fromPhone,
    };
  }

  /**
   * Generate a unique invoice number
   */
  static generateInvoiceNumber(type: 'invoice' | 'quote' = 'invoice'): string {
    const prefix = type === 'invoice' ? 'INV' : 'QUO';
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  }

  /**
   * Create a new empty invoice data structure
   */
  static createEmptyInvoiceData(companyInfo?: CompanyInfo): InvoiceData {
    return {
      id: this.generateInvoiceNumber(),
      invoiceNumber: this.generateInvoiceNumber(),
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      status: 'Draft',
      fromCompany: companyInfo?.name || 'Your Company Name',
      fromAddress: companyInfo?.address || 'Your Address\nCity, State ZIP',
      fromEmail: companyInfo?.email || 'your@email.com',
      fromPhone: companyInfo?.phone || '+1 (555) 000-0000',
      toCompany: '',
      toContact: '',
      toAddress: '',
      toEmail: '',
      toPhone: '',
      items: [{
        id: '1',
        description: 'Service or Product',
        quantity: 1,
        unitPrice: 100,
        total: 100
      }],
      subtotal: 100,
      taxRate: 10,
      taxAmount: 10,
      discountRate: 0,
      discountAmount: 0,
      total: 110,
      notes: '',
      terms: 'Payment is due within 30 days of invoice date.',
      paymentMethod: 'Bank Transfer'
    };
  }
}