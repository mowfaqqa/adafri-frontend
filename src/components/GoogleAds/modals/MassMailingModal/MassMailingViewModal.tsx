"use client";
import React from 'react';
import { Calendar, CheckCircle, Users, X, User, Mail, Bookmark, AtSign } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Campaign {
  id: string;
  title: string;
  sender: string;
  date: string;
  recipients: number;
  sent: number;
  status: 'pending' | 'active' | 'done';
  subject: string;
  emailContent: string;
  emailAddresses: string;
  campaign: string;
}

interface MassMailingViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mailing: Campaign | null;
}

const MassMailingViewModal: React.FC<MassMailingViewModalProps> = ({ isOpen, onClose, mailing }) => {
  if (!mailing) return null;

  // Function to get status color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      case 'active':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  // Format email addresses for better display
  const formatEmailAddresses = (emails: string) => {
    return emails.split(',').map(email => email.trim()).join(', ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0">
        <div className="p-4 h-full overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-lg font-semibold text-gray-800">Mass Mailing Details</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Content - with scroll capability */}
          <div className="flex-1 overflow-y-auto pr-1">
            {/* Title */}
            <div className="mb-4">
              <h3 className="font-bold text-xl text-gray-800">{mailing.title}</h3>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{mailing.date}</span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 py-3 border-y border-gray-100 mb-4">
              <div className="text-center">
                <div className="text-sm text-gray-500">Recipients</div>
                <div className="flex items-center justify-center mt-1">
                  <Users className="h-4 w-4 mr-1 text-blue-500" />
                  <span className="font-medium">{mailing.recipients}</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Sent</div>
                <div className="flex items-center justify-center mt-1">
                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                  <span className="font-medium">{mailing.sent}</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Status</div>
                <div className="flex items-center justify-center mt-1">
                  <span className={`font-medium capitalize ${getStatusColor(mailing.status)}`}>
                    {mailing.status}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Subject */}
            <div className="mb-4">
              <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <Mail className="h-4 w-4 mr-1" />
                <span>Subject</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-md text-gray-600 text-sm">
                {mailing.subject}
              </div>
            </div>
            
            {/* Email Content */}
            <div className="mb-4">
              <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <Mail className="h-4 w-4 mr-1" />
                <span>Email Content</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-md text-gray-600 text-sm">
                {mailing.emailContent}
              </div>
            </div>
            
            {/* Sender & Campaign */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <User className="h-4 w-4 mr-1" />
                  <span>Sender</span>
                </div>
                <div className="bg-gray-50 p-2 rounded-md text-gray-600 text-sm">
                  {mailing.sender}
                </div>
              </div>
              <div>
                <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <Bookmark className="h-4 w-4 mr-1" />
                  <span>Campaign</span>
                </div>
                <div className="bg-gray-50 p-2 rounded-md text-gray-600 text-sm">
                  {mailing.campaign}
                </div>
              </div>
            </div>
            
            {/* Email Addresses */}
            <div className="mb-4">
              <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <AtSign className="h-4 w-4 mr-1" />
                <span>Email Addresses</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-md text-gray-600 text-sm max-h-32 overflow-y-auto">
                {formatEmailAddresses(mailing.emailAddresses)}
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

export default MassMailingViewModal;