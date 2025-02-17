import React from 'react';
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FileIcon } from 'lucide-react';

interface EmailAttachment {
  name: string;
  type: string;
}

interface Email {
  id: string;
  timestamp: string;
  sender: string;
  subject: string;
  preview: string;
  attachments?: EmailAttachment[];
}

interface EmailPreviewProps {
  emails: Email[];
  className?: string;
}

const AttachmentChip: React.FC<{ attachment: EmailAttachment }> = ({ attachment }) => (
  <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
    <FileIcon className="w-4 h-4 text-red-500" />
    <span>{attachment.name}</span>
  </div>
);

const EmailPreview: React.FC<{ email: Email }> = ({ email }) => (
  <div className="p-4 hover:bg-gray-50 transition-colors">
    <div className="flex items-start gap-3">
      <Checkbox className="mt-1.5" />
      <div className="flex-1 space-y-1">
        <div className="text-sm text-gray-500">{email.timestamp}</div>
        <div className="font-medium">{email.sender}</div>
        <div className="font-medium">{email.subject}</div>
        <div className="text-gray-600 text-sm line-clamp-1">{email.preview}</div>
        {email.attachments && email.attachments.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {email.attachments.map((attachment, index) => (
              <AttachmentChip key={index} attachment={attachment} />
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

const EmailList: React.FC<EmailPreviewProps> = ({ emails, className }) => {
  return (
    <Card className={cn("w-[370px] h-[600px] flex flex-col py-2", className)}>
      <CardHeader className="border-b">
        <CardTitle>Email</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0 divide-y">
        {emails.map((email) => (
          <EmailPreview key={email.id} email={email} />
        ))}
      </CardContent>
    </Card>
  );
};

// Example usage
const DashboardEmailList = () => {
  const emails: Email[] = [
    {
      id: '1',
      timestamp: '05/12 - 14:48',
      sender: 'danielodedara@....',
      subject: 'Welcome to Adafri Dashboard',
      preview: 'Hello, my name is Daniel, I am......',
      attachments: [{ name: '2.png', type: 'image' }]
    },
    {
      id: '2',
      timestamp: '05/12 - 14:48',
      sender: 'danielodedara@....',
      subject: 'Welcome to Adafri Dashboard',
      preview: 'Hello, my name is Daniel, I am......',
      attachments: [{ name: 'Power.png', type: 'image' }]
    },
    {
      id: '3',
      timestamp: '05/12 - 14:48',
      sender: 'danielodedara@....',
      subject: 'Welcome to Adafri Dashboard',
      preview: 'Hello, my name is Daniel, I am......',
    },
    {
      id: '4',
      timestamp: '05/12 - 14:48',
      sender: 'danielodedara@....',
      subject: 'Welcome to Adafri Dashboard',
      preview: 'Hello, my name is Daniel, I am......',
      attachments: [{ name: 'Power.png', type: 'image' }]
    },
    // Add more emails to demonstrate scrolling
  ];

  return (
    <div className="min-h-screen">
      <EmailList emails={emails} />
    </div>
  );
};

export default DashboardEmailList;