// Your B2BFlowManager.tsx - Updated version
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
// Import the new refactored components
import { InvoiceSettingsProvider } from '@/lib/context/invoices/InvoiceSettingsProvider';
import MinimalIntegratedInvoiceSystem from './MinimalIntegratedInvoiceSystem';

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

// Wrap the main component with the context provider
export function B2BFlowManager({ onReconfigure, activityType }: B2BFlowManagerProps) {
  return (
    <InvoiceSettingsProvider>
      <B2BFlowManagerInner onReconfigure={onReconfigure} activityType={activityType} />
    </InvoiceSettingsProvider>
  );
}

// The actual component implementation
function B2BFlowManagerInner({ onReconfigure, activityType }: B2BFlowManagerProps) {
  const { token, user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('Contact');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [companyDealView, setCompanyDealView] = useState<'company' | 'deal'>('company');
  
  // Invoice Modal State (keeping for backward compatibility if needed)
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

  // Convert B2B contacts to invoice contacts format
  const getInvoiceContacts = () => {
    return contacts.map(contact => ({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company
    }));
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
        return (
          <MinimalIntegratedInvoiceSystem
            contacts={getInvoiceContacts()}
            companyInfo={defaultCompanyInfo}
            showHeader={false}
          />
        );
      case 'Settings':
        // return <SettingsView onReconfigure={onReconfigure} activityType={activityType} />;
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
            <p className="text-gray-600">Settings view coming soon...</p>
          </div>
        );
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
            
            {/* Search and Filter Controls - Hide for Invoice and Settings tab */}
            {!['Invoice', 'Settings'].includes(activeTab) && (
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