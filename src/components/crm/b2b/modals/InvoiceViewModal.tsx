"use client";
import React, { useRef, useState } from 'react';
import { X, Download, Edit, FileText, Building, User, Calendar, Printer, ChevronDown } from 'lucide-react';
import { useInvoiceSettings } from '@/lib/context/invoices/InvoiceSettingsProvider';

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

interface InvoiceViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: InvoiceData | null;
    onEdit?: (invoice: InvoiceData) => void;
    onDownload?: (invoice: InvoiceData) => void;
    onStatusChange?: (invoice: InvoiceData, newStatus: InvoiceData['status']) => void;
}

export const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({
    isOpen,
    onClose,
    invoice,
    onEdit,
    onDownload,
    onStatusChange
}) => {
    const { formatCurrency } = useInvoiceSettings();
    const printRef = useRef<HTMLDivElement>(null);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

    if (!isOpen || !invoice) return null;

    const statusOptions: InvoiceData['status'][] = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Draft':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'Sent':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Paid':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'Overdue':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'Cancelled':
                return 'bg-gray-100 text-gray-600 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const handleStatusChange = (newStatus: InvoiceData['status']) => {
        if (onStatusChange && invoice) {
            onStatusChange(invoice, newStatus);
        }
        setShowStatusDropdown(false);
    };

    const handlePrint = () => {
        if (printRef.current) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                const printContent = printRef.current.innerHTML;
                
                printWindow.document.write(`
          <html>
            <head>
              <title>INVOICE ${invoice.invoiceNumber}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 0; 
                  padding: 20px;
                  color: #333;
                }
                .header { 
                  border-bottom: 2px solid #e5e7eb; 
                  padding-bottom: 20px; 
                  margin-bottom: 30px; 
                }
                .invoice-title { 
                  font-size: 28px; 
                  font-weight: bold; 
                  color: #1f2937; 
                  margin-bottom: 5px;
                }
                .invoice-number { 
                  font-size: 14px; 
                  color: #6b7280; 
                }
                .section { 
                  margin-bottom: 25px; 
                }
                .section-title { 
                  font-size: 14px; 
                  font-weight: bold; 
                  color: #374151; 
                  margin-bottom: 8px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                }
                .company-info { 
                  background: #f9fafb; 
                  padding: 15px; 
                  border-radius: 8px; 
                }
                table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin: 15px 0;
                }
                th, td { 
                  padding: 12px; 
                  text-align: left; 
                  border-bottom: 1px solid #e5e7eb; 
                }
                th { 
                  background-color: #f3f4f6; 
                  font-weight: bold;
                  color: #374151;
                }
                .total-section { 
                  background: #f9fafb; 
                  padding: 20px; 
                  border-radius: 8px; 
                  margin-top: 20px;
                }
                .total-row { 
                  display: flex; 
                  justify-content: space-between; 
                  margin-bottom: 8px;
                }
                .total-final { 
                  border-top: 2px solid #374151; 
                  padding-top: 12px; 
                  font-size: 18px; 
                  font-weight: bold;
                }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
                printWindow.document.close();
                printWindow.print();
            }
        }
    };

    const handleDownload = () => {
        if (onDownload) {
            onDownload(invoice);
        }
    };

    const handleEdit = () => {
        if (onEdit) {
            onEdit(invoice);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[100vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        <div className="flex items-center space-x-3">
                            <FileText className="w-6 h-6" />
                            <div>
                                <h2 className="text-xl font-semibold">Invoice Details</h2>
                                <p className="text-sm opacity-90">#{invoice.invoiceNumber}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {onEdit && (
                                <button
                                    onClick={handleEdit}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    title="Edit Invoice"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                onClick={handlePrint}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                title="Print"
                            >
                                <Printer className="w-5 h-5" />
                            </button>
                            {onDownload && (
                                <button
                                    onClick={handleDownload}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    title="Download PDF"
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                        <div ref={printRef} className="p-6">
                            {/* Invoice Header */}
                            <div className="header mb-8">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h1 className="invoice-title">INVOICE</h1>
                                        <p className="invoice-number">#{invoice.invoiceNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        {/* Status Dropdown */}
                                        <div className="relative inline-block">
                                            <button
                                                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                                className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border transition-colors ${getStatusColor(invoice.status)} hover:bg-opacity-80`}
                                            >
                                                <span>{invoice.status}</span>
                                                {onStatusChange && <ChevronDown className="w-3 h-3" />}
                                            </button>
                                            
                                            {showStatusDropdown && onStatusChange && (
                                                <div className="absolute top-full right-0 mt-2 z-10 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[120px]">
                                                    {statusOptions.map((status) => (
                                                        <button
                                                            key={status}
                                                            onClick={() => handleStatusChange(status)}
                                                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                                                status === invoice.status ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                                            }`}
                                                        >
                                                            {status}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="mt-2 text-sm text-gray-600">
                                            <div>Date: {new Date(invoice.date).toLocaleDateString()}</div>
                                            <div>Due: {new Date(invoice.dueDate).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Company Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="section">
                                    <div className="section-title flex items-center space-x-2">
                                        <Building className="w-4 h-4" />
                                        <span>From</span>
                                    </div>
                                    <div className="company-info">
                                        <div className="font-semibold text-gray-900">{invoice.fromCompany}</div>
                                        <div className="text-sm text-gray-600 mt-1 whitespace-pre-line">{invoice.fromAddress}</div>
                                        <div className="text-sm text-gray-600 mt-2">
                                            <div>{invoice.fromEmail}</div>
                                            <div>{invoice.fromPhone}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="section">
                                    <div className="section-title flex items-center space-x-2">
                                        <User className="w-4 h-4" />
                                        <span>Bill To</span>
                                    </div>
                                    <div className="company-info">
                                        <div className="font-semibold text-gray-900">{invoice.toCompany}</div>
                                        <div className="text-sm text-gray-600">{invoice.toContact}</div>
                                        <div className="text-sm text-gray-600 mt-1 whitespace-pre-line">{invoice.toAddress}</div>
                                        <div className="text-sm text-gray-600 mt-2">
                                            <div>{invoice.toEmail}</div>
                                            <div>{invoice.toPhone}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Invoice Items */}
                            <div className="section mb-10">
                                <div className="section-title text-xl font-bold mb-4">Invoice Items</div>

                                <div className="overflow-x-auto bg-white rounded-sm shadow-xs">
                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-6 py-3 text-left font-medium text-gray-600">Description</th>
                                                <th className="px-6 py-3 text-center font-medium text-gray-600">Quantity</th>
                                                <th className="px-6 py-3 text-right font-medium text-gray-600">Unit Price</th>
                                                <th className="px-6 py-3 text-right font-medium text-gray-600">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {invoice.items.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50 transition">
                                                    <td className="px-6 py-4 whitespace-pre-line text-gray-800">{item.description}</td>
                                                    <td className="px-6 py-4 text-center text-gray-700">{item.quantity}</td>
                                                    <td className="px-6 py-4 text-right text-gray-700">{formatCurrency(item.unitPrice)}</td>
                                                    <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatCurrency(item.total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Totals */}
                                <div className="flex justify-end mt-6">
                                    <div className="w-full max-w-sm bg-gray-50 rounded-md shadow-sm p-4">
                                        <div className="space-y-2 text-sm text-gray-700">
                                            <div className="flex justify-between">
                                                <span>Subtotal:</span>
                                                <span>{formatCurrency(invoice.subtotal)}</span>
                                            </div>
                                            {invoice.discountAmount > 0 && (
                                                <div className="flex justify-between text-red-600">
                                                    <span>Discount ({invoice.discountRate}%):</span>
                                                    <span>-{formatCurrency(invoice.discountAmount)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <span>Tax ({invoice.taxRate}%):</span>
                                                <span>{formatCurrency(invoice.taxAmount)}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                                                <span>Total:</span>
                                                <span>{formatCurrency(invoice.total)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            {invoice.paymentMethod && (
                                <div className="section mt-8">
                                    <div className="section-title">Payment Method</div>
                                    <div className="text-gray-700">{invoice.paymentMethod}</div>
                                </div>
                            )}

                            {/* Notes */}
                            {invoice.notes && (
                                <div className="section mt-8">
                                    <div className="section-title">Notes</div>
                                    <div className="bg-yellow-50 p-4 rounded-lg">
                                        <p className="text-gray-700 whitespace-pre-line">{invoice.notes}</p>
                                    </div>
                                </div>
                            )}

                            {/* Terms */}
                            {invoice.terms && (
                                <div className="section mt-8">
                                    <div className="section-title">Terms & Conditions</div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-gray-700 whitespace-pre-line">{invoice.terms}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                        <div className="text-sm text-gray-500">
                            Invoice created on {new Date(invoice.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                            {onEdit && (
                                <button
                                    onClick={handleEdit}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Edit Invoice
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Backdrop to close dropdown */}
            {showStatusDropdown && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowStatusDropdown(false)}
                />
            )}
        </>
    );
};























































// "use client";
// import React, { useRef } from 'react';
// import { X, Download, Edit, FileText, Building, User, Calendar, Printer } from 'lucide-react';

// interface InvoiceData {
//     id: string;
//     invoiceNumber: string;
//     date: string;
//     dueDate: string;
//     status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
//     fromCompany: string;
//     fromAddress: string;
//     fromEmail: string;
//     fromPhone: string;
//     toCompany: string;
//     toContact: string;
//     toAddress: string;
//     toEmail: string;
//     toPhone: string;
//     items: Array<{
//         id: string;
//         description: string;
//         quantity: number;
//         unitPrice: number;
//         total: number;
//     }>;
//     subtotal: number;
//     taxRate: number;
//     taxAmount: number;
//     discountRate: number;
//     discountAmount: number;
//     total: number;
//     notes: string;
//     terms: string;
//     paymentMethod: string;
// }

// interface InvoiceViewModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     invoice: InvoiceData | null;
//     onEdit?: (invoice: InvoiceData) => void;
//     onDownload?: (invoice: InvoiceData) => void;
// }

// export const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({
//     isOpen,
//     onClose,
//     invoice,
//     onEdit,
//     onDownload
// }) => {
//     const printRef = useRef<HTMLDivElement>(null);

//     if (!isOpen || !invoice) return null;

//     const getStatusColor = (status: string) => {
//         switch (status) {
//             case 'Draft':
//                 return 'bg-gray-100 text-gray-800 border-gray-200';
//             case 'Sent':
//                 return 'bg-blue-100 text-blue-800 border-blue-200';
//             case 'Paid':
//                 return 'bg-green-100 text-green-800 border-green-200';
//             case 'Overdue':
//                 return 'bg-red-100 text-red-800 border-red-200';
//             case 'Cancelled':
//                 return 'bg-gray-100 text-gray-600 border-gray-200';
//             default:
//                 return 'bg-gray-100 text-gray-800 border-gray-200';
//         }
//     };

//     const handlePrint = () => {
//         if (printRef.current) {
//             const printWindow = window.open('', '_blank');
//             if (printWindow) {
//                 printWindow.document.write(`
//           <html>
//             <head>
//               <title>INVOICE ${invoice.invoiceNumber}</title>
//               <style>
//                 body { 
//                   font-family: Arial, sans-serif; 
//                   margin: 0; 
//                   padding: 20px;
//                   color: #333;
//                 }
//                 .header { 
//                   border-bottom: 2px solid #e5e7eb; 
//                   padding-bottom: 20px; 
//                   margin-bottom: 30px; 
//                 }
//                 .invoice-title { 
//                   font-size: 28px; 
//                   font-weight: bold; 
//                   color: #1f2937; 
//                   margin-bottom: 5px;
//                 }
//                 .invoice-number { 
//                   font-size: 14px; 
//                   color: #6b7280; 
//                 }
//                 .section { 
//                   margin-bottom: 25px; 
//                 }
//                 .section-title { 
//                   font-size: 14px; 
//                   font-weight: bold; 
//                   color: #374151; 
//                   margin-bottom: 8px;
//                   text-transform: uppercase;
//                   letter-spacing: 0.5px;
//                 }
//                 .company-info { 
//                   background: #f9fafb; 
//                   padding: 15px; 
//                   border-radius: 8px; 
//                 }
//                 table { 
//                   width: 100%; 
//                   border-collapse: collapse; 
//                   margin: 15px 0;
//                 }
//                 th, td { 
//                   padding: 12px; 
//                   text-align: left; 
//                   border-bottom: 1px solid #e5e7eb; 
//                 }
//                 th { 
//                   background-color: #f3f4f6; 
//                   font-weight: bold;
//                   color: #374151;
//                 }
//                 .total-section { 
//                   background: #f9fafb; 
//                   padding: 20px; 
//                   border-radius: 8px; 
//                   margin-top: 20px;
//                 }
//                 .total-row { 
//                   display: flex; 
//                   justify-content: space-between; 
//                   margin-bottom: 8px;
//                 }
//                 .total-final { 
//                   border-top: 2px solid #374151; 
//                   padding-top: 12px; 
//                   font-size: 18px; 
//                   font-weight: bold;
//                 }
//                 @media print {
//                   body { margin: 0; }
//                   .no-print { display: none; }
//                 }
//               </style>
//             </head>
//             <body>
//               ${printRef.current.innerHTML}
//             </body>
//           </html>
//         `);
//                 printWindow.document.close();
//                 printWindow.print();
//             }
//         }
//     };

//     const handleDownload = () => {
//         if (onDownload) {
//             onDownload(invoice);
//         }
//     };

//     const handleEdit = () => {
//         if (onEdit) {
//             onEdit(invoice);
//         }
//     };

//     return (
//         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[100vh] overflow-hidden">
//                 {/* Header */}
//                 <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
//                     <div className="flex items-center space-x-3">
//                         <FileText className="w-6 h-6" />
//                         <div>
//                             <h2 className="text-xl font-semibold">Invoice Details</h2>
//                             <p className="text-sm opacity-90">#{invoice.invoiceNumber}</p>
//                         </div>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                         {onEdit && (
//                             <button
//                                 onClick={handleEdit}
//                                 className="p-2 hover:bg-white/20 rounded-lg transition-colors"
//                                 title="Edit Invoice"
//                             >
//                                 <Edit className="w-5 h-5" />
//                             </button>
//                         )}
//                         <button
//                             onClick={handlePrint}
//                             className="p-2 hover:bg-white/20 rounded-lg transition-colors"
//                             title="Print"
//                         >
//                             <Printer className="w-5 h-5" />
//                         </button>
//                         {onDownload && (
//                             <button
//                                 onClick={handleDownload}
//                                 className="p-2 hover:bg-white/20 rounded-lg transition-colors"
//                                 title="Download PDF"
//                             >
//                                 <Download className="w-5 h-5" />
//                             </button>
//                         )}
//                         <button
//                             onClick={onClose}
//                             className="p-2 hover:bg-white/20 rounded-lg transition-colors"
//                         >
//                             <X className="w-5 h-5" />
//                         </button>
//                     </div>
//                 </div>

//                 {/* Content */}
//                 <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
//                     <div ref={printRef} className="p-6">
//                         {/* Invoice Header */}
//                         <div className="header mb-8">
//                             <div className="flex justify-between items-start">
//                                 <div>
//                                     <h1 className="invoice-title">INVOICE</h1>
//                                     <p className="invoice-number">#{invoice.invoiceNumber}</p>
//                                 </div>
//                                 <div className="text-right">
//                                     <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(invoice.status)}`}>
//                                         {invoice.status}
//                                     </div>
//                                     <div className="mt-2 text-sm text-gray-600">
//                                         <div>Date: {new Date(invoice.date).toLocaleDateString()}</div>
//                                         <div>Due: {new Date(invoice.dueDate).toLocaleDateString()}</div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Company Information */}
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
//                             <div className="section">
//                                 <div className="section-title flex items-center space-x-2">
//                                     <Building className="w-4 h-4" />
//                                     <span>From</span>
//                                 </div>
//                                 <div className="company-info">
//                                     <div className="font-semibold text-gray-900">{invoice.fromCompany}</div>
//                                     <div className="text-sm text-gray-600 mt-1 whitespace-pre-line">{invoice.fromAddress}</div>
//                                     <div className="text-sm text-gray-600 mt-2">
//                                         <div>{invoice.fromEmail}</div>
//                                         <div>{invoice.fromPhone}</div>
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="section">
//                                 <div className="section-title flex items-center space-x-2">
//                                     <User className="w-4 h-4" />
//                                     <span>Bill To</span>
//                                 </div>
//                                 <div className="company-info">
//                                     <div className="font-semibold text-gray-900">{invoice.toCompany}</div>
//                                     <div className="text-sm text-gray-600">{invoice.toContact}</div>
//                                     <div className="text-sm text-gray-600 mt-1 whitespace-pre-line">{invoice.toAddress}</div>
//                                     <div className="text-sm text-gray-600 mt-2">
//                                         <div>{invoice.toEmail}</div>
//                                         <div>{invoice.toPhone}</div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Invoice Items */}
//                         <div className="section mb-10">
//                             <div className="section-title text-xl font-bold mb-4">Invoice Items</div>

//                             <div className="overflow-x-auto bg-white rounded-sm shadow-xs">
//                                 <table className="min-w-full divide-y divide-gray-200 text-sm">
//                                     <thead className="bg-gray-100">
//                                         <tr>
//                                             <th className="px-6 py-3 text-left font-medium text-gray-600">Description</th>
//                                             <th className="px-6 py-3 text-center font-medium text-gray-600">Quantity</th>
//                                             <th className="px-6 py-3 text-right font-medium text-gray-600">Unit Price</th>
//                                             <th className="px-6 py-3 text-right font-medium text-gray-600">Total</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody className="divide-y divide-gray-100">
//                                         {invoice.items.map((item) => (
//                                             <tr key={item.id} className="hover:bg-gray-50 transition">
//                                                 <td className="px-6 py-4 whitespace-pre-line text-gray-800">{item.description}</td>
//                                                 <td className="px-6 py-4 text-center text-gray-700">{item.quantity}</td>
//                                                 <td className="px-6 py-4 text-right text-gray-700">${item.unitPrice.toFixed(2)}</td>
//                                                 <td className="px-6 py-4 text-right font-semibold text-gray-900">${item.total.toFixed(2)}</td>
//                                             </tr>
//                                         ))}
//                                     </tbody>
//                                 </table>
//                             </div>

//                             {/* Totals */}
//                             <div className="flex justify-end mt-6">
//                                 <div className="w-full max-w-sm bg-gray-50 rounded-md shadow-sm p-4">
//                                     <div className="space-y-2 text-sm text-gray-700">
//                                         <div className="flex justify-between">
//                                             <span>Subtotal:</span>
//                                             <span>${invoice.subtotal.toFixed(2)}</span>
//                                         </div>
//                                         {invoice.discountAmount > 0 && (
//                                             <div className="flex justify-between text-red-600">
//                                                 <span>Discount ({invoice.discountRate}%):</span>
//                                                 <span>-${invoice.discountAmount.toFixed(2)}</span>
//                                             </div>
//                                         )}
//                                         <div className="flex justify-between">
//                                             <span>Tax ({invoice.taxRate}%):</span>
//                                             <span>${invoice.taxAmount.toFixed(2)}</span>
//                                         </div>
//                                         <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
//                                             <span>Total:</span>
//                                             <span>${invoice.total.toFixed(2)}</span>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>


//                         {/* Payment Method */}
//                         {invoice.paymentMethod && (
//                             <div className="section mt-8">
//                                 <div className="section-title">Payment Method</div>
//                                 <div className="text-gray-700">{invoice.paymentMethod}</div>
//                             </div>
//                         )}

//                         {/* Notes */}
//                         {invoice.notes && (
//                             <div className="section mt-8">
//                                 <div className="section-title">Notes</div>
//                                 <div className="bg-yellow-50 p-4 rounded-lg">
//                                     <p className="text-gray-700 whitespace-pre-line">{invoice.notes}</p>
//                                 </div>
//                             </div>
//                         )}

//                         {/* Terms */}
//                         {invoice.terms && (
//                             <div className="section mt-8">
//                                 <div className="section-title">Terms & Conditions</div>
//                                 <div className="bg-gray-50 p-4 rounded-lg">
//                                     <p className="text-gray-700 whitespace-pre-line">{invoice.terms}</p>
//                                 </div>
//                             </div>
//                         )}
//                     </div>
//                 </div>

//                 {/* Footer */}
//                 <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
//                     <div className="text-sm text-gray-500">
//                         Invoice created on {new Date(invoice.date).toLocaleDateString()}
//                     </div>
//                     <div className="flex items-center space-x-3">
//                         <button
//                             onClick={onClose}
//                             className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
//                         >
//                             Close
//                         </button>
//                         {onEdit && (
//                             <button
//                                 onClick={handleEdit}
//                                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                             >
//                                 Edit Invoice
//                             </button>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };