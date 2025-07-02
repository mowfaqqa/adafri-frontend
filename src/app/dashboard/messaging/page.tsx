"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useMessagingIntegration from "@/hooks/useMessagingIntegration";
import Spinner from "@/components/custom-ui/modal/custom-spinner";
import MessagingLayout from "@/components/CollaborativeMessaging/chat/MessagingLayout";
import { InviteTeamService } from "@/lib/api/messaging/InviteTeamService";
import { AcceptInvitationModal } from "@/components/CollaborativeMessaging/workspace/AcceptInvitationModal";

const MessagingPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showAcceptInviteModal, setShowAcceptInviteModal] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  const {
    isMessagingInitializing,
    isMessagingAuthenticated,
    messagingError,
  } = useMessagingIntegration();

  // Check for invite token when component mounts or search params change
  useEffect(() => {
    const token = searchParams?.get('token') || InviteTeamService.extractTokenFromUrl();
    if (token) {
      setInviteToken(token);
      setShowAcceptInviteModal(true);
      
      // Clean up the URL by removing the token parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  const handleAcceptInviteClose = () => {
    setShowAcceptInviteModal(false);
    setInviteToken(null);
  };

  const handleAcceptInviteSuccess = () => {
    // Optionally refresh the page or update the UI after successful acceptance
    console.log('Invitation accepted successfully');
    // You could add logic here to refresh user data, workspace info, etc.
  };

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
  return (
    <>
      <MessagingLayout />
      
      {/* Accept Invitation Modal */}
      {inviteToken && (
        <AcceptInvitationModal
          isOpen={showAcceptInviteModal}
          onClose={handleAcceptInviteClose}
          token={inviteToken}
          onAcceptSuccess={handleAcceptInviteSuccess}
        />
      )}
    </>
  );
};

export default MessagingPage;















































// "use client";
// import React, { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import useMessagingIntegration from "@/hooks/useMessagingIntegration";
// import Spinner from "@/components/custom-ui/modal/custom-spinner";
// import MessagingLayout from "@/components/CollaborativeMessaging/chat/MessagingLayout";

// const MessagingPage: React.FC = () => {
//   const router = useRouter();

//   const {
//     isMessagingInitializing,
//     isMessagingAuthenticated,
//     messagingError,
//   } = useMessagingIntegration();

//   // useEffect(() => {
//   //   if (!isMessagingAuthenticated && !isMessagingInitializing) {
//   //    console.log("Redirecting to login due to not authenticated");
//   //   router.push("/auth/login");
//   //   }
//   // }, [router, isMessagingAuthenticated, isMessagingInitializing]);
//   // console.log(isMessagingAuthenticated, isMessagingInitializing);
//   // Render loading state while initializing
//   if (isMessagingInitializing) {
//     return (
//       <div className="h-screen flex items-center justify-center">
//         <div className="text-center">
//           <Spinner size="lg" />
//           <p className="mt-4 text-gray-600">Initializing messaging...</p>
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
//   return <MessagingLayout />;
// };

// export default MessagingPage;
