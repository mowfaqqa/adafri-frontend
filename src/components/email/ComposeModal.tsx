"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useContext } from "react";
import { useEmailStore } from "@/lib/store/email-store";
import { sendEmail } from "@/app/dashboard/api/emailSend";
import { saveDraft } from "@/app/dashboard/api/draftEmail";
import { Email, EmailData, EmailSendData, EmailSegment } from '@/lib/types/email';
import { getCookie, getUserInfo, getAuthToken } from "@/lib/utils/cookies";
import { AuthContext } from "@/lib/context/auth";

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editMode?: boolean;
  draftEmail?: Email | null;
  onSaveDraft?: (email: Email) => void;
}

export const ComposeModal = ({ isOpen, onClose, editMode = false, draftEmail = null }: ComposeModalProps) => {
  const { draftEmail: storeDraftEmail } = useEmailStore();
  // Get addEmail and updateDraft from the store
  const addEmail = useEmailStore((state) => state.addEmail);
  const updateDraft = useEmailStore((state) => state.updateDraft);

  const [emails, setEmails] = useState<Email[]>([]);
  const [userEmail, setUserEmail] = useState('');

  // Initialize the email state with either provided draftEmail or store draftEmail
  interface EmailProps{
    id: string,
    to: string,
    cc: string[],
    bcc: string[],
    subject: string,
    content: string,
  }
  const [email, setEmail] = useState<EmailProps>({
    id: "",
    to: "",
    cc: [],
    bcc: [],
    subject: "",
    content: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // UI state for toggling CC and BCC fields
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  const [accessToken, setAccessToken] = useState('');
  const [linkedEmailId, setLinkedEmailId] = useState<string | null>(null);

  // Combined useEffect for initialization
  useEffect(() => {
    // Get access token from cookies
    const userInfo = getUserInfo();
    if (userInfo.accessToken) {
      setAccessToken(userInfo.accessToken);
      console.log("Token loaded from cookies:", `${userInfo.accessToken.substring(0, 10)}...`);
    } else {
      console.error("No access token found in cookies");
    }

    // Check if email ID is already stored in cookies
    const emailId = getCookie('linkedEmailId');
    if (emailId) {
      setLinkedEmailId(emailId);
      console.log('Currently linked email ID:', emailId);
    } else {
      console.log('No linked email ID found in cookies');
    }

    // Set user email from cookies
    if (userInfo.email) {
      setUserEmail(userInfo.email);
    } else {
      setUserEmail('user@gmail.com'); // Fallback
    }
  }, []);

  // Initialize form with draft content when isOpen changes or draft data is provided
  useEffect(() => {
    if (isOpen) {
      // Priority order: passed draftEmail prop > storeDraftEmail > empty form
      if (draftEmail) {
        setEmail({
          id: draftEmail.id || "",
          to: draftEmail.to || "",
          cc: draftEmail.cc || [],
          bcc: draftEmail.bcc || [],
          subject: draftEmail.subject || "",
          content: draftEmail.content || "",
        });
        // Show CC/BCC fields if they have content
        setShowCc(!!draftEmail.cc);
        setShowBcc(!!draftEmail.bcc);
        console.log("ComposeModal: Initialized with passed draft data", draftEmail);
      } else if (storeDraftEmail) {
        setEmail({
          id: storeDraftEmail.id || "",
          to: storeDraftEmail.to || "",
          cc: storeDraftEmail.cc || "",
          bcc: storeDraftEmail.bcc || "",
          subject: storeDraftEmail.subject || "",
          content: storeDraftEmail.content || "",
        });
        // Show CC/BCC fields if they have content
        setShowCc(!!storeDraftEmail.cc);
        setShowBcc(!!storeDraftEmail.bcc);
        console.log("ComposeModal: Initialized with store draft data", storeDraftEmail);
      } else {
        setEmail({ id: "", to: "", cc: [], bcc: [], subject: "", content: "" });
        setShowCc(false);
        setShowBcc(false);
        console.log("ComposeModal: Initialized with empty form");
      }
    }
  }, [isOpen, draftEmail, storeDraftEmail]);

  // Auto-save draft at interval
  useEffect(() => {
    const autosaveInterval = setInterval(() => {
      if (isOpen && (email.to || email.cc || email.bcc || email.subject || email.content)) {
        updateDraft({
          id: email.id,
          to: email.to,
          cc: email.cc,
          bcc: email.bcc,
          subject: email.subject,
          content: email.content,
          status: "draft",
        });
      }
    }, 5000);

    return () => clearInterval(autosaveInterval);
  }, [isOpen, email, updateDraft]);

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

  // Parse comma-separated email strings into arrays for API
  const parseEmails = (emailStrings: string[]): string[] => {
    // Check if emailStrings is null, undefined or not an array
    if (!emailStrings || !Array.isArray(emailStrings) || emailStrings.length === 0) {
      return [];
    }
    
    // Use a standard map and reduce approach instead of flatMap
    return emailStrings
      .reduce((acc: string[], emailString: string) => {
        if (typeof emailString === 'string') {
          const emails = emailString
            .split(',')
            .map(email => email.trim())
            .filter(email => email !== '');
          
          return [...acc, ...emails];
        }
        return acc;
      }, []);
  };

  // Email format validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Function for Send Email
  const handleSend = async () => {
    // const accessToken = getAuthToken();
    const { token, user } = useContext(AuthContext);
    console.log("handleSend function called");

    // Get the linked email ID from cookies
    const emailId = getCookie('linkedEmailId');
    console.log("Linked email ID from cookies:", emailId);

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

    // Email format validation for to field
    if (!validateEmail(email.to.trim())) {
      console.log("Validation failed: Invalid email format", email.to);
      setError("Please enter a valid email address for recipient");
      return;
    }

    // Validate CC emails if present
    if (showCc && email.cc) {
      const ccEmails = parseEmails(email.cc);
      for (const ccEmail of ccEmails) {
        if (!validateEmail(ccEmail)) {
          console.log("Validation failed: Invalid CC email format", ccEmail);
          setError(`Invalid CC email format: ${ccEmail}`);
          return;
        }
      }
    }

    // Validate BCC emails if present
    if (showBcc && email.bcc) {
      const bccEmails = parseEmails(email.bcc);
      for (const bccEmail of bccEmails) {
        if (!validateEmail(bccEmail)) {
          console.log("Validation failed: Invalid BCC email format", bccEmail);
          setError(`Invalid BCC email format: ${bccEmail}`);
          return;
        }
      }
    }

    if (!emailId) {
      console.log("Validation failed: No linked email ID found");
      setError('Please link an email account first');
      return;
    }

    setLoading(true);
    setError("");

    // Get user signature if available
    const userSignature = getCookie('userSignature') ?? undefined;

    console.log("Starting email send process with data:", {
      to: email.to,
      cc: showCc ? email.cc : undefined,
      bcc: showBcc ? email.bcc : undefined,
      subject: email.subject,
      contentLength: email.content.length,
      emailId: emailId
    });

    try {
      // If this is an edit of a draft, delete the draft first
      if (editMode && email.id) {
        try {
          console.log("Edit mode: deleting existing draft before sending", email.id);
          // const token = getAuthToken();
          const { token, user } = useContext(AuthContext);
          
          if (token && emailId) {
            await fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/${email.id}?email_id=${encodeURIComponent(emailId)}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token.access_token}`,
                'Content-Type': 'application/json'
              }
            });
          }
        } catch (deleteError) {
          console.error("Error deleting draft before sending:", deleteError);
          // Continue with sending even if deletion fails
        }
      }

      // Parse CC and BCC emails into arrays
      const ccArray = showCc ? parseEmails(email.cc) : [];
      const bccArray = showBcc ? parseEmails(email.bcc) : [];

      // Create a structured request object matching your EmailData interface
      const emailData = {
        to: email.to.trim(),
        cc: ccArray.length > 0 ? ccArray : null,
        bcc: bccArray.length > 0 ? bccArray : null,
        subject: email.subject.trim(),
        content: email.content.trim(),
        email_id: emailId,
        signature: null, // Keep signature as null as requested
        inbox: false,  // or appropriate value
        sent: true,    // since this is being sent
        draft: false,  // not a draft
        spam: false,   // not spam
      };

      // Use your existing sendEmail function
      console.log("Calling sendEmail function");
      const response = await sendEmail(emailData);
      console.log("sendEmail response received:", response);

      // Only add to local state if the API call succeeded
      const newEmail: Email = {
        from: userEmail,
        to: email.to,
        cc: showCc ? email.cc : undefined,
        bcc: showBcc ? email.bcc : undefined,
        subject: email.subject,
        content: email.content,
        hasAttachment: false,
        status: "sent" as EmailSegment,
        email_id: emailId,  // Add the email ID
        timestamp: new Date().toISOString(), // Changed from createdAt to timestamp
        contentType: 'text', // Required property 
        isUrgent: false,    // Required property
        category: "sent",   // Required property
        isRead: true,       // Required property
        id: `sent-${Date.now()}` // Required property
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
      setEmail({ id: "", to: "", cc: [], bcc: [], subject: "", content: "" });
      setShowCc(false);
      setShowBcc(false);
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

  const handleSendLater = async () => {
    if (!email.to.trim() && !email.subject.trim() && !email.content.trim()) {
      return; // Don't save empty drafts
    }
  
    setLoading(true);
    setError("");
  
    // Get email_id from cookies
    const emailId = getCookie('linkedEmailId') || "";
    if (!emailId) {
      // If no linkedEmailId found, we can't save the draft to the server
      console.log("No linked email ID found in cookies");
    }

    // Parse CC and BCC emails into arrays for the API
    const ccArray = showCc && email.cc ? parseEmails(email.cc) : null;
    const bccArray = showBcc && email.bcc ? parseEmails(email.bcc) : null;
  
    // Prepare draft data to match EmailSendData interface
    const draftData: EmailSendData = {
      to: email.to.trim() || "",
      cc: ccArray,
      bcc: bccArray,
      subject: email.subject.trim() || "",
      content: email.content.trim() || "",
      email_id: emailId,
      signature: null // Keep signature as null as requested
    };
  
    console.log("📤 Sending draft:", JSON.stringify(draftData, null, 2));
  
    try {
      if (emailId) {
        await saveDraft(draftData);
        console.log("✅ Draft saved to server.");
      } else {
        throw new Error("No linked email ID available");
      }
    } catch (error: any) {
      console.error("❌ API failed, saving draft locally:", error);
  
      // Save draft locally
      addEmail({
        from: userEmail || "",
        to: email.to,
        cc: showCc ? email.cc : undefined,
        bcc: showBcc ? email.bcc : undefined,
        subject: email.subject,
        content: email.content,
        contentType: 'text',
        hasAttachment: false,
        isRead: true,
        status: "draft" as EmailSegment,
        email_id: emailId || null
      });
  
      updateDraft({
        id: email.id,
        to: email.to,
        cc: showCc ? email.cc : undefined,
        bcc: showBcc ? email.bcc : undefined,
        subject: email.subject,
        content: email.content,
        status: "draft",
      });
  
      setError("Draft saved locally due to network issue.");
    } finally {
      setEmail({ id: "", to: "", cc: [], bcc: [], subject: "", content: "" });
      setShowCc(false);
      setShowBcc(false);
      onClose();
      setLoading(false);
    }
  };
  
  // Update dialog title based on mode
  const dialogTitle = editMode ? "Edit Draft" : "Compose Email";
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Input
              value={userEmail || ''}
              disabled
              className="bg-gray-100"
            />
          </div>
          <div className="flex items-center">
            <Input
              placeholder="To"
              name="to"
              value={email.to}
              onChange={handleChange}
            />
            <Button 
              variant="ghost" 
              className="ml-2"
              onClick={() => setShowCc(!showCc)}
              type="button"
            >
              Cc
            </Button>
            <Button 
              variant="ghost"
              onClick={() => setShowBcc(!showBcc)}
              type="button"
            >
              Bcc
            </Button>
          </div>
          
          {showCc && (
            <div className="flex items-center">
              <Input
                placeholder="Cc (separate multiple emails with commas)"
                name="cc"
                value={email.cc}
                onChange={handleChange}
              />
            </div>
          )}
          
          {showBcc && (
            <div className="flex items-center">
              <Input
                placeholder="Bcc (separate multiple emails with commas)"
                name="bcc"
                value={email.bcc}
                onChange={handleChange}
              />
            </div>
          )}
          
          <Input
            placeholder="Subject"
            name="subject"
            value={email.subject}
            onChange={handleChange}
          />
          <textarea
            className="w-full h-64 p-2 border rounded-md"
            placeholder="Compose email"
            name="content"
            value={email.content}
            onChange={handleChange}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
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























































// "use client";

// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { useEffect, useState } from "react";
// import { useEmailStore } from "@/store/email-store";
// import { sendEmail } from "@/app/dashboard/api/emailSend";
// import { saveDraft } from "@/app/dashboard/api/draftEmail";
// import { Email, EmailData, EmailSendData, EmailSegment } from '@/lib/types/email';
// import { getCookie, getUserInfo, getAuthToken } from "@/lib/utils/cookies";

// interface ComposeModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   editMode?: boolean;
//   draftEmail?: Email | null;
//   onSaveDraft?: (email: Email) => void;
// }

// export const ComposeModal = ({ isOpen, onClose, editMode = false, draftEmail = null }: ComposeModalProps) => {
//   const { draftEmail: storeDraftEmail } = useEmailStore();
//   // Get addEmail and updateDraft from the store
//   const addEmail = useEmailStore((state) => state.addEmail);
//   const updateDraft = useEmailStore((state) => state.updateDraft);

//   const [emails, setEmails] = useState<Email[]>([]);
//   const [userEmail, setUserEmail] = useState('');

//   // Initialize the email state with either provided draftEmail or store draftEmail
//   const [email, setEmail] = useState({
//     id: "",
//     to: "",
//     subject: "",
//     content: "",
//   });
  
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [accessToken, setAccessToken] = useState('');
//   const [linkedEmailId, setLinkedEmailId] = useState<string | null>(null);

//   // Combined useEffect for initialization
//   useEffect(() => {
//     // Get access token from cookies
//     const userInfo = getUserInfo();
//     if (userInfo.accessToken) {
//       setAccessToken(userInfo.accessToken);
//       console.log("Token loaded from cookies:", `${userInfo.accessToken.substring(0, 10)}...`);
//     } else {
//       console.error("No access token found in cookies");
//     }

//     // Check if email ID is already stored in cookies
//     const emailId = getCookie('linkedEmailId');
//     if (emailId) {
//       setLinkedEmailId(emailId);
//       console.log('Currently linked email ID:', emailId);
//     } else {
//       console.log('No linked email ID found in cookies');
//     }

//     // Set user email from cookies
//     if (userInfo.email) {
//       setUserEmail(userInfo.email);
//     } else {
//       setUserEmail('danielodedara@gmail.com'); // Fallback
//     }
//   }, []);

//   // Initialize form with draft content when isOpen changes or draft data is provided
//   useEffect(() => {
//     if (isOpen) {
//       // Priority order: passed draftEmail prop > storeDraftEmail > empty form
//       if (draftEmail) {
//         setEmail({
//           id: draftEmail.id || "",
//           to: draftEmail.to || "",
//           subject: draftEmail.subject || "",
//           content: draftEmail.content || "",
//         });
//         console.log("ComposeModal: Initialized with passed draft data", draftEmail);
//       } else if (storeDraftEmail) {
//         setEmail({
//           id: storeDraftEmail.id || "",
//           to: storeDraftEmail.to || "",
//           subject: storeDraftEmail.subject || "",
//           content: storeDraftEmail.content || "",
//         });
//         console.log("ComposeModal: Initialized with store draft data", storeDraftEmail);
//       } else {
//         setEmail({ id: "", to: "", subject: "", content: "" });
//         console.log("ComposeModal: Initialized with empty form");
//       }
//     }
//   }, [isOpen, draftEmail, storeDraftEmail]);

//   // Auto-save draft at interval
//   useEffect(() => {
//     const autosaveInterval = setInterval(() => {
//       if (isOpen && (email.to || email.subject || email.content)) {
//         updateDraft({
//           id: email.id,
//           to: email.to,
//           subject: email.subject,
//           content: email.content,
//           status: "draft",
//         });
//       }
//     }, 5000);

//     return () => clearInterval(autosaveInterval);
//   }, [isOpen, email, updateDraft]);

//   // Fetch sent emails from localStorage
//   useEffect(() => {
//     const fetchEmails = async () => {
//       try {
//         const savedEmails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
//         if (savedEmails.length > 0) {
//           setEmails(savedEmails);
//         }
//       } catch (error) {
//         console.error('Failed to fetch emails:', error);
//       }
//     };

//     fetchEmails();
//   }, []);

//   // Handle form input changes
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setEmail(prev => ({ ...prev, [name]: value }));
//   };

//   // Function for Send Email
//   const handleSend = async () => {
//     const accessToken = getAuthToken();
//     console.log("handleSend function called");

//     // Get the linked email ID from cookies
//     const emailId = getCookie('linkedEmailId');
//     console.log("Linked email ID from cookies:", emailId);

//     // More comprehensive validation
//     if (!email.to.trim()) {
//       console.log("Validation failed: Recipient email is empty");
//       setError("Recipient email is required");
//       return;
//     }

//     if (!email.subject.trim()) {
//       console.log("Validation failed: Subject is empty");
//       setError("Subject is required");
//       return;
//     }

//     if (!email.content.trim()) {
//       console.log("Validation failed: Content is empty");
//       setError("Email content cannot be empty");
//       return;
//     }

//     // Email format validation (basic)
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email.to.trim())) {
//       console.log("Validation failed: Invalid email format", email.to);
//       setError("Please enter a valid email address");
//       return;
//     }

//     if (!emailId) {
//       console.log("Validation failed: No linked email ID found");
//       setError('Please link an email account first');
//       return;
//     }

//     setLoading(true);
//     setError("");

//     // Get user signature if available
//     const userSignature = getCookie('userSignature') ?? undefined;

//     console.log("Starting email send process with data:", {
//       to: email.to,
//       subject: email.subject,
//       contentLength: email.content.length,
//       emailId: emailId
//     });

//     try {
//       // If this is an edit of a draft, delete the draft first
//       if (editMode && email.id) {
//         try {
//           console.log("Edit mode: deleting existing draft before sending", email.id);
//           const token = getAuthToken();
          
//           if (token && emailId) {
//             await fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/${email.id}?email_id=${encodeURIComponent(emailId)}`, {
//               method: 'DELETE',
//               headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//               }
//             });
//           }
//         } catch (deleteError) {
//           console.error("Error deleting draft before sending:", deleteError);
//           // Continue with sending even if deletion fails
//         }
//       }

//       // Create a structured request object matching your EmailData interface
//       const emailData = {
//         to: email.to.trim(),
//         subject: email.subject.trim(),
//         content: email.content.trim(),
//         email_id: emailId,
//         cc: undefined,
//         bcc: undefined,
//         signature: undefined,
//         inbox: false,  // or appropriate value
//         sent: true,    // since this is being sent
//         draft: false,  // not a draft
//         spam: false,   // not spam
      
//       };

//       // Use your existing sendEmail function
//       console.log("Calling sendEmail function");
//       const response = await sendEmail(emailData);
//       console.log("sendEmail response received:", response);

//       // Only add to local state if the API call succeeded
//       const newEmail: Email = {
//         from: userEmail,
//         to: email.to,
//         subject: email.subject,
//         content: email.content,
//         hasAttachment: false,
//         status: "sent" as EmailSegment,
//         email_id: emailId,  // Add the email ID
//         timestamp: new Date().toISOString(), // Changed from createdAt to timestamp
//         contentType: 'text', // Required property 
//         isUrgent: false,    // Required property
//         category: "sent",   // Required property
//         isRead: true,       // Required property
//         id: `sent-${Date.now()}` // Required property
//       };

//       // Try to update the store state using addEmail
//       try {
//         if (typeof addEmail === 'function') {
//           console.log("Adding email to global store");
//           addEmail(newEmail);
//         }
//       } catch (storeError) {
//         console.error("Error adding email to store:", storeError);
//       }

//       // Update local component state
//       console.log("Updating local component state with new email");
//       setEmails(prevEmails => [...prevEmails, newEmail]);

//       // Save to localStorage for persistence between refreshes
//       console.log("Saving email to localStorage");
//       const savedEmails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
//       savedEmails.push(newEmail);
//       localStorage.setItem('sentEmails', JSON.stringify(savedEmails));

//       // Clear draft if it exists
//       console.log("Clearing any existing draft");
//       if (typeof updateDraft === 'function') {
//         updateDraft(null);
//       }

//       // Reset form and close modal
//       console.log("Resetting form and closing modal");
//       setEmail({ id: "", to: "", subject: "", content: "" });
//       onClose();
//     } catch (error: any) {
//       console.error("Error in handleSend:", error);

//       // More descriptive error message
//       if (error.message?.includes("401") || error.message?.includes("auth")) {
//         setError("Authentication failed. Your session may have expired.");
//       } else if (error.message?.includes("429")) {
//         setError("Too many requests. Please try again later.");
//       } else {
//         setError(error.message || "Failed to send email. Please try again.");
//       }
//     } finally {
//       setLoading(false);
//       console.log("handleSend process completed");
//     }
//   };

//   const handleSendLater = async () => {
//     if (!email.to.trim() && !email.subject.trim() && !email.content.trim()) {
//       return; // Don't save empty drafts
//     }
  
//     setLoading(true);
//     setError("");
  
//     // Get email_id from cookies
//     const emailId = getCookie('linkedEmailId') || "";
//     if (!emailId) {
//       // If no linkedEmailId found, we can't save the draft to the server
//       console.log("No linked email ID found in cookies");
//     }
  
//     // Prepare draft data to match EmailSendData interface
//     const draftData: EmailSendData = {
//       to: email.to.trim() || "",
//       subject: email.subject.trim() || "",
//       content: email.content.trim() || "",
//       email_id: emailId,
//       // Optional fields can be included if needed
//       cc: null,
//       bcc: null,
//       signature: null
//     };
  
//     console.log("📤 Sending draft:", JSON.stringify(draftData, null, 2));
  
//     try {
//       if (emailId) {
//         await saveDraft(draftData);
//         console.log("✅ Draft saved to server.");
//       } else {
//         throw new Error("No linked email ID available");
//       }
//     } catch (error: any) {
//       console.error("❌ API failed, saving draft locally:", error);
  
//       // Save draft locally
//       addEmail({
//         from: userEmail || "",
//         to: email.to,
//         subject: email.subject,
//         content: email.content,
//         contentType: 'text',
//         hasAttachment: false,
//         isRead: true,
//         status: "draft" as EmailSegment,
//         email_id: emailId || null
//       });
  
//       updateDraft({
//         id: email.id,
//         to: email.to,
//         subject: email.subject,
//         content: email.content,
//         status: "draft",
//       });
  
//       setError("Draft saved locally due to network issue.");
//     } finally {
//       setEmail({ id: "", to: "", subject: "", content: "" });
//       onClose();
//       setLoading(false);
//     }
//   };
  
//   // Update dialog title based on mode
//   const dialogTitle = editMode ? "Edit Draft" : "Compose Email";
  
//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-2xl">
//         <DialogHeader>
//           <DialogTitle>{dialogTitle}</DialogTitle>
//         </DialogHeader>
//         <div className="space-y-4">
//           <div>
//             <Input
//               value={userEmail || ''}
//               disabled
//               className="bg-gray-100"
//             />
//           </div>
//           <div className="flex items-center">
//             <Input
//               placeholder="To"
//               name="to"
//               value={email.to}
//               onChange={handleChange}
//             />
//             <Button variant="ghost" className="ml-2">Cc</Button>
//             <Button variant="ghost">Bcc</Button>
//           </div>
//           <Input
//             placeholder="Subject"
//             name="subject"
//             value={email.subject}
//             onChange={handleChange}
//           />
//           <textarea
//             className="w-full h-64 p-2 border rounded-md"
//             placeholder="Compose email"
//             value={email.content}
//             onChange={(e) => setEmail({ ...email, content: e.target.value })}
//           />
//           <div className="flex justify-end gap-x-2 items-center">
//             <Button
//               onClick={handleSend}
//               disabled={loading}
//             >
//               {loading ? 'Sending...' : 'Send Email'}
//             </Button>
//             <Button variant="outline" onClick={handleSendLater} disabled={loading}>Send Later</Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };



















// "use client";

// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { useEffect, useState } from "react";
// import { useEmailStore } from "@/store/email-store";
// import { sendEmail } from "@/app/dashboard/api/emailSend";
// import { saveDraft } from "@/app/dashboard/api/draftEmail";
// import { Email, EmailData } from '@/lib/types/email';
// import { getCookie, getUserInfo } from "@/lib/utils/cookies";

// interface ComposeModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// export const ComposeModal = ({ isOpen, onClose }: ComposeModalProps) => {
//   const { draftEmail } = useEmailStore();
//   // Get addEmail and updateDraft from the store
//   const addEmail = useEmailStore((state) => state.addEmail);
//   const updateDraft = useEmailStore((state) => state.updateDraft);

//   const [emails, setEmails] = useState<Email[]>([]);
//   const [userEmail, setUserEmail] = useState('');

//   const [email, setEmail] = useState({
//     to: draftEmail?.to || "",
//     subject: draftEmail?.subject || "",
//     content: draftEmail?.content || "",
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [accessToken, setAccessToken] = useState('');
//   const [linkedEmailId, setLinkedEmailId] = useState<string | null>(null);

//   // Combined useEffect for initialization
//   useEffect(() => {
//     // Get access token from cookies
//     const userInfo = getUserInfo();
//     if (userInfo.accessToken) {
//       setAccessToken(userInfo.accessToken);
//       console.log("Token loaded from cookies:", `${userInfo.accessToken.substring(0, 10)}...`);
//     } else {
//       console.error("No access token found in cookies");
//     }

//     // Check if email ID is already stored in cookies
//     const emailId = getCookie('linkedEmailId');
//     if (emailId) {
//       setLinkedEmailId(emailId);
//       console.log('Currently linked email ID:', emailId);
//     } else {
//       console.log('No linked email ID found in cookies');
//     }

//     // Set user email from cookies
//     if (userInfo.email) {
//       setUserEmail(userInfo.email);
//     } else {
//       setUserEmail('danielodedara@gmail.com'); // Fallback
//     }
//   }, []);

//   // Initialize form with draft content when isOpen changes
//   useEffect(() => {
//     if (isOpen && draftEmail) {
//       setEmail({
//         to: draftEmail.to || "",
//         subject: draftEmail.subject || "",
//         content: draftEmail.content || "",
//       });
//     }
//   }, [isOpen, draftEmail]);

//   // Auto-save draft at interval
//   useEffect(() => {
//     const autosaveInterval = setInterval(() => {
//       if (isOpen && (email.to || email.subject || email.content)) {
//         updateDraft({
//           to: email.to,
//           subject: email.subject,
//           content: email.content,
//           status: "draft",
//         });
//       }
//     }, 5000);

//     return () => clearInterval(autosaveInterval);
//   }, [isOpen, email, updateDraft]);

//   // Fetch sent emails from localStorage
//   useEffect(() => {
//     const fetchEmails = async () => {
//       try {
//         const savedEmails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
//         if (savedEmails.length > 0) {
//           setEmails(savedEmails);
//         }
//       } catch (error) {
//         console.error('Failed to fetch emails:', error);
//       }
//     };

//     fetchEmails();
//   }, []);

//   // Handle form input changes
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setEmail(prev => ({ ...prev, [name]: value }));
//   };

//   // Function for Send Email
//   const handleSend = async () => {
//     console.log("handleSend function called");

//     // Get the linked email ID from cookies
//     const emailId = getCookie('linkedEmailId');
//     console.log("Linked email ID from cookies:", emailId);

//     // More comprehensive validation
//     if (!email.to.trim()) {
//       console.log("Validation failed: Recipient email is empty");
//       setError("Recipient email is required");
//       return;
//     }

//     if (!email.subject.trim()) {
//       console.log("Validation failed: Subject is empty");
//       setError("Subject is required");
//       return;
//     }

//     if (!email.content.trim()) {
//       console.log("Validation failed: Content is empty");
//       setError("Email content cannot be empty");
//       return;
//     }

//     // Email format validation (basic)
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email.to.trim())) {
//       console.log("Validation failed: Invalid email format", email.to);
//       setError("Please enter a valid email address");
//       return;
//     }

//     if (!emailId) {
//       console.log("Validation failed: No linked email ID found");
//       setError('Please link an email account first');
//       return;
//     }

//     setLoading(true);
//     setError("");

//     // Get user signature if available
//     const userSignature = getCookie('userSignature') || undefined;

//     console.log("Starting email send process with data:", {
//       to: email.to,
//       subject: email.subject,
//       contentLength: email.content.length,
//       emailId: emailId
//     });

//     try {
//       // Create a structured request object matching your EmailData interface
//       const emailData: EmailData = {
//         to: email.to.trim(),
//         subject: email.subject.trim(),
//         content: email.content.trim(),
//         email_id: emailId,
//         cc: undefined,
//         bcc: undefined,
//         signature: userSignature
//       };

//       // Use your existing sendEmail function
//       console.log("Calling sendEmail function");
//       const response = await sendEmail(emailData);
//       console.log("sendEmail response received:", response);

//       // Only add to local state if the API call succeeded
//       const newEmail: Email = {
//         from: userEmail,
//         to: email.to,
//         subject: email.subject,
//         content: email.content,
//         hasAttachment: false,
//         status: "sent",
//       };

//       // Try to update the store state using addEmail
//       try {
//         if (typeof addEmail === 'function') {
//           console.log("Adding email to global store");
//           addEmail(newEmail);
//         }
//       } catch (storeError) {
//         console.error("Error adding email to store:", storeError);
//       }

//       // Update local component state
//       console.log("Updating local component state with new email");
//       setEmails(prevEmails => [...prevEmails, newEmail]);

//       // Save to localStorage for persistence between refreshes
//       console.log("Saving email to localStorage");
//       const savedEmails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
//       savedEmails.push(newEmail);
//       localStorage.setItem('sentEmails', JSON.stringify(savedEmails));

//       // Clear draft if it exists
//       console.log("Clearing any existing draft");
//       if (typeof updateDraft === 'function') {
//         updateDraft(null);
//       }

//       // Reset form and close modal
//       console.log("Resetting form and closing modal");
//       setEmail({ to: "", subject: "", content: "" });
//       onClose();
//     } catch (error: any) {
//       console.error("Error in handleSend:", error);

//       // More descriptive error message
//       if (error.message?.includes("401") || error.message?.includes("auth")) {
//         setError("Authentication failed. Your session may have expired.");
//       } else if (error.message?.includes("429")) {
//         setError("Too many requests. Please try again later.");
//       } else {
//         setError(error.message || "Failed to send email. Please try again.");
//       }
//     } finally {
//       setLoading(false);
//       console.log("handleSend process completed");
//     }
//   };

//   const handleSendLater = async () => {
//     if (!email.to.trim() && !email.subject.trim() && !email.content.trim()) {
//       return; // Don't save empty drafts
//     }
  
//     setLoading(true);
//     setError("");
  
//     // Get email_id from cookies
//     let emailId = getCookie('linkedEmailId') || "";
//     if (!emailId) {
//       // If no linkedEmailId found, we can't save the draft to the server
//       console.log("No linked email ID found in cookies");
//     }
  
//     // Prepare draft data
//     const draftData = {
//       to: email.to.trim() || "", 
//       subject: email.subject.trim() || "",
//       content: email.content.trim() || "",
//       email_id: emailId, 
//     };
  
//     console.log("📤 Sending draft:", JSON.stringify(draftData, null, 2));
  
//     try {
//       if (emailId) {
//         await saveDraft(draftData);
//         console.log("✅ Draft saved to server.");
//       } else {
//         throw new Error("No linked email ID available");
//       }
//     } catch (error: any) {
//       console.error("❌ API failed, saving draft locally:", error);
  
//       // Save draft locally
//       addEmail({
//         from: userEmail || "danielodedara@gmail.com",
//         to: email.to,
//         subject: email.subject,
//         content: email.content,
//         hasAttachment: false,
//         status: "draft",
//       });
  
//       updateDraft({
//         to: email.to,
//         subject: email.subject,
//         content: email.content,
//         status: "draft",
//       });
  
//       setError("Draft saved locally due to network issue.");
//     } finally {
//       setEmail({ to: "", subject: "", content: "" });
//       onClose();
//       setLoading(false);
//     }
//   };
  
//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-2xl">
//         <DialogHeader>
//           <DialogTitle>Compose Email</DialogTitle>
//         </DialogHeader>
//         <div className="space-y-4">
//           <div>
//             <Input
//               value={userEmail || ''}
//               disabled
//               className="bg-gray-100"
//             />
//           </div>
//           <div className="flex items-center">
//             <Input
//               placeholder="To"
//               value={email.to}
//               onChange={(e) => setEmail({ ...email, to: e.target.value })}
//             />
//             <Button variant="ghost" className="ml-2">Cc</Button>
//             <Button variant="ghost">Bcc</Button>
//           </div>
//           <Input
//             placeholder="Subject"
//             value={email.subject}
//             onChange={(e) => setEmail({ ...email, subject: e.target.value })}
//           />
//           <textarea
//             className="w-full h-64 p-2 border rounded-md"
//             placeholder="Compose email"
//             value={email.content}
//             onChange={(e) => setEmail({ ...email, content: e.target.value })}
//           />
//           <div className="flex justify-end gap-x-2 items-center">
//             <Button
//               onClick={handleSend}
//               disabled={loading}
//             >
//               {loading ? 'Sending...' : 'Send Email'}
//             </Button>
//             <Button variant="outline" onClick={handleSendLater} disabled={loading}>Send Later</Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };





















// "use client";

// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { useEffect, useState } from "react";
// import { useEmailStore } from "@/store/email-store";
// import { sendEmail, getAccessToken } from "@/app/dashboard/api/emailSend";
// import { saveDraft } from "@/app/dashboard/api/draftEmail";
// import { Email, EmailData } from '@/lib/types/email';
// // import { sendEmailAPI } from "@/app/dashboard/api/email-send";

// // Type definitions to match your API function
// interface ComposeModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// console.log("sendEmail:", sendEmail);

// export const ComposeModal = ({ isOpen, onClose }: ComposeModalProps) => {
//   const { draftEmail } = useEmailStore();
//   // Get addEmail and updateDraft from the store
//   const addEmail = useEmailStore((state) => state.addEmail);
//   const updateDraft = useEmailStore((state) => state.updateDraft);

//   const [emails, setEmails] = useState<Email[]>([]);
//   const [userEmail, setUserEmail] = useState('');

//   const [email, setEmail] = useState({
//     to: draftEmail?.to || "",
//     subject: draftEmail?.subject || "",
//     content: draftEmail?.content || "",
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [accessToken, setAccessToken] = useState('');
//   const [linkedEmailId, setLinkedEmailId] = useState<string | null>(null);

//   // Combined useEffect for initialization
//   useEffect(() => {
//     // Initialize the token from localStorage when component mounts
//     if (typeof window !== 'undefined') {
//       // Get and set access token
//       const token = getAccessToken();
//       if (token) {
//         setAccessToken(token);
//         console.log("Token loaded from localStorage:", `${token.substring(0, 10)}...`);
//       } else {
//         console.error("No access token found in localStorage");
//       }

//       // Check if email ID is already stored
//       const emailId = localStorage.getItem('linkedEmailId');
//       if (emailId) {
//         setLinkedEmailId(emailId);
//         console.log('Currently linked email ID:', emailId);
//       } else {
//         console.log('No linked email ID found in localStorage');
//       }
//     }
//   }, []);

//   // Set access token on component mount and check for linked email ID
//   useEffect(() => {
//     const token = getAccessToken();
//     if (token) {
//       setAccessToken(token);
//       console.log('Access token found in localStorage');
//     } else {
//       console.log('No access token found in localStorage');
//     }

//     // Check if email ID is already stored
//     const linkedEmailId = localStorage.getItem('linkedEmailId');
//     console.log('Currently linked email ID:', linkedEmailId);
//   }, []);

//   // Initialize form with draft content when isOpen changes
//   useEffect(() => {
//     if (isOpen && draftEmail) {
//       setEmail({
//         to: draftEmail.to || "",
//         subject: draftEmail.subject || "",
//         content: draftEmail.content || "",
//       });
//     }
//   }, [isOpen, draftEmail]);

//   // Auto-save draft at interval
//   useEffect(() => {
//     const autosaveInterval = setInterval(() => {
//       if (isOpen && (email.to || email.subject || email.content)) {
//         updateDraft({
//           to: email.to,
//           subject: email.subject,
//           content: email.content,
//           status: "draft",
//         });
//       }
//     }, 5000);

//     return () => clearInterval(autosaveInterval);
//   }, [isOpen, email, updateDraft]);

//   // Fetch user email on component mount

//   useEffect(() => {
//     // No need for async here since localStorage is synchronous
//     const getUserEmail = () => {
//       try {
//         // First try to get from localStorage
//         const storedEmail = localStorage.getItem('userEmail');

//         if (storedEmail) {
//           setUserEmail(storedEmail);
//         } else {
//           // If not in localStorage, default to fallback
//           setUserEmail('danielodedara@gmail.com');
//         }
//       } catch (error) {
//         console.error('Failed to get user email:', error);
//         setUserEmail('danielodedara@gmail.com');
//       }
//     };

//     // Call the function to execute it
//     getUserEmail();
//   }, []);

//   // Fetch sent emails from localStorage
//   useEffect(() => {
//     const fetchEmails = async () => {
//       try {
//         const savedEmails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
//         if (savedEmails.length > 0) {
//           setEmails(savedEmails);
//         }
//       } catch (error) {
//         console.error('Failed to fetch emails:', error);
//       }
//     };

//     fetchEmails();
//   }, []);

//   // Handle form input changes
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setEmail(prev => ({ ...prev, [name]: value }));
//   };

//   // Function for Send Email
//   const handleSend = async () => {
//     console.log("handleSend function called");

//     // Get the linked email ID from storage
//     const emailId = localStorage.getItem('linkedEmailId');
//     console.log("Linked email ID from localStorage:", emailId);


//     // More comprehensive validation
//     if (!email.to.trim()) {
//       console.log("Validation failed: Recipient email is empty");
//       setError("Recipient email is required");
//       return;
//     }

//     if (!email.subject.trim()) {
//       console.log("Validation failed: Subject is empty");
//       setError("Subject is required");
//       return;
//     }

//     if (!email.content.trim()) {
//       console.log("Validation failed: Content is empty");
//       setError("Email content cannot be empty");
//       return;
//     }

//     // Email format validation (basic)
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email.to.trim())) {
//       console.log("Validation failed: Invalid email format", email.to);
//       setError("Please enter a valid email address");
//       return;
//     }

//     if (!emailId) {
//       console.log("Validation failed: No linked email ID found");
//       setError('Please link an email account first');
//       return;
//     }

//     setLoading(true);
//     setError("");

//     // Get user signature if available
//     const userSignature = localStorage.getItem('userSignature') || undefined;

//     console.log("Starting email send process with data:", {
//       to: email.to,
//       subject: email.subject,
//       contentLength: email.content.length,
//       emailId: emailId
//     });

//     try {
//       // Create a structured request object matching your EmailData interface
//       const emailData: EmailData = {
//         to: email.to.trim(),
//         subject: email.subject.trim(),
//         content: email.content.trim(),
//         email_id: emailId,
//         cc: undefined,
//         bcc: undefined,
//         signature: userSignature
//       };

//       // Use your existing sendEmail function
//       console.log("Calling sendEmail function");
//       const response = await sendEmail(emailData);
//       console.log("sendEmail response received:", response);

//       // Only add to local state if the API call succeeded
//       const newEmail: Email = {
//         from: userEmail,
//         to: email.to,
//         subject: email.subject,
//         content: email.content,
//         hasAttachment: false,
//         status: "sent",
//       };

//       // Try to update the store state using addEmail
//       try {
//         if (typeof addEmail === 'function') {
//           console.log("Adding email to global store");
//           addEmail(newEmail);
//         }
//       } catch (storeError) {
//         console.error("Error adding email to store:", storeError);
//       }

//       // Update local component state
//       console.log("Updating local component state with new email");
//       setEmails(prevEmails => [...prevEmails, newEmail]);

//       // Save to localStorage for persistence between refreshes
//       console.log("Saving email to localStorage");
//       const savedEmails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
//       savedEmails.push(newEmail);
//       localStorage.setItem('sentEmails', JSON.stringify(savedEmails));

//       // Clear draft if it exists
//       console.log("Clearing any existing draft");
//       if (typeof updateDraft === 'function') {
//         updateDraft(null);
//       }

//       // Reset form and close modal
//       console.log("Resetting form and closing modal");
//       setEmail({ to: "", subject: "", content: "" });
//       onClose();
//     } catch (error: any) {
//       console.error("Error in handleSend:", error);

//       // More descriptive error message
//       if (error.message?.includes("401") || error.message?.includes("auth")) {
//         setError("Authentication failed. Your session may have expired.");
//       } else if (error.message?.includes("429")) {
//         setError("Too many requests. Please try again later.");
//       } else {
//         setError(error.message || "Failed to send email. Please try again.");
//       }
//     } finally {
//       setLoading(false);
//       console.log("handleSend process completed");
//     }
//   };

//   // Only render if modal is open
//   if (!isOpen) return null;

//   const handleSendLater = async () => {
//     if (!email.to.trim() && !email.subject.trim() && !email.content.trim()) {
//       return; // Don't save empty drafts
//     }
  
//     setLoading(true);
//     setError("");
  
//     // Get or generate email_id
//     let emailId = localStorage.getItem("linkedEmailId") || "";
//     if (!emailId) {
//       emailId = crypto.randomUUID(); // Generate new ID
//       localStorage.setItem("linkedEmailId", emailId);
//     }
  
//     // Prepare draft data
//     const draftData = {
//       to: email.to.trim() || "", 
//       subject: email.subject.trim() || "",
//       content: email.content.trim() || "", // ✅ API expects "content", not "body"
//       email_id: emailId, 
//     };
  
//     console.log("📤 Sending draft:", JSON.stringify(draftData, null, 2));
  
//     try {
//       await saveDraft(draftData);
//       console.log("✅ Draft saved to server.");
//     } catch (error: any) {
//       console.error("❌ API failed, saving draft locally:", error);
  
//       // Save draft locally
//       addEmail({
//         from: "danielodedara@gmail.com",
//         to: email.to,
//         subject: email.subject,
//         content: email.content,
//         hasAttachment: false,
//         status: "draft",
//       });
  
//       updateDraft({
//         to: email.to,
//         subject: email.subject,
//         content: email.content,
//         status: "draft",
//       });
  
//       setError("Draft saved locally due to network issue.");
//     } finally {
//       setEmail({ to: "", subject: "", content: "" });
//       onClose();
//       setLoading(false);
//     }
//   };
  

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-2xl">
//         <DialogHeader>
//           <DialogTitle>Compose Email</DialogTitle>
//         </DialogHeader>
//         <div className="space-y-4">
//           <div>
//             <Input
//               value={localStorage.getItem('userEmail') || 'danielodedara@gmail.com'}
//               disabled
//               className="bg-gray-100"
//             />
//           </div>
//           <div className="flex items-center">
//             <Input
//               placeholder="To"
//               value={email.to}
//               onChange={(e) => setEmail({ ...email, to: e.target.value })}
//             />
//             <Button variant="ghost" className="ml-2">Cc</Button>
//             <Button variant="ghost">Bcc</Button>
//           </div>
//           <Input
//             placeholder="Subject"
//             value={email.subject}
//             onChange={(e) => setEmail({ ...email, subject: e.target.value })}
//           />
//           <textarea
//             className="w-full h-64 p-2 border rounded-md"
//             placeholder="Compose email"
//             value={email.content}
//             onChange={(e) => setEmail({ ...email, content: e.target.value })}
//           />
//           <div className="flex justify-end gap-x-2 items-center">
//             <Button
//               onClick={handleSend}
//               disabled={loading}
//             >
//               {loading ? 'Sending...' : 'Send Email'}
//             </Button>
//             <Button variant="outline" onClick={handleSendLater} disabled={loading}>Send Later</Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };
























//   // New function for Send Later
//   // const handleSendLater = async () => {
//   //   if (!email.to.trim() && !email.subject.trim() && !email.content.trim()) {
//   //     // Don't save empty drafts
//   //     return;
//   //   }

//   //   setLoading(true);
//   //   setError("");

//   //   // Save as draft
//   //   try {
//   //     // Create a structured request object
//   //     const draftData = {
//   //       to: email.to.trim(),
//   //       cc: undefined,
//   //       bcc: undefined,
//   //       subject: email.subject.trim(),
//   //       content: email.content.trim(),
//   //       signature: undefined,
//   //       email_id: "0771ca4a-d380-4efc-bde1-6f1241b51a58",
//   //     };

//   //     // Save to server
//   //     await saveDraft(draftData);

//   //     // Save as draft locally
//   //     addEmail({
//   //       from: "danielodedara@gmail.com",
//   //       to: email.to,
//   //       subject: email.subject,
//   //       content: email.content,
//   //       hasAttachment: false,
//   //       status: "draft",
//   //       // timestamp: new Date().toISOString(),
//   //     });

//   //     // Update draft in store
//   //     updateDraft({
//   //       to: email.to,
//   //       subject: email.subject,
//   //       content: email.content,
//   //       status: "draft",
//   //     });

//   //     // Close modal
//   //     setEmail({ to: "", subject: "", content: "" });
//   //     onClose();
//   //   } catch (error: any) {
//   //     console.error("Error saving draft:", error);
//   //     setError(error.message || "Failed to save draft. Please try again.");
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };


//   // const handleSendLater = async () => {
//   //   if (!email.to.trim() && !email.subject.trim() && !email.content.trim()) {
//   //     console.log("Skipping save: Empty draft");
//   //     return;
//   //   }




//   //   setLoading(true);
//   //   setError("");

//   //   const emailId = localStorage.getItem("linkedEmailId");
//   //   if (!emailId) {
//   //     console.error("No linked email ID found. Draft cannot be saved.");
//   //     setError("Please link an email account first.");
//   //     setLoading(false);
//   //     return;
//   //   }

//   //   // Prepare draft data
//   //   const draftData: EmailData = {
//   //     to: email.to.trim(),
//   //     cc: undefined,
//   //     bcc: undefined,
//   //     subject: email.subject.trim(),
//   //     body: email.content.trim(),
//   //     signature: undefined,
//   //     email_id: emailId,
//   //   };

//   //   // Local draft structure
//   //   const newDraft: Email = {
//   //     id: emailId, // Ensure ID is stored properly
//   //     from: userEmail,
//   //     to: email.to,
//   //     subject: email.subject,
//   //     content: email.content,
//   //     hasAttachment: false,
//   //     status: "draft",
//   //     timestamp: new Date().toLocaleString(),
//   //     isUrgent: false,
//   //     category: "drafts",
//   //   };

//   //   try {
//   //     if (accessToken) {
//   //       console.log("Saving draft via API...");
//   //       await draftEmail(draftData);
//   //     } else {
//   //       console.warn("No access token found, skipping API save");
//   //     }

//   //     console.log("Saving draft locally...");
//   //     console.log("Calling addEmail with:", newDraft);
//   //     addEmail(newDraft); // Save to store

//   //     console.log("Calling updateDraft with:", newDraft);
//   //     updateDraft(newDraft); // Update UI state

//   //     // Save to localStorage for persistence
//   //     const savedDrafts = JSON.parse(localStorage.getItem("draftEmails") || "[]");
//   //     savedDrafts.push(newDraft);
//   //     localStorage.setItem("draftEmails", JSON.stringify(savedDrafts));

//   //     setEmail({ to: "", subject: "", content: "" });
//   //     onClose();
//   //   } catch (error: any) {
//   //     console.error("Error saving draft:", error);
//   //     setError(error.message || "Failed to save draft. Please try again.");
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };


//   // const handleSendLater = async () => {
//   //   if (!email.to.trim() && !email.subject.trim() && !email.content.trim()) {
//   //     // Don't save empty drafts
//   //     return;
//   //   }

//   //   setLoading(true);
//   //   setError("");

//   //   // Retrieve email_id from localStorage
//   //   const emailId = localStorage.getItem("linkedEmailId") || crypto.randomUUID();

//   //   // Create a structured request object
//   //   const draftData = {
//   //     to: email.to.trim(),
//   //     cc: undefined,
//   //     bcc: undefined,
//   //     subject: email.subject.trim(),
//   //     body: email.content.trim(), // API expects 'body' instead of 'content'
//   //     signature: undefined,
//   //     email_id: emailId, // Use email_id from localStorage
//   //   };

//   //   try {
//   //     // Try saving to the server
//   //     await saveDraft(draftData);
//   //     console.log("✅ Draft saved to server.");
//   //   } catch (error: any) {
//   //     console.error("❌ API failed, saving draft locally:", error);

//   //     // Save as a local draft if the API fails
//   //     addEmail({
//   //       from: "danielodedara@gmail.com",
//   //       to: email.to,
//   //       subject: email.subject,
//   //       content: email.content,
//   //       hasAttachment: false,
//   //       status: "draft",
//   //     });

//   //     // Update draft in store
//   //     updateDraft({
//   //       to: email.to,
//   //       subject: email.subject,
//   //       content: email.content,
//   //       status: "draft",
//   //     });

//   //     setError("Draft saved locally due to network issue.");
//   //   } finally {
//   //     // Reset form & close modal
//   //     setEmail({ to: "", subject: "", content: "" });
//   //     onClose();
//   //     setLoading(false);
//   //   }
//   // };
