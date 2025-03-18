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
import { sendEmail, getAccessToken } from "@/app/dashboard/api/emailSend";
import { saveDraft } from "@/app/dashboard/api/draftEmail";
import { Email, EmailData } from '@/lib/types/email';
// import { sendEmailAPI } from "@/app/dashboard/api/email-send";

// Type definitions to match your API function
interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

console.log("sendEmail:", sendEmail);

export const ComposeModal = ({ isOpen, onClose }: ComposeModalProps) => {
  const { draftEmail } = useEmailStore();
  // Get addEmail and updateDraft from the store
  const addEmail = useEmailStore((state) => state.addEmail);
  const updateDraft = useEmailStore((state) => state.updateDraft);

  const [emails, setEmails] = useState<Email[]>([]);
  const [userEmail, setUserEmail] = useState('');

  const [email, setEmail] = useState({
    to: draftEmail?.to || "",
    subject: draftEmail?.subject || "",
    content: draftEmail?.content || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [accessToken, setAccessToken] = useState('');
  const [linkedEmailId, setLinkedEmailId] = useState<string | null>(null);

  // Combined useEffect for initialization
  useEffect(() => {
    // Initialize the token from localStorage when component mounts
    if (typeof window !== 'undefined') {
      // Get and set access token
      const token = getAccessToken();
      if (token) {
        setAccessToken(token);
        console.log("Token loaded from localStorage:", `${token.substring(0, 10)}...`);
      } else {
        console.error("No access token found in localStorage");
      }

      // Check if email ID is already stored
      const emailId = localStorage.getItem('linkedEmailId');
      if (emailId) {
        setLinkedEmailId(emailId);
        console.log('Currently linked email ID:', emailId);
      } else {
        console.log('No linked email ID found in localStorage');
      }
    }
  }, []);

  // Set access token on component mount and check for linked email ID
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setAccessToken(token);
      console.log('Access token found in localStorage');
    } else {
      console.log('No access token found in localStorage');
    }

    // Check if email ID is already stored
    const linkedEmailId = localStorage.getItem('linkedEmailId');
    console.log('Currently linked email ID:', linkedEmailId);
  }, []);

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
    console.log("handleSend function called");

    // Get the linked email ID from storage
    const emailId = localStorage.getItem('linkedEmailId');
    console.log("Linked email ID from localStorage:", emailId);


    // More comprehensive validation
    if (!email.to.trim()) {
      console.log("Validation failed: Recipient email is empty");
      setError("Recipient email is required");
      return;
    }

    if (!email.subject.trim()) {
      console.log("Validation failed: Subject is empty");
      setError("Subject is required");
      return;
    }

    if (!email.content.trim()) {
      console.log("Validation failed: Content is empty");
      setError("Email content cannot be empty");
      return;
    }

    // Email format validation (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.to.trim())) {
      console.log("Validation failed: Invalid email format", email.to);
      setError("Please enter a valid email address");
      return;
    }

    if (!emailId) {
      console.log("Validation failed: No linked email ID found");
      setError('Please link an email account first');
      return;
    }

    setLoading(true);
    setError("");

    // Get user signature if available
    const userSignature = localStorage.getItem('userSignature') || undefined;

    console.log("Starting email send process with data:", {
      to: email.to,
      subject: email.subject,
      contentLength: email.content.length,
      emailId: emailId
    });

    try {
      // Create a structured request object matching your EmailData interface
      const emailData: EmailData = {
        to: email.to.trim(),
        subject: email.subject.trim(),
        content: email.content.trim(),
        email_id: emailId,
        cc: undefined,
        bcc: undefined,
        signature: userSignature
      };

      // Use your existing sendEmail function
      console.log("Calling sendEmail function");
      const response = await sendEmail(emailData);
      console.log("sendEmail response received:", response);

      // Only add to local state if the API call succeeded
      const newEmail: Email = {
        from: userEmail,
        to: email.to,
        subject: email.subject,
        content: email.content,
        hasAttachment: false,
        status: "sent",
      };

      // Try to update the store state using addEmail
      try {
        if (typeof addEmail === 'function') {
          console.log("Adding email to global store");
          addEmail(newEmail);
        }
      } catch (storeError) {
        console.error("Error adding email to store:", storeError);
      }

      // Update local component state
      console.log("Updating local component state with new email");
      setEmails(prevEmails => [...prevEmails, newEmail]);

      // Save to localStorage for persistence between refreshes
      console.log("Saving email to localStorage");
      const savedEmails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
      savedEmails.push(newEmail);
      localStorage.setItem('sentEmails', JSON.stringify(savedEmails));

      // Clear draft if it exists
      console.log("Clearing any existing draft");
      if (typeof updateDraft === 'function') {
        updateDraft(null);
      }

      // Reset form and close modal
      console.log("Resetting form and closing modal");
      setEmail({ to: "", subject: "", content: "" });
      onClose();
    } catch (error: any) {
      console.error("Error in handleSend:", error);

      // More descriptive error message
      if (error.message?.includes("401") || error.message?.includes("auth")) {
        setError("Authentication failed. Your session may have expired.");
      } else if (error.message?.includes("429")) {
        setError("Too many requests. Please try again later.");
      } else {
        setError(error.message || "Failed to send email. Please try again.");
      }
    } finally {
      setLoading(false);
      console.log("handleSend process completed");
    }
  };

  // Only render if modal is open
  if (!isOpen) return null;


  // New function for Send Later
  // const handleSendLater = async () => {
  //   if (!email.to.trim() && !email.subject.trim() && !email.content.trim()) {
  //     // Don't save empty drafts
  //     return;
  //   }

  //   setLoading(true);
  //   setError("");

  //   // Save as draft
  //   try {
  //     // Create a structured request object
  //     const draftData = {
  //       to: email.to.trim(),
  //       cc: undefined,
  //       bcc: undefined,
  //       subject: email.subject.trim(),
  //       content: email.content.trim(),
  //       signature: undefined,
  //       email_id: "0771ca4a-d380-4efc-bde1-6f1241b51a58",
  //     };

  //     // Save to server
  //     await saveDraft(draftData);

  //     // Save as draft locally
  //     addEmail({
  //       from: "danielodedara@gmail.com",
  //       to: email.to,
  //       subject: email.subject,
  //       content: email.content,
  //       hasAttachment: false,
  //       status: "draft",
  //       // timestamp: new Date().toISOString(),
  //     });

  //     // Update draft in store
  //     updateDraft({
  //       to: email.to,
  //       subject: email.subject,
  //       content: email.content,
  //       status: "draft",
  //     });

  //     // Close modal
  //     setEmail({ to: "", subject: "", content: "" });
  //     onClose();
  //   } catch (error: any) {
  //     console.error("Error saving draft:", error);
  //     setError(error.message || "Failed to save draft. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  // const handleSendLater = async () => {
  //   if (!email.to.trim() && !email.subject.trim() && !email.content.trim()) {
  //     console.log("Skipping save: Empty draft");
  //     return;
  //   }




  //   setLoading(true);
  //   setError("");

  //   const emailId = localStorage.getItem("linkedEmailId");
  //   if (!emailId) {
  //     console.error("No linked email ID found. Draft cannot be saved.");
  //     setError("Please link an email account first.");
  //     setLoading(false);
  //     return;
  //   }

  //   // Prepare draft data
  //   const draftData: EmailData = {
  //     to: email.to.trim(),
  //     cc: undefined,
  //     bcc: undefined,
  //     subject: email.subject.trim(),
  //     body: email.content.trim(),
  //     signature: undefined,
  //     email_id: emailId,
  //   };

  //   // Local draft structure
  //   const newDraft: Email = {
  //     id: emailId, // Ensure ID is stored properly
  //     from: userEmail,
  //     to: email.to,
  //     subject: email.subject,
  //     content: email.content,
  //     hasAttachment: false,
  //     status: "draft",
  //     timestamp: new Date().toLocaleString(),
  //     isUrgent: false,
  //     category: "drafts",
  //   };

  //   try {
  //     if (accessToken) {
  //       console.log("Saving draft via API...");
  //       await draftEmail(draftData);
  //     } else {
  //       console.warn("No access token found, skipping API save");
  //     }

  //     console.log("Saving draft locally...");
  //     console.log("Calling addEmail with:", newDraft);
  //     addEmail(newDraft); // Save to store

  //     console.log("Calling updateDraft with:", newDraft);
  //     updateDraft(newDraft); // Update UI state

  //     // Save to localStorage for persistence
  //     const savedDrafts = JSON.parse(localStorage.getItem("draftEmails") || "[]");
  //     savedDrafts.push(newDraft);
  //     localStorage.setItem("draftEmails", JSON.stringify(savedDrafts));

  //     setEmail({ to: "", subject: "", content: "" });
  //     onClose();
  //   } catch (error: any) {
  //     console.error("Error saving draft:", error);
  //     setError(error.message || "Failed to save draft. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  // const handleSendLater = async () => {
  //   if (!email.to.trim() && !email.subject.trim() && !email.content.trim()) {
  //     // Don't save empty drafts
  //     return;
  //   }

  //   setLoading(true);
  //   setError("");

  //   // Retrieve email_id from localStorage
  //   const emailId = localStorage.getItem("linkedEmailId") || crypto.randomUUID();

  //   // Create a structured request object
  //   const draftData = {
  //     to: email.to.trim(),
  //     cc: undefined,
  //     bcc: undefined,
  //     subject: email.subject.trim(),
  //     body: email.content.trim(), // API expects 'body' instead of 'content'
  //     signature: undefined,
  //     email_id: emailId, // Use email_id from localStorage
  //   };

  //   try {
  //     // Try saving to the server
  //     await saveDraft(draftData);
  //     console.log("✅ Draft saved to server.");
  //   } catch (error: any) {
  //     console.error("❌ API failed, saving draft locally:", error);

  //     // Save as a local draft if the API fails
  //     addEmail({
  //       from: "danielodedara@gmail.com",
  //       to: email.to,
  //       subject: email.subject,
  //       content: email.content,
  //       hasAttachment: false,
  //       status: "draft",
  //     });

  //     // Update draft in store
  //     updateDraft({
  //       to: email.to,
  //       subject: email.subject,
  //       content: email.content,
  //       status: "draft",
  //     });

  //     setError("Draft saved locally due to network issue.");
  //   } finally {
  //     // Reset form & close modal
  //     setEmail({ to: "", subject: "", content: "" });
  //     onClose();
  //     setLoading(false);
  //   }
  // };

  const handleSendLater = async () => {
    if (!email.to.trim() && !email.subject.trim() && !email.content.trim()) {
      return; // Don't save empty drafts
    }
  
    setLoading(true);
    setError("");
  
    // Get or generate email_id
    let emailId = localStorage.getItem("linkedEmailId") || "";
    if (!emailId) {
      emailId = crypto.randomUUID(); // Generate new ID
      localStorage.setItem("linkedEmailId", emailId);
    }
  
    // Prepare draft data
    const draftData = {
      to: email.to.trim() || "", 
      subject: email.subject.trim() || "",
      content: email.content.trim() || "", // ✅ API expects "content", not "body"
      email_id: emailId, 
    };
  
    console.log("📤 Sending draft:", JSON.stringify(draftData, null, 2));
  
    try {
      await saveDraft(draftData);
      console.log("✅ Draft saved to server.");
    } catch (error: any) {
      console.error("❌ API failed, saving draft locally:", error);
  
      // Save draft locally
      addEmail({
        from: "danielodedara@gmail.com",
        to: email.to,
        subject: email.subject,
        content: email.content,
        hasAttachment: false,
        status: "draft",
      });
  
      updateDraft({
        to: email.to,
        subject: email.subject,
        content: email.content,
        status: "draft",
      });
  
      setError("Draft saved locally due to network issue.");
    } finally {
      setEmail({ to: "", subject: "", content: "" });
      onClose();
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
              value={localStorage.getItem('userEmail') || 'danielodedara@gmail.com'}
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
