import React, { useState, useEffect } from 'react';
import { InviteTeamService, InviteResponse } from '@/lib/api/messaging/InviteTeamService';
import { X, Clock, RefreshCw, Mail } from 'lucide-react';

interface PendingInvitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export const PendingInvitationsModal: React.FC<PendingInvitationsModalProps> = ({ 
  isOpen, 
  onClose,
  workspaceId
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<InviteResponse[]>([]);

  // Fetch pending invitations when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPendingInvites();
    }
  }, [isOpen, workspaceId]);

  const fetchPendingInvites = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const invites = await InviteTeamService.getInvitations(workspaceId);
      setPendingInvites(invites);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to fetch pending invitations';
      setError(errorMessage);
      console.error('Error fetching invites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-orange-500 to-amber-600 p-6 text-white">
          <button 
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/20 rounded-full p-2 hover:bg-white/30 transition-all duration-200"
            onClick={handleClose}
          >
            <X size={20} />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <Clock size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Pending Invitations</h2>
              <p className="text-white/80">Manage sent invitations</p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Error display */}
          {error && (
            <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
              <X size={16} className="text-red-500" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="text-center flex-1">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Clock size={24} className="text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Invitations</h3>
                <p className="text-gray-600">View and manage sent invitations</p>
              </div>
              <button 
                onClick={fetchPendingInvites}
                className="px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium flex items-center space-x-2"
                disabled={isLoading}
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
              </button>
            </div>
            
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw size={32} className="animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-500">Loading invitations...</p>
              </div>
            ) : pendingInvites.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail size={28} className="text-gray-400" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">No pending invitations</h4>
                <p className="text-gray-500 text-sm">All invitations have been accepted or none have been sent yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingInvites.map((invite) => (
                  <div key={invite.id} className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                          <Mail size={16} className="text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{invite.email}</p>
                          <div className="flex items-center space-x-3 text-sm text-gray-500">
                            <span>Type: <span className="font-medium capitalize">{invite.invitationType}</span></span>
                            <span>•</span>
                            <span>Sent: {invite.createdAt ? new Date(invite.createdAt).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        invite.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' 
                          : invite.status === 'accepted'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {invite.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};