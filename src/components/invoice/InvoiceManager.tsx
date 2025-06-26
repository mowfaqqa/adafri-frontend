// components/invoice/InvoiceManager.tsx
"use client";
import { useState, useCallback } from 'react';
import { Plus, FileText, Eye, Edit, Trash2, DollarSign } from 'lucide-react';
import type { DocumentData, CompanyInfo, Contact } from '@/lib/types/invoice/types';
import { InvoiceTypeConverter } from '@/lib/utils/invoice/invoiceTypeConverter';
import { InvoiceModal } from '../crm/b2b/modals/InvoiceModal';
import { InvoiceViewModal } from '../crm/b2b/modals/InvoiceViewModal';

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

interface InvoiceManagerProps {
  contacts?: Contact[];
  companyInfo?: CompanyInfo;
  showHeader?: boolean;
  className?: string;
  onInvoiceChange?: (invoices: InvoiceData[]) => void;
}

export function InvoiceManager({ 
  contacts = [], 
  companyInfo, 
  showHeader = true,
  className = "",
  onInvoiceChange 
}: InvoiceManagerProps) {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceData | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<InvoiceData | null>(null);

  // Default company info
  const defaultCompanyInfo: CompanyInfo = companyInfo || {
    name: 'Your Company Name',
    address: 'Your Address\nCity, State ZIP',
    email: 'your@email.com',
    phone: '+1 (555) 000-0000',
  };

  const handleInvoiceSave = useCallback((documentData: DocumentData) => {
    const invoiceData = InvoiceTypeConverter.documentDataToInvoiceData(documentData);
    
    setInvoices(prevInvoices => {
      const existingIndex = prevInvoices.findIndex(inv => inv.id === invoiceData.id);
      let updatedInvoices;
      
      if (existingIndex >= 0) {
        updatedInvoices = [...prevInvoices];
        updatedInvoices[existingIndex] = invoiceData;
      } else {
        updatedInvoices = [invoiceData, ...prevInvoices];
      }
      
      onInvoiceChange?.(updatedInvoices);
      return updatedInvoices;
    });
  }, [onInvoiceChange]);

  const handleCreateInvoice = () => {
    setEditingInvoice(null);
    setIsInvoiceModalOpen(true);
  };

  const handleEditInvoice = (invoice: InvoiceData) => {
    setEditingInvoice(invoice);
    setIsInvoiceModalOpen(true);
  };

  const handleViewInvoice = (invoice: InvoiceData) => {
    setViewingInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      setInvoices(prevInvoices => {
        const updatedInvoices = prevInvoices.filter(inv => inv.id !== invoiceId);
        onInvoiceChange?.(updatedInvoices);
        return updatedInvoices;
      });
    }
  };

  const handleEditFromView = (invoice: InvoiceData) => {
    setIsViewModalOpen(false);
    setEditingInvoice(invoice);
    setIsInvoiceModalOpen(true);
  };

  const handleDownloadFromView = (invoice: InvoiceData) => {
    console.log('Download invoice:', invoice.invoiceNumber);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Sent':
        return 'bg-blue-100 text-blue-800';
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: invoices.length,
    paid: invoices.filter(inv => inv.status === 'Paid').length,
    pending: invoices.filter(inv => inv.status === 'Sent').length,
    overdue: invoices.filter(inv => inv.status === 'Overdue').length
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Invoices</h2>
            <p className="text-sm text-gray-600 mt-1">Manage your invoices and billing</p>
          </div>
          <button
            onClick={handleCreateInvoice}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold">✓</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold">⏳</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 font-bold">!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Invoices</h3>
        </div>
        
        {invoices.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
            <p className="text-gray-600 mb-4">Create your first invoice to get started</p>
            <button
              onClick={handleCreateInvoice}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td 
                      className="px-6 py-4 whitespace-nowrap cursor-pointer"
                      onClick={() => handleViewInvoice(invoice)}
                    >
                      <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        {invoice.invoiceNumber}
                      </div>
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap cursor-pointer"
                      onClick={() => handleViewInvoice(invoice)}
                    >
                      <div className="text-sm text-gray-900">{invoice.toCompany}</div>
                      <div className="text-sm text-gray-500">{invoice.toContact}</div>
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap cursor-pointer"
                      onClick={() => handleViewInvoice(invoice)}
                    >
                      <div className="text-sm font-medium text-gray-900">
                        ${invoice.total.toFixed(2)}
                      </div>
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap cursor-pointer"
                      onClick={() => handleViewInvoice(invoice)}
                    >
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                      onClick={() => handleViewInvoice(invoice)}
                    >
                      {new Date(invoice.date).toLocaleDateString()}
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                      onClick={() => handleViewInvoice(invoice)}
                    >
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewInvoice(invoice);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditInvoice(invoice);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteInvoice(invoice.id);
                          }}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setEditingInvoice(null);
        }}
        onSave={handleInvoiceSave}
        editingDocument={editingInvoice ? InvoiceTypeConverter.invoiceDataToDocumentData(editingInvoice) : null}
        // contacts={InvoiceTypeConverter.b2bContactsToContacts(contacts)}
        companyInfo={defaultCompanyInfo}
      />

      <InvoiceViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingInvoice(null);
        }}
        invoice={viewingInvoice}
        onEdit={handleEditFromView}
        onDownload={handleDownloadFromView}
      />
    </div>
  );
}