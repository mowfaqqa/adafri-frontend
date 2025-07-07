import React, { useState } from 'react';
import { InviteTeamService } from '@/lib/api/messaging/InviteTeamService';
import { X, UserPlus, Check, RefreshCw } from 'lucide-react';

interface AcceptInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onAcceptSuccess?: () => void;
}

export const AcceptInvitationModal: React.FC<AcceptInvitationModalProps> = ({ 
  isOpen, 
  onClose,
  token,
  onAcceptSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAcceptInvite = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await InviteTeamService.acceptInvitation(token);
      
      // Call success callback if provided
      if (onAcceptSuccess) {
        onAcceptSuccess();
      }
      
      // Show success message and close modal
      alert('Invitation accepted successfully!');
      onClose();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to accept invitation. Please try again.';
      setError(errorMessage);
      console.error('Error accepting invite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden">
        <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white">
          <button 
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/20 rounded-full p-2 hover:bg-white/30 transition-all duration-200"
            onClick={onClose}
          >
            <X size={18} />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <UserPlus size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Accept Invitation</h2>
              <p className="text-white/80 text-sm">Join the workspace</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
              <X size={16} className="text-red-500" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <p className="mb-6 text-gray-600 leading-relaxed">
            You've been invited to join this workspace. Click the button below to accept the invitation and start collaborating.
          </p>

          <div className="space-y-3">
            <button 
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
              onClick={handleAcceptInvite}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Accepting...</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>Accept Invitation</span>
                </>
              )}
            </button>
            
            <button 
              className="w-full py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};