'use client';

import React from 'react';
import { CheckCircle, Sparkles, Share2, CalendarDays } from 'lucide-react';

interface SuccessModalData {
  type: 'post' | 'calendar';
  recipientCount: number;
  details: string;
}

interface SuccessModalProps {
  isOpen: boolean;
  data: SuccessModalData | null;
  onClose: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  data,
  onClose
}) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">Success!</h3>
          <div className="flex items-center justify-center space-x-1">
            <Sparkles size={16} className="animate-bounce" />
            <p className="text-green-100">
              {data.type === 'post' ? 'Post' : 'Calendar'} shared successfully
            </p>
            <Sparkles size={16} className="animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 text-center">
          <div className="mb-6">
            <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              {data.type === 'post' ? (
                <Share2 size={32} className="text-green-600" />
              ) : (
                <CalendarDays size={32} className="text-green-600" />
              )}
            </div>
            
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Shared with {data.recipientCount} team member{data.recipientCount > 1 ? 's' : ''}
            </h4>
            
            <p className="text-gray-600 mb-4">
              {data.details}
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {data.recipientCount}
                  </div>
                  <div className="text-gray-500">Recipients</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.type === 'post' ? '1' : 
                     data.details.includes('month') ? 
                     data.details.match(/(\d+) month/)?.[1] || '1' : '1'}
                  </div>
                  <div className="text-gray-500">
                    {data.type === 'post' ? 'Post' : 'Months'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-6">
              <CheckCircle size={16} className="text-green-500" />
              <span>Email notifications sent</span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
          >
            Awesome! Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;