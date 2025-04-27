"use client";
import React from 'react';
import { Calendar, CheckCircle, Users, X, User, MessageSquare, Globe, Phone } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface BulkSMSItem {
  id: string;
  title: string;
  sender: string;
  date: string;
  recipients: number;
  sent: number;
  status: 'completed' | 'pending' | 'failed';
  message: string;
  phoneNumbers: string;
  country: string;
}

interface BulkSMSViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sms: BulkSMSItem | null;
}

const BulkSMSViewModal: React.FC<BulkSMSViewModalProps> = ({ isOpen, onClose, sms }) => {
  if (!sms) return null;

  // Function to get status color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  // Format phone numbers for better display
  const formatPhoneNumbers = (phoneNumbers: string) => {
    return phoneNumbers.split(',').map(number => number.trim()).join(', ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0">
        <div className="p-4 h-full overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-lg font-semibold text-gray-800">Bulk SMS Details</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Content - with scroll capability */}
          <div className="flex-1 overflow-y-auto pr-1">
            {/* Title */}
            <div className="mb-4">
              <h3 className="font-bold text-xl text-gray-800">{sms.title}</h3>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{sms.date}</span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 py-3 border-y border-gray-100 mb-4">
              <div className="text-center">
                <div className="text-sm text-gray-500">Recipients</div>
                <div className="flex items-center justify-center mt-1">
                  <Users className="h-4 w-4 mr-1 text-blue-500" />
                  <span className="font-medium">{sms.recipients}</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Sent</div>
                <div className="flex items-center justify-center mt-1">
                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                  <span className="font-medium">{sms.sent}</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Status</div>
                <div className="flex items-center justify-center mt-1">
                  <span className={`font-medium capitalize ${getStatusColor(sms.status)}`}>
                    {sms.status}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Message */}
            <div className="mb-4">
              <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <MessageSquare className="h-4 w-4 mr-1" />
                <span>Message</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-md text-gray-600 text-sm">
                {sms.message}
              </div>
            </div>
            
            {/* Sender & Country */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <User className="h-4 w-4 mr-1" />
                  <span>Sender</span>
                </div>
                <div className="bg-gray-50 p-2 rounded-md text-gray-600 text-sm">
                  {sms.sender}
                </div>
              </div>
              <div>
                <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <Globe className="h-4 w-4 mr-1" />
                  <span>Country</span>
                </div>
                <div className="bg-gray-50 p-2 rounded-md text-gray-600 text-sm">
                  {sms.country}
                </div>
              </div>
            </div>
            
            {/* Phone Numbers */}
            <div className="mb-4">
              <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <Phone className="h-4 w-4 mr-1" />
                <span>Phone Numbers</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-md text-gray-600 text-sm max-h-32 overflow-y-auto">
                {formatPhoneNumbers(sms.phoneNumbers)}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-4 pt-2 border-t border-gray-200 flex justify-end">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkSMSViewModal;