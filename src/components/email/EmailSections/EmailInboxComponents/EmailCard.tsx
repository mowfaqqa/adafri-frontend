"use client";
import React from 'react';
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Email } from "@/lib/types/email";
import { Paperclip, Trash } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEmailStore } from "@/lib/store/email-store";
import { createEmailPreview, EmailContentRenderer } from "@/lib/utils/emails/email-content-utils";

interface EmailCardProps {
  email: Email;
  index: number;
}

export const EmailCard = ({ email, index }: EmailCardProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [mounted, setMounted] = useState(false);
  const deleteEmail = useEmailStore((state) => state.deleteEmail);

  // Ensure email.id is a string - if it's missing, generate a fallback ID
  const emailId = email?.id ? String(email.id) : `email-${index}`;

  const handleDelete = () => {
    deleteEmail(emailId);
  };

  // Format date for display
  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return timestamp || "No date";
    }
  };

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Render a placeholder during SSR or if email is undefined
  if (!mounted || !email) {
    return (
      <Card className="p-4 mb-2 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox />
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
          <div className="flex gap-2">
            <Trash className="w-4 h-4 text-gray-400 cursor-pointer" />
          </div>
        </div>
        <div className="mt-2">
          <p className="font-semibold truncate">Loading...</p>
          <p className="text-sm text-gray-700 truncate">Loading...</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card
        className="p-4 mb-2 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setShowDialog(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox />
            <span className="text-sm text-gray-500">{formatDate(email.timestamp)}</span>
          </div>
          <div className="flex gap-2">
            {email.hasAttachment && <Paperclip className="w-4 h-4" />}
            <Trash
              className="w-4 h-4 text-gray-400 hover:text-red-500 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
            />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-sm truncate text-gray-700">{email.from || "No sender"}</p>
          <p className="font-medium truncate">{email.subject || "No subject"}</p>
          <p className="text-xs text-gray-500 truncate mt-1">
            {mounted ? createEmailPreview(email.content, 100) : "Loading preview..."}
          </p>
        </div>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{email.subject || "No subject"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between text-sm text-gray-500 gap-1">
              <span><span className="font-medium">From:</span> {email.from || "Unknown sender"}</span>
              <span><span className="font-medium">To:</span> {email.to || "Unknown recipient"}</span>
            </div>
            <div className="text-sm text-gray-500">
              <span><span className="font-medium">Date:</span> {formatDate(email.timestamp)}</span>
            </div>
            <div className="border-t pt-4">
              {mounted && <EmailContentRenderer content={email.content} />}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

































// "use client";
// import { Card } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Email } from "@/lib/types/email";
// import { Paperclip, Trash } from "lucide-react";
// import { useState, useEffect } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { useEmailStore } from "@/store/email-store";

// interface EmailCardProps {
//   email: Email;
//   index: number;
// }

// export const EmailCard = ({ email, index }: EmailCardProps) => {
//   const [showDialog, setShowDialog] = useState(false);
//   const [mounted, setMounted] = useState(false);
//   const deleteEmail = useEmailStore((state) => state.deleteEmail);

//   // Ensure email.id is a string - if it's missing, generate a fallback ID
//   const emailId = email?.id ? String(email.id) : `email-${index}`;

//   const handleDelete = () => {
//     deleteEmail(emailId);
//   };

//   // Format date for display
//   const formatDate = (timestamp: string) => {
//     try {
//       const date = new Date(timestamp);
//       return date.toLocaleString(undefined, {
//         month: 'short',
//         day: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       });
//     } catch (e) {
//       return timestamp || "No date";
//     }
//   };

//   // Handle client-side mounting
//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   // Function to render email content based on content type
//   const renderEmailContent = () => {
//     if (!email.content) return <p className="text-gray-500">No content</p>;
    
//     if (email.contentType === 'html') {
//       return (
//         <div 
//           className="email-content"
//           dangerouslySetInnerHTML={{ __html: email.content }} 
//         />
//       );
//     } else {
//       return (
//         <p className="whitespace-pre-wrap">
//           {email.content}
//         </p>
//       );
//     }
//   };

//   // Extract preview text (plain text only, short version)
//   const getContentPreview = () => {
//     if (!email.content) return "";
    
//     let preview = email.content;
    
//     // If it's HTML content, strip tags for preview
//     if (email.contentType === 'html') {
//       const tempDiv = document.createElement('div');
//       tempDiv.innerHTML = email.content;
//       preview = tempDiv.textContent || tempDiv.innerText || "";
//     }
    
//     return preview.trim().substring(0, 100);
//   };

//   // Render a placeholder during SSR or if email is undefined
//   if (!mounted || !email) {
//     return (
//       <Card className="p-4 mb-2 hover:shadow-md transition-shadow cursor-pointer">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <Checkbox />
//             <span className="text-sm text-gray-500">Loading...</span>
//           </div>
//           <div className="flex gap-2">
//             <Trash className="w-4 h-4 text-gray-400 cursor-pointer" />
//           </div>
//         </div>
//         <div className="mt-2">
//           <p className="font-semibold truncate">Loading...</p>
//           <p className="text-sm text-gray-700 truncate">Loading...</p>
//         </div>
//       </Card>
//     );
//   }

//   return (
//     <>
//       <Card
//         className="p-4 mb-2 hover:shadow-md transition-shadow cursor-pointer"
//         onClick={() => setShowDialog(true)}
//       >
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <Checkbox />
//             <span className="text-sm text-gray-500">{formatDate(email.timestamp)}</span>
//           </div>
//           <div className="flex gap-2">
//             {email.hasAttachment && <Paperclip className="w-4 h-4" />}
//             <Trash
//               className="w-4 h-4 text-gray-400 hover:text-red-500 cursor-pointer"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 handleDelete();
//               }}
//             />
//           </div>
//         </div>
//         <div className="mt-2">
//           <p className="text-sm truncate text-gray-700">{email.from || "No sender"}</p>
//           <p className="font-medium truncate">{email.subject || "No subject"}</p>
//           <p className="text-xs text-gray-500 truncate mt-1">{getContentPreview()}</p>
//         </div>
//       </Card>

//       <Dialog open={showDialog} onOpenChange={setShowDialog}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>{email.subject || "No subject"}</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div className="flex justify-between text-sm text-gray-500">
//               <span>From: {email.from || "Unknown sender"}</span>
//               <span>To: {email.to || "Unknown recipient"}</span>
//             </div>
//             <div className="text-sm text-gray-500">
//               <span>Date: {formatDate(email.timestamp)}</span>
//             </div>
//             <div className="border-t pt-4">
//               {renderEmailContent()}
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// };




































// "use client";
// import { Card } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Email } from "@/lib/types/email";
// import { Paperclip, Trash } from "lucide-react";
// import { useState, useEffect } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { useEmailStore } from "@/store/email-store";
// import ProfessionalEmailInbox from "./ProfessionalEmailInbox";


// interface EmailCardProps {
//   email: Email;
//   index: number;
// }

// export const EmailCard = ({ email, index }: EmailCardProps) => {
//   const [showDialog, setShowDialog] = useState(false);
//   const [mounted, setMounted] = useState(false);
//   const deleteEmail = useEmailStore((state) => state.deleteEmail);

//   // Ensure email.id is a string - if it's missing, generate a fallback ID
//   const emailId = email?.id ? String(email.id) : `email-${index}`;

//   const handleDelete = () => {
//     deleteEmail(emailId);
//   };

//   // Handle client-side mounting
//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   // Render a placeholder during SSR or if email is undefined
//   if (!mounted || !email) {
//     return (
//       <Card className="p-4 mb-2 hover:shadow-md transition-shadow cursor-pointer">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <Checkbox />
//             <span className="text-sm text-gray-500">Loading...</span>
//           </div>
//           <div className="flex gap-2">
//             <Trash className="w-4 h-4 text-gray-400 cursor-pointer" />
//           </div>
//         </div>
//         <div className="mt-2">
//           <p className="font-semibold truncate">Loading...</p>
//           <p className="text-sm text-gray-700 truncate">Loading...</p>
//         </div>
//       </Card>
//     );
//   }

//   return (
//     <>
//       <Card
//         className="p-4 mb-2 hover:shadow-md transition-shadow cursor-pointer"
//         onClick={() => setShowDialog(true)}
//       >
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <Checkbox />
//             <span className="text-sm text-gray-500">{email.timestamp || "No date"}</span>
//           </div>
//           <div className="flex gap-2">
//             {email.hasAttachment && <Paperclip className="w-4 h-4" />}
//             <Trash
//               className="w-4 h-4 text-gray-400 hover:text-red-500 cursor-pointer"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 handleDelete();
//               }}
//             />
//           </div>
//         </div>
//         <div className="mt-2">
//           <p className="text-sm truncate text-gray-700">{email.from || "No sender"}</p>
//           <p className="text-lg truncate">{email.subject || "No subject"}</p>
//         </div>
//       </Card>

//       <Dialog open={showDialog} onOpenChange={setShowDialog}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>{email.subject || "No subject"}</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div className="flex justify-between text-sm text-gray-500">
//               <span>From: {email.from || "Unknown sender"}</span>
//               <span>To: {email.to || "Unknown recipient"}</span>
//             </div>
//             <div className="border-t pt-4">
//               <p className="whitespace-pre-wrap">{email.subject || ""}</p>
//               <p className="whitespace-pre-wrap">{email.content || "No content"}</p>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// };













// "use client";
// import { Card } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Email } from "@/lib/types/email";
// import { Paperclip, Trash } from "lucide-react";
// import { Draggable } from "react-beautiful-dnd";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { useState } from "react";
// import { useEmailStore } from "@/store/email-store";

// interface EmailCardProps {
//   email: Email;
//   index: number;
// }

// export const EmailCard = ({ email, index }: EmailCardProps) => {
//   const [showDialog, setShowDialog] = useState(false);
//   const deleteEmail = useEmailStore((state) => state.deleteEmail);

//   const handleDelete = () => {
//     deleteEmail(email.id);
//   };

//   return (
//     <>
//       <Draggable draggableId={email.id} index={index}>
//         {(provided) => (
//           <Card
//             ref={provided.innerRef}
//             {...provided.draggableProps}
//             {...provided.dragHandleProps}
//             className="p-4 mb-2 hover:shadow-md transition-shadow cursor-pointer"
//             onClick={() => setShowDialog(true)}
//           >
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <Checkbox />
//                 <span className="text-sm text-gray-500">{email.timestamp}</span>
//               </div>
//               <div className="flex gap-2">
//                 {email.hasAttachment && <Paperclip className="w-4 h-4" />}
//                 <Trash
//                   className="w-4 h-4 text-gray-400 hover:text-red-500 cursor-pointer"
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     handleDelete();
//                   }}
//                 />
//               </div>
//             </div>
//             <div className="mt-2">
//               <p className="font-semibold truncate">{email.from}</p>
//               <p className="text-sm text-gray-700 truncate">{email.subject}</p>
//             </div>
//           </Card>
//         )}
//       </Draggable>

//       <Dialog open={showDialog} onOpenChange={setShowDialog}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>{email.subject}</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div className="flex justify-between text-sm text-gray-500">
//               <span>From: {email.from}</span>
//               <span>To: {email.to}</span>
//             </div>
//             <div className="border-t pt-4">
//               <p className="whitespace-pre-wrap">{email.content}</p>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// };
