import { useEmailStore } from "@/lib/store/email-store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, RefreshCw, X } from "lucide-react";
import { useState, useEffect, useContext, useCallback } from "react";
import { Email, EmailCategory } from "@/lib/types/email";
import { Checkbox } from "@/components/ui/checkbox";
import { getAuthToken, getCookie } from "@/lib/utils/cookies";
import { createEmailPreview, EmailContentRenderer } from "@/lib/utils/emails/email-content-utils";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { AuthContext } from "@/lib/context/auth";
import { useCombinedAuth } from "../../providers/useCombinedAuth";

interface EmailSentProps {
  onBack?: () => void;
}

export const EmailSent = ({ onBack }: EmailSentProps) => {
  const { emails, addEmail } = useEmailStore();
  
  // Move all hooks to the top level
  const { token, user } = useContext(AuthContext);
  const { djombi } = useCombinedAuth();
  
  const [apiSentEmails, setApiSentEmails] = useState<Email[]>([]);
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [sortNewest, setSortNewest] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function to process response data
  const processResponseData = (data: any) => {
    // Check if data contains emails (handle different response structures)
    let emailsData: any[] = [];
    
    if (Array.isArray(data)) {
      emailsData = data;
    } else if (data.data && Array.isArray(data.data)) {
      emailsData = data.data;
    } else if (data.sent && Array.isArray(data.sent)) {
      emailsData = data.sent;
    } else if (data.emails && Array.isArray(data.emails)) {
      emailsData = data.emails;
    } else {
      console.log("Response structure different than expected:", data);
      // Look for any array in the response that might contain emails
      for (const key in data) {
        if (Array.isArray(data[key]) && data[key].length > 0) {
          console.log(`Found array in response at key: ${key}`, data[key]);
          emailsData = data[key];
          break;
        }
      }
    }
    
    if (emailsData.length === 0) {
      console.log("No emails found in the response");
      setApiSentEmails([]);
      return;
    }
    
    console.log("Sample email data structure:", emailsData[0]);
    
    // First, filter out invalid emails, then map them to the correct structure
    const validEmailsData = emailsData.filter(email => email && typeof email === 'object');
    
    // Now map the valid emails to the correct structure
    const formattedEmails: Email[] = validEmailsData.map((email: any): Email => {
      return {
        id: email.id || email._id || `sent-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        subject: email.subject || 'No Subject',
        content: email.content || '',
        contentType: email.contentType || 'text',  // Add this if it's required in your Email interface
        from: email.from || email.sender || 'Unknown Sender',
        to: email.to || email.recipient || '',
        timestamp: email.timestamp || email.createdAt || email.created_at || new Date().toISOString(),
        status: "sent",
        isUrgent: Boolean(email.isUrgent || email.is_urgent || false),
        hasAttachment: Boolean(email.hasAttachment || email.has_attachment || false),
        category: "sent",
        isRead: true, // Sent emails are always read
        email_id: email.email_id || null  // Add this if it's required in your Email interface
      };
    });
    
    console.log(`Processed ${formattedEmails.length} sent emails`);
    
    // Add to email store first
    formattedEmails.forEach(email => {
      // Check if email already exists in store to prevent duplicates
      const exists = emails.some(e => e.id === email.id);
      if (!exists) {
        addEmail({
          ...email,
          status: "sent",
        });
      }
    });
    
    setApiSentEmails(formattedEmails);
  };
  
  // Use useCallback to memoize the function and include dependencies
  const fetchSentEmails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Token retrieved:", token ? `${token.access_token.substring(0, 10)}...` : 'No token found');

      const djombiTokens = djombi.token || "";
      
      if (!token) {
        throw new Error('No access token available');
      }
      
      // Get linked email ID - use the same approach as ProfessionalEmailInbox
      const linkedEmailId = getCookie('linkedEmailId') ||
        (typeof window !== 'undefined' ? localStorage.getItem('linkedEmailId') : null);
      console.log("Linked Email ID:", linkedEmailId);
      
      if (!linkedEmailId) {
        throw new Error('No linked email ID found');
      }
      
      // Use axios instead of fetch
      const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/sent?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
      console.log("Fetching from API endpoint:", apiEndpoint);
      
      const response = await axios.get(apiEndpoint, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${djombiTokens}`,
        }
      });
      
      console.log("GET response data:", response.data);
      
      // Check for success/error in response
      if (response.data.success === false) {
        const errorMessage = response.data.message || 'API request failed';
        console.error("API error:", errorMessage);
        throw new Error(`API error: ${errorMessage}`);
      }
      
      processResponseData(response.data);
    } catch (err) {
      console.error('Failed to fetch sent emails:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sent emails');
      
      // Fallback to local data if API fails
      const localSentEmails = emails.filter(email => email.status === "sent");
      if (localSentEmails.length > 0) {
        console.log("Using local sent emails as fallback");
        setApiSentEmails([]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, djombi.token, emails, addEmail]);
  
  useEffect(() => {
    fetchSentEmails();
  }, [fetchSentEmails]);
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSentEmails();
  };
  
  // Combine sent emails from store and API
  const allSentEmails = [
    ...emails.filter(email => email.status === "sent"),
    ...apiSentEmails
  ];
  
  // Remove duplicates by id
  const uniqueSentEmails = allSentEmails.filter(
    (email, index, self) => 
      index === self.findIndex(e => e.id === email.id)
  );
  
  // Sort by date
  const sortedEmails = [...uniqueSentEmails].sort((a, b) => {
    const dateA = new Date(a.timestamp || "").getTime();
    const dateB = new Date(b.timestamp || "").getTime();
    return sortNewest ? dateB - dateA : dateA - dateB;
  });
  
  // Filter by date if filterDate is set
  const displayedEmails = filterDate 
    ? sortedEmails.filter(email => {
        const emailDate = new Date(email.timestamp || "").toLocaleDateString();
        return emailDate === filterDate;
      })
    : sortedEmails;

  const toggleSort = () => {
    setSortNewest(!sortNewest);
  };

  const toggleSelect = (emailId: string, event: React.MouseEvent) => {
    // Prevent triggering the row click when selecting checkbox
    event.stopPropagation();
    
    setSelectedEmails(prev => 
      prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };
  
  // Handle row click to open dialog
  const handleRowClick = (email: Email) => {
    setSelectedEmail(email);
    setShowDialog(true);
  };

  return (
    <div className="w-full h-full overflow-y-auto pb-4">
      {onBack && (
        <Button variant="ghost" size="icon" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4" />
        </Button>
      )}
      
      <div className="border rounded-lg bg-white overflow-hidden h-[calc(100vh-120px)]">
        <div className="sticky top-0 bg-background z-10 p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Sent</h2>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleSort}
              >
                Sort: {sortNewest ? "Newest" : "Oldest"}
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100%-60px)]">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
              <Button 
                className="mt-4" 
                variant="outline" 
                onClick={handleRefresh}
              >
                Try Again
              </Button>
            </div>
          ) : displayedEmails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sent emails found.
            </div>
          ) : (
            <div className="space-y-0">
              {displayedEmails.map((email) => (
                <div 
                  key={email.id} 
                  className="flex items-center px-4 py-3 border-b last:border-b-0 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(email)}
                >
                  <div className="mr-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedEmails.includes(email.id || "")}
                      onCheckedChange={() => {}}
                      onClick={(e) => toggleSelect(email.id || "", e as React.MouseEvent)}
                    />
                  </div>
                  <div className="flex-1 grid grid-cols-12 gap-2">
                    <div className="col-span-2 text-sm text-gray-600 truncate pr-2">
                      To: {email.to}
                    </div>
                    <div className="col-span-7 flex items-center">
                      <div className="text-sm truncate">
                        <span className="font-medium">{email.subject}</span>
                        {email.content && (
                          <span className="text-gray-500"> - {mounted ? createEmailPreview(email.content, 50) : ''}</span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-3 text-right text-sm text-gray-500">
                      {email.timestamp ? 
                        new Date(email.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                        ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Email Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>{selectedEmail?.subject || "Email Details"}</DialogTitle>
              <DialogClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="w-4 h-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>
          
          {selectedEmail && (
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-2 text-sm">
                <div className="col-span-2 font-medium">From:</div>
                <div className="col-span-10">{selectedEmail.from}</div>
                
                <div className="col-span-2 font-medium">To:</div>
                <div className="col-span-10">{selectedEmail.to}</div>
                
                <div className="col-span-2 font-medium">Date:</div>
                <div className="col-span-10">
                  {selectedEmail.timestamp ? 
                    new Date(selectedEmail.timestamp).toLocaleString() : 
                    ""}
                </div>
              </div>
              
              <div className="mt-4 border-t pt-4">
                <div className="prose prose-sm max-w-none">
                  {mounted && <EmailContentRenderer content={selectedEmail.content} />}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailSent;

































































// import { useEmailStore } from "@/lib/store/email-store";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Filter, RefreshCw, X } from "lucide-react";
// import { useState, useEffect, useContext } from "react";
// import { Email, EmailCategory } from "@/lib/types/email";
// import { Checkbox } from "@/components/ui/checkbox";
// import { getAuthToken, getCookie } from "@/lib/utils/cookies";
// import { createEmailPreview, EmailContentRenderer } from "@/lib/utils/emails/email-content-utils";
// import axios from "axios";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogClose
// } from "@/components/ui/dialog";
// import { AuthContext } from "@/lib/context/auth";

// interface DjombiTokens {
//   accessTokenAdafri: string;
//   accessTokenDjombi: string;
// }

// interface EmailSentProps {
//   onBack?: () => void;
//   djombiTokens?: DjombiTokens | null;
// }

// export const EmailSent = ({ onBack, djombiTokens }: EmailSentProps) => {
//   const { emails, addEmail } = useEmailStore();
//   const [apiSentEmails, setApiSentEmails] = useState<Email[]>([]);
//   const [filterDate, setFilterDate] = useState<string | null>(null);
//   const [sortNewest, setSortNewest] = useState(true);
//   const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [mounted, setMounted] = useState(false);
//   const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
//   const [showDialog, setShowDialog] = useState(false);
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   // Handle client-side mounting
//   useEffect(() => {
//     setMounted(true);
//   }, []);
  
//   const fetchSentEmails = async () => {
//     setIsLoading(true);
//     setError(null);
    
//     try {
//       // First check if we have Djombi tokens
//       if (!djombiTokens) {
//         throw new Error('Djombi tokens not available');
//       }

//       console.log("Using Djombi tokens for sent emails:", {
//         adafri: djombiTokens.accessTokenAdafri ? `${djombiTokens.accessTokenAdafri.substring(0, 10)}...` : 'No token',
//         djombi: djombiTokens.accessTokenDjombi ? `${djombiTokens.accessTokenDjombi.substring(0, 10)}...` : 'No token'
//       });

//       // Get token from context as fallback
//       const { token, user } = useContext(AuthContext);
//       console.log("Context token retrieved:", token ? `${token.access_token.substring(0, 10)}...` : 'No token found');
      
//       // Use Djombi token for authentication, fallback to context token
//       const authToken = djombiTokens.accessTokenDjombi || token?.access_token;
      
//       if (!authToken) {
//         throw new Error('No access token available');
//       }
      
//       // Get linked email ID from cookies
//       const linkedEmailId = getCookie('linkedEmailId');
//       console.log("Linked Email ID:", linkedEmailId);
      
//       if (!linkedEmailId) {
//         throw new Error('No linked email ID found');
//       }
      
//       // Use Djombi-enhanced API endpoint
//       const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/sent?email_id=${encodeURIComponent(linkedEmailId)}`;
//       console.log("Fetching from API endpoint with Djombi integration:", apiEndpoint);
      
//       const response = await axios.get(apiEndpoint, {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${authToken}`,
//           // Add Djombi-specific headers if needed
//           'X-Djombi-Token': djombiTokens.accessTokenDjombi,
//           'X-Adafri-Token': djombiTokens.accessTokenAdafri,
//         }
//       });
      
//       console.log("GET response data with Djombi:", response.data);
      
//       // Check for success/error in response
//       if (response.data.success === false) {
//         const errorMessage = response.data.message || 'API request failed';
//         console.error("API error:", errorMessage);
//         throw new Error(`API error: ${errorMessage}`);
//       }
      
//       processResponseData(response.data);
//     } catch (err) {
//       console.error('Failed to fetch sent emails:', err);
//       setError(err instanceof Error ? err.message : 'Failed to fetch sent emails');
      
//       // Fallback to local data if API fails
//       const localSentEmails = emails.filter(email => email.status === "sent");
//       if (localSentEmails.length > 0) {
//         console.log("Using local sent emails as fallback");
//         setApiSentEmails([]);
//       }
//     } finally {
//       setIsLoading(false);
//       setIsRefreshing(false);
//     }
//   };
  
//   // Helper function to process response data
//   const processResponseData = (data: any) => {
//     // Check if data contains emails (handle different response structures)
//     let emailsData: any[] = [];
    
//     if (Array.isArray(data)) {
//       emailsData = data;
//     } else if (data.data && Array.isArray(data.data)) {
//       emailsData = data.data;
//     } else if (data.sent && Array.isArray(data.sent)) {
//       emailsData = data.sent;
//     } else if (data.emails && Array.isArray(data.emails)) {
//       emailsData = data.emails;
//     } else {
//       console.log("Response structure different than expected:", data);
//       // Look for any array in the response that might contain emails
//       for (const key in data) {
//         if (Array.isArray(data[key]) && data[key].length > 0) {
//           console.log(`Found array in response at key: ${key}`, data[key]);
//           emailsData = data[key];
//           break;
//         }
//       }
//     }
    
//     if (emailsData.length === 0) {
//       console.log("No emails found in the response");
//       setApiSentEmails([]);
//       return;
//     }
    
//     console.log("Sample email data structure:", emailsData[0]);
    
//     // First, filter out invalid emails, then map them to the correct structure
//     const validEmailsData = emailsData.filter(email => email && typeof email === 'object');
    
//     // Now map the valid emails to the correct structure
//     const formattedEmails: Email[] = validEmailsData.map((email: any): Email => {
//       return {
//         id: email.id || email._id || `sent-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
//         subject: email.subject || 'No Subject',
//         content: email.content || '',
//         contentType: email.contentType || 'text',  // Add this if it's required in your Email interface
//         from: email.from || email.sender || 'Unknown Sender',
//         to: email.to || email.recipient || '',
//         timestamp: email.timestamp || email.createdAt || email.created_at || new Date().toISOString(),
//         status: "sent",
//         isUrgent: Boolean(email.isUrgent || email.is_urgent || false),
//         hasAttachment: Boolean(email.hasAttachment || email.has_attachment || false),
//         category: "sent",
//         isRead: true, // Sent emails are always read
//         email_id: email.email_id || null  // Add this if it's required in your Email interface
//       };
//     });
    
//     console.log(`Processed ${formattedEmails.length} sent emails with Djombi integration`);
    
//     // Add to email store first
//     formattedEmails.forEach(email => {
//       // Check if email already exists in store to prevent duplicates
//       const exists = emails.some(e => e.id === email.id);
//       if (!exists) {
//         addEmail({
//           ...email,
//           status: "sent",
//         });
//       }
//     });
    
//     setApiSentEmails(formattedEmails);
//   };

//   // Function to make Djombi-specific API calls (example usage)
//   const performDjombiAction = async (emailId: string, action: string) => {
//     if (!djombiTokens) {
//       console.error('Djombi tokens not available for action:', action);
//       return;
//     }

//     try {
//       const response = await axios.post(`https://be-auth-server.onrender.com/api/v1/emails/sent?email_id`, {
//         emailId,
//         action
//       }, {
//         headers: {
//           'Authorization': `Bearer ${djombiTokens.accessTokenDjombi}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       console.log('Djombi action completed:', response.data);
//     } catch (error) {
//       console.error('Djombi action failed:', error);
//     }
//   };
  
//   useEffect(() => {
//     // Only fetch when djombiTokens are available
//     if (djombiTokens) {
//       fetchSentEmails();
//     }
//   }, [emails, addEmail, djombiTokens]);
  
//   const handleRefresh = () => {
//     setIsRefreshing(true);
//     fetchSentEmails();
//   };
  
//   // Combine sent emails from store and API
//   const allSentEmails = [
//     ...emails.filter(email => email.status === "sent"),
//     ...apiSentEmails
//   ];
  
//   // Remove duplicates by id
//   const uniqueSentEmails = allSentEmails.filter(
//     (email, index, self) => 
//       index === self.findIndex(e => e.id === email.id)
//   );
  
//   // Sort by date
//   const sortedEmails = [...uniqueSentEmails].sort((a, b) => {
//     const dateA = new Date(a.timestamp || "").getTime();
//     const dateB = new Date(b.timestamp || "").getTime();
//     return sortNewest ? dateB - dateA : dateA - dateB;
//   });
  
//   // Filter by date if filterDate is set
//   const displayedEmails = filterDate 
//     ? sortedEmails.filter(email => {
//         const emailDate = new Date(email.timestamp || "").toLocaleDateString();
//         return emailDate === filterDate;
//       })
//     : sortedEmails;

//   const toggleSort = () => {
//     setSortNewest(!sortNewest);
//   };

//   const toggleSelect = (emailId: string, event: React.MouseEvent) => {
//     // Prevent triggering the row click when selecting checkbox
//     event.stopPropagation();
    
//     setSelectedEmails(prev => 
//       prev.includes(emailId) 
//         ? prev.filter(id => id !== emailId)
//         : [...prev, emailId]
//     );
//   };
  
//   // Handle row click to open dialog
//   const handleRowClick = (email: Email) => {
//     setSelectedEmail(email);
//     setShowDialog(true);
    
//     // Example: Track email view with Djombi
//     if (djombiTokens && email.id) {
//       performDjombiAction(email.id, 'view');
//     }
//   };

//   // Show loading state if Djombi tokens are not yet available
//   if (!djombiTokens) {
//     return (
//       <div className="w-full h-full flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
//           <p className="text-muted-foreground">Initializing Djombi integration...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full h-full overflow-y-auto pb-4">
//       {onBack && (
//         <Button variant="ghost" size="icon" onClick={onBack} className="mb-4">
//           <ArrowLeft className="w-4 h-4" />
//         </Button>
//       )}
      
//       <div className="border rounded-lg bg-white overflow-hidden h-[calc(100vh-120px)]">
//         <div className="sticky top-0 bg-background z-10 p-4 border-b">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center gap-2">
//               <h2 className="text-xl font-semibold">Sent</h2>
//               {/* Djombi status indicator */}
//               <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
//                 <div className="w-2 h-2 bg-green-500 rounded-full"></div>
//                 Djombi
//               </div>
//             </div>
//             <div className="flex items-center gap-2">
//               <Button 
//                 variant="outline" 
//                 size="sm" 
//                 onClick={toggleSort}
//               >
//                 Sort: {sortNewest ? "Newest" : "Oldest"}
//               </Button>
//               <Button 
//                 variant="outline" 
//                 size="icon" 
//                 onClick={handleRefresh}
//                 disabled={isRefreshing}
//               >
//                 <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
//               </Button>
//               <Button variant="outline" size="icon">
//                 <Filter className="w-4 h-4" />
//               </Button>
//             </div>
//           </div>
//         </div>

//         <div className="overflow-y-auto h-[calc(100%-60px)]">
//           {isLoading ? (
//             <div className="flex justify-center items-center h-full">
//               <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
//             </div>
//           ) : error ? (
//             <div className="text-center py-8">
//               <p className="text-red-500">{error}</p>
//               <Button 
//                 className="mt-4" 
//                 variant="outline" 
//                 onClick={handleRefresh}
//               >
//                 Try Again
//               </Button>
//             </div>
//           ) : displayedEmails.length === 0 ? (
//             <div className="text-center py-8 text-muted-foreground">
//               No sent emails found.
//             </div>
//           ) : (
//             <div className="space-y-0">
//               {displayedEmails.map((email) => (
//                 <div 
//                   key={email.id} 
//                   className="flex items-center px-4 py-3 border-b last:border-b-0 hover:bg-slate-50 transition-colors cursor-pointer"
//                   onClick={() => handleRowClick(email)}
//                 >
//                   <div className="mr-3" onClick={(e) => e.stopPropagation()}>
//                     <Checkbox
//                       checked={selectedEmails.includes(email.id || "")}
//                       onCheckedChange={() => {}}
//                       onClick={(e) => toggleSelect(email.id || "", e as React.MouseEvent)}
//                     />
//                   </div>
//                   <div className="flex-1 grid grid-cols-12 gap-2">
//                     <div className="col-span-2 text-sm text-gray-600 truncate pr-2">
//                       To: {email.to}
//                     </div>
//                     <div className="col-span-7 flex items-center">
//                       <div className="text-sm truncate">
//                         <span className="font-medium">{email.subject}</span>
//                         {email.content && (
//                           <span className="text-gray-500"> - {mounted ? createEmailPreview(email.content, 50) : ''}</span>
//                         )}
//                       </div>
//                     </div>
//                     <div className="col-span-3 text-right text-sm text-gray-500">
//                       {email.timestamp ? 
//                         new Date(email.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
//                         ""}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
      
//       {/* Email Details Dialog */}
//       <Dialog open={showDialog} onOpenChange={setShowDialog}>
//         <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
//           <DialogHeader>
//             <div className="flex justify-between items-center">
//               <DialogTitle>{selectedEmail?.subject || "Email Details"}</DialogTitle>
//               <DialogClose asChild>
//                 <Button variant="ghost" size="icon">
//                   <X className="w-4 h-4" />
//                 </Button>
//               </DialogClose>
//             </div>
//           </DialogHeader>
          
//           {selectedEmail && (
//             <div className="space-y-4">
//               <div className="grid grid-cols-12 gap-2 text-sm">
//                 <div className="col-span-2 font-medium">From:</div>
//                 <div className="col-span-10">{selectedEmail.from}</div>
                
//                 <div className="col-span-2 font-medium">To:</div>
//                 <div className="col-span-10">{selectedEmail.to}</div>
                
//                 <div className="col-span-2 font-medium">Date:</div>
//                 <div className="col-span-10">
//                   {selectedEmail.timestamp ? 
//                     new Date(selectedEmail.timestamp).toLocaleString() : 
//                     ""}
//                 </div>
//               </div>
              
//               <div className="mt-4 border-t pt-4">
//                 <div className="prose prose-sm max-w-none">
//                   {mounted && <EmailContentRenderer content={selectedEmail.content} />}
//                 </div>
//               </div>

//               {/* Djombi-powered actions */}
//               {djombiTokens && (
//                 <div className="mt-4 border-t pt-4">
//                   <div className="flex gap-2">
//                     <Button 
//                       variant="outline" 
//                       size="sm"
//                       onClick={() => selectedEmail.id && performDjombiAction(selectedEmail.id, 'archive')}
//                     >
//                       Archive
//                     </Button>
//                     <Button 
//                       variant="outline" 
//                       size="sm"
//                       onClick={() => selectedEmail.id && performDjombiAction(selectedEmail.id, 'mark-important')}
//                     >
//                       Mark Important
//                     </Button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default EmailSent;

































































