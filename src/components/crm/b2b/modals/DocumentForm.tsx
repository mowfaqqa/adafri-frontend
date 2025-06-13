"use client";
import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, Building, User, Upload, FileText } from 'lucide-react';
import type { DocumentData, CompanyInfo, InvoiceItem, DocumentType, Contact } from '@/lib/types/invoice/types';

const CompanyInfoForm: React.FC<{
  companyInfo: CompanyInfo;
  onUpdate: (info: CompanyInfo) => void;
  showForm: boolean;
  onToggle: () => void;
}> = ({ companyInfo, onUpdate, showForm, onToggle }) => {
  const [info, setInfo] = useState<CompanyInfo>(companyInfo);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const logoUrl = event.target?.result as string;
        const updatedInfo = { ...info, logo: logoUrl };
        setInfo(updatedInfo);
        onUpdate(updatedInfo);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = (field: keyof CompanyInfo, value: string) => {
    const updatedInfo = { ...info, [field]: value };
    setInfo(updatedInfo);
    onUpdate(updatedInfo);
  };

  if (!showForm) {
    return (
      <div className="mb-4">
        <button 
          onClick={onToggle} 
          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
        >
          Update Company Information
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Building className="w-5 h-5 mr-2 text-blue-600" />
          Company Information
        </h3>
        <button 
          onClick={onToggle} 
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
            <div className="flex items-center space-x-4">
              {info.logo && (
                <img 
                  src={info.logo} 
                  alt="Company Logo" 
                  className="w-16 h-16 object-contain rounded-lg border"
                />
              )}
              <label className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload className="w-4 h-4" />
                <span className="text-sm">Upload Logo</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input 
              type="text" 
              value={info.name} 
              onChange={(e) => handleUpdate('name', e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your Company Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea 
              value={info.address} 
              onChange={(e) => handleUpdate('address', e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
              placeholder="Company Address"
            />
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              value={info.email} 
              onChange={(e) => handleUpdate('email', e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="company@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input 
              type="tel" 
              value={info.phone} 
              onChange={(e) => handleUpdate('phone', e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
            <input 
              type="text" 
              value={info.taxId || ''} 
              onChange={(e) => handleUpdate('taxId', e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tax Identification Number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company ID</label>
            <input 
              type="text" 
              value={info.companyId || ''} 
              onChange={(e) => handleUpdate('companyId', e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Company Registration ID"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface DocumentFormProps {
  document: DocumentData;
  onUpdate: (doc: DocumentData) => void;
  contacts?: Contact[];
  onUpdateCompanyInfo?: (info: CompanyInfo) => void;
}

export const DocumentForm: React.FC<DocumentFormProps> = ({ 
  document, 
  onUpdate, 
  contacts = [], 
  onUpdateCompanyInfo 
}) => {
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [showCompanyForm, setShowCompanyForm] = useState(false);

  const handleContactSelect = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      onUpdate({
        ...document,
        toCompany: contact.company,
        toContact: contact.name,
        toEmail: contact.email,
        toPhone: contact.phone
      });
    }
    setSelectedContact(contactId);
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    onUpdate({
      ...document,
      items: [...document.items, newItem]
    });
  };

  const removeItem = (itemId: string) => {
    onUpdate({
      ...document,
      items: document.items.filter(item => item.id !== itemId)
    });
  };

  const updateItem = (itemId: string, field: keyof InvoiceItem, value: string | number) => {
    onUpdate({
      ...document,
      items: document.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
          }
          return updatedItem;
        }
        return item;
      })
    });
  };

  const getStatusOptions = () => {
    if (document.type === 'quote') {
      return ['Draft', 'Sent', 'Accepted', 'Declined', 'Cancelled'];
    }
    return ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];
  };

  const handleCompanyInfoUpdate = (info: CompanyInfo) => {
    onUpdate({ ...document, companyInfo: info });
    onUpdateCompanyInfo?.(info);
  };

  return (
    <div className="space-y-6">
      <CompanyInfoForm
        companyInfo={document.companyInfo}
        onUpdate={handleCompanyInfoUpdate}
        showForm={showCompanyForm}
        onToggle={() => setShowCompanyForm(!showCompanyForm)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-gray-600" />
            {document.type === 'invoice' ? 'Invoice' : 'Quote'} Details
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select 
              value={document.type} 
              onChange={(e) => onUpdate({ 
                ...document, 
                type: e.target.value as DocumentType,
                terms: e.target.value === 'quote' 
                  ? 'This quote is valid for 30 days from the date of issue.' 
                  : 'Payment is due within 30 days of invoice date.'
              })} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="invoice">Invoice</option>
              <option value="quote">Quote</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {document.type === 'invoice' ? 'Invoice' : 'Quote'} Number
              </label>
              <input 
                type="text" 
                value={document.invoiceNumber} 
                onChange={(e) => onUpdate({ ...document, invoiceNumber: e.target.value })} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`${document.type === 'invoice' ? 'INV' : 'QUO'}-001`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                value={document.status} 
                onChange={(e) => onUpdate({ ...document, status: e.target.value })} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {getStatusOptions().map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date
              </label>
              <input 
                type="date" 
                value={document.date} 
                onChange={(e) => onUpdate({ ...document, date: e.target.value })} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                {document.type === 'invoice' ? 'Due Date' : 'Valid Until'}
              </label>
              <input 
                type="date" 
                value={document.type === 'invoice' ? document.dueDate : (document.validUntil || '')} 
                onChange={(e) => onUpdate({ 
                  ...document, 
                  ...(document.type === 'invoice' 
                    ? { dueDate: e.target.value } 
                    : { validUntil: e.target.value }
                  ) 
                })} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <User className="w-5 h-5 mr-2 text-gray-600" />
            {document.type === 'invoice' ? 'Bill To' : 'Quote For'}
          </h3>
          {contacts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Contact</label>
              <select 
                value={selectedContact} 
                onChange={(e) => handleContactSelect(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a contact...</option>
                {contacts.map(contact => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} - {contact.company}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3">
            <input 
              type="text" 
              placeholder="Company Name" 
              value={document.toCompany} 
              onChange={(e) => onUpdate({ ...document, toCompany: e.target.value })} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input 
              type="text" 
              placeholder="Contact Person" 
              value={document.toContact} 
              onChange={(e) => onUpdate({ ...document, toContact: e.target.value })} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea 
              placeholder="Address" 
              value={document.toAddress} 
              onChange={(e) => onUpdate({ ...document, toAddress: e.target.value })} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="email" 
                placeholder="Email" 
                value={document.toEmail} 
                onChange={(e) => onUpdate({ ...document, toEmail: e.target.value })} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input 
                type="tel" 
                placeholder="Phone" 
                value={document.toPhone} 
                onChange={(e) => onUpdate({ ...document, toPhone: e.target.value })} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            {document.type === 'invoice' ? 'Invoice' : 'Quote'} Items
          </h3>
          <button 
            onClick={addItem} 
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
            <div className="col-span-5">Description</div>
            <div className="col-span-2">Quantity</div>
            <div className="col-span-2">Unit Price</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-1"></div>
          </div>
          
          {document.items.map((item) => (
            <div key={item.id} className="px-4 py-3 grid grid-cols-12 gap-4 border-t border-gray-200">
              <div className="col-span-5">
                <textarea 
                  value={item.description} 
                  onChange={(e) => updateItem(item.id, 'description', e.target.value)} 
                  placeholder="Item description..." 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none text-sm"
                />
              </div>
              <div className="col-span-2">
                <input 
                  type="number" 
                  value={item.quantity} 
                  onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  min="0" 
                  step="0.01"
                  placeholder="1"
                />
              </div>
              <div className="col-span-2">
                <input 
                  type="number" 
                  value={item.unitPrice} 
                  onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  min="0" 
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div className="col-span-2">
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium">
                  ${item.total.toFixed(2)}
                </div>
              </div>
              <div className="col-span-1">
                {document.items.length > 1 && (
                  <button 
                    onClick={() => removeItem(item.id)} 
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea 
              value={document.notes} 
              onChange={(e) => onUpdate({ ...document, notes: e.target.value })} 
              placeholder="Additional notes..." 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
            <textarea 
              value={document.terms} 
              onChange={(e) => onUpdate({ ...document, terms: e.target.value })} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
              placeholder={document.type === 'quote' 
                ? 'This quote is valid for 30 days from the date of issue.' 
                : 'Payment is due within 30 days of invoice date.'
              }
            />
          </div>
          {document.type === 'invoice' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <input 
                type="text" 
                value={document.paymentMethod || ''} 
                onChange={(e) => onUpdate({ ...document, paymentMethod: e.target.value })} 
                placeholder="Bank Transfer, Credit Card, etc." 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            {document.type === 'invoice' ? 'Invoice' : 'Quote'} Summary
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Subtotal:</span>
              <span className="font-medium">${document.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Discount:</span>
              <input 
                type="number" 
                value={document.discountRate} 
                onChange={(e) => onUpdate({ ...document, discountRate: parseFloat(e.target.value) || 0 })} 
                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" 
                min="0" 
                max="100" 
                step="0.1"
              />
              <span className="text-sm text-gray-600">%</span>
              <span className="ml-auto font-medium">-${document.discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Tax:</span>
              <input 
                type="number" 
                value={document.taxRate} 
                onChange={(e) => onUpdate({ ...document, taxRate: parseFloat(e.target.value) || 0 })} 
                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" 
                min="0" 
                max="100" 
                step="0.1"
              />
              <span className="text-sm text-gray-600">%</span>
              <span className="ml-auto font-medium">${document.taxAmount.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-lg font-bold text-blue-600">${document.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
























































































// "use client";
// import React, { useState } from 'react';
// import { X, Plus, Trash2, Calendar, Building, User, Upload, FileText } from 'lucide-react';
// import type { DocumentData, CompanyInfo, InvoiceItem, DocumentType } from './InvoiceModal';

// const CompanyInfoForm: React.FC<{
//   companyInfo: CompanyInfo;
//   onUpdate: (info: CompanyInfo) => void;
//   showForm: boolean;
//   onToggle: () => void;
// }> = ({ companyInfo, onUpdate, showForm, onToggle }) => {
//   const [info, setInfo] = useState<CompanyInfo>(companyInfo);

//   const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file && file.type.startsWith('image/')) {
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         const logoUrl = event.target?.result as string;
//         const updatedInfo = { ...info, logo: logoUrl };
//         setInfo(updatedInfo);
//         onUpdate(updatedInfo);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleUpdate = (field: keyof CompanyInfo, value: string) => {
//     const updatedInfo = { ...info, [field]: value };
//     setInfo(updatedInfo);
//     onUpdate(updatedInfo);
//   };

//   if (!showForm) {
//     return (
//       <div className="mb-4">
//         <button onClick={onToggle} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
//           Update Company Information
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="text-lg font-medium text-gray-900 flex items-center">
//           <Building className="w-5 h-5 mr-2 text-blue-600" />
//           Company Information
//         </h3>
//         <button onClick={onToggle} className="text-gray-500 hover:text-gray-700">
//           <X className="w-4 h-4" />
//         </button>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
//             <div className="flex items-center space-x-4">
//               {info.logo && (
//                 <img src={info.logo} alt="Company Logo" className="w-16 h-16 object-contain rounded-lg border" />
//               )}
//               <label className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
//                 <Upload className="w-4 h-4" />
//                 <span className="text-sm">Upload Logo</span>
//                 <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
//               </label>
//             </div>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
//             <input type="text" value={info.name} onChange={(e) => handleUpdate('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
//             <textarea value={info.address} onChange={(e) => handleUpdate('address', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none" />
//           </div>
//         </div>
//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
//             <input type="email" value={info.email} onChange={(e) => handleUpdate('email', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
//             <input type="tel" value={info.phone} onChange={(e) => handleUpdate('phone', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
//             <input type="text" value={info.taxId || ''} onChange={(e) => handleUpdate('taxId', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Company ID</label>
//             <input type="text" value={info.companyId || ''} onChange={(e) => handleUpdate('companyId', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// interface DocumentFormProps {
//   document: DocumentData;
//   onUpdate: (doc: DocumentData) => void;
//   contacts: Array<{ id: string; name: string; email: string; phone: string; company: string; }>;
//   onUpdateCompanyInfo: (info: CompanyInfo) => void;
// }

// export const DocumentForm: React.FC<DocumentFormProps> = ({ document, onUpdate, contacts, onUpdateCompanyInfo }) => {
//   const [selectedContact, setSelectedContact] = useState<string>('');
//   const [showCompanyForm, setShowCompanyForm] = useState(false);

//   const handleContactSelect = (contactId: string) => {
//     const contact = contacts.find(c => c.id === contactId);
//     if (contact) {
//       onUpdate({
//         ...document,
//         toCompany: contact.company,
//         toContact: contact.name,
//         toEmail: contact.email,
//         toPhone: contact.phone
//       });
//     }
//     setSelectedContact(contactId);
//   };

//   const addItem = () => {
//     const newItem: InvoiceItem = {
//       id: Date.now().toString(),
//       description: '',
//       quantity: 1,
//       unitPrice: 0,
//       total: 0
//     };
//     onUpdate({
//       ...document,
//       items: [...document.items, newItem]
//     });
//   };

//   const removeItem = (itemId: string) => {
//     onUpdate({
//       ...document,
//       items: document.items.filter(item => item.id !== itemId)
//     });
//   };

//   const updateItem = (itemId: string, field: keyof InvoiceItem, value: string | number) => {
//     onUpdate({
//       ...document,
//       items: document.items.map(item => {
//         if (item.id === itemId) {
//           const updatedItem = { ...item, [field]: value };
//           if (field === 'quantity' || field === 'unitPrice') {
//             updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
//           }
//           return updatedItem;
//         }
//         return item;
//       })
//     });
//   };

//   const getStatusOptions = () => {
//     if (document.type === 'quote') {
//       return ['Draft', 'Sent', 'Accepted', 'Declined', 'Cancelled'];
//     }
//     return ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];
//   };

//   return (
//     <div className="space-y-6">
//       <CompanyInfoForm
//         companyInfo={document.companyInfo}
//         onUpdate={onUpdateCompanyInfo}
//         showForm={showCompanyForm}
//         onToggle={() => setShowCompanyForm(!showCompanyForm)}
//       />

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div className="space-y-4">
//           <h3 className="text-lg font-medium text-gray-900 flex items-center">
//             <FileText className="w-5 h-5 mr-2 text-gray-600" />
//             {document.type === 'invoice' ? 'Invoice' : 'Quote'} Details
//           </h3>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
//             <select value={document.type} onChange={(e) => onUpdate({ ...document, type: e.target.value as DocumentType, terms: e.target.value === 'quote' ? 'This quote is valid for 30 days from the date of issue.' : 'Payment is due within 30 days of invoice date.' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
//               <option value="invoice">Invoice</option>
//               <option value="quote">Quote</option>
//             </select>
//           </div>
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">{document.type === 'invoice' ? 'Invoice' : 'Quote'} Number</label>
//               <input type="text" value={document.invoiceNumber} onChange={(e) => onUpdate({ ...document, invoiceNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
//               <select value={document.status} onChange={(e) => onUpdate({ ...document, status: e.target.value as DocumentData['status'] })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
//                 {getStatusOptions().map(status => (
//                   <option key={status} value={status}>{status}</option>
//                 ))}
//               </select>
//             </div>
//           </div>
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1"><Calendar className="w-4 h-4 inline mr-1" />Date</label>
//               <input type="date" value={document.date} onChange={(e) => onUpdate({ ...document, date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1"><Calendar className="w-4 h-4 inline mr-1" />{document.type === 'invoice' ? 'Due Date' : 'Valid Until'}</label>
//               <input type="date" value={document.type === 'invoice' ? document.dueDate : (document.validUntil || '')} onChange={(e) => onUpdate({ ...document, ...(document.type === 'invoice' ? { dueDate: e.target.value } : { validUntil: e.target.value }) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
//             </div>
//           </div>
//         </div>

//         <div className="space-y-4">
//           <h3 className="text-lg font-medium text-gray-900 flex items-center">
//             <User className="w-5 h-5 mr-2 text-gray-600" />
//             {document.type === 'invoice' ? 'Bill To' : 'Quote For'}
//           </h3>
//           {contacts.length > 0 && (
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Select Contact</label>
//               <select value={selectedContact} onChange={(e) => handleContactSelect(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
//                 <option value="">Select a contact...</option>
//                 {contacts.map(contact => (
//                   <option key={contact.id} value={contact.id}>{contact.name} - {contact.company}</option>
//                 ))}
//               </select>
//             </div>
//           )}
//           <div className="grid grid-cols-1 gap-3">
//             <input type="text" placeholder="Company Name" value={document.toCompany} onChange={(e) => onUpdate({ ...document, toCompany: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
//             <input type="text" placeholder="Contact Person" value={document.toContact} onChange={(e) => onUpdate({ ...document, toContact: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
//             <textarea placeholder="Address" value={document.toAddress} onChange={(e) => onUpdate({ ...document, toAddress: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none" />
//             <div className="grid grid-cols-2 gap-3">
//               <input type="email" placeholder="Email" value={document.toEmail} onChange={(e) => onUpdate({ ...document, toEmail: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
//               <input type="tel" placeholder="Phone" value={document.toPhone} onChange={(e) => onUpdate({ ...document, toPhone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="space-y-4">
//         <div className="flex items-center justify-between">
//           <h3 className="text-lg font-medium text-gray-900">{document.type === 'invoice' ? 'Invoice' : 'Quote'} Items</h3>
//           <button onClick={addItem} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
//             <Plus className="w-4 h-4" />
//             <span>Add Item</span>
//           </button>
//         </div>

//         <div className="border border-gray-200 rounded-lg overflow-hidden">
//           <div className="bg-gray-50 px-4 py-3 grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
//             <div className="col-span-5">Description</div>
//             <div className="col-span-2">Quantity</div>
//             <div className="col-span-2">Unit Price</div>
//             <div className="col-span-2">Total</div>
//             <div className="col-span-1"></div>
//           </div>
          
//           {document.items.map((item) => (
//             <div key={item.id} className="px-4 py-3 grid grid-cols-12 gap-4 border-t border-gray-200">
//               <div className="col-span-5">
//                 <textarea value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} placeholder="Item description..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none text-sm" />
//               </div>
//               <div className="col-span-2">
//                 <input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" min="0" step="0.01" />
//               </div>
//               <div className="col-span-2">
//                 <input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" min="0" step="0.01" />
//               </div>
//               <div className="col-span-2">
//                 <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium">${item.total.toFixed(2)}</div>
//               </div>
//               <div className="col-span-1">
//                 {document.items.length > 1 && (
//                   <button onClick={() => removeItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
//                     <Trash2 className="w-4 h-4" />
//                   </button>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div className="space-y-4">
//           <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
//             <textarea value={document.notes} onChange={(e) => onUpdate({ ...document, notes: e.target.value })} placeholder="Additional notes..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none" />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
//             <textarea value={document.terms} onChange={(e) => onUpdate({ ...document, terms: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none" />
//           </div>
//         </div>

//         <div className="space-y-4">
//           <h3 className="text-lg font-medium text-gray-900">{document.type === 'invoice' ? 'Invoice' : 'Quote'} Summary</h3>
//           <div className="bg-gray-50 p-4 rounded-lg space-y-3">
//             <div className="flex justify-between">
//               <span className="text-sm text-gray-600">Subtotal:</span>
//               <span className="font-medium">${document.subtotal.toFixed(2)}</span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <span className="text-sm text-gray-600">Discount:</span>
//               <input type="number" value={document.discountRate} onChange={(e) => onUpdate({ ...document, discountRate: parseFloat(e.target.value) || 0 })} className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" min="0" max="100" step="0.1" />
//               <span className="text-sm text-gray-600">%</span>
//               <span className="ml-auto font-medium">-${document.discountAmount.toFixed(2)}</span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <span className="text-sm text-gray-600">Tax:</span>
//               <input type="number" value={document.taxRate} onChange={(e) => onUpdate({ ...document, taxRate: parseFloat(e.target.value) || 0 })} className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" min="0" max="100" step="0.1" />
//               <span className="text-sm text-gray-600">%</span>
//               <span className="ml-auto font-medium">${document.taxAmount.toFixed(2)}</span>
//             </div>
//             <div className="border-t border-gray-200 pt-3">
//               <div className="flex justify-between">
//                 <span className="text-lg font-semibold text-gray-900">Total:</span>
//                 <span className="text-lg font-bold text-blue-600">${document.total.toFixed(2)}</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };