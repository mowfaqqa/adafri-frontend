"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil } from "lucide-react";
import { useEmailStore } from "@/lib/store/email-store";
import { EmailCategory } from "@/lib/types/email";
import { EmailColumns2 } from "@/components/email/EmailColumns2";
import { EmailSent } from "@/components/email/EmailSent";
import { LinkEmailModal } from "@/components/email/LinkEmailModal";
import { ComposeModal } from "@/components/email/ComposeModal";
import { EmailDraft } from "@/components/email/EmailDraft";
import { EmailSpam } from "@/components/email/EmailSpam";
import ProfessionalEmailInbox from "@/components/email/ProfessionalEmailInbox";
import { useCombinedAuth } from "@/components/providers/useCombinedAuth";

export default function EmailDashboard() {
  // Get combined authentication state at the page level
  const { isFullyAuthenticated, isLoading: authLoading, hasError, adafri, djombi } = useCombinedAuth();
  
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const {
    activeCategory,
    setActiveCategory,
    fetchEmails,
    isLoading,
    loadingError,
    draftEmail,
    updateDraft
  } = useEmailStore();

  // Check if email is linked
  const [isEmailLinked, setIsEmailLinked] = useState(false);

  useEffect(() => {
    // Only run email-related logic if user is fully authenticated
    if (!isFullyAuthenticated) return;

    // Check localStorage on component mount
    const checkEmailLink = () => {
      const accessToken = localStorage.getItem('accessToken');
      const linkedEmailId = localStorage.getItem('linkedEmailId');
      setIsEmailLinked(!!accessToken && !!linkedEmailId);
    };

    checkEmailLink();

    // Also fetch initial emails for the active category
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('accessToken');
      const linkedEmailId = localStorage.getItem('linkedEmailId');

      if (accessToken && linkedEmailId) {
        fetchEmails(activeCategory);
      }
    }

    // Listen for storage changes (in case user links email in another tab)
    window.addEventListener('storage', checkEmailLink);

    return () => {
      window.removeEventListener('storage', checkEmailLink);
    };
  }, [activeCategory, fetchEmails, isFullyAuthenticated]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    const category = value as EmailCategory;
    setActiveCategory(category);
  };

  // Handler for editing a draft
  const handleEditDraft = (draft: any) => {
    updateDraft(draft);
    setIsComposeOpen(true);
  };

  // Show loading state during authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your account...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">Authentication Error</div>
          <p className="text-gray-600 mb-4">{djombi.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show login prompt if not fully authenticated
  if (!isFullyAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-4">
            {adafri.isAuthenticated 
              ? 'Setting up your Djombi profile...' 
              : 'Please log in to access your email dashboard'
            }
          </p>
          {!adafri.isAuthenticated && (
            <button
              onClick={adafri.login}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
              Login
            </button>
          )}
        </div>
      </div>
    );
  }

  // Component to render for the selected category
  const renderEmailComponent = () => {
    // Show loading state
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2" />
          <span>Loading emails...</span>
        </div>
      );
    }

    // Show error state
    if (loadingError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 p-4">
          <p className="text-red-500 mb-4">{loadingError}</p>
          <Button onClick={() => fetchEmails(activeCategory)}>Try Again</Button>
        </div>
      );
    }

    // Render the appropriate component based on category
    switch (activeCategory) {
      case "sent":
        return <EmailSent />;
      case "draft":
        return <EmailDraft />;
      case "spam":
        return <EmailSpam />;
      case "agenda":
        // return <EmailAgenda />;
        return <div>Agenda component coming soon...</div>;
      case "inbox":
      default:
        return <ProfessionalEmailInbox />;
    }
  };

  // At this point, user is fully authenticated, render the email dashboard
  return (
    <div className="min-h-screen">

      <main className="p-6">
        <Tabs
          value={activeCategory}
          onValueChange={handleTabChange}
        >
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="inbox" className="">Inbox</TabsTrigger>
              <TabsTrigger value="sent" className="">Sent</TabsTrigger>
              <TabsTrigger value="draft" className="">Draft</TabsTrigger>
              <TabsTrigger value="spam" className="">Spam</TabsTrigger>
              <TabsTrigger value="agenda" className="">Agenda</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-3">
              <LinkEmailModal />
              <Input placeholder="Search mail..." className="max-w-sm " />
            </div>
          </div>

          {/* Render the appropriate component based on active category */}
          <TabsContent value={activeCategory}>
            {renderEmailComponent()}
          </TabsContent>
        </Tabs>

        <Button
          className="fixed bottom-8 md:right-[90px] shadow-lg"
          onClick={() => setIsComposeOpen(true)}
        >
          <Pencil className="w-4 h-4 mr-2" />
          Compose
        </Button>
      </main>

      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
      />
    </div>
  );
}












































