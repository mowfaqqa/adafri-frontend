"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil } from "lucide-react";
import { useEmailStore } from "@/lib/store/email-store";
import { EmailCategory } from "@/lib/types/email";
// import { EmailAgenda } from "@/components/EmailAgenda";
import { EmailColumns2 } from "@/components/email/EmailColumns2";
import { EmailSent } from "@/components/email/EmailSent";
import { LinkEmailModal } from "@/components/email/LinkEmailModal";
import { ComposeModal } from "@/components/email/ComposeModal";
import { EmailDraft } from "@/components/email/EmailDraft";
import { EmailSpam } from "@/components/email/EmailSpam";
import ProfessionalEmailInbox from "@/components/email/ProfessionalEmailInbox";
// import { ProtectedRoute } from "@/components/auth/ProtectedRoute";


export default function EmailDashboard() {
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
  }, [activeCategory, fetchEmails]);

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

  // Component to render for the selected category
  const renderEmailComponent = () => {
    // If email is not linked yet, show a message
    // if (!isEmailLinked) {
    //   return (
    //     <div className="flex flex-col items-center justify-center h-64 p-4">
    //       <h3 className="text-xl font-medium mb-4">Link your email account to continue</h3>
    //       <LinkEmailModal />
    //       <LinkEmailModal buttonText="Link Email Account" />
    //     </div>
    //   );
    // }

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
      // return <EmailDraft onEditDraft={handleEditDraft} />;
      case "spam":
        return <EmailSpam />;
      case "agenda":
      // return <EmailAgenda />;
      case "inbox":
      default:
        return <ProfessionalEmailInbox />;
    }
  };

  return (
    // <ProtectedRoute>
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
    // </ProtectedRoute>
  );
}









































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
