// components/IntegratedInvoiceSystem.tsx
"use client";
import React, { useState } from 'react';
import { Plus, FileText, Calendar, DollarSign, Eye, Edit, Trash2, Settings, Sparkles } from 'lucide-react';
import { InvoiceModal } from './modals/InvoiceModal';
import { TemplateCurrencySelector } from './TemplateCurrencySelector';
import { useInvoiceSettings } from '@/lib/context/invoices/InvoiceSettingsProvider';
import type { DocumentData, CompanyInfo, Contact } from '@/lib/types/invoice/types';

export default function IntegratedInvoiceSystem() {
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

  const sampleCompanyInfo: CompanyInfo = {
    name: 'Acme Corporation',
    address: '123 Business Ave\nNew York, NY 10001',
    email: 'contact@acme.com',
    phone: '+1 (555) 123-4567',
    taxId: 'TAX123456789',
    companyId: 'REG987654321'
  };

  const sampleContacts: Contact[] = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john@techcorp.com',
      phone: '+1 (555) 987-6543',
      company: 'Tech Corp Solutions'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@designstudio.com',
      phone: '+1 (555) 456-7890',
      company: 'Creative Design Studio'
    },
    {
      id: '3',
      name: 'Mike Wilson',
      email: 'mike@retailplus.com',
      phone: '+1 (555) 321-0987',
      company: 'Retail Plus Inc'
    }
  ];

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Welcome to Invoice & Quote System
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Let's get started by setting up your preferences
            </p>
          </div>

          {/* Settings Panel */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200 shadow-2xl p-8">
            <TemplateCurrencySelector 
              onComplete={() => {
                setShowSettings(false);
              }}
            />
          </div>

          {/* Back Button (only show if already configured) */}
          {settings.isConfigured && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-600 hover:text-gray-800 underline"
              >
                ← Back to dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Invoice & Quote System
          </h1>
          <p className="text-gray-600 text-lg mb-8">
            Create beautiful invoices and quotes with multiple professional templates
          </p>
          
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handleCreateNew}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-xl transition-all duration-300 flex items-center space-x-3"
            >
              <Plus className="w-6 h-6" />
              <span>Create New Document</span>
            </button>
            
            <button
              onClick={() => setShowSettings(true)}
              className="px-6 py-4 bg-white/80 backdrop-blur-lg text-gray-700 rounded-2xl font-medium hover:shadow-lg transition-all duration-300 flex items-center space-x-2 border border-gray-200"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>
          </div>

          {/* Current Settings Display */}
          <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-gray-600">
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
        </div>

        {/* Stats Cards */}
        {documents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Documents</p>
                  <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Paid</p>
                  <p className="text-2xl font-bold text-gray-900">{paidDocuments.length}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingDocuments.length}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents List */}
        {documents.length > 0 ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Recent Documents</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {doc.type.toUpperCase()} #{doc.invoiceNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {doc.items.length} item{doc.items.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{doc.toCompany}</div>
                        <div className="text-sm text-gray-500">{doc.toContact}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(doc.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {doc.type === 'invoice' ? 'Due: ' : 'Valid: '}
                          {new Date(doc.type === 'invoice' ? doc.dueDate : doc.validUntil || '').toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(doc.total)}
                        </div>
                        {doc.discountAmount > 0 && (
                          <div className="text-sm text-green-600">
                            -{doc.discountRate}% discount
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(doc)}
                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
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
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200 p-12 shadow-xl text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first invoice or quote to get started with professional billing.
            </p>
            <button
              onClick={handleCreateNew}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Document</span>
            </button>
          </div>
        )}
      </div>

      <InvoiceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDocument(null);
        }}
        onSave={handleSave}
        editingDocument={editingDocument}
        contacts={sampleContacts}
        companyInfo={sampleCompanyInfo}
      />
    </div>
  );
}











































































// Former Design
// "use client";
// import React, { useState } from 'react';
// import { Plus, FileText, Calendar, DollarSign, Eye, Edit, Trash2 } from 'lucide-react';
// import { InvoiceModal } from './modals/InvoiceModal';
// import type { DocumentData, CompanyInfo, Contact } from '@/lib/types/invoice/types';


