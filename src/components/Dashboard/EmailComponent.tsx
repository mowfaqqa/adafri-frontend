"use client";

import React from 'react';
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { FileIcon } from 'lucide-react';
import { Email } from "@/lib/types/email";

export interface EmailPreviewProps {
  emails: Email[];
  className?: string;
}

const AttachmentChip: React.FC<{ name: string }> = ({ name }) => (
  <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
    <FileIcon className="w-4 h-4 text-red-500" />
    <span>{name}</span>
  </div>
);

const EmailPreview: React.FC<{ email: Email }> = ({ email }) => (
  <div className="p-4 hover:bg-gray-50 transition-colors">
    <div className="flex items-start gap-3">
      <Checkbox className="mt-1.5" />
      <div className="flex-1 space-y-1">
        <div className="text-sm text-gray-500">{email.timestamp}</div>
        <div className="text-sm bg-gray">{email.to}</div>
        <div className="font-medium">{email.subject}</div>
        <div className="text-gray-600 text-sm line-clamp-1">{email.content}</div>
        {email.hasAttachment && (
          <div className="flex gap-2 mt-2 flex-wrap">
            <AttachmentChip name="Attachment" />
          </div>
        )}
      </div>
    </div>
  </div>
);

export const EmailList: React.FC<EmailPreviewProps> = ({ emails, className }) => {
  return (
    <div className={cn("flex-1 divide-y", className)}>
      {emails.map((email) => (
        <EmailPreview key={email.id || email.email_id} email={email} />
      ))}
    </div>
  );
};

// Sample data for testing
export const sampleEmails = [
  {
    id: '1',
    from: 'danielodedara@....',
    to: 'you@example.com',
    subject: 'Welcome to Adafri Dashboard',
    content: 'Hello, my name is Daniel, I am......',
    timestamp: '05/12 - 14:48',
    hasAttachment: true,
    status: 'inbox'
  },
  {
    id: '2',
    from: 'danielodedara@....',
    to: 'you@example.com',
    subject: 'Welcome to Adafri Dashboard',
    content: 'Hello, my name is Daniel, I am......',
    timestamp: '05/12 - 14:48',
    hasAttachment: true,
    status: 'inbox'
  },
];






















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
