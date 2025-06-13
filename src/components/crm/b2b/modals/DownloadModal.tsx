"use client";
import React from 'react';
import { CheckCircle, Download, Loader2, AlertCircle } from 'lucide-react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'downloading' | 'success' | 'error';
  message?: string;
  fileName?: string;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  status,
  message,
  fileName
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (status) {
      case 'downloading':
        return <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-12 h-12 text-red-600" />;
      default:
        return <Download className="w-12 h-12 text-gray-600" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'downloading':
        return 'Generating PDF...';
      case 'success':
        return 'Download Complete!';
      case 'error':
        return 'Download Failed';
      default:
        return 'Download';
    }
  };

  const getMessage = () => {
    if (message) return message;
    
    switch (status) {
      case 'downloading':
        return 'Please wait while we generate your PDF document.';
      case 'success':
        return `Your document "${fileName}" has been downloaded successfully.`;
      case 'error':
        return 'There was an error generating your PDF. Please try again.';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {getTitle()}
          </h3>
          
          <p className="text-gray-600 mb-6">
            {getMessage()}
          </p>

          {status !== 'downloading' && (
            <button
              onClick={onClose}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                status === 'success'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : status === 'error'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              {status === 'success' ? 'Great!' : 'Try Again'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};