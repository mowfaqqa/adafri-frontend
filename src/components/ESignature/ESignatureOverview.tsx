"use client";
import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Upload, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SignatureGenerator from './modal/SignatureGenerator';


// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// PDF Viewer Component
const PDFViewer: React.FC<{ file: File }> = ({ file }) => {
  const [pages, setPages] = useState<number>(0);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Load PDF document
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        // Set number of pages
        setPages(pdf.numPages);
        
        // Prepare canvas references
        canvasRefs.current = new Array(pdf.numPages).fill(null);
        
        // Render pages
        const pagePromises = Array.from({ length: pdf.numPages }, async (_, i) => {
          const page = await pdf.getPage(i + 1);
          const canvas = canvasRefs.current[i];
          
          if (!canvas) return;
          
          const context = canvas.getContext('2d');
          if (!context) return;
          
          // Calculate scale
          const viewport = page.getViewport({ scale: 1.5 });
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          // Render page
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
        });
        
        await Promise.all(pagePromises);
      } catch (error) {
        console.error('PDF loading error:', error);
        alert('Failed to load PDF. Please try again.');
      }
    };

    loadPDF();
  }, [file]);

  return (
    <div className="pdf-viewer space-y-4 overflow-auto max-h-[600px]">
      {Array.from({ length: pages }, (_, index) => (
        <canvas
          key={`page-${index}`}
          ref={(el) => {
            if (canvasRefs.current) {
              canvasRefs.current[index] = el;
            }
          }}
          className="w-full border rounded-lg shadow-md"
        />
      ))}
    </div>
  );
};

// Word Document Preview Component
const DocumentWordPreview: React.FC<{ file: File }> = ({ file }) => {
  const [pages, setPages] = useState<string[]>([]);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        
        // Simple page splitting
        const documentPages = result.value.split('<hr>');
        setPages(documentPages);
      } catch (error) {
        console.error('Document processing error:', error);
        alert('Failed to load document. Please try again.');
      }
    };

    loadDocument();
  }, [file]);

  return (
    <div className="space-y-4 overflow-auto max-h-[600px]">
      {pages.map((pageContent, index) => (
        <div 
          key={`page_${index + 1}`} 
          className="bg-white shadow-md rounded-lg p-4"
          dangerouslySetInnerHTML={{ __html: pageContent }}
        />
      ))}
    </div>
  );
};

// Main E-Signature Component
const ESignatureComponent: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'doc' | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Upload Handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF or Word document');
      return;
    }

    setSelectedFile(file);
    setFileType(
      file.type === 'application/pdf' 
        ? 'pdf' 
        : 'doc'
    );
  };

  // Document Preview Renderer
  const renderDocumentPreview = () => {
    if (!selectedFile || !fileType) return null;

    return fileType === 'pdf' ? (
      <PDFViewer file={selectedFile} />
    ) : (
      <DocumentWordPreview file={selectedFile} />
    );
  };

  // Handle Signature Generation
  const handleSignatureGenerate = (signatureDataUrl: string) => {
    setSignature(signatureDataUrl);
  };

  // Save Document with Signature
  const handleSaveDocument = () => {
    if (!selectedFile || !signature) {
      alert('Please upload a document and generate a signature');
      return;
    }
    // Future implementation: Add logic to save document with signature
    console.log('Saving document with signature');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-xl">
      <h2 className="text-2xl font-bold mb-6 text-center">Document E-Signature</h2>

      {/* Signature Generator Modal */}
      <div className="mb-6 flex justify-center">
        <SignatureGenerator onSignatureGenerate={handleSignatureGenerate} />
      </div>

      {/* Signature Preview (if generated) */}
      {signature && (
        <div className="mb-6 flex justify-center">
          <div 
            className="signature-preview border rounded-lg shadow-md"
            style={{ 
              backgroundImage: `url(${signature})`, 
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              width: '300px', 
              height: '100px' 
            }}
          />
        </div>
      )}

      {/* File Upload Section */}
      <div className="mb-6 flex items-center justify-center">
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf,.doc,.docx"
          className="hidden"
        />
        <Button onClick={() => fileInputRef.current?.click()} variant="outline">
          <Upload className="mr-2 h-4 w-4" /> Upload Document
        </Button>
      </div>

      {/* Document Preview */}
      {selectedFile && renderDocumentPreview()}

      {/* Save Document Button */}
      {selectedFile && signature && (
        <div className="mt-6 text-center">
          <Button 
            onClick={handleSaveDocument}
            className="flex items-center mx-auto"
          >
            <Save className="mr-2 h-4 w-4" /> Save Signed Document
          </Button>
        </div>
      )}
    </div>
  );
};

export default ESignatureComponent;





















// "use client";
// import React, { useState, useRef, useEffect } from 'react';
// import { Document, Page, pdfjs } from 'react-pdf';
// import * as mammoth from 'mammoth';
// import { Upload, Trash2, Save } from 'lucide-react';

