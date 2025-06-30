"use client";
import { useState } from 'react';
import { 
  MoreHorizontal, 
  Edit2, 
  Check, 
  X, 
  Eye, 
  Trash2, 
  Download,
  Share,
  Copy,
  ExternalLink,
  Phone,
  Mail,
  Globe,
  Building,
  Calendar,
  User,
  Settings,
  Archive,
  Star
} from 'lucide-react';

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

interface EditingCell {
  contactId: string;
  field: keyof Contact;
}

interface ContactTableProps {
  contacts: Contact[];
  selectedContacts: string[];
  onContactSelect: (contactId: string) => void;
  onSelectAll: () => void;
  onContactUpdate: (contactId: string, field: keyof Contact, value: string) => void;
}

const ContactTable: React.FC<ContactTableProps> = ({ 
  contacts, 
  selectedContacts, 
  onContactSelect, 
  onSelectAll,
  onContactUpdate 
}) => {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState('');
  const [hoveredContact, setHoveredContact] = useState<string | null>(null);
  const [showActionModal, setShowActionModal] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState<string | null>(null);

  const startEditing = (contactId: string, field: keyof Contact) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      setEditingCell({ contactId, field });
      setEditValue(contact[field] as string);
    }
  };

  const saveEdit = () => {
    if (editingCell) {
      onContactUpdate(editingCell.contactId, editingCell.field, editValue);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border";

    switch (status) {
      case 'Active Client':
        return `${baseClasses} bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200`;
      case 'Prospection':
        return `${baseClasses} bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200`;
      case 'Supplier':
        return `${baseClasses} bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border-purple-200`;
      case 'Add Segment':
        return `${baseClasses} bg-gradient-to-r from-amber-50 to-orange-50 text-orange-700 border-orange-200`;
      default:
        return `${baseClasses} bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200`;
    }
  };

  const handleViewContact = (contactId: string) => {
    setShowViewModal(contactId);
  };

  const handleDeleteContact = (contactId: string) => {
    if (confirm('Are you sure you want to move this contact to trash?')) {
      console.log('Delete contact:', contactId);
    }
  };

  const renderEditableCell = (contact: Contact, field: keyof Contact, value: string) => {
    const isEditing = editingCell?.contactId === contact.id && editingCell?.field === field;

    if (isEditing) {
      return (
        <div className="flex items-center space-x-2 bg-white rounded-lg border-2 border-blue-200 p-2 shadow-lg">
          {field === 'status' ? (
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="text-sm border-0 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              autoFocus
            >
              <option value="Prospection">Prospection</option>
              <option value="Active Client">Active Client</option>
              <option value="Supplier">Supplier</option>
              <option value="Add Segment">Add Segment</option>
            </select>
          ) : (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="text-sm border-0 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0 flex-1 bg-gray-50"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
            />
          )}
          <button 
            onClick={saveEdit} 
            className="text-emerald-600 hover:text-emerald-700 p-1 rounded-full hover:bg-emerald-50 transition-all"
          >
            <Check className="w-4 h-4" />
          </button>
          <button 
            onClick={cancelEdit} 
            className="text-red-600 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <div
        className="group cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 px-3 py-2 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-100"
        onClick={() => startEditing(contact.id, field)}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 truncate">
            {field === 'status' ? (
              <div className="flex flex-col space-y-2">
                <span className={getStatusBadge(value)}>{value}</span>
                {contact.customSegment && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    Segment: {contact.customSegment}
                  </span>
                )}
              </div>
            ) : (
              value || (field === 'website' ? 'N/A' : '')
            )}
          </span>
          <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 ml-2 flex-shrink-0 transition-opacity" />
        </div>
      </div>
    );
  };

  const ActionButtons = ({ contact }: { contact: Contact }) => (
    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
      <button
        onClick={() => handleViewContact(contact.id)}
        className="p-2 hover:bg-blue-100 rounded-lg transition-all duration-200 text-blue-600 hover:text-blue-700 hover:shadow-md"
        title="View Contact"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleDeleteContact(contact.id)}
        className="p-2 hover:bg-red-100 rounded-lg transition-all duration-200 text-red-600 hover:text-red-700 hover:shadow-md"
        title="Move to Trash"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      <button
        onClick={() => setShowActionModal(contact.id)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-700 hover:shadow-md"
        title="More Actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  );

  const ActionModal = ({ contact }: { contact: Contact }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Contact Actions</h3>
          <button
            onClick={() => setShowActionModal(null)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-3">
          <ActionItem icon={<Eye />} label="View Details" onClick={() => handleViewContact(contact.id)} />
          <ActionItem icon={<Download />} label="Download vCard" onClick={() => console.log('Download')} />
          <ActionItem icon={<Share />} label="Share Contact" onClick={() => console.log('Share')} />
          <ActionItem icon={<Copy />} label="Duplicate" onClick={() => console.log('Duplicate')} />
          <ActionItem icon={<Star />} label="Add to Favorites" onClick={() => console.log('Favorite')} />
          <ActionItem icon={<Archive />} label="Archive" onClick={() => console.log('Archive')} />
          <div className="border-t pt-3 mt-3">
            <ActionItem 
              icon={<Trash2 />} 
              label="Move to Trash" 
              onClick={() => handleDeleteContact(contact.id)}
              className="text-red-600 hover:bg-red-50"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const ViewModal = ({ contact }: { contact: Contact }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 transform transition-all">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Contact Details</h3>
          <button
            onClick={() => setShowViewModal(null)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center space-x-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-lg font-bold">
              {contact.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </span>
          </div>
          <div>
            <h4 className="text-xl font-semibold text-gray-900">{contact.name}</h4>
            <span className={getStatusBadge(contact.status)}>{contact.status}</span>
          </div>
        </div>

        <div className="space-y-4">
          <ContactDetail icon={<Mail />} label="Email" value={contact.email} />
          <ContactDetail icon={<Phone />} label="Phone" value={contact.phone} />
          <ContactDetail icon={<Building />} label="Company" value={contact.company} />
          <ContactDetail icon={<Globe />} label="Website" value={contact.website} />
          <ContactDetail icon={<Calendar />} label="Last Activity" value={contact.lastActivity} />
        </div>

        <div className="flex space-x-3 mt-8">
          <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Edit Contact
          </button>
          <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Share className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const ActionItem = ({ icon, label, onClick, className = "" }: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-50 transition-colors text-left ${className}`}
    >
      <span className="w-5 h-5">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );

  const ContactDetail = ({ icon, label, value }: {
    icon: React.ReactNode;
    label: string;
    value: string;
  }) => (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      <span className="text-gray-500 w-5 h-5">{icon}</span>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block px-6 py-4 bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Enhanced Table Header */}
        <div className="grid grid-cols-12 gap-4 items-center py-4 border-b-2 border-gray-100 text-sm font-semibold text-gray-700 bg-gradient-to-r from-gray-50 to-white rounded-t-lg">
          <div className="col-span-1 flex items-center">
            <input
              type="checkbox"
              checked={selectedContacts.length === contacts.length && contacts.length > 0}
              onChange={onSelectAll}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
            />
          </div>
          <div className="col-span-2 flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <span>Profile</span>
          </div>
          <div className="col-span-3 flex items-center space-x-2">
            <Mail className="w-4 h-4 text-gray-500" />
            <span>Contact Info</span>
          </div>
          <div className="col-span-2 flex items-center space-x-2">
            <Building className="w-4 h-4 text-gray-500" />
            <span>Company</span>
          </div>
          <div className="col-span-2 flex items-center space-x-2">
            <Settings className="w-4 h-4 text-gray-500" />
            <span>Category</span>
          </div>
          <div className="col-span-2 flex items-center justify-center">
            <span>Actions</span>
          </div>
        </div>

        {/* Enhanced Table Rows */}
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="group grid grid-cols-12 gap-4 items-center py-2 border-b border-gray-50 hover:bg-gradient-to-r hover:from-blue-25 hover:to-indigo-25 transition-all duration-200 rounded-lg"
            onMouseEnter={() => setHoveredContact(contact.id)}
            onMouseLeave={() => setHoveredContact(null)}
          >
            <div className="col-span-1">
              <input
                type="checkbox"
                checked={selectedContacts.includes(contact.id)}
                onChange={() => onContactSelect(contact.id)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
              />
            </div>

            <div className="col-span-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-shadow">
                  <span className="text-white text-sm font-bold">
                    {contact.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 text-sm mb-1 truncate">{contact.name}</div>
                  <div className="text-xs text-gray-500 flex items-center space-x-1">
                    {/* <Calendar className="w-3 h-3" /> */}
                    {/* <span>{contact.lastActivity}</span> */}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-3">
              <div className="space-y-1">
                {renderEditableCell(contact, 'email', contact.email)}
                {/* {renderEditableCell(contact, 'phone', contact.phone)} */}
              </div>
            </div>

            <div className="col-span-2">
              <div className="space-y-1">
                {renderEditableCell(contact, 'company', contact.company)}
                {/* {renderEditableCell(contact, 'website', contact.website)} */}
              </div>
            </div>

            <div className="col-span-2">
              {renderEditableCell(contact, 'status', contact.status)}
            </div>

            <div className="col-span-2 flex justify-center">
              <ActionButtons contact={contact} />
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Mobile Card View */}
      <div className="lg:hidden px-4 py-3 space-y-6">
        {contacts.map((contact) => (
          <div key={contact.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={selectedContacts.includes(contact.id)}
                  onChange={() => onContactSelect(contact.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-1"
                />
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">
                    {contact.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  {renderEditableCell(contact, 'name', contact.name)}
                  <div className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{contact.lastActivity}</span>
                  </div>
                </div>
              </div>
              <ActionButtons contact={contact} />
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-400" />
                {renderEditableCell(contact, 'email', contact.email)}
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-400" />
                {renderEditableCell(contact, 'phone', contact.phone)}
              </div>
              <div className="flex items-center space-x-3">
                <Building className="w-4 h-4 text-gray-400" />
                {renderEditableCell(contact, 'company', contact.company)}
              </div>
              <div className="flex items-center space-x-3">
                <Globe className="w-4 h-4 text-gray-400" />
                {renderEditableCell(contact, 'website', contact.website)}
              </div>
              <div className="flex items-center space-x-3">
                <Settings className="w-4 h-4 text-gray-400" />
                {renderEditableCell(contact, 'status', contact.status)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {showActionModal && (
        <ActionModal contact={contacts.find(c => c.id === showActionModal)!} />
      )}
      
      {showViewModal && (
        <ViewModal contact={contacts.find(c => c.id === showViewModal)!} />
      )}
    </>
  );
}

export default ContactTable;