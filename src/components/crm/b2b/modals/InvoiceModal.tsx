// components/modals/InvoiceModal.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Send, Download, Calculator, Eye } from 'lucide-react';
import { DocumentForm } from './DocumentForm';
import { DownloadModal } from './DownloadModal';
import { TemplateRenderer } from '../TemplateRenderer';
import { useInvoiceSettings } from '@/lib/context/invoices/InvoiceSettingsProvider';
import { PDFGenerator } from '@/lib/utils/invoice/PDFGenerator';
import type { DocumentData, CompanyInfo, Contact } from '@/lib/types/invoice/types';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (document: DocumentData) => void;
  editingDocument?: DocumentData | null;
  contacts?: Contact[];
  companyInfo?: CompanyInfo;
  onUpdateCompanyInfo?: (info: CompanyInfo) => void;
}

export function InvoiceModal({
  isOpen,
  onClose,
  onSave,
  editingDocument,
  contacts = [],
  companyInfo: initialCompanyInfo,
  onUpdateCompanyInfo
}: InvoiceModalProps) {
  const { settings, formatCurrency } = useInvoiceSettings();
  const [document, setDocument] = useState<DocumentData>({
    id: '',
    type: 'invoice',
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    validUntil: '',
    status: 'Draft',
    companyInfo: initialCompanyInfo || {
      name: 'Your Company Name',
      address: 'Your Address\nCity, State ZIP',
      email: 'your@email.com',
      phone: '+1 (555) 000-0000',
    },
    toCompany: '',
    toContact: '',
    toAddress: '',
    toEmail: '',
    toPhone: '',
    items: [{
      id: '1',
      description: 'Service or Product',
      quantity: 1,
      unitPrice: 100,
      total: 100
    }],
    subtotal: 0,
    taxRate: 10,
    taxAmount: 0,
    discountRate: 0,
    discountAmount: 0,
    total: 0,
    notes: '',
    terms: 'Payment is due within 30 days of invoice date.',
    paymentMethod: 'Bank Transfer'
  });

  const [showPreview, setShowPreview] = useState(true);
  const [downloadModal, setDownloadModal] = useState({
    isOpen: false,
    status: 'downloading' as 'downloading' | 'success' | 'error',
    message: '',
    fileName: ''
  });
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingDocument) {
      setDocument(editingDocument);
    } else if (isOpen) {
      const prefix = document.type === 'invoice' ? 'INV' : 'QUO';
      const docNum = `${prefix}-${Date.now().toString().slice(-6)}`;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      setDocument(prev => ({
        ...prev,
        invoiceNumber: docNum,
        id: docNum,
        dueDate: dueDate.toISOString().split('T')[0],
        validUntil: dueDate.toISOString().split('T')[0],
        companyInfo: initialCompanyInfo || prev.companyInfo
      }));
    }
  }, [editingDocument, isOpen, initialCompanyInfo, document.type]);

  useEffect(() => {
    const subtotal = document.items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * document.discountRate) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * document.taxRate) / 100;
    const total = taxableAmount + taxAmount;

    setDocument(prev => ({
      ...prev,
      subtotal,
      discountAmount,
      taxAmount,
      total
    }));
  }, [document.items, document.taxRate, document.discountRate]);

  useEffect(() => {
    if (document.type === 'quote') {
      setDocument(prev => ({
        ...prev,
        terms: prev.terms === 'Payment is due within 30 days of invoice date.'
          ? 'This quote is valid for 30 days from the date of issue.'
          : prev.terms
      }));
    } else {
      setDocument(prev => ({
        ...prev,
        terms: prev.terms === 'This quote is valid for 30 days from the date of issue.'
          ? 'Payment is due within 30 days of invoice date.'
          : prev.terms
      }));
    }
  }, [document.type]);

  const handleCompanyInfoUpdate = (info: CompanyInfo) => {
    setDocument(prev => ({ ...prev, companyInfo: info }));
    onUpdateCompanyInfo?.(info);
  };

  const handleSave = () => {
    onSave(document);
    onClose();
  };

  const handleSend = () => {
    const sentDocument = { ...document, status: 'Sent' };
    onSave(sentDocument);
    onClose();
  };

  const handleDownload = async () => {
    if (!printRef.current) {
      setDownloadModal({
        isOpen: true,
        status: 'error',
        message: 'Unable to access document preview. Please try again.',
        fileName: ''
      });
      return;
    }

    try {
      setDownloadModal({
        isOpen: true,
        status: 'downloading',
        message: 'Generating your PDF document...',
        fileName: ''
      });

      await new Promise(resolve => setTimeout(resolve, 800));

      const fileName = await PDFGenerator.generateFromElement(
        printRef.current,
        document,
        {
          quality: 1.0,
          format: 'a4',
          orientation: 'portrait'
        }
      );

      setDownloadModal({
        isOpen: true,
        status: 'success',
        message: 'Your PDF has been generated and downloaded successfully!',
        fileName
      });

    } catch (error) {
      console.error('Download failed:', error);
      setDownloadModal({
        isOpen: true,
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.',
        fileName: ''
      });
    }
  };

  const handleDownloadOptimized = async () => {
    if (!printRef.current) {
      setDownloadModal({
        isOpen: true,
        status: 'error',
        message: 'Unable to access document preview. Please try again.',
        fileName: ''
      });
      return;
    }

    try {
      setDownloadModal({
        isOpen: true,
        status: 'downloading',
        message: 'Generating optimized PDF document...',
        fileName: ''
      });

      await new Promise(resolve => setTimeout(resolve, 800));

      const fileName = await PDFGenerator.generateOptimizedPDF(
        printRef.current,
        document,
        {
          quality: 1.0,
          format: 'a4',
          orientation: 'portrait'
        }
      );

      setDownloadModal({
        isOpen: true,
        status: 'success',
        message: 'Your optimized PDF has been generated and downloaded successfully!',
        fileName
      });

    } catch (error) {
      console.error('Optimized download failed:', error);
      setDownloadModal({
        isOpen: true,
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.',
        fileName: ''
      });
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const printContent = printRef.current.innerHTML;
        
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${document.type.toUpperCase()} ${document.invoiceNumber}</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @media print {
                  body { 
                    margin: 0; 
                    padding: 20px;
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                  }
                  .no-print { display: none; }
                  * {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                }
                body {
                  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  line-height: 1.5;
                }
                .bg-gradient-to-r {
                  background: linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to)) !important;
                }
                .from-blue-600 { --tw-gradient-from: #2563eb !important; }
                .to-purple-600 { --tw-gradient-to: #9333ea !important; }
                .to-indigo-600 { --tw-gradient-to: #4f46e5 !important; }
                .from-blue-50 { --tw-gradient-from: #eff6ff !important; }
                .to-indigo-100 { --tw-gradient-to: #e0e7ff !important; }
                .text-transparent { color: transparent !important; }
                .bg-clip-text { 
                  -webkit-background-clip: text !important; 
                  background-clip: text !important; 
                }
              </style>
            </head>
            <body>
              <div class="max-w-4xl mx-auto">
                ${printContent}
              </div>
            </body>
          </html>
        `);
        
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    }
  };

  const closeDownloadModal = () => {
    setDownloadModal(prev => ({ ...prev, isOpen: false }));
  };

  // Determine save button text based on status
  const getSaveButtonText = () => {
    if (document.status === 'Draft') {
      return 'Save Draft';
    }
    return 'Save';
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-8xl max-h-[100vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center space-x-3">
              <Calculator className="w-6 h-6" />
              <h2 className="text-xl font-semibold">
                {editingDocument ? `Edit ${document.type}` : `Create ${document.type}`}
              </h2>
              {/* Show current template and currency */}
              <div className="ml-6 text-sm bg-white/20 px-3 py-1 rounded-lg">
                Template: {settings.selectedTemplate} | Currency: {settings.selectedCurrency.code} ({settings.selectedCurrency.symbol})
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex h-[calc(95vh-140px)]">
            {/* Left Panel - Form */}
            <div className="w-1/2 overflow-y-auto p-6 border-r border-gray-200">
              <DocumentForm
                document={document}
                onUpdate={setDocument}
                contacts={contacts}
                onUpdateCompanyInfo={handleCompanyInfoUpdate}
              />
            </div>

            {/* Right Panel - Preview (Using Global Settings) */}
            <div className="w-1/2 flex flex-col">
              {/* Preview Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                        showPreview 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      <span>{showPreview ? 'Hide' : 'Show'}</span>
                    </button>
                    <button
                      onClick={handlePrint}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                      title="Print"
                    >
                      Print
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Content */}
              {showPreview ? (
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="transform scale-75 origin-top-left w-[133%]">
                    <div ref={printRef}>
                      <TemplateRenderer 
                        document={document} 
                        template={settings.selectedTemplate} 
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center text-gray-500">
                    <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Preview Hidden</p>
                    <p className="text-sm">Click "Show" to see your document</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-4">
              <button 
                onClick={onClose} 
                className="px-6 py-3 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <div className="text-sm text-gray-500">
                {document.items.length} item{document.items.length !== 1 ? 's' : ''} • 
                Total: {formatCurrency(document.total)}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Download Button with Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                  className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                
                {showDownloadOptions && (
                  <div className="absolute bottom-full left-0 mb-2 z-10">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px]">
                      <button
                        onClick={() => {
                          handleDownload();
                          setShowDownloadOptions(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded transition-colors"
                      >
                        <div className="font-medium">High Quality PDF</div>
                        <div className="text-xs text-gray-500">Perfect visual reproduction</div>
                      </button>
                      <button
                        onClick={() => {
                          handleDownloadOptimized();
                          setShowDownloadOptions(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded transition-colors"
                      >
                        <div className="font-medium">Optimized PDF</div>
                        <div className="text-xs text-gray-500">Smaller file size, text-based</div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={handleSave}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:shadow-lg transition-all duration-300"
              >
                <Save className="w-4 h-4" />
                <span>{getSaveButtonText()}</span>
              </button>
              
              <button 
                onClick={handleSend}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
              >
                <Send className="w-4 h-4" />
                <span>Save & Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Download Modal */}
      <DownloadModal
        isOpen={downloadModal.isOpen}
        onClose={closeDownloadModal}
        status={downloadModal.status}
        message={downloadModal.message}
        fileName={downloadModal.fileName}
      />

      {/* Backdrop to close dropdown */}
      {showDownloadOptions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDownloadOptions(false)}
        />
      )}
    </>
  );
}



























































// // components/modals/InvoiceModal.tsx
// 'use client';
// import React, { useState, useEffect, useRef } from 'react';
// import { X, Save, Send, Download, Calculator, Eye } from 'lucide-react';
// import { DocumentForm } from './DocumentForm';
// import { DownloadModal } from './DownloadModal';
// import { TemplateRenderer } from '../TemplateRenderer';
// import { useInvoiceSettings } from '@/lib/context/invoices/InvoiceSettingsProvider';
// import { PDFGenerator } from '@/lib/utils/invoice/PDFGenerator';
// import type { DocumentData, CompanyInfo, Contact } from '@/lib/types/invoice/types';

// interface InvoiceModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSave: (document: DocumentData) => void;
//   editingDocument?: DocumentData | null;
//   contacts?: Contact[];
//   companyInfo?: CompanyInfo;
//   onUpdateCompanyInfo?: (info: CompanyInfo) => void;
// }

// export function InvoiceModal({
//   isOpen,
//   onClose,
//   onSave,
//   editingDocument,
//   contacts = [],
//   companyInfo: initialCompanyInfo,
//   onUpdateCompanyInfo
// }: InvoiceModalProps) {
//   const { settings, formatCurrency } = useInvoiceSettings();
//   const [document, setDocument] = useState<DocumentData>({
//     id: '',
//     type: 'invoice',
//     invoiceNumber: '',
//     date: new Date().toISOString().split('T')[0],
//     dueDate: '',
//     validUntil: '',
//     status: 'Draft',
//     companyInfo: initialCompanyInfo || {
//       name: 'Your Company Name',
//       address: 'Your Address\nCity, State ZIP',
//       email: 'your@email.com',
//       phone: '+1 (555) 000-0000',
//     },
//     toCompany: '',
//     toContact: '',
//     toAddress: '',
//     toEmail: '',
//     toPhone: '',
//     items: [{
//       id: '1',
//       description: 'Service or Product',
//       quantity: 1,
//       unitPrice: 100,
//       total: 100
//     }],
//     subtotal: 0,
//     taxRate: 10,
//     taxAmount: 0,
//     discountRate: 0,
//     discountAmount: 0,
//     total: 0,
//     notes: '',
//     terms: 'Payment is due within 30 days of invoice date.',
//     paymentMethod: 'Bank Transfer'
//   });

//   const [showPreview, setShowPreview] = useState(true);
//   const [downloadModal, setDownloadModal] = useState({
//     isOpen: false,
//     status: 'downloading' as 'downloading' | 'success' | 'error',
//     message: '',
//     fileName: ''
//   });
//   const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  
//   const printRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (editingDocument) {
//       setDocument(editingDocument);
//     } else if (isOpen) {
//       const prefix = document.type === 'invoice' ? 'INV' : 'QUO';
//       const docNum = `${prefix}-${Date.now().toString().slice(-6)}`;
//       const dueDate = new Date();
//       dueDate.setDate(dueDate.getDate() + 30);

//       setDocument(prev => ({
//         ...prev,
//         invoiceNumber: docNum,
//         id: docNum,
//         dueDate: dueDate.toISOString().split('T')[0],
//         validUntil: dueDate.toISOString().split('T')[0],
//         companyInfo: initialCompanyInfo || prev.companyInfo
//       }));
//     }
//   }, [editingDocument, isOpen, initialCompanyInfo, document.type]);

//   useEffect(() => {
//     const subtotal = document.items.reduce((sum, item) => sum + item.total, 0);
//     const discountAmount = (subtotal * document.discountRate) / 100;
//     const taxableAmount = subtotal - discountAmount;
//     const taxAmount = (taxableAmount * document.taxRate) / 100;
//     const total = taxableAmount + taxAmount;

//     setDocument(prev => ({
//       ...prev,
//       subtotal,
//       discountAmount,
//       taxAmount,
//       total
//     }));
//   }, [document.items, document.taxRate, document.discountRate]);

//   useEffect(() => {
//     if (document.type === 'quote') {
//       setDocument(prev => ({
//         ...prev,
//         terms: prev.terms === 'Payment is due within 30 days of invoice date.'
//           ? 'This quote is valid for 30 days from the date of issue.'
//           : prev.terms
//       }));
//     } else {
//       setDocument(prev => ({
//         ...prev,
//         terms: prev.terms === 'This quote is valid for 30 days from the date of issue.'
//           ? 'Payment is due within 30 days of invoice date.'
//           : prev.terms
//       }));
//     }
//   }, [document.type]);

//   const handleCompanyInfoUpdate = (info: CompanyInfo) => {
//     setDocument(prev => ({ ...prev, companyInfo: info }));
//     onUpdateCompanyInfo?.(info);
//   };

//   const handleSave = () => {
//     onSave(document);
//     onClose();
//   };

//   const handleSend = () => {
//     const sentDocument = { ...document, status: 'Sent' };
//     onSave(sentDocument);
//     onClose();
//   };

//   const handleDownload = async () => {
//     if (!printRef.current) {
//       setDownloadModal({
//         isOpen: true,
//         status: 'error',
//         message: 'Unable to access document preview. Please try again.',
//         fileName: ''
//       });
//       return;
//     }

//     try {
//       setDownloadModal({
//         isOpen: true,
//         status: 'downloading',
//         message: 'Generating your PDF document...',
//         fileName: ''
//       });

//       await new Promise(resolve => setTimeout(resolve, 800));

//       const fileName = await PDFGenerator.generateFromElement(
//         printRef.current,
//         document,
//         {
//           quality: 1.0,
//           format: 'a4',
//           orientation: 'portrait'
//         }
//       );

//       setDownloadModal({
//         isOpen: true,
//         status: 'success',
//         message: 'Your PDF has been generated and downloaded successfully!',
//         fileName
//       });

//     } catch (error) {
//       console.error('Download failed:', error);
//       setDownloadModal({
//         isOpen: true,
//         status: 'error',
//         message: error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.',
//         fileName: ''
//       });
//     }
//   };

//   const handleDownloadOptimized = async () => {
//     if (!printRef.current) {
//       setDownloadModal({
//         isOpen: true,
//         status: 'error',
//         message: 'Unable to access document preview. Please try again.',
//         fileName: ''
//       });
//       return;
//     }

//     try {
//       setDownloadModal({
//         isOpen: true,
//         status: 'downloading',
//         message: 'Generating optimized PDF document...',
//         fileName: ''
//       });

//       await new Promise(resolve => setTimeout(resolve, 800));

//       const fileName = await PDFGenerator.generateOptimizedPDF(
//         printRef.current,
//         document,
//         {
//           quality: 1.0,
//           format: 'a4',
//           orientation: 'portrait'
//         }
//       );

//       setDownloadModal({
//         isOpen: true,
//         status: 'success',
//         message: 'Your optimized PDF has been generated and downloaded successfully!',
//         fileName
//       });

//     } catch (error) {
//       console.error('Optimized download failed:', error);
//       setDownloadModal({
//         isOpen: true,
//         status: 'error',
//         message: error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.',
//         fileName: ''
//       });
//     }
//   };

//   const handlePrint = () => {
//     if (printRef.current) {
//       const printWindow = window.open('', '_blank');
//       if (printWindow) {
//         const printContent = printRef.current.innerHTML;
        
//         printWindow.document.write(`
//           <!DOCTYPE html>
//           <html>
//             <head>
//               <title>${document.type.toUpperCase()} ${document.invoiceNumber}</title>
//               <meta charset="utf-8">
//               <meta name="viewport" content="width=device-width, initial-scale=1">
//               <script src="https://cdn.tailwindcss.com"></script>
//               <style>
//                 @media print {
//                   body { 
//                     margin: 0; 
//                     padding: 20px;
//                     -webkit-print-color-adjust: exact;
//                     color-adjust: exact;
//                   }
//                   .no-print { display: none; }
//                   * {
//                     -webkit-print-color-adjust: exact !important;
//                     color-adjust: exact !important;
//                     print-color-adjust: exact !important;
//                   }
//                 }
//                 body {
//                   font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//                   line-height: 1.5;
//                 }
//                 .bg-gradient-to-r {
//                   background: linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to)) !important;
//                 }
//                 .from-blue-600 { --tw-gradient-from: #2563eb !important; }
//                 .to-purple-600 { --tw-gradient-to: #9333ea !important; }
//                 .to-indigo-600 { --tw-gradient-to: #4f46e5 !important; }
//                 .from-blue-50 { --tw-gradient-from: #eff6ff !important; }
//                 .to-indigo-100 { --tw-gradient-to: #e0e7ff !important; }
//                 .text-transparent { color: transparent !important; }
//                 .bg-clip-text { 
//                   -webkit-background-clip: text !important; 
//                   background-clip: text !important; 
//                 }
//               </style>
//             </head>
//             <body>
//               <div class="max-w-4xl mx-auto">
//                 ${printContent}
//               </div>
//             </body>
//           </html>
//         `);
        
//         printWindow.document.close();
//         setTimeout(() => {
//           printWindow.print();
//         }, 500);
//       }
//     }
//   };

//   const closeDownloadModal = () => {
//     setDownloadModal(prev => ({ ...prev, isOpen: false }));
//   };

//   if (!isOpen) return null;

//   return (
//     <>
//       <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//         <div className="bg-white rounded-2xl shadow-2xl w-full max-w-8xl max-h-[100vh] overflow-hidden">
//           {/* Header */}
//           <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
//             <div className="flex items-center space-x-3">
//               <Calculator className="w-6 h-6" />
//               <h2 className="text-xl font-semibold">
//                 {editingDocument ? `Edit ${document.type}` : `Create ${document.type}`}
//               </h2>
//               {/* Show current template and currency */}
//               <div className="ml-6 text-sm bg-white/20 px-3 py-1 rounded-lg">
//                 Template: {settings.selectedTemplate} | Currency: {settings.selectedCurrency.code}
//               </div>
//             </div>
//             <button 
//               onClick={onClose} 
//               className="p-2 hover:bg-white/20 rounded-lg transition-colors"
//             >
//               <X className="w-5 h-5" />
//             </button>
//           </div>

//           <div className="flex h-[calc(95vh-140px)]">
//             {/* Left Panel - Form */}
//             <div className="w-1/2 overflow-y-auto p-6 border-r border-gray-200">
//               <DocumentForm
//                 document={document}
//                 onUpdate={setDocument}
//                 contacts={contacts}
//                 onUpdateCompanyInfo={handleCompanyInfoUpdate}
//               />
//             </div>

//             {/* Right Panel - Preview (Using Global Settings) */}
//             <div className="w-1/2 flex flex-col">
//               {/* Preview Header */}
//               <div className="p-6 border-b border-gray-200">
//                 <div className="flex items-center justify-between">
//                   <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
//                   <div className="flex items-center space-x-3">
//                     <button
//                       onClick={() => setShowPreview(!showPreview)}
//                       className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
//                         showPreview 
//                           ? 'bg-blue-600 text-white' 
//                           : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                       }`}
//                     >
//                       <Eye className="w-4 h-4" />
//                       <span>{showPreview ? 'Hide' : 'Show'}</span>
//                     </button>
//                     <button
//                       onClick={handlePrint}
//                       className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
//                       title="Print"
//                     >
//                       Print
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               {/* Preview Content */}
//               {showPreview ? (
//                 <div className="flex-1 overflow-y-auto p-6">
//                   <div className="transform scale-75 origin-top-left w-[133%]">
//                     <div ref={printRef}>
//                       <TemplateRenderer 
//                         document={document} 
//                         template={settings.selectedTemplate} 
//                       />
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="flex-1 flex items-center justify-center bg-gray-50">
//                   <div className="text-center text-gray-500">
//                     <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
//                     <p className="text-lg font-medium">Preview Hidden</p>
//                     <p className="text-sm">Click "Show" to see your document</p>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Footer */}
//           <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
//             <div className="flex items-center space-x-4">
//               <button 
//                 onClick={onClose} 
//                 className="px-6 py-3 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
//               >
//                 Cancel
//               </button>
//               <div className="text-sm text-gray-500">
//                 {document.items.length} item{document.items.length !== 1 ? 's' : ''} • 
//                 Total: {formatCurrency(document.total)}
//               </div>
//             </div>

//             <div className="flex items-center space-x-3">
//               {/* Download Button with Dropdown */}
//               <div className="relative">
//                 <button 
//                   onClick={() => setShowDownloadOptions(!showDownloadOptions)}
//                   className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
//                 >
//                   <Download className="w-4 h-4" />
//                   <span>Download PDF</span>
//                 </button>
                
//                 {showDownloadOptions && (
//                   <div className="absolute bottom-full left-0 mb-2 z-10">
//                     <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px]">
//                       <button
//                         onClick={() => {
//                           handleDownload();
//                           setShowDownloadOptions(false);
//                         }}
//                         className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded transition-colors"
//                       >
//                         <div className="font-medium">High Quality PDF</div>
//                         <div className="text-xs text-gray-500">Perfect visual reproduction</div>
//                       </button>
//                       <button
//                         onClick={() => {
//                           handleDownloadOptimized();
//                           setShowDownloadOptions(false);
//                         }}
//                         className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded transition-colors"
//                       >
//                         <div className="font-medium">Optimized PDF</div>
//                         <div className="text-xs text-gray-500">Smaller file size, text-based</div>
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               <button 
//                 onClick={handleSave}
//                 className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:shadow-lg transition-all duration-300"
//               >
//                 <Save className="w-4 h-4" />
//                 <span>Save Draft</span>
//               </button>
              
//               <button 
//                 onClick={handleSend}
//                 className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
//               >
//                 <Send className="w-4 h-4" />
//                 <span>Save & Send</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Download Modal */}
//       <DownloadModal
//         isOpen={downloadModal.isOpen}
//         onClose={closeDownloadModal}
//         status={downloadModal.status}
//         message={downloadModal.message}
//         fileName={downloadModal.fileName}
//       />

//       {/* Backdrop to close dropdown */}
//       {showDownloadOptions && (
//         <div 
//           className="fixed inset-0 z-40" 
//           onClick={() => setShowDownloadOptions(false)}
//         />
//       )}
//     </>
//   );
// }























































// Former code for InvoiceModal component
// 'use client';
// import React, { useState, useEffect, useRef } from 'react';
// import { X, Save, Send, Download, Calculator, Eye, Sparkles, Crown, Zap, Diamond } from 'lucide-react';
// import { DocumentForm } from './DocumentForm';
// import { DownloadModal } from './DownloadModal';
// import type { DocumentData, CompanyInfo, Contact, InvoiceTemplate } from '@/lib/types/invoice/types';
// import { TemplateRenderer } from '../TemplateRenderer';
// import { PDFGenerator } from '@/lib/utils/invoice/PDFGenerator';

// interface InvoiceModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSave: (document: DocumentData) => void;
//   editingDocument?: DocumentData | null;
//   contacts?: Contact[];
//   companyInfo?: CompanyInfo;
//   onUpdateCompanyInfo?: (info: CompanyInfo) => void;
// }

// export function InvoiceModal({
//   isOpen,
//   onClose,
//   onSave,
//   editingDocument,
//   contacts = [],
//   companyInfo: initialCompanyInfo,
//   onUpdateCompanyInfo
// }: InvoiceModalProps) {
//   const [document, setDocument] = useState<DocumentData>({
//     id: '',
//     type: 'invoice',
//     invoiceNumber: '',
//     date: new Date().toISOString().split('T')[0],
//     dueDate: '',
//     validUntil: '',
//     status: 'Draft',
//     companyInfo: initialCompanyInfo || {
//       name: 'Your Company Name',
//       address: 'Your Address\nCity, State ZIP',
//       email: 'your@email.com',
//       phone: '+1 (555) 000-0000',
//     },
//     toCompany: '',
//     toContact: '',
//     toAddress: '',
//     toEmail: '',
//     toPhone: '',
//     items: [{
//       id: '1',
//       description: 'Service or Product',
//       quantity: 1,
//       unitPrice: 100,
//       total: 100
//     }],
//     subtotal: 0,
//     taxRate: 10,
//     taxAmount: 0,
//     discountRate: 0,
//     discountAmount: 0,
//     total: 0,
//     notes: '',
//     terms: 'Payment is due within 30 days of invoice date.',
//     paymentMethod: 'Bank Transfer'
//   });

//   const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate>('modern');
//   const [showPreview, setShowPreview] = useState(true);
//   const [downloadModal, setDownloadModal] = useState({
//     isOpen: false,
//     status: 'downloading' as 'downloading' | 'success' | 'error',
//     message: '',
//     fileName: ''
//   });
//   const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  
//   const printRef = useRef<HTMLDivElement>(null);

//   const templates = [
//     {
//       id: 'modern' as const,
//       name: 'Modern',
//       icon: Sparkles,
//       color: 'from-blue-500 to-indigo-600',
//       description: 'Clean gradient design with modern styling'
//     },
//     {
//       id: 'classic' as const,
//       name: 'Classic',
//       icon: Crown,
//       color: 'from-gray-700 to-gray-900',
//       description: 'Traditional business document style'
//     },
//     {
//       id: 'minimal' as const,
//       name: 'Minimal',
//       icon: Zap,
//       color: 'from-gray-400 to-gray-600',
//       description: 'Simple and clean layout'
//     },
//     {
//       id: 'professional' as const,
//       name: 'Professional',
//       icon: Diamond,
//       color: 'from-indigo-500 to-blue-600',
//       description: 'Corporate professional appearance'
//     }
//   ];

//   useEffect(() => {
//     if (editingDocument) {
//       setDocument(editingDocument);
//     } else if (isOpen) {
//       const prefix = document.type === 'invoice' ? 'INV' : 'QUO';
//       const docNum = `${prefix}-${Date.now().toString().slice(-6)}`;
//       const dueDate = new Date();
//       dueDate.setDate(dueDate.getDate() + 30);

//       setDocument(prev => ({
//         ...prev,
//         invoiceNumber: docNum,
//         id: docNum,
//         dueDate: dueDate.toISOString().split('T')[0],
//         validUntil: dueDate.toISOString().split('T')[0],
//         companyInfo: initialCompanyInfo || prev.companyInfo
//       }));
//     }
//   }, [editingDocument, isOpen, initialCompanyInfo, document.type]);

//   useEffect(() => {
//     const subtotal = document.items.reduce((sum, item) => sum + item.total, 0);
//     const discountAmount = (subtotal * document.discountRate) / 100;
//     const taxableAmount = subtotal - discountAmount;
//     const taxAmount = (taxableAmount * document.taxRate) / 100;
//     const total = taxableAmount + taxAmount;

//     setDocument(prev => ({
//       ...prev,
//       subtotal,
//       discountAmount,
//       taxAmount,
//       total
//     }));
//   }, [document.items, document.taxRate, document.discountRate]);

//   useEffect(() => {
//     if (document.type === 'quote') {
//       setDocument(prev => ({
//         ...prev,
//         terms: prev.terms === 'Payment is due within 30 days of invoice date.'
//           ? 'This quote is valid for 30 days from the date of issue.'
//           : prev.terms
//       }));
//     } else {
//       setDocument(prev => ({
//         ...prev,
//         terms: prev.terms === 'This quote is valid for 30 days from the date of issue.'
//           ? 'Payment is due within 30 days of invoice date.'
//           : prev.terms
//       }));
//     }
//   }, [document.type]);

//   const handleCompanyInfoUpdate = (info: CompanyInfo) => {
//     setDocument(prev => ({ ...prev, companyInfo: info }));
//     onUpdateCompanyInfo?.(info);
//   };

//   const handleSave = () => {
//     onSave(document);
//     onClose();
//   };

//   const handleSend = () => {
//     const sentDocument = { ...document, status: 'Sent' };
//     onSave(sentDocument);
//     onClose();
//   };

//   const handleDownload = async () => {
//     if (!printRef.current) {
//       setDownloadModal({
//         isOpen: true,
//         status: 'error',
//         message: 'Unable to access document preview. Please try again.',
//         fileName: ''
//       });
//       return;
//     }

//     try {
//       setDownloadModal({
//         isOpen: true,
//         status: 'downloading',
//         message: 'Generating your PDF document...',
//         fileName: ''
//       });

//       // Wait a bit for the modal to show and ensure DOM is ready
//       await new Promise(resolve => setTimeout(resolve, 800));

//       const fileName = await PDFGenerator.generateFromElement(
//         printRef.current,
//         document,
//         {
//           quality: 1.0,
//           format: 'a4',
//           orientation: 'portrait'
//         }
//       );

//       setDownloadModal({
//         isOpen: true,
//         status: 'success',
//         message: 'Your PDF has been generated and downloaded successfully!',
//         fileName
//       });

//     } catch (error) {
//       console.error('Download failed:', error);
//       setDownloadModal({
//         isOpen: true,
//         status: 'error',
//         message: error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.',
//         fileName: ''
//       });
//     }
//   };

//   const handleDownloadOptimized = async () => {
//     if (!printRef.current) {
//       setDownloadModal({
//         isOpen: true,
//         status: 'error',
//         message: 'Unable to access document preview. Please try again.',
//         fileName: ''
//       });
//       return;
//     }

//     try {
//       setDownloadModal({
//         isOpen: true,
//         status: 'downloading',
//         message: 'Generating optimized PDF document...',
//         fileName: ''
//       });

//       await new Promise(resolve => setTimeout(resolve, 800));

//       const fileName = await PDFGenerator.generateOptimizedPDF(
//         printRef.current,
//         document,
//         {
//           quality: 1.0,
//           format: 'a4',
//           orientation: 'portrait'
//         }
//       );

//       setDownloadModal({
//         isOpen: true,
//         status: 'success',
//         message: 'Your optimized PDF has been generated and downloaded successfully!',
//         fileName
//       });

//     } catch (error) {
//       console.error('Optimized download failed:', error);
//       setDownloadModal({
//         isOpen: true,
//         status: 'error',
//         message: error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.',
//         fileName: ''
//       });
//     }
//   };

//   const handlePrint = () => {
//     if (printRef.current) {
//       // Create a new window for printing with proper styles
//       const printWindow = window.open('', '_blank');
//       if (printWindow) {
//         const printContent = printRef.current.innerHTML;
        
//         printWindow.document.write(`
//           <!DOCTYPE html>
//           <html>
//             <head>
//               <title>${document.type.toUpperCase()} ${document.invoiceNumber}</title>
//               <meta charset="utf-8">
//               <meta name="viewport" content="width=device-width, initial-scale=1">
//               <script src="https://cdn.tailwindcss.com"></script>
//               <style>
//                 @media print {
//                   body { 
//                     margin: 0; 
//                     padding: 20px;
//                     -webkit-print-color-adjust: exact;
//                     color-adjust: exact;
//                   }
//                   .no-print { display: none; }
//                   * {
//                     -webkit-print-color-adjust: exact !important;
//                     color-adjust: exact !important;
//                     print-color-adjust: exact !important;
//                   }
//                 }
//                 body {
//                   font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//                   line-height: 1.5;
//                 }
//                 .bg-gradient-to-r {
//                   background: linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to)) !important;
//                 }
//                 .from-blue-600 { --tw-gradient-from: #2563eb !important; }
//                 .to-purple-600 { --tw-gradient-to: #9333ea !important; }
//                 .to-indigo-600 { --tw-gradient-to: #4f46e5 !important; }
//                 .from-blue-50 { --tw-gradient-from: #eff6ff !important; }
//                 .to-indigo-100 { --tw-gradient-to: #e0e7ff !important; }
//                 .text-transparent { color: transparent !important; }
//                 .bg-clip-text { 
//                   -webkit-background-clip: text !important; 
//                   background-clip: text !important; 
//                 }
//               </style>
//             </head>
//             <body>
//               <div class="max-w-4xl mx-auto">
//                 ${printContent}
//               </div>
//             </body>
//           </html>
//         `);
        
//         // Wait for content to load then print
//         printWindow.document.close();
//         setTimeout(() => {
//           printWindow.print();
//         }, 500);
//       }
//     }
//   };

//   const closeDownloadModal = () => {
//     setDownloadModal(prev => ({ ...prev, isOpen: false }));
//   };

//   if (!isOpen) return null;

//   return (
//     <>
//       <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//         <div className="bg-white rounded-2xl shadow-2xl w-full max-w-8xl max-h-[100vh] overflow-hidden">
//           {/* Header */}
//           <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
//             <div className="flex items-center space-x-3">
//               <Calculator className="w-6 h-6" />
//               <h2 className="text-xl font-semibold">
//                 {editingDocument ? `Edit ${document.type}` : `Create ${document.type}`}
//               </h2>
//             </div>
//             <button 
//               onClick={onClose} 
//               className="p-2 hover:bg-white/20 rounded-lg transition-colors"
//             >
//               <X className="w-5 h-5" />
//             </button>
//           </div>

//           <div className="flex h-[calc(95vh-140px)]">
//             {/* Left Panel - Form */}
//             <div className="w-1/2 overflow-y-auto p-6 border-r border-gray-200">
//               <DocumentForm
//                 document={document}
//                 onUpdate={setDocument}
//                 contacts={contacts}
//                 onUpdateCompanyInfo={handleCompanyInfoUpdate}
//               />
//             </div>

//             {/* Right Panel - Templates & Preview */}
//             <div className="w-1/2 flex flex-col">
//               {/* Template Selector */}
//               <div className="p-6 border-b border-gray-200">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Template</h3>
//                 <div className="grid grid-cols-2 gap-3">
//                   {templates.map((template) => {
//                     const Icon = template.icon;
//                     return (
//                       <button
//                         key={template.id}
//                         onClick={() => setSelectedTemplate(template.id)}
//                         className={`p-3 rounded-xl transition-all duration-300 flex items-center space-x-2 text-sm group ${
//                           selectedTemplate === template.id
//                             ? `bg-gradient-to-r ${template.color} text-white shadow-lg`
//                             : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
//                         }`}
//                         title={template.description}
//                       >
//                         <Icon className="w-4 h-4" />
//                         <span className="font-medium">{template.name}</span>
//                       </button>
//                     );
//                   })}
//                 </div>

//                 <div className="flex items-center justify-between mt-4">
//                   <button
//                     onClick={() => setShowPreview(!showPreview)}
//                     className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
//                       showPreview 
//                         ? 'bg-blue-600 text-white' 
//                         : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                     }`}
//                   >
//                     <Eye className="w-4 h-4" />
//                     <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
//                   </button>

//                   <button
//                     onClick={handlePrint}
//                     className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
//                     title="Print"
//                   >
//                     Print
//                   </button>
//                 </div>
//               </div>

//               {/* Preview */}
//               {showPreview ? (
//                 <div className="flex-1 overflow-y-auto p-6">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
//                   <div className="transform scale-75 origin-top-left w-[133%]">
//                     <div ref={printRef}>
//                       <TemplateRenderer document={document} template={selectedTemplate} />
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="flex-1 flex items-center justify-center bg-gray-50">
//                   <div className="text-center text-gray-500">
//                     <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
//                     <p className="text-lg font-medium">Preview Hidden</p>
//                     <p className="text-sm">Click "Show Preview" to see your document</p>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Footer */}
//           <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
//             <div className="flex items-center space-x-4">
//               <button 
//                 onClick={onClose} 
//                 className="px-6 py-3 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
//               >
//                 Cancel
//               </button>
//               <div className="text-sm text-gray-500">
//                 {document.items.length} item{document.items.length !== 1 ? 's' : ''} • 
//                 Total: ${document.total.toFixed(2)}
//               </div>
//             </div>

//             <div className="flex items-center space-x-3">
//               {/* Download Button with Dropdown */}
//               <div className="relative">
//                 <button 
//                   onClick={() => setShowDownloadOptions(!showDownloadOptions)}
//                   className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
//                 >
//                   <Download className="w-4 h-4" />
//                   <span>Download PDF</span>
//                 </button>
                
//                 {/* Download Options Dropdown */}
//                 {showDownloadOptions && (
//                   <div className="absolute bottom-full left-0 mb-2 z-10">
//                     <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px]">
//                       <button
//                         onClick={() => {
//                           handleDownload();
//                           setShowDownloadOptions(false);
//                         }}
//                         className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded transition-colors"
//                       >
//                         <div className="font-medium">High Quality PDF</div>
//                         <div className="text-xs text-gray-500">Perfect visual reproduction</div>
//                       </button>
//                       <button
//                         onClick={() => {
//                           handleDownloadOptimized();
//                           setShowDownloadOptions(false);
//                         }}
//                         className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded transition-colors"
//                       >
//                         <div className="font-medium">Optimized PDF</div>
//                         <div className="text-xs text-gray-500">Smaller file size, text-based</div>
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               <button 
//                 onClick={handleSave}
//                 className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:shadow-lg transition-all duration-300"
//               >
//                 <Save className="w-4 h-4" />
//                 <span>Save Draft</span>
//               </button>
              
//               <button 
//                 onClick={handleSend}
//                 className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
//               >
//                 <Send className="w-4 h-4" />
//                 <span>Save & Send</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Download Modal */}
//       <DownloadModal
//         isOpen={downloadModal.isOpen}
//         onClose={closeDownloadModal}
//         status={downloadModal.status}
//         message={downloadModal.message}
//         fileName={downloadModal.fileName}
//       />

//       {/* Backdrop to close dropdown */}
//       {showDownloadOptions && (
//         <div 
//           className="fixed inset-0 z-40" 
//           onClick={() => setShowDownloadOptions(false)}
//         />
//       )}
//     </>
//   );
// }
















































// 'use client';
// import React, { useState, useEffect, useRef } from 'react';
// import { X, Save, Send, Download, Calculator, Eye, Sparkles, Crown, Zap, Diamond } from 'lucide-react';
// import { DocumentForm } from './DocumentForm';
// import { DownloadModal } from './DownloadModal';
// import type { DocumentData, CompanyInfo, Contact, InvoiceTemplate } from '@/lib/types/invoice/types';
// import { TemplateRenderer } from '../TemplateRenderer';
// import { PDFGenerator } from '@/lib/utils/invoice/PDFGenerator';

// interface InvoiceModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSave: (document: DocumentData) => void;
//   editingDocument?: DocumentData | null;
//   contacts?: Contact[];
//   companyInfo?: CompanyInfo;
//   onUpdateCompanyInfo?: (info: CompanyInfo) => void;
// }

// export function InvoiceModal({
//   isOpen,
//   onClose,
//   onSave,
//   editingDocument,
//   contacts = [],
//   companyInfo: initialCompanyInfo,
//   onUpdateCompanyInfo
// }: InvoiceModalProps) {
//   const [document, setDocument] = useState<DocumentData>({
//     id: '',
//     type: 'invoice',
//     invoiceNumber: '',
//     date: new Date().toISOString().split('T')[0],
//     dueDate: '',
//     validUntil: '',
//     status: 'Draft',
//     companyInfo: initialCompanyInfo || {
//       name: 'Your Company Name',
//       address: 'Your Address\nCity, State ZIP',
//       email: 'your@email.com',
//       phone: '+1 (555) 000-0000',
//     },
//     toCompany: '',
//     toContact: '',
//     toAddress: '',
//     toEmail: '',
//     toPhone: '',
//     items: [{
//       id: '1',
//       description: 'Service or Product',
//       quantity: 1,
//       unitPrice: 100,
//       total: 100
//     }],
//     subtotal: 0,
//     taxRate: 10,
//     taxAmount: 0,
//     discountRate: 0,
//     discountAmount: 0,
//     total: 0,
//     notes: '',
//     terms: 'Payment is due within 30 days of invoice date.',
//     paymentMethod: 'Bank Transfer'
//   });

//   const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate>('modern');
//   const [showPreview, setShowPreview] = useState(true);
//   const [downloadModal, setDownloadModal] = useState({
//     isOpen: false,
//     status: 'downloading' as 'downloading' | 'success' | 'error',
//     message: '',
//     fileName: ''
//   });
//   const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  
//   const printRef = useRef<HTMLDivElement>(null);

//   const templates = [
//     {
//       id: 'modern' as const,
//       name: 'Modern',
//       icon: Sparkles,
//       color: 'from-blue-500 to-indigo-600',
//       description: 'Clean gradient design with modern styling'
//     },
//     {
//       id: 'classic' as const,
//       name: 'Classic',
//       icon: Crown,
//       color: 'from-gray-700 to-gray-900',
//       description: 'Traditional business document style'
//     },
//     {
//       id: 'minimal' as const,
//       name: 'Minimal',
//       icon: Zap,
//       color: 'from-gray-400 to-gray-600',
//       description: 'Simple and clean layout'
//     },
//     {
//       id: 'professional' as const,
//       name: 'Professional',
//       icon: Diamond,
//       color: 'from-indigo-500 to-blue-600',
//       description: 'Corporate professional appearance'
//     }
//   ];

//   useEffect(() => {
//     if (editingDocument) {
//       setDocument(editingDocument);
//     } else if (isOpen) {
//       const prefix = document.type === 'invoice' ? 'INV' : 'QUO';
//       const docNum = `${prefix}-${Date.now().toString().slice(-6)}`;
//       const dueDate = new Date();
//       dueDate.setDate(dueDate.getDate() + 30);

//       setDocument(prev => ({
//         ...prev,
//         invoiceNumber: docNum,
//         id: docNum,
//         dueDate: dueDate.toISOString().split('T')[0],
//         validUntil: dueDate.toISOString().split('T')[0],
//         companyInfo: initialCompanyInfo || prev.companyInfo
//       }));
//     }
//   }, [editingDocument, isOpen, initialCompanyInfo, document.type]);

//   useEffect(() => {
//     const subtotal = document.items.reduce((sum, item) => sum + item.total, 0);
//     const discountAmount = (subtotal * document.discountRate) / 100;
//     const taxableAmount = subtotal - discountAmount;
//     const taxAmount = (taxableAmount * document.taxRate) / 100;
//     const total = taxableAmount + taxAmount;

//     setDocument(prev => ({
//       ...prev,
//       subtotal,
//       discountAmount,
//       taxAmount,
//       total
//     }));
//   }, [document.items, document.taxRate, document.discountRate]);

//   useEffect(() => {
//     if (document.type === 'quote') {
//       setDocument(prev => ({
//         ...prev,
//         terms: prev.terms === 'Payment is due within 30 days of invoice date.'
//           ? 'This quote is valid for 30 days from the date of issue.'
//           : prev.terms
//       }));
//     } else {
//       setDocument(prev => ({
//         ...prev,
//         terms: prev.terms === 'This quote is valid for 30 days from the date of issue.'
//           ? 'Payment is due within 30 days of invoice date.'
//           : prev.terms
//       }));
//     }
//   }, [document.type]);

//   const handleCompanyInfoUpdate = (info: CompanyInfo) => {
//     setDocument(prev => ({ ...prev, companyInfo: info }));
//     onUpdateCompanyInfo?.(info);
//   };

//   const handleSave = () => {
//     onSave(document);
//     onClose();
//   };

//   const handleSend = () => {
//     const sentDocument = { ...document, status: 'Sent' };
//     onSave(sentDocument);
//     onClose();
//   };

//   const handleDownload = async () => {
//     if (!printRef.current) {
//       setDownloadModal({
//         isOpen: true,
//         status: 'error',
//         message: 'Unable to access document preview. Please try again.',
//         fileName: ''
//       });
//       return;
//     }

//     try {
//       setDownloadModal({
//         isOpen: true,
//         status: 'downloading',
//         message: 'Generating your PDF document...',
//         fileName: ''
//       });

//       await new Promise(resolve => setTimeout(resolve, 500));

//       const fileName = await PDFGenerator.generateFromElement(
//         printRef.current,
//         document,
//         {
//           quality: 1.0,
//           format: 'a4',
//           orientation: 'portrait'
//         }
//       );

//       setDownloadModal({
//         isOpen: true,
//         status: 'success',
//         message: 'Your PDF has been generated and downloaded successfully!',
//         fileName
//       });

//     } catch (error) {
//       console.error('Download failed:', error);
//       setDownloadModal({
//         isOpen: true,
//         status: 'error',
//         message: error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.',
//         fileName: ''
//       });
//     }
//   };

//   const handleDownloadOptimized = async () => {
//     if (!printRef.current) {
//       setDownloadModal({
//         isOpen: true,
//         status: 'error',
//         message: 'Unable to access document preview. Please try again.',
//         fileName: ''
//       });
//       return;
//     }

//     try {
//       setDownloadModal({
//         isOpen: true,
//         status: 'downloading',
//         message: 'Generating optimized PDF document...',
//         fileName: ''
//       });

//       await new Promise(resolve => setTimeout(resolve, 500));

//       const fileName = await PDFGenerator.generateOptimizedPDF(
//         printRef.current,
//         document,
//         {
//           quality: 1.0,
//           format: 'a4',
//           orientation: 'portrait'
//         }
//       );

//       setDownloadModal({
//         isOpen: true,
//         status: 'success',
//         message: 'Your optimized PDF has been generated and downloaded successfully!',
//         fileName
//       });

//     } catch (error) {
//       console.error('Optimized download failed:', error);
//       setDownloadModal({
//         isOpen: true,
//         status: 'error',
//         message: error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.',
//         fileName: ''
//       });
//     }
//   };

//   const handlePrint = () => {
//     if (printRef.current) {
//       const printWindow = window.open('', '_blank');
//       if (printWindow) {
//         printWindow.document.write(`
//           <html>
//             <head>
//               <title>${document.type.toUpperCase()} ${document.invoiceNumber}</title>
//               <script src="https://cdn.tailwindcss.com"></script>
//               <style>
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
//         printWindow.document.close();
//         printWindow.print();
//       }
//     }
//   };

//   const closeDownloadModal = () => {
//     setDownloadModal(prev => ({ ...prev, isOpen: false }));
//   };

//   if (!isOpen) return null;

//   return (
//     <>
//       <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//         <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[100vh] overflow-hidden">
//           {/* Header */}
//           <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
//             <div className="flex items-center space-x-3">
//               <Calculator className="w-6 h-6" />
//               <h2 className="text-xl font-semibold">
//                 {editingDocument ? `Edit ${document.type}` : `Create ${document.type}`}
//               </h2>
//             </div>
//             <button 
//               onClick={onClose} 
//               className="p-2 hover:bg-white/20 rounded-lg transition-colors"
//             >
//               <X className="w-5 h-5" />
//             </button>
//           </div>

//           <div className="flex h-[calc(95vh-140px)]">
//             {/* Left Panel - Form */}
//             <div className="w-1/2 overflow-y-auto p-6 border-r border-gray-200">
//               <DocumentForm
//                 document={document}
//                 onUpdate={setDocument}
//                 contacts={contacts}
//                 onUpdateCompanyInfo={handleCompanyInfoUpdate}
//               />
//             </div>

//             {/* Right Panel - Templates & Preview */}
//             <div className="w-1/2 flex flex-col">
//               {/* Template Selector */}
//               <div className="p-6 border-b border-gray-200">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Template</h3>
//                 <div className="grid grid-cols-2 gap-3">
//                   {templates.map((template) => {
//                     const Icon = template.icon;
//                     return (
//                       <button
//                         key={template.id}
//                         onClick={() => setSelectedTemplate(template.id)}
//                         className={`p-3 rounded-xl transition-all duration-300 flex items-center space-x-2 text-sm group ${
//                           selectedTemplate === template.id
//                             ? `bg-gradient-to-r ${template.color} text-white shadow-lg`
//                             : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
//                         }`}
//                         title={template.description}
//                       >
//                         <Icon className="w-4 h-4" />
//                         <span className="font-medium">{template.name}</span>
//                       </button>
//                     );
//                   })}
//                 </div>

//                 <div className="flex items-center justify-between mt-4">
//                   <button
//                     onClick={() => setShowPreview(!showPreview)}
//                     className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
//                       showPreview 
//                         ? 'bg-blue-600 text-white' 
//                         : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                     }`}
//                   >
//                     <Eye className="w-4 h-4" />
//                     <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
//                   </button>

//                   <button
//                     onClick={handlePrint}
//                     className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
//                     title="Print"
//                   >
//                     Print
//                   </button>
//                 </div>
//               </div>

//               {/* Preview */}
//               {showPreview ? (
//                 <div className="flex-1 overflow-y-auto p-6">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
//                   <div className="transform scale-75 origin-top-left w-[133%]">
//                     <div ref={printRef}>
//                       <TemplateRenderer document={document} template={selectedTemplate} />
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="flex-1 flex items-center justify-center bg-gray-50">
//                   <div className="text-center text-gray-500">
//                     <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
//                     <p className="text-lg font-medium">Preview Hidden</p>
//                     <p className="text-sm">Click "Show Preview" to see your document</p>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Footer */}
//           <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
//             <div className="flex items-center space-x-4">
//               <button 
//                 onClick={onClose} 
//                 className="px-6 py-3 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
//               >
//                 Cancel
//               </button>
//               <div className="text-sm text-gray-500">
//                 {document.items.length} item{document.items.length !== 1 ? 's' : ''} • 
//                 Total: ${document.total.toFixed(2)}
//               </div>
//             </div>

//             <div className="flex items-center space-x-3">
//               {/* Download Button with Dropdown */}
//               <div className="relative">
//                 <button 
//                   onClick={() => setShowDownloadOptions(!showDownloadOptions)}
//                   className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
//                 >
//                   <Download className="w-4 h-4" />
//                   <span>Download PDF</span>
//                 </button>
                
//                 {/* Download Options Dropdown */}
//                 {showDownloadOptions && (
//                   <div className="absolute bottom-full left-0 mb-2 z-10">
//                     <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px]">
//                       <button
//                         onClick={() => {
//                           handleDownload();
//                           setShowDownloadOptions(false);
//                         }}
//                         className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded transition-colors"
//                       >
//                         High Quality PDF
//                       </button>
//                       <button
//                         onClick={() => {
//                           handleDownloadOptimized();
//                           setShowDownloadOptions(false);
//                         }}
//                         className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded transition-colors"
//                       >
//                         Optimized PDF (Smaller)
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               <button 
//                 onClick={handleSave}
//                 className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:shadow-lg transition-all duration-300"
//               >
//                 <Save className="w-4 h-4" />
//                 <span>Save Draft</span>
//               </button>
              
//               <button 
//                 onClick={handleSend}
//                 className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
//               >
//                 <Send className="w-4 h-4" />
//                 <span>Save & Send</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Download Modal */}
//       <DownloadModal
//         isOpen={downloadModal.isOpen}
//         onClose={closeDownloadModal}
//         status={downloadModal.status}
//         message={downloadModal.message}
//         fileName={downloadModal.fileName}
//       />

//       {/* Backdrop to close dropdown */}
//       {showDownloadOptions && (
//         <div 
//           className="fixed inset-0 z-40" 
//           onClick={() => setShowDownloadOptions(false)}
//         />
//       )}
//     </>
//   );
// }
















































// "use client";
// import React, { useState, useEffect } from 'react';
// import { X, Save, Send, Download, Calculator } from 'lucide-react';
// import { DocumentForm } from './DocumentForm';
// import IntegratedInvoiceSystem from '../IntegratedInvoiceSystem';

// export type DocumentType = 'invoice' | 'quote';

// export interface InvoiceItem {
//   id: string;
//   description: string;
//   quantity: number;
//   unitPrice: number;
//   total: number;
// }

// export interface CompanyInfo {
//   name: string;
//   logo?: string;
//   address: string;
//   email: string;
//   phone: string;
//   taxId?: string;
//   companyId?: string;
// }

// export interface DocumentData {
//   id: string;
//   type: DocumentType;
//   invoiceNumber: string;
//   date: string;
//   dueDate: string;
//   status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled' | 'Accepted' | 'Declined';
//   companyInfo: CompanyInfo;
//   toCompany: string;
//   toContact: string;
//   toAddress: string;
//   toEmail: string;
//   toPhone: string;
//   items: InvoiceItem[];
//   subtotal: number;
//   taxRate: number;
//   taxAmount: number;
//   discountRate: number;
//   discountAmount: number;
//   total: number;
//   notes: string;
//   terms: string;
//   paymentMethod: string;
//   validUntil?: string;
// }

// interface DocumentModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSave: (document: DocumentData) => void;
//   editingDocument?: DocumentData | null;
//   contacts?: Array<{
//     id: string;
//     name: string;
//     email: string;
//     phone: string;
//     company: string;
//   }>;
//   companyInfo?: CompanyInfo;
//   onUpdateCompanyInfo?: (info: CompanyInfo) => void;
// }

// export function InvoiceModal({ 
//   isOpen, 
//   onClose, 
//   onSave, 
//   editingDocument, 
//   contacts = [], 
//   companyInfo: initialCompanyInfo,
//   onUpdateCompanyInfo 
// }: DocumentModalProps) {
//   const [document, setDocument] = useState<DocumentData>({
//     id: '',
//     type: 'invoice',
//     invoiceNumber: '',
//     date: new Date().toISOString().split('T')[0],
//     dueDate: '',
//     validUntil: '',
//     status: 'Draft',
//     companyInfo: initialCompanyInfo || {
//       name: 'Your Company Name',
//       address: 'Your Address\nCity, State ZIP',
//       email: 'your@email.com',
//       phone: '+1 (555) 000-0000',
//     },
//     toCompany: '',
//     toContact: '',
//     toAddress: '',
//     toEmail: '',
//     toPhone: '',
//     items: [{
//       id: '1',
//       description: '',
//       quantity: 1,
//       unitPrice: 0,
//       total: 0
//     }],
//     subtotal: 0,
//     taxRate: 0,
//     taxAmount: 0,
//     discountRate: 0,
//     discountAmount: 0,
//     total: 0,
//     notes: '',
//     terms: 'Payment is due within 30 days of invoice date.',
//     paymentMethod: 'Bank Transfer'
//   });

  
//   const [selectedTemplate, setSelectedTemplate] = useState<string>('default');

//   useEffect(() => {
//     if (editingDocument) {
//       setDocument(editingDocument);
//     } else {
//       const prefix = document.type === 'invoice' ? 'INV' : 'QUO';
//       const docNum = `${prefix}-${Date.now().toString().slice(-6)}`;
//       setDocument(prev => ({ 
//         ...prev, 
//         invoiceNumber: docNum, 
//         id: docNum,
//         companyInfo: initialCompanyInfo || prev.companyInfo
//       }));
//     }
//   }, [editingDocument, isOpen, initialCompanyInfo, document.type]);

//   useEffect(() => {
//     const subtotal = document.items.reduce((sum, item) => sum + item.total, 0);
//     const discountAmount = (subtotal * document.discountRate) / 100;
//     const taxableAmount = subtotal - discountAmount;
//     const taxAmount = (taxableAmount * document.taxRate) / 100;
//     const total = taxableAmount + taxAmount;

//     setDocument(prev => ({
//       ...prev,
//       subtotal,
//       discountAmount,
//       taxAmount,
//       total
//     }));
//   }, [document.items, document.taxRate, document.discountRate]);

//   const handleCompanyInfoUpdate = (info: CompanyInfo) => {
//     setDocument(prev => ({ ...prev, companyInfo: info }));
//     onUpdateCompanyInfo?.(info);
//   };

//   const handleSave = () => {
//     onSave(document);
//     onClose();
//   };

//   const handleSend = () => {
//     const sentDocument = { ...document, status: 'Sent' as const };
//     onSave(sentDocument);
//     onClose();
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[100vh] overflow-hidden">
//         <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
//           <div className="flex items-center space-x-3">
//             <Calculator className="w-6 h-6 text-blue-600" />
//             <h2 className="text-xl font-semibold text-gray-900">
//               {editingDocument ? `Edit ${document.type}` : `Create ${document.type}`}
//             </h2>
//           </div>
//           <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
//             <X className="w-5 h-5 text-gray-500" />
//           </button>
//         </div>

//         <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
//           <div className="p-6">
//             <DocumentForm
//               document={document}
//               onUpdate={setDocument}
//               contacts={contacts}
//               onUpdateCompanyInfo={handleCompanyInfoUpdate}
//             />

//             <IntegratedInvoiceSystem
//               document={document}
//               selectedTemplate={selectedTemplate}
//               onSelectTemplate={setSelectedTemplate}
//             />
//           </div>
//         </div>

//         <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
//           <div className="flex items-center space-x-3">
//             <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
//               Cancel
//             </button>
//           </div>
//           <div className="flex items-center space-x-3">
//             <button onClick={() => {}} className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
//               <Download className="w-4 h-4" />
//               <span>Download</span>
//             </button>
//             <button onClick={handleSave} className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
//               <Save className="w-4 h-4" />
//               <span>Save Draft</span>
//             </button>
//             <button onClick={handleSend} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
//               <Send className="w-4 h-4" />
//               <span>Save & Send</span>
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }






















