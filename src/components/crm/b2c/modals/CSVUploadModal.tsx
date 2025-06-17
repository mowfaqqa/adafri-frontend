"use client";
import { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, Check, Download, Eye, EyeOff } from 'lucide-react';
import Papa from 'papaparse';



interface CSVUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (contacts: ContactFormData[]) => void;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  status: string;
  customSegment?: string;
}

interface CSVRow {
  [key: string]: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: string;
}

export function CSVUploadModal({ isOpen, onClose, onUpload }: CSVUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<ContactFormData[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusOptions = ['Prospection', 'Active Client', 'Supplier', 'Add Segment'];

  const requiredFields = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'company', label: 'Company' }
  ];

  const optionalFields = [
    { key: 'website', label: 'Website' },
    { key: 'status', label: 'Status/Category' },
    { key: 'customSegment', label: 'Custom Segment' }
  ];

  const validateEmail = (email: string): boolean => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const validateRow = (row: CSVRow, index: number): ValidationError[] => {
    const rowErrors: ValidationError[] = [];

    // Check required fields
    if (!row.name?.trim()) {
      rowErrors.push({
        row: index + 1,
        field: 'name',
        message: 'Name is required',
        value: row.name || ''
      });
    }

    if (!row.email?.trim()) {
      rowErrors.push({
        row: index + 1,
        field: 'email',
        message: 'Email is required',
        value: row.email || ''
      });
    } else if (!validateEmail(row.email.trim())) {
      rowErrors.push({
        row: index + 1,
        field: 'email',
        message: 'Invalid email format',
        value: row.email
      });
    }

    if (!row.phone?.trim()) {
      rowErrors.push({
        row: index + 1,
        field: 'phone',
        message: 'Phone is required',
        value: row.phone || ''
      });
    }

    if (!row.company?.trim()) {
      rowErrors.push({
        row: index + 1,
        field: 'company',
        message: 'Company is required',
        value: row.company || ''
      });
    }

    // Validate status if provided
    if (row.status && !statusOptions.includes(row.status)) {
      rowErrors.push({
        row: index + 1,
        field: 'status',
        message: `Invalid status. Must be one of: ${statusOptions.join(', ')}`,
        value: row.status
      });
    }

    // Check custom segment requirement
    if (row.status === 'Add Segment' && !row.customSegment?.trim()) {
      rowErrors.push({
        row: index + 1,
        field: 'customSegment',
        message: 'Custom segment is required when status is "Add Segment"',
        value: row.customSegment || ''
      });
    }

    return rowErrors;
  };

  const processCSV = (file: File) => {
    setIsProcessing(true);
    setErrors([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        const data = results.data as CSVRow[];
        const processedContacts: ContactFormData[] = [];
        const allErrors: ValidationError[] = [];

        data.forEach((row, index) => {
          // Trim whitespace from all fields
          const cleanRow: CSVRow = {};
          Object.keys(row).forEach(key => {
            cleanRow[key.trim().toLowerCase()] = (row[key] || '').toString().trim();
          });

          // Validate row
          const rowErrors = validateRow(cleanRow, index);
          allErrors.push(...rowErrors);

          // Process valid rows
          if (rowErrors.length === 0) {
            processedContacts.push({
              name: cleanRow.name,
              email: cleanRow.email,
              phone: cleanRow.phone,
              company: cleanRow.company,
              website: cleanRow.website || '',
              status: cleanRow.status || 'Prospection',
              customSegment: cleanRow.customsegment || cleanRow.custom_segment || ''
            });
          }
        });

        setErrors(allErrors);
        setCsvData(processedContacts);
        setIsProcessing(false);
        
        if (allErrors.length === 0 && processedContacts.length > 0) {
          setStep('preview');
        }
      },
      error: (error) => {
        setErrors([{
          row: 0,
          field: 'file',
          message: `Failed to parse CSV: ${error.message}`,
          value: ''
        }]);
        setIsProcessing(false);
      }
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        processCSV(droppedFile);
      } else {
        setErrors([{
          row: 0,
          field: 'file',
          message: 'Please upload a CSV file',
          value: ''
        }]);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      processCSV(selectedFile);
    }
  };

  const handleUploadContacts = () => {
    if (csvData.length > 0) {
      onUpload(csvData);
      setStep('success');
      setTimeout(() => {
        handleReset();
      }, 2000);
    }
  };

  const handleReset = () => {
    setFile(null);
    setCsvData([]);
    setErrors([]);
    setStep('upload');
    setShowPreview(false);
    setIsProcessing(false);
    setDragActive(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const downloadTemplate = () => {
    const template = `name,email,phone,company,website,status,customSegment
John Doe,john@example.com,+1234567890,Acme Corp,https://acme.com,Prospection,
Jane Smith,jane@company.com,+0987654321,Tech Solutions,https://techsol.com,Active Client,`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {step === 'upload' && 'Import Contacts from CSV'}
            {step === 'preview' && `Preview ${csvData.length} Contacts`}
            {step === 'success' && 'Import Successful!'}
          </h2>
          <button
            onClick={handleReset}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Template Download */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-800 mb-1">
                      Need a template?
                    </h3>
                    <p className="text-xs text-blue-600 mb-3">
                      Download our CSV template with the correct format and sample data.
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="inline-flex items-center space-x-2 text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download Template</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* CSV Format Requirements */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-800 mb-3">CSV Format Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Required Fields:</h4>
                    <ul className="space-y-1 text-gray-600">
                      {requiredFields.map(field => (
                        <li key={field.key} className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                          <span>{field.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Optional Fields:</h4>
                    <ul className="space-y-1 text-gray-600">
                      {optionalFields.map(field => (
                        <li key={field.key} className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                          <span>{field.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                  <strong>Status Options:</strong> {statusOptions.join(', ')}
                </div>
              </div>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : errors.some(e => e.field === 'file')
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {isProcessing ? (
                  <div className="space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-600">Processing CSV file...</p>
                  </div>
                ) : file ? (
                  <div className="space-y-3">
                    <FileText className="w-12 h-12 text-green-500 mx-auto" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Drop your CSV file here, or{' '}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-blue-600 hover:text-blue-700 underline"
                        >
                          browse
                        </button>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Supports CSV files up to 10MB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Errors Display */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-red-800 mb-2">
                        Found {errors.length} error{errors.length > 1 ? 's' : ''}
                      </h3>
                      <div className="max-h-40 overflow-y-auto">
                        {errors.slice(0, 10).map((error, index) => (
                          <div key={index} className="text-xs text-red-700 mb-1">
                            Row {error.row}: {error.message}
                            {error.value && (
                              <span className="text-red-600 ml-1">("{error.value}")</span>
                            )}
                          </div>
                        ))}
                        {errors.length > 10 && (
                          <p className="text-xs text-red-600 mt-2">
                            ... and {errors.length - 10} more errors
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-900">
                    Ready to import {csvData.length} contacts
                  </span>
                </div>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
                </button>
              </div>

              {showPreview && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="max-h-80 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Name</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Email</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Phone</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Company</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {csvData.slice(0, 50).map((contact, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-900">{contact.name}</td>
                            <td className="px-3 py-2 text-gray-600">{contact.email}</td>
                            <td className="px-3 py-2 text-gray-600">{contact.phone}</td>
                            <td className="px-3 py-2 text-gray-600">{contact.company}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                contact.status === 'Active Client' ? 'bg-green-100 text-green-700' :
                                contact.status === 'Prospection' ? 'bg-blue-100 text-blue-600' :
                                contact.status === 'Supplier' ? 'bg-purple-100 text-purple-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {contact.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvData.length > 50 && (
                      <div className="p-3 text-center text-xs text-gray-500 border-t">
                        Showing first 50 of {csvData.length} contacts
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setStep('upload')}
                  className="w-full sm:flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Back to Upload
                </button>
                <button
                  onClick={handleUploadContacts}
                  className="w-full sm:flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Import {csvData.length} Contacts
                </button>
              </div>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Successfully Imported!
                </h3>
                <p className="text-sm text-gray-600">
                  {csvData.length} contacts have been added to your contact list
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}