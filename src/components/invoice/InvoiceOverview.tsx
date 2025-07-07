// components/invoices/InvoiceOverview.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Settings, Users, Building, Download, Upload } from 'lucide-react';
import { InvoiceSettingsProvider } from '@/lib/context/invoices/InvoiceSettingsProvider';
import type { Contact, CompanyInfo } from '@/lib/types/invoice/types';
import MinimalIntegratedInvoiceSystem from '../crm/b2b/MinimalIntegratedInvoiceSystem';

interface InvoiceOverviewProps {
  /** Optional callback when user wants to go back */
  onBack?: () => void;
  /** Show back button */
  showBackButton?: boolean;
  /** Custom page title */
  pageTitle?: string;
  /** Additional CSS classes */
  className?: string;
}

// Wrapper component that provides context
export function InvoiceOverview({ 
  onBack, 
  showBackButton = false, 
  pageTitle = "Invoice Management",
  className = ""
}: InvoiceOverviewProps) {
  return (
    <InvoiceSettingsProvider>
      <InvoiceOverviewInner 
        onBack={onBack}
        showBackButton={showBackButton}
        pageTitle={pageTitle}
        className={className}
      />
    </InvoiceSettingsProvider>
  );
}

// The actual component implementation
function InvoiceOverviewInner({ 
  onBack, 
  showBackButton, 
  pageTitle,
  className 
}: InvoiceOverviewProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<'invoices' | 'analytics' | 'settings'>('invoices');

  // Default company info - you might want to load this from your settings/context
  const defaultCompanyInfo: CompanyInfo = {
    name: 'Your Company Name',
    address: 'Your Business Address\nCity, State ZIP Code',
    email: 'contact@yourcompany.com',
    phone: '+1 (555) 123-4567',
  };

  // Load contacts from your data source (localStorage, API, etc.)
  useEffect(() => {
    loadContacts();
    loadCompanies();
  }, []);

  const loadContacts = async () => {
    try {
      // Load from localStorage or API
      const savedContacts = localStorage.getItem('crm_contacts');
      if (savedContacts) {
        const parsedContacts = JSON.parse(savedContacts);
        // Convert CRM contacts to invoice contacts format
        const invoiceContacts = parsedContacts.map((contact: any) => ({
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          company: contact.company || ''
        }));
        setContacts(invoiceContacts);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadCompanies = async () => {
    try {
      // Load companies if you have them stored
      const savedCompanies = localStorage.getItem('crm_companies');
      if (savedCompanies) {
        setCompanies(JSON.parse(savedCompanies));
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const handleExportData = () => {
    // Implement export functionality
    console.log('Export invoice data');
  };

  const handleImportData = () => {
    // Implement import functionality
    console.log('Import invoice data');
  };

  // const renderQuickActions = () => (
  //   <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
  //     <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
  //     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  //       <button
  //         onClick={() => setActiveView('invoices')}
  //         className={`p-4 rounded-lg border-2 transition-all duration-200 ${
  //           activeView === 'invoices'
  //             ? 'border-blue-500 bg-blue-50'
  //             : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
  //         }`}
  //       >
  //         <FileText className="w-8 h-8 text-blue-600 mb-2" />
  //         <div className="text-sm font-medium text-gray-900">Invoices</div>
  //         <div className="text-xs text-gray-500">Manage invoices & quotes</div>
  //       </button>

  //       <button
  //         onClick={() => setActiveView('analytics')}
  //         className={`p-4 rounded-lg border-2 transition-all duration-200 ${
  //           activeView === 'analytics'
  //             ? 'border-green-500 bg-green-50'
  //             : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
  //         }`}
  //       >
  //         <Building className="w-8 h-8 text-green-600 mb-2" />
  //         <div className="text-sm font-medium text-gray-900">Analytics</div>
  //         <div className="text-xs text-gray-500">View reports & insights</div>
  //       </button>

  //       <button
  //         onClick={handleExportData}
  //         className="p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
  //       >
  //         <Download className="w-8 h-8 text-purple-600 mb-2" />
  //         <div className="text-sm font-medium text-gray-900">Export</div>
  //         <div className="text-xs text-gray-500">Download invoice data</div>
  //       </button>

  //       <button
  //         onClick={handleImportData}
  //         className="p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
  //       >
  //         <Upload className="w-8 h-8 text-orange-600 mb-2" />
  //         <div className="text-sm font-medium text-gray-900">Import</div>
  //         <div className="text-xs text-gray-500">Import existing data</div>
  //       </button>
  //     </div>
  //   </div>
  // );

  const renderAnalytics = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Analytics</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue Chart Placeholder */}
        <div className="col-span-2">
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Revenue Chart</p>
              <p className="text-sm text-gray-400">Coming soon...</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-900">0</div>
            <div className="text-sm text-blue-700">Total Invoices</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-900">$0</div>
            <div className="text-sm text-green-700">Total Revenue</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-900">0</div>
            <div className="text-sm text-yellow-700">Pending Invoices</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMainContent = () => {
    switch (activeView) {
      case 'analytics':
        return renderAnalytics();
      case 'settings':
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Settings</h3>
            <p className="text-gray-600">Settings and preferences will be available here.</p>
          </div>
        );
      default:
        return (
          <MinimalIntegratedInvoiceSystem
            contacts={contacts}
            companyInfo={defaultCompanyInfo}
            showHeader={true}
          />
        );
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {showBackButton && onBack && (
                <button
                  onClick={onBack}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
                <p className="text-sm text-gray-600">
                  Create, manage, and track your invoices and quotes
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setActiveView('settings')}
                className={`p-2 rounded-lg transition-colors ${
                  activeView === 'settings'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <button
                onClick={loadContacts}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                title="Refresh contacts"
              >
                <Users className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions - only show on invoices view */}
        {/* {activeView === 'invoices' && renderQuickActions()} */}
        
        {/* Main Content Area */}
        {renderMainContent()}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Invoice Management System
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-400">
                {contacts.length} contacts loaded
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default InvoiceOverview;


















































// // components/Invoice/InvoiceOverview.tsx
// "use client";
// import { useState, useContext } from 'react';
// import { ArrowLeft, Settings, Upload, Plus, Users, Check, AlertCircle } from 'lucide-react';
// import { InvoiceManager } from '@/components/invoice/InvoiceManager';
// import { AuthContext } from "@/lib/context/auth"
// import type { CompanyInfo, Contact } from '@/lib/types/invoice/types';
// import { CSVUploadModal, ContactFormData } from '../crm/b2c/modals/CSVUploadModal';
// import { AddContactModal } from '../crm/b2c/modals/AddContactModal';

// export default function InvoiceOverview() {
//   const { user } = useContext(AuthContext);
  
//   // Contact management state
//   const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
//   const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
//   const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  
//   // Sample data - you would typically fetch this from your API
//   const [companyInfo] = useState<CompanyInfo>({
//     name: 'Your Company Name',
//     address: 'Your Address\nCity, State ZIP',
//     email: 'your@email.com',
//     phone: '+1 (555) 000-0000',
//     taxId: 'TAX123456789',
//     companyId: 'REG987654321'
//   });

//   const [contacts, setContacts] = useState<Contact[]>([
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
//   ]);

//   const handleGoBack = () => {
//     window.history.back();
//   };

//   // Handle CSV upload for contacts
//   const handleCSVUpload = (csvContacts: ContactFormData[]) => {
//     const newContacts: Contact[] = csvContacts.map((contactData, index) => ({
//       id: `csv_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
//       name: contactData.name,
//       email: contactData.email,
//       phone: contactData.phone,
//       company: contactData.company,
//     }));

//     setContacts(prev => [...newContacts, ...prev]);
    
//     setUploadStatus({
//       type: 'success',
//       message: `Successfully imported ${newContacts.length} contacts from CSV`
//     });
    
//     setTimeout(() => {
//       setUploadStatus({ type: null, message: '' });
//     }, 5000);
    
//     setIsCSVModalOpen(false);
//   };

//   // Handle adding new contact manually
//   const handleAddContact = () => {
//     setIsAddContactModalOpen(true);
//   };

//   // Handle saving contact from AddContactModal
//   const handleSubmitContact = (contactData: ContactFormData) => {
//     const newContact: Contact = {
//       id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//       name: contactData.name,
//       email: contactData.email,
//       phone: contactData.phone,
//       company: contactData.company,
//     };

//     setContacts(prev => [newContact, ...prev]);
    
//     setUploadStatus({
//       type: 'success',
//       message: `Successfully added ${newContact.name} to your contacts`
//     });
    
//     setTimeout(() => {
//       setUploadStatus({ type: null, message: '' });
//     }, 5000);
//   };

//   return (
//     <div className="min-h-screen">
//       {/* Upload Status */}
//       {uploadStatus.type && (
//         <div className={`mx-4 sm:mx-6 lg:mx-8 mt-4 px-4 py-3 rounded-lg ${
//           uploadStatus.type === 'success' 
//             ? 'bg-green-50 border border-green-200' 
//             : 'bg-red-50 border border-red-200'
//         }`}>
//           <div className="flex items-center space-x-2">
//             {uploadStatus.type === 'success' ? (
//               <Check className="w-4 h-4 text-green-600" />
//             ) : (
//               <AlertCircle className="w-4 h-4 text-red-600" />
//             )}
//             <span className={`text-sm ${
//               uploadStatus.type === 'success' ? 'text-green-700' : 'text-red-700'
//             }`}>
//               {uploadStatus.message}
//             </span>
//           </div>
//         </div>
//       )}

//       {/* Header */}
//       <div className="bg-white border-b border-gray-200">
//         <div className="mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between h-16">
//             <div className="flex items-center space-x-4">
//               <button
//                 onClick={handleGoBack}
//                 className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
//               >
//                 <ArrowLeft className="w-5 h-5" />
//               </button>
//               <div>
//                 <h1 className="text-xl font-semibold text-gray-900">Invoice Management</h1>
//                 <p className="text-sm text-gray-600">Create and manage your invoices</p>
//               </div>
//             </div>
            
//             <div className="flex items-center space-x-3">
//               {/* Contact Management Buttons */}
//               <button 
//                 onClick={() => setIsCSVModalOpen(true)}
//                 className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//                 title="Import Contacts"
//               >
//                 <Upload className="w-4 h-4" />
//                 <span className="hidden sm:inline text-sm">Import CSV</span>
//               </button>
              
//               <button 
//                 onClick={handleAddContact}
//                 className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//                 title="Add Contact"
//               >
//                 <Users className="w-4 h-4" />
//                 <span className="hidden sm:inline text-sm">Add Contact</span>
//               </button>

//               <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
//                 <Settings className="w-5 h-5" />
//               </button>
//               {user && (
//                 <div className="text-sm text-gray-600">
//                   {/* {user.name || user.email} */}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Contact Stats Bar */}
//         <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-4">
//               <div className="flex items-center space-x-2">
//                 <Users className="w-5 h-5 text-blue-600" />
//                 <span className="text-sm font-medium text-gray-900">
//                   {contacts.length} Contacts Available
//                 </span>
//               </div>
//             </div>
//             <div className="flex items-center space-x-3">
//               <button 
//                 onClick={() => setIsCSVModalOpen(true)}
//                 className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
//               >
//                 <Upload className="w-4 h-4" />
//                 <span>Import CSV</span>
//               </button>
//               <button 
//                 onClick={handleAddContact}
//                 className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
//               >
//                 <Plus className="w-4 h-4" />
//                 <span>Add Contact</span>
//               </button>
//             </div>
//           </div>
//         </div>

//         <InvoiceManager
//           contacts={contacts}
//           companyInfo={companyInfo}
//           showHeader={true}
//           className="max-w-none"
//           onInvoiceChange={(invoices) => {
//             // Handle invoice changes - e.g., save to database
//             console.log('Invoices updated:', invoices.length);
//           }}
//         />
//       </div>

//       {/* CSV Upload Modal */}
//       <CSVUploadModal
//         isOpen={isCSVModalOpen}
//         onClose={() => setIsCSVModalOpen(false)}
//         onUpload={handleCSVUpload}
//       />

//       {/* Add Contact Modal */}
//       <AddContactModal
//         isOpen={isAddContactModalOpen}
//         onClose={() => setIsAddContactModalOpen(false)}
//         onSubmit={handleSubmitContact}
//       />
//     </div>
//   );
// }