// export default function IntegratedInvoiceSystem() {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [documents, setDocuments] = useState<DocumentData[]>([]);
//   const [editingDocument, setEditingDocument] = useState<DocumentData | null>(null);

//   const handleSave = (document: DocumentData) => {
//     setDocuments(prev => {
//       const existing = prev.find(d => d.id === document.id);
//       if (existing) {
//         return prev.map(d => d.id === document.id ? document : d);
//       }
//       return [...prev, document];
//     });
//     setEditingDocument(null);
//   };

//   const handleEdit = (document: DocumentData) => {
//     setEditingDocument(document);
//     setIsModalOpen(true);
//   };

//   const handleDelete = (documentId: string) => {
//     if (confirm('Are you sure you want to delete this document?')) {
//       setDocuments(prev => prev.filter(d => d.id !== documentId));
//     }
//   };

//   const handleCreateNew = () => {
//     setEditingDocument(null);
//     setIsModalOpen(true);
//   };

//   const sampleCompanyInfo: CompanyInfo = {
//     name: 'Acme Corporation',
//     address: '123 Business Ave\nNew York, NY 10001',
//     email: 'contact@acme.com',
//     phone: '+1 (555) 123-4567',
//     taxId: 'TAX123456789',
//     companyId: 'REG987654321'
//   };

//   const sampleContacts: Contact[] = [
//     {
//       id: '1',
//       name: 'John Smith',
//       email: 'john@techcorp.com',
//       phone: '+1 (555) 987-6543',
//       company: 'Tech Corp Solutions'
//     },
//     {
//       id: '2',
//       name: 'Sarah Johnson',
//       email: 'sarah@designstudio.com',
//       phone: '+1 (555) 456-7890',
//       company: 'Creative Design Studio'
//     },
//     {
//       id: '3',
//       name: 'Mike Wilson',
//       email: 'mike@retailplus.com',
//       phone: '+1 (555) 321-0987',
//       company: 'Retail Plus Inc'
//     }
//   ];

//   const getStatusColor = (status: string) => {
//     switch (status.toLowerCase()) {
//       case 'paid':
//         return 'bg-green-100 text-green-800';
//       case 'sent':
//         return 'bg-blue-100 text-blue-800';
//       case 'overdue':
//         return 'bg-red-100 text-red-800';
//       case 'accepted':
//         return 'bg-green-100 text-green-800';
//       case 'declined':
//         return 'bg-red-100 text-red-800';
//       case 'cancelled':
//         return 'bg-gray-100 text-gray-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const totalValue = documents.reduce((sum, doc) => sum + doc.total, 0);
//   const paidDocuments = documents.filter(doc => doc.status === 'Paid');
//   const pendingDocuments = documents.filter(doc => ['Sent', 'Draft'].includes(doc.status));

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
//             Invoice & Quote System
//           </h1>
//           <p className="text-gray-600 text-lg mb-8">
//             Create beautiful invoices and quotes with multiple professional templates
//           </p>
          
//           <div className="flex items-center justify-center space-x-4">
//             <button
//               onClick={handleCreateNew}
//               className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-xl transition-all duration-300 flex items-center space-x-3"
//             >
//               <Plus className="w-6 h-6" />
//               <span>Create New Document</span>
//             </button>
//           </div>
//         </div>

