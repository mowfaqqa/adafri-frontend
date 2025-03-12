"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useEmailStore } from "@/store/email-store";
import { sendEmail } from "@/app/dashboard/api/emailSend";
import { saveDraft } from "@/app/dashboard/api/draftEmail";

// import { sendEmailAPI } from "@/app/dashboard/api/email-send";


// Type definitions to match your API function
interface EmailData {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  signature?: string;
  email_id: string;
}

interface Email {
  from: string;
  to: string;
  subject: string;
  content: string;
  hasAttachment: boolean;
  status: string;
}

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

console.log("sendEmail:", sendEmail);

export const ComposeModal = ({ isOpen, onClose }: ComposeModalProps) => {
  const { addEmail, draftEmail, updateDraft } = useEmailStore();
  const [emails, setEmails] = useState<Email[]>([]);
  const [userEmail, setUserEmail] = useState('');

  const [email, setEmail] = useState({
    to: draftEmail?.to || "",
    subject: draftEmail?.subject || "",
    content: draftEmail?.content || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize form with draft content when isOpen changes
  useEffect(() => {
    if (isOpen && draftEmail) {
      setEmail({
        to: draftEmail.to || "",
        subject: draftEmail.subject || "",
        content: draftEmail.content || "",
      });
    }
  }, [isOpen, draftEmail]);

  // Auto-save draft at interval
  useEffect(() => {
    const autosaveInterval = setInterval(() => {
      if (isOpen && (email.to || email.subject || email.content)) {
        updateDraft({
          to: email.to,
          subject: email.subject,
          content: email.content,
          status: "draft",
        });
      }
    }, 5000);

    return () => clearInterval(autosaveInterval);
  }, [isOpen, email, updateDraft]);

  // Fetch user email on component mount
  
  useEffect(() => {
    // No need for async here since localStorage is synchronous
    const getUserEmail = () => {
      try {
        // First try to get from localStorage
        const storedEmail = localStorage.getItem('userEmail');
  
        if (storedEmail) {
          setUserEmail(storedEmail);
        } else {
          // If not in localStorage, default to fallback
          setUserEmail('danielodedara@gmail.com');
        }
      } catch (error) {
        console.error('Failed to get user email:', error);
        setUserEmail('danielodedara@gmail.com');
      }
    };
  
    // Call the function to execute it
    getUserEmail();
  }, []);

  // Fetch sent emails from localStorage
  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const savedEmails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
        if (savedEmails.length > 0) {
          setEmails(savedEmails);
        }
      } catch (error) {
        console.error('Failed to fetch emails:', error);
      }
    };

    fetchEmails();
  }, []);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEmail(prev => ({ ...prev, [name]: value }));
  };

  // Function for Send Email
  const handleSend = async () => {
    // Get the linked email ID from storage
    const emailId = localStorage.getItem('linkedEmailId');

    // More comprehensive validation
    if (!email.to.trim()) {
      setError("Recipient email is required");
      return;
    }

    if (!email.subject.trim()) {
      setError("Subject is required");
      return;
    }

    if (!email.content.trim()) {
      setError("Email content cannot be empty");
      return;
    }

    // Email format validation (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.to.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    if (!emailId) {
      // Handle the case where no email has been linked
      setError('Please link an email account first');
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create a structured request object matching your EmailData interface
      const emailData: EmailData = {
        to: email.to.trim(),
        subject: email.subject.trim(),
        body: email.content.trim(),
        email_id: emailId,
        // Optional fields will be handled by your sendEmail function
      };

      // Use your existing sendEmail function
      const response = await sendEmail(emailData);

      // Only add to local state if the API call succeeded
      const newEmail: Email = {
        from: userEmail,
        to: email.to,
        subject: email.subject,
        content: email.content,
        hasAttachment: false,
        status: "sent",
      };

      // Update the store state using addEmail
      // addEmail(newEmail);

      // Update local component state
      setEmails(prevEmails => [...prevEmails, newEmail]);

      // Save to localStorage for persistence between refreshes
      const savedEmails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
      savedEmails.push(newEmail);
      localStorage.setItem('sentEmails', JSON.stringify(savedEmails));

      // Clear draft if it exists
      updateDraft(null);

      // Reset form and close modal
      setEmail({ to: "", subject: "", content: "" });
      onClose();
    } catch (error: any) {
      console.error("Error in handleSend:", error);

      // More descriptive error message
      if (error.message.includes("401") || error.message.includes("auth")) {
        setError("Authentication failed. Your session may have expired.");
      } else if (error.message.includes("429")) {
        setError("Too many requests. Please try again later.");
      } else {
        setError(error.message || "Failed to send email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle save as draft
  const handleSaveAsDraft = () => {
    if (email.to || email.subject || email.content) {
      updateDraft({
        to: email.to,
        subject: email.subject,
        content: email.content,
        status: "draft",
      });
      onClose();
    }
  };

  // Only render if modal is open
  if (!isOpen) return null;


  // New function for Send Later
  const handleSendLater = async () => {
    if (!email.to.trim() && !email.subject.trim() && !email.content.trim()) {
      // Don't save empty drafts
      return;
    }

    setLoading(true);
    setError("");

    // Save as draft
    try {
      // Create a structured request object
      const draftData = {
        to: email.to.trim(),
        cc: undefined,
        bcc: undefined,
        subject: email.subject.trim(),
        content: email.content.trim(),
        signature: undefined,
        email_id: "0771ca4a-d380-4efc-bde1-6f1241b51a58",
      };

      // Save to server
      await saveDraft(draftData);

      // Save as draft locally
      addEmail({
        from: "danielodedara@gmail.com",
        to: email.to,
        subject: email.subject,
        content: email.content,
        hasAttachment: false,
        status: "draft",
        // timestamp: new Date().toISOString(),
      });

      // Update draft in store
      updateDraft({
        to: email.to,
        subject: email.subject,
        content: email.content,
        status: "draft",
      });

      // Close modal
      setEmail({ to: "", subject: "", content: "" });
      onClose();
    } catch (error: any) {
      console.error("Error saving draft:", error);
      setError(error.message || "Failed to save draft. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Input
              value={localStorage.getItem('userEmail') || ''}
              disabled
              className="bg-gray-100"
            />
          </div>
          <div className="flex items-center">
            <Input
              placeholder="To"
              value={email.to}
              onChange={(e) => setEmail({ ...email, to: e.target.value })}
            />
            <Button variant="ghost" className="ml-2">Cc</Button>
            <Button variant="ghost">Bcc</Button>
          </div>
          <Input
            placeholder="Subject"
            value={email.subject}
            onChange={(e) => setEmail({ ...email, subject: e.target.value })}
          />
          <textarea
            className="w-full h-64 p-2 border rounded-md"
            placeholder="Compose email"
            value={email.content}
            onChange={(e) => setEmail({ ...email, content: e.target.value })}
          />
          <div className="flex justify-end gap-x-2 items-center">
            <Button
              onClick={handleSend}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Email'}
            </Button>
            <Button variant="outline" onClick={handleSendLater} disabled={loading}>Send Later</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
