'use client';
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Send, Download, Calculator, Eye, Sparkles, Crown, Zap, Diamond } from 'lucide-react';
import { DocumentForm } from './DocumentForm';
import { DownloadModal } from './DownloadModal';
import type { DocumentData, CompanyInfo, Contact, InvoiceTemplate } from '@/lib/types/invoice/types';
import { TemplateRenderer } from '../TemplateRenderer';
import { PDFGenerator } from '@/lib/utils/invoice/PDFGenerator';

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

  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate>('modern');
  const [showPreview, setShowPreview] = useState(true);
  const [downloadModal, setDownloadModal] = useState({
    isOpen: false,
    status: 'downloading' as 'downloading' | 'success' | 'error',
    message: '',
    fileName: ''
  });
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);

  const templates = [
    {
      id: 'modern' as const,
      name: 'Modern',
      icon: Sparkles,
      color: 'from-blue-500 to-indigo-600',
      description: 'Clean gradient design with modern styling'
    },
    {
      id: 'classic' as const,
      name: 'Classic',
      icon: Crown,
      color: 'from-gray-700 to-gray-900',
      description: 'Traditional business document style'
    },
    {
      id: 'minimal' as const,
      name: 'Minimal',
      icon: Zap,
      color: 'from-gray-400 to-gray-600',
      description: 'Simple and clean layout'
    },
    {
      id: 'professional' as const,
      name: 'Professional',
      icon: Diamond,
      color: 'from-indigo-500 to-blue-600',
      description: 'Corporate professional appearance'
    }
  ];

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

      // Wait a bit for the modal to show and ensure DOM is ready
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
      // Create a new window for printing with proper styles
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
        
        // Wait for content to load then print
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

            {/* Right Panel - Templates & Preview */}
            <div className="w-1/2 flex flex-col">
              {/* Template Selector */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Template</h3>
                <div className="grid grid-cols-2 gap-3">
                  {templates.map((template) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`p-3 rounded-xl transition-all duration-300 flex items-center space-x-2 text-sm group ${
                          selectedTemplate === template.id
                            ? `bg-gradient-to-r ${template.color} text-white shadow-lg`
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                        title={template.description}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{template.name}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                      showPreview 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
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

              {/* Preview */}
              {showPreview ? (
                <div className="flex-1 overflow-y-auto p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
                  <div className="transform scale-75 origin-top-left w-[133%]">
                    <div ref={printRef}>
                      <TemplateRenderer document={document} template={selectedTemplate} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center text-gray-500">
                    <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Preview Hidden</p>
                    <p className="text-sm">Click "Show Preview" to see your document</p>
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
                Total: ${document.total.toFixed(2)}
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
                
                {/* Download Options Dropdown */}
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
                <span>Save Draft</span>
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




















































// "use client";
// import React, { useState, useEffect } from 'react';
// import { X, Plus, Trash2, Save, Send, Download, Calculator, Calendar, Building, User, Mail, Phone, MapPin, Upload, FileText } from 'lucide-react';

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
  
//   // Company/From Details
//   companyInfo: CompanyInfo;
  
//   // Client/To Details
//   toCompany: string;
//   toContact: string;
//   toAddress: string;
//   toEmail: string;
//   toPhone: string;
  
//   // Invoice Items
//   items: InvoiceItem[];
  
//   // Financial Details
//   subtotal: number;
//   taxRate: number;
//   taxAmount: number;
//   discountRate: number;
//   discountAmount: number;
//   total: number;
  
//   // Additional Info
//   notes: string;
//   terms: string;
//   paymentMethod: string;
//   validUntil?: string; // For quotes
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

// // Company Information Form Component
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
//         <button
//           onClick={onToggle}
//           className="text-blue-600 hover:text-blue-800 text-sm font-medium"
//         >
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
//         <button
//           onClick={onToggle}
//           className="text-gray-500 hover:text-gray-700"
//         >
//           <X className="w-4 h-4" />
//         </button>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Company Logo
//             </label>
//             <div className="flex items-center space-x-4">
//               {info.logo && (
//                 <img src={info.logo} alt="Company Logo" className="w-16 h-16 object-contain rounded-lg border" />
//               )}
//               <label className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
//                 <Upload className="w-4 h-4" />
//                 <span className="text-sm">Upload Logo</span>
//                 <input
//                   type="file"
//                   accept="image/*"
//                   onChange={handleLogoUpload}
//                   className="hidden"
//                 />
//               </label>
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Company Name
//             </label>
//             <input
//               type="text"
//               value={info.name}
//               onChange={(e) => handleUpdate('name', e.target.value)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Address
//             </label>
//             <textarea
//               value={info.address}
//               onChange={(e) => handleUpdate('address', e.target.value)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
//             />
//           </div>
//         </div>

//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Email
//             </label>
//             <input
//               type="email"
//               value={info.email}
//               onChange={(e) => handleUpdate('email', e.target.value)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Phone
//             </label>
//             <input
//               type="tel"
//               value={info.phone}
//               onChange={(e) => handleUpdate('phone', e.target.value)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Tax ID
//             </label>
//             <input
//               type="text"
//               value={info.taxId || ''}
//               onChange={(e) => handleUpdate('taxId', e.target.value)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Company ID
//             </label>
//             <input
//               type="text"
//               value={info.companyId || ''}
//               onChange={(e) => handleUpdate('companyId', e.target.value)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Main Document Form Component
// const DocumentForm: React.FC<{
//   document: DocumentData;
//   onUpdate: (doc: DocumentData) => void;
//   contacts: Array<{ id: string; name: string; email: string; phone: string; company: string; }>;
// }> = ({ document, onUpdate, contacts }) => {
//   const [selectedContact, setSelectedContact] = useState<string>('');

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

//   const getDefaultTerms = () => {
//     if (document.type === 'quote') {
//       return 'This quote is valid for 30 days from the date of issue.';
//     }
//     return 'Payment is due within 30 days of invoice date.';
//   };

//   return (
//     <div className="space-y-6">
//       {/* Document Header Info */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div className="space-y-4">
//           <h3 className="text-lg font-medium text-gray-900 flex items-center">
//             <FileText className="w-5 h-5 mr-2 text-gray-600" />
//             {document.type === 'invoice' ? 'Invoice' : 'Quote'} Details
//           </h3>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Document Type
//             </label>
//             <select
//               value={document.type}
//               onChange={(e) => onUpdate({ 
//                 ...document, 
//                 type: e.target.value as DocumentType,
//                 terms: e.target.value === 'quote' ? 'This quote is valid for 30 days from the date of issue.' : 'Payment is due within 30 days of invoice date.'
//               })}
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="invoice">Invoice</option>
//               <option value="quote">Quote</option>
//             </select>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {document.type === 'invoice' ? 'Invoice' : 'Quote'} Number
//               </label>
//               <input
//                 type="text"
//                 value={document.invoiceNumber}
//                 onChange={(e) => onUpdate({ ...document, invoiceNumber: e.target.value })}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Status
//               </label>
//               <select
//                 value={document.status}
//                 onChange={(e) => onUpdate({ ...document, status: e.target.value as DocumentData['status'] })}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 {getStatusOptions().map(status => (
//                   <option key={status} value={status}>{status}</option>
//                 ))}
//               </select>
//             </div>
//           </div>
          
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 <Calendar className="w-4 h-4 inline mr-1" />
//                 Date
//               </label>
//               <input
//                 type="date"
//                 value={document.date}
//                 onChange={(e) => onUpdate({ ...document, date: e.target.value })}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 <Calendar className="w-4 h-4 inline mr-1" />
//                 {document.type === 'invoice' ? 'Due Date' : 'Valid Until'}
//               </label>
//               <input
//                 type="date"
//                 value={document.type === 'invoice' ? document.dueDate : (document.validUntil || '')}
//                 onChange={(e) => onUpdate({ 
//                   ...document, 
//                   ...(document.type === 'invoice' 
//                     ? { dueDate: e.target.value }
//                     : { validUntil: e.target.value })
//                 })}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Client Selection */}
//         <div className="space-y-4">
//           <h3 className="text-lg font-medium text-gray-900 flex items-center">
//             <User className="w-5 h-5 mr-2 text-gray-600" />
//             {document.type === 'invoice' ? 'Bill To' : 'Quote For'}
//           </h3>
//           {contacts.length > 0 && (
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Select Contact
//               </label>
//               <select
//                 value={selectedContact}
//                 onChange={(e) => handleContactSelect(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="">Select a contact...</option>
//                 {contacts.map(contact => (
//                   <option key={contact.id} value={contact.id}>
//                     {contact.name} - {contact.company}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           )}
//           <div className="grid grid-cols-1 gap-3">
//             <input
//               type="text"
//               placeholder="Company Name"
//               value={document.toCompany}
//               onChange={(e) => onUpdate({ ...document, toCompany: e.target.value })}
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//             <input
//               type="text"
//               placeholder="Contact Person"
//               value={document.toContact}
//               onChange={(e) => onUpdate({ ...document, toContact: e.target.value })}
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//             <textarea
//               placeholder="Address"
//               value={document.toAddress}
//               onChange={(e) => onUpdate({ ...document, toAddress: e.target.value })}
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
//             />
//             <div className="grid grid-cols-2 gap-3">
//               <input
//                 type="email"
//                 placeholder="Email"
//                 value={document.toEmail}
//                 onChange={(e) => onUpdate({ ...document, toEmail: e.target.value })}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//               <input
//                 type="tel"
//                 placeholder="Phone"
//                 value={document.toPhone}
//                 onChange={(e) => onUpdate({ ...document, toPhone: e.target.value })}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Document Items */}
//       <div className="space-y-4">
//         <div className="flex items-center justify-between">
//           <h3 className="text-lg font-medium text-gray-900">
//             {document.type === 'invoice' ? 'Invoice' : 'Quote'} Items
//           </h3>
//           <button
//             onClick={addItem}
//             className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//           >
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
//                 <textarea
//                   value={item.description}
//                   onChange={(e) => updateItem(item.id, 'description', e.target.value)}
//                   placeholder="Item description..."
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none text-sm"
//                 />
//               </div>
//               <div className="col-span-2">
//                 <input
//                   type="number"
//                   value={item.quantity}
//                   onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
//                   min="0"
//                   step="0.01"
//                 />
//               </div>
//               <div className="col-span-2">
//                 <input
//                   type="number"
//                   value={item.unitPrice}
//                   onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
//                   min="0"
//                   step="0.01"
//                 />
//               </div>
//               <div className="col-span-2">
//                 <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium">
//                   ${item.total.toFixed(2)}
//                 </div>
//               </div>
//               <div className="col-span-1">
//                 {document.items.length > 1 && (
//                   <button
//                     onClick={() => removeItem(item.id)}
//                     className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
//                   >
//                     <Trash2 className="w-4 h-4" />
//                   </button>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Financial Summary and Additional Information */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div className="space-y-4">
//           <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Notes
//             </label>
//             <textarea
//               value={document.notes}
//               onChange={(e) => onUpdate({ ...document, notes: e.target.value })}
//               placeholder="Additional notes..."
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Terms & Conditions
//             </label>
//             <textarea
//               value={document.terms}
//               onChange={(e) => onUpdate({ ...document, terms: e.target.value })}
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
//             />
//           </div>
//         </div>

//         <div className="space-y-4">
//           <h3 className="text-lg font-medium text-gray-900">
//             {document.type === 'invoice' ? 'Invoice' : 'Quote'} Summary
//           </h3>
//           <div className="bg-gray-50 p-4 rounded-lg space-y-3">
//             <div className="flex justify-between">
//               <span className="text-sm text-gray-600">Subtotal:</span>
//               <span className="font-medium">${document.subtotal.toFixed(2)}</span>
//             </div>
            
//             <div className="flex items-center space-x-2">
//               <span className="text-sm text-gray-600">Discount:</span>
//               <input
//                 type="number"
//                 value={document.discountRate}
//                 onChange={(e) => onUpdate({ ...document, discountRate: parseFloat(e.target.value) || 0 })}
//                 className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
//                 min="0"
//                 max="100"
//                 step="0.1"
//               />
//               <span className="text-sm text-gray-600">%</span>
//               <span className="ml-auto font-medium">-${document.discountAmount.toFixed(2)}</span>
//             </div>
            
//             <div className="flex items-center space-x-2">
//               <span className="text-sm text-gray-600">Tax:</span>
//               <input
//                 type="number"
//                 value={document.taxRate}
//                 onChange={(e) => onUpdate({ ...document, taxRate: parseFloat(e.target.value) || 0 })}
//                 className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
//                 min="0"
//                 max="100"
//                 step="0.1"
//               />
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

// // Main Modal Component
// export function DocumentModal({ 
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

//   const [showCompanyForm, setShowCompanyForm] = useState(false);

//   useEffect(() => {
//     if (editingDocument) {
//       setDocument(editingDocument);
//     } else {
//       // Generate new document number
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
//     calculateTotals();
//   }, [document.items, document.taxRate, document.discountRate]);

//   const calculateTotals = () => {
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
//   };

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
//         {/* Header */}
//         <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
//           <div className="flex items-center space-x-3">
//             <Calculator className="w-6 h-6 text-blue-600" />
//             <h2 className="text-xl font-semibold text-gray-900">
//               {editingDocument ? `Edit ${document.type}` : `Create ${document.type}`}
//             </h2>
//           </div>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
//           >
//             <X className="w-5 h-5 text-gray-500" />
//           </button>
//         </div>

//         {/* Content */}
//         <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
//           <div className="p-6">
//             <CompanyInfoForm
//               companyInfo={document.companyInfo}
//               onUpdate={handleCompanyInfoUpdate}
//               showForm={showCompanyForm}
//               onToggle={() => setShowCompanyForm(!showCompanyForm)}
//             />
            
//             <DocumentForm
//               document={document}
//               onUpdate={setDocument}
//               contacts={contacts}
//             />
//           </div>
//         </div>

//         {/* Footer Actions */}
//         <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
//           <div className="flex items-center space-x-3">
//             <button
//               onClick={onClose}
//               className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
//             >
//               Cancel
//             </button>
//           </div>
//           <div className="flex items-center space-x-3">
//             <button
//               onClick={() => {/* Handle download/print */}}
//               className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
//             >
//               <Download className="w-4 h-4" />
//               <span>Download</span>
//             </button>
//             <button
//               onClick={handleSave}
//               className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
//             >
//               <Save className="w-4 h-4" />
//               <span>Save Draft</span>
//             </button>
//             <button
//               onClick={handleSend}
//               className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//             >
//               <Send className="w-4 h-4" />
//               <span>Save & Send</span>
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Export types for use in other components
// export type { DocumentData, CompanyInfo, InvoiceItem };



























































// "use client";
// import React, { useState, useEffect } from 'react';
// import { X, Plus, Trash2, Save, Send, Download, Calculator, Calendar, Building, User, Mail, Phone, MapPin } from 'lucide-react';

// interface InvoiceItem {
//   id: string;
//   description: string;
//   quantity: number;
//   unitPrice: number;
//   total: number;
// }

// interface InvoiceData {
//   id: string;
//   invoiceNumber: string;
//   date: string;
//   dueDate: string;
//   status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  
//   // Company/From Details
//   fromCompany: string;
//   fromAddress: string;
//   fromEmail: string;
//   fromPhone: string;
  
//   // Client/To Details
//   toCompany: string;
//   toContact: string;
//   toAddress: string;
//   toEmail: string;
//   toPhone: string;
  
//   // Invoice Items
//   items: InvoiceItem[];
  
//   // Financial Details
//   subtotal: number;
//   taxRate: number;
//   taxAmount: number;
//   discountRate: number;
//   discountAmount: number;
//   total: number;
  
//   // Additional Info
//   notes: string;
//   terms: string;
//   paymentMethod: string;
// }

// interface InvoiceModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSave: (invoice: InvoiceData) => void;
//   editingInvoice?: InvoiceData | null;
//   contacts?: Array<{
//     id: string;
//     name: string;
//     email: string;
//     phone: string;
//     company: string;
//   }>;
// }

// export function InvoiceModal({ isOpen, onClose, onSave, editingInvoice, contacts = [] }: InvoiceModalProps) {
//   const [invoice, setInvoice] = useState<InvoiceData>({
//     id: '',
//     invoiceNumber: '',
//     date: new Date().toISOString().split('T')[0],
//     dueDate: '',
//     status: 'Draft',
//     fromCompany: 'Your Company Name',
//     fromAddress: 'Your Address\nCity, State ZIP',
//     fromEmail: 'your@email.com',
//     fromPhone: '+1 (555) 000-0000',
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

//   const [selectedContact, setSelectedContact] = useState<string>('');

//   useEffect(() => {
//     if (editingInvoice) {
//       setInvoice(editingInvoice);
//     } else {
//       // Generate new invoice number
//       const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;
//       setInvoice(prev => ({ ...prev, invoiceNumber: invoiceNum, id: invoiceNum }));
//     }
//   }, [editingInvoice, isOpen]);

//   useEffect(() => {
//     calculateTotals();
//   }, [invoice.items, invoice.taxRate, invoice.discountRate]);

//   const calculateTotals = () => {
//     const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
//     const discountAmount = (subtotal * invoice.discountRate) / 100;
//     const taxableAmount = subtotal - discountAmount;
//     const taxAmount = (taxableAmount * invoice.taxRate) / 100;
//     const total = taxableAmount + taxAmount;

//     setInvoice(prev => ({
//       ...prev,
//       subtotal,
//       discountAmount,
//       taxAmount,
//       total
//     }));
//   };

//   const handleContactSelect = (contactId: string) => {
//     const contact = contacts.find(c => c.id === contactId);
//     if (contact) {
//       setInvoice(prev => ({
//         ...prev,
//         toCompany: contact.company,
//         toContact: contact.name,
//         toEmail: contact.email,
//         toPhone: contact.phone
//       }));
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
//     setInvoice(prev => ({
//       ...prev,
//       items: [...prev.items, newItem]
//     }));
//   };

//   const removeItem = (itemId: string) => {
//     setInvoice(prev => ({
//       ...prev,
//       items: prev.items.filter(item => item.id !== itemId)
//     }));
//   };

//   const updateItem = (itemId: string, field: keyof InvoiceItem, value: string | number) => {
//     setInvoice(prev => ({
//       ...prev,
//       items: prev.items.map(item => {
//         if (item.id === itemId) {
//           const updatedItem = { ...item, [field]: value };
//           if (field === 'quantity' || field === 'unitPrice') {
//             updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
//           }
//           return updatedItem;
//         }
//         return item;
//       })
//     }));
//   };

//   const handleSave = () => {
//     onSave(invoice);
//     onClose();
//   };

//   const handleSend = () => {
//     const sentInvoice = { ...invoice, status: 'Sent' as const };
//     onSave(sentInvoice);
//     onClose();
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[100vh] overflow-hidden">
//         {/* Header */}
//         <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
//           <div className="flex items-center space-x-3">
//             <Calculator className="w-6 h-6 text-blue-600" />
//             <h2 className="text-xl font-semibold text-gray-900">
//               {editingInvoice ? 'Edit Invoice' : 'Create Invoice'}
//             </h2>
//           </div>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
//           >
//             <X className="w-5 h-5 text-gray-500" />
//           </button>
//         </div>

//         {/* Content */}
//         <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
//           <div className="p-6 space-y-6">
//             {/* Invoice Header Info */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="space-y-4">
//                 <h3 className="text-lg font-medium text-gray-900 flex items-center">
//                   <Building className="w-5 h-5 mr-2 text-gray-600" />
//                   Invoice Details
//                 </h3>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Invoice Number
//                     </label>
//                     <input
//                       type="text"
//                       value={invoice.invoiceNumber}
//                       onChange={(e) => setInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Status
//                     </label>
//                     <select
//                       value={invoice.status}
//                       onChange={(e) => setInvoice(prev => ({ ...prev, status: e.target.value as InvoiceData['status'] }))}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="Draft">Draft</option>
//                       <option value="Sent">Sent</option>
//                       <option value="Paid">Paid</option>
//                       <option value="Overdue">Overdue</option>
//                       <option value="Cancelled">Cancelled</option>
//                     </select>
//                   </div>
//                 </div>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       <Calendar className="w-4 h-4 inline mr-1" />
//                       Invoice Date
//                     </label>
//                     <input
//                       type="date"
//                       value={invoice.date}
//                       onChange={(e) => setInvoice(prev => ({ ...prev, date: e.target.value }))}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       <Calendar className="w-4 h-4 inline mr-1" />
//                       Due Date
//                     </label>
//                     <input
//                       type="date"
//                       value={invoice.dueDate}
//                       onChange={(e) => setInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Client Selection */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-medium text-gray-900 flex items-center">
//                   <User className="w-5 h-5 mr-2 text-gray-600" />
//                   Bill To
//                 </h3>
//                 {contacts.length > 0 && (
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Select Contact
//                     </label>
//                     <select
//                       value={selectedContact}
//                       onChange={(e) => handleContactSelect(e.target.value)}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select a contact...</option>
//                       {contacts.map(contact => (
//                         <option key={contact.id} value={contact.id}>
//                           {contact.name} - {contact.company}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 )}
//                 <div className="grid grid-cols-1 gap-3">
//                   <input
//                     type="text"
//                     placeholder="Company Name"
//                     value={invoice.toCompany}
//                     onChange={(e) => setInvoice(prev => ({ ...prev, toCompany: e.target.value }))}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                   <input
//                     type="text"
//                     placeholder="Contact Person"
//                     value={invoice.toContact}
//                     onChange={(e) => setInvoice(prev => ({ ...prev, toContact: e.target.value }))}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                   <textarea
//                     placeholder="Address"
//                     value={invoice.toAddress}
//                     onChange={(e) => setInvoice(prev => ({ ...prev, toAddress: e.target.value }))}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
//                   />
//                   <div className="grid grid-cols-2 gap-3">
//                     <input
//                       type="email"
//                       placeholder="Email"
//                       value={invoice.toEmail}
//                       onChange={(e) => setInvoice(prev => ({ ...prev, toEmail: e.target.value }))}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     />
//                     <input
//                       type="tel"
//                       placeholder="Phone"
//                       value={invoice.toPhone}
//                       onChange={(e) => setInvoice(prev => ({ ...prev, toPhone: e.target.value }))}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Invoice Items */}
//             <div className="space-y-4">
//               <div className="flex items-center justify-between">
//                 <h3 className="text-lg font-medium text-gray-900">Invoice Items</h3>
//                 <button
//                   onClick={addItem}
//                   className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                 >
//                   <Plus className="w-4 h-4" />
//                   <span>Add Item</span>
//                 </button>
//               </div>

//               <div className="border border-gray-200 rounded-lg overflow-hidden">
//                 <div className="bg-gray-50 px-4 py-3 grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
//                   <div className="col-span-5">Description</div>
//                   <div className="col-span-2">Quantity</div>
//                   <div className="col-span-2">Unit Price</div>
//                   <div className="col-span-2">Total</div>
//                   <div className="col-span-1"></div>
//                 </div>
                
//                 {invoice.items.map((item, index) => (
//                   <div key={item.id} className="px-4 py-3 grid grid-cols-12 gap-4 border-t border-gray-200">
//                     <div className="col-span-5">
//                       <textarea
//                         value={item.description}
//                         onChange={(e) => updateItem(item.id, 'description', e.target.value)}
//                         placeholder="Item description..."
//                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none text-sm"
//                       />
//                     </div>
//                     <div className="col-span-2">
//                       <input
//                         type="number"
//                         value={item.quantity}
//                         onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
//                         min="0"
//                         step="0.01"
//                       />
//                     </div>
//                     <div className="col-span-2">
//                       <input
//                         type="number"
//                         value={item.unitPrice}
//                         onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
//                         min="0"
//                         step="0.01"
//                       />
//                     </div>
//                     <div className="col-span-2">
//                       <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium">
//                         ${item.total.toFixed(2)}
//                       </div>
//                     </div>
//                     <div className="col-span-1">
//                       {invoice.items.length > 1 && (
//                         <button
//                           onClick={() => removeItem(item.id)}
//                           className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
//                         >
//                           <Trash2 className="w-4 h-4" />
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Financial Summary */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="space-y-4">
//                 <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Notes
//                   </label>
//                   <textarea
//                     value={invoice.notes}
//                     onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
//                     placeholder="Additional notes..."
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Terms & Conditions
//                   </label>
//                   <textarea
//                     value={invoice.terms}
//                     onChange={(e) => setInvoice(prev => ({ ...prev, terms: e.target.value }))}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
//                   />
//                 </div>
//               </div>

//               <div className="space-y-4">
//                 <h3 className="text-lg font-medium text-gray-900">Invoice Summary</h3>
//                 <div className="bg-gray-50 p-4 rounded-lg space-y-3">
//                   <div className="flex justify-between">
//                     <span className="text-sm text-gray-600">Subtotal:</span>
//                     <span className="font-medium">${invoice.subtotal.toFixed(2)}</span>
//                   </div>
                  
//                   <div className="flex items-center space-x-2">
//                     <span className="text-sm text-gray-600">Discount:</span>
//                     <input
//                       type="number"
//                       value={invoice.discountRate}
//                       onChange={(e) => setInvoice(prev => ({ ...prev, discountRate: parseFloat(e.target.value) || 0 }))}
//                       className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
//                       min="0"
//                       max="100"
//                       step="0.1"
//                     />
//                     <span className="text-sm text-gray-600">%</span>
//                     <span className="ml-auto font-medium">-${invoice.discountAmount.toFixed(2)}</span>
//                   </div>
                  
//                   <div className="flex items-center space-x-2">
//                     <span className="text-sm text-gray-600">Tax:</span>
//                     <input
//                       type="number"
//                       value={invoice.taxRate}
//                       onChange={(e) => setInvoice(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
//                       className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
//                       min="0"
//                       max="100"
//                       step="0.1"
//                     />
//                     <span className="text-sm text-gray-600">%</span>
//                     <span className="ml-auto font-medium">${invoice.taxAmount.toFixed(2)}</span>
//                   </div>
                  
//                   <div className="border-t border-gray-200 pt-3">
//                     <div className="flex justify-between">
//                       <span className="text-lg font-semibold text-gray-900">Total:</span>
//                       <span className="text-lg font-bold text-blue-600">${invoice.total.toFixed(2)}</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Footer Actions */}
//         <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
//           <div className="flex items-center space-x-3">
//             <button
//               onClick={onClose}
//               className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
//             >
//               Cancel
//             </button>
//           </div>
//           <div className="flex items-center space-x-3">
//             <button
//               onClick={() => {/* Handle download/print */}}
//               className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
//             >
//               <Download className="w-4 h-4" />
//               <span>Download</span>
//             </button>
//             <button
//               onClick={handleSave}
//               className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
//             >
//               <Save className="w-4 h-4" />
//               <span>Save Draft</span>
//             </button>
//             <button
//               onClick={handleSend}
//               className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//             >
//               <Send className="w-4 h-4" />
//               <span>Save & Send</span>
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }