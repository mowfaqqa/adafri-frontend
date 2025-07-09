import { useState, useEffect, useCallback, useContext } from "react";
import { useEmailStore } from "@/store/email-store";
import { saveDraft } from "@/app/dashboard/api/draftEmail";
import { Email, EmailData, EmailSendData, EmailSegment } from '@/lib/types/email';
import { getSelectedLinkedEmailId, getSelectedLinkedEmailType, getUserInfo } from "@/lib/utils/cookies";
import { AuthContext } from "@/lib/context/auth";
import { useCombinedAuth } from "@/components/providers/useCombinedAuth";
import { DjombiProfileService } from "@/lib/services/DjombiProfileService";
import { emailApiService } from "@/lib/services/emailApiService";
import { toast } from "sonner";

interface EmailProps {
  id: string;
  to: string;
  cc: string[];
  bcc: string[];
  subject: string;
  content: string;
}



export const useComposeEmail = (isOpen: boolean, draftEmail?: Email | null) => {
  const { 
    draftEmail: storeDraftEmail,
    addEmail,
    updateDraft,
    fetchEmails,
    // FIXED: Add refreshCurrentCategory to force refresh of current view
    refreshCurrentCategory
  } = useEmailStore();
  
  const { token } = useContext(AuthContext);
  const { djombi } = useCombinedAuth();
  
  // Get Djombi access token from multiple sources
  const getDjombiAccessToken = useCallback(() => {
    if (djombi.token) {
      return djombi.token;
    }
    
    const { accessToken } = DjombiProfileService.getStoredDjombiTokens();
    if (accessToken) {
      return accessToken;
    }
    
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('djombi_access_token');
      if (storedToken) {
        return storedToken;
      }
    }
    
    return "";
  }, [djombi.token]);

  const djombiTokens = getDjombiAccessToken();

  const [emails, setEmails] = useState<Email[]>([]);
  const [userEmail, setUserEmail] = useState('');
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
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [accessToken, setAccessToken] = useState('');

  // Get user email from Djombi profile or fallback to cookies
  const getUserEmail = useCallback(() => {
    const djombiProfile = DjombiProfileService.getStoredUserProfile();
    if (djombiProfile && djombiProfile.email) {
      return djombiProfile.email;
    }
    
    const userInfo = getUserInfo();
    if (userInfo.email) {
      return userInfo.email;
    }
    
    return 'user@gmail.com';
  }, []);

  // Initialize component data
  useEffect(() => {
    const userInfo = getUserInfo();
    if (userInfo.accessToken) {
      setAccessToken(userInfo.accessToken);
      console.log("Token loaded from cookies:", `${userInfo.accessToken.substring(0, 10)}...`);
    } else {
      console.error("No access token found in cookies");
    }

    const linkedEmailId = getSelectedLinkedEmailId();
    const linkedEmailType = getSelectedLinkedEmailType();
    
    if (linkedEmailId) {
      console.log('Currently selected email:', {
        id: linkedEmailId,
        type: linkedEmailType,
        prioritized: linkedEmailType !== null ? 'typed email' : 'null fallback'
      });
    } else {
      console.log('No selected email ID found in cookies');
    }

    setUserEmail(getUserEmail());
    
    const currentDjombiToken = getDjombiAccessToken();
    console.log("Djombi access token:", currentDjombiToken ? `${currentDjombiToken.substring(0, 10)}...` : "Not found");
  }, [getUserEmail, getDjombiAccessToken]);

  // Initialize form with draft content
  useEffect(() => {
    if (isOpen) {
      if (draftEmail) {
        setEmail({
          id: draftEmail.id || "",
          to: draftEmail.to || "",
          cc: Array.isArray(draftEmail.cc) ? draftEmail.cc : [],
          bcc: Array.isArray(draftEmail.bcc) ? draftEmail.bcc : [],
          subject: draftEmail.subject || "",
          content: draftEmail.content || "",
        });
        setShowCc(!!draftEmail.cc && draftEmail.cc.length > 0);
        setShowBcc(!!draftEmail.bcc && draftEmail.bcc.length > 0);
        console.log("ComposeModal: Initialized with passed draft data", draftEmail);
      } else if (storeDraftEmail) {
        setEmail({
          id: storeDraftEmail.id || "",
          to: storeDraftEmail.to || "",
          cc: Array.isArray(storeDraftEmail.cc) ? storeDraftEmail.cc : [],
          bcc: Array.isArray(storeDraftEmail.bcc) ? storeDraftEmail.bcc : [],
          subject: storeDraftEmail.subject || "",
          content: storeDraftEmail.content || "",
        });
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

  // Auto-save draft
  useEffect(() => {
    const autosaveInterval = setInterval(() => {
      if (isOpen && (email.to || email.cc.length > 0 || email.bcc.length > 0 || email.subject || email.content)) {
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
    const fetchEmailsFromStorage = async () => {
      try {
        const savedEmails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
        if (savedEmails.length > 0) {
          setEmails(savedEmails);
        }
      } catch (error) {
        console.error('Failed to fetch emails:', error);
      }
    };

    fetchEmailsFromStorage();
  }, []);

  // Utility functions
  const parseEmails = (emailStrings: string[] | string): string[] => {
    if (!emailStrings) return [];
    
    const emailsArray = Array.isArray(emailStrings) ? emailStrings : [emailStrings];
    
    return emailsArray
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEmail(prev => ({ ...prev, [name]: value }));
  };

  const handleSend = useCallback(async (editMode: boolean = false, onClose: () => void) => {
    console.log("handleSend function called");

    const linkedEmailId = getSelectedLinkedEmailId();
    const linkedEmailType = getSelectedLinkedEmailType();
    const currentDjombiToken = getDjombiAccessToken();
    
    console.log("Selected email info:", {
      id: linkedEmailId,
      type: linkedEmailType,
      prioritized: linkedEmailType !== null ? 'typed email' : 'null fallback'
    });
    console.log("Djombi access token available:", !!currentDjombiToken);

    if (!currentDjombiToken) {
      console.error("No Djombi access token found");
      const errorMsg = "Authentication failed. Please log in again.";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Validation
    if (!email.to.trim()) {
      console.log("Validation failed: Recipient email is empty");
      const errorMsg = "Recipient email is required";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!email.subject.trim()) {
      console.log("Validation failed: Subject is empty");
      const errorMsg = "Subject is required";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!email.content.trim()) {
      console.log("Validation failed: Content is empty");
      const errorMsg = "Email content cannot be empty";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!validateEmail(email.to.trim())) {
      console.log("Validation failed: Invalid email format", email.to);
      const errorMsg = "Please enter a valid email address for recipient";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Validate CC emails if present
    if (showCc && email.cc.length > 0) {
      const ccEmails = parseEmails(email.cc);
      for (const ccEmail of ccEmails) {
        if (!validateEmail(ccEmail)) {
          console.log("Validation failed: Invalid CC email format", ccEmail);
          const errorMsg = `Invalid CC email format: ${ccEmail}`;
          setError(errorMsg);
          toast.error(errorMsg);
          return;
        }
      }
    }

    // Validate BCC emails if present
    if (showBcc && email.bcc.length > 0) {
      const bccEmails = parseEmails(email.bcc);
      for (const bccEmail of bccEmails) {
        if (!validateEmail(bccEmail)) {
          console.log("Validation failed: Invalid BCC email format", bccEmail);
          const errorMsg = `Invalid BCC email format: ${bccEmail}`;
          setError(errorMsg);
          toast.error(errorMsg);
          return;
        }
      }
    }

    if (!linkedEmailId) {
      console.log("Validation failed: No selected email ID found");
      const errorMsg = 'Please select an email account first';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setLoading(true);
    setError("");

    console.log("Starting email send process using EmailApiService");

    try {
      // Delete draft if in edit mode using EmailApiService
      if (editMode && email.id) {
        try {
          console.log("Edit mode: deleting existing draft before sending", email.id);
          await emailApiService.deleteDraft(email.id);
        } catch (deleteError) {
          console.error("Error deleting draft before sending:", deleteError);
        }
      }

      const ccArray = showCc ? parseEmails(email.cc) : [];
      const bccArray = showBcc ? parseEmails(email.bcc) : [];

      const emailData = {
        to: email.to.trim(),
        subject: email.subject.trim(),
        content: email.content.trim(),
        email_id: linkedEmailId
      };

      console.log("Sending email using EmailApiService with data:", emailData);
      
      // Send email via EmailApiService
      const response = await emailApiService.sendEmail(emailData);
      console.log("EmailApiService response received:", response);

      // FIXED: Create email with proper structure for store
      const newEmail: Email = {
        from: userEmail,
        to: email.to,
        cc: showCc ? email.cc : undefined,
        bcc: showBcc ? email.bcc : undefined,
        subject: email.subject,
        content: email.content,
        hasAttachment: false,
        status: "sent" as EmailSegment,
        category: "sent", // FIXED: Ensure category is set
        email_id: linkedEmailId,
        timestamp: new Date().toISOString(),
        contentType: 'text',
        isUrgent: false,
        isRead: true,
        id: response.id || `sent-${Date.now()}`, // FIXED: Use server ID if available
        createdAt: Date.now()
      };

      // FIXED: Add to store first (this updates the UI immediately)
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

      // Save to localStorage as backup
      const savedEmails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
      savedEmails.push(newEmail);
      localStorage.setItem('sentEmails', JSON.stringify(savedEmails));

      // Clear any existing draft
      console.log("Clearing any existing draft");
      if (typeof updateDraft === 'function') {
        updateDraft(null);
      }

      // FIXED: Force refresh of sent emails immediately without delay
      console.log("Force refreshing sent emails");
      if (typeof refreshCurrentCategory === 'function') {
        refreshCurrentCategory();
      }
      
      // FIXED: Also explicitly fetch sent emails to ensure they're loaded
      if (typeof fetchEmails === 'function') {
        fetchEmails('sent', true);
      }

      // Show success message
      toast.success("Email sent successfully!");

      // Reset form and close modal
      setEmail({ id: "", to: "", cc: [], bcc: [], subject: "", content: "" });
      setShowCc(false);
      setShowBcc(false);
      onClose();
    } catch (error: any) {
      console.error("Error in handleSend:", error);

      let errorMessage = "Failed to send email. Please try again.";
      
      if (error.message?.includes("401") || error.message?.includes("auth")) {
        errorMessage = "Authentication failed. Your session may have expired.";
      } else if (error.message?.includes("429")) {
        errorMessage = "Too many requests. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      console.log("handleSend process completed");
    }
  }, [email, showCc, showBcc, userEmail, addEmail, updateDraft, getDjombiAccessToken, fetchEmails, refreshCurrentCategory]);

  const handleSendLater = useCallback(async (onClose: () => void) => {
    if (!email.to.trim() && !email.subject.trim() && !email.content.trim()) {
      return;
    }
  
    setLoading(true);
    setError("");
  
    const linkedEmailId = getSelectedLinkedEmailId();
    const linkedEmailType = getSelectedLinkedEmailType();
    
    console.log("Saving draft for selected email:", {
      id: linkedEmailId,
      type: linkedEmailType,
      prioritized: linkedEmailType !== null ? 'typed email' : 'null fallback'
    });

    if (!linkedEmailId) {
      console.log("No selected email ID found");
      const errorMsg = "Please select an email account first";
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
      return;
    }

    const ccArray = showCc && email.cc.length > 0 ? parseEmails(email.cc) : null;
    const bccArray = showBcc && email.bcc.length > 0 ? parseEmails(email.bcc) : null;
  
    const draftData = {
      to: email.to.trim() || "",
      subject: email.subject.trim() || "(Draft)",
      content: email.content.trim() || "",
      email_id: linkedEmailId
    };
  
    console.log("📤 Saving draft using EmailApiService:", JSON.stringify(draftData, null, 2));
  
    try {
      await emailApiService.createDraft(draftData);
      console.log("✅ Draft saved to server using EmailApiService.");
      
      // Also add to store for immediate UI feedback
      addEmail({
        from: userEmail || "",
        to: email.to,
        cc: showCc ? email.cc : undefined,
        bcc: showBcc ? email.bcc : undefined,
        subject: email.subject || "(Draft)",
        content: email.content,
        contentType: 'text',
        hasAttachment: false,
        isRead: true,
        status: "draft" as EmailSegment,
        email_id: linkedEmailId
      });

      // Refresh drafts using the store
      setTimeout(() => {
        fetchEmails('draft', true);
      }, 1000);

      toast.success("Draft saved successfully!");
      
    } catch (error: any) {
      console.error("❌ EmailApiService failed, saving draft locally:", error);
  
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
        email_id: linkedEmailId || null
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
  
      const errorMsg = "Draft saved locally due to network issue.";
      setError(errorMsg);
      toast.warning(errorMsg);
    } finally {
      setEmail({ id: "", to: "", cc: [], bcc: [], subject: "", content: "" });
      setShowCc(false);
      setShowBcc(false);
      onClose();
      setLoading(false);
    }
  }, [email, showCc, showBcc, userEmail, addEmail, updateDraft, fetchEmails]);

  const toggleCc = () => setShowCc(!showCc);
  const toggleBcc = () => setShowBcc(!showBcc);

  const resetForm = () => {
    setEmail({ id: "", to: "", cc: [], bcc: [], subject: "", content: "" });
    setShowCc(false);
    setShowBcc(false);
    setError("");
  };

  return {
    email,
    userEmail,
    loading,
    error,
    showCc,
    showBcc,
    handleChange,
    handleSend,
    handleSendLater,
    toggleCc,
    toggleBcc,
    resetForm,
    setError
  };
};























































// 9:28
// import { useState, useEffect, useCallback, useContext } from "react";
// import { useEmailStore } from "@/store/email-store";
// import { saveDraft } from "@/app/dashboard/api/draftEmail";
// import { Email, EmailData, EmailSendData, EmailSegment } from '@/lib/types/email';
// import { getSelectedLinkedEmailId, getSelectedLinkedEmailType, getUserInfo } from "@/lib/utils/cookies";
// import { AuthContext } from "@/lib/context/auth";
// import { useCombinedAuth } from "@/components/providers/useCombinedAuth";
// import { DjombiProfileService } from "@/lib/services/DjombiProfileService";
// import { emailApiService } from "@/lib/services/emailApiService"; // Import EmailApiService
// import { toast } from "sonner"; // For better user feedback

// interface EmailProps {
//   id: string;
//   to: string;
//   cc: string[];
//   bcc: string[];
//   subject: string;
//   content: string;
// }

// export const useComposeEmail = (isOpen: boolean, draftEmail?: Email | null) => {
//   const { draftEmail: storeDraftEmail } = useEmailStore();
//   const addEmail = useEmailStore((state) => state.addEmail);
//   const updateDraft = useEmailStore((state) => state.updateDraft);
//   const fetchEmails = useEmailStore((state) => state.fetchEmails);
  
//   const { token } = useContext(AuthContext);
//   const { djombi } = useCombinedAuth();
  
//   // Get Djombi access token from multiple sources
//   const getDjombiAccessToken = useCallback(() => {
//     // First try from useCombinedAuth
//     if (djombi.token) {
//       return djombi.token;
//     }
    
//     // Then try from DjombiProfileService
//     const { accessToken } = DjombiProfileService.getStoredDjombiTokens();
//     if (accessToken) {
//       return accessToken;
//     }
    
//     // Fallback to localStorage directly
//     if (typeof window !== 'undefined') {
//       const storedToken = localStorage.getItem('djombi_access_token');
//       if (storedToken) {
//         return storedToken;
//       }
//     }
    
//     return "";
//   }, [djombi.token]);

//   const djombiTokens = getDjombiAccessToken();

//   const [emails, setEmails] = useState<Email[]>([]);
//   const [userEmail, setUserEmail] = useState('');
//   const [email, setEmail] = useState<EmailProps>({
//     id: "",
//     to: "",
//     cc: [],
//     bcc: [],
//     subject: "",
//     content: "",
//   });
  
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [showCc, setShowCc] = useState(false);
//   const [showBcc, setShowBcc] = useState(false);
//   const [accessToken, setAccessToken] = useState('');

//   // Get user email from Djombi profile or fallback to cookies
//   const getUserEmail = useCallback(() => {
//     // First try to get email from Djombi profile
//     const djombiProfile = DjombiProfileService.getStoredUserProfile();
//     if (djombiProfile && djombiProfile.email) {
//       return djombiProfile.email;
//     }
    
//     // Fallback to cookies
//     const userInfo = getUserInfo();
//     if (userInfo.email) {
//       return userInfo.email;
//     }
    
//     // Last resort fallback
//     return 'user@gmail.com';
//   }, []);

//   // Initialize component data
//   useEffect(() => {
//     const userInfo = getUserInfo();
//     if (userInfo.accessToken) {
//       setAccessToken(userInfo.accessToken);
//       console.log("Token loaded from cookies:", `${userInfo.accessToken.substring(0, 10)}...`);
//     } else {
//       console.error("No access token found in cookies");
//     }

//     // FIXED: Use proper cookie function for selected email ID
//     const linkedEmailId = getSelectedLinkedEmailId();
//     const linkedEmailType = getSelectedLinkedEmailType();
    
//     if (linkedEmailId) {
//       console.log('Currently selected email:', {
//         id: linkedEmailId,
//         type: linkedEmailType,
//         prioritized: linkedEmailType !== null ? 'typed email' : 'null fallback'
//       });
//     } else {
//       console.log('No selected email ID found in cookies');
//     }

//     // Set user email using the new function
//     setUserEmail(getUserEmail());
    
//     // Log the Djombi token for debugging
//     const currentDjombiToken = getDjombiAccessToken();
//     console.log("Djombi access token:", currentDjombiToken ? `${currentDjombiToken.substring(0, 10)}...` : "Not found");
//   }, [getUserEmail, getDjombiAccessToken]);

//   // Initialize form with draft content
//   useEffect(() => {
//     if (isOpen) {
//       if (draftEmail) {
//         setEmail({
//           id: draftEmail.id || "",
//           to: draftEmail.to || "",
//           cc: Array.isArray(draftEmail.cc) ? draftEmail.cc : [],
//           bcc: Array.isArray(draftEmail.bcc) ? draftEmail.bcc : [],
//           subject: draftEmail.subject || "",
//           content: draftEmail.content || "",
//         });
//         setShowCc(!!draftEmail.cc && draftEmail.cc.length > 0);
//         setShowBcc(!!draftEmail.bcc && draftEmail.bcc.length > 0);
//         console.log("ComposeModal: Initialized with passed draft data", draftEmail);
//       } else if (storeDraftEmail) {
//         setEmail({
//           id: storeDraftEmail.id || "",
//           to: storeDraftEmail.to || "",
//           cc: Array.isArray(storeDraftEmail.cc) ? storeDraftEmail.cc : [],
//           bcc: Array.isArray(storeDraftEmail.bcc) ? storeDraftEmail.bcc : [],
//           subject: storeDraftEmail.subject || "",
//           content: storeDraftEmail.content || "",
//         });
//         setShowCc(!!storeDraftEmail.cc);
//         setShowBcc(!!storeDraftEmail.bcc);
//         console.log("ComposeModal: Initialized with store draft data", storeDraftEmail);
//       } else {
//         setEmail({ id: "", to: "", cc: [], bcc: [], subject: "", content: "" });
//         setShowCc(false);
//         setShowBcc(false);
//         console.log("ComposeModal: Initialized with empty form");
//       }
//     }
//   }, [isOpen, draftEmail, storeDraftEmail]);

//   // Auto-save draft
//   useEffect(() => {
//     const autosaveInterval = setInterval(() => {
//       if (isOpen && (email.to || email.cc.length > 0 || email.bcc.length > 0 || email.subject || email.content)) {
//         updateDraft({
//           id: email.id,
//           to: email.to,
//           cc: email.cc,
//           bcc: email.bcc,
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
//     const fetchEmailsFromStorage = async () => {
//       try {
//         const savedEmails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
//         if (savedEmails.length > 0) {
//           setEmails(savedEmails);
//         }
//       } catch (error) {
//         console.error('Failed to fetch emails:', error);
//       }
//     };

//     fetchEmailsFromStorage();
//   }, []);

//   // Utility functions
//   const parseEmails = (emailStrings: string[] | string): string[] => {
//     if (!emailStrings) return [];
    
//     const emailsArray = Array.isArray(emailStrings) ? emailStrings : [emailStrings];
    
//     return emailsArray
//       .reduce((acc: string[], emailString: string) => {
//         if (typeof emailString === 'string') {
//           const emails = emailString
//             .split(',')
//             .map(email => email.trim())
//             .filter(email => email !== '');
          
//           return [...acc, ...emails];
//         }
//         return acc;
//       }, []);
//   };

//   const validateEmail = (email: string): boolean => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return emailRegex.test(email.trim());
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setEmail(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSend = useCallback(async (editMode: boolean = false, onClose: () => void) => {
//     console.log("handleSend function called");

//     // FIXED: Use proper cookie function for selected email ID
//     const linkedEmailId = getSelectedLinkedEmailId();
//     const linkedEmailType = getSelectedLinkedEmailType();
//     const currentDjombiToken = getDjombiAccessToken();
    
//     console.log("Selected email info:", {
//       id: linkedEmailId,
//       type: linkedEmailType,
//       prioritized: linkedEmailType !== null ? 'typed email' : 'null fallback'
//     });
//     console.log("Djombi access token available:", !!currentDjombiToken);

//     // Check if we have the required tokens
//     if (!currentDjombiToken) {
//       console.error("No Djombi access token found");
//       const errorMsg = "Authentication failed. Please log in again.";
//       setError(errorMsg);
//       toast.error(errorMsg);
//       return;
//     }

//     // Validation
//     if (!email.to.trim()) {
//       console.log("Validation failed: Recipient email is empty");
//       const errorMsg = "Recipient email is required";
//       setError(errorMsg);
//       toast.error(errorMsg);
//       return;
//     }

//     if (!email.subject.trim()) {
//       console.log("Validation failed: Subject is empty");
//       const errorMsg = "Subject is required";
//       setError(errorMsg);
//       toast.error(errorMsg);
//       return;
//     }

//     if (!email.content.trim()) {
//       console.log("Validation failed: Content is empty");
//       const errorMsg = "Email content cannot be empty";
//       setError(errorMsg);
//       toast.error(errorMsg);
//       return;
//     }

//     if (!validateEmail(email.to.trim())) {
//       console.log("Validation failed: Invalid email format", email.to);
//       const errorMsg = "Please enter a valid email address for recipient";
//       setError(errorMsg);
//       toast.error(errorMsg);
//       return;
//     }

//     // Validate CC emails if present
//     if (showCc && email.cc.length > 0) {
//       const ccEmails = parseEmails(email.cc);
//       for (const ccEmail of ccEmails) {
//         if (!validateEmail(ccEmail)) {
//           console.log("Validation failed: Invalid CC email format", ccEmail);
//           const errorMsg = `Invalid CC email format: ${ccEmail}`;
//           setError(errorMsg);
//           toast.error(errorMsg);
//           return;
//         }
//       }
//     }

//     // Validate BCC emails if present
//     if (showBcc && email.bcc.length > 0) {
//       const bccEmails = parseEmails(email.bcc);
//       for (const bccEmail of bccEmails) {
//         if (!validateEmail(bccEmail)) {
//           console.log("Validation failed: Invalid BCC email format", bccEmail);
//           const errorMsg = `Invalid BCC email format: ${bccEmail}`;
//           setError(errorMsg);
//           toast.error(errorMsg);
//           return;
//         }
//       }
//     }

//     if (!linkedEmailId) {
//       console.log("Validation failed: No selected email ID found");
//       const errorMsg = 'Please select an email account first';
//       setError(errorMsg);
//       toast.error(errorMsg);
//       return;
//     }

//     setLoading(true);
//     setError("");

//     console.log("Starting email send process using EmailApiService");

//     try {
//       // Delete draft if in edit mode using EmailApiService
//       if (editMode && email.id) {
//         try {
//           console.log("Edit mode: deleting existing draft before sending", email.id);
//           await emailApiService.deleteDraft(email.id);
//         } catch (deleteError) {
//           console.error("Error deleting draft before sending:", deleteError);
//         }
//       }

//       const ccArray = showCc ? parseEmails(email.cc) : [];
//       const bccArray = showBcc ? parseEmails(email.bcc) : [];

//       const emailData = {
//         to: email.to.trim(),
//         subject: email.subject.trim(),
//         content: email.content.trim(),
//         email_id: linkedEmailId
//       };

//       console.log("Sending email using EmailApiService with data:", emailData);
      
//       // FIXED: Use EmailApiService instead of manual API call
//       const response = await emailApiService.sendEmail(emailData);
//       console.log("EmailApiService response received:", response);

//       const newEmail: Email = {
//         from: userEmail,
//         to: email.to,
//         cc: showCc ? email.cc : undefined,
//         bcc: showBcc ? email.bcc : undefined,
//         subject: email.subject,
//         content: email.content,
//         hasAttachment: false,
//         status: "sent" as EmailSegment,
//         email_id: linkedEmailId,
//         timestamp: new Date().toISOString(),
//         contentType: 'text',
//         isUrgent: false,
//         category: "sent",
//         isRead: true,
//         id: `sent-${Date.now()}`
//       };

//       try {
//         if (typeof addEmail === 'function') {
//           console.log("Adding email to global store");
//           addEmail(newEmail);
//         }
//       } catch (storeError) {
//         console.error("Error adding email to store:", storeError);
//       }

//       console.log("Updating local component state with new email");
//       setEmails(prevEmails => [...prevEmails, newEmail]);

//       const savedEmails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
//       savedEmails.push(newEmail);
//       localStorage.setItem('sentEmails', JSON.stringify(savedEmails));

//       console.log("Clearing any existing draft");
//       if (typeof updateDraft === 'function') {
//         updateDraft(null);
//       }

//       // Refresh sent emails using the store
//       setTimeout(() => {
//         fetchEmails('sent', true);
//       }, 1000);

//       // Show success message
//       toast.success("Email sent successfully!");

//       // Reset form and close modal
//       setEmail({ id: "", to: "", cc: [], bcc: [], subject: "", content: "" });
//       setShowCc(false);
//       setShowBcc(false);
//       onClose();
//     } catch (error: any) {
//       console.error("Error in handleSend:", error);

//       let errorMessage = "Failed to send email. Please try again.";
      
//       if (error.message?.includes("401") || error.message?.includes("auth")) {
//         errorMessage = "Authentication failed. Your session may have expired.";
//       } else if (error.message?.includes("429")) {
//         errorMessage = "Too many requests. Please try again later.";
//       } else if (error.message) {
//         errorMessage = error.message;
//       }

//       setError(errorMessage);
//       toast.error(errorMessage);
//     } finally {
//       setLoading(false);
//       console.log("handleSend process completed");
//     }
//   }, [email, showCc, showBcc, userEmail, addEmail, updateDraft, getDjombiAccessToken, fetchEmails]);

//   const handleSendLater = useCallback(async (onClose: () => void) => {
//     if (!email.to.trim() && !email.subject.trim() && !email.content.trim()) {
//       return;
//     }
  
//     setLoading(true);
//     setError("");
  
//     // FIXED: Use proper cookie function for selected email ID
//     const linkedEmailId = getSelectedLinkedEmailId();
//     const linkedEmailType = getSelectedLinkedEmailType();
    
//     console.log("Saving draft for selected email:", {
//       id: linkedEmailId,
//       type: linkedEmailType,
//       prioritized: linkedEmailType !== null ? 'typed email' : 'null fallback'
//     });

//     if (!linkedEmailId) {
//       console.log("No selected email ID found");
//       const errorMsg = "Please select an email account first";
//       setError(errorMsg);
//       toast.error(errorMsg);
//       setLoading(false);
//       return;
//     }

//     const ccArray = showCc && email.cc.length > 0 ? parseEmails(email.cc) : null;
//     const bccArray = showBcc && email.bcc.length > 0 ? parseEmails(email.bcc) : null;
  
//     const draftData = {
//       to: email.to.trim() || "",
//       subject: email.subject.trim() || "(Draft)",
//       content: email.content.trim() || "",
//       email_id: linkedEmailId
//     };
  
//     console.log("📤 Saving draft using EmailApiService:", JSON.stringify(draftData, null, 2));
  
//     try {
//       // FIXED: Use EmailApiService for creating drafts
//       await emailApiService.createDraft(draftData);
//       console.log("✅ Draft saved to server using EmailApiService.");
      
//       // Also add to store for immediate UI feedback
//       addEmail({
//         from: userEmail || "",
//         to: email.to,
//         cc: showCc ? email.cc : undefined,
//         bcc: showBcc ? email.bcc : undefined,
//         subject: email.subject || "(Draft)",
//         content: email.content,
//         contentType: 'text',
//         hasAttachment: false,
//         isRead: true,
//         status: "draft" as EmailSegment,
//         email_id: linkedEmailId
//       });

//       // Refresh drafts using the store
//       setTimeout(() => {
//         fetchEmails('draft', true);
//       }, 1000);

//       toast.success("Draft saved successfully!");
      
//     } catch (error: any) {
//       console.error("❌ EmailApiService failed, saving draft locally:", error);
  
//       addEmail({
//         from: userEmail || "",
//         to: email.to,
//         cc: showCc ? email.cc : undefined,
//         bcc: showBcc ? email.bcc : undefined,
//         subject: email.subject,
//         content: email.content,
//         contentType: 'text',
//         hasAttachment: false,
//         isRead: true,
//         status: "draft" as EmailSegment,
//         email_id: linkedEmailId || null
//       });
  
//       updateDraft({
//         id: email.id,
//         to: email.to,
//         cc: showCc ? email.cc : undefined,
//         bcc: showBcc ? email.bcc : undefined,
//         subject: email.subject,
//         content: email.content,
//         status: "draft",
//       });
  
//       const errorMsg = "Draft saved locally due to network issue.";
//       setError(errorMsg);
//       toast.warning(errorMsg);
//     } finally {
//       setEmail({ id: "", to: "", cc: [], bcc: [], subject: "", content: "" });
//       setShowCc(false);
//       setShowBcc(false);
//       onClose();
//       setLoading(false);
//     }
//   }, [email, showCc, showBcc, userEmail, addEmail, updateDraft, fetchEmails]);

//   const toggleCc = () => setShowCc(!showCc);
//   const toggleBcc = () => setShowBcc(!showBcc);

//   const resetForm = () => {
//     setEmail({ id: "", to: "", cc: [], bcc: [], subject: "", content: "" });
//     setShowCc(false);
//     setShowBcc(false);
//     setError("");
//   };

//   return {
//     email,
//     userEmail,
//     loading,
//     error,
//     showCc,
//     showBcc,
//     handleChange,
//     handleSend,
//     handleSendLater,
//     toggleCc,
//     toggleBcc,
//     resetForm,
//     setError
//   };
// };









































































// 7:32
// import { useState, useEffect, useCallback, useContext } from "react";
// import { useEmailStore } from "@/lib/store/email-store";
// import { sendEmail } from "@/app/dashboard/api/emailSend";
// import { saveDraft } from "@/app/dashboard/api/draftEmail";
// import { Email, EmailData, EmailSendData, EmailSegment } from '@/lib/types/email';
// import { getCookie, getUserInfo } from "@/lib/utils/cookies";
// import { AuthContext } from "@/lib/context/auth";
// import { useCombinedAuth } from "@/components/providers/useCombinedAuth";
// import { DjombiProfileService } from "@/lib/services/DjombiProfileService";

// interface EmailProps {
//   id: string;
//   to: string;
//   cc: string[];
//   bcc: string[];
//   subject: string;
//   content: string;
// }

// export const useComposeEmail = (isOpen: boolean, draftEmail?: Email | null) => {
//   const { draftEmail: storeDraftEmail } = useEmailStore();
//   const addEmail = useEmailStore((state) => state.addEmail);
//   const updateDraft = useEmailStore((state) => state.updateDraft);
  
//   const { token } = useContext(AuthContext);
//   const { djombi } = useCombinedAuth();
  
//   // Get Djombi access token from multiple sources
//   const getDjombiAccessToken = useCallback(() => {
//     // First try from useCombinedAuth
//     if (djombi.token) {
//       return djombi.token;
//     }
    
//     // Then try from DjombiProfileService
//     const { accessToken } = DjombiProfileService.getStoredDjombiTokens();
//     if (accessToken) {
//       return accessToken;
//     }
    
//     // Fallback to localStorage directly
//     if (typeof window !== 'undefined') {
//       const storedToken = localStorage.getItem('djombi_access_token');
//       if (storedToken) {
//         return storedToken;
//       }
//     }
    
//     return "";
//   }, [djombi.token]);

//   const djombiTokens = getDjombiAccessToken();

//   const [emails, setEmails] = useState<Email[]>([]);
//   const [userEmail, setUserEmail] = useState('');
//   const [email, setEmail] = useState<EmailProps>({
//     id: "",
//     to: "",
//     cc: [],
//     bcc: [],
//     subject: "",
//     content: "",
//   });
  
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [showCc, setShowCc] = useState(false);
//   const [showBcc, setShowBcc] = useState(false);
//   const [accessToken, setAccessToken] = useState('');
//   const [linkedEmailId, setLinkedEmailId] = useState<string | null>(null);

//   // Get user email from Djombi profile or fallback to cookies
//   const getUserEmail = useCallback(() => {
//     // First try to get email from Djombi profile
//     const djombiProfile = DjombiProfileService.getStoredUserProfile();
//     if (djombiProfile && djombiProfile.email) {
//       return djombiProfile.email;
//     }
    
//     // Fallback to cookies
//     const userInfo = getUserInfo();
//     if (userInfo.email) {
//       return userInfo.email;
//     }
    
//     // Last resort fallback
//     return 'user@gmail.com';
//   }, []);

//   // Initialize component data
//   useEffect(() => {
//     const userInfo = getUserInfo();
//     if (userInfo.accessToken) {
//       setAccessToken(userInfo.accessToken);
//       console.log("Token loaded from cookies:", `${userInfo.accessToken.substring(0, 10)}...`);
//     } else {
//       console.error("No access token found in cookies");
//     }

//     const emailId = getCookie('linkedEmailId') ||
//       (typeof window !== 'undefined' ? localStorage.getItem('linkedEmailId') : null);
//     if (emailId) {
//       setLinkedEmailId(emailId);
//       console.log('Currently linked email ID:', emailId);
//     } else {
//       console.log('No linked email ID found in cookies');
//     }

//     // Set user email using the new function
//     setUserEmail(getUserEmail());
    
//     // Log the Djombi token for debugging
//     const currentDjombiToken = getDjombiAccessToken();
//     console.log("Djombi access token:", currentDjombiToken ? `${currentDjombiToken.substring(0, 10)}...` : "Not found");
//   }, [getUserEmail, getDjombiAccessToken]);

//   // Initialize form with draft content
//   useEffect(() => {
//     if (isOpen) {
//       if (draftEmail) {
//         setEmail({
//           id: draftEmail.id || "",
//           to: draftEmail.to || "",
//           cc: Array.isArray(draftEmail.cc) ? draftEmail.cc : [],
//           bcc: Array.isArray(draftEmail.bcc) ? draftEmail.bcc : [],
//           subject: draftEmail.subject || "",
//           content: draftEmail.content || "",
//         });
//         setShowCc(!!draftEmail.cc && draftEmail.cc.length > 0);
//         setShowBcc(!!draftEmail.bcc && draftEmail.bcc.length > 0);
//         console.log("ComposeModal: Initialized with passed draft data", draftEmail);
//       } else if (storeDraftEmail) {
//         setEmail({
//           id: storeDraftEmail.id || "",
//           to: storeDraftEmail.to || "",
//           cc: Array.isArray(storeDraftEmail.cc) ? storeDraftEmail.cc : [],
//           bcc: Array.isArray(storeDraftEmail.bcc) ? storeDraftEmail.bcc : [],
//           subject: storeDraftEmail.subject || "",
//           content: storeDraftEmail.content || "",
//         });
//         setShowCc(!!storeDraftEmail.cc);
//         setShowBcc(!!storeDraftEmail.bcc);
//         console.log("ComposeModal: Initialized with store draft data", storeDraftEmail);
//       } else {
//         setEmail({ id: "", to: "", cc: [], bcc: [], subject: "", content: "" });
//         setShowCc(false);
//         setShowBcc(false);
//         console.log("ComposeModal: Initialized with empty form");
//       }
//     }
//   }, [isOpen, draftEmail, storeDraftEmail]);

//   // Auto-save draft
//   useEffect(() => {
//     const autosaveInterval = setInterval(() => {
//       if (isOpen && (email.to || email.cc.length > 0 || email.bcc.length > 0 || email.subject || email.content)) {
//         updateDraft({
//           id: email.id,
//           to: email.to,
//           cc: email.cc,
//           bcc: email.bcc,
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

//   // Utility functions
//   const parseEmails = (emailStrings: string[] | string): string[] => {
//     if (!emailStrings) return [];
    
//     const emailsArray = Array.isArray(emailStrings) ? emailStrings : [emailStrings];
    
//     return emailsArray
//       .reduce((acc: string[], emailString: string) => {
//         if (typeof emailString === 'string') {
//           const emails = emailString
//             .split(',')
//             .map(email => email.trim())
//             .filter(email => email !== '');
          
//           return [...acc, ...emails];
//         }
//         return acc;
//       }, []);
//   };

//   const validateEmail = (email: string): boolean => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return emailRegex.test(email.trim());
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setEmail(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSend = useCallback(async (editMode: boolean = false, onClose: () => void) => {
//     console.log("handleSend function called");

//     const emailId = linkedEmailId;
//     const currentDjombiToken = getDjombiAccessToken();
    
//     console.log("Linked email ID:", emailId);
//     console.log("Djombi access token available:", !!currentDjombiToken);

//     // Check if we have the required tokens
//     if (!currentDjombiToken) {
//       console.error("No Djombi access token found");
//       setError("Authentication failed. Please log in again.");
//       return;
//     }

//     // Validation
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

//     if (!validateEmail(email.to.trim())) {
//       console.log("Validation failed: Invalid email format", email.to);
//       setError("Please enter a valid email address for recipient");
//       return;
//     }

//     // Validate CC emails if present
//     if (showCc && email.cc.length > 0) {
//       const ccEmails = parseEmails(email.cc);
//       for (const ccEmail of ccEmails) {
//         if (!validateEmail(ccEmail)) {
//           console.log("Validation failed: Invalid CC email format", ccEmail);
//           setError(`Invalid CC email format: ${ccEmail}`);
//           return;
//         }
//       }
//     }

//     // Validate BCC emails if present
//     if (showBcc && email.bcc.length > 0) {
//       const bccEmails = parseEmails(email.bcc);
//       for (const bccEmail of bccEmails) {
//         if (!validateEmail(bccEmail)) {
//           console.log("Validation failed: Invalid BCC email format", bccEmail);
//           setError(`Invalid BCC email format: ${bccEmail}`);
//           return;
//         }
//       }
//     }

//     if (!emailId) {
//       console.log("Validation failed: No linked email ID found");
//       setError('Please link an email account first');
//       return;
//     }

//     setLoading(true);
//     setError("");

//     console.log("Starting email send process");

//     try {
//       // Delete draft if in edit mode
//       if (editMode && email.id) {
//         try {
//           console.log("Edit mode: deleting existing draft before sending", email.id);
          
//           if (currentDjombiToken && emailId) {
//             await fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/${email.id}?email_id=${encodeURIComponent(emailId)}`, {
//               method: 'DELETE',
//               headers: {
//                 'Authorization': `Bearer ${currentDjombiToken}`,
//                 'Content-Type': 'application/json'
//               }
//             });
//           }
//         } catch (deleteError) {
//           console.error("Error deleting draft before sending:", deleteError);
//         }
//       }

//       const ccArray = showCc ? parseEmails(email.cc) : [];
//       const bccArray = showBcc ? parseEmails(email.bcc) : [];

//       const emailData = {
//         to: email.to.trim(),
//         cc: ccArray.length > 0 ? ccArray : null,
//         bcc: bccArray.length > 0 ? bccArray : null,
//         subject: email.subject.trim(),
//         content: email.content.trim(),
//         email_id: emailId,
//         signature: null,
//         inbox: false,
//         sent: true,
//         draft: false,
//         spam: false,
//       };

//       console.log("Calling sendEmail function with data:", emailData);
//       const response = await sendEmail(emailData);
//       console.log("sendEmail response received:", response);

//       const newEmail: Email = {
//         from: userEmail,
//         to: email.to,
//         cc: showCc ? email.cc : undefined,
//         bcc: showBcc ? email.bcc : undefined,
//         subject: email.subject,
//         content: email.content,
//         hasAttachment: false,
//         status: "sent" as EmailSegment,
//         email_id: emailId,
//         timestamp: new Date().toISOString(),
//         contentType: 'text',
//         isUrgent: false,
//         category: "sent",
//         isRead: true,
//         id: `sent-${Date.now()}`
//       };

//       try {
//         if (typeof addEmail === 'function') {
//           console.log("Adding email to global store");
//           addEmail(newEmail);
//         }
//       } catch (storeError) {
//         console.error("Error adding email to store:", storeError);
//       }

//       console.log("Updating local component state with new email");
//       setEmails(prevEmails => [...prevEmails, newEmail]);

//       const savedEmails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
//       savedEmails.push(newEmail);
//       localStorage.setItem('sentEmails', JSON.stringify(savedEmails));

//       console.log("Clearing any existing draft");
//       if (typeof updateDraft === 'function') {
//         updateDraft(null);
//       }

//       // Reset form and close modal
//       setEmail({ id: "", to: "", cc: [], bcc: [], subject: "", content: "" });
//       setShowCc(false);
//       setShowBcc(false);
//       onClose();
//     } catch (error: any) {
//       console.error("Error in handleSend:", error);

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
//   }, [email, showCc, showBcc, userEmail, addEmail, updateDraft, linkedEmailId, getDjombiAccessToken]);

//   const handleSendLater = useCallback(async (onClose: () => void) => {
//     if (!email.to.trim() && !email.subject.trim() && !email.content.trim()) {
//       return;
//     }
  
//     setLoading(true);
//     setError("");
  
//     const emailId = linkedEmailId;
//     if (!emailId) {
//       console.log("No linked email ID found");
//     }

//     const ccArray = showCc && email.cc.length > 0 ? parseEmails(email.cc) : null;
//     const bccArray = showBcc && email.bcc.length > 0 ? parseEmails(email.bcc) : null;
  
//     const draftData: EmailSendData = {
//       to: email.to.trim() || "",
//       cc: ccArray,
//       bcc: bccArray,
//       subject: email.subject.trim() || "",
//       content: email.content.trim() || "",
//       email_id: emailId || "",
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
  
//       addEmail({
//         from: userEmail || "",
//         to: email.to,
//         cc: showCc ? email.cc : undefined,
//         bcc: showBcc ? email.bcc : undefined,
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
//         cc: showCc ? email.cc : undefined,
//         bcc: showBcc ? email.bcc : undefined,
//         subject: email.subject,
//         content: email.content,
//         status: "draft",
//       });
  
//       setError("Draft saved locally due to network issue.");
//     } finally {
//       setEmail({ id: "", to: "", cc: [], bcc: [], subject: "", content: "" });
//       setShowCc(false);
//       setShowBcc(false);
//       onClose();
//       setLoading(false);
//     }
//   }, [email, showCc, showBcc, userEmail, addEmail, updateDraft, linkedEmailId]);

//   const toggleCc = () => setShowCc(!showCc);
//   const toggleBcc = () => setShowBcc(!showBcc);

//   const resetForm = () => {
//     setEmail({ id: "", to: "", cc: [], bcc: [], subject: "", content: "" });
//     setShowCc(false);
//     setShowBcc(false);
//     setError("");
//   };

//   return {
//     email,
//     userEmail,
//     loading,
//     error,
//     showCc,
//     showBcc,
//     handleChange,
//     handleSend,
//     handleSendLater,
//     toggleCc,
//     toggleBcc,
//     resetForm,
//     setError
//   };
// };
















































// import { useState, useEffect, useCallback, useContext } from "react";
// import { useEmailStore } from "@/lib/store/email-store";
// import { sendEmail } from "@/app/dashboard/api/emailSend";
// import { saveDraft } from "@/app/dashboard/api/draftEmail";
// import { Email, EmailData, EmailSendData, EmailSegment } from '@/lib/types/email';
// import { getCookie, getUserInfo } from "@/lib/utils/cookies";
// import { AuthContext } from "@/lib/context/auth";
// import { DjombiProfileService } from "@/lib/services/DjombiProfileService";
// import { useCombinedAuth } from "@/components/providers/useCombinedAuth";

// interface EmailProps {
//   id: string;
//   to: string;
//   cc: string[];
//   bcc: string[];
//   subject: string;
//   content: string;
// }

// export const useComposeEmail = (isOpen: boolean, draftEmail?: Email | null) => {
//   const { draftEmail: storeDraftEmail } = useEmailStore();
//   const addEmail = useEmailStore((state) => state.addEmail);
//   const updateDraft = useEmailStore((state) => state.updateDraft);
  
//   const { token } = useContext(AuthContext);
//   const { djombi } = useCombinedAuth();
//   const djombiTokens = djombi.token || "";

//   const [emails, setEmails] = useState<Email[]>([]);
//   const [userEmail, setUserEmail] = useState('');
//   const [email, setEmail] = useState<EmailProps>({
//     id: "",
//     to: "",
//     cc: [],
//     bcc: [],
//     subject: "",
//     content: "",
//   });
  
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [showCc, setShowCc] = useState(false);
//   const [showBcc, setShowBcc] = useState(false);
//   const [accessToken, setAccessToken] = useState('');
//   const [linkedEmailId, setLinkedEmailId] = useState<string | null>(null);

//   // Get user email from Djombi profile or fallback to cookies
//   const getUserEmail = useCallback(() => {
//     // First try to get email from Djombi profile
//     const djombiProfile = DjombiProfileService.getStoredUserProfile();
//     if (djombiProfile && djombiProfile.email) {
//       return djombiProfile.email;
//     }
    
//     // Fallback to cookies
//     const userInfo = getUserInfo();
//     if (userInfo.email) {
//       return userInfo.email;
//     }
    
//     // Last resort fallback
//     return 'user@gmail.com';
//   }, []);

//   // Initialize component data
//   useEffect(() => {
//     const userInfo = getUserInfo();
//     if (userInfo.accessToken) {
//       setAccessToken(userInfo.accessToken);
//       console.log("Token loaded from cookies:", `${userInfo.accessToken.substring(0, 10)}...`);
//     } else {
//       console.error("No access token found in cookies");
//     }

//     const emailId = getCookie('linkedEmailId') ||
//       (typeof window !== 'undefined' ? localStorage.getItem('linkedEmailId') : null);
//     if (emailId) {
//       setLinkedEmailId(emailId);
//       console.log('Currently linked email ID:', emailId);
//     } else {
//       console.log('No linked email ID found in cookies');
//     }

//     // Set user email using the new function
//     setUserEmail(getUserEmail());
//   }, [getUserEmail]);

//   // Initialize form with draft content
//   useEffect(() => {
//     if (isOpen) {
//       if (draftEmail) {
//         setEmail({
//           id: draftEmail.id || "",
//           to: draftEmail.to || "",
//           cc: Array.isArray(draftEmail.cc) ? draftEmail.cc : [],
//           bcc: Array.isArray(draftEmail.bcc) ? draftEmail.bcc : [],
//           subject: draftEmail.subject || "",
//           content: draftEmail.content || "",
//         });
//         setShowCc(!!draftEmail.cc && draftEmail.cc.length > 0);
//         setShowBcc(!!draftEmail.bcc && draftEmail.bcc.length > 0);
//         console.log("ComposeModal: Initialized with passed draft data", draftEmail);
//       } else if (storeDraftEmail) {
//         setEmail({
//           id: storeDraftEmail.id || "",
//           to: storeDraftEmail.to || "",
//           cc: Array.isArray(storeDraftEmail.cc) ? storeDraftEmail.cc : [],
//           bcc: Array.isArray(storeDraftEmail.bcc) ? storeDraftEmail.bcc : [],
//           subject: storeDraftEmail.subject || "",
//           content: storeDraftEmail.content || "",
//         });
//         setShowCc(!!storeDraftEmail.cc);
//         setShowBcc(!!storeDraftEmail.bcc);
//         console.log("ComposeModal: Initialized with store draft data", storeDraftEmail);
//       } else {
//         setEmail({ id: "", to: "", cc: [], bcc: [], subject: "", content: "" });
//         setShowCc(false);
//         setShowBcc(false);
//         console.log("ComposeModal: Initialized with empty form");
//       }
//     }
//   }, [isOpen, draftEmail, storeDraftEmail]);

//   // Auto-save draft
//   useEffect(() => {
//     const autosaveInterval = setInterval(() => {
//       if (isOpen && (email.to || email.cc.length > 0 || email.bcc.length > 0 || email.subject || email.content)) {
//         updateDraft({
//           id: email.id,
//           to: email.to,
//           cc: email.cc,
//           bcc: email.bcc,
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

//   // Utility functions
//   const parseEmails = (emailStrings: string[] | string): string[] => {
//     if (!emailStrings) return [];
    
//     const emailsArray = Array.isArray(emailStrings) ? emailStrings : [emailStrings];
    
//     return emailsArray
//       .reduce((acc: string[], emailString: string) => {
//         if (typeof emailString === 'string') {
//           const emails = emailString
//             .split(',')
//             .map(email => email.trim())
//             .filter(email => email !== '');
          
//           return [...acc, ...emails];
//         }
//         return acc;
//       }, []);
//   };

//   const validateEmail = (email: string): boolean => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return emailRegex.test(email.trim());
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setEmail(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSend = useCallback(async (editMode: boolean = false, onClose: () => void) => {
//     console.log("handleSend function called");

//     const emailId = linkedEmailId;
//     console.log("Linked email ID:", emailId);

//     // Validation
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

//     if (!validateEmail(email.to.trim())) {
//       console.log("Validation failed: Invalid email format", email.to);
//       setError("Please enter a valid email address for recipient");
//       return;
//     }

//     // Validate CC emails if present
//     if (showCc && email.cc.length > 0) {
//       const ccEmails = parseEmails(email.cc);
//       for (const ccEmail of ccEmails) {
//         if (!validateEmail(ccEmail)) {
//           console.log("Validation failed: Invalid CC email format", ccEmail);
//           setError(`Invalid CC email format: ${ccEmail}`);
//           return;
//         }
//       }
//     }

//     // Validate BCC emails if present
//     if (showBcc && email.bcc.length > 0) {
//       const bccEmails = parseEmails(email.bcc);
//       for (const bccEmail of bccEmails) {
//         if (!validateEmail(bccEmail)) {
//           console.log("Validation failed: Invalid BCC email format", bccEmail);
//           setError(`Invalid BCC email format: ${bccEmail}`);
//           return;
//         }
//       }
//     }

//     if (!emailId) {
//       console.log("Validation failed: No linked email ID found");
//       setError('Please link an email account first');
//       return;
//     }

//     setLoading(true);
//     setError("");

//     console.log("Starting email send process");

//     try {
//       // Delete draft if in edit mode
//       if (editMode && email.id) {
//         try {
//           console.log("Edit mode: deleting existing draft before sending", email.id);
          
//           if (token && emailId) {
//             await fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/${email.id}?email_id=${encodeURIComponent(emailId)}`, {
//               method: 'DELETE',
//               headers: {
//                 'Authorization': `Bearer ${djombiTokens}`,
//                 'Content-Type': 'application/json'
//               }
//             });
//           }
//         } catch (deleteError) {
//           console.error("Error deleting draft before sending:", deleteError);
//         }
//       }

//       const ccArray = showCc ? parseEmails(email.cc) : [];
//       const bccArray = showBcc ? parseEmails(email.bcc) : [];

//       const emailData = {
//         to: email.to.trim(),
//         cc: ccArray.length > 0 ? ccArray : null,
//         bcc: bccArray.length > 0 ? bccArray : null,
//         subject: email.subject.trim(),
//         content: email.content.trim(),
//         email_id: emailId,
//         signature: null,
//         inbox: false,
//         sent: true,
//         draft: false,
//         spam: false,
//       };

//       console.log("Calling sendEmail function");
//       const response = await sendEmail(emailData);
//       console.log("sendEmail response received:", response);

//       const newEmail: Email = {
//         from: userEmail,
//         to: email.to,
//         cc: showCc ? email.cc : undefined,
//         bcc: showBcc ? email.bcc : undefined,
//         subject: email.subject,
//         content: email.content,
//         hasAttachment: false,
//         status: "sent" as EmailSegment,
//         email_id: emailId,
//         timestamp: new Date().toISOString(),
//         contentType: 'text',
//         isUrgent: false,
//         category: "sent",
//         isRead: true,
//         id: `sent-${Date.now()}`
//       };

//       try {
//         if (typeof addEmail === 'function') {
//           console.log("Adding email to global store");
//           addEmail(newEmail);
//         }
//       } catch (storeError) {
//         console.error("Error adding email to store:", storeError);
//       }

//       console.log("Updating local component state with new email");
//       setEmails(prevEmails => [...prevEmails, newEmail]);

//       const savedEmails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
//       savedEmails.push(newEmail);
//       localStorage.setItem('sentEmails', JSON.stringify(savedEmails));

//       console.log("Clearing any existing draft");
//       if (typeof updateDraft === 'function') {
//         updateDraft(null);
//       }

//       // Reset form and close modal
//       setEmail({ id: "", to: "", cc: [], bcc: [], subject: "", content: "" });
//       setShowCc(false);
//       setShowBcc(false);
//       onClose();
//     } catch (error: any) {
//       console.error("Error in handleSend:", error);

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
//   }, [token, djombiTokens, email, showCc, showBcc, userEmail, addEmail, updateDraft, linkedEmailId]);

//   const handleSendLater = useCallback(async (onClose: () => void) => {
//     if (!email.to.trim() && !email.subject.trim() && !email.content.trim()) {
//       return;
//     }
  
//     setLoading(true);
//     setError("");
  
//     const emailId = linkedEmailId;
//     if (!emailId) {
//       console.log("No linked email ID found");
//     }

//     const ccArray = showCc && email.cc.length > 0 ? parseEmails(email.cc) : null;
//     const bccArray = showBcc && email.bcc.length > 0 ? parseEmails(email.bcc) : null;
  
//     const draftData: EmailSendData = {
//       to: email.to.trim() || "",
//       cc: ccArray,
//       bcc: bccArray,
//       subject: email.subject.trim() || "",
//       content: email.content.trim() || "",
//       email_id: emailId || "",
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
  
//       addEmail({
//         from: userEmail || "",
//         to: email.to,
//         cc: showCc ? email.cc : undefined,
//         bcc: showBcc ? email.bcc : undefined,
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
//         cc: showCc ? email.cc : undefined,
//         bcc: showBcc ? email.bcc : undefined,
//         subject: email.subject,
//         content: email.content,
//         status: "draft",
//       });
  
//       setError("Draft saved locally due to network issue.");
//     } finally {
//       setEmail({ id: "", to: "", cc: [], bcc: [], subject: "", content: "" });
//       setShowCc(false);
//       setShowBcc(false);
//       onClose();
//       setLoading(false);
//     }
//   }, [email, showCc, showBcc, userEmail, addEmail, updateDraft, linkedEmailId]);

//   const toggleCc = () => setShowCc(!showCc);
//   const toggleBcc = () => setShowBcc(!showBcc);

//   const resetForm = () => {
//     setEmail({ id: "", to: "", cc: [], bcc: [], subject: "", content: "" });
//     setShowCc(false);
//     setShowBcc(false);
//     setError("");
//   };

//   return {
//     email,
//     userEmail,
//     loading,
//     error,
//     showCc,
//     showBcc,
//     handleChange,
//     handleSend,
//     handleSendLater,
//     toggleCc,
//     toggleBcc,
//     resetForm,
//     setError
//   };
// };