// // Configure PDF.js worker
// if (typeof window !== 'undefined') {
//   pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
// }

// // Styles
// import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
// import 'react-pdf/dist/esm/Page/TextLayer.css';

// interface DocumentPreviewProps {
//   file: File;
//   type: 'pdf' | 'doc';
// }

// const DocumentPreview: React.FC<DocumentPreviewProps> = ({ file, type }) => {
//   const [pages, setPages] = useState<string[]>([]);
//   const [numPages, setNumPages] = useState<number>(0);

//   useEffect(() => {
//     const loadDocument = async () => {
//       try {
//         if (type === 'pdf') {
//           // PDF handling will be managed by react-pdf
//           return;
//         }

//         // Word document handling
//         const arrayBuffer = await file.arrayBuffer();
//         const result = await mammoth.convertToHtml({ arrayBuffer });
        
//         // Simple page splitting (you might want to improve this)
//         const documentPages = result.value.split('<hr>');
//         setPages(documentPages);
//         setNumPages(documentPages.length);
//       } catch (error) {
//         console.error('Document processing error:', error);
//       }
//     };

//     loadDocument();
//   }, [file, type]);

//   // PDF Page Rendering
//   const renderPdfPages = () => (
//     <Document 
//       file={file}
//       onLoadSuccess={({ numPages }) => setNumPages(numPages)}
//       className="space-y-4"
//     >
//       {Array.from(new Array(numPages), (el, index) => (
//         <Page 
//           key={`page_${index + 1}`}
//           pageNumber={index + 1}
//           width={600}
//           renderTextLayer={false}
//           renderAnnotationLayer={false}
//         />
//       ))}
//     </Document>
//   );

//   // Word Document Page Rendering
//   const renderWordPages = () => (
//     <div className="space-y-4">
//       {pages.map((pageContent, index) => (
//         <div 
//           key={`page_${index + 1}`} 
//           className="bg-white shadow-md rounded-lg p-4"
//         >
//           <div 
//             dangerouslySetInnerHTML={{ __html: pageContent }}
//             className="document-page"
//           />
//         </div>
//       ))}
//     </div>
//   );

//   return (
//     <div className="document-preview overflow-auto max-h-[600px] border rounded-lg p-2">
//       {type === 'pdf' ? renderPdfPages() : renderWordPages()}
//     </div>
//   );
// };

// const ESignatureComponent: React.FC = () => {
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [fileType, setFileType] = useState<'pdf' | 'doc' | null>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   // File Upload Handler
//   const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     // Validate file type
//     const allowedTypes = [
//       'application/pdf', 
//       'application/msword', 
//       'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
//     ];
    
//     if (!allowedTypes.includes(file.type)) {
//       alert('Please upload a PDF or Word document');
//       return;
//     }

//     // Set file and type
//     setSelectedFile(file);
//     setFileType(
//       file.type === 'application/pdf' 
//         ? 'pdf' 
//         : 'doc'
//     );
//   };

//   // Signature Creation Section
//   const renderSignatureSection = () => (
//     <div className="signature-section mt-4 p-4 bg-gray-50 rounded-lg">
//       <h3 className="text-xl font-semibold mb-4">Create Signature</h3>
      
//       <div className="grid grid-cols-2 gap-4">
//         {/* Text Signature */}
//         <div>
//           <label className="block mb-2">Text Signature</label>
//           <input 
//             type="text" 
//             placeholder="Enter your signature"
//             className="w-full p-2 border rounded-lg"
//           />
//         </div>

//         {/* Image Signature */}
//         <div>
//           <label className="block mb-2">Upload Signature Image</label>
//           <input 
//             type="file" 
//             accept="image/*"
//             className="w-full p-2 border rounded-lg"
//           />
//         </div>
//       </div>

//       {/* Signature Placement Instructions */}
//       <div className="mt-4 text-sm text-gray-600">
//         <p>• Click on the document to place your signature</p>
//         <p>• You can move and resize signatures after placement</p>
//       </div>
//     </div>
//   );

//   return (
//     <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-xl">
//       <h2 className="text-2xl font-bold mb-6 text-center">Document E-Signature</h2>

//       {/* File Upload Section */}
//       <div className="mb-6 flex items-center justify-center">
//         <input 
//           type="file" 
//           ref={fileInputRef}
//           onChange={handleFileUpload}
//           accept=".pdf,.doc,.docx"
//           className="hidden"
//         />
//         <button 
//           onClick={() => fileInputRef.current?.click()}
//           className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
//         >
//           <Upload className="mr-2" /> Upload Document
//         </button>
//       </div>

//       {/* Document Preview */}
//       {selectedFile && fileType && (
//         <div className="grid md:grid-cols-2 gap-6">
//           <DocumentPreview file={selectedFile} type={fileType} />
          
//           {renderSignatureSection()}
//         </div>
//       )}

//       {/* Save Button */}
//       {selectedFile && (
//         <div className="text-center mt-6">
//           <button 
//             className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 flex items-center mx-auto"
//           >
//             <Save className="mr-2" /> Save Signed Document
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ESignatureComponent;

































// app/e-signature/e-signature-workflow.tsx
// 'use client';

// import React, { useState } from 'react';
// import { Upload, File, CheckCircle2, XCircle } from 'lucide-react';

// // TypeDefs for better type safety
// type Document = {
//   id: string;
//   title: string;
//   url: string;
//   createdAt: Date;
// };

// type Signature = {
//   id: string;
//   documentId: string;
//   status: 'pending' | 'signed' | 'rejected';
//   signedAt?: Date;
// };

// export default function ESignatureOverview() {
//   // State management for documents and signatures
//   const [documents, setDocuments] = useState<Document[]>([]);
//   const [signatures, setSignatures] = useState<Signature[]>([]);
//   const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

//   // Document Upload Handler
//   const handleDocumentUpload = async (file: File) => {
//     try {
//       // Simulate document upload to backend
//       const newDocument: Document = {
//         id: `doc-${Date.now()}`,
//         title: file.name,
//         url: URL.createObjectURL(file),
//         createdAt: new Date()
//       };
//       setDocuments(prev => [newDocument, ...prev]);
//     } catch (error) {
//       console.error('Document upload failed', error);
//     }
//   };

//   // E-Signature Request Handler
//   const requestSignature = async (document: Document) => {
//     try {
//       const newSignature: Signature = {
//         id: `sig-${Date.now()}`,
//         documentId: document.id,
//         status: 'pending',
//       };
//       setSignatures(prev => [newSignature, ...prev]);
//       setSelectedDocument(document);
//     } catch (error) {
//       console.error('Signature request failed', error);
//     }
//   };

//   // Signature Status Update Handler
//   const updateSignatureStatus = (signatureId: string, status: 'signed' | 'rejected') => {
//     setSignatures(prev => 
//       prev.map(sig => 
//         sig.id === signatureId 
//           ? { ...sig, status, signedAt: status === 'signed' ? new Date() : undefined }
//           : sig
//       )
//     );
//   };

//   return (
//     <div className="mx-auto p-4 space-y-6">
//       <h1 className="text-2xl font-bold">E-Signature Workflow</h1>
      
//       {/* Document Upload Section */}
//       <section className="bg-white shadow-md rounded-lg p-4">
//         <h2 className="text-lg font-semibold mb-4">Upload Document</h2>
//         <div className="flex items-center space-x-4">
//           <input 
//             type="file" 
//             accept=".pdf,.docx" 
//             onChange={(e) => e.target.files && handleDocumentUpload(e.target.files[0])}
//             className="hidden" 
//             id="documentUpload"
//           />
//           <label 
//             htmlFor="documentUpload" 
//             className="flex items-center px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 cursor-pointer"
//           >
//             <Upload className="mr-2" /> Upload Document
//           </label>
//         </div>
//       </section>

//       {/* Document List Section */}
//       <section className="bg-white shadow-md rounded-lg p-4">
//         <h2 className="text-lg font-semibold mb-4">My Documents</h2>
//         {documents.map(doc => (
//           <div 
//             key={doc.id} 
//             className="flex justify-between items-center border-b py-2 hover:bg-gray-50"
//           >
//             <div className="flex items-center space-x-4">
//               <File className="text-blue-500" />
//               <span>{doc.title}</span>
//             </div>
//             <button 
//               onClick={() => requestSignature(doc)}
//               className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
//             >
//               Request Signature
//             </button>
//           </div>
//         ))}
//       </section>

//       {/* Signature Tracking Section */}
//       <section className="bg-white shadow-md rounded-lg p-4">
//         <h2 className="text-lg font-semibold mb-4">Signature Requests</h2>
//         {signatures.map(sig => (
//           <div 
//             key={sig.id} 
//             className="flex justify-between items-center border-b py-2 hover:bg-gray-50"
//           >
//             <div className="flex items-center space-x-4">
//               {sig.status === 'pending' && <CheckCircle2 className="text-yellow-500" />}
//               {sig.status === 'signed' && <CheckCircle2 className="text-green-500" />}
//               {sig.status === 'rejected' && <XCircle className="text-red-500" />}
//               <span>
//                 Document: {documents.find(d => d.id === sig.documentId)?.title}
//               </span>
//             </div>
//             <div className="space-x-2">
//               <button 
//                 onClick={() => updateSignatureStatus(sig.id, 'signed')}
//                 className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
//               >
//                 Sign
//               </button>
//               <button 
//                 onClick={() => updateSignatureStatus(sig.id, 'rejected')}
//                 className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
//               >
//                 Reject
//               </button>
//             </div>
//           </div>
//         ))}
//       </section>
//     </div>
//   );
// }