// "use client";
// import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Pencil } from "lucide-react";
// import { useEmailStore } from "@/lib/store/email-store";
// import { EmailCategory } from "@/lib/types/email";
// // import { EmailAgenda } from "@/components/EmailAgenda";
// import { EmailColumns2 } from "@/components/email/EmailColumns2";
// import { EmailSent } from "@/components/email/EmailSent";
// import { LinkEmailModal } from "@/components/email/LinkEmailModal";
// import { ComposeModal } from "@/components/email/ComposeModal";
// import { EmailDraft } from "@/components/email/EmailDraft";
// import { EmailSpam } from "@/components/email/EmailSpam";
// import ProfessionalEmailInbox from "@/components/email/ProfessionalEmailInbox";
// import { DjombiProfileService, DjombiServiceResult } from "@/lib/services/DjombiProfileService";
// import { useAuth } from "@/hooks/useAuth";
// import { AuthContext } from "@/lib/context/auth";
// // import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// export default function EmailDashboard() {
//   const [isComposeOpen, setIsComposeOpen] = useState(false);
//   const [djombiTokens, setDjombiTokens] = useState<{
//     accessTokenAdafri: string;
//     accessTokenDjombi: string;
//   } | null>(null);
//   const [djombiProfile, setDjombiProfile] = useState<any>(null);
//   const [isDjombiLoading, setIsDjombiLoading] = useState(false);
//   const [djombiError, setDjombiError] = useState<string | null>(null);

//   const {
//     activeCategory,
//     setActiveCategory,
//     fetchEmails,
//     isLoading,
//     loadingError,
//     draftEmail,
//     updateDraft
//   } = useEmailStore();

//   const { token: accessTokenAdafri, isAuthenticated } = useAuth();

//   // Check if email is linked
//   const [isEmailLinked, setIsEmailLinked] = useState(false);

//   // Initialize Djombi integration
//   const initializeDjombi = async () => {
//     if (!isAuthenticated || !accessTokenAdafri) {
//       setDjombiError("Authentication required");
//       return;
//     }

//     setIsDjombiLoading(true);
//     setDjombiError(null);

//     try {
//       const result: DjombiServiceResult = await DjombiProfileService.getDjombiProfile(accessTokenAdafri);

//       if (result.success && result.tokens) {
//         setDjombiTokens(result.tokens);
//         setDjombiProfile(result.profile);
        
//         // Store tokens in localStorage for persistence (optional)
//         localStorage.setItem('djombiTokenAdafri', result.tokens.accessTokenAdafri);
//         localStorage.setItem('djombiTokenDjombi', result.tokens.accessTokenDjombi);
        
//         console.log('Djombi integration successful:', {
//           adafriToken: result.tokens.accessTokenAdafri,
//           djombiToken: result.tokens.accessTokenDjombi
//         });
//       } else {
//         setDjombiError(result.error || "Failed to initialize Djombi");
//       }
//     } catch (error) {
//       console.error('Djombi initialization error:', error);
//       setDjombiError("An unexpected error occurred");
//     } finally {
//       setIsDjombiLoading(false);
//     }
//   };

//   useEffect(() => {
//     // Check localStorage on component mount
//     const checkEmailLink = () => {
//       const accessToken = localStorage.getItem('accessToken');
//       const linkedEmailId = localStorage.getItem('linkedEmailId');
//       setIsEmailLinked(!!accessToken && !!linkedEmailId);
//     };

//     checkEmailLink();

//     // Initialize Djombi when component mounts and user is authenticated
//     if (isAuthenticated && accessTokenAdafri) {
//       initializeDjombi();
//     }

//     // Also fetch initial emails for the active category
//     if (typeof window !== 'undefined') {
//       const accessToken = localStorage.getItem('accessToken');
//       const linkedEmailId = localStorage.getItem('linkedEmailId');

//       if (accessToken && linkedEmailId) {
//         fetchEmails(activeCategory);
//       }
//     }

//     // Listen for storage changes (in case user links email in another tab)
//     window.addEventListener('storage', checkEmailLink);

//     return () => {
//       window.removeEventListener('storage', checkEmailLink);
//     };
//   }, [activeCategory, fetchEmails, isAuthenticated, accessTokenAdafri]);

//   // Handle tab change
//   const handleTabChange = (value: string) => {
//     const category = value as EmailCategory;
//     setActiveCategory(category);
//   };

//   // Handler for editing a draft
//   const handleEditDraft = (draft: any) => {
//     updateDraft(draft);
//     setIsComposeOpen(true);
//   };

//   // Handler to retry Djombi initialization
//   const handleRetryDjombi = () => {
//     initializeDjombi();
//   };

//   // Component to render for the selected category
//   const renderEmailComponent = () => {
//     // Show Djombi loading state
//     if (isDjombiLoading) {
//       return (
//         <div className="flex items-center justify-center h-64">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2" />
//           <span>Initializing Djombi integration...</span>
//         </div>
//       );
//     }

//     // Show Djombi error state
//     if (djombiError && !djombiTokens) {
//       return (
//         <div className="flex flex-col items-center justify-center h-64 p-4">
//           <p className="text-red-500 mb-4">Djombi Error: {djombiError}</p>
//           <Button onClick={handleRetryDjombi}>Retry Djombi Integration</Button>
//         </div>
//       );
//     }

//     // If email is not linked yet, show a message
//     // if (!isEmailLinked) {
//     //   return (
//     //     <div className="flex flex-col items-center justify-center h-64 p-4">
//     //       <h3 className="text-xl font-medium mb-4">Link your email account to continue</h3>
//     //       <LinkEmailModal />
//     //       <LinkEmailModal buttonText="Link Email Account" />
//     //     </div>
//     //   );
//     // }

//     // Show loading state
//     if (isLoading) {
//       return (
//         <div className="flex items-center justify-center h-64">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2" />
//           <span>Loading emails...</span>
//         </div>
//       );
//     }

//     // Show error state
//     if (loadingError) {
//       return (
//         <div className="flex flex-col items-center justify-center h-64 p-4">
//           <p className="text-red-500 mb-4">{loadingError}</p>
//           <Button onClick={() => fetchEmails(activeCategory)}>Try Again</Button>
//         </div>
//       );
//     }

//     // Render the appropriate component based on category
//     // Pass djombiTokens as props to components that need them
//     switch (activeCategory) {
//       case "sent":
//         return <EmailSent djombiTokens={djombiTokens} />;
//       case "draft":
//         return <EmailDraft djombiTokens={djombiTokens} />;
//       case "spam":
//         return <EmailSpam djombiTokens={djombiTokens} />;
//       case "agenda":
//         // return <EmailAgenda djombiTokens={djombiTokens} />;
//       case "inbox":
//       default:
//         return <ProfessionalEmailInbox djombiTokens={djombiTokens} />;
//     }
//   };

