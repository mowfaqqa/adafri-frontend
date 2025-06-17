"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ComposeFormFieldsProps {
  userEmail: string;
  email: {
    to: string;
    cc: string[] | string;
    bcc: string[] | string;
    subject: string;
    content: string;
  };
  showCc: boolean;
  showBcc: boolean;
  onToggleCc: () => void;
  onToggleBcc: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const ComposeFormFields = ({
  userEmail,
  email,
  showCc,
  showBcc,
  onToggleCc,
  onToggleBcc,
  onChange
}: ComposeFormFieldsProps) => {
  // Convert arrays to strings for display
  const ccValue = Array.isArray(email.cc) ? email.cc.join(', ') : email.cc || '';
  const bccValue = Array.isArray(email.bcc) ? email.bcc.join(', ') : email.bcc || '';

  const handleCcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const event = {
      ...e,
      target: {
        ...e.target,
        name: 'cc',
        value: e.target.value.split(',').map(email => email.trim())
      }
    };
    onChange(event as any);
  };

  const handleBccChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const event = {
      ...e,
      target: {
        ...e.target,
        name: 'bcc',
        value: e.target.value.split(',').map(email => email.trim())
      }
    };
    onChange(event as any);
  };

  return (
    <div className="space-y-4">
      {/* From Field (Disabled) */}
      <div>
        <Input
          value={userEmail || ''}
          disabled
          className="bg-gray-100"
        />
      </div>
      
      {/* To Field with CC/BCC Toggle Buttons */}
      <div className="flex items-center">
        <Input
          placeholder="To"
          name="to"
          value={email.to}
          onChange={onChange}
        />
        <Button 
          variant="ghost" 
          className="ml-2"
          onClick={onToggleCc}
          type="button"
        >
          Cc
        </Button>
        <Button 
          variant="ghost"
          onClick={onToggleBcc}
          type="button"
        >
          Bcc
        </Button>
      </div>
      
      {/* CC Field */}
      {showCc && (
        <div className="flex items-center">
          <Input
            placeholder="Cc (separate multiple emails with commas)"
            name="cc"
            value={ccValue}
            onChange={handleCcChange}
          />
        </div>
      )}
      
      {/* BCC Field */}
      {showBcc && (
        <div className="flex items-center">
          <Input
            placeholder="Bcc (separate multiple emails with commas)"
            name="bcc"
            value={bccValue}
            onChange={handleBccChange}
          />
        </div>
      )}
      
      {/* Subject Field */}
      <Input
        placeholder="Subject"
        name="subject"
        value={email.subject}
        onChange={onChange}
      />
      
      {/* Content Field */}
      <textarea
        className="w-full h-64 p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Compose email"
        name="content"
        value={email.content}
        onChange={onChange}
      />
    </div>
  );
};