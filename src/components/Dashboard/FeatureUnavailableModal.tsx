import React from 'react';
import { X, Lock } from 'lucide-react';

interface FeatureUnavailableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeatureUnavailableModal: React.FC<FeatureUnavailableModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 relative">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
        
        {/* Modal content */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <Lock size={32} className="text-gray-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Feature Unavailable</h3>
          
          <p className="text-gray-600 mb-6">
            This feature is currently unavailable. Please upgrade your account to access it.
          </p>
          
          <div className="flex gap-3 w-full">
            <button 
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-lg flex-1 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              className="py-2 px-4 bg-blue-600 text-white rounded-lg flex-1 hover:bg-blue-700"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};