"use client";

import React, { useState } from 'react';
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

interface TabProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
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

const TabNavigation: React.FC<TabProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex rounded-md overflow-hidden w-full mb-4">
      <button 
        onClick={() => setActiveTab('email')}
        className={cn(
          "flex-1 py-2 px-4 text-center font-medium transition-colors",
          activeTab === 'email' 
            ? "bg-teal-500 text-white" 
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        )}
      >
        Email
      </button>
      <button 
        onClick={() => setActiveTab('message')}
        className={cn(
          "flex-1 py-2 px-4 text-center font-medium transition-colors",
          activeTab === 'message' 
            ? "bg-teal-500 text-white" 
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        )}
      >
        Online Message
      </button>
    </div>
  );
};

const EmailList: React.FC<EmailPreviewProps> = ({ emails, className }) => {
  return (
    <div className={cn("flex-1 divide-y", className)}>
      {emails.map((email) => (
        <EmailPreview key={email.id} email={email} />
      ))}
    </div>
  );
};

// Placeholder for Online Message component
const OnlineMessageList: React.FC = () => {
  return (
    <div className="flex-1 divide-y">
      <div className="p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-start gap-3">
          <Checkbox className="mt-1.5" />
          <div className="flex-1 space-y-1">
            <div className="text-sm text-gray-500">05/12 - 16:30</div>
            <div className="font-medium">John Smith</div>
            <div className="font-medium">Question about service</div>
            <div className="text-gray-600 text-sm line-clamp-1">Hello, I would like to inquire about...</div>
          </div>
        </div>
      </div>
      <div className="p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-start gap-3">
          <Checkbox className="mt-1.5" />
          <div className="flex-1 space-y-1">
            <div className="text-sm text-gray-500">05/12 - 15:45</div>
            <div className="font-medium">Sarah Johnson</div>
            <div className="font-medium">Support request</div>
            <div className="text-gray-600 text-sm line-clamp-1">I need assistance with my account...</div>
          </div>
        </div>
      </div>
      {/* Add more message items as needed */}
    </div>
  );
};

// Main component with tabs
const TabbedCommunication: React.FC = () => {
  const [activeTab, setActiveTab] = useState('email');

  const emails: Email[] = [
    {
      id: '1',
      timestamp: '05/12 - 14:48',
      sender: 'danielodedara@....',
      subject: 'Welcome to Adafri Dashboard',
      preview: 'Hello, my name is Daniel, I am......',
      attachments: [{ name: '2.pdf', type: 'image' }]
    },
    {
      id: '2',
      timestamp: '05/12 - 14:48',
      sender: 'danielodedara@....',
      subject: 'Welcome to Adafri Dashboard',
      preview: 'Hello, my name is Daniel, I am......',
      attachments: [{ name: 'Power.pdf', type: 'image' }]
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
      attachments: [{ name: 'Power.pdf', type: 'image' }]
    },
    {
      id: '5',
      timestamp: '05/12 - 14:48',
      sender: 'danielodedara@....',
      subject: 'Welcome to Adafri Dashboard',
      preview: 'Hello, my name is Daniel, I am......',
      attachments: [{ name: 'Power.pdf', type: 'image' }]
    },
  ];

  return (
    <div className="min-h-screen">
      <Card className="w-[450px] h-auto flex flex-col py-2 rounded-xl bg-white ml-auto">
        <CardHeader className="pb-2 border-b">
          <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        </CardHeader>
        <CardContent className="flex-1 p-0">
          {activeTab === 'email' ? (
            <EmailList emails={emails} />
          ) : (
            <OnlineMessageList />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TabbedCommunication;