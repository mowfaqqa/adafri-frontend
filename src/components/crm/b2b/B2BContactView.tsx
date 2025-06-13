"use client";
import { useState, useEffect } from 'react';
import { Search, Plus, Building, Users, FileText, Phone, Mail, Globe, Upload, Check, AlertCircle } from 'lucide-react';
import { CSVUploadModal, ContactFormData } from '../b2c/modals/CSVUploadModal';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  position: string;
  department: string;
  status: 'Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Customer' | 'Partner' | string;
  lastActivity: string;
  value: number;
  customSegment?: string;
}

interface ContactViewProps {
  activityType: 'B2B' | 'B2B2C' | 'B2G';
  onContactsUpdate?: (contacts: Contact[]) => void;
}

export function B2BContactView({ activityType, onContactsUpdate }: ContactViewProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const getActivityConfig = () => {
    switch (activityType) {
      case 'B2B':
        return {
          icon: Building,
          title: 'Business Contacts',
          statuses: ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Customer', 'Partner'],
          fields: { position: 'Position', department: 'Department' }
        };
      case 'B2B2C':
        return {
          icon: Users,
          title: 'Channel Partners',
          statuses: ['Lead', 'Qualified', 'Channel Partner', 'Distributor', 'Reseller', 'End Customer'],
          fields: { position: 'Role', department: 'Channel Type' }
        };
      case 'B2G':
        return {
          icon: FileText,
          title: 'Government Contacts',
          statuses: ['Lead', 'Qualified', 'Proposal', 'Procurement', 'Contract', 'Compliance'],
          fields: { position: 'Title', department: 'Agency' }
        };
      default:
        return {
          icon: Building,
          title: 'Contacts',
          statuses: ['Lead', 'Customer'],
          fields: { position: 'Position', department: 'Department' }
        };
    }
  };

  const handleCSVUpload = (csvContacts: ContactFormData[]) => {
    const newContacts: Contact[] = csvContacts.map((contactData, index) => ({
      id: `csv_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      name: contactData.name,
      email: contactData.email,
      phone: contactData.phone,
      company: contactData.company,
      website: contactData.website || '',
      // Map the CSV fields to the expected Contact interface
      position: 'Position', // Default value since CSVUploadModal doesn't have this field
      department: 'Department', // Default value since CSVUploadModal doesn't have this field
      status: contactData.status || 'Prospection',
      lastActivity: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      value: Math.floor(Math.random() * 100000) + 5000,
      customSegment: contactData.customSegment || ''
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

  const config = getActivityConfig();
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || contact.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    if (onContactsUpdate) {
      onContactsUpdate(contacts);
    }
  }, [contacts, onContactsUpdate]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Lead': 'bg-yellow-100 text-yellow-800',
      'Qualified': 'bg-blue-100 text-blue-800',
      'Proposal': 'bg-purple-100 text-purple-800',
      'Negotiation': 'bg-orange-100 text-orange-800',
      'Customer': 'bg-green-100 text-green-800',
      'Partner': 'bg-indigo-100 text-indigo-800',
      'Channel Partner': 'bg-teal-100 text-teal-800',
      'Distributor': 'bg-cyan-100 text-cyan-800',
      'Reseller': 'bg-pink-100 text-pink-800',
      'End Customer': 'bg-emerald-100 text-emerald-800',
      'Procurement': 'bg-red-100 text-red-800',
      'Contract': 'bg-green-100 text-green-800',
      'Compliance': 'bg-gray-100 text-gray-800',
      // Add colors for CSVUploadModal statuses
      'Prospection': 'bg-blue-100 text-blue-600',
      'Active Client': 'bg-green-100 text-green-700',
      'Supplier': 'bg-purple-100 text-purple-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (contacts.length === 0) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <config.icon className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No {config.title} Yet</h3>
          <p className="text-gray-500 mb-6 max-w-md">
            Start building your {activityType} network by adding your first contact.
          </p>
          <button 
            onClick={() => setIsCSVModalOpen(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span>Import CSV</span>
          </button>
        </div>

        {/* CSV Upload Modal */}
        <CSVUploadModal
          isOpen={isCSVModalOpen}
          onClose={() => setIsCSVModalOpen(false)}
          onUpload={handleCSVUpload}
        />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Upload Status */}
      {uploadStatus.type && (
        <div className={`mb-4 px-4 py-3 rounded-lg ${
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <config.icon className="w-6 h-6" />
            <span>{config.title}</span>
          </h1>
          <p className="text-gray-500 mt-1">{contacts.length} contacts</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All Status</option>
            {config.statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
            {/* Add CSV modal statuses */}
            <option value="Prospection">Prospection</option>
            <option value="Active Client">Active Client</option>
            <option value="Supplier">Supplier</option>
          </select>
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredContacts.map(contact => (
          <div key={contact.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {getInitials(contact.name)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-gray-900 text-sm truncate">{contact.name}</h4>
                  <p className="text-xs text-gray-500 truncate">{contact.position}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(contact.status)}`}>
                {contact.status}
              </span>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Building className="w-3 h-3" />
                <span className="truncate">{contact.company}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Mail className="w-3 h-3" />
                <span className="truncate">{contact.email}</span>
              </div>
              {contact.phone && (
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <Phone className="w-3 h-3" />
                  <span>{contact.phone}</span>
                </div>
              )}
              {contact.website && (
                <div className="flex items-center space-x-2 text-xs text-blue-600">
                  <Globe className="w-3 h-3" />
                  <span className="truncate">{contact.website}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{contact.department}</span>
              <span>{contact.lastActivity}</span>
            </div>

            {contact.value > 0 && (
              <div className="mt-2 text-xs text-green-600 font-medium">
                ${contact.value.toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col space-y-3">
        <button 
          onClick={() => setIsCSVModalOpen(true)}
          className="bg-green-600 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Upload className="w-5 h-5" />
          <span className="hidden sm:inline">Import CSV</span>
        </button>
        
        <button className="bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Add Contact</span>
        </button>
      </div>

      {/* CSV Upload Modal */}
      <CSVUploadModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onUpload={handleCSVUpload}
      />
    </div>
  );
}





































// "use client";
// import { useState, useEffect } from 'react';
// import { Search, Plus, Building, Users, FileText, Phone, Mail, Globe, Upload, Check, AlertCircle } from 'lucide-react';
// import { CSVUploadModal } from '../b2c/modals/CSVUploadModal';
// // Correct import path - adjust based on your actual file structure
// // Alternative import paths you might need:
// // import { CSVUploadModal } from '../modals/CSVUploadModal';
// // import { CSVUploadModal } from '@/components/modals/CSVUploadModal';

// interface ContactFormData {
//   name: string;
//   email: string;
//   phone: string;
//   company: string;
//   website?: string;
//   position: string;
//   department: string;
//   status: string;
//   customSegment?: string;
// }

// interface Contact {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
//   company: string;
//   website: string;
//   position: string;
//   department: string;
//   status: 'Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Customer' | 'Partner' | string;
//   lastActivity: string;
//   value: number;
//   customSegment?: string;
// }

// interface ContactViewProps {
//   activityType: 'B2B' | 'B2B2C' | 'B2G';
//   onContactsUpdate?: (contacts: Contact[]) => void;
// }

// export function B2BContactView({ activityType, onContactsUpdate }: ContactViewProps) {
//   const [contacts, setContacts] = useState<Contact[]>([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedStatus, setSelectedStatus] = useState<string>('All');
//   const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
//   const [uploadStatus, setUploadStatus] = useState<{ 
//     type: 'success' | 'error' | null; 
//     message: string 
//   }>({ type: null, message: '' });

//   const getActivityConfig = () => {
//     switch (activityType) {
//       case 'B2B':
//         return {
//           icon: Building,
//           title: 'Business Contacts',
//           statuses: ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Customer', 'Partner'],
//           fields: { position: 'Position', department: 'Department' }
//         };
//       case 'B2B2C':
//         return {
//           icon: Users,
//           title: 'Channel Partners',
//           statuses: ['Lead', 'Qualified', 'Channel Partner', 'Distributor', 'Reseller', 'End Customer'],
//           fields: { position: 'Role', department: 'Channel Type' }
//         };
//       case 'B2G':
//         return {
//           icon: FileText,
//           title: 'Government Contacts',
//           statuses: ['Lead', 'Qualified', 'Proposal', 'Procurement', 'Contract', 'Compliance'],
//           fields: { position: 'Title', department: 'Agency' }
//         };
//       default:
//         return {
//           icon: Building,
//           title: 'Contacts',
//           statuses: ['Lead', 'Customer'],
//           fields: { position: 'Position', department: 'Department' }
//         };
//     }
//   };

//   const handleCSVUpload = (csvContacts: ContactFormData[]) => {
//     const newContacts: Contact[] = csvContacts.map((contactData, index) => ({
//       id: `csv_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
//       name: contactData.name,
//       email: contactData.email,
//       phone: contactData.phone,
//       company: contactData.company,
//       website: contactData.website || '',
//       position: contactData.position,
//       department: contactData.department,
//       status: contactData.status,
//       lastActivity: new Date().toLocaleString('en-US', {
//         month: 'short',
//         day: 'numeric',
//         hour: 'numeric',
//         minute: '2-digit',
//         hour12: true
//       }),
//       value: Math.floor(Math.random() * 100000) + 5000,
//       customSegment: contactData.customSegment || ''
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

//   const config = getActivityConfig();
//   const filteredContacts = contacts.filter(contact => {
//     const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          contact.email.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesStatus = selectedStatus === 'All' || contact.status === selectedStatus;
//     return matchesSearch && matchesStatus;
//   });

//   useEffect(() => {
//     if (onContactsUpdate) {
//       onContactsUpdate(contacts);
//     }
//   }, [contacts, onContactsUpdate]);

//   const getStatusColor = (status: string): string => {
//     const colors: Record<string, string> = {
//       'Lead': 'bg-yellow-100 text-yellow-800',
//       'Qualified': 'bg-blue-100 text-blue-800',
//       'Proposal': 'bg-purple-100 text-purple-800',
//       'Negotiation': 'bg-orange-100 text-orange-800',
//       'Customer': 'bg-green-100 text-green-800',
//       'Partner': 'bg-indigo-100 text-indigo-800',
//       'Channel Partner': 'bg-teal-100 text-teal-800',
//       'Distributor': 'bg-cyan-100 text-cyan-800',
//       'Reseller': 'bg-pink-100 text-pink-800',
//       'End Customer': 'bg-emerald-100 text-emerald-800',
//       'Procurement': 'bg-red-100 text-red-800',
//       'Contract': 'bg-green-100 text-green-800',
//       'Compliance': 'bg-gray-100 text-gray-800'
//     };
//     return colors[status] || 'bg-gray-100 text-gray-800';
//   };

//   const getInitials = (name: string): string => {
//     return name.split(' ').map(n => n[0]).join('').toUpperCase();
//   };

//   if (contacts.length === 0) {
//     return (
//       <div className="p-6 bg-white min-h-screen">
//         <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
//           <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
//             <config.icon className="w-12 h-12 text-gray-400" />
//           </div>
//           <h3 className="text-xl font-semibold text-gray-900 mb-2">No {config.title} Yet</h3>
//           <p className="text-gray-500 mb-6 max-w-md">
//             Start building your {activityType} network by adding your first contact.
//           </p>
//           <button 
//             onClick={() => setIsCSVModalOpen(true)}
//             className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
//           >
//             <Upload className="w-5 h-5" />
//             <span>Import CSV</span>
//           </button>
//         </div>

//         {/* CSV Upload Modal */}
//         <CSVUploadModal
//           isOpen={isCSVModalOpen}
//           onClose={() => setIsCSVModalOpen(false)}
//           onUpload={handleCSVUpload}
//         />
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 bg-white min-h-screen">
//       {/* Upload Status */}
//       {uploadStatus.type && (
//         <div className={`mb-4 px-4 py-3 rounded-lg ${
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
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
//             <config.icon className="w-6 h-6" />
//             <span>{config.title}</span>
//           </h1>
//           <p className="text-gray-500 mt-1">{contacts.length} contacts</p>
//         </div>
//         <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search contacts..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             />
//           </div>
//           <select
//             value={selectedStatus}
//             onChange={(e) => setSelectedStatus(e.target.value)}
//             className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           >
//             <option value="All">All Status</option>
//             {config.statuses.map(status => (
//               <option key={status} value={status}>{status}</option>
//             ))}
//           </select>
//         </div>
//       </div>

//       {/* Contacts Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//         {filteredContacts.map(contact => (
//           <div key={contact.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
//             <div className="flex items-start justify-between mb-3">
//               <div className="flex items-center space-x-3">
//                 <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
//                   <span className="text-white text-sm font-medium">
//                     {getInitials(contact.name)}
//                   </span>
//                 </div>
//                 <div className="min-w-0 flex-1">
//                   <h4 className="font-medium text-gray-900 text-sm truncate">{contact.name}</h4>
//                   <p className="text-xs text-gray-500 truncate">{contact.position}</p>
//                 </div>
//               </div>
//               <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(contact.status)}`}>
//                 {contact.status}
//               </span>
//             </div>

//             <div className="space-y-2 mb-3">
//               <div className="flex items-center space-x-2 text-xs text-gray-600">
//                 <Building className="w-3 h-3" />
//                 <span className="truncate">{contact.company}</span>
//               </div>
//               <div className="flex items-center space-x-2 text-xs text-gray-600">
//                 <Mail className="w-3 h-3" />
//                 <span className="truncate">{contact.email}</span>
//               </div>
//               {contact.phone && (
//                 <div className="flex items-center space-x-2 text-xs text-gray-600">
//                   <Phone className="w-3 h-3" />
//                   <span>{contact.phone}</span>
//                 </div>
//               )}
//               {contact.website && (
//                 <div className="flex items-center space-x-2 text-xs text-blue-600">
//                   <Globe className="w-3 h-3" />
//                   <span className="truncate">{contact.website}</span>
//                 </div>
//               )}
//             </div>

//             <div className="flex items-center justify-between text-xs text-gray-500">
//               <span>{contact.department}</span>
//               <span>{contact.lastActivity}</span>
//             </div>

//             {contact.value > 0 && (
//               <div className="mt-2 text-xs text-green-600 font-medium">
//                 ${contact.value.toLocaleString()}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>

//       {/* Add Buttons */}
//       <div className="fixed bottom-8 right-8 flex flex-col space-y-3">
//         <button 
//           onClick={() => setIsCSVModalOpen(true)}
//           className="bg-green-600 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
//         >
//           <Upload className="w-5 h-5" />
//           <span className="hidden sm:inline">Import CSV</span>
//         </button>
        
//         <button className="bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
//           <Plus className="w-5 h-5" />
//           <span className="hidden sm:inline">Add Contact</span>
//         </button>
//       </div>

//       {/* CSV Upload Modal */}
//       <CSVUploadModal
//         isOpen={isCSVModalOpen}
//         onClose={() => setIsCSVModalOpen(false)}
//         onUpload={handleCSVUpload}
//       />
//     </div>
//   );
// }







































// "use client";
// import { useState, useEffect } from 'react';
// import { Search, Plus, Building, Users, FileText, Phone, Mail, Globe, Upload, Check, AlertCircle } from 'lucide-react';
// import { CSVUploadModal } from '../b2c/modals/CSVUploadModal';


// interface ContactFormData {
//   name: string;
//   email: string;
//   phone: string;
//   company: string;
//   website?: string;
//   position: string;
//   department: string;
//   status: string;
//   customSegment?: string;
// }

// interface Contact {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
//   company: string;
//   website: string;
//   position: string;
//   department: string;
//   status: 'Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Customer' | 'Partner' | string;
//   lastActivity: string;
//   value: number;
//   customSegment?: string;
// }


// interface CSVUploadModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onUpload: (contacts: ContactFormData[]) => void;
// }

// interface ContactViewProps {
//   activityType: 'B2B' | 'B2B2C' | 'B2G';
//   onContactsUpdate?: (contacts: Contact[]) => void;
// }

// export function B2BContactView({ activityType, onContactsUpdate }: ContactViewProps) {
//   const [contacts, setContacts] = useState<Contact[]>([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedStatus, setSelectedStatus] = useState<string>('All');
//   const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
//   const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

//   const getActivityConfig = () => {
//     switch (activityType) {
//       case 'B2B':
//         return {
//           icon: Building,
//           title: 'Business Contacts',
//           statuses: ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Customer', 'Partner'],
//           fields: { position: 'Position', department: 'Department' }
//         };
//       case 'B2B2C':
//         return {
//           icon: Users,
//           title: 'Channel Partners',
//           statuses: ['Lead', 'Qualified', 'Channel Partner', 'Distributor', 'Reseller', 'End Customer'],
//           fields: { position: 'Role', department: 'Channel Type' }
//         };
//       case 'B2G':
//         return {
//           icon: FileText,
//           title: 'Government Contacts',
//           statuses: ['Lead', 'Qualified', 'Proposal', 'Procurement', 'Contract', 'Compliance'],
//           fields: { position: 'Title', department: 'Agency' }
//         };
//       default:
//         return {
//           icon: Building,
//           title: 'Contacts',
//           statuses: ['Lead', 'Customer'],
//           fields: { position: 'Position', department: 'Department' }
//         };
//     }
//   };

//   const handleCSVUpload = (csvContacts: ContactFormData[]) => {
//     const newContacts: Contact[] = csvContacts.map((contactData, index) => ({
//       id: `csv_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
//       name: contactData.name,
//       email: contactData.email,
//       phone: contactData.phone,
//       company: contactData.company,
//       website: contactData.website || '',
//       position: contactData.position,
//       department: contactData.department,
//       status: contactData.status,
//       lastActivity: new Date().toLocaleString('en-US', {
//         month: 'short',
//         day: 'numeric',
//         hour: 'numeric',
//         minute: '2-digit',
//         hour12: true
//       }),
//       value: Math.floor(Math.random() * 100000) + 5000,
//       customSegment: contactData.customSegment || ''
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

//   const config = getActivityConfig();
//   const filteredContacts = contacts.filter(contact => {
//     const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          contact.email.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesStatus = selectedStatus === 'All' || contact.status === selectedStatus;
//     return matchesSearch && matchesStatus;
//   });

//   useEffect(() => {
//     if (onContactsUpdate) {
//       onContactsUpdate(contacts);
//     }
//   }, [contacts, onContactsUpdate]);

//   const getStatusColor = (status: string) => {
//     const colors = {
//       'Lead': 'bg-yellow-100 text-yellow-800',
//       'Qualified': 'bg-blue-100 text-blue-800',
//       'Proposal': 'bg-purple-100 text-purple-800',
//       'Negotiation': 'bg-orange-100 text-orange-800',
//       'Customer': 'bg-green-100 text-green-800',
//       'Partner': 'bg-indigo-100 text-indigo-800',
//       'Channel Partner': 'bg-teal-100 text-teal-800',
//       'Distributor': 'bg-cyan-100 text-cyan-800',
//       'Reseller': 'bg-pink-100 text-pink-800',
//       'End Customer': 'bg-emerald-100 text-emerald-800',
//       'Procurement': 'bg-red-100 text-red-800',
//       'Contract': 'bg-green-100 text-green-800',
//       'Compliance': 'bg-gray-100 text-gray-800'
//     };
//     return colors[status] || 'bg-gray-100 text-gray-800';
//   };

//   const getInitials = (name: string) => {
//     return name.split(' ').map(n => n[0]).join('').toUpperCase();
//   };

//   if (contacts.length === 0) {
//     return (
//       <div className="p-6 bg-white min-h-screen">
//         <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
//           <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
//             <config.icon className="w-12 h-12 text-gray-400" />
//           </div>
//           <h3 className="text-xl font-semibold text-gray-900 mb-2">No {config.title} Yet</h3>
//           <p className="text-gray-500 mb-6 max-w-md">
//             Start building your {activityType} network by adding your first contact.
//           </p>
//           <button 
//             onClick={() => setIsCSVModalOpen(true)}
//             className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
//           >
//             <Upload className="w-5 h-5" />
//             <span>Import CSV</span>
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 bg-white min-h-screen">
//       {/* Upload Status */}
//       {uploadStatus.type && (
//         <div className={`mb-4 px-4 py-3 rounded-lg ${
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
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
//             <config.icon className="w-6 h-6" />
//             <span>{config.title}</span>
//           </h1>
//           <p className="text-gray-500 mt-1">{contacts.length} contacts</p>
//         </div>
//         <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search contacts..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             />
//           </div>
//           <select
//             value={selectedStatus}
//             onChange={(e) => setSelectedStatus(e.target.value)}
//             className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           >
//             <option value="All">All Status</option>
//             {config.statuses.map(status => (
//               <option key={status} value={status}>{status}</option>
//             ))}
//           </select>
//         </div>
//       </div>

//       {/* Contacts Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//         {filteredContacts.map(contact => (
//           <div key={contact.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
//             <div className="flex items-start justify-between mb-3">
//               <div className="flex items-center space-x-3">
//                 <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
//                   <span className="text-white text-sm font-medium">
//                     {getInitials(contact.name)}
//                   </span>
//                 </div>
//                 <div className="min-w-0 flex-1">
//                   <h4 className="font-medium text-gray-900 text-sm truncate">{contact.name}</h4>
//                   <p className="text-xs text-gray-500 truncate">{contact.position}</p>
//                 </div>
//               </div>
//               <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(contact.status)}`}>
//                 {contact.status}
//               </span>
//             </div>

//             <div className="space-y-2 mb-3">
//               <div className="flex items-center space-x-2 text-xs text-gray-600">
//                 <Building className="w-3 h-3" />
//                 <span className="truncate">{contact.company}</span>
//               </div>
//               <div className="flex items-center space-x-2 text-xs text-gray-600">
//                 <Mail className="w-3 h-3" />
//                 <span className="truncate">{contact.email}</span>
//               </div>
//               {contact.phone && (
//                 <div className="flex items-center space-x-2 text-xs text-gray-600">
//                   <Phone className="w-3 h-3" />
//                   <span>{contact.phone}</span>
//                 </div>
//               )}
//               {contact.website && (
//                 <div className="flex items-center space-x-2 text-xs text-blue-600">
//                   <Globe className="w-3 h-3" />
//                   <span className="truncate">{contact.website}</span>
//                 </div>
//               )}
//             </div>

//             <div className="flex items-center justify-between text-xs text-gray-500">
//               <span>{contact.department}</span>
//               <span>{contact.lastActivity}</span>
//             </div>

//             {contact.value > 0 && (
//               <div className="mt-2 text-xs text-green-600 font-medium">
//                 ${contact.value.toLocaleString()}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>

//       {/* Add Buttons */}
//       <div className="fixed bottom-8 right-8 flex flex-col space-y-3">
//         <button 
//           onClick={() => setIsCSVModalOpen(true)}
//           className="bg-green-600 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
//         >
//           <Upload className="w-5 h-5" />
//           <span className="hidden sm:inline">Import CSV</span>
//         </button>
        
//         <button className="bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
//           <Plus className="w-5 h-5" />
//           <span className="hidden sm:inline">Add Contact</span>
//         </button>
//       </div>

//       {/* CSV Upload Modal */}
//       <CSVUploadModal
//         isOpen={isCSVModalOpen}
//         onClose={() => setIsCSVModalOpen(false)}
//         onUpload={handleCSVUpload}
//       />
//     </div>
//   );
// }