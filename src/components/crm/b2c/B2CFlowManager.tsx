"use client";
import { useState, useContext } from 'react';
import { AuthContext } from "@/lib/context/auth";
import { Search, Filter, Menu, X } from 'lucide-react';
import { ContactsView } from './ContactsView';
import { SettingsView } from './SettingsView';
import { DealsView } from './DealsView';

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

interface B2CFlowManagerProps {
  onReconfigure: () => void;
}

export function B2CFlowManager({ onReconfigure }: B2CFlowManagerProps) {
  const { token, user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('Contact');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const tabs = [
    { id: 'Contact', label: 'Contact' },
    { id: 'Deal', label: 'Deal' },
    { id: 'Settings', label: 'Settings' }
  ];

  const handleContactAdded = (newContact: Contact) => {
    setContacts(prevContacts => [newContact, ...prevContacts]);
  };

  const handleContactsUpdate = (updatedContacts: Contact[]) => {
    setContacts(updatedContacts);
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
      case 'Deal':
        return (
          <DealsView 
            onReconfigure={onReconfigure}
            contactsFromContactView={contacts}
          />
        );
      case 'Settings':
        return <SettingsView onReconfigure={onReconfigure} />;
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
            
            {/* Search and Filter Controls - Only show for Contact and Deal tabs */}
            {(activeTab === 'Contact' || activeTab === 'Deal') && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                <button className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder={activeTab === 'Contact' ? "Search contacts..." : "Search deals..."}
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