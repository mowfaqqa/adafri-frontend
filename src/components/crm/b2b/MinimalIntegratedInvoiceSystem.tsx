// components/MinimalIntegratedInvoiceSystem.tsx
// A version of IntegratedInvoiceSystem optimized for use within tabs
"use client";
import React, { useState } from 'react';
import { Plus, FileText, Calendar, DollarSign, Eye, Edit, Trash2, Settings, Sparkles } from 'lucide-react';
import { InvoiceModal } from './modals/InvoiceModal';
import { useInvoiceSettings } from '@/lib/context/invoices/InvoiceSettingsProvider';
import type { DocumentData, CompanyInfo, Contact } from '@/lib/types/invoice/types';
import { TemplateCurrencySelector } from './TemplateCurrencySelector';

interface MinimalIntegratedInvoiceSystemProps {
  contacts?: Contact[];
  companyInfo?: CompanyInfo;
  showHeader?: boolean;
}

export default function MinimalIntegratedInvoiceSystem({ 
  contacts = [], 
  companyInfo, 
  showHeader = true 
}: MinimalIntegratedInvoiceSystemProps) {
  const { settings, formatCurrency } = useInvoiceSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [editingDocument, setEditingDocument] = useState<DocumentData | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleSave = (document: DocumentData) => {
    setDocuments(prev => {
      const existing = prev.find(d => d.id === document.id);
      if (existing) {
        return prev.map(d => d.id === document.id ? document : d);
      }
      return [...prev, document];
    });
    setEditingDocument(null);
  };

  const handleEdit = (document: DocumentData) => {
    setEditingDocument(document);
    setIsModalOpen(true);
  };

  const handleDelete = (documentId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      setDocuments(prev => prev.filter(d => d.id !== documentId));
    }
  };

  const handleCreateNew = () => {
    if (!settings.isConfigured) {
      setShowSettings(true);
      return;
    }
    setEditingDocument(null);
    setIsModalOpen(true);
  };

  const defaultCompanyInfo: CompanyInfo = companyInfo || {
    name: 'Your Company Name',
    address: 'Your Address\nCity, State ZIP',
    email: 'your@email.com',
    phone: '+1 (555) 000-0000',
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalValue = documents.reduce((sum, doc) => sum + doc.total, 0);
  const paidDocuments = documents.filter(doc => doc.status === 'Paid');
  const pendingDocuments = documents.filter(doc => ['Sent', 'Draft'].includes(doc.status));

  // Show settings/configuration screen if not configured
  if (!settings.isConfigured || showSettings) {
    return (
      <div className="space-y-6">
        {showHeader && (
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Setup</h2>
            <p className="text-gray-600">
              Let's configure your invoice preferences
            </p>
          </div>
        )}

        {/* Settings Panel */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <TemplateCurrencySelector 
            onComplete={() => {
              setShowSettings(false);
            }}
          />
        </div>

        {/* Back Button (only show if already configured) */}
        {settings.isConfigured && (
          <div className="text-center">
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-600 hover:text-gray-800 underline"
            >
              ← Back to invoices
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Invoices & Quotes</h2>
            <p className="text-gray-600 mt-1">
              Create and manage your professional documents
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCreateNew}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create New</span>
            </button>
            
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-3 bg-white text-gray-700 rounded-xl font-medium hover:shadow-md transition-all duration-300 flex items-center space-x-2 border border-gray-200"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick action button for no header mode */}
      {!showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span>Template:</span>
              <span className="font-medium text-gray-900 capitalize">{settings.selectedTemplate}</span>
            </div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <span>Currency:</span>
              <span className="font-medium text-gray-900">
                {settings.selectedCurrency.code} ({settings.selectedCurrency.symbol})
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New</span>
            </button>
            
            <button
              onClick={() => setShowSettings(true)}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {documents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Documents</p>
                <p className="text-xl font-bold text-gray-900">{documents.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Value</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Paid</p>
                <p className="text-xl font-bold text-gray-900">{paidDocuments.length}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending</p>
                <p className="text-xl font-bold text-gray-900">{pendingDocuments.length}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      {documents.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Documents</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {doc.type.toUpperCase()} #{doc.invoiceNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            {doc.items.length} item{doc.items.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{doc.toCompany}</div>
                      <div className="text-xs text-gray-500">{doc.toContact}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(doc.date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {doc.type === 'invoice' ? 'Due: ' : 'Valid: '}
                        {new Date(doc.type === 'invoice' ? doc.dueDate : doc.validUntil || '').toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(doc.total)}
                      </div>
                      {doc.discountAmount > 0 && (
                        <div className="text-xs text-green-600">
                          -{doc.discountRate}% discount
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(doc)}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
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
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first invoice or quote to get started with professional billing.
          </p>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center space-x-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Document</span>
          </button>
        </div>
      )}

      <InvoiceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDocument(null);
        }}
        onSave={handleSave}
        editingDocument={editingDocument}
        contacts={contacts}
        companyInfo={defaultCompanyInfo}
      />
    </div>
  );
}