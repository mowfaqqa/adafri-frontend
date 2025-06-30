// components/Invoice/InvoiceOverview.tsx
"use client";
import { useState, useContext } from 'react';
import { ArrowLeft, Settings, Upload, Plus, Users, Check, AlertCircle } from 'lucide-react';
import { InvoiceManager } from '@/components/invoice/InvoiceManager';
import { AuthContext } from "@/lib/context/auth"
import type { CompanyInfo, Contact } from '@/lib/types/invoice/types';
import { CSVUploadModal, ContactFormData } from '../crm/b2c/modals/CSVUploadModal';
import { AddContactModal } from '../crm/b2c/modals/AddContactModal';

export default function InvoiceOverview() {
  const { user } = useContext(AuthContext);
  
  // Contact management state
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  
  // Sample data - you would typically fetch this from your API
  const [companyInfo] = useState<CompanyInfo>({
    name: 'Your Company Name',
    address: 'Your Address\nCity, State ZIP',
    email: 'your@email.com',
    phone: '+1 (555) 000-0000',
    taxId: 'TAX123456789',
    companyId: 'REG987654321'
  });

  const [contacts, setContacts] = useState<Contact[]>([
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
  ]);

  const handleGoBack = () => {
    window.history.back();
  };

  // Handle CSV upload for contacts
  const handleCSVUpload = (csvContacts: ContactFormData[]) => {
    const newContacts: Contact[] = csvContacts.map((contactData, index) => ({
      id: `csv_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      name: contactData.name,
      email: contactData.email,
      phone: contactData.phone,
      company: contactData.company,
    }));

    setContacts(prev => [...newContacts, ...prev]);
    
    setUploadStatus({
      type: 'success',
      message: `Successfully imported ${newContacts.length} contacts from CSV`
    });
    
    setTimeout(() => {
      setUploadStatus({ type: null, message: '' });
    }, 5000);
    
    setIsCSVModalOpen(false);
  };

  // Handle adding new contact manually
  const handleAddContact = () => {
    setIsAddContactModalOpen(true);
  };

  // Handle saving contact from AddContactModal
  const handleSubmitContact = (contactData: ContactFormData) => {
    const newContact: Contact = {
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: contactData.name,
      email: contactData.email,
      phone: contactData.phone,
      company: contactData.company,
    };

    setContacts(prev => [newContact, ...prev]);
    
    setUploadStatus({
      type: 'success',
      message: `Successfully added ${newContact.name} to your contacts`
    });
    
    setTimeout(() => {
      setUploadStatus({ type: null, message: '' });
    }, 5000);
  };

  return (
    <div className="min-h-screen">
      {/* Upload Status */}
      {uploadStatus.type && (
        <div className={`mx-4 sm:mx-6 lg:mx-8 mt-4 px-4 py-3 rounded-lg ${
          uploadStatus.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {uploadStatus.type === 'success' ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-sm ${
              uploadStatus.type === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>
              {uploadStatus.message}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoBack}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Invoice Management</h1>
                <p className="text-sm text-gray-600">Create and manage your invoices</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Contact Management Buttons */}
              <button 
                onClick={() => setIsCSVModalOpen(true)}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Import Contacts"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Import CSV</span>
              </button>
              
              <button 
                onClick={handleAddContact}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Add Contact"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Add Contact</span>
              </button>

              <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              {user && (
                <div className="text-sm text-gray-600">
                  {/* {user.name || user.email} */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contact Stats Bar */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">
                  {contacts.length} Contacts Available
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setIsCSVModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Upload className="w-4 h-4" />
                <span>Import CSV</span>
              </button>
              <button 
                onClick={handleAddContact}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Contact</span>
              </button>
            </div>
          </div>
        </div>

        <InvoiceManager
          contacts={contacts}
          companyInfo={companyInfo}
          showHeader={true}
          className="max-w-none"
          onInvoiceChange={(invoices) => {
            // Handle invoice changes - e.g., save to database
            console.log('Invoices updated:', invoices.length);
          }}
        />
      </div>

      {/* CSV Upload Modal */}
      <CSVUploadModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onUpload={handleCSVUpload}
      />

      {/* Add Contact Modal */}
      <AddContactModal
        isOpen={isAddContactModalOpen}
        onClose={() => setIsAddContactModalOpen(false)}
        onSubmit={handleSubmitContact}
      />
    </div>
  );
}