"use client";
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, FileIcon } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Email } from "@/lib/types/email";
import { cn } from "@/lib/utils";
import { createEmailPreview } from "@/lib/utils/emails/email-content-utils";
import { useRouter } from "next/navigation";

// Enhanced Email Preview Component with proper content preview
interface AttachmentChipProps {
  name: string;
}

const AttachmentChip: React.FC<AttachmentChipProps> = ({ name }) => (
  <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs">
    <FileIcon className="w-3 h-3 text-red-500" />
    <span className="truncate max-w-[100px]">{name}</span>
  </div>
);

interface EmailPreviewProps {
  email: Email;
  onNavigate: (emailId: string | number) => void;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({ email, onNavigate }) => {
  // Format date nicely
  const formattedDate = email.timestamp ? 
    new Date(email.timestamp).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : '';

  const handleClick = () => {
    const emailId = email.id || email.email_id;
    if (emailId) {
      onNavigate(emailId);
    }
  };

  return (
    <div 
      className="p-3 hover:bg-gray-50 transition-colors cursor-pointer border-b last:border-b-0"
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <Checkbox className="mt-1.5" onClick={(e) => e.stopPropagation()} />
        <div className="flex-1 space-y-1 min-w-0"> {/* min-w-0 helps with text truncation */}
          <div className="flex justify-between text-xs text-gray-500">
            <span className="font-medium">{email.from}</span>
            <span>{formattedDate}</span>
          </div>
          <div className="font-medium text-sm truncate">{email.subject}</div>
          <div className="text-gray-600 text-xs line-clamp-2">
            {createEmailPreview(email.content, 100)}
          </div>
          {email.hasAttachment && (
            <div className="flex gap-2 mt-1 flex-wrap">
              <AttachmentChip name="Attachment" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export interface EmailListProps {
  emails: Email[];
  className?: string;
}

export const EmailList: React.FC<EmailListProps> = ({ emails, className }) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const emailsPerPage = 6;
  
  // Calculate total pages
  const totalPages = Math.ceil(emails.length / emailsPerPage);
  
  // Get current emails
  const indexOfLastEmail = currentPage * emailsPerPage;
  const indexOfFirstEmail = indexOfLastEmail - emailsPerPage;
  const currentEmails = emails.slice(indexOfFirstEmail, indexOfLastEmail);
  
  // Change page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Handle navigation to email detail page
  const handleEmailNavigation = (emailId: string | number) => {
    router.push(`/dashboard/professional-mail`);
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex-1 overflow-y-auto">
        {currentEmails.map((email) => (
          <EmailPreview 
            key={email.id || String(email.email_id)} 
            email={email}
            onNavigate={handleEmailNavigation}
          />
        ))}
      </div>
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center p-2 border-t">
          <div className="text-xs text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToPreviousPage} 
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToNextPage} 
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailList;

























































// "use client";

// import React from 'react';
// import { cn } from "@/lib/utils";
// import { Checkbox } from "@/components/ui/checkbox";
// import { FileIcon } from 'lucide-react';
// import { Email } from "@/lib/types/email";

// export interface EmailPreviewProps {
//   emails: Email[];
//   className?: string;
// }

// const AttachmentChip: React.FC<{ name: string }> = ({ name }) => (
//   <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
//     <FileIcon className="w-4 h-4 text-red-500" />
//     <span>{name}</span>
//   </div>
// );

// const EmailPreview: React.FC<{ email: Email }> = ({ email }) => (
//   <div className="p-4 hover:bg-gray-50 transition-colors">
//     <div className="flex items-start gap-3">
//       <Checkbox className="mt-1.5" />
//       <div className="flex-1 space-y-1">
//         <div className="text-sm text-gray-500">{email.timestamp}</div>
//         <div className="text-sm bg-gray">{email.to}</div>
//         <div className="font-medium">{email.subject}</div>
//         <div className="text-gray-600 text-sm line-clamp-1">{email.content}</div>
//         {email.hasAttachment && (
//           <div className="flex gap-2 mt-2 flex-wrap">
//             <AttachmentChip name="Attachment" />
//           </div>
//         )}
//       </div>
//     </div>
//   </div>
// );

// export const EmailList: React.FC<EmailPreviewProps> = ({ emails, className }) => {
//   return (
//     <div className={cn("flex-1 divide-y", className)}>
//       {emails.map((email) => (
//         <EmailPreview key={email.id || email.email_id} email={email} />
//       ))}
//     </div>
//   );
// };

// // Sample data for testing
// export const sampleEmails = [
//   {
//     id: '1',
//     from: 'danielodedara@....',
//     to: 'you@example.com',
//     subject: 'Welcome to Adafri Dashboard',
//     content: 'Hello, my name is Daniel, I am......',
//     timestamp: '05/12 - 14:48',
//     hasAttachment: true,
//     status: 'inbox'
//   },
//   {
//     id: '2',
//     from: 'danielodedara@....',
//     to: 'you@example.com',
//     subject: 'Welcome to Adafri Dashboard',
//     content: 'Hello, my name is Daniel, I am......',
//     timestamp: '05/12 - 14:48',
//     hasAttachment: true,
//     status: 'inbox'
//   },
// ];






















// File: EmailComponent.tsx
// import React from 'react';
// import { cn } from "@/lib/utils";
// import { Checkbox } from "@/components/ui/checkbox";
// import { FileIcon } from 'lucide-react';

// export interface EmailAttachment {
//   name: string;
//   type: string;
// }

// export interface Email {
//   id: string;
//   timestamp: string;
//   sender: string;
//   subject: string;
//   content: string;
//   attachments?: EmailAttachment[];
// }

// export interface EmailPreviewProps {
//   emails: Email[];
//   className?: string;
// }

// const AttachmentChip: React.FC<{ attachment: EmailAttachment }> = ({ attachment }) => (
//   <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
//     <FileIcon className="w-4 h-4 text-red-500" />
//     <span>{attachment.name}</span>
//   </div>
// );

// const EmailPreview: React.FC<{ email: Email }> = ({ email }) => (
//   <div className="p-4 hover:bg-gray-50 transition-colors">
//     <div className="flex items-start gap-3">
//       <Checkbox className="mt-1.5" />
//       <div className="flex-1 space-y-1">
//         <div className="text-sm text-gray-500">{email.timestamp}</div>
//         <div className="font-medium">{email.sender}</div>
//         <div className="font-medium">{email.subject}</div>
//         <div className="text-gray-600 text-sm line-clamp-1">{email.content}</div>
//         {email.attachments && email.attachments.length > 0 && (
//           <div className="flex gap-2 mt-2 flex-wrap">
//             {email.attachments.map((attachment, index) => (
//               <AttachmentChip key={index} attachment={attachment} />
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   </div>
// );

// export const EmailList: React.FC<EmailPreviewProps> = ({ emails, className }) => {
//   return (
//     <div className={cn("flex-1 divide-y", className)}>
//       {emails.map((email) => (
//         <EmailPreview key={email.id} email={email} />
//       ))}
//     </div>
//   );
// };

// // Sample data for testing
// export const sampleEmails: Email[] = [
//     {
//         id: '1',
//         timestamp: '05/12 - 14:48',
//         sender: 'danielodedara@....',
//         subject: 'Welcome to Adafri Dashboard',
//         content: 'Hello, my name is Daniel, I am......',
//         attachments: [{ name: '2.pdf', type: 'image' }]
//       },
//       {
//         id: '2',
//         timestamp: '05/12 - 14:48',
//         sender: 'danielodedara@....',
//         subject: 'Welcome to Adafri Dashboard',
//         content: 'Hello, my name is Daniel, I am......',
//         attachments: [{ name: 'Power.pdf', type: 'image' }]
//       },
//   // Add more email examples...
// ];