//         {/* Stats Cards */}
//         {documents.length > 0 && (
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//             <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200 p-6 shadow-lg">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-gray-600 text-sm font-medium">Total Documents</p>
//                   <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
//                 </div>
//                 <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
//                   <FileText className="w-6 h-6 text-blue-600" />
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200 p-6 shadow-lg">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-gray-600 text-sm font-medium">Total Value</p>
//                   <p className="text-2xl font-bold text-gray-900">${totalValue.toFixed(2)}</p>
//                 </div>
//                 <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
//                   <DollarSign className="w-6 h-6 text-green-600" />
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200 p-6 shadow-lg">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-gray-600 text-sm font-medium">Paid</p>
//                   <p className="text-2xl font-bold text-gray-900">{paidDocuments.length}</p>
//                 </div>
//                 <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
//                   <Calendar className="w-6 h-6 text-emerald-600" />
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200 p-6 shadow-lg">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-gray-600 text-sm font-medium">Pending</p>
//                   <p className="text-2xl font-bold text-gray-900">{pendingDocuments.length}</p>
//                 </div>
//                 <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
//                   <Eye className="w-6 h-6 text-yellow-600" />
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Documents List */}
//         {documents.length > 0 ? (
//           <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
//             <div className="p-6 border-b border-gray-200">
//               <h2 className="text-2xl font-bold text-gray-900">Recent Documents</h2>
//             </div>
            
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Document
//                     </th>
//                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Client
//                     </th>
//                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Date
//                     </th>
//                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Amount
//                     </th>
//                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Status
//                     </th>
//                     <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {documents.map((doc) => (
//                     <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center">
//                           <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
//                             <FileText className="w-5 h-5 text-white" />
//                           </div>
//                           <div className="ml-4">
//                             <div className="text-sm font-medium text-gray-900">
//                               {doc.type.toUpperCase()} #{doc.invoiceNumber}
//                             </div>
//                             <div className="text-sm text-gray-500">
//                               {doc.items.length} item{doc.items.length !== 1 ? 's' : ''}
//                             </div>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm font-medium text-gray-900">{doc.toCompany}</div>
//                         <div className="text-sm text-gray-500">{doc.toContact}</div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-gray-900">
//                           {new Date(doc.date).toLocaleDateString()}
//                         </div>
//                         <div className="text-sm text-gray-500">
//                           {doc.type === 'invoice' ? 'Due: ' : 'Valid: '}
//                           {new Date(doc.type === 'invoice' ? doc.dueDate : doc.validUntil || '').toLocaleDateString()}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm font-medium text-gray-900">
//                           ${doc.total.toFixed(2)}
//                         </div>
//                         {doc.discountAmount > 0 && (
//                           <div className="text-sm text-green-600">
//                             -{doc.discountRate}% discount
//                           </div>
//                         )}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(doc.status)}`}>
//                           {doc.status}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
//                         <div className="flex items-center justify-end space-x-2">
//                           <button
//                             onClick={() => handleEdit(doc)}
//                             className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
//                             title="Edit"
//                           >
//                             <Edit className="w-4 h-4" />
//                           </button>
//                           <button
//                             onClick={() => handleDelete(doc.id)}
//                             className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
//                             title="Delete"
//                           >
//                             <Trash2 className="w-4 h-4" />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         ) : (
//           <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200 p-12 shadow-xl text-center">
//             <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//             <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents yet</h3>
//             <p className="text-gray-600 mb-6">
//               Create your first invoice or quote to get started with professional billing.
//             </p>
//             <button
//               onClick={handleCreateNew}
//               className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center space-x-2 mx-auto"
//             >
//               <Plus className="w-5 h-5" />
//               <span>Create Your First Document</span>
//             </button>
//           </div>
//         )}
//       </div>

//       <InvoiceModal
//         isOpen={isModalOpen}
//         onClose={() => {
//           setIsModalOpen(false);
//           setEditingDocument(null);
//         }}
//         onSave={handleSave}
//         editingDocument={editingDocument}
//         contacts={sampleContacts}
//         companyInfo={sampleCompanyInfo}
//       />
//     </div>
//   );
// }

































































// import React, { useState, useRef } from 'react';
// import {
//     Download, Send, X, Plus, Trash2, Calendar, Building, User, Upload,
//     FileText, Sparkles, Crown, Zap, Diamond, Eye
// } from 'lucide-react';
// import {DocumentData, DocumentType, InvoiceItem, InvoiceTemplate } from '@/lib/types/invoice/invoice';

// interface IntegratedInvoiceSystemProps {
//   document: DocumentType;
//   selectedTemplate: string;
//   onSelectTemplate: (templateId: string) => void;
// }