//   return (
//     // <ProtectedRoute>
//       <div className="min-h-screen">
//         <main className="p-6">
//           {/* Debug info (remove in production) */}
//           {process.env.NODE_ENV === 'development' && djombiTokens && (
//             <div className="mb-4 p-2 bg-green-100 rounded text-sm">
//               <strong>Djombi Status:</strong> ✅ Connected
//               <br />
//               <strong>Adafri Token:</strong> {djombiTokens.accessTokenAdafri.substring(0, 10)}...
//               <br />
//               <strong>Djombi Token:</strong> {djombiTokens.accessTokenDjombi.substring(0, 10)}...
//             </div>
//           )}

//           <Tabs
//             value={activeCategory}
//             onValueChange={handleTabChange}
//           >
//             <div className="flex justify-between items-center mb-6">
//               <TabsList>
//                 <TabsTrigger value="inbox" className="">Inbox</TabsTrigger>
//                 <TabsTrigger value="sent" className="">Sent</TabsTrigger>
//                 <TabsTrigger value="draft" className="">Draft</TabsTrigger>
//                 <TabsTrigger value="spam" className="">Spam</TabsTrigger>
//                 <TabsTrigger value="agenda" className="">Agenda</TabsTrigger>
//               </TabsList>
//               <div className="flex items-center gap-3">
//                 <LinkEmailModal />
//                 <Input placeholder="Search mail..." className="max-w-sm " />
//                 {djombiError && (
//                   <Button 
//                     variant="outline" 
//                     size="sm" 
//                     onClick={handleRetryDjombi}
//                     className="text-red-600 border-red-300 hover:bg-red-50"
//                   >
//                     Retry Djombi
//                   </Button>
//                 )}
//               </div>
//             </div>

//             {/* Render the appropriate component based on active category */}
//             <TabsContent value={activeCategory}>
//               {renderEmailComponent()}
//             </TabsContent>
//           </Tabs>

//           <Button
//             className="fixed bottom-8 md:right-[90px] shadow-lg"
//             onClick={() => setIsComposeOpen(true)}
//           >
//             <Pencil className="w-4 h-4 mr-2" />
//             Compose
//           </Button>
//         </main>

//         <ComposeModal
//           isOpen={isComposeOpen}
//           onClose={() => setIsComposeOpen(false)}
//           djombiTokens={djombiTokens}
//         />
//       </div>
//     // </ProtectedRoute>
//   );
// }

















































// This is working code for the email dashboard with tabs and email components.
// "use client";
// import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Pencil } from "lucide-react";
// import { useEmailStore } from "@/lib/store/email-store";
// import { EmailCategory } from "@/lib/types/email";
// // import { EmailAgenda } from "@/components/EmailAgenda";
// import { EmailColumns2 } from "@/components/email/EmailColumns2";
// import { EmailSent } from "@/components/email/EmailSent";
// import { LinkEmailModal } from "@/components/email/LinkEmailModal";
// import { ComposeModal } from "@/components/email/ComposeModal";
// import { EmailDraft } from "@/components/email/EmailDraft";
// import { EmailSpam } from "@/components/email/EmailSpam";
// import ProfessionalEmailInbox from "@/components/email/ProfessionalEmailInbox";
// // import { ProtectedRoute } from "@/components/auth/ProtectedRoute";


// export default function EmailDashboard() {
//   const [isComposeOpen, setIsComposeOpen] = useState(false);
//   const {
//     activeCategory,
//     setActiveCategory,
//     fetchEmails,
//     isLoading,
//     loadingError,
//     draftEmail,
//     updateDraft
//   } = useEmailStore();

//   // Check if email is linked
//   const [isEmailLinked, setIsEmailLinked] = useState(false);

//   useEffect(() => {
//     // Check localStorage on component mount
//     const checkEmailLink = () => {
//       const accessToken = localStorage.getItem('accessToken');
//       const linkedEmailId = localStorage.getItem('linkedEmailId');
//       setIsEmailLinked(!!accessToken && !!linkedEmailId);
//     };

