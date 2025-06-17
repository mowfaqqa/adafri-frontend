"use client";
import { useState, useContext, useEffect } from 'react';
import { AuthContext } from "@/lib/context/auth";
import { Search, Plus, ChevronLeft, ChevronRight, Upload, Check, AlertCircle } from 'lucide-react';
import { AddContactModal, ContactFormData } from './modals/AddContactModal';
import { CSVUploadModal } from './modals/CSVUploadModal';
import Image from 'next/image';
import ContactTable from './ContactTable';

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

interface ContactsViewProps {
  onReconfigure: () => void;
  onContactAdded?: (contact: Contact) => void;
  onContactsUpdate?: (contacts: Contact[]) => void;
  initialContacts?: Contact[];
}

export function ContactsView({ onReconfigure, onContactAdded, onContactsUpdate, initialContacts = [] }: ContactsViewProps) {
  const { token, user } = useContext(AuthContext);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const contactsPerPage = 12;

  // Initialize contacts with initialContacts prop and persist in localStorage
  const [contacts, setContacts] = useState<Contact[]>(() => {
    // Try to load from localStorage first, then fall back to initialContacts
    if (typeof window !== 'undefined') {
      const savedContacts = localStorage.getItem('crm-contacts');
      if (savedContacts) {
        try {
          const parsed = JSON.parse(savedContacts);
          return Array.isArray(parsed) ? parsed : initialContacts;
        } catch (error) {
          console.error('Error parsing saved contacts:', error);
        }
      }
    }
    return initialContacts;
  });

  // Update contacts when initialContacts changes (but don't override existing data)
  useEffect(() => {
    if (initialContacts.length > 0 && contacts.length === 0) {
      setContacts(initialContacts);
    }
  }, [initialContacts, contacts.length]);

  // Save contacts to localStorage whenever contacts change
  useEffect(() => {
    if (typeof window !== 'undefined' && contacts.length > 0) {
      localStorage.setItem('crm-contacts', JSON.stringify(contacts));
    }
  }, [contacts]);

  // Notify parent whenever contacts change
  useEffect(() => {
    if (onContactsUpdate) {
      onContactsUpdate(contacts);
    }
  }, [contacts, onContactsUpdate]);

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredContacts.length / contactsPerPage);
  const startIndex = (currentPage - 1) * contactsPerPage;
  const currentContacts = filteredContacts.slice(startIndex, startIndex + contactsPerPage);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAddContact = (contactData: ContactFormData) => {
    const newContact: Contact = {
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: contactData.name,
      email: contactData.email,
      phone: contactData.phone,
      company: contactData.company,
      website: contactData.website || '',
      status: contactData.status,
      customSegment: contactData.customSegment || '',
      lastActivity: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      isSelected: false
    };

    setContacts(prev => {
      const updatedContacts = [newContact, ...prev];
      return updatedContacts;
    });
    
    // Notify parent about the new contact
    if (onContactAdded) {
      onContactAdded(newContact);
    }

    // Show success message
    setUploadStatus({
      type: 'success',
      message: 'Contact added successfully!'
    });

    // Clear status after 3 seconds
    setTimeout(() => {
      setUploadStatus({ type: null, message: '' });
    }, 3000);
  };

  const handleCSVUpload = (csvContacts: ContactFormData[]) => {
    const newContacts: Contact[] = csvContacts.map((contactData, index) => ({
      id: `csv_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      name: contactData.name,
      email: contactData.email,
      phone: contactData.phone,
      company: contactData.company,
      website: contactData.website || '',
      status: contactData.status,
      customSegment: contactData.customSegment || '',
      lastActivity: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      isSelected: false
    }));

    setContacts(prev => {
      const updatedContacts = [...newContacts, ...prev];
      return updatedContacts;
    });

    // Notify parent about all new contacts individually (for backward compatibility)
    if (onContactAdded) {
      newContacts.forEach(contact => onContactAdded(contact));
    }

    // Show success message
    setUploadStatus({
      type: 'success',
      message: `Successfully imported ${newContacts.length} contacts from CSV`
    });

    // Clear status after 5 seconds for CSV uploads (longer message)
    setTimeout(() => {
      setUploadStatus({ type: null, message: '' });
    }, 5000);

    // Close the CSV modal
    setIsCSVModalOpen(false);
  };

  const handleContactSelect = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === currentContacts.length && currentContacts.length > 0) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(currentContacts.map(c => c.id));
    }
  };

  const handleContactUpdate = (contactId: string, field: keyof Contact, value: string) => {
    setContacts(prev => {
      const updatedContacts = prev.map(contact =>
        contact.id === contactId
          ? { 
              ...contact, 
              [field]: value,
              lastActivity: field !== 'lastActivity' ? new Date().toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }) : contact.lastActivity
            }
          : contact
      );
      return updatedContacts;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedContacts.length === 0) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedContacts.length} contact${selectedContacts.length > 1 ? 's' : ''}?`
    );
    
    if (confirmDelete) {
      setContacts(prev => {
        const updatedContacts = prev.filter(contact => !selectedContacts.includes(contact.id));
        return updatedContacts;
      });
      setSelectedContacts([]);
      
      // Show success message
      setUploadStatus({
        type: 'success',
        message: `Successfully deleted ${selectedContacts.length} contact${selectedContacts.length > 1 ? 's' : ''}`
      });

      // Clear status after 3 seconds
      setTimeout(() => {
        setUploadStatus({ type: null, message: '' });
      }, 3000);
    }
  };

  // Empty state when no contacts
  if (contacts.length === 0) {
    return (
      <div className="bg-white min-h-[60vh] flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <Image
              src="/icons/crm-image.svg"
              alt="CRM Illustration"
              width={400}
              height={400}
              className="mx-auto max-w-full h-auto"
            />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Contacts Yet</h2>
          <p className="text-gray-600 text-lg mb-6">Create your first contact list to get started</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Contact</span>
            </button>
            <button
              onClick={() => setIsCSVModalOpen(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Upload className="w-5 h-5" />
              <span>Import CSV</span>
            </button>
          </div>
        </div>

        <AddContactModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddContact}
        />

        <CSVUploadModal
          isOpen={isCSVModalOpen}
          onClose={() => setIsCSVModalOpen(false)}
          onUpload={handleCSVUpload}
        />
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Upload Status */}
      {uploadStatus.type && (
        <div className={`px-6 py-3 border-b ${
          uploadStatus.type === 'success' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
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

      {/* Header with Search and Stats */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Contacts</h1>
            <p className="text-sm text-gray-600 mt-1">
              {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} 
              {searchTerm && ` found for "${searchTerm}"`}
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      {selectedContacts.length > 0 && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleDeleteSelected}
                className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedContacts([])}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Search Results */}
      {filteredContacts.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
          <p className="text-gray-600 mb-4">
            No contacts match your search term "{searchTerm}".
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Contact Table */}
      {filteredContacts.length > 0 && (
        <ContactTable
          contacts={currentContacts}
          selectedContacts={selectedContacts}
          onContactSelect={handleContactSelect}
          onSelectAll={handleSelectAll}
          onContactUpdate={handleContactUpdate}
        />
      )}

      {/* Pagination */}
      {filteredContacts.length > contactsPerPage && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 border-t border-gray-200 space-y-2 sm:space-y-0">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(startIndex + contactsPerPage, filteredContacts.length)} of {filteredContacts.length} contacts
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-colors ${currentPage === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex space-x-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-colors ${currentPage === totalPages
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col space-y-3">
        <button
          onClick={() => setIsCSVModalOpen(true)}
          className="bg-green-600 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Upload className="w-5 h-5" />
          <span className="hidden sm:inline">Import CSV</span>
        </button>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Add Contact</span>
        </button>
      </div>

      {/* Modals */}
      <AddContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddContact}
      />

      <CSVUploadModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onUpload={handleCSVUpload}
      />
    </div>
  );
}





















































































// "use client";
// import { useState, useContext, useEffect } from 'react';
// import { AuthContext } from "@/lib/context/auth";
// import { Search, Plus, MoreHorizontal, ChevronLeft, ChevronRight, Edit2, Check, X, Upload, FileText, AlertCircle } from 'lucide-react';
// import { AddContactModal, ContactFormData } from './modals/AddContactModal';
// import { CSVUploadModal } from './modals/CSVUploadModal';
// import Image from 'next/image';

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

// interface ContactsViewProps {
//   onReconfigure: () => void;
//   onContactAdded?: (contact: Contact) => void;
//   onContactsUpdate?: (contacts: Contact[]) => void;
//   initialContacts?: Contact[];
// }

// interface EditingCell {
//   contactId: string;
//   field: keyof Contact;
// }

// export function ContactsView({ onReconfigure, onContactAdded, onContactsUpdate, initialContacts = [] }: ContactsViewProps) {
//   const { token, user } = useContext(AuthContext);
//   const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
//   const [editValue, setEditValue] = useState('');
//   const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
//   const [searchTerm, setSearchTerm] = useState('');
//   const contactsPerPage = 12;

//   // Initialize contacts with initialContacts prop and persist in localStorage
//   const [contacts, setContacts] = useState<Contact[]>(() => {
//     // Try to load from localStorage first, then fall back to initialContacts
//     if (typeof window !== 'undefined') {
//       const savedContacts = localStorage.getItem('crm-contacts');
//       if (savedContacts) {
//         try {
//           const parsed = JSON.parse(savedContacts);
//           return Array.isArray(parsed) ? parsed : initialContacts;
//         } catch (error) {
//           console.error('Error parsing saved contacts:', error);
//         }
//       }
//     }
//     return initialContacts;
//   });

//   // Update contacts when initialContacts changes (but don't override existing data)
//   useEffect(() => {
//     if (initialContacts.length > 0 && contacts.length === 0) {
//       setContacts(initialContacts);
//     }
//   }, [initialContacts, contacts.length]);

//   // Save contacts to localStorage whenever contacts change
//   useEffect(() => {
//     if (typeof window !== 'undefined' && contacts.length > 0) {
//       localStorage.setItem('crm-contacts', JSON.stringify(contacts));
//     }
//   }, [contacts]);

//   // Notify parent whenever contacts change
//   useEffect(() => {
//     if (onContactsUpdate) {
//       onContactsUpdate(contacts);
//     }
//   }, [contacts, onContactsUpdate]);

//   // Filter contacts based on search term
//   const filteredContacts = contacts.filter(contact => 
//     contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     contact.phone.includes(searchTerm)
//   );

//   // Pagination calculations
//   const totalPages = Math.ceil(filteredContacts.length / contactsPerPage);
//   const startIndex = (currentPage - 1) * contactsPerPage;
//   const currentContacts = filteredContacts.slice(startIndex, startIndex + contactsPerPage);

//   // Reset pagination when search changes
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm]);

//   const handleAddContact = (contactData: ContactFormData) => {
//     const newContact: Contact = {
//       id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//       name: contactData.name,
//       email: contactData.email,
//       phone: contactData.phone,
//       company: contactData.company,
//       website: contactData.website || '',
//       status: contactData.status,
//       customSegment: contactData.customSegment || '',
//       lastActivity: new Date().toLocaleString('en-US', {
//         month: 'short',
//         day: 'numeric',
//         hour: 'numeric',
//         minute: '2-digit',
//         hour12: true
//       }),
//       isSelected: false
//     };

//     setContacts(prev => {
//       const updatedContacts = [newContact, ...prev];
//       return updatedContacts;
//     });
    
//     // Notify parent about the new contact
//     if (onContactAdded) {
//       onContactAdded(newContact);
//     }

//     // Show success message
//     setUploadStatus({
//       type: 'success',
//       message: 'Contact added successfully!'
//     });

//     // Clear status after 3 seconds
//     setTimeout(() => {
//       setUploadStatus({ type: null, message: '' });
//     }, 3000);
//   };

//   const handleCSVUpload = (csvContacts: ContactFormData[]) => {
//     const newContacts: Contact[] = csvContacts.map((contactData, index) => ({
//       id: `csv_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
//       name: contactData.name,
//       email: contactData.email,
//       phone: contactData.phone,
//       company: contactData.company,
//       website: contactData.website || '',
//       status: contactData.status,
//       customSegment: contactData.customSegment || '',
//       lastActivity: new Date().toLocaleString('en-US', {
//         month: 'short',
//         day: 'numeric',
//         hour: 'numeric',
//         minute: '2-digit',
//         hour12: true
//       }),
//       isSelected: false
//     }));

//     setContacts(prev => {
//       const updatedContacts = [...newContacts, ...prev];
//       return updatedContacts;
//     });

//     // Notify parent about all new contacts individually (for backward compatibility)
//     if (onContactAdded) {
//       newContacts.forEach(contact => onContactAdded(contact));
//     }

//     // Show success message
//     setUploadStatus({
//       type: 'success',
//       message: `Successfully imported ${newContacts.length} contacts from CSV`
//     });

//     // Clear status after 5 seconds for CSV uploads (longer message)
//     setTimeout(() => {
//       setUploadStatus({ type: null, message: '' });
//     }, 5000);

//     // Close the CSV modal
//     setIsCSVModalOpen(false);
//   };

//   const handleContactSelect = (contactId: string) => {
//     setSelectedContacts(prev =>
//       prev.includes(contactId)
//         ? prev.filter(id => id !== contactId)
//         : [...prev, contactId]
//     );
//   };

//   const handleSelectAll = () => {
//     if (selectedContacts.length === currentContacts.length && currentContacts.length > 0) {
//       setSelectedContacts([]);
//     } else {
//       setSelectedContacts(currentContacts.map(c => c.id));
//     }
//   };

//   const startEditing = (contactId: string, field: keyof Contact) => {
//     const contact = contacts.find(c => c.id === contactId);
//     if (contact) {
//       setEditingCell({ contactId, field });
//       setEditValue(contact[field] as string);
//     }
//   };

//   const saveEdit = () => {
//     if (editingCell) {
//       setContacts(prev => {
//         const updatedContacts = prev.map(contact =>
//           contact.id === editingCell.contactId
//             ? { 
//                 ...contact, 
//                 [editingCell.field]: editValue,
//                 lastActivity: editingCell.field !== 'lastActivity' ? new Date().toLocaleString('en-US', {
//                   month: 'short',
//                   day: 'numeric',
//                   hour: 'numeric',
//                   minute: '2-digit',
//                   hour12: true
//                 }) : contact.lastActivity
//               }
//             : contact
//         );
//         return updatedContacts;
//       });
//       setEditingCell(null);
//       setEditValue('');
//     }
//   };

//   const cancelEdit = () => {
//     setEditingCell(null);
//     setEditValue('');
//   };

//   const handleDeleteSelected = () => {
//     if (selectedContacts.length === 0) return;
    
//     const confirmDelete = window.confirm(
//       `Are you sure you want to delete ${selectedContacts.length} contact${selectedContacts.length > 1 ? 's' : ''}?`
//     );
    
//     if (confirmDelete) {
//       setContacts(prev => {
//         const updatedContacts = prev.filter(contact => !selectedContacts.includes(contact.id));
//         return updatedContacts;
//       });
//       setSelectedContacts([]);
      
//       // Show success message
//       setUploadStatus({
//         type: 'success',
//         message: `Successfully deleted ${selectedContacts.length} contact${selectedContacts.length > 1 ? 's' : ''}`
//       });

//       // Clear status after 3 seconds
//       setTimeout(() => {
//         setUploadStatus({ type: null, message: '' });
//       }, 3000);
//     }
//   };

//   const getStatusBadge = (status: string) => {
//     const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";

//     switch (status) {
//       case 'Active Client':
//         return `${baseClasses} bg-green-100 text-green-700`;
//       case 'Prospection':
//         return `${baseClasses} bg-blue-100 text-blue-600`;
//       case 'Supplier':
//         return `${baseClasses} bg-purple-100 text-purple-600`;
//       case 'Add Segment':
//         return `${baseClasses} bg-orange-100 text-orange-600`;
//       default:
//         return `${baseClasses} bg-gray-100 text-gray-600`;
//     }
//   };

//   const renderEditableCell = (contact: Contact, field: keyof Contact, value: string) => {
//     const isEditing = editingCell?.contactId === contact.id && editingCell?.field === field;

//     if (isEditing) {
//       return (
//         <div className="flex items-center space-x-2">
//           {field === 'status' ? (
//             <select
//               value={editValue}
//               onChange={(e) => setEditValue(e.target.value)}
//               className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
//               autoFocus
//             >
//               <option value="Prospection">Prospection</option>
//               <option value="Active Client">Active Client</option>
//               <option value="Supplier">Supplier</option>
//               <option value="Add Segment">Add Segment</option>
//             </select>
//           ) : (
//             <input
//               type="text"
//               value={editValue}
//               onChange={(e) => setEditValue(e.target.value)}
//               className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0 flex-1"
//               autoFocus
//               onKeyDown={(e) => {
//                 if (e.key === 'Enter') saveEdit();
//                 if (e.key === 'Escape') cancelEdit();
//               }}
//             />
//           )}
//           <button onClick={saveEdit} className="text-green-600 hover:text-green-700">
//             <Check className="w-3 h-3" />
//           </button>
//           <button onClick={cancelEdit} className="text-red-600 hover:text-red-700">
//             <X className="w-3 h-3" />
//           </button>
//         </div>
//       );
//     }

//     return (
//       <div
//         className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
//         onClick={() => startEditing(contact.id, field)}
//       >
//         <span className="text-sm text-gray-700 truncate">
//           {field === 'status' ? (
//             <div className="flex flex-col space-y-1">
//               <span className={getStatusBadge(value)}>{value}</span>
//               {contact.customSegment && (
//                 <span className="text-xs text-gray-500">Segment: {contact.customSegment}</span>
//               )}
//             </div>
//           ) : (
//             value || (field === 'website' ? 'N/A' : '')
//           )}
//         </span>
//         <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 ml-2 flex-shrink-0" />
//       </div>
//     );
//   };

//   // Empty state when no contacts
//   if (contacts.length === 0) {
//     return (
//       <div className="bg-white min-h-[60vh] flex flex-col items-center justify-center p-4 sm:p-8">
//         <div className="text-center max-w-md">
//           <div className="mb-6">
//             <Image
//               src="/icons/crm-image.svg"
//               alt="CRM Illustration"
//               width={400}
//               height={400}
//               className="mx-auto max-w-full h-auto"
//             />
//           </div>
//           <h2 className="text-xl font-semibold text-gray-900 mb-2">No Contacts Yet</h2>
//           <p className="text-gray-600 text-lg mb-6">Create your first contact list to get started</p>
//           <div className="flex flex-col sm:flex-row gap-4 justify-center">
//             <button
//               onClick={() => setIsModalOpen(true)}
//               className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
//             >
//               <Plus className="w-5 h-5" />
//               <span>Add Contact</span>
//             </button>
//             <button
//               onClick={() => setIsCSVModalOpen(true)}
//               className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
//             >
//               <Upload className="w-5 h-5" />
//               <span>Import CSV</span>
//             </button>
//           </div>
//         </div>

//         <AddContactModal
//           isOpen={isModalOpen}
//           onClose={() => setIsModalOpen(false)}
//           onSubmit={handleAddContact}
//         />

//         <CSVUploadModal
//           isOpen={isCSVModalOpen}
//           onClose={() => setIsCSVModalOpen(false)}
//           onUpload={handleCSVUpload}
//         />
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white">
//       {/* Upload Status */}
//       {uploadStatus.type && (
//         <div className={`px-6 py-3 border-b ${
//           uploadStatus.type === 'success' 
//             ? 'bg-green-50 border-green-200' 
//             : 'bg-red-50 border-red-200'
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

//       {/* Header with Search and Stats */}
//       <div className="px-6 py-4 border-b border-gray-200">
//         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
//           <div>
//             <h1 className="text-xl font-semibold text-gray-900">Contacts</h1>
//             <p className="text-sm text-gray-600 mt-1">
//               {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} 
//               {searchTerm && ` found for "${searchTerm}"`}
//             </p>
//           </div>
          
//           {/* Search Bar */}
//           <div className="relative max-w-sm">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search contacts..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
//             />
//           </div>
//         </div>
//       </div>

//       {/* Action Bar */}
//       {selectedContacts.length > 0 && (
//         <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
//           <div className="flex items-center justify-between">
//             <span className="text-sm text-blue-700">
//               {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''} selected
//             </span>
//             <div className="flex space-x-2">
//               <button
//                 onClick={handleDeleteSelected}
//                 className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
//               >
//                 Delete Selected
//               </button>
//               <button
//                 onClick={() => setSelectedContacts([])}
//                 className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
//               >
//                 Clear Selection
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* No Search Results */}
//       {filteredContacts.length === 0 && searchTerm && (
//         <div className="text-center py-12">
//           <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//           <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
//           <p className="text-gray-600 mb-4">
//             No contacts match your search term "{searchTerm}".
//           </p>
//           <button
//             onClick={() => setSearchTerm('')}
//             className="text-blue-600 hover:text-blue-700 text-sm"
//           >
//             Clear search
//           </button>
//         </div>
//       )}

//       {/* Desktop Table View */}
//       {filteredContacts.length > 0 && (
//         <div className="hidden lg:block px-6 py-3">
//           {/* Table Header */}
//           <div className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-200 text-sm font-medium text-gray-700">
//             <div className="col-span-1">
//               <input
//                 type="checkbox"
//                 checked={selectedContacts.length === currentContacts.length && currentContacts.length > 0}
//                 onChange={handleSelectAll}
//                 className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
//               />
//             </div>
//             <div className="col-span-2 flex items-center justify-between">
//               <span>Profile</span>
//               <Plus className="w-4 h-4 text-gray-400" />
//             </div>
//             <div className="col-span-3 flex items-center justify-between">
//               <span>Contact</span>
//               <Plus className="w-4 h-4 text-gray-400" />
//             </div>
//             <div className="col-span-2 flex items-center justify-between">
//               <span>Company</span>
//               <Plus className="w-4 h-4 text-gray-400" />
//             </div>
//             <div className="col-span-2 flex items-center justify-between">
//               <span>Category</span>
//               <Plus className="w-4 h-4 text-gray-400" />
//             </div>
//             <div className="col-span-2"></div>
//           </div>

//           {/* Table Rows */}
//           {currentContacts.map((contact) => (
//             <div
//               key={contact.id}
//               className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
//             >
//               <div className="col-span-1">
//                 <input
//                   type="checkbox"
//                   checked={selectedContacts.includes(contact.id)}
//                   onChange={() => handleContactSelect(contact.id)}
//                   className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
//                 />
//               </div>

//               <div className="col-span-2">
//                 <div className="flex items-center space-x-3">
//                   <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
//                     <span className="text-white text-sm font-medium">
//                       {contact.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
//                     </span>
//                   </div>
//                   <div className="min-w-0 flex-1">
//                     <div className="font-medium text-gray-900 text-sm mb-0.5 truncate">{contact.name}</div>
//                     <div className="text-xs text-gray-500">{contact.lastActivity}</div>
//                   </div>
//                 </div>
//               </div>

//               <div className="col-span-3">
//                 <div className="space-y-0.5">
//                   {renderEditableCell(contact, 'email', contact.email)}
//                   {renderEditableCell(contact, 'phone', contact.phone)}
//                 </div>
//               </div>

//               <div className="col-span-2">
//                 <div className="space-y-0.5">
//                   {renderEditableCell(contact, 'company', contact.company)}
//                   {renderEditableCell(contact, 'website', contact.website)}
//                 </div>
//               </div>

//               <div className="col-span-2">
//                 {renderEditableCell(contact, 'status', contact.status)}
//               </div>

//               <div className="col-span-2 flex justify-end">
//                 <button className="p-1 hover:bg-gray-100 rounded transition-colors">
//                   <MoreHorizontal className="w-4 h-4 text-gray-400" />
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Mobile Card View */}
//       {filteredContacts.length > 0 && (
//         <div className="lg:hidden px-4 py-3 space-y-4">
//           {currentContacts.map((contact) => (
//             <div key={contact.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
//               <div className="flex items-start justify-between mb-3">
//                 <div className="flex items-center space-x-3">
//                   <input
//                     type="checkbox"
//                     checked={selectedContacts.includes(contact.id)}
//                     onChange={() => handleContactSelect(contact.id)}
//                     className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-1"
//                   />
//                   <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
//                     <span className="text-white text-sm font-medium">
//                       {contact.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
//                     </span>
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     {renderEditableCell(contact, 'name', contact.name)}
//                     <div className="text-xs text-gray-500 mt-1">{contact.lastActivity}</div>
//                   </div>
//                 </div>
//                 <button className="p-1 hover:bg-gray-100 rounded transition-colors">
//                   <MoreHorizontal className="w-4 h-4 text-gray-400" />
//                 </button>
//               </div>

//               <div className="space-y-2 text-sm">
//                 <div>
//                   <span className="text-gray-500 text-xs">Email:</span>
//                   {renderEditableCell(contact, 'email', contact.email)}
//                 </div>
//                 <div>
//                   <span className="text-gray-500 text-xs">Phone:</span>
//                   {renderEditableCell(contact, 'phone', contact.phone)}
//                 </div>
//                 <div>
//                   <span className="text-gray-500 text-xs">Company:</span>
//                   {renderEditableCell(contact, 'company', contact.company)}
//                 </div>
//                 <div>
//                   <span className="text-gray-500 text-xs">Website:</span>
//                   {renderEditableCell(contact, 'website', contact.website)}
//                 </div>
//                 <div>
//                   <span className="text-gray-500 text-xs">Category:</span>
//                   {renderEditableCell(contact, 'status', contact.status)}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Pagination */}
//       {filteredContacts.length > contactsPerPage && (
//         <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 border-t border-gray-200 space-y-2 sm:space-y-0">
//           <div className="text-sm text-gray-500">
//             Showing {startIndex + 1} to {Math.min(startIndex + contactsPerPage, filteredContacts.length)} of {filteredContacts.length} contacts
//           </div>
//           <div className="flex items-center space-x-2">
//             <button
//               onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//               disabled={currentPage === 1}
//               className={`p-2 rounded-lg transition-colors ${currentPage === 1
//                 ? 'text-gray-400 cursor-not-allowed'
//                 : 'text-gray-600 hover:bg-gray-100'
//                 }`}
//             >
//               <ChevronLeft className="w-4 h-4" />
//             </button>

//             <div className="flex space-x-1">
//               {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
//                 let page;
//                 if (totalPages <= 5) {
//                   page = i + 1;
//                 } else if (currentPage <= 3) {
//                   page = i + 1;
//                 } else if (currentPage >= totalPages - 2) {
//                   page = totalPages - 4 + i;
//                 } else {
//                   page = currentPage - 2 + i;
//                 }
                
//                 return (
//                   <button
//                     key={page}
//                     onClick={() => setCurrentPage(page)}
//                     className={`px-3 py-1 rounded-lg text-sm transition-colors ${currentPage === page
//                       ? 'bg-blue-600 text-white'
//                       : 'text-gray-600 hover:bg-gray-100'
//                       }`}
//                   >
//                     {page}
//                   </button>
//                 );
//               })}
//             </div>

//             <button
//               onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
//               disabled={currentPage === totalPages}
//               className={`p-2 rounded-lg transition-colors ${currentPage === totalPages
//                 ? 'text-gray-400 cursor-not-allowed'
//                 : 'text-gray-600 hover:bg-gray-100'
//                 }`}
//             >
//               <ChevronRight className="w-4 h-4" />
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Floating Action Buttons */}
//       <div className="fixed bottom-8 right-8 flex flex-col space-y-3">
//         <button
//           onClick={() => setIsCSVModalOpen(true)}
//           className="bg-green-600 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
//         >
//           <Upload className="w-5 h-5" />
//           <span className="hidden sm:inline">Import CSV</span>
//         </button>
//         <button
//           onClick={() => setIsModalOpen(true)}
//           className="bg-gray-800 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
//         >
//           <Plus className="w-5 h-5" />
//           <span className="hidden sm:inline">Add Contact</span>
//         </button>
//       </div>

//       {/* Modals */}
//       <AddContactModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         onSubmit={handleAddContact}
//       />

//       <CSVUploadModal
//         isOpen={isCSVModalOpen}
//         onClose={() => setIsCSVModalOpen(false)}
//         onUpload={handleCSVUpload}
//       />
//     </div>
//   );
// }





































// "use client";
// import { useState, useContext, useEffect } from 'react';
// import { AuthContext } from "@/lib/context/auth";
// import { Search, Plus, MoreHorizontal, ChevronLeft, ChevronRight, Edit2, Check, X } from 'lucide-react';
// import { AddContactModal, ContactFormData } from './modals/AddContactModal';
// import Image from 'next/image';

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

// interface ContactsViewProps {
//   onReconfigure: () => void;
//   onContactAdded?: (contact: Contact) => void;
//   onContactsUpdate?: (contacts: Contact[]) => void; // Added this prop
// }

// interface EditingCell {
//   contactId: string;
//   field: keyof Contact;
// }

// export function ContactsView({ onReconfigure, onContactAdded, onContactsUpdate }: ContactsViewProps) {
//   const { token, user } = useContext(AuthContext);
//   const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
//   const [editValue, setEditValue] = useState('');
//   const contactsPerPage = 12;

//   // Initial empty state - will show illustration when no contacts
//   const [contacts, setContacts] = useState<Contact[]>([]);

//   // Notify parent whenever contacts change
//   useEffect(() => {
//     if (onContactsUpdate) {
//       onContactsUpdate(contacts);
//     }
//   }, [contacts, onContactsUpdate]);

//   // Pagination calculations
//   const totalPages = Math.ceil(contacts.length / contactsPerPage);
//   const startIndex = (currentPage - 1) * contactsPerPage;
//   const currentContacts = contacts.slice(startIndex, startIndex + contactsPerPage);

//   const handleAddContact = (contactData: ContactFormData) => {
//     const newContact: Contact = {
//       id: Date.now().toString(),
//       name: contactData.name,
//       email: contactData.email,
//       phone: contactData.phone,
//       company: contactData.company,
//       website: contactData.website,
//       status: contactData.status,
//       customSegment: contactData.customSegment,
//       lastActivity: new Date().toLocaleString('en-US', {
//         month: 'short',
//         day: 'numeric',
//         hour: 'numeric',
//         minute: '2-digit',
//         hour12: true
//       }),
//       isSelected: false
//     };

//     setContacts(prev => {
//       const updatedContacts = [newContact, ...prev];
//       return updatedContacts;
//     });
    
//     // Notify DealsView about the new contact (backward compatibility)
//     if (onContactAdded) {
//       onContactAdded(newContact);
//     }
//   };

//   const handleContactSelect = (contactId: string) => {
//     setSelectedContacts(prev =>
//       prev.includes(contactId)
//         ? prev.filter(id => id !== contactId)
//         : [...prev, contactId]
//     );
//   };

//   const handleSelectAll = () => {
//     if (selectedContacts.length === currentContacts.length) {
//       setSelectedContacts([]);
//     } else {
//       setSelectedContacts(currentContacts.map(c => c.id));
//     }
//   };

//   const startEditing = (contactId: string, field: keyof Contact) => {
//     const contact = contacts.find(c => c.id === contactId);
//     if (contact) {
//       setEditingCell({ contactId, field });
//       setEditValue(contact[field] as string);
//     }
//   };

//   const saveEdit = () => {
//     if (editingCell) {
//       setContacts(prev => {
//         const updatedContacts = prev.map(contact =>
//           contact.id === editingCell.contactId
//             ? { ...contact, [editingCell.field]: editValue }
//             : contact
//         );
//         return updatedContacts;
//       });
//       setEditingCell(null);
//       setEditValue('');
//     }
//   };

//   const cancelEdit = () => {
//     setEditingCell(null);
//     setEditValue('');
//   };

//   const handleDeleteSelected = () => {
//     setContacts(prev => {
//       const updatedContacts = prev.filter(contact => !selectedContacts.includes(contact.id));
//       return updatedContacts;
//     });
//     setSelectedContacts([]);
//   };

//   const getStatusBadge = (status: string) => {
//     const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";

//     switch (status) {
//       case 'Active Client':
//         return `${baseClasses} bg-green-100 text-green-700`;
//       case 'Prospection':
//         return `${baseClasses} bg-blue-100 text-blue-600`;
//       case 'Supplier':
//         return `${baseClasses} bg-purple-100 text-purple-600`;
//       case 'Add Segment':
//         return `${baseClasses} bg-orange-100 text-orange-600`;
//       default:
//         return `${baseClasses} bg-gray-100 text-gray-600`;
//     }
//   };

//   const renderEditableCell = (contact: Contact, field: keyof Contact, value: string) => {
//     const isEditing = editingCell?.contactId === contact.id && editingCell?.field === field;

//     if (isEditing) {
//       return (
//         <div className="flex items-center space-x-2">
//           {field === 'status' ? (
//             <select
//               value={editValue}
//               onChange={(e) => setEditValue(e.target.value)}
//               className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
//               autoFocus
//             >
//               <option value="Prospection">Prospection</option>
//               <option value="Active Client">Active Client</option>
//               <option value="Supplier">Supplier</option>
//               <option value="Add Segment">Add Segment</option>
//             </select>
//           ) : (
//             <input
//               type="text"
//               value={editValue}
//               onChange={(e) => setEditValue(e.target.value)}
//               className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0 flex-1"
//               autoFocus
//               onKeyDown={(e) => {
//                 if (e.key === 'Enter') saveEdit();
//                 if (e.key === 'Escape') cancelEdit();
//               }}
//             />
//           )}
//           <button onClick={saveEdit} className="text-green-600 hover:text-green-700">
//             <Check className="w-3 h-3" />
//           </button>
//           <button onClick={cancelEdit} className="text-red-600 hover:text-red-700">
//             <X className="w-3 h-3" />
//           </button>
//         </div>
//       );
//     }

//     return (
//       <div
//         className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
//         onClick={() => startEditing(contact.id, field)}
//       >
//         <span className="text-sm text-gray-700 truncate">
//           {field === 'status' ? (
//             <div className="flex flex-col space-y-1">
//               <span className={getStatusBadge(value)}>{value}</span>
//               {contact.customSegment && (
//                 <span className="text-xs text-gray-500">Segment: {contact.customSegment}</span>
//               )}
//             </div>
//           ) : (
//             value
//           )}
//         </span>
//         <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 ml-2 flex-shrink-0" />
//       </div>
//     );
//   };

//   // Empty state when no contacts
//   if (contacts.length === 0) {
//     return (
//       <div className="bg-white min-h-[60vh] flex flex-col items-center justify-center p-4 sm:p-8">
//         <div className="text-center max-w-md">
//           <div className="mb-6">
//             <Image
//               src="/icons/crm-image.svg"
//               alt="CRM Illustration"
//               width={400}
//               height={400}
//               className="mx-auto max-w-full h-auto"
//             />
//           </div>
//           <p className="text-gray-600 text-lg mb-6">Create contact list</p>
//           <button
//             onClick={() => setIsModalOpen(true)}
//             className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
//           >
//             <Plus className="w-5 h-5" />
//             <span>Add Contact</span>
//           </button>
//         </div>

//         <AddContactModal
//           isOpen={isModalOpen}
//           onClose={() => setIsModalOpen(false)}
//           onSubmit={handleAddContact}
//         />
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white">
//       {/* Action Bar */}
//       {selectedContacts.length > 0 && (
//         <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
//           <div className="flex items-center justify-between">
//             <span className="text-sm text-blue-700">
//               {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''} selected
//             </span>
//             <div className="flex space-x-2">
//               <button
//                 onClick={handleDeleteSelected}
//                 className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
//               >
//                 Delete Selected
//               </button>
//               <button
//                 onClick={() => setSelectedContacts([])}
//                 className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
//               >
//                 Clear Selection
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Desktop Table View */}
//       <div className="hidden lg:block px-6 py-3">
//         {/* Table Header */}
//         <div className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-200 text-sm font-medium text-gray-700">
//           <div className="col-span-1">
//             <input
//               type="checkbox"
//               checked={selectedContacts.length === currentContacts.length && currentContacts.length > 0}
//               onChange={handleSelectAll}
//               className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
//             />
//           </div>
//           <div className="col-span-2 flex items-center justify-between">
//             <span>Profile</span>
//             <Plus className="w-4 h-4 text-gray-400" />
//           </div>
//           <div className="col-span-3 flex items-center justify-between">
//             <span>Contact</span>
//             <Plus className="w-4 h-4 text-gray-400" />
//           </div>
//           <div className="col-span-2 flex items-center justify-between">
//             <span>Company</span>
//             <Plus className="w-4 h-4 text-gray-400" />
//           </div>
//           <div className="col-span-2 flex items-center justify-between">
//             <span>Category</span>
//             <Plus className="w-4 h-4 text-gray-400" />
//           </div>
//           <div className="col-span-2"></div>
//         </div>

//         {/* Table Rows */}
//         {currentContacts.map((contact) => (
//           <div
//             key={contact.id}
//             className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100 hover:bg-gray-50"
//           >
//             <div className="col-span-1">
//               <input
//                 type="checkbox"
//                 checked={selectedContacts.includes(contact.id)}
//                 onChange={() => handleContactSelect(contact.id)}
//                 className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
//               />
//             </div>

//             <div className="col-span-2">
//               <div className="flex items-center space-x-3">
//                 <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
//                   <span className="text-white text-sm font-medium">
//                     {contact.name.split(' ').map(n => n[0]).join('')}
//                   </span>
//                 </div>
//                 <div className="min-w-0 flex-1">
//                   <div className="font-medium text-gray-900 text-sm mb-0.5">{contact.name}</div>
//                   <div className="text-xs text-gray-500">{contact.lastActivity}</div>
//                 </div>
//               </div>
//             </div>

//             <div className="col-span-3">
//               <div className="space-y-0.5">
//                 {renderEditableCell(contact, 'email', contact.email)}
//                 {renderEditableCell(contact, 'phone', contact.phone)}
//               </div>
//             </div>

//             <div className="col-span-2">
//               <div className="space-y-0.5">
//                 {renderEditableCell(contact, 'company', contact.company)}
//                 {renderEditableCell(contact, 'website', contact.website)}
//               </div>
//             </div>

//             <div className="col-span-2">
//               {renderEditableCell(contact, 'status', contact.status)}
//             </div>

//             <div className="col-span-2 flex justify-end">
//               <button className="p-1 hover:bg-gray-100 rounded">
//                 <MoreHorizontal className="w-4 h-4 text-gray-400" />
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Mobile Card View */}
//       <div className="lg:hidden px-4 py-3 space-y-4">
//         {currentContacts.map((contact) => (
//           <div key={contact.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
//             <div className="flex items-start justify-between mb-3">
//               <div className="flex items-center space-x-3">
//                 <input
//                   type="checkbox"
//                   checked={selectedContacts.includes(contact.id)}
//                   onChange={() => handleContactSelect(contact.id)}
//                   className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-1"
//                 />
//                 <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
//                   <span className="text-white text-sm font-medium">
//                     {contact.name.split(' ').map(n => n[0]).join('')}
//                   </span>
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   {renderEditableCell(contact, 'name', contact.name)}
//                   <div className="text-xs text-gray-500 mt-1">{contact.lastActivity}</div>
//                 </div>
//               </div>
//               <button className="p-1 hover:bg-gray-100 rounded">
//                 <MoreHorizontal className="w-4 h-4 text-gray-400" />
//               </button>
//             </div>

//             <div className="space-y-2 text-sm">
//               <div>
//                 <span className="text-gray-500 text-xs">Email:</span>
//                 {renderEditableCell(contact, 'email', contact.email)}
//               </div>
//               <div>
//                 <span className="text-gray-500 text-xs">Phone:</span>
//                 {renderEditableCell(contact, 'phone', contact.phone)}
//               </div>
//               <div>
//                 <span className="text-gray-500 text-xs">Company:</span>
//                 {renderEditableCell(contact, 'company', contact.company)}
//               </div>
//               <div>
//                 <span className="text-gray-500 text-xs">Website:</span>
//                 {renderEditableCell(contact, 'website', contact.website)}
//               </div>
//               <div>
//                 <span className="text-gray-500 text-xs">Category:</span>
//                 {renderEditableCell(contact, 'status', contact.status)}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Pagination */}
//       {contacts.length > contactsPerPage && (
//         <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 border-t border-gray-200 space-y-2 sm:space-y-0">
//           <div className="text-sm text-gray-500">
//             Showing {startIndex + 1} to {Math.min(startIndex + contactsPerPage, contacts.length)} of {contacts.length} contacts
//           </div>
//           <div className="flex items-center space-x-2">
//             <button
//               onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//               disabled={currentPage === 1}
//               className={`p-2 rounded-lg ${currentPage === 1
//                 ? 'text-gray-400 cursor-not-allowed'
//                 : 'text-gray-600 hover:bg-gray-100'
//                 }`}
//             >
//               <ChevronLeft className="w-4 h-4" />
//             </button>

//             <div className="flex space-x-1">
//               {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
//                 <button
//                   key={page}
//                   onClick={() => setCurrentPage(page)}
//                   className={`px-3 py-1 rounded-lg text-sm ${currentPage === page
//                     ? 'bg-blue-600 text-white'
//                     : 'text-gray-600 hover:bg-gray-100'
//                     }`}
//                 >
//                   {page}
//                 </button>
//               ))}
//             </div>

//             <button
//               onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
//               disabled={currentPage === totalPages}
//               className={`p-2 rounded-lg ${currentPage === totalPages
//                 ? 'text-gray-400 cursor-not-allowed'
//                 : 'text-gray-600 hover:bg-gray-100'
//                 }`}
//             >
//               <ChevronRight className="w-4 h-4" />
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Floating Add Contact Button (only when contacts exist) */}
//       <div className="fixed bottom-8 right-8">
//         <button
//           onClick={() => setIsModalOpen(true)}
//           className="bg-gray-800 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
//         >
//           <Plus className="w-5 h-5" />
//           <span className="hidden sm:inline">Add Contact</span>
//         </button>
//       </div>

//       {/* Add Contact Modal */}
//       <AddContactModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         onSubmit={handleAddContact}
//       />
//     </div>
//   );
// }




































// "use client";
// import { useState, useContext } from 'react';
// import { AuthContext } from "@/lib/context/auth";
// import { Search, Plus, MoreHorizontal, ChevronLeft, ChevronRight, Edit2, Check, X } from 'lucide-react';
// import { AddContactModal, ContactFormData } from './modals/AddContactModal';
// import Image from 'next/image';

// interface ContactsViewProps {
//   onReconfigure: () => void;
// }

// interface Contact {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
//   company: string;
//   website: string;
//   status: 'Active Client' | 'Accepted' | 'Pending' | 'Rejected' | string;
//   lastActivity: string;
//   isSelected?: boolean;
// }

// interface EditingCell {
//   contactId: string;
//   field: keyof Contact;
// }

// export function ContactsView({ onReconfigure }: ContactsViewProps) {
//   const { token, user } = useContext(AuthContext);
//   const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
//   const [editValue, setEditValue] = useState('');
//   const contactsPerPage = 12;

//   // Initial empty state - will show illustration when no contacts
//   const [contacts, setContacts] = useState<Contact[]>([]);

//   // Sample data for testing (uncomment to test with data)
//   /*
//   const [contacts, setContacts] = useState<Contact[]>([
//     {
//       id: '1',
//       name: 'Olivia Anderson',
//       email: 'Olivia.Anderson@gmail.com',
//       phone: '08123456784',
//       company: 'High High',
//       website: 'highhigh.com',
//       status: 'Active Client',
//       lastActivity: 'Today at 12:00pm',
//       isSelected: true
//     },
//     // ... more sample data
//   ]);
//   */

//   // Pagination calculations
//   const totalPages = Math.ceil(contacts.length / contactsPerPage);
//   const startIndex = (currentPage - 1) * contactsPerPage;
//   const currentContacts = contacts.slice(startIndex, startIndex + contactsPerPage);

//   const handleAddContact = (contactData: ContactFormData) => {
//     const newContact: Contact = {
//       id: Date.now().toString(),
//       ...contactData,
//       lastActivity: new Date().toLocaleString('en-US', {
//         month: 'short',
//         day: 'numeric',
//         hour: 'numeric',
//         minute: '2-digit',
//         hour12: true
//       }),
//       isSelected: false
//     };

//     setContacts(prev => [newContact, ...prev]);
//   };

//   const handleContactSelect = (contactId: string) => {
//     setSelectedContacts(prev =>
//       prev.includes(contactId)
//         ? prev.filter(id => id !== contactId)
//         : [...prev, contactId]
//     );
//   };

//   const handleSelectAll = () => {
//     if (selectedContacts.length === currentContacts.length) {
//       setSelectedContacts([]);
//     } else {
//       setSelectedContacts(currentContacts.map(c => c.id));
//     }
//   };

//   const startEditing = (contactId: string, field: keyof Contact) => {
//     const contact = contacts.find(c => c.id === contactId);
//     if (contact) {
//       setEditingCell({ contactId, field });
//       setEditValue(contact[field] as string);
//     }
//   };

//   const saveEdit = () => {
//     if (editingCell) {
//       setContacts(prev => prev.map(contact =>
//         contact.id === editingCell.contactId
//           ? { ...contact, [editingCell.field]: editValue }
//           : contact
//       ));
//       setEditingCell(null);
//       setEditValue('');
//     }
//   };

//   const cancelEdit = () => {
//     setEditingCell(null);
//     setEditValue('');
//   };

//   const getStatusBadge = (status: string) => {
//     const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";

//     switch (status) {
//       case 'Active Client':
//         return `${baseClasses} bg-green-100 text-green-700`;
//       case 'Accepted':
//         return `${baseClasses} bg-blue-100 text-blue-600`;
//       case 'Pending':
//         return `${baseClasses} bg-yellow-100 text-yellow-600`;
//       case 'Rejected':
//         return `${baseClasses} bg-red-100 text-red-600`;
//       default:
//         return `${baseClasses} bg-gray-100 text-gray-600`;
//     }
//   };

//   const renderEditableCell = (contact: Contact, field: keyof Contact, value: string) => {
//     const isEditing = editingCell?.contactId === contact.id && editingCell?.field === field;

//     if (isEditing) {
//       return (
//         <div className="flex items-center space-x-2">
//           {field === 'status' ? (
//             <select
//               value={editValue}
//               onChange={(e) => setEditValue(e.target.value)}
//               className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
//               autoFocus
//             >
//               <option value="Accepted">Accepted</option>
//               <option value="Active Client">Active Client</option>
//               <option value="Pending">Pending</option>
//               <option value="Rejected">Rejected</option>
//             </select>
//           ) : (
//             <input
//               type="text"
//               value={editValue}
//               onChange={(e) => setEditValue(e.target.value)}
//               className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0 flex-1"
//               autoFocus
//             />
//           )}
//           <button onClick={saveEdit} className="text-green-600 hover:text-green-700">
//             <Check className="w-3 h-3" />
//           </button>
//           <button onClick={cancelEdit} className="text-red-600 hover:text-red-700">
//             <X className="w-3 h-3" />
//           </button>
//         </div>
//       );
//     }

//     return (
//       <div
//         className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
//         onClick={() => startEditing(contact.id, field)}
//       >
//         <span className="text-sm text-gray-700 truncate">
//           {field === 'status' ? (
//             <span className={getStatusBadge(value)}>{value}</span>
//           ) : (
//             value
//           )}
//         </span>
//         <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 ml-2 flex-shrink-0" />
//       </div>
//     );
//   };

//   // Empty state when no contacts
//   if (contacts.length === 0) {
//     return (
//       <div className="bg-white min-h-[60vh] flex flex-col items-center justify-center p-8">
//         <div className="text-center max-w-md">
//           <div className="mb-6">
//             <Image
//               src="/icons/crm-image.svg"
//               alt="CRM Illustration"
//               width={400}
//               height={400}
//               className="mx-auto"
//             />
//           </div>
//           <p className="text-gray-600 text-lg mb-6">Create contact list</p>
//           <button
//             onClick={() => setIsModalOpen(true)}
//             className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
//           >
//             <Plus className="w-5 h-5" />
//             <span>Add Contact</span>
//           </button>
//         </div>

//         <AddContactModal
//           isOpen={isModalOpen}
//           onClose={() => setIsModalOpen(false)}
//           onSubmit={handleAddContact}
//         />
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white">
//       {/* Desktop Table View */}
//       <div className="hidden lg:block px-6 py-3">
//         {/* Table Header */}
//         <div className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-200 text-sm font-medium text-gray-700">
//           <div className="col-span-1">
//             <input
//               type="checkbox"
//               checked={selectedContacts.length === currentContacts.length && currentContacts.length > 0}
//               onChange={handleSelectAll}
//               className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
//             />
//           </div>
//           <div className="col-span-2 flex items-center justify-between">
//             <span>Profile</span>
//             <Plus className="w-4 h-4 text-gray-400" />
//           </div>
//           <div className="col-span-3 flex items-center justify-between">
//             <span>Contact</span>
//             <Plus className="w-4 h-4 text-gray-400" />
//           </div>
//           <div className="col-span-2 flex items-center justify-between">
//             <span>Company</span>
//             <Plus className="w-4 h-4 text-gray-400" />
//           </div>
//           <div className="col-span-2 flex items-center justify-between">
//             <span>Status</span>
//             <Plus className="w-4 h-4 text-gray-400" />
//           </div>
//           <div className="col-span-2"></div>
//         </div>

//         {/* Table Rows */}
//         {currentContacts.map((contact) => (
//           <div
//             key={contact.id}
//             className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100 hover:bg-gray-50"
//           >
//             <div className="col-span-1">
//               <input
//                 type="checkbox"
//                 checked={selectedContacts.includes(contact.id)}
//                 onChange={() => handleContactSelect(contact.id)}
//                 className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
//               />
//             </div>

//             <div className="col-span-2">
//               <div className="flex items-center space-x-3">
//                 <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
//                   <span className="text-white text-sm font-medium">
//                     {contact.name.split(' ').map(n => n[0]).join('')}
//                   </span>
//                 </div>
//                 <div className="min-w-0 flex-1">
//                   <div className="font-medium text-gray-900 text-sm mb-0.5">{contact.name}</div>
//                   <div className="text-xs text-gray-500">{contact.lastActivity}</div>
//                 </div>
//               </div>
//             </div>

//             <div className="col-span-3">
//               <div className="space-y-0.5">
//                 {renderEditableCell(contact, 'email', contact.email)}
//                 {renderEditableCell(contact, 'phone', contact.phone)}
//               </div>
//             </div>

//             <div className="col-span-2">
//               <div className="space-y-0.5">
//                 {renderEditableCell(contact, 'company', contact.company)}
//                 {renderEditableCell(contact, 'website', contact.website)}
//               </div>
//             </div>

//             <div className="col-span-2">
//               {renderEditableCell(contact, 'status', contact.status)}
//             </div>

//             <div className="col-span-2 flex justify-end">
//               <button className="p-1 hover:bg-gray-100 rounded">
//                 <MoreHorizontal className="w-4 h-4 text-gray-400" />
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Mobile Card View */}
//       <div className="lg:hidden px-4 py-3 space-y-4">
//         {currentContacts.map((contact) => (
//           <div key={contact.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
//             <div className="flex items-start justify-between mb-3">
//               <div className="flex items-center space-x-3">
//                 <input
//                   type="checkbox"
//                   checked={selectedContacts.includes(contact.id)}
//                   onChange={() => handleContactSelect(contact.id)}
//                   className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-1"
//                 />
//                 <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
//                   <span className="text-white text-sm font-medium">
//                     {contact.name.split(' ').map(n => n[0]).join('')}
//                   </span>
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   {renderEditableCell(contact, 'name', contact.name)}
//                   <div className="text-xs text-gray-500 mt-1">{contact.lastActivity}</div>
//                 </div>
//               </div>
//               <button className="p-1 hover:bg-gray-100 rounded">
//                 <MoreHorizontal className="w-4 h-4 text-gray-400" />
//               </button>
//             </div>

//             <div className="space-y-2 text-sm">
//               <div>
//                 <span className="text-gray-500 text-xs">Email:</span>
//                 {renderEditableCell(contact, 'email', contact.email)}
//               </div>
//               <div>
//                 <span className="text-gray-500 text-xs">Phone:</span>
//                 {renderEditableCell(contact, 'phone', contact.phone)}
//               </div>
//               <div>
//                 <span className="text-gray-500 text-xs">Company:</span>
//                 {renderEditableCell(contact, 'company', contact.company)}
//               </div>
//               <div>
//                 <span className="text-gray-500 text-xs">Website:</span>
//                 {renderEditableCell(contact, 'website', contact.website)}
//               </div>
//               <div>
//                 <span className="text-gray-500 text-xs">Status:</span>
//                 {renderEditableCell(contact, 'status', contact.status)}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Pagination */}
//       {contacts.length > contactsPerPage && (
//         <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
//           <div className="text-sm text-gray-500">
//             Showing {startIndex + 1} to {Math.min(startIndex + contactsPerPage, contacts.length)} of {contacts.length} contacts
//           </div>
//           <div className="flex items-center space-x-2">
//             <button
//               onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//               disabled={currentPage === 1}
//               className={`p-2 rounded-lg ${currentPage === 1
//                 ? 'text-gray-400 cursor-not-allowed'
//                 : 'text-gray-600 hover:bg-gray-100'
//                 }`}
//             >
//               <ChevronLeft className="w-4 h-4" />
//             </button>

//             <div className="flex space-x-1">
//               {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
//                 <button
//                   key={page}
//                   onClick={() => setCurrentPage(page)}
//                   className={`px-3 py-1 rounded-lg text-sm ${currentPage === page
//                     ? 'bg-blue-600 text-white'
//                     : 'text-gray-600 hover:bg-gray-100'
//                     }`}
//                 >
//                   {page}
//                 </button>
//               ))}
//             </div>

//             <button
//               onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
//               disabled={currentPage === totalPages}
//               className={`p-2 rounded-lg ${currentPage === totalPages
//                 ? 'text-gray-400 cursor-not-allowed'
//                 : 'text-gray-600 hover:bg-gray-100'
//                 }`}
//             >
//               <ChevronRight className="w-4 h-4" />
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Floating Add Contact Button (only when contacts exist) */}
//       <div className="fixed bottom-8 right-8">
//         <button
//           onClick={() => setIsModalOpen(true)}
//           className="bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
//         >
//           <Plus className="w-5 h-5" />
//           <span className="hidden sm:inline">Add Contact</span>
//         </button>
//       </div>

//       {/* Add Contact Modal */}
//       <AddContactModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         onSubmit={handleAddContact}
//       />
//     </div>
//   );
// }