'use client';

import React, { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { InviteTeamService } from '@/lib/api/messaging/InviteTeamService';
import { AuthContext } from '@/lib/context/auth';
import { Users, Check, X, Mail, Loader2, UserCheck } from 'lucide-react';

interface PendingInvitation {
  token: string;
  email: string;
  message: string;
  redirectUrl: string;
  createdAt?: string; // Changed from timestamp to createdAt
}

const PostLoginInvitationHandler: React.FC = () => {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const [pendingInvitation, setPendingInvitation] = useState<PendingInvitation | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only check for pending invitations when user is authenticated and not loading
    if (authContext?.isAuthenticated && !authContext?.isLoading && authContext?.token) {
      checkPendingInvitation();
    }
  }, [authContext?.isAuthenticated, authContext?.isLoading, authContext?.token]);

  const checkPendingInvitation = () => {
    const stored = localStorage.getItem('pendingInvitation');
    if (stored) {
      try {
        const invitation: PendingInvitation = JSON.parse(stored);
        
        // Check if invitation is not too old (24 hours)
        const isValidTimeStamp = invitation.createdAt && 
          (Date.now() - new Date(invitation.createdAt).getTime()) < 24 * 60 * 60 * 1000;
        
        if (isValidTimeStamp && invitation.token) {
          setPendingInvitation(invitation);
          setShowModal(true);
          // Clear from localStorage since we're handling it now
          localStorage.removeItem('pendingInvitation');
        } else {
          // Clean up old invitation
          localStorage.removeItem('pendingInvitation');
        }
      } catch (error) {
        console.error('Error parsing pending invitation:', error);
        localStorage.removeItem('pendingInvitation');
      }
    }
  };

  const handleAcceptInvitation = async () => {
    if (!pendingInvitation) return;

    try {
      setIsAccepting(true);
      setError(null);
      
      const response = await InviteTeamService.acceptInvitation(pendingInvitation.token);
      
      if (response.workspace) {
        // Successfully joined workspace
        setShowModal(false);
        // Redirect to messaging dashboard
        router.push('/dashboard/messaging');
      } else if (response.requiresAuth) {
        // This shouldn't happen since user just logged in
        setError('Authentication issue. Please try logging in again.');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to accept invitation. Please try again.';
      setError(errorMessage);
      console.error('Error accepting invitation:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDeclineInvitation = () => {
    setShowModal(false);
    setPendingInvitation(null);
    // Redirect to main dashboard
    router.push('/dashboard');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setPendingInvitation(null);
    // Redirect to messaging dashboard without accepting
    router.push('/dashboard/messaging');
  };

  if (!showModal || !pendingInvitation) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Users size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Welcome Back!</h2>
                <p className="text-white/80">Complete your workspace invitation</p>
              </div>
            </div>
            <button
              onClick={handleCloseModal}
              className="text-white/80 hover:text-white bg-white/20 rounded-full p-2 hover:bg-white/30 transition-all duration-200"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Error display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
              <X size={16} className="text-red-500" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Welcome message */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={24} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to join your workspace?
            </h3>
            <p className="text-gray-600 mb-2">
              Invitation for: <span className="font-medium">{pendingInvitation.email}</span>
            </p>
            <p className="text-gray-600 text-sm">
              You're now logged in and can complete your workspace invitation.
            </p>
          </div>

          {/* Invitation message */}
          {pendingInvitation.message && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-2">Invitation Message</h4>
              <p className="text-blue-800 text-sm">{pendingInvitation.message}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex space-x-3 mb-6">
            <button
              onClick={handleDeclineInvitation}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2"
              disabled={isAccepting}
            >
              <X size={18} />
              <span>Decline</span>
            </button>
            <button
              onClick={handleAcceptInvitation}
              disabled={isAccepting}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isAccepting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>Accept & Join</span>
                </>
              )}
            </button>
          </div>

          {/* Additional info */}
          <div className="p-4 bg-green-50 rounded-xl">
            <div className="flex items-start space-x-2">
              <UserCheck size={16} className="text-green-600 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="space-y-1 text-green-700">
                  <li>• You'll be added to the workspace</li>
                  <li>• Access to team conversations and files</li>
                  <li>• Start collaborating immediately</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Skip option */}
          <div className="text-center mt-4">
            <button
              onClick={handleCloseModal}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              I'll do this later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostLoginInvitationHandler;