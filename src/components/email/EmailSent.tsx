import { useEmailStore } from "@/store/email-store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { Email, EmailCategory } from "@/lib/types/email";
import { Checkbox } from "@/components/ui/checkbox";
import { getAuthToken, getCookie } from "@/lib/utils/cookies";

interface EmailSentProps {
  onBack?: () => void;
}

export const EmailSent = ({ onBack }: EmailSentProps) => {
  const { emails, addEmail } = useEmailStore();
  const [apiSentEmails, setApiSentEmails] = useState<Email[]>([]);
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [sortNewest, setSortNewest] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchSentEmails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get token from cookies
        const token = getAuthToken();
        console.log("Token retrieved:", token ? `${token.substring(0, 10)}...` : 'No token found');
        
        if (!token) {
          throw new Error('No access token available');
        }
        
        // Get linked email ID from cookies
        const linkedEmailId = getCookie('linkedEmailId');
        console.log("Linked Email ID:", linkedEmailId);
        
        if (!linkedEmailId) {
          throw new Error('No linked email ID found');
        }
        
        // Use GET request only
        const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/sent?email_id=${encodeURIComponent(linkedEmailId)}`;
        console.log("Fetching from API endpoint:", apiEndpoint);
        
        const response = await fetch(apiEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`API request failed with status: ${response.status}`);
        }
        
        const responseText = await response.text();
        console.log("GET raw response:", responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
          console.log("GET parsed response data:", data);
        } catch (e) {
          console.error("Failed to parse GET response as JSON:", e);
          throw new Error(`Invalid response format: ${responseText.substring(0, 100)}...`);
        }
        
        // Check for success/error in response
        if (data.success === false) {
          const errorMessage = data.message || response.statusText;
          console.error("API error:", errorMessage);
          throw new Error(`API error: ${errorMessage}`);
        }
        
        processResponseData(data);
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
      }
    };
    
    // Helper function to process response data
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
    
    fetchSentEmails();
  }, [emails, addEmail]);
  
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

  const toggleSelect = (emailId: string) => {
    setSelectedEmails(prev => 
      prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
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
                onClick={() => window.location.reload()}
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
                  className="flex items-center px-4 py-3 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
                >
                  <div className="mr-3">
                    <Checkbox
                      checked={selectedEmails.includes(email.id || "")}
                      onCheckedChange={() => toggleSelect(email.id || "")}
                    />
                  </div>
                  <div className="flex-1 grid grid-cols-12 gap-2">
                    <div className="col-span-2 text-sm text-gray-600">
                      To: {email.to}
                    </div>
                    <div className="col-span-7 flex items-center">
                      <div className="text-sm truncate">
                        {email.subject} - {email.content}
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
    </div>
  );
};

export default EmailSent;



















// import { useEmailStore } from "@/store/email-store";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Filter } from "lucide-react";
// import { useState, useEffect } from "react";
// import { Email, EmailCategory } from "@/lib/types/email";
// import { Checkbox } from "@/components/ui/checkbox";

// interface EmailSentProps {
//   onBack?: () => void;
// }

// // Helper function to get access token from localStorage
// const getAccessToken = () => {
//   return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
// };

// // Helper function to get linked email ID from localStorage
// const getLinkedEmailId = () => {
//   return typeof window !== 'undefined' ? localStorage.getItem('linkedEmailId') : null;
// };

// export const EmailSent = ({ onBack }: EmailSentProps) => {
//   const { emails, addEmail } = useEmailStore(); // Added addEmail from store
//   const [apiSentEmails, setApiSentEmails] = useState<Email[]>([]);
//   const [filterDate, setFilterDate] = useState<string | null>(null);
//   const [sortNewest, setSortNewest] = useState(true);
//   const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
  
//   useEffect(() => {
//     const fetchSentEmails = async () => {
//       setIsLoading(true);
//       setError(null);
      
//       try {
//         // Get token from localStorage
//         const token = getAccessToken();
//         console.log("Token retrieved:", token ? `${token.substring(0, 10)}...` : 'No token found');
        
//         if (!token) {
//           throw new Error('No access token available');
//         }
        
//         // Get linked email ID from localStorage
//         const linkedEmailId = getLinkedEmailId();
//         console.log("Linked Email ID:", linkedEmailId);
        
//         if (!linkedEmailId) {
//           throw new Error('No linked email ID found');
//         }
        
//         // Try POST request first as it might be more reliable
//         const postEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/sent';
//         console.log("Trying POST request to:", postEndpoint);
        
//         try {
//           const postResponse = await fetch(postEndpoint, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//               'Authorization': `Bearer ${token}`
//             },
//             body: JSON.stringify({ email_id: linkedEmailId })
//           });
          
//           // Process the POST response
//           const postResponseText = await postResponse.text();
//           console.log("POST raw response:", postResponseText);
          
//           let postData;
//           try {
//             postData = JSON.parse(postResponseText);
//             console.log("POST parsed response data:", postData);
            
//             // Check for success/error in POST response
//             if (!postResponse.ok || postData.success === false) {
//               console.log("POST request failed, trying GET instead");
//               throw new Error("POST request failed");
//             }
            
//             // Process the successful POST response
//             processResponseData(postData);
//             return;
//           } catch (e) {
//             console.error("Failed to parse POST response as JSON or request failed:", e);
//             // Continue to GET request
//           }
//         } catch (postError) {
//           console.error("POST request failed:", postError);
//           // Continue to GET request
//         }
        
//         // If POST failed or errored, try GET request
//         const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/sent?email_id=${encodeURIComponent(linkedEmailId)}`;
//         console.log("Fetching from API endpoint:", apiEndpoint);
        
//         const response = await fetch(apiEndpoint, {
//           method: 'GET',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           }
//         });
        
//         if (!response.ok) {
//           throw new Error(`API request failed with status: ${response.status}`);
//         }
        
//         const responseText = await response.text();
//         console.log("GET raw response:", responseText);
        
//         let data;
//         try {
//           data = JSON.parse(responseText);
//           console.log("GET parsed response data:", data);
//         } catch (e) {
//           console.error("Failed to parse GET response as JSON:", e);
//           throw new Error(`Invalid response format: ${responseText.substring(0, 100)}...`);
//         }
        
//         // Check for success/error in response
//         if (data.success === false) {
//           const errorMessage = data.message || response.statusText;
//           console.error("API error:", errorMessage);
//           throw new Error(`API error: ${errorMessage}`);
//         }
        
//         processResponseData(data);
//       } catch (err) {
//         console.error('Failed to fetch sent emails:', err);
//         setError(err instanceof Error ? err.message : 'Failed to fetch sent emails');
        
//         // Fallback to local data if API fails
//         const localSentEmails = emails.filter(email => email.status === "sent");
//         if (localSentEmails.length > 0) {
//           console.log("Using local sent emails as fallback");
//           setApiSentEmails([]);
//         }
//       } finally {
//         setIsLoading(false);
//       }
//     };
    
//     // Helper function to process response data
//     const processResponseData = (data: any) => {
//       // Check if data contains emails (handle different response structures)
//       let emailsData: any[] = [];
      
//       if (Array.isArray(data)) {
//         emailsData = data;
//       } else if (data.data && Array.isArray(data.data)) {
//         emailsData = data.data;
//       } else if (data.sent && Array.isArray(data.sent)) {
//         emailsData = data.sent;
//       } else if (data.emails && Array.isArray(data.emails)) {
//         emailsData = data.emails;
//       } else {
//         console.log("Response structure different than expected:", data);
//         // Look for any array in the response that might contain emails
//         for (const key in data) {
//           if (Array.isArray(data[key]) && data[key].length > 0) {
//             console.log(`Found array in response at key: ${key}`, data[key]);
//             emailsData = data[key];
//             break;
//           }
//         }
//       }
      
//       if (emailsData.length > 0) {
//         console.log("Sample email data structure:", emailsData[0]);
//       } else {
//         console.log("No emails found in the response");
//         return;
//       }
      
//       // Format emails and ensure they have proper structure
//       const formattedEmails = emailsData.map((email: any) => ({
//         id: email.id || email._id || `sent-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
//         subject: email.subject || 'No Subject',
//         content: email.content || '',
//         from: email.from || email.sender || 'Unknown Sender',
//         to: email.to || email.recipient || '',
//         timestamp: email.timestamp || email.createdAt || email.created_at || new Date().toISOString(),
//         status: "sent",
//         isUrgent: email.isUrgent || email.is_urgent || false,
//         hasAttachment: email.hasAttachment || email.has_attachment || false,
//         category: "sent",
//         isRead: true // Sent emails are always read
//       }));
      
//       console.log(`Processed ${formattedEmails.length} sent emails`);
      
//       // Add to email store first
//       formattedEmails.forEach(email => {
//         // Check if email already exists in store to prevent duplicates
//         const exists = emails.some(e => e.id === email.id);
//         if (!exists) {
//           addEmail({
//             ...email,
//             status: "sent",
//             category: "sent"
//           });
//         }
//       });
      
//       setApiSentEmails(formattedEmails);
//     };
    
//     fetchSentEmails();
//   }, [emails, addEmail]); // Added dependencies
  
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

//   const toggleSelect = (emailId: string) => {
//     setSelectedEmails(prev => 
//       prev.includes(emailId) 
//         ? prev.filter(id => id !== emailId)
//         : [...prev, emailId]
//     );
//   };

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
//             <h2 className="text-xl font-semibold">Sent</h2>
//             <div className="flex items-center gap-2">
//               <Button 
//                 variant="outline" 
//                 size="sm" 
//                 onClick={toggleSort}
//               >
//                 Sort: {sortNewest ? "Newest" : "Oldest"}
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
//                 onClick={() => window.location.reload()}
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
//                   className="flex items-center px-4 py-3 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
//                 >
//                   <div className="mr-3">
//                     <Checkbox
//                       checked={selectedEmails.includes(email.id || "")}
//                       onCheckedChange={() => toggleSelect(email.id || "")}
//                     />
//                   </div>
//                   <div className="flex-1 grid grid-cols-12 gap-2">
//                     <div className="col-span-2 text-sm text-gray-600">
//                       To: {email.to}
//                     </div>
//                     <div className="col-span-7 flex items-center">
//                       <div className="text-sm truncate">
//                         {email.subject} - {email.content}
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
//     </div>
//   );
// };

// export default EmailSent;











// import { useEmailStore } from "@/store/email-store";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Filter } from "lucide-react";
// import { useState, useEffect } from "react";
// import { Email, EmailCategory } from "@/lib/types/email";
// import { Checkbox } from "@/components/ui/checkbox";

// interface EmailSentProps {
//   onBack?: () => void;
// }

// // Helper function to get access token from localStorage
// const getAccessToken = () => {
//   return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
// };

// // Helper function to get linked email ID from localStorage
// const getLinkedEmailId = () => {
//   return typeof window !== 'undefined' ? localStorage.getItem('linkedEmailId') : null;
// };

// export const EmailSent = ({ onBack }: EmailSentProps) => {
//   const { emails } = useEmailStore();
//   const [apiSentEmails, setApiSentEmails] = useState<Email[]>([]);
//   const [filterDate, setFilterDate] = useState<string | null>(null);
//   const [sortNewest, setSortNewest] = useState(true);
//   const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
  
//   useEffect(() => {
//     const fetchSentEmails = async () => {
//       setIsLoading(true);
//       setError(null);
      
//       try {
//         // Get token from localStorage
//         const token = getAccessToken();
//         console.log("Token retrieved:", token ? `${token.substring(0, 10)}...` : 'No token found');
        
//         if (!token) {
//           throw new Error('No access token available');
//         }
        
//         // Get linked email ID from localStorage
//         const linkedEmailId = getLinkedEmailId();
//         console.log("Linked Email ID:", linkedEmailId);
        
//         if (!linkedEmailId) {
//           throw new Error('No linked email ID found');
//         }
        
//         // Use query parameters with GET request
//         const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/sent?email_id=${encodeURIComponent(linkedEmailId)}`;
//         console.log("Fetching from API endpoint:", apiEndpoint);
        
//         const response = await fetch(apiEndpoint, {
//           method: 'GET',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           }
//           // No body for GET requests
//         });
        
//         // If the GET request fails, try with POST instead
//         if (!response.ok) {
//           console.log("GET request failed with status:", response.status);
          
//           // Alternative: Use POST if the API requires sending data in the body
//           const postEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/sent';
//           console.log("Trying POST request to:", postEndpoint);
          
//           const postResponse = await fetch(postEndpoint, {
//             method: 'POST', // Change to POST for body
//             headers: {
//               'Content-Type': 'application/json',
//               'Authorization': `Bearer ${token}`
//             },
//             body: JSON.stringify({ email_id: linkedEmailId })
//           });
          
//           // Process the POST response
//           const postResponseText = await postResponse.text();
//           console.log("POST raw response:", postResponseText);
          
//           let postData;
//           try {
//             postData = JSON.parse(postResponseText);
//             console.log("POST parsed response data:", postData);
//           } catch (e) {
//             console.error("Failed to parse POST response as JSON:", e);
//             throw new Error(`Invalid POST response format: ${postResponseText.substring(0, 100)}...`);
//           }
          
//           // Check for success/error in POST response
//           if (!postResponse.ok || postData.success === false) {
//             const errorMessage = postData.message || postResponse.statusText;
//             console.error("API POST error:", errorMessage);
//             throw new Error(`API POST error: ${errorMessage}`);
//           }
          
//           // Process the successful POST response
//           processResponseData(postData);
//           return;
//         }
        
//         // Process the successful GET response
//         const responseText = await response.text();
//         console.log("Raw response:", responseText);
        
//         let data;
//         try {
//           data = JSON.parse(responseText);
//           console.log("Parsed response data:", data);
//         } catch (e) {
//           console.error("Failed to parse response as JSON:", e);
//           throw new Error(`Invalid response format: ${responseText.substring(0, 100)}...`);
//         }
        
//         // Check for success/error in response
//         if (data.success === false) {
//           const errorMessage = data.message || response.statusText;
//           console.error("API error:", errorMessage);
//           throw new Error(`API error: ${errorMessage}`);
//         }
        
//         processResponseData(data);
//       } catch (err) {
//         console.error('Failed to fetch sent emails:', err);
//         setError(err instanceof Error ? err.message : 'Failed to fetch sent emails');
//       } finally {
//         setIsLoading(false);
//       }
//     };
    
//     // Helper function to process response data
//     const processResponseData = (data: any) => {
//       // Check if data contains emails (handle different response structures)
//       let emailsData: any[] = [];
      
//       if (Array.isArray(data)) {
//         emailsData = data;
//       } else if (data.data && Array.isArray(data.data)) {
//         emailsData = data.data;
//       } else if (data.sent && Array.isArray(data.sent)) {
//         emailsData = data.sent;
//       } else {
//         console.log("Response structure different than expected:", data);
//         // Look for any array in the response that might contain emails
//         for (const key in data) {
//           if (Array.isArray(data[key]) && data[key].length > 0) {
//             console.log(`Found array in response at key: ${key}`, data[key]);
//             emailsData = data[key];
//             break;
//           }
//         }
//       }
      
//       if (emailsData.length > 0) {
//         console.log("Sample email data structure:", emailsData[0]);
//       }
      
//       // Format emails and mark as sent
//       const formattedEmails = emailsData.map((email: any) => ({
//         ...email,
//         status: "sent"
//       }));
      
//       setApiSentEmails(formattedEmails);
//     };
    
//     fetchSentEmails();
//   }, []); // Empty dependency array means this runs once on mount
  
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

//   const toggleSelect = (emailId: string) => {
//     setSelectedEmails(prev => 
//       prev.includes(emailId) 
//         ? prev.filter(id => id !== emailId)
//         : [...prev, emailId]
//     );
//   };

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
//             <h2 className="text-xl font-semibold">Sent</h2>
//             <div className="flex items-center gap-2">
//               <Button 
//                 variant="outline" 
//                 size="sm" 
//                 onClick={toggleSort}
//               >
//                 Sort: {sortNewest ? "Newest" : "Oldest"}
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
//               <p className="text-muted-foreground">Loading sent emails...</p>
//             </div>
//           ) : error ? (
//             <div className="text-center py-8 text-red-500">
//               {error}
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
//                   className="flex items-center px-4 py-3 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
//                 >
//                   <div className="mr-3">
//                     <Checkbox
//                       checked={selectedEmails.includes(email.id || "")}
//                       onCheckedChange={() => toggleSelect(email.id || "")}
//                     />
//                   </div>
//                   <div className="flex-1 grid grid-cols-12 gap-2">
//                     <div className="col-span-2 text-sm text-gray-600">
//                       To: {email.to}
//                     </div>
//                     <div className="col-span-7 flex items-center">
//                       <div className="text-sm truncate">
//                         {email.subject} - {email.content}
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
//     </div>
//   );
// };

// export default EmailSent;
















// import { useEmailStore } from "@/store/email-store";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Filter } from "lucide-react";
// import { useState, useEffect } from "react";
// import { Email, EmailCategory } from "@/lib/types/email";
// import { Checkbox } from "@/components/ui/checkbox";

// interface EmailSentProps {
//   onBack?: () => void;
// }

// // Helper function to get access token from localStorage
// const getAccessToken = () => {
//   return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
// };

// // Helper function to get linked email ID from localStorage
// const getLinkedEmailId = () => {
//   return typeof window !== 'undefined' ? localStorage.getItem('linkedEmailId') : null;
// };

// export const EmailSent = ({ onBack }: EmailSentProps) => {
//   const { emails } = useEmailStore();
//   const [apiSentEmails, setApiSentEmails] = useState<Email[]>([]);
//   const [filterDate, setFilterDate] = useState<string | null>(null);
//   const [sortNewest, setSortNewest] = useState(true);
//   const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
  
//   useEffect(() => {
//     const fetchSentEmails = async () => {
//       setIsLoading(true);
//       setError(null);
      
//       try {
//         // Get token from localStorage
//         const token = getAccessToken();
//         console.log("Token retrieved:", token ? `${token.substring(0, 10)}...` : 'No token found');
        
//         if (!token) {
//           throw new Error('No access token available');
//         }
        
//         // Get linked email ID from localStorage
//         const linkedEmailId = getLinkedEmailId();
//         console.log("Linked Email ID:", linkedEmailId);
        
//         if (!linkedEmailId) {
//           throw new Error('No linked email ID found');
//         }
        
//         // Try both with email_id as query param and in request body
//         // First attempt: as query parameter
//         let apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/sent?email_id=${linkedEmailId}`;
//         console.log("Fetching from API endpoint (query param):", apiEndpoint);
        
//         let response = await fetch(apiEndpoint, {
//           method: 'GET',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           }
//         });
        
//         // If first attempt failed, try with POST method and body
//         if (!response.ok) {
//           console.log("First attempt failed. Trying with POST method...");
//           apiEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/sent';
          
//           response = await fetch(apiEndpoint, {
//             method: 'GET',
//             headers: {
//               'Content-Type': 'application/json',
//               'Authorization': `Bearer ${token}`
//             },
//             body: JSON.stringify({ email_id: linkedEmailId })
//           });
//         }
        
//         // Get the response data regardless of success status
//         const responseText = await response.text();
//         console.log("Raw response:", responseText);
        
//         let data;
//         try {
//           data = JSON.parse(responseText);
//           console.log("Parsed response data:", data);
//         } catch (e) {
//           console.error("Failed to parse response as JSON:", e);
//           throw new Error(`Invalid response format: ${responseText.substring(0, 100)}...`);
//         }
        
//         // Check for success/error in response
//         if (!response.ok || data.success === false) {
//           const errorMessage = data.message || response.statusText;
//           console.error("API error:", errorMessage);
//           throw new Error(`API error: ${errorMessage}`);
//         }
        
//         // Check if data contains emails (handle different response structures)
//         let emailsData: any[] = [];
        
//         if (Array.isArray(data)) {
//           emailsData = data;
//         } else if (data.data && Array.isArray(data.data)) {
//           emailsData = data.data;
//         } else if (data.sent && Array.isArray(data.sent)) {
//           emailsData = data.sent;
//         } else {
//           console.log("Response structure different than expected:", data);
//           // Look for any array in the response that might contain emails
//           for (const key in data) {
//             if (Array.isArray(data[key]) && data[key].length > 0) {
//               console.log(`Found array in response at key: ${key}`, data[key]);
//               emailsData = data[key];
//               break;
//             }
//           }
//         }
        
//         if (emailsData.length > 0) {
//           console.log("Sample email data structure:", emailsData[0]);
//         }
        
//         // Format emails and mark as sent
//         const formattedEmails = emailsData.map((email: any) => ({
//           ...email,
//           status: "sent"
//         }));
        
//         setApiSentEmails(formattedEmails);
//       } catch (err) {
//         console.error('Failed to fetch sent emails:', err);
//         setError(err instanceof Error ? err.message : 'Failed to fetch sent emails');
//       } finally {
//         setIsLoading(false);
//       }
//     };
    
//     fetchSentEmails();
//   }, []); // Empty dependency array means this runs once on mount
  
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

//   const toggleSelect = (emailId: string) => {
//     setSelectedEmails(prev => 
//       prev.includes(emailId) 
//         ? prev.filter(id => id !== emailId)
//         : [...prev, emailId]
//     );
//   };

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
//             <h2 className="text-xl font-semibold">Sent</h2>
//             <div className="flex items-center gap-2">
//               <Button 
//                 variant="outline" 
//                 size="sm" 
//                 onClick={toggleSort}
//               >
//                 Sort: {sortNewest ? "Newest" : "Oldest"}
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
//               <p className="text-muted-foreground">Loading sent emails...</p>
//             </div>
//           ) : error ? (
//             <div className="text-center py-8 text-red-500">
//               {error}
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
//                   className="flex items-center px-4 py-3 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
//                 >
//                   <div className="mr-3">
//                     <Checkbox
//                       checked={selectedEmails.includes(email.id || "")}
//                       onCheckedChange={() => toggleSelect(email.id || "")}
//                     />
//                   </div>
//                   <div className="flex-1 grid grid-cols-12 gap-2">
//                     <div className="col-span-2 text-sm text-gray-600">
//                       To: {email.to}
//                     </div>
//                     <div className="col-span-7 flex items-center">
//                       <div className="text-sm truncate">
//                         {email.subject} - {email.body}
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
//     </div>
//   );
// };













// Second 
// import { useEmailStore } from "@/store/email-store";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Filter } from "lucide-react";
// import { useState } from "react";
// import { Email, EmailCategory } from "@/lib/types/email";
// import { Checkbox } from "@/components/ui/checkbox";

// interface EmailSentProps {
//   onBack?: () => void;
// }

// export const EmailSent = ({ onBack }: EmailSentProps) => {
//   const { emails } = useEmailStore();
//   const [filterDate, setFilterDate] = useState<string | null>(null);
//   const [sortNewest, setSortNewest] = useState(true);
//   const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  
//   // Filter emails with "sent" status
//   const sentEmails = emails.filter((email) => email.status === "sent");
  
//   // Sort by date
//   const sortedEmails = [...sentEmails].sort((a, b) => {
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

//   const toggleSelect = (emailId: string) => {
//     setSelectedEmails(prev => 
//       prev.includes(emailId) 
//         ? prev.filter(id => id !== emailId)
//         : [...prev, emailId]
//     );
//   };

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
//             <h2 className="text-xl font-semibold">Sent</h2>
//             <div className="flex items-center gap-2">
//               <Button 
//                 variant="outline" 
//                 size="sm" 
//                 onClick={toggleSort}
//               >
//                 Sort: {sortNewest ? "Newest" : "Oldest"}
//               </Button>
//               <Button variant="outline" size="icon">
//                 <Filter className="w-4 h-4" />
//               </Button>
//             </div>
//           </div>
//         </div>

//         <div className="overflow-y-auto h-[calc(100%-60px)]">
//           {displayedEmails.length === 0 ? (
//             <div className="text-center py-8 text-muted-foreground">
//               No sent emails found.
//             </div>
//           ) : (
//             <div className="space-y-0">
//               {displayedEmails.map((email) => (
//                 <div 
//                   key={email.id} 
//                   className="flex items-center px-4 py-3 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
//                 >
//                   <div className="mr-3">
//                     <Checkbox
//                       checked={selectedEmails.includes(email.id || "")}
//                       onCheckedChange={() => toggleSelect(email.id || "")}
//                     />
//                   </div>
//                   <div className="flex-1 grid grid-cols-12 gap-2">
//                     <div className="col-span-2 text-sm text-gray-600">
//                       To: {email.to}
//                     </div>
//                     <div className="col-span-7 flex items-center">
//                       <div className="text-sm truncate">
//                         {email.subject} - {email.body}
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
//     </div>
//   );
// };












// import { useEffect, useState } from "react";
// import { useEmailStore } from "@/store/email-store";
// import { EmailCard } from "./EmailCard";
// import { Email } from "@/lib/types/email";

// export const EmailSent = () => {
//   const { emails, addEmail } = useEmailStore();
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   // Get access token helper function
//   const getAccessToken = () => {
//     if (typeof window !== 'undefined') {
//       return localStorage.getItem('token');
//     }
//     return null;
//   };

//   // Fetch sent emails from the API
//   const fetchSentEmails = async () => {
//     setLoading(true);
//     setError(null);
    
//     try {
//       const token = getAccessToken();
      
//       if (!token) {
//         setError("Authentication token missing");
//         setLoading(false);
//         return;
//       }
      
//       const emailId = localStorage.getItem('linkedEmailId');
//       if (!emailId) {
//         setError("No linked email account found");
//         setLoading(false);
//         return;
//       }
      
//       // API endpoint for sent emails
//       const apiEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/sent';
      
//       const response = await fetch(apiEndpoint, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         }
//       });
      
//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(errorText || `Failed to fetch sent emails: ${response.status}`);
//       }
      
//       const responseData = await response.json();
//       console.log("Fetched sent emails:", responseData);
      
//       // Process the data and update the store
//       if (responseData && Array.isArray(responseData.data)) {
//         // Transform API data to match your Email type
//         const sentEmails: Email[] = responseData.data.map((email: any) => ({
//           id: email.id || String(Math.random()),
//           from: email.from || "You",
//           to: email.to,
//           subject: email.subject,
//           content: email.body || "",
//           hasAttachment: !!email.attachments?.length,
//           status: "sent",
//           timestamp: email.timestamp || new Date().toISOString()
//         }));
        
//         // Add each email to the store
//         sentEmails.forEach(email => addEmail(email));
//       }
//     } catch (error: any) {
//       console.error("Error fetching sent emails:", error);
//       setError(error.message || "Failed to fetch sent emails");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch emails when component mounts
//   useEffect(() => {
//     fetchSentEmails();
//   }, []);

//   // Filter to show only sent emails
//   const sentEmails = emails.filter(email => email.status === "sent");

//   return (
//     <div className="w-full ">
//       <h2 className="text-lg font-medium p-4 border-b">Sent</h2>
      
//       <div className="w-full">
//         {loading ? (
//           <div className="flex justify-center items-center p-8">
//             <div className="animate-pulse">Loading...</div>
//           </div>
//         ) : error ? (
//           <div className="text-sm text-red-500 p-4">
//             {error}
//           </div>
//         ) : sentEmails.length === 0 ? (
//           <div className="text-center p-8 text-gray-500">
//             No sent emails found
//           </div>
//         ) : (
//           <div className="divide-y">
//             {sentEmails.map((email, index) => (
//               <EmailCard key={email.id} email={email} index={index} />
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };










































// import { DragDropContext, Droppable } from "react-beautiful-dnd";
// import { useEmailStore } from "@/store/email-store";
// import { EmailCard } from "./EmailCard";
// import { Button } from "@/components/ui/button";
// import { Plus } from "lucide-react";
// import { useState } from "react";
// import { Input } from "@/components/ui/input";
// import { EmailSegment } from "@/lib/types/email";

// export const EmailSent = () => {
//     const { emails, moveEmail, customSegments, addSegment, activeCategory } =
//         useEmailStore();
//     const [showNewSegmentInput, setShowNewSegmentInput] = useState(false);
//     const [newSegmentName, setNewSegmentName] = useState("");

//     const filteredEmails = emails.filter(
//         (email) => email.status === activeCategory
//     );

//     const handleAddSegment = () => {
//         if (newSegmentName.trim()) {
//             addSegment(newSegmentName);
//             setNewSegmentName("");
//             setShowNewSegmentInput(false);
//         }
//     };

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const onDragEnd = (result: any) => {
//         if (!result.destination) return;
//         const emailId = result.draggableId;
//         const targetSegment = result.destination.droppableId as EmailSegment;
//         moveEmail(emailId, targetSegment);
//     };

//     return (
//         <DragDropContext onDragEnd={onDragEnd}>
//           <div className="relative w-full h-full overflow-x-auto pb-4">
//             <div className="flex gap-4 w-max">
              
//             </div>
//           </div>
//         </DragDropContext>

//     );
// };





