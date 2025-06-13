"use client";
import { useState, useContext, useCallback } from 'react';
import { AuthContext } from "@/lib/context/auth";
import { Search, Filter, Menu, X, Building, DollarSign, FileText, Plus, Eye } from 'lucide-react';
import { CompanyDealsView } from './CompanyDealsView';
import { SettingsView } from '../b2c/SettingsView';
import { ContactsView } from '../b2c/ContactsView';
import { InvoiceModal } from './modals/InvoiceModal';
import { InvoiceViewModal } from './modals/InvoiceViewModal';
import type { DocumentData, CompanyInfo } from '@/lib/types/invoice/types';
import { InvoiceTypeConverter } from '@/lib/utils/invoice/invoiceTypeConverter';

interface Contact {
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

interface Company {
  id: string;
  name: string;
  industry: string;
  size: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  status: 'Active' | 'Prospect' | 'Partner' | 'Inactive';
  lastActivity: string;
  contactCount: number;
  dealValue: number;
}

interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: 'Prospecting' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  probability: number;
  expectedCloseDate: string;
  lastActivity: string;
  contactPerson: string;
}

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

interface B2BFlowManagerProps {
  onReconfigure: () => void;
  activityType: 'B2B' | 'B2B2C' | 'B2G';
}

export function B2BFlowManager({ onReconfigure, activityType }: B2BFlowManagerProps) {
  const { token, user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('Contact');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [companyDealView, setCompanyDealView] = useState<'company' | 'deal'>('company');
  
  // Invoice Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceData | null>(null);
  
  // Invoice View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<InvoiceData | null>(null);

  // Default company info (you might want to load this from settings)
  const defaultCompanyInfo: CompanyInfo = {
    name: 'Your Company Name',
    address: 'Your Address\nCity, State ZIP',
    email: 'your@email.com',
    phone: '+1 (555) 000-0000',
  };

  const tabs = [
    { id: 'Contact', label: 'Contact' },
    { id: 'CompanyDeal', label: activityType === 'B2G' ? 'Government/Deal' : 'Company/Deal' },
    { id: 'Invoice', label: 'Invoices' },
    { id: 'Settings', label: 'Settings' }
  ];

  // Memoized callback functions to prevent unnecessary re-renders
  const handleContactAdded = useCallback((newContact: Contact) => {
    setContacts(prevContacts => [newContact, ...prevContacts]);
  }, []);

  const handleContactsUpdate = useCallback((updatedContacts: Contact[]) => {
    setContacts(updatedContacts);
  }, []);

  const handleCompanyAdded = useCallback((newCompany: Company) => {
    setCompanies(prevCompanies => [newCompany, ...prevCompanies]);
  }, []);

  const handleCompaniesUpdate = useCallback((updatedCompanies: Company[]) => {
    setCompanies(updatedCompanies);
  }, []);

  const handleDealAdded = useCallback((newDeal: Deal) => {
    setDeals(prevDeals => [newDeal, ...prevDeals]);
  }, []);

  const handleDealsUpdate = useCallback((updatedDeals: Deal[]) => {
    setDeals(updatedDeals);
  }, []);

  // Invoice handlers
  const handleInvoiceSave = useCallback((documentData: DocumentData) => {
    // Convert DocumentData to InvoiceData
    const invoiceData = InvoiceTypeConverter.documentDataToInvoiceData(documentData);
    
    setInvoices(prevInvoices => {
      const existingIndex = prevInvoices.findIndex(inv => inv.id === invoiceData.id);
      if (existingIndex >= 0) {
        // Update existing invoice
        const updated = [...prevInvoices];
        updated[existingIndex] = invoiceData;
        return updated;
      } else {
        // Add new invoice
        return [invoiceData, ...prevInvoices];
      }
    });
  }, []);

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
      setInvoices(prevInvoices => prevInvoices.filter(inv => inv.id !== invoiceId));
    }
  };

  const handleEditFromView = (invoice: InvoiceData) => {
    setIsViewModalOpen(false);
    setEditingInvoice(invoice);
    setIsInvoiceModalOpen(true);
  };

  const handleDownloadFromView = (invoice: InvoiceData) => {
    // This would trigger the PDF download functionality
    // You can implement this based on your PDF generation logic
    console.log('Download invoice:', invoice.invoiceNumber);
    // Example: trigger PDF generation here
  };

  const getPageTitle = () => {
    switch (activityType) {
      case 'B2B':
        return 'Business to Business';
      case 'B2B2C':
        return 'Business to Business to Consumer';
      case 'B2G':
        return 'Business to Government';
      default:
        return activityType;
    }
  };

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'Contact':
        return "Search contacts...";
      case 'CompanyDeal':
        return activityType === 'B2G' ? "Search government entities & deals..." : "Search companies & deals...";
      case 'Invoice':
        return "Search invoices...";
      default:
        return "Search...";
    }
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

  const renderInvoiceView = () => {
    return (
      <div className="space-y-6">
        {/* Invoice Header */}
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

        {/* Invoice Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {invoices.filter(inv => inv.status === 'Paid').length}
                </p>
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
                <p className="text-2xl font-bold text-blue-600">
                  {invoices.filter(inv => inv.status === 'Sent').length}
                </p>
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
                <p className="text-2xl font-bold text-red-600">
                  {invoices.filter(inv => inv.status === 'Overdue').length}
                </p>
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
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteInvoice(invoice.id);
                            }}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Delete"
                          >
                            Delete
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
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Contact':
        return (
          <ContactsView 
            onReconfigure={onReconfigure}
            onContactAdded={handleContactAdded}
            onContactsUpdate={handleContactsUpdate}
          />
        );
      case 'CompanyDeal':
        return (
          <div className="space-y-4">
            {/* View Toggle for Company/Deal */}
            <div className="flex items-center justify-between">
              <div className="bg-gray-200 rounded-xl p-1 inline-flex">
                <button
                  onClick={() => setCompanyDealView('company')}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                    companyDealView === 'company'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>{activityType === 'B2G' ? 'Government' : 'Companies'}</span>
                </button>
                <button
                  onClick={() => setCompanyDealView('deal')}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                    companyDealView === 'deal'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Deals</span>
                </button>
              </div>
            </div>

            {/* Company/Deal View */}
            <CompanyDealsView 
              onReconfigure={onReconfigure}
              viewType={companyDealView}
              activityType={activityType}
              contactsFromContactView={contacts}
              companiesFromCompanyView={companies}
              onCompanyAdded={handleCompanyAdded}
              onCompaniesUpdate={handleCompaniesUpdate}
              onDealAdded={handleDealAdded}
              onDealsUpdate={handleDealsUpdate}
            />
          </div>
        );
      case 'Invoice':
        return renderInvoiceView();
      case 'Settings':
        // return <SettingsView onReconfigure={onReconfigure} activityType={activityType} />;
      default:
        return (
          <ContactsView 
            onReconfigure={onReconfigure}
            onContactAdded={handleContactAdded}
            onContactsUpdate={handleContactsUpdate}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Activity Type Badge */}
      <div className="px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
              {activityType}
            </div>
            <h2 className="text-sm text-gray-600 hidden sm:block">{getPageTitle()}</h2>
          </div>
          <div className="text-xs text-gray-500">
            {/* {user?.name || user?.email || 'User'} */}
          </div>
        </div>
      </div>

      {/* Header with Tabs */}
      <div className="px-4 sm:px-6 py-4">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-900">
            {tabs.find(tab => tab.id === activeTab)?.label}
          </h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-200"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Desktop Tabs and Mobile Menu */}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Tabs Container */}
            <div className="bg-gray-200 rounded-xl p-1 inline-flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Search and Filter Controls - Hide for Settings tab */}
            {activeTab !== 'Settings' && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                <button className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder={getSearchPlaceholder()}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64 bg-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Tab Pills (Alternative Layout) */}
        <div className="md:hidden mt-4">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
                >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 px-4 sm:px-6">
        {renderTabContent()}
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setEditingInvoice(null);
        }}
        onSave={handleInvoiceSave}
        editingDocument={editingInvoice ? InvoiceTypeConverter.invoiceDataToDocumentData(editingInvoice) : null}
        contacts={InvoiceTypeConverter.b2bContactsToContacts(contacts)}
        companyInfo={defaultCompanyInfo}
      />

      {/* Invoice View Modal */}
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

      {/* Debug/Reconfigure button */}
      <button
        onClick={onReconfigure}
        className="fixed top-4 right-4 px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded hover:bg-gray-300 z-50"
      >
        Reconfigure
      </button>
    </div>
  );
}

































// "use client";
// import { useState, useContext, useCallback } from 'react';
// import { AuthContext } from "@/lib/context/auth";
// import { Search, Filter, Menu, X, Building, DollarSign } from 'lucide-react';
// import { CompanyDealsView } from './CompanyDealsView';
// import { SettingsView } from '../b2c/SettingsView';
// import { ContactsView } from '../b2c/ContactsView';
// // import { B2BContactView } from './B2BContactView';


// interface Contact {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
//   company: string;
//   website: string;
//   status: 'Active Client' | 'Prospection' | 'Supplier' | 'Add Segment' | string;
//   lastActivity: string;
//   isSelected?: boolean;
//   customSegment?: string;
// }

// interface Company {
//   id: string;
//   name: string;
//   industry: string;
//   size: string;
//   website: string;
//   email: string;
//   phone: string;
//   address: string;
//   status: 'Active' | 'Prospect' | 'Partner' | 'Inactive';
//   lastActivity: string;
//   contactCount: number;
//   dealValue: number;
// }

// interface Deal {
//   id: string;
//   title: string;
//   company: string;
//   value: number;
//   stage: 'Prospecting' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
//   probability: number;
//   expectedCloseDate: string;
//   lastActivity: string;
//   contactPerson: string;
// }

// interface B2BFlowManagerProps {
//   onReconfigure: () => void;
//   activityType: 'B2B' | 'B2B2C' | 'B2G';
// }

