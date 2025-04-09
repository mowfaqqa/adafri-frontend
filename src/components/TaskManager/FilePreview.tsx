import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileAttachment } from '@/lib/types/taskManager/types';

interface FilePreviewProps {
  file: any;
  onClose: () => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ file, onClose }) => {
  const isImage = file?.mimetype.startsWith('image/');
  const isPdf = file?.mimetype === 'application/pdf';
  
  const handleDownload = () => {
    window.open(file.secureUrl, '_blank');
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 flex items-center justify-between border-b">
          <h3 className="font-medium truncate">{file.originalname}</h3>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="p-4 flex-1 overflow-auto">
          {isImage && (
            <div className="flex items-center justify-center min-h-[300px]">
              <img 
                src={file.secureUrl} 
                alt={file.originalname}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          )}
          
          {isPdf && (
            <iframe 
              src={file.secureUrl} 
              className="w-full h-[70vh] border rounded"
              title={file.originalname}
            />
          )}
          
          {/* {isVideo && (
            <div className="flex items-center justify-center">
              <video 
                controls 
                className="max-w-full max-h-[70vh]"
                src={file.secureUrl}
              />
            </div>
          )} */}
          
          {!isImage && !isPdf  && (
            <div className="flex flex-col items-center justify-center gap-4 p-8">
              <p className="text-center">
                Preview not available for this file type. Click download to access the file.
              </p>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};