// // Template Components
// const TemplateRenderer: React.FC<{ document: DocumentData; template: InvoiceTemplate }> = ({ document, template }) => {
//     const templates = {
//         modern: (
//             <div className="bg-white p-6 shadow-xl rounded-lg border border-blue-100">
//                 <div className="flex justify-between items-start mb-6">
//                     <div>
//                         <h1 className="text-2xl font-bold text-gray-900 mb-1">{document.companyInfo.name}</h1>
//                         <p className="text-sm text-gray-600">{document.companyInfo.email}</p>
//                     </div>
//                     <div className="text-right">
//                         <div className="text-3xl font-bold text-blue-600 mb-1">{document.type.toUpperCase()}</div>
//                         <div className="text-lg font-semibold text-gray-700">#{document.invoiceNumber}</div>
//                     </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
//                     <div className="bg-blue-50 p-3 rounded">
//                         <h3 className="font-semibold mb-1">From:</h3>
//                         <p className="text-gray-700">{document.companyInfo.name}</p>
//                     </div>
//                     <div className="bg-gray-50 p-3 rounded">
//                         <h3 className="font-semibold mb-1">Bill To:</h3>
//                         <p className="text-gray-700">{document.toCompany}</p>
//                     </div>
//                 </div>

//                 <table className="w-full mb-4 text-sm">
//                     <thead>
//                         <tr className="bg-blue-600 text-white">
//                             <th className="p-2 text-left">Description</th>
//                             <th className="p-2 text-center">Qty</th>
//                             <th className="p-2 text-right">Total</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {document.items.map((item, i) => (
//                             <tr key={item.id} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
//                                 <td className="p-2">{item.description}</td>
//                                 <td className="p-2 text-center">{item.quantity}</td>
//                                 <td className="p-2 text-right font-medium">${item.total.toFixed(2)}</td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>

//                 <div className="flex justify-end">
//                     <div className="w-1/3 space-y-1 text-sm">
//                         <div className="flex justify-between">
//                             <span>Subtotal:</span>
//                             <span>${document.subtotal.toFixed(2)}</span>
//                         </div>
//                         <div className="flex justify-between text-lg font-bold text-blue-600 border-t pt-1">
//                             <span>Total:</span>
//                             <span>${document.total.toFixed(2)}</span>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         ),

//         classic: (
//             <div className="bg-white p-6 shadow-xl border-2 border-gray-800">
//                 <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
//                     <h1 className="text-3xl font-bold text-gray-900">{document.companyInfo.name}</h1>
//                     <p className="text-sm text-gray-600 mt-1">{document.companyInfo.email}</p>
//                 </div>

//                 <div className="flex justify-between mb-6">
//                     <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-800 pb-1">
//                         {document.type.toUpperCase()}
//                     </h2>
//                     <div className="text-right text-sm">
//                         <div><strong>Number:</strong> {document.invoiceNumber}</div>
//                         <div><strong>Date:</strong> {new Date(document.date).toLocaleDateString()}</div>
//                     </div>
//                 </div>

//                 <table className="w-full mb-4 border-2 border-gray-800 text-sm">
//                     <thead>
//                         <tr className="bg-gray-800 text-white">
//                             <th className="p-2 text-left font-bold">DESCRIPTION</th>
//                             <th className="p-2 text-center font-bold">QTY</th>
//                             <th className="p-2 text-right font-bold">AMOUNT</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {document.items.map((item) => (
//                             <tr key={item.id}>
//                                 <td className="border border-gray-400 p-2">{item.description}</td>
//                                 <td className="border border-gray-400 p-2 text-center">{item.quantity}</td>
//                                 <td className="border border-gray-400 p-2 text-right font-semibold">${item.total.toFixed(2)}</td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>

//                 <div className="flex justify-end">
//                     <div className="w-1/3 border-2 border-gray-800">
//                         <div className="bg-gray-800 text-white p-2 text-center font-bold">TOTAL</div>
//                         <div className="p-2 text-lg font-bold text-center">${document.total.toFixed(2)}</div>
//                     </div>
//                 </div>
//             </div>
//         ),