//     checkEmailLink();

//     // Also fetch initial emails for the active category
//     if (typeof window !== 'undefined') {
//       const accessToken = localStorage.getItem('accessToken');
//       const linkedEmailId = localStorage.getItem('linkedEmailId');

//       if (accessToken && linkedEmailId) {
//         fetchEmails(activeCategory);
//       }
//     }

//     // Listen for storage changes (in case user links email in another tab)
//     window.addEventListener('storage', checkEmailLink);

//     return () => {
//       window.removeEventListener('storage', checkEmailLink);
//     };
//   }, [activeCategory, fetchEmails]);

//   // Handle tab change
//   const handleTabChange = (value: string) => {
//     const category = value as EmailCategory;
//     setActiveCategory(category);
//   };

//   // Handler for editing a draft
//   const handleEditDraft = (draft: any) => {
//     updateDraft(draft);
//     setIsComposeOpen(true);
//   };

//   // Component to render for the selected category
//   const renderEmailComponent = () => {
//     // If email is not linked yet, show a message
//     // if (!isEmailLinked) {
//     //   return (
//     //     <div className="flex flex-col items-center justify-center h-64 p-4">
//     //       <h3 className="text-xl font-medium mb-4">Link your email account to continue</h3>
//     //       <LinkEmailModal />
//     //       <LinkEmailModal buttonText="Link Email Account" />
//     //     </div>
//     //   );
//     // }

//     // Show loading state
//     if (isLoading) {
//       return (
//         <div className="flex items-center justify-center h-64">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2" />
//           <span>Loading emails...</span>
//         </div>
//       );
//     }

//     // Show error state
//     if (loadingError) {
//       return (
//         <div className="flex flex-col items-center justify-center h-64 p-4">
//           <p className="text-red-500 mb-4">{loadingError}</p>
//           <Button onClick={() => fetchEmails(activeCategory)}>Try Again</Button>
//         </div>
//       );
//     }

//     // Render the appropriate component based on category
//     switch (activeCategory) {
//       case "sent":
//         return <EmailSent />;
//       case "draft":
//         return <EmailDraft />;
//       // return <EmailDraft onEditDraft={handleEditDraft} />;
//       case "spam":
//         return <EmailSpam />;
//       case "agenda":
//       // return <EmailAgenda />;
//       case "inbox":
//       default:
//         return <ProfessionalEmailInbox />;
//     }
//   };

//   return (
//     // <ProtectedRoute>
//       <div className="min-h-screen">
//         <main className="p-6">
//           <Tabs
//             value={activeCategory}
//             onValueChange={handleTabChange}
//           >
//             <div className="flex justify-between items-center mb-6">
//               <TabsList>
//                 <TabsTrigger value="inbox" className="">Inbox</TabsTrigger>
//                 <TabsTrigger value="sent" className="">Sent</TabsTrigger>
//                 <TabsTrigger value="draft" className="">Draft</TabsTrigger>
//                 <TabsTrigger value="spam" className="">Spam</TabsTrigger>
//                 <TabsTrigger value="agenda" className="">Agenda</TabsTrigger>
//               </TabsList>
//               <div className="flex items-center gap-3">
//                 <LinkEmailModal />
//                 <Input placeholder="Search mail..." className="max-w-sm " />
//               </div>
//             </div>

//             {/* Render the appropriate component based on active category */}
//             <TabsContent value={activeCategory}>
//               {renderEmailComponent()}
//             </TabsContent>
//           </Tabs>

//           <Button
//             className="fixed bottom-8 md:right-[90px] shadow-lg"
//             onClick={() => setIsComposeOpen(true)}
//           >
//             <Pencil className="w-4 h-4 mr-2" />
//             Compose
//           </Button>
//         </main>

//         <ComposeModal
//           isOpen={isComposeOpen}
//           onClose={() => setIsComposeOpen(false)}
//         />
//       </div>
//     // </ProtectedRoute>
//   );
// }









































// "use client";
// import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Pencil } from "lucide-react";
// import { useEmailStore } from "@/store/email-store";
// import { EmailCategory } from "@/lib/types/email";
// // import { EmailAgenda } from "@/components/EmailAgenda";
// import { EmailColumns2 } from "@/components/email/EmailColumns2";
// import { EmailSent } from "@/components/email/EmailSent";
// import { LinkEmailModal } from "@/components/email/LinkEmailModal";
// import { ComposeModal } from "@/components/email/ComposeModal";
// import { EmailDraft } from "@/components/email/EmailDraft";
// import { EmailSpam } from "@/components/email/EmailSpam";
// import ProfessionalEmailInbox from "@/components/email/ProfessionalEmailInbox";
// // import { ProtectedRoute } from "@/components/auth/ProtectedRoute";


// export default function EmailDashboard() {
//   const [isComposeOpen, setIsComposeOpen] = useState(false);
//   const {
//     activeCategory,
//     setActiveCategory,
//     fetchEmails,
//     isLoading,
//     loadingError,
//     draftEmail,
//     updateDraft
//   } = useEmailStore();

//   // Check if email is linked
//   const [isEmailLinked, setIsEmailLinked] = useState(false);

//   useEffect(() => {
//     // Check localStorage on component mount
//     const checkEmailLink = () => {
//       const accessToken = localStorage.getItem('accessToken');
//       const linkedEmailId = localStorage.getItem('linkedEmailId');
//       setIsEmailLinked(!!accessToken && !!linkedEmailId);
//     };

//     checkEmailLink();

//     // Also fetch initial emails for the active category
//     if (typeof window !== 'undefined') {
//       const accessToken = localStorage.getItem('accessToken');
//       const linkedEmailId = localStorage.getItem('linkedEmailId');

//       if (accessToken && linkedEmailId) {
//         fetchEmails(activeCategory);
//       }
//     }

//     // Listen for storage changes (in case user links email in another tab)
//     window.addEventListener('storage', checkEmailLink);

//     return () => {
//       window.removeEventListener('storage', checkEmailLink);
//     };
//   }, []);

//   // Handle tab change
//   const handleTabChange = (value: string) => {
//     const category = value as EmailCategory;
//     setActiveCategory(category);
//   };

//   // Handler for editing a draft
//   const handleEditDraft = (draft: any) => {
//     updateDraft(draft);
//     setIsComposeOpen(true);
//   };

//   // Component to render for the selected category
//   const renderEmailComponent = () => {
//     // If email is not linked yet, show a message
//     // if (!isEmailLinked) {
//     //   return (
//     //     <div className="flex flex-col items-center justify-center h-64 p-4">
//     //       <h3 className="text-xl font-medium mb-4">Link your email account to continue</h3>
//     //       <LinkEmailModal />
//     //       <LinkEmailModal buttonText="Link Email Account" />
//     //     </div>
//     //   );
//     // }

//     // Show loading state
//     if (isLoading) {
//       return (
//         <div className="flex items-center justify-center h-64">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2" />
//           <span>Loading emails...</span>
//         </div>
//       );
//     }

//     // Show error state
//     if (loadingError) {
//       return (
//         <div className="flex flex-col items-center justify-center h-64 p-4">
//           <p className="text-red-500 mb-4">{loadingError}</p>
//           <Button onClick={() => fetchEmails(activeCategory)}>Try Again</Button>
//         </div>
//       );
//     }

//     // Render the appropriate component based on category
//     switch (activeCategory) {
//       case "sent":
//         return <EmailSent />;
//       case "draft":
//         return <EmailDraft />;
//       // return <EmailDraft onEditDraft={handleEditDraft} />;
//       case "spam":
//         return <EmailSpam />;
//       case "agenda":
//       // return <EmailAgenda />;
//       case "inbox":
//       default:
//         return <ProfessionalEmailInbox />;
//     }
//   };

//   return (
//     // <ProtectedRoute>
//       <div className="min-h-screen">
//         <main className="p-6">
//           <Tabs
//             value={activeCategory}
//             onValueChange={handleTabChange}
//           >
//             <div className="flex justify-between items-center mb-6">
//               <TabsList>
//                 <TabsTrigger value="inbox" className="">Inbox</TabsTrigger>
//                 <TabsTrigger value="sent" className="">Sent</TabsTrigger>
//                 <TabsTrigger value="draft" className="">Draft</TabsTrigger>
//                 <TabsTrigger value="spam" className="">Spam</TabsTrigger>
//                 <TabsTrigger value="agenda" className="">Agenda</TabsTrigger>
//               </TabsList>
//               <div className="flex items-center gap-3">
//                 <LinkEmailModal />
//                 <Input placeholder="Search mail..." className="max-w-sm " />
//               </div>
//             </div>

//             {/* Render the appropriate component based on active category */}
//             <TabsContent value={activeCategory}>
//               {renderEmailComponent()}
//             </TabsContent>
//           </Tabs>

//           <Button
//             className="fixed bottom-8 md:right-[90px] shadow-lg"
//             onClick={() => setIsComposeOpen(true)}
//           >
//             <Pencil className="w-4 h-4 mr-2" />
//             Compose
//           </Button>
//         </main>

//         <ComposeModal
//           isOpen={isComposeOpen}
//           onClose={() => setIsComposeOpen(false)}
//         />
//       </div>
//     // </ProtectedRoute>
//   );
// }
















// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { EmailColumns } from "@/components/email/EmailColumns";
// import { ComposeModal } from "@/components/email/ComposeModal";
// import { useState } from "react";
// import { useEmailStore } from "@/store/email-store";
// import { ArrowLeft, Bell, Settings, Pencil } from "lucide-react";
// import { EmailCategory } from "@/lib/types/email";
// import { EmailSent } from "@/components/email/EmailSent";
// import { LinkEmailModal } from "@/components/email/LinkEmailModal";

// export default function EmailDashboard() {
//   const [isComposeOpen, setIsComposeOpen] = useState(false);
//   const { activeCategory, setActiveCategory } = useEmailStore();

//   return (
//     <div className="min-h-screen">

//       <main className="p-6 ">
//         <Tabs
//           value={activeCategory}
//           onValueChange={(value) => setActiveCategory(value as EmailCategory)}
//         >
//           <div className="flex justify-between items-center mb-6">
//             <TabsList>
//               <TabsTrigger value="inbox" className="">Inbox</TabsTrigger>
//               <TabsTrigger value="sent" className="">Sent</TabsTrigger>
//               <TabsTrigger value="draft" className="">Draft</TabsTrigger>
//               <TabsTrigger value="spam" className="">Spam</TabsTrigger>
//               <TabsTrigger value="agenda" className="">Agenda</TabsTrigger>
//             </TabsList>
//             <div className="flex items-center gap-3">
//               <LinkEmailModal />
//               <Input placeholder="Search mail..." className="max-w-sm" />
//             </div>
//           </div>

//           <TabsContent value={activeCategory}>
//             <EmailColumns />
//           </TabsContent>
//           {/* <TabsContent value="sent">
//             <EmailSent />
//           </TabsContent> */}
//         </Tabs>

//         <Button
//           className="fixed bottom-8 md:right-[90px] shadow-lg"
//           onClick={() => setIsComposeOpen(true)}
//         > <Pencil className="w-4 h-4" />
//           Compose
//         </Button>
//       </main>

//       <ComposeModal
//         isOpen={isComposeOpen}
//         onClose={() => setIsComposeOpen(false)}
//       />
//     </div>
//   );
// }
