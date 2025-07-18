
"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import useMessagingIntegration from "@/hooks/useMessagingIntegration";
import Spinner from "@/components/custom-ui/modal/custom-spinner";
import MessagingLayout from "@/components/CollaborativeMessaging/chat/MessagingLayout";
import { AuthContext } from "@/lib/context/auth";

const MessagingPage: React.FC = () => {
  const router = useRouter();

  const {
    isMessagingInitializing,
    isMessagingAuthenticated,
    messagingError,
  } = useMessagingIntegration();

  // useEffect(() => {
  //   if (!isMessagingAuthenticated && !isMessagingInitializing) {
  //    console.log("Redirecting to login due to not authenticated");
  //   router.push("/auth/login");
  //   }
  // }, [router, isMessagingAuthenticated, isMessagingInitializing]);
  // console.log(isMessagingAuthenticated, isMessagingInitializing);
  // Render loading state while initializing
  if (isMessagingInitializing) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Initializing messaging...</p>
        </div>
      </div>
    );
  }

  // Render error state if there was an error and not authenticated
  // if (messagingError && !isMessagingAuthenticated) {
  //   return (
  //     <div className="h-screen flex items-center justify-center">
  //       <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
  //         <h2 className="text-xl font-bold text-red-600 mb-4">
  //           Authentication Error
  //         </h2>
  //         <p className="text-gray-700 mb-6">{messagingError}</p>
  //         <button
  //           onClick={() => router.push("/auth/login")}
  //           className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
  //         >
  //           Return to Login
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }


  // Authenticated and initialized, render the messaging layout
  return <MessagingLayout />;
};

export default MessagingPage;


















































// "use client";
// import React, { useEffect, useState, useContext } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import useMessagingIntegration from "@/hooks/useMessagingIntegration";
// import Spinner from "@/components/custom-ui/modal/custom-spinner";
// import MessagingLayout from "@/components/CollaborativeMessaging/chat/MessagingLayout";
// import { InviteTeamService } from "@/lib/api/messaging/InviteTeamService";
// import { AuthContext } from "@/lib/context/auth";
// import { AcceptInvitationModal } from "@/components/CollaborativeMessaging/workspace/AcceptInvitationModal";

// const INVITE_TOKEN_STORAGE_KEY = '__pending_invite_token';

// const MessagingPage: React.FC = () => {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const [showAcceptInviteModal, setShowAcceptInviteModal] = useState(false);
//   const [inviteToken, setInviteToken] = useState<string | null>(null);
//   const { isAuthenticated, isLoading } = useContext(AuthContext);

//   const {
//     isMessagingInitializing,
//     isMessagingAuthenticated,
//     messagingError,
//   } = useMessagingIntegration();

//   // Handle token detection and authentication flow
//   useEffect(() => {
//     const token = searchParams?.get('token') || InviteTeamService.extractTokenFromUrl();
    
//     if (token) {
//       // Store the token for later use
//       localStorage.setItem(INVITE_TOKEN_STORAGE_KEY, token);
      
//       // Clean up the URL by removing the token parameter
//       const url = new URL(window.location.href);
//       url.searchParams.delete('token');
//       window.history.replaceState({}, '', url.toString());
      
//       // Check if user is authenticated
//       if (!isLoading && !isAuthenticated) {
//         // User not authenticated, redirect to login
//         router.push('/auth/login');
//         return;
//       }
      
//       // User is authenticated, show modal
//       if (isAuthenticated) {
//         setInviteToken(token);
//         setShowAcceptInviteModal(true);
//       }
//     }
//   }, [searchParams, isAuthenticated, isLoading, router]);

//   // Check for stored token when user becomes authenticated
//   useEffect(() => {
//     if (isAuthenticated && !isLoading) {
//       const storedToken = localStorage.getItem(INVITE_TOKEN_STORAGE_KEY);
//       if (storedToken && !inviteToken) {
//         setInviteToken(storedToken);
//         setShowAcceptInviteModal(true);
//         // Clear the stored token
//         localStorage.removeItem(INVITE_TOKEN_STORAGE_KEY);
//       }
//     }
//   }, [isAuthenticated, isLoading, inviteToken]);

//   const handleAcceptInviteClose = () => {
//     setShowAcceptInviteModal(false);
//     setInviteToken(null);
//     // Clear any stored token when modal is closed
//     localStorage.removeItem(INVITE_TOKEN_STORAGE_KEY);
//   };

//   const handleAcceptInviteSuccess = () => {
//     // Clear stored token on successful acceptance
//     localStorage.removeItem(INVITE_TOKEN_STORAGE_KEY);
//     console.log('Invitation accepted successfully');
//     // You could add logic here to refresh user data, workspace info, etc.
//   };

//   // Show loading state while checking authentication or initializing messaging
//   if (isLoading || isMessagingInitializing) {
//     return (
//       <div className="h-screen flex items-center justify-center">
//         <div className="text-center">
//           <Spinner size="lg" />
//           <p className="mt-4 text-gray-600">
//             {isLoading ? "Checking authentication..." : "Initializing messaging..."}
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // If not authenticated, the useEffect will handle redirection
//   if (!isAuthenticated) {
//     return (
//       <div className="h-screen flex items-center justify-center">
//         <div className="text-center">
//           <Spinner size="lg" />
//           <p className="mt-4 text-gray-600">Redirecting to login...</p>
//         </div>
//       </div>
//     );
//   }

//   // Render error state if there was an error and not authenticated
//   // if (messagingError && !isMessagingAuthenticated) {
//   //   return (
//   //     <div className="h-screen flex items-center justify-center">
//   //       <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
//   //         <h2 className="text-xl font-bold text-red-600 mb-4">
//   //           Authentication Error
//   //         </h2>
//   //         <p className="text-gray-700 mb-6">{messagingError}</p>
//   //         <button
//   //           onClick={() => router.push("/auth/login")}
//   //           className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
//   //         >
//   //           Return to Login
//   //         </button>
//   //       </div>
//   //     </div>
//   //   );
//   // }

//   // Authenticated and initialized, render the messaging layout
//   return (
//     <>
//       <MessagingLayout />
      
//       {/* Accept Invitation Modal */}
//       {inviteToken && (
//         <AcceptInvitationModal
//           isOpen={showAcceptInviteModal}
//           onClose={handleAcceptInviteClose}
//           token={inviteToken}
//           onAcceptSuccess={handleAcceptInviteSuccess}
//         />
//       )}
//     </>
//   );
// };

// export default MessagingPage;















































