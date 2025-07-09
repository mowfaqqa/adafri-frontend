'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { InviteTeamService, JoinResponse } from '@/lib/api/messaging/InviteTeamService';
import { Users, Check, X, Mail, AlertCircle, Loader2 } from 'lucide-react';

const JoinInvitationPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [token, setToken] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  // Helper function to check if user is authenticated
  const isAuthenticated = (): boolean => {
    try {
      const tokenData = localStorage.getItem("access_token");
      return !!(tokenData && JSON.parse(tokenData).access_token);
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const inviteToken = searchParams.get('token');
    
    if (!inviteToken) {
      setError('Invalid invitation link. No token found.');
      setIsLoading(false);
      return;
    }

    setToken(inviteToken);

    // Check if user is authenticated
    if (!isAuthenticated()) {
      // Redirect to login with original invite URL preserved
      const currentUrl = window.location.href;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    // User is authenticated, show the modal
    setShowModal(true);
    setIsLoading(false);
  }, [searchParams, router]);

  const handleAcceptInvite = async () => {
    if (!token) return;

    try {
      setIsAccepting(true);
      setError(null);

      const response = await InviteTeamService.acceptInvitation(token);
      
      if (response.workspace) {
        // Successfully joined workspace
        router.push('/dashboard/messaging');
      } else if (response.requiresAuth) {
        // Token expired or user not authenticated
        const currentUrl = window.location.href;
        router.push(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`);
      } else {
        setError(response.message || 'Failed to join workspace');
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        // Token expired or user not authenticated
        const currentUrl = window.location.href;
        router.push(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`);
      } else {
        const errorMessage = error?.response?.data?.message || 'Failed to join workspace. Please try again.';
        setError(errorMessage);
      }
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDeclineInvite = () => {
    // Just redirect to dashboard without joining
    router.push('/dashboard');
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
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200"
          >
            Go to Dashboard
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
                <p className="text-gray-600 text-sm">
                  Accept this invitation to start collaborating with your team.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleDeclineInvite}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2"
                  disabled={isAccepting}
                >
                  <X size={18} />
                  <span>Decline</span>
                </button>
                <button
                  onClick={handleAcceptInvite}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinInvitationPage;










































// this afternoon 7/9
// 'use client';

// import React, { useState, useEffect, useContext } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { InviteTeamService, JoinResponse } from '@/lib/api/messaging/InviteTeamService';
// import { AuthContext } from '@/lib/context/auth';
// import { clearAuthCookies } from '@/lib/utils/cookies';
// import { Users, Check, X, Mail, Clock, AlertCircle, Loader2, UserCheck, LogIn } from 'lucide-react';

// const JoinInvitationPage: React.FC = () => {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const authContext = useContext(AuthContext);
  
//   const [inviteToken, setInviteToken] = useState<string | null>(null);
//   const [showModal, setShowModal] = useState(false);
//   const [joinResponse, setJoinResponse] = useState<JoinResponse | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isAccepting, setIsAccepting] = useState(false);

//   // Helper function to get access token from localStorage (matching your axios setup)
//   const getAccessToken = (): string | null => {
//     try {
//       const tokenData = localStorage.getItem("access_token");
//       if (tokenData) {
//         const parsed = JSON.parse(tokenData);
//         return parsed.access_token || null;
//       }
//       return null;
//     } catch (error) {
//       console.error('Error parsing access token from localStorage:', error);
//       return null;
//     }
//   };

//   // Helper function to check if user is authenticated
//   const checkAuthentication = (): boolean => {
//     const accessToken = getAccessToken();
//     return !!(accessToken || authContext?.isAuthenticated);
//   };

//   useEffect(() => {
//     // Get token from URL parameters
//     const urlToken = searchParams.get('token');
//     if (urlToken) {
//       setInviteToken(urlToken);
      
//       // Check if user is authenticated first
//       const userIsAuthenticated = checkAuthentication();
      
//       if (!userIsAuthenticated) {
//         // User is not authenticated, redirect to login with invitation info
//         console.log('User not authenticated, redirecting to login');
//         handleAuthRedirect(urlToken);
//       } else {
//         // User is authenticated, check the invitation
//         console.log('User authenticated, checking invitation');
//         checkInvitation(urlToken);
//       }
//     } else {
//       setError('Invalid invitation link. No token found.');
//     }
//   }, [searchParams, authContext?.isAuthenticated]);

//   const checkInvitation = async (token: string) => {
//     try {
//       setIsLoading(true);
//       setError(null);
      
//       // Log the access token for debugging (remove in production)
//       const accessToken = getAccessToken();
//       console.log('Access token check:', {
//         hasToken: !!accessToken,
//         tokenLength: accessToken?.length || 0,
//         inviteToken: token.substring(0, 10) + '...'
//       });
      
//       const response = await InviteTeamService.acceptInvitation(token);
//       setJoinResponse(response);
      
//       if (response.requiresAuth) {
//         // User needs to sign up or log in
//         console.log('Response requires auth, redirecting');
//         handleAuthRedirect(token);
//       } else {
//         // User is authenticated, show accept/decline modal
//         console.log('Showing accept/decline modal');
//         setShowModal(true);
//       }
//     } catch (error: any) {
//       console.error('Error checking invitation:', error);
      
//       if (error?.response?.status === 401) {
//         // Unauthorized - clear tokens and redirect to login
//         console.log('401 error, clearing tokens and redirecting');
//         localStorage.removeItem("access_token");
//         localStorage.removeItem("messaging_token");
//         clearAuthCookies();
//         handleAuthRedirect(token);
//       } else {
//         const errorMessage = error?.response?.data?.message || 'Failed to process invitation. Please try again.';
//         setError(errorMessage);
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleAuthRedirect = (token: string) => {
//     // Store invitation details for after login
//     localStorage.setItem('pendingInvitation', JSON.stringify({
//       token,
//       redirectUrl: `/dashboard/messaging/join?token=${token}`
//     }));
    
//     // Redirect to login page
//     router.push('/auth/login');
//   };

//   const handleAcceptInvitation = async () => {
//     if (!inviteToken) return;

//     try {
//       setIsAccepting(true);
//       setError(null);
      
//       // Double-check authentication before accepting
//       const accessToken = getAccessToken();
//       if (!accessToken) {
//         console.log('No access token found, redirecting to login');
//         handleAuthRedirect(inviteToken);
//         return;
//       }
      
//       console.log('Accepting invitation with token:', inviteToken.substring(0, 10) + '...');
//       const response = await InviteTeamService.acceptInvitation(inviteToken);
      
//       if (response.workspace) {
//         // Successfully joined workspace
//         console.log('Successfully joined workspace');
//         setShowModal(false);
//         // Clear pending invitation
//         localStorage.removeItem('pendingInvitation');
//         // Redirect to messaging dashboard
//         router.push('/dashboard/messaging');
//       } else if (response.requiresAuth) {
//         // This shouldn't happen at this point, but handle just in case
//         console.log('Accept response requires auth, redirecting');
//         handleAuthRedirect(inviteToken);
//       }
//     } catch (error: any) {
//       console.error('Error accepting invitation:', error);
      
//       if (error?.response?.status === 401) {
//         // Unauthorized - clear tokens and redirect to login
//         console.log('401 error during accept, clearing tokens and redirecting');
//         localStorage.removeItem("access_token");
//         localStorage.removeItem("messaging_token");
//         clearAuthCookies();
//         handleAuthRedirect(inviteToken);
//       } else {
//         const errorMessage = error?.response?.data?.message || 'Failed to accept invitation. Please try again.';
//         setError(errorMessage);
//       }
//     } finally {
//       setIsAccepting(false);
//     }
//   };

//   const handleDeclineInvitation = () => {
//     console.log('Declining invitation');
//     setShowModal(false);
//     // Clear pending invitation
//     localStorage.removeItem('pendingInvitation');
//     // Redirect to dashboard or home page
//     router.push('/dashboard');
//   };

//   const handleRetry = () => {
//     if (inviteToken) {
//       console.log('Retrying invitation check');
//       checkInvitation(inviteToken);
//     }
//   };

//   const handleLoginRedirect = () => {
//     if (inviteToken) {
//       handleAuthRedirect(inviteToken);
//     } else {
//       router.push('/auth/login');
//     }
//   };

//   // Loading state
//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
//         <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
//           <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <Loader2 size={32} className="text-blue-600 animate-spin" />
//           </div>
//           <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Invitation</h2>
//           <p className="text-gray-600">Please wait while we verify your invitation...</p>
//         </div>
//       </div>
//     );
//   }

//   // Error state
//   if (error && !showModal) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
//         <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
//           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <AlertCircle size={32} className="text-red-600" />
//           </div>
//           <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Error</h2>
//           <p className="text-gray-600 mb-6">{error}</p>
//           <div className="space-y-3">
//             <button
//               onClick={handleRetry}
//               className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200"
//             >
//               Try Again
//             </button>
//             <button
//               onClick={handleLoginRedirect}
//               className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200"
//             >
//               Go to Login
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Auth required state (shouldn't show as we redirect immediately)
//   if (joinResponse?.requiresAuth && !showModal) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 flex items-center justify-center p-4">
//         <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
//           <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <LogIn size={32} className="text-amber-600" />
//           </div>
//           <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
//           <p className="text-gray-600 mb-2">{joinResponse.message}</p>
//           {joinResponse.email && (
//             <p className="text-sm text-gray-500 mb-6">Email: {joinResponse.email}</p>
//           )}
//           <button
//             onClick={() => handleAuthRedirect(inviteToken!)}
//             className="w-full py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors duration-200"
//           >
//             Sign In / Sign Up
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
//       {/* Accept/Decline Modal */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
//             {/* Header */}
//             <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-6 text-white">
//               <div className="flex items-center space-x-3">
//                 <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
//                   <Users size={24} />
//                 </div>
//                 <div>
//                   <h2 className="text-xl font-bold">Workspace Invitation</h2>
//                   <p className="text-white/80">Join your team's workspace</p>
//                 </div>
//               </div>
//             </div>

//             <div className="p-6">
//               {/* Error display in modal */}
//               {error && (
//                 <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
//                   <AlertCircle size={16} className="text-red-500" />
//                   <span className="text-sm">{error}</span>
//                 </div>
//               )}

//               {/* Invitation details */}
//               <div className="text-center mb-6">
//                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <Mail size={24} className="text-green-600" />
//                 </div>
//                 <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                   You've been invited to join a workspace
//                 </h3>
//                 {joinResponse?.email && (
//                   <p className="text-gray-600 mb-2">
//                     Invitation sent to: <span className="font-medium">{joinResponse.email}</span>
//                   </p>
//                 )}
//                 {joinResponse?.message && (
//                   <p className="text-gray-600 mb-2 italic">
//                     "{joinResponse.message}"
//                   </p>
//                 )}
//                 <p className="text-gray-600 text-sm">
//                   Accept this invitation to start collaborating with your team.
//                 </p>
//               </div>

//               {/* Action buttons */}
//               <div className="flex space-x-3">
//                 <button
//                   onClick={handleDeclineInvitation}
//                   className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2"
//                   disabled={isAccepting}
//                 >
//                   <X size={18} />
//                   <span>Decline</span>
//                 </button>
//                 <button
//                   onClick={handleAcceptInvitation}
//                   disabled={isAccepting}
//                   className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
//                 >
//                   {isAccepting ? (
//                     <>
//                       <Loader2 size={18} className="animate-spin" />
//                       <span>Accepting...</span>
//                     </>
//                   ) : (
//                     <>
//                       <Check size={18} />
//                       <span>Accept & Join</span>
//                     </>
//                   )}
//                 </button>
//               </div>

//               {/* Additional info */}
//               <div className="mt-6 p-4 bg-blue-50 rounded-xl">
//                 <div className="flex items-start space-x-2">
//                   <UserCheck size={16} className="text-blue-600 mt-0.5" />
//                   <div className="text-sm text-blue-800">
//                     <p className="font-medium mb-1">What happens when you accept?</p>
//                     <ul className="space-y-1 text-blue-700">
//                       <li>• You'll gain access to the workspace</li>
//                       <li>• You can start collaborating immediately</li>
//                       <li>• Your team members will be notified</li>
//                     </ul>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default JoinInvitationPage;














































































// 'use client';

// import React, { useState, useEffect, useContext } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { InviteTeamService, JoinResponse } from '@/lib/api/messaging/InviteTeamService';
// import { AuthContext } from '@/lib/context/auth';
// import { Users, Check, X, Mail, Clock, AlertCircle, Loader2, UserCheck, LogIn } from 'lucide-react';

// const JoinInvitationPage: React.FC = () => {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const authContext = useContext(AuthContext);
//   const [token, setToken] = useState<string | null>(null);
//   const [showModal, setShowModal] = useState(false);
//   const [joinResponse, setJoinResponse] = useState<JoinResponse | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isAccepting, setIsAccepting] = useState(false);
//   const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

//   // Check authentication status
//   useEffect(() => {
//     const checkAuth = (): boolean => {
//       // Check if user is authenticated via AuthContext
//       const contextAuth = Boolean(authContext?.isAuthenticated && !authContext?.isLoading && authContext?.token);
      
//       // Also check localStorage for access_token as fallback
//       const accessToken = localStorage.getItem('access_token');
      
//       const authenticated = contextAuth || Boolean(accessToken);
//       setIsAuthenticated(authenticated);
      
//       return authenticated;
//     };

//     checkAuth();
//   }, [authContext?.isAuthenticated, authContext?.isLoading, authContext?.token]);

//   useEffect(() => {
//     // Get token from URL parameters
//     const urlToken = searchParams.get('token');
//     if (urlToken) {
//       setToken(urlToken);
//       // Wait for auth check before processing invitation
//       if (isAuthenticated !== undefined) {
//         checkInvitation(urlToken);
//       }
//     } else {
//       setError('Invalid invitation link. No token found.');
//     }
//   }, [searchParams, isAuthenticated]);

//   const checkInvitation = async (inviteToken: string) => {
//     try {
//       setIsLoading(true);
//       setError(null);
      
//       // Check authentication first before making any API calls
//       const accessToken = localStorage.getItem('access_token');
//       const contextAuth = Boolean(authContext?.isAuthenticated && !authContext?.isLoading && authContext?.token);
//       const authenticated = contextAuth || Boolean(accessToken);
      
//       if (!authenticated) {
//         console.log('User not authenticated, redirecting to auth flow');
//         handleAuthRedirect(inviteToken);
//         return;
//       }
      
//       console.log('User authenticated, checking invitation');
//       const response = await InviteTeamService.acceptInvitation(inviteToken);
//       setJoinResponse(response);
      
//       if (response.requiresAuth) {
//         // User needs to sign up or log in
//         console.log('API requires auth, redirecting');
//         handleAuthRedirect(inviteToken);
//       } else if (response.workspace) {
//         // User is already a member or invitation was auto-accepted
//         console.log('Successfully joined workspace, redirecting');
//         router.push('/dashboard/messaging');
//       } else {
//         // User is authenticated, show accept/decline modal
//         console.log('Showing accept/decline modal');
//         setShowModal(true);
//       }
//     } catch (error: any) {
//       const errorMessage = error?.response?.data?.message || 'Failed to process invitation. Please try again.';
//       setError(errorMessage);
//       console.error('Error checking invitation:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleAuthRedirect = (inviteToken?: string) => {
//     const tokenToUse = inviteToken || token;
//     if (tokenToUse) {
//       // Store invitation details for after login
//       const pendingInvitation = {
//         token: tokenToUse,
//         email: joinResponse?.email || '',
//         message: joinResponse?.message || '',
//         redirectUrl: `/dashboard/messaging/join?token=${tokenToUse}`,
//         createdAt: new Date().toISOString()
//       };
      
//       localStorage.setItem('pendingInvitation', JSON.stringify(pendingInvitation));
      
//       // Redirect to login page
//       router.push('/auth/login');
//     }
//   };

//   const handleAcceptInvitation = async () => {
//     if (!token || !isAuthenticated) return;

//     try {
//       setIsAccepting(true);
//       setError(null);
      
//       const response = await InviteTeamService.acceptInvitation(token);
      
//       if (response.workspace) {
//         // Successfully joined workspace
//         setShowModal(false);
//         // Redirect to messaging dashboard
//         router.push('/dashboard/messaging');
//       } else if (response.requiresAuth) {
//         // Auth expired during the process
//         handleAuthRedirect();
//       }
//     } catch (error: any) {
//       const errorMessage = error?.response?.data?.message || 'Failed to accept invitation. Please try again.';
//       setError(errorMessage);
//       console.error('Error accepting invitation:', error);
//     } finally {
//       setIsAccepting(false);
//     }
//   };

//   const handleDeclineInvitation = () => {
//     setShowModal(false);
//     // Redirect to dashboard or home page
//     router.push('/dashboard');
//   };

//   const handleRetry = () => {
//     if (token) {
//       // Re-check authentication before retrying
//       const accessToken = localStorage.getItem('access_token');
//       const contextAuth = Boolean(authContext?.isAuthenticated && !authContext?.isLoading && authContext?.token);
//       setIsAuthenticated(contextAuth || Boolean(accessToken));
      
//       checkInvitation(token);
//     }
//   };

//   // Loading state
//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
//         <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
//           <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <Loader2 size={32} className="text-blue-600 animate-spin" />
//           </div>
//           <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Invitation</h2>
//           <p className="text-gray-600">Please wait while we verify your invitation...</p>
//         </div>
//       </div>
//     );
//   }

//   // Error state
//   if (error && !showModal) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
//         <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
//           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <AlertCircle size={32} className="text-red-600" />
//           </div>
//           <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Error</h2>
//           <p className="text-gray-600 mb-6">{error}</p>
//           <div className="space-y-3">
//             <button
//               onClick={handleRetry}
//               className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200"
//             >
//               Try Again
//             </button>
//             <button
//               onClick={() => router.push('/dashboard')}
//               className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200"
//             >
//               Go to Dashboard
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Auth required state
//   if (joinResponse?.requiresAuth && !showModal && !isAuthenticated) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 flex items-center justify-center p-4">
//         <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
//           <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <LogIn size={32} className="text-amber-600" />
//           </div>
//           <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
//           <p className="text-gray-600 mb-2">{joinResponse.message}</p>
//           {joinResponse.email && (
//             <p className="text-sm text-gray-500 mb-6">Email: {joinResponse.email}</p>
//           )}
//           <button
//             onClick={() => handleAuthRedirect()}
//             className="w-full py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors duration-200"
//           >
//             Sign In / Sign Up
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // If not authenticated and no specific auth required state, redirect to auth
//   if (!isAuthenticated && token && !isLoading) {
//     handleAuthRedirect();
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
//         <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
//           <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <Loader2 size={32} className="text-blue-600 animate-spin" />
//           </div>
//           <h2 className="text-xl font-semibold text-gray-900 mb-2">Redirecting to Login</h2>
//           <p className="text-gray-600">Please wait while we redirect you to sign in...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
//       {/* Accept/Decline Modal */}
//       {showModal && isAuthenticated && (
//         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
//             {/* Header */}
//             <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-6 text-white">
//               <div className="flex items-center space-x-3">
//                 <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
//                   <Users size={24} />
//                 </div>
//                 <div>
//                   <h2 className="text-xl font-bold">Workspace Invitation</h2>
//                   <p className="text-white/80">Join your team's workspace</p>
//                 </div>
//               </div>
//             </div>

//             <div className="p-6">
//               {/* Error display in modal */}
//               {error && (
//                 <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
//                   <AlertCircle size={16} className="text-red-500" />
//                   <span className="text-sm">{error}</span>
//                 </div>
//               )}

//               {/* Invitation details */}
//               <div className="text-center mb-6">
//                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <Mail size={24} className="text-green-600" />
//                 </div>
//                 <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                   You've been invited to join a workspace
//                 </h3>
//                 {joinResponse?.email && (
//                   <p className="text-gray-600 mb-2">
//                     Invitation sent to: <span className="font-medium">{joinResponse.email}</span>
//                   </p>
//                 )}
//                 <p className="text-gray-600 text-sm">
//                   Accept this invitation to start collaborating with your team.
//                 </p>
//               </div>

//               {/* Invitation message */}
//               {joinResponse?.message && (
//                 <div className="bg-blue-50 rounded-xl p-4 mb-6">
//                   <h4 className="font-medium text-blue-900 mb-2">Invitation Message</h4>
//                   <p className="text-blue-800 text-sm">{joinResponse.message}</p>
//                 </div>
//               )}

//               {/* Action buttons */}
//               <div className="flex space-x-3">
//                 <button
//                   onClick={handleDeclineInvitation}
//                   className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2"
//                   disabled={isAccepting}
//                 >
//                   <X size={18} />
//                   <span>Decline</span>
//                 </button>
//                 <button
//                   onClick={handleAcceptInvitation}
//                   disabled={isAccepting}
//                   className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
//                 >
//                   {isAccepting ? (
//                     <>
//                       <Loader2 size={18} className="animate-spin" />
//                       <span>Accepting...</span>
//                     </>
//                   ) : (
//                     <>
//                       <Check size={18} />
//                       <span>Accept & Join</span>
//                     </>
//                   )}
//                 </button>
//               </div>

//               {/* Additional info */}
//               <div className="mt-6 p-4 bg-blue-50 rounded-xl">
//                 <div className="flex items-start space-x-2">
//                   <UserCheck size={16} className="text-blue-600 mt-0.5" />
//                   <div className="text-sm text-blue-800">
//                     <p className="font-medium mb-1">What happens when you accept?</p>
//                     <ul className="space-y-1 text-blue-700">
//                       <li>• You'll gain access to the workspace</li>
//                       <li>• You can start collaborating immediately</li>
//                       <li>• Your team members will be notified</li>
//                     </ul>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default JoinInvitationPage;





















































// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { InviteTeamService, JoinResponse } from '@/lib/api/messaging/InviteTeamService';
// import { Users, Check, X, Mail, Clock, AlertCircle, Loader2, UserCheck, LogIn } from 'lucide-react';

// const JoinInvitationPage: React.FC = () => {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const [token, setToken] = useState<string | null>(null);
//   const [showModal, setShowModal] = useState(false);
//   const [joinResponse, setJoinResponse] = useState<JoinResponse | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isAccepting, setIsAccepting] = useState(false);

//   useEffect(() => {
//     // Get token from URL parameters
//     const urlToken = searchParams.get('token');
//     if (urlToken) {
//       setToken(urlToken);
//       // Automatically check the invitation when component mounts
//       checkInvitation(urlToken);
//     } else {
//       setError('Invalid invitation link. No token found.');
//     }
//   }, [searchParams]);

//   const checkInvitation = async (inviteToken: string) => {
//     try {
//       setIsLoading(true);
//       setError(null);
      
//       const response = await InviteTeamService.acceptInvitation(inviteToken);
//       setJoinResponse(response);
      
//       if (response.requiresAuth) {
//         // User needs to sign up or log in
//         handleAuthRedirect();
//       } else {
//         // User is authenticated, show accept/decline modal
//         setShowModal(true);
//       }
//     } catch (error: any) {
//       const errorMessage = error?.response?.data?.message || 'Failed to process invitation. Please try again.';
//       setError(errorMessage);
//       console.error('Error checking invitation:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleAuthRedirect = () => {
//     if (joinResponse) {
//       // Store invitation details and redirect URL for after login
//       localStorage.setItem('pendingInvitation', JSON.stringify({
//         token,
//         email: joinResponse.email,
//         message: joinResponse.message,
//         redirectUrl: `/dashboard/messaging/join?token=${token}`
//       }));
      
//       // Redirect to login page
//       router.push('/login');
//     }
//   };

//   const handleAcceptInvitation = async () => {
//     if (!token) return;

//     try {
//       setIsAccepting(true);
//       setError(null);
      
//       const response = await InviteTeamService.acceptInvitation(token);
      
//       if (response.workspace) {
//         // Successfully joined workspace
//         setShowModal(false);
//         // Redirect to messaging dashboard
//         router.push('/dashboard/messaging');
//       } else if (response.requiresAuth) {
//         // This shouldn't happen at this point, but handle just in case
//         handleAuthRedirect();
//       }
//     } catch (error: any) {
//       const errorMessage = error?.response?.data?.message || 'Failed to accept invitation. Please try again.';
//       setError(errorMessage);
//       console.error('Error accepting invitation:', error);
//     } finally {
//       setIsAccepting(false);
//     }
//   };

//   const handleDeclineInvitation = () => {
//     setShowModal(false);
//     // Redirect to dashboard or home page
//     router.push('/dashboard');
//   };

//   const handleRetry = () => {
//     if (token) {
//       checkInvitation(token);
//     }
//   };

//   // Loading state
//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
//         <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
//           <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <Loader2 size={32} className="text-blue-600 animate-spin" />
//           </div>
//           <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Invitation</h2>
//           <p className="text-gray-600">Please wait while we verify your invitation...</p>
//         </div>
//       </div>
//     );
//   }

//   // Error state
//   if (error && !showModal) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
//         <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
//           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <AlertCircle size={32} className="text-red-600" />
//           </div>
//           <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Error</h2>
//           <p className="text-gray-600 mb-6">{error}</p>
//           <div className="space-y-3">
//             <button
//               onClick={handleRetry}
//               className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200"
//             >
//               Try Again
//             </button>
//             <button
//               onClick={() => router.push('/auth/login')}
//               className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200"
//             >
//               Go to Signup
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Auth required state (shouldn't show as we redirect immediately)
//   if (joinResponse?.requiresAuth && !showModal) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 flex items-center justify-center p-4">
//         <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
//           <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <LogIn size={32} className="text-amber-600" />
//           </div>
//           <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
//           <p className="text-gray-600 mb-2">{joinResponse.message}</p>
//           <p className="text-sm text-gray-500 mb-6">Email: {joinResponse.email}</p>
//           <button
//             onClick={handleAuthRedirect}
//             className="w-full py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors duration-200"
//           >
//             Sign In / Sign Up
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
//       {/* Accept/Decline Modal */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
//             {/* Header */}
//             <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-6 text-white">
//               <div className="flex items-center space-x-3">
//                 <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
//                   <Users size={24} />
//                 </div>
//                 <div>
//                   <h2 className="text-xl font-bold">Workspace Invitation</h2>
//                   <p className="text-white/80">Join your team's workspace</p>
//                 </div>
//               </div>
//             </div>

//             <div className="p-6">
//               {/* Error display in modal */}
//               {error && (
//                 <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
//                   <AlertCircle size={16} className="text-red-500" />
//                   <span className="text-sm">{error}</span>
//                 </div>
//               )}

//               {/* Invitation details */}
//               <div className="text-center mb-6">
//                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <Mail size={24} className="text-green-600" />
//                 </div>
//                 <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                   You've been invited to join a workspace
//                 </h3>
//                 {joinResponse?.email && (
//                   <p className="text-gray-600 mb-2">
//                     Invitation sent to: <span className="font-medium">{joinResponse.email}</span>
//                   </p>
//                 )}
//                 <p className="text-gray-600 text-sm">
//                   Accept this invitation to start collaborating with your team.
//                 </p>
//               </div>

//               {/* Action buttons */}
//               <div className="flex space-x-3">
//                 <button
//                   onClick={handleDeclineInvitation}
//                   className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2"
//                   disabled={isAccepting}
//                 >
//                   <X size={18} />
//                   <span>Decline</span>
//                 </button>
//                 <button
//                   onClick={handleAcceptInvitation}
//                   disabled={isAccepting}
//                   className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
//                 >
//                   {isAccepting ? (
//                     <>
//                       <Loader2 size={18} className="animate-spin" />
//                       <span>Accepting...</span>
//                     </>
//                   ) : (
//                     <>
//                       <Check size={18} />
//                       <span>Accept & Join</span>
//                     </>
//                   )}
//                 </button>
//               </div>

//               {/* Additional info */}
//               <div className="mt-6 p-4 bg-blue-50 rounded-xl">
//                 <div className="flex items-start space-x-2">
//                   <UserCheck size={16} className="text-blue-600 mt-0.5" />
//                   <div className="text-sm text-blue-800">
//                     <p className="font-medium mb-1">What happens when you accept?</p>
//                     <ul className="space-y-1 text-blue-700">
//                       <li>• You'll gain access to the workspace</li>
//                       <li>• You can start collaborating immediately</li>
//                       <li>• Your team members will be notified</li>
//                     </ul>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default JoinInvitationPage;