//         minimal: (
//             <div className="bg-white p-6 shadow-xl">
//                 <div className="flex justify-between items-start mb-8">
//                     <h1 className="text-xl font-light text-gray-900">{document.companyInfo.name}</h1>
//                     <div className="text-right">
//                         <div className="text-2xl font-thin text-gray-400">{document.type}</div>
//                         <div className="text-lg font-medium">#{document.invoiceNumber}</div>
//                     </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
//                     <div>
//                         <div className="text-gray-500 uppercase text-xs mb-1">From</div>
//                         <div className="font-medium">{document.companyInfo.name}</div>
//                     </div>
//                     <div>
//                         <div className="text-gray-500 uppercase text-xs mb-1">Bill To</div>
//                         <div className="font-medium">{document.toCompany}</div>
//                     </div>
//                 </div>

//                 <table className="w-full mb-6">
//                     <thead>
//                         <tr className="border-b border-gray-200">
//                             <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Description</th>
//                             <th className="text-center py-2 text-xs font-medium text-gray-500 uppercase">Qty</th>
//                             <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">Amount</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {document.items.map((item) => (
//                             <tr key={item.id} className="border-b border-gray-100">
//                                 <td className="py-3 text-sm">{item.description}</td>
//                                 <td className="py-3 text-center text-sm">{item.quantity}</td>
//                                 <td className="py-3 text-right font-medium text-sm">${item.total.toFixed(2)}</td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>

//                 <div className="flex justify-end">
//                     <div className="w-1/4 space-y-1 text-sm">
//                         <div className="flex justify-between">
//                             <span className="text-gray-600">Subtotal</span>
//                             <span>${document.subtotal.toFixed(2)}</span>
//                         </div>
//                         <div className="border-t border-gray-200 pt-1">
//                             <div className="flex justify-between text-lg font-medium">
//                                 <span>Total</span>
//                                 <span>${document.total.toFixed(2)}</span>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         ),

//         professional: (
//             <div className="bg-white shadow-xl">
//                 <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white p-6">
//                     <div className="flex justify-between items-start">
//                         <div>
//                             <h1 className="text-xl font-bold">{document.companyInfo.name}</h1>
//                             <p className="text-gray-300 text-sm">{document.companyInfo.email}</p>
//                         </div>
//                         <div className="text-right">
//                             <div className="text-2xl font-bold">{document.type.toUpperCase()}</div>
//                             <div className="text-lg">#{document.invoiceNumber}</div>
//                         </div>
//                     </div>
//                 </div>

//                 <div className="p-6">
//                     <div className="grid grid-cols-2 gap-4 mb-6">
//                         <div className="bg-gray-50 p-4 rounded">
//                             <h3 className="font-semibold mb-2 flex items-center">
//                                 <Building className="w-4 h-4 mr-2" />Company Details
//                             </h3>
//                             <p className="text-sm text-gray-600">{document.companyInfo.name}</p>
//                         </div>
//                         <div className="bg-blue-50 p-4 rounded">
//                             <h3 className="font-semibold mb-2">Billing Information</h3>
//                             <p className="text-sm text-gray-600">{document.toCompany}</p>
//                         </div>
//                     </div>

//                     <table className="w-full mb-4 text-sm border border-gray-200 rounded">
//                         <thead className="bg-gray-50">
//                             <tr>
//                                 <th className="p-3 text-left">Description</th>
//                                 <th className="p-3 text-center">Quantity</th>
//                                 <th className="p-3 text-right">Total</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {document.items.map((item, i) => (
//                                 <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
//                                     <td className="p-3">{item.description}</td>
//                                     <td className="p-3 text-center">{item.quantity}</td>
//                                     <td className="p-3 text-right font-medium">${item.total.toFixed(2)}</td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>

//                     <div className="flex justify-end">
//                         <div className="w-1/3 bg-gray-50 p-4 rounded">
//                             <div className="text-xl font-bold text-gray-900">
//                                 Total: ${document.total.toFixed(2)}
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         )
//     };

//     return templates[template];
// };

// // Main Component
// export default function IntegratedInvoiceSystem() {
//     const [document, setDocument] = useState<DocumentData>({
//         id: '1',
//         type: 'invoice',
//         invoiceNumber: 'INV-2025-001',
//         date: '2025-06-11',
//         dueDate: '2025-07-11',
//         status: 'Draft',
//         companyInfo: {
//             name: 'Your Company',
//             address: '123 Business St\nCity, State 12345',
//             email: 'hello@yourcompany.com',
//             phone: '+1 (555) 123-4567',
//         },
//         toCompany: '',
//         toContact: '',
//         toAddress: '',
//         toEmail: '',
//         toPhone: '',
//         items: [{ id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }],
//         subtotal: 0,
//         taxRate: 0,
//         taxAmount: 0,
//         discountRate: 0,
//         discountAmount: 0,
//         total: 0,
//         notes: '',
//         terms: 'Payment is due within 30 days.',
//     });

//     const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate>('modern');
//     const [showPreview, setShowPreview] = useState(false);
//     const printRef = useRef<HTMLDivElement>(null);

//     const templates = [
//         { id: 'modern' as const, name: 'Modern', icon: Sparkles, color: 'from-blue-500 to-purple-600' },
//         { id: 'classic' as const, name: 'Classic', icon: Crown, color: 'from-gray-700 to-gray-900' },
//         { id: 'minimal' as const, name: 'Minimal', icon: Zap, color: 'from-gray-400 to-gray-600' },
//         { id: 'professional' as const, name: 'Professional', icon: Diamond, color: 'from-indigo-500 to-blue-600' }
//     ];

//     // Update calculations when items change
//     React.useEffect(() => {
//         const subtotal = document.items.reduce((sum, item) => sum + item.total, 0);
//         const discountAmount = (subtotal * document.discountRate) / 100;
//         const taxableAmount = subtotal - discountAmount;
//         const taxAmount = (taxableAmount * document.taxRate) / 100;
//         const total = taxableAmount + taxAmount;

//         setDocument(prev => ({
//             ...prev,
//             subtotal,
//             discountAmount,
//             taxAmount,
//             total
//         }));
//     }, [document.items, document.discountRate, document.taxRate]);

//     const addItem = () => {
//         const newItem: InvoiceItem = {
//             id: Date.now().toString(),
//             description: '',
//             quantity: 1,
//             unitPrice: 0,
//             total: 0
//         };
//         setDocument(prev => ({ ...prev, items: [...prev.items, newItem] }));
//     };

//     const removeItem = (itemId: string) => {
//         setDocument(prev => ({
//             ...prev,
//             items: prev.items.filter(item => item.id !== itemId)
//         }));
//     };

//     const updateItem = (itemId: string, field: keyof InvoiceItem, value: string | number) => {
//         setDocument(prev => ({
//             ...prev,
//             items: prev.items.map(item => {
//                 if (item.id === itemId) {
//                     const updatedItem = { ...item, [field]: value };
//                     if (field === 'quantity' || field === 'unitPrice') {
//                         updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
//                     }
//                     return updatedItem;
//                 }
//                 return item;
//             })
//         }));
//     };

//     const handleDownload = async () => {
//         if (printRef.current) {
//             try {
//                 const { jsPDF } = await import('jspdf');
//                 const html2canvas = (await import('html2canvas')).default;

//                 const canvas = await html2canvas(printRef.current);
//                 const imgData = canvas.toDataURL('image/png');

//                 const pdf = new jsPDF();
//                 const imgWidth = 210;
//                 const pageHeight = 295;
//                 const imgHeight = (canvas.height * imgWidth) / canvas.width;
//                 let heightLeft = imgHeight;

//                 let position = 0;

//                 pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
//                 heightLeft -= pageHeight;

//                 while (heightLeft >= 0) {
//                     position = heightLeft - imgHeight;
//                     pdf.addPage();
//                     pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
//                     heightLeft -= pageHeight;
//                 }

//                 pdf.save(`${document.type}-${document.invoiceNumber}.pdf`);
//             } catch (error) {
//                 console.error('Download failed:', error);
//                 alert('Download failed. Please try again.');
//             }
//         }
//     };

//     const handleSend = async () => {
//         if (!document.toEmail) {
//             alert('Please enter recipient email address');
//             return;
//         }

//         try {
//             // Simulate email sending
//             alert(`${document.type} sent successfully to ${document.toEmail}!`);
//         } catch (error) {
//             console.error('Send failed:', error);
//             alert('Failed to send email. Please try again.');
//         }
//     };

//     return (
//         <div className="min-h-screen bg-gray-50">
//             {/* Header */}
//             <div className="bg-white border-b border-gray-200 p-4">
//                 <div className="max-w-7xl mx-auto flex items-center justify-between">
//                     <div className="flex items-center space-x-3">
//                         <FileText className="w-8 h-8 text-blue-600" />
//                         <div>
//                             <h1 className="text-xl font-bold text-gray-900">Invoice System</h1>
//                             <p className="text-sm text-gray-600">Create and manage invoices</p>
//                         </div>
//                     </div>

//                     <div className="flex items-center space-x-3">
//                         <button
//                             onClick={() => setShowPreview(!showPreview)}
//                             className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${showPreview ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                                 }`}
//                         >
//                             <Eye className="w-4 h-4" />
//                             <span>Preview</span>
//                         </button>
//                         <button
//                             onClick={handleDownload}
//                             className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
//                         >
//                             <Download className="w-4 h-4" />
//                             <span>Download</span>
//                         </button>
//                         <button
//                             onClick={handleSend}
//                             className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
//                         >
//                             <Send className="w-4 h-4" />
//                             <span>Send</span>
//                         </button>
//                     </div>
//                 </div>
//             </div>

//             <div className="max-w-7xl mx-auto p-4">
//                 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
//                     {/* Form */}
//                     <div className="lg:col-span-2 space-y-6">
//                         {/* Document Details */}
//                         <div className="bg-white rounded-lg border border-gray-200 p-6">
//                             <h3 className="text-lg font-medium text-gray-900 mb-4">Document Details</h3>
//                             <div className="grid grid-cols-2 gap-4">
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
//                                     <select
//                                         value={document.type}
//                                         onChange={(e) => setDocument(prev => ({ ...prev, type: e.target.value as DocumentType }))}
//                                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                     >
//                                         <option value="invoice">Invoice</option>
//                                         <option value="quote">Quote</option>
//                                     </select>
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700 mb-1">Number</label>
//                                     <input
//                                         type="text"
//                                         value={document.invoiceNumber}
//                                         onChange={(e) => setDocument(prev => ({ ...prev, invoiceNumber: e.target.value }))}
//                                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
//                                     <input
//                                         type="date"
//                                         value={document.date}
//                                         onChange={(e) => setDocument(prev => ({ ...prev, date: e.target.value }))}
//                                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
//                                     <input
//                                         type="date"
//                                         value={document.dueDate}
//                                         onChange={(e) => setDocument(prev => ({ ...prev, dueDate: e.target.value }))}
//                                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                     />
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Bill To */}
//                         <div className="bg-white rounded-lg border border-gray-200 p-6">
//                             <h3 className="text-lg font-medium text-gray-900 mb-4">Bill To</h3>
//                             <div className="space-y-4">
//                                 <input
//                                     type="text"
//                                     placeholder="Company Name"
//                                     value={document.toCompany}
//                                     onChange={(e) => setDocument(prev => ({ ...prev, toCompany: e.target.value }))}
//                                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                 />
//                                 <input
//                                     type="text"
//                                     placeholder="Contact Person"
//                                     value={document.toContact}
//                                     onChange={(e) => setDocument(prev => ({ ...prev, toContact: e.target.value }))}
//                                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                 />
//                                 <input
//                                     type="email"
//                                     placeholder="Email"
//                                     value={document.toEmail}
//                                     onChange={(e) => setDocument(prev => ({ ...prev, toEmail: e.target.value }))}
//                                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                 />
//                             </div>
//                         </div>

//                         {/* Items */}
//                         <div className="bg-white rounded-lg border border-gray-200 p-6">
//                             <div className="flex items-center justify-between mb-4">
//                                 <h3 className="text-lg font-medium text-gray-900">Items</h3>
//                                 <button
//                                     onClick={addItem}
//                                     className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                                 >
//                                     <Plus className="w-4 h-4" />
//                                     <span>Add Item</span>
//                                 </button>
//                             </div>

//                             <div className="space-y-3">
//                                 {document.items.map((item) => (
//                                     <div key={item.id} className="grid grid-cols-12 gap-3 items-start">
//                                         <div className="col-span-6">
//                                             <input
//                                                 type="text"
//                                                 placeholder="Description"
//                                                 value={item.description}
//                                                 onChange={(e) => updateItem(item.id, 'description', e.target.value)}
//                                                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                             />
//                                         </div>
//                                         <div className="col-span-2">
//                                             <input
//                                                 type="number"
//                                                 placeholder="Qty"
//                                                 value={item.quantity}
//                                                 onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
//                                                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                             />
//                                         </div>
//                                         <div className="col-span-2">
//                                             <input
//                                                 type="number"
//                                                 placeholder="Price"
//                                                 value={item.unitPrice}
//                                                 onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
//                                                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                             />
//                                         </div>
//                                         <div className="col-span-1">
//                                             <span className="text-sm font-medium">${item.total.toFixed(2)}</span>
//                                         </div>
//                                         <div className="col-span-1">
//                                             {document.items.length > 1 && (
//                                                 <button
//                                                     onClick={() => removeItem(item.id)}
//                                                     className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
//                                                 >
//                                                     <Trash2 className="w-4 h-4" />
//                                                 </button>
//                                             )}
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>

//                         {/* Summary */}
//                         <div className="bg-white rounded-lg border border-gray-200 p-6">
//                             <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
//                             <div className="space-y-3">
//                                 <div className="flex justify-between">
//                                     <span>Subtotal:</span>
//                                     <span>${document.subtotal.toFixed(2)}</span>
//                                 </div>
//                                 <div className="flex items-center justify-between">
//                                     <span>Tax (%):</span>
//                                     <div className="flex items-center space-x-2">
//                                         <input
//                                             type="number"
//                                             value={document.taxRate}
//                                             onChange={(e) => setDocument(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
//                                             className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
//                                         />
//                                         <span>${document.taxAmount.toFixed(2)}</span>
//                                     </div>
//                                 </div>
//                                 <div className="border-t pt-3">
//                                     <div className="flex justify-between text-lg font-bold">
//                                         <span>Total:</span>
//                                         <span className="text-blue-600">${document.total.toFixed(2)}</span>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Template Selector */}
//                     <div className="lg:col-span-1">
//                         <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
//                             <h3 className="text-lg font-medium text-gray-900 mb-4">Templates</h3>
//                             <div className="space-y-3">
//                                 {templates.map((template) => {
//                                     const Icon = template.icon;
//                                     return (
//                                         <button
//                                             key={template.id}
//                                             onClick={() => setSelectedTemplate(template.id)}
//                                             className={`w-full p-3 rounded-lg transition-all flex items-center space-x-3 ${selectedTemplate === template.id
//                                                     ? `bg-gradient-to-r ${template.color} text-white`
//                                                     : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
//                                                 }`}
//                                         >
//                                             <Icon className="w-4 h-4" />
//                                             <span className="font-medium">{template.name}</span>
//                                         </button>
//                                     );
//                                 })}
//                             </div>
//                         </div>
//                     </div>

//                     {/* Preview */}
//                     {showPreview && (
//                         <div className="lg:col-span-1">
//                             <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
//                                 <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
//                                 <div className="transform scale-50 origin-top-left w-[200%]">
//                                     <div ref={printRef}>
//                                         <TemplateRenderer document={document} template={selectedTemplate} />
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }