"use client";
import React from 'react';
import { Card } from "@/components/ui/card";
import { Email } from "@/lib/types/email";
import { Paperclip, Trash, Check, Circle, Mail, Clock, User } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEmailStore } from "@/lib/store/email-store";
import { createEmailPreview, EmailContentRenderer } from "@/lib/utils/emails/email-content-utils";
import { toast } from "sonner";

interface EmailCardProps {
  email: Email;
  index: number;
}

export const EmailCard = ({ email, index }: EmailCardProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const deleteEmail = useEmailStore((state) => state.deleteEmail);

  // Ensure email.id is a string - if it's missing, generate a fallback ID
  const emailId = email?.id ? String(email.id) : `email-${index}`;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteEmail(emailId);
    toast.success("Email deleted");
  };

  // Handle email read toggle
  const handleReadToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    // You can implement read/unread functionality here
    toast.success(`Email marked as ${email.isRead ? 'unread' : 'read'}`);
  };

  // Format date for display
  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else if (diffInHours < 168) { // 7 days
        return date.toLocaleDateString(undefined, {
          weekday: 'short'
        });
      } else {
        return date.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric'
        });
      }
    } catch (e) {
      return "No date";
    }
  };

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Render a placeholder during SSR or if email is undefined
  if (!mounted || !email) {
    return (
      <div 
        className="p-3 rounded-lg border border-gray-200 bg-white shadow-sm"
        style={{ 
          boxShadow: '0 1px 0 rgba(9,30,66,.25)',
          borderRadius: '8px',
          minHeight: '80px',
        }}
      >
        <div className="animate-pulse">
          <div className="flex justify-between items-start mb-2">
            <div className="h-3 bg-gray-300 rounded w-1/3"></div>
            <div className="h-3 bg-gray-300 rounded w-12"></div>
          </div>
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-full"></div>
        </div>
      </div>
    );
  }

  const isCompleted = email.isRead;
  const isUrgent = email.isUrgent;

  return (
    <>
      <div
        onClick={() => setShowDialog(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative p-3 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-blue-500 hover:border-2 transition-all cursor-pointer group overflow-hidden"
        style={{ 
          boxShadow: '0 1px 0 rgba(9,30,66,.25)',
          borderRadius: '8px',
          minHeight: '80px',
        }}
      >
        {/* Read/Unread Toggle - Shows on hover */}
        {isHovered && (
          <div className="absolute top-2 right-2 z-20">
            <Button
              onClick={handleReadToggle}
              variant="ghost"
              size="sm"
              className={`h-6 w-6 p-0 rounded-full transition-all duration-200 ${
                isCompleted 
                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg' 
                  : 'bg-white/90 hover:bg-white border border-gray-300 text-gray-600 shadow-lg'
              }`}
              title={isCompleted ? "Mark as unread" : "Mark as read"}
            >
              {isCompleted ? (
                <Check className="h-3 w-3" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
            </Button>
          </div>
        )}

        {/* Urgent indicator */}
        {isUrgent && (
          <div className="absolute top-2 left-2 z-10">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        )}

        {/* Email Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span className={`text-xs truncate ${isCompleted ? 'text-gray-500' : 'text-gray-700 font-medium'}`}>
              {email.from || "Unknown sender"}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {email.hasAttachment && (
              <Paperclip className="w-3 h-3 text-gray-400" />
            )}
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">{formatDate(email.timestamp)}</span>
          </div>
        </div>

        {/* Email Subject */}
        <div className="mb-2">
          <h4 className={`text-sm font-medium line-clamp-2 ${
            isCompleted ? 'text-gray-500' : 'text-gray-800'
          } ${isCompleted ? 'line-through' : ''}`}>
            {email.subject || "No subject"}
          </h4>
        </div>

        {/* Email Preview */}
        <div className="mb-2">
          <p className={`text-xs line-clamp-2 ${
            isCompleted ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {mounted ? createEmailPreview(email.content, 120) : "Loading preview..."}
          </p>
        </div>

        {/* Email Footer */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {/* Category/Status indicator */}
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              email.status === 'urgent' 
                ? 'bg-red-100 text-red-700'
                : email.status === 'follow-up'
                ? 'bg-gray-100 text-gray-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {email.status}
            </div>
          </div>
          
          {/* Delete button - only show on hover */}
          {isHovered && (
            <Button
              onClick={handleDelete}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
              title="Delete email"
            >
              <Trash className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg pointer-events-none"></div>
      </div>

      {/* Email Detail Modal - Enhanced */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-semibold text-gray-900 mb-2">
                  {email.subject || "No subject"}
                </DialogTitle>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span><span className="font-medium">From:</span> {email.from || "Unknown sender"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span><span className="font-medium">To:</span> {email.to || "Unknown recipient"}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {email.hasAttachment && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
                    <Paperclip className="w-3 h-3" />
                    <span className="text-xs">Attachment</span>
                  </div>
                )}
                {isUrgent && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-xs font-medium">Urgent</span>
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between text-sm text-gray-500 border-b pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span><span className="font-medium">Date:</span> {formatDate(email.timestamp)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  email.status === 'urgent' 
                    ? 'bg-red-100 text-red-700'
                    : email.status === 'follow-up'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {email.status}
                </div>
              </div>
            </div>
            
            {/* Email Content */}
            <div className="bg-gray-50 rounded-lg p-4 border">
              {mounted && <EmailContentRenderer content={email.content} />}
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex gap-2">
                <Button
                  onClick={handleReadToggle}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {isCompleted ? <Circle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  Mark as {isCompleted ? 'unread' : 'read'}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash className="w-4 h-4" />
                  Delete
                </Button>
                <Button
                  onClick={() => setShowDialog(false)}
                  variant="default"
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};






































































// "use client";
// import React from 'react';
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
// import { useEmailStore } from "@/lib/store/email-store";
// import { createEmailPreview, EmailContentRenderer } from "@/lib/utils/emails/email-content-utils";

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
//           <p className="text-xs text-gray-500 truncate mt-1">
//             {mounted ? createEmailPreview(email.content, 100) : "Loading preview..."}
//           </p>
//         </div>
//       </Card>

//       <Dialog open={showDialog} onOpenChange={setShowDialog}>
//         <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>{email.subject || "No subject"}</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div className="flex flex-col sm:flex-row sm:justify-between text-sm text-gray-500 gap-1">
//               <span><span className="font-medium">From:</span> {email.from || "Unknown sender"}</span>
//               <span><span className="font-medium">To:</span> {email.to || "Unknown recipient"}</span>
//             </div>
//             <div className="text-sm text-gray-500">
//               <span><span className="font-medium">Date:</span> {formatDate(email.timestamp)}</span>
//             </div>
//             <div className="border-t pt-4">
//               {mounted && <EmailContentRenderer content={email.content} />}
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