// export function B2BFlowManager({ onReconfigure, activityType }: B2BFlowManagerProps) {
//   const { token, user } = useContext(AuthContext);
//   const [activeTab, setActiveTab] = useState('Contact');
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [contacts, setContacts] = useState<Contact[]>([]);
//   const [companies, setCompanies] = useState<Company[]>([]);
//   const [deals, setDeals] = useState<Deal[]>([]);
//   const [companyDealView, setCompanyDealView] = useState<'company' | 'deal'>('company');

//   const tabs = [
//     { id: 'Contact', label: 'Contact' },
//     { id: 'CompanyDeal', label: activityType === 'B2G' ? 'Government/Deal' : 'Company/Deal' },
//     { id: 'Settings', label: 'Settings' }
//   ];

//   // Memoized callback functions to prevent unnecessary re-renders
//   const handleContactAdded = useCallback((newContact: Contact) => {
//     setContacts(prevContacts => [newContact, ...prevContacts]);
//   }, []);

//   const handleContactsUpdate = useCallback((updatedContacts: Contact[]) => {
//     setContacts(updatedContacts);
//   }, []);

//   const handleCompanyAdded = useCallback((newCompany: Company) => {
//     setCompanies(prevCompanies => [newCompany, ...prevCompanies]);
//   }, []);

//   const handleCompaniesUpdate = useCallback((updatedCompanies: Company[]) => {
//     setCompanies(updatedCompanies);
//   }, []);

//   const handleDealAdded = useCallback((newDeal: Deal) => {
//     setDeals(prevDeals => [newDeal, ...prevDeals]);
//   }, []);

//   const handleDealsUpdate = useCallback((updatedDeals: Deal[]) => {
//     setDeals(updatedDeals);
//   }, []);

//   const getPageTitle = () => {
//     switch (activityType) {
//       case 'B2B':
//         return 'Business to Business';
//       case 'B2B2C':
//         return 'Business to Business to Consumer';
//       case 'B2G':
//         return 'Business to Government';
//       default:
//         return activityType;
//     }
//   };

//   const getSearchPlaceholder = () => {
//     switch (activeTab) {
//       case 'Contact':
//         return "Search contacts...";
//       case 'CompanyDeal':
//         return activityType === 'B2G' ? "Search government entities & deals..." : "Search companies & deals...";
//       default:
//         return "Search...";
//     }
//   };

//   const renderTabContent = () => {
//     switch (activeTab) {
//       case 'Contact':
//         return (
//           <ContactsView 
//             onReconfigure={onReconfigure}
//             onContactAdded={handleContactAdded}
//             onContactsUpdate={handleContactsUpdate}
//             // activityType={activityType}
//           />
//         );
//       case 'CompanyDeal':
//         return (
//           <div className="space-y-4">
//             {/* View Toggle for Company/Deal */}
//             <div className="flex items-center justify-between">
//               <div className="bg-gray-200 rounded-xl p-1 inline-flex">
//                 <button
//                   onClick={() => setCompanyDealView('company')}
//                   className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
//                     companyDealView === 'company'
//                       ? 'bg-white text-gray-900 shadow-sm'
//                       : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
//                   }`}
//                 >
//                   <Building className="w-4 h-4" />
//                   <span>{activityType === 'B2G' ? 'Government' : 'Companies'}</span>
//                 </button>
//                 <button
//                   onClick={() => setCompanyDealView('deal')}
//                   className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
//                     companyDealView === 'deal'
//                       ? 'bg-white text-gray-900 shadow-sm'
//                       : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
//                   }`}
//                 >
//                   <DollarSign className="w-4 h-4" />
//                   <span>Deals</span>
//                 </button>
//               </div>
//             </div>

//             {/* Company/Deal View */}
//             <CompanyDealsView 
//               onReconfigure={onReconfigure}
//               viewType={companyDealView}
//               activityType={activityType}
//               contactsFromContactView={contacts}
//               companiesFromCompanyView={companies}
//               onCompanyAdded={handleCompanyAdded}
//               onCompaniesUpdate={handleCompaniesUpdate}
//               onDealAdded={handleDealAdded}
//               onDealsUpdate={handleDealsUpdate}
//             />
//           </div>
//         );
//       case 'Settings':
//         return // <SettingsView onReconfigure={onReconfigure} activityType={activityType} />;
//       default:
//         return (
//           <ContactsView 
//             onReconfigure={onReconfigure}
//             onContactAdded={handleContactAdded}
//             onContactsUpdate={handleContactsUpdate}
//             // activityType={activityType}
//           />
//         );
//     }
//   };

//   return (
//     <div className="min-h-screen bg-white">
//       {/* Header with Activity Type Badge */}
//       <div className="px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-3">
//             <div className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
//               {activityType}
//             </div>
//             <h2 className="text-sm text-gray-600 hidden sm:block">{getPageTitle()}</h2>
//           </div>
//           <div className="text-xs text-gray-500">
//             {/* {user?.name || user?.email || 'User'} */}
//           </div>
//         </div>
//       </div>

//       {/* Header with Tabs */}
//       <div className="px-4 sm:px-6 py-4">
//         {/* Mobile Header */}
//         <div className="md:hidden flex items-center justify-between mb-4">
//           <h1 className="text-lg font-semibold text-gray-900">
//             {tabs.find(tab => tab.id === activeTab)?.label}
//           </h1>
//           <button
//             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//             className="p-2 rounded-lg text-gray-600 hover:bg-gray-200"
//           >
//             {isMobileMenuOpen ? (
//               <X className="w-5 h-5" />
//             ) : (
//               <Menu className="w-5 h-5" />
//             )}
//           </button>
//         </div>

//         {/* Desktop Tabs and Mobile Menu */}
//         <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block`}>
//           <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
//             {/* Tabs Container */}
//             <div className="bg-gray-200 rounded-xl p-1 inline-flex">
//               {tabs.map((tab) => (
//                 <button
//                   key={tab.id}
//                   onClick={() => {
//                     setActiveTab(tab.id);
//                     setIsMobileMenuOpen(false);
//                   }}
//                   className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
//                     activeTab === tab.id
//                       ? 'bg-white text-gray-900 shadow-sm'
//                       : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
//                   }`}
//                 >
//                   {tab.label}
//                 </button>
//               ))}
//             </div>
            
//             {/* Search and Filter Controls - Hide for Settings tab */}
//             {activeTab !== 'Settings' && (
//               <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
//                 <button className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white">
//                   <Filter className="w-4 h-4" />
//                   <span>Filter</span>
//                 </button>
                
//                 <div className="relative">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                   <input
//                     type="text"
//                     placeholder={getSearchPlaceholder()}
//                     className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64 bg-white"
//                   />
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Mobile Tab Pills (Alternative Layout) */}
//         <div className="md:hidden mt-4">
//           <div className="flex space-x-2 overflow-x-auto pb-2">
//             {tabs.map((tab) => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
//                   activeTab === tab.id
//                     ? 'bg-blue-100 text-blue-700 border border-blue-200'
//                     : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
//                 }`}
//                 >
//                 {tab.label}
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Tab Content */}
//       <div className="flex-1 px-4 sm:px-6">
//         {renderTabContent()}
//       </div>

//       {/* Debug/Reconfigure button */}
//       <button
//         onClick={onReconfigure}
//         className="fixed top-4 right-4 px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded hover:bg-gray-300 z-50"
//       >
//         Reconfigure
//       </button>
//     </div>
//   );
// }