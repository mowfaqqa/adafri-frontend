'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { InviteTeamService, JoinResponse } from '@/lib/api/messaging/InviteTeamService';
import { Users, Check, X, Mail, Clock, AlertCircle, Loader2, UserCheck, LogIn } from 'lucide-react';

const JoinInvitationPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [joinResponse, setJoinResponse] = useState<JoinResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    // Get token from URL parameters
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
      // Automatically check the invitation when component mounts
      checkInvitation(urlToken);
    } else {
      setError('Invalid invitation link. No token found.');
    }
  }, [searchParams]);

  const checkInvitation = async (inviteToken: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await InviteTeamService.acceptInvitation(inviteToken);
      setJoinResponse(response);
      
      if (response.requiresAuth) {
        // User needs to sign up or log in
        handleAuthRedirect();
      } else {
        // User is authenticated, show accept/decline modal
        setShowModal(true);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to process invitation. Please try again.';
      setError(errorMessage);
      console.error('Error checking invitation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthRedirect = () => {
    if (joinResponse) {
      // Store invitation details and redirect URL for after login
      localStorage.setItem('pendingInvitation', JSON.stringify({
        token,
        email: joinResponse.email,
        message: joinResponse.message,
        redirectUrl: `/dashboard/messaging/join?token=${token}`
      }));
      
      // Redirect to login page
      router.push('/login');
    }
  };

  const handleAcceptInvitation = async () => {
    if (!token) return;

    try {
      setIsAccepting(true);
      setError(null);
      
      const response = await InviteTeamService.acceptInvitation(token);
      
      if (response.workspace) {
        // Successfully joined workspace
        setShowModal(false);
        // Redirect to messaging dashboard
        router.push('/dashboard/messaging');
      } else if (response.requiresAuth) {
        // This shouldn't happen at this point, but handle just in case
        handleAuthRedirect();
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
    // Redirect to dashboard or home page
    router.push('/dashboard');
  };

  const handleRetry = () => {
    if (token) {
      checkInvitation(token);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 size={32} className="text-blue-600 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Invitation</h2>
          <p className="text-gray-600">Please wait while we verify your invitation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !showModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Auth required state (shouldn't show as we redirect immediately)
  if (joinResponse?.requiresAuth && !showModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn size={32} className="text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-2">{joinResponse.message}</p>
          <p className="text-sm text-gray-500 mb-6">Email: {joinResponse.email}</p>
          <button
            onClick={handleAuthRedirect}
            className="w-full py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors duration-200"
          >
            Sign In / Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Accept/Decline Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-6 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Users size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Workspace Invitation</h2>
                  <p className="text-white/80">Join your team's workspace</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Error display in modal */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
                  <AlertCircle size={16} className="text-red-500" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Invitation details */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail size={24} className="text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  You've been invited to join a workspace
                </h3>
                {joinResponse?.email && (
                  <p className="text-gray-600 mb-2">
                    Invitation sent to: <span className="font-medium">{joinResponse.email}</span>
                  </p>
                )}
                <p className="text-gray-600 text-sm">
                  Accept this invitation to start collaborating with your team.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-3">
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
                      <span>Accepting...</span>
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
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <div className="flex items-start space-x-2">
                  <UserCheck size={16} className="text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">What happens when you accept?</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>• You'll gain access to the workspace</li>
                      <li>• You can start collaborating immediately</li>
                      <li>• Your team members will be notified</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinInvitationPage;