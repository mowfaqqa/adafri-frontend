import { useEmailStore } from "@/lib/store/email-store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, RefreshCw, X } from "lucide-react";
import { useState, useEffect, useContext } from "react";
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
import { useCombinedAuth } from "../providers/useCombinedAuth";


interface EmailSpamProps {
  onBack?: () => void;
}

export const EmailSpam = ({ onBack }: EmailSpamProps) => {
  const { emails, addEmail } = useEmailStore();
  const [apiSpamEmails, setApiSpamEmails] = useState<Email[]>([]);
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
  
  const fetchSpamEmails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get token from cookies
      // const token = getAuthToken();
      const { token, user } = useContext(AuthContext);
      console.log("Token retrieved:", token ? `${token.access_token.substring(0, 10)}...` : 'No token found');

      const { djombi } = useCombinedAuth()
      const djombiTokens = djombi.token || ""
      
      if (!token) {
        throw new Error('No access token available');
      }
      
      // Get linked email ID from cookies
      const linkedEmailId = getCookie('linkedEmailId');
      console.log("Linked Email ID:", linkedEmailId);
      
      if (!linkedEmailId) {
        throw new Error('No linked email ID found');
      }
      
      // Use axios instead of fetch
      const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/spam?email_id=${encodeURIComponent(linkedEmailId)}`;
      console.log("Fetching from API endpoint:", apiEndpoint);
      
      const response = await axios.get(apiEndpoint, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${djombiTokens}`
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
      console.error('Failed to fetch spam emails:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch spam emails');
      
      // Fallback to local data if API fails
      const localSpamEmails = emails.filter(email => email.category === "spam");
      if (localSpamEmails.length > 0) {
        console.log("Using local spam emails as fallback");
        setApiSpamEmails([]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  // Helper function to process response data
  const processResponseData = (data: any) => {
    // Check if data contains emails (handle different response structures)
    let emailsData: any[] = [];
    
    if (Array.isArray(data)) {
      emailsData = data;
    } else if (data.data && Array.isArray(data.data)) {
      emailsData = data.data;
    } else if (data.spam && Array.isArray(data.spam)) {
      emailsData = data.spam;
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
      console.log("No spam emails found in the response");
      setApiSpamEmails([]);
      return;
    }
    
    console.log("Sample email data structure:", emailsData[0]);
    
    // First, filter out invalid emails, then map them to the correct structure
    const validEmailsData = emailsData.filter(email => email && typeof email === 'object');
    
    // Now map the valid emails to the correct structure
    const formattedEmails: Email[] = validEmailsData.map((email: any): Email => {
      return {
        id: email.id || email._id || `spam-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        subject: email.subject || 'No Subject',
        content: email.content || '',
        contentType: email.contentType || 'text',
        from: email.from || email.sender || 'Unknown Sender',
        to: email.to || email.recipient || '',
        timestamp: email.timestamp || email.createdAt || email.created_at || new Date().toISOString(),
        status: "read",
        isUrgent: Boolean(email.isUrgent || email.is_urgent || false),
        hasAttachment: Boolean(email.hasAttachment || email.has_attachment || false),
        category: "spam",
        isRead: true,
        email_id: email.email_id || null
      };
    });
    
    console.log(`Processed ${formattedEmails.length} spam emails`);
    
    // Add to email store first
    formattedEmails.forEach(email => {
      // Check if email already exists in store to prevent duplicates
      const exists = emails.some(e => e.id === email.id);
      if (!exists) {
        addEmail({
          ...email,
        //   category: "spam",
        });
      }
    });
    
    setApiSpamEmails(formattedEmails);
  };
  
  useEffect(() => {
    fetchSpamEmails();
  }, [emails, addEmail]);
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSpamEmails();
  };
  
  // Combine spam emails from store and API
  const allSpamEmails = [
    ...emails.filter(email => email.category === "spam"),
    ...apiSpamEmails
  ];
  
  // Remove duplicates by id
  const uniqueSpamEmails = allSpamEmails.filter(
    (email, index, self) => 
      index === self.findIndex(e => e.id === email.id)
  );
  
  // Sort by date
  const sortedEmails = [...uniqueSpamEmails].sort((a, b) => {
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

  // Handle moving email from spam to inbox
  const handleMoveToInbox = (emailId: string) => {
    // Implementation would depend on your email store and API structure
    console.log(`Move email ${emailId} to inbox`);
    // You would typically make an API call here and update your local store
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
            <h2 className="text-xl font-semibold">Spam</h2>
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
              No spam emails found.
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
                      From: {email.from}
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
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedEmail?.id) {
                      handleMoveToInbox(selectedEmail.id);
                      setShowDialog(false);
                    }
                  }}
                >
                  Not Spam
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDialog(false)}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailSpam;





































// import { useEmailStore } from "@/store/email-store";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Filter, Trash2, Send, Archive } from "lucide-react";
// import { useState, useEffect } from "react";
// import { Email, EmailCategory } from "@/lib/types/email";
// import { Checkbox } from "@/components/ui/checkbox";
// import Link from "next/link";           
// import { getAuthToken, getCookie, isAuthenticated } from "@/lib/utils/cookies"; // Import cookie utilities

// interface EmailSpamProps {
//     onBack?: () => void;
// }

// export const EmailSpam = ({ onBack }: EmailSpamProps) => {
//     const { emails } = useEmailStore();
//     const [apiSpamEmails, setApiSpamEmails] = useState<Email[]>([]);
//     const [filterDate, setFilterDate] = useState<string | null>(null);
//     const [sortNewest, setSortNewest] = useState(true);
//     const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);

//     useEffect(() => {
//         const fetchSpamEmails = async () => {
//             setIsLoading(true);
//             setError(null);

//             try {
//                 // Get token from cookies instead of localStorage
//                 const token = getAuthToken();
//                 console.log("Token retrieved:", token ? `${token.substring(0, 10)}...` : 'No token found');

//                 if (!token) {
//                     throw new Error('No access token available');
//                 }

//                 // Get linked email ID from cookies instead of localStorage
//                 const linkedEmailId = getCookie('linkedEmailId');
//                 console.log("Linked Email ID:", linkedEmailId);

//                 if (!linkedEmailId) {
//                     throw new Error('No linked email ID found');
//                 }

//                 // Use query parameters with GET request for spam emails
//                 const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/spam?email_id=${encodeURIComponent(linkedEmailId)}`;
//                 console.log("Fetching from API endpoint:", apiEndpoint);

//                 const response = await fetch(apiEndpoint, {
//                     method: 'GET',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'Authorization': `Bearer ${token}`
//                     }
//                     // No body for GET requests
//                 });

//                 // If the GET request fails, try with POST instead
//                 if (!response.ok) {
//                     console.log("GET request failed with status:", response.status);

//                     // Alternative: Use POST if the API requires sending data in the body
//                     const postEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/spam';
//                     console.log("Trying POST request to:", postEndpoint);

//                     const postResponse = await fetch(postEndpoint, {
//                         method: 'POST', // Change to POST for body
//                         headers: {
//                             'Content-Type': 'application/json',
//                             'Authorization': `Bearer ${token}`
//                         },
//                         body: JSON.stringify({
//                             email_id: linkedEmailId
//                         })
//                     });

//                     // Process the POST response
//                     const postResponseText = await postResponse.text();
//                     console.log("POST raw response:", postResponseText);

//                     let postData;
//                     try {
//                         postData = JSON.parse(postResponseText);
//                         console.log("POST parsed response data:", postData);
//                     } catch (e) {
//                         console.error("Failed to parse POST response as JSON:", e);
//                         throw new Error(`Invalid POST response format: ${postResponseText.substring(0, 100)}...`);
//                     }

//                     // Check for success/error in POST response
//                     if (!postResponse.ok || postData.success === false) {
//                         const errorMessage = postData.message || postResponse.statusText;
//                         console.error("API POST error:", errorMessage);
//                         throw new Error(`API POST error: ${errorMessage}`);
//                     }

//                     // Process the successful POST response
//                     processResponseData(postData);
//                     return;
//                 }

//                 // Process the successful GET response
//                 const responseText = await response.text();
//                 console.log("Raw response:", responseText);

//                 let data;
//                 try {
//                     data = JSON.parse(responseText);
//                     console.log("Parsed response data:", data);
//                 } catch (e) {
//                     console.error("Failed to parse response as JSON:", e);
//                     throw new Error(`Invalid response format: ${responseText.substring(0, 100)}...`);
//                 }

//                 // Check for success/error in response
//                 if (data.success === false) {
//                     const errorMessage = data.message || response.statusText;
//                     console.error("API error:", errorMessage);
//                     throw new Error(`API error: ${errorMessage}`);
//                 }

//                 processResponseData(data);
//             } catch (err) {
//                 console.error('Error fetching spam emails:', err);
//                 setError(err instanceof Error ? err.message : 'Failed to fetch spam emails');
//             } finally {
//                 setIsLoading(false);
//             }
//         };

//         // Helper function to process response data
//         const processResponseData = (data: any) => {
//             // Check if data contains emails (handle different response structures)
//             let emailsData: any[] = [];

//             if (Array.isArray(data)) {
//                 emailsData = data;
//             } else if (data.data && Array.isArray(data.data)) {
//                 emailsData = data.data;
//             } else if (data.spam && Array.isArray(data.spam)) {
//                 emailsData = data.spam;
//             } else {
//                 console.log("Response structure different than expected:", data);
//                 // Look for any array in the response that might contain emails
//                 for (const key in data) {
//                     if (Array.isArray(data[key]) && data[key].length > 0) {
//                         console.log(`Found array in response at key: ${key}`, data[key]);
//                         emailsData = data[key];
//                         break;
//                     }
//                 }
//             }

//             if (emailsData.length > 0) {
//                 console.log("Sample email data structure:", emailsData[0]);
//             }

//             // Format emails and ensure they have proper structure
//             const formattedEmails = emailsData.map((email: any) => ({
//                 ...email,
//                 id: email.id || email._id || `spam-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
//                 content: email.content || email.body?.content || '',
//                 createdAt: email.createdAt || email.created_at || Date.now(),
//                 status: "spam"
//             }));

//             setApiSpamEmails(formattedEmails);
//         };

//         fetchSpamEmails();
//     }, []);

//     // Sort and filter emails
//     const sortedAndFilteredEmails = [...apiSpamEmails]
//         .filter(email => {
//             if (!filterDate) return true;
//             const emailDate = new Date(email.timestamp ?? Date.now()).toDateString();
//             return emailDate === filterDate;
//         })
//         .sort((a, b) => {
//             const dateA = new Date(a.timestamp ?? Date.now()).getTime();
//             const dateB = new Date(b.timestamp ?? Date.now()).getTime();
//             return sortNewest ? dateB - dateA : dateA - dateB;
//         });

//     const toggleSelectEmail = (id: string) => {
//         setSelectedEmails(prev =>
//             prev.includes(id)
//                 ? prev.filter(emailId => emailId !== id)
//                 : [...prev, id]
//         );
//     };

//     const selectAllEmails = () => {
//         if (selectedEmails.length === sortedAndFilteredEmails.length) {
//             setSelectedEmails([]);
//         } else {
//             setSelectedEmails(sortedAndFilteredEmails.map(email => email.id || ''));
//         }
//     };

//     const deleteSpam = async () => {
//         if (selectedEmails.length === 0) return;

//         try {
//             // Get token and email ID from cookies
//             const token = getAuthToken();
//             const linkedEmailId = getCookie('linkedEmailId');

//             if (!token) {
//                 throw new Error('No access token found');
//             }

//             if (!linkedEmailId) {
//                 throw new Error('No linked email ID found');
//             }

//             // Direct API call with proper endpoint for deleting spam emails
//             const responses = await Promise.all(
//                 selectedEmails.map(id =>
//                     fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/spam/${id}?email_id=${encodeURIComponent(linkedEmailId)}`, {
//                         method: 'DELETE',
//                         headers: {
//                             'Authorization': `Bearer ${token}`,
//                             'Content-Type': 'application/json'
//                         }
//                     })
//                 )
//             );

//             // If any DELETE requests failed, try with POST method for deletion
//             const failedDeletes = responses.filter(response => !response.ok);

//             if (failedDeletes.length > 0) {
//                 console.log(`${failedDeletes.length} DELETE requests failed. Trying alternative approach...`);

//                 // Try POST method for deletion if supported by your API
//                 const alternativeResponses = await Promise.all(
//                     selectedEmails.map(id =>
//                         fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/spam/delete`, {
//                             method: 'POST',
//                             headers: {
//                                 'Authorization': `Bearer ${token}`,
//                                 'Content-Type': 'application/json'
//                             },
//                             body: JSON.stringify({
//                                 email_id: linkedEmailId,
//                                 spam_id: id
//                             })
//                         })
//                     )
//                 );

//                 const stillFailedDeletes = alternativeResponses.filter(response => !response.ok);
//                 if (stillFailedDeletes.length > 0) {
//                     throw new Error(`Failed to delete ${stillFailedDeletes.length} spam emails using alternative method`);
//                 }
//             }

//             // Remove deleted emails from state
//             setApiSpamEmails(prev =>
//                 prev.filter(email => !selectedEmails.includes(email.id || ''))
//             );

//             // Clear selection
//             setSelectedEmails([]);

//         } catch (err) {
//             console.error('Error deleting spam emails:', err);
//             setError(err instanceof Error ? err.message : 'Failed to delete spam emails');
//         }
//     };

//     const notSpam = async () => {
//         if (selectedEmails.length === 0) return;

//         try {
//             // Get token and email ID from cookies
//             const token = getAuthToken();
//             const linkedEmailId = getCookie('linkedEmailId');

//             if (!token) {
//                 throw new Error('No access token found');
//             }

//             if (!linkedEmailId) {
//                 throw new Error('No linked email ID found');
//             }

//             // Mark emails as not spam (move to inbox)
//             const responses = await Promise.all(
//                 selectedEmails.map(id =>
//                     fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/spam/${id}/notspam`, {
//                         method: 'POST',
//                         headers: {
//                             'Authorization': `Bearer ${token}`,
//                             'Content-Type': 'application/json'
//                         },
//                         body: JSON.stringify({
//                             email_id: linkedEmailId
//                         })
//                     })
//                 )
//             );

//             const failedRequests = responses.filter(response => !response.ok);
//             if (failedRequests.length > 0) {
//                 throw new Error(`Failed to mark ${failedRequests.length} emails as not spam`);
//             }

//             // Remove moved emails from state
//             setApiSpamEmails(prev =>
//                 prev.filter(email => !selectedEmails.includes(email.id || ''))
//             );

//             // Clear selection
//             setSelectedEmails([]);

//         } catch (err) {
//             console.error('Error marking emails as not spam:', err);
//             setError(err instanceof Error ? err.message : 'Failed to mark emails as not spam');
//         }
//     };

//     const formatDate = (dateString: string | undefined) => {
//         if (!dateString) return '';

//         const date = new Date(dateString);
//         const today = new Date();
//         const yesterday = new Date(today);
//         yesterday.setDate(yesterday.getDate() - 1);

//         if (date.toDateString() === today.toDateString()) {
//             return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//         } else if (date.toDateString() === yesterday.toDateString()) {
//             return 'Yesterday';
//         } else {
//             return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
//         }
//     };

//     return (
//         <div className="flex flex-col rounded-lg h-full bg-white">
//             {/* Header */}
//             <div className="flex items-center justify-between p-4 border-b">
//                 <div className="flex items-center space-x-4">
//                     {onBack && (
//                         <Button variant="ghost" size="icon" onClick={onBack}>
//                             <ArrowLeft className="h-5 w-5" />
//                         </Button>
//                     )}
//                     <h1 className="text-xl font-semibold">Spam</h1>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                     <Button
//                         variant="outline"
//                         className="flex items-center gap-2"
//                         onClick={() => setSortNewest(!sortNewest)}
//                     >
//                         <Filter className="h-4 w-4" />
//                         {sortNewest ? 'Newest' : 'Oldest'}
//                     </Button>
//                 </div>
//             </div>

//             {/* Email List */}
//             <div className="flex-grow overflow-auto">
//                 {isLoading ? (
//                     <div className="flex justify-center items-center h-32">
//                         <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
//                     </div>
//                 ) : error ? (
//                     <div className="p-4 text-red-500">{error}</div>
//                 ) : sortedAndFilteredEmails.length === 0 ? (
//                     <div className="p-8 text-center text-gray-500">
//                         <p>No spam emails found</p>
//                     </div>
//                 ) : (
//                     <div className="divide-y">
//                         <div className="p-2 flex items-center bg-gray-50">
//                             <Checkbox
//                                 checked={selectedEmails.length === sortedAndFilteredEmails.length && sortedAndFilteredEmails.length > 0}
//                                 onCheckedChange={selectAllEmails}
//                                 className="ml-4"
//                             />
//                             {selectedEmails.length > 0 && (
//                                 <div className="ml-4 flex items-center space-x-2">
//                                     <Button
//                                         variant="ghost"
//                                         size="sm"
//                                         onClick={notSpam}
//                                         className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
//                                     >
//                                         <Send className="h-4 w-4 mr-1" />
//                                         Not Spam
//                                     </Button>
//                                     <Button
//                                         variant="ghost"
//                                         size="sm"
//                                         onClick={deleteSpam}
//                                         className="text-red-500 hover:text-red-700 hover:bg-red-50"
//                                     >
//                                         <Trash2 className="h-4 w-4 mr-1" />
//                                         Delete
//                                     </Button>
//                                 </div>
//                             )}
//                         </div>

//                         {sortedAndFilteredEmails.map((email) => (
//                             <div
//                                 key={email.id || `spam-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`}
//                                 className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedEmails.includes(email.id || '') ? 'bg-blue-50' : ''}`}
//                             >
//                                 <div className="flex items-center justify-between">
//                                     <div className="flex items-center space-x-3 flex-grow">
//                                         <div>
//                                             <Checkbox
//                                                 checked={selectedEmails.includes(email.id || '')}
//                                                 onCheckedChange={() => toggleSelectEmail(email.id || '')}
//                                             />
//                                         </div>
//                                         <div className="flex-grow">
//                                             <div className="flex-1 grid grid-cols-12 gap-2">
//                                                 <div className="col-span-2 text-sm font-medium text-gray-600">
//                                                     {email.from}
//                                                 </div>
//                                                 <div className="col-span-7 flex items-center">
//                                                     <div className="text-sm truncate">
//                                                         <span className="font-medium">{email.subject}</span> - {email.content}
//                                                     </div>
//                                                 </div>
//                                                 <div className="col-span-3 text-right text-sm text-gray-500">
//                                                     {formatDate((email as any).timestamp?.toString())}
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                     <div className="flex space-x-2 ml-4">
//                                         <Button
//                                             variant="ghost"
//                                             size="sm"
//                                             className="text-blue-500 hover:text-blue-700"
//                                             onClick={() => {
//                                                 setSelectedEmails([email.id || '']);
//                                                 notSpam();
//                                             }}
//                                         >
//                                             <Send className="h-4 w-4 mr-1" />
//                                             Not Spam
//                                         </Button>
//                                         <Button
//                                             variant="ghost"
//                                             size="sm"
//                                             className="text-red-500 hover:text-red-700"
//                                             onClick={() => {
//                                                 setSelectedEmails([email.id || '']);
//                                                 deleteSpam();
//                                             }}
//                                         >
//                                             <Trash2 className="h-4 w-4 mr-1" />
//                                             Delete
//                                         </Button>
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default EmailSpam;