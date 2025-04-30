import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { useEmailStore } from "@/store/email-store";
import { EmailCard } from "./EmailCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Email, EmailSegment } from "@/lib/types/email";
import { getCookie, getAuthToken } from "@/lib/utils/cookies"; // Import the cookie utilities
import { createEmailPreview, EmailContentRenderer } from "@/lib/utils/emails/email-content-utils";


export const EmailColumns2 = () => {
  const { emails, moveEmail, customSegments, addSegment, addEmail } = useEmailStore();
  const [showNewSegmentInput, setShowNewSegmentInput] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiInboxEmails, setApiInboxEmails] = useState<Email[]>([]);
  const [mounted, setMounted] = useState(false);

  // Helper function to extract and format email content
  const formatEmailContent = (rawContent: string) => {
    // Check if content contains MIME boundaries
    if (rawContent && rawContent.includes('Content-Type:')) {
      try {
        // Try to extract HTML content first (preferred for display)
        const htmlMatch = rawContent.match(/Content-Type: text\/html.*?\r\n\r\n([\s\S]*?)(?:\r\n--|-$)/i);
        if (htmlMatch && htmlMatch[1]) {
          return {
            contentType: 'html',
            content: htmlMatch[1].trim()
          };
        }
        
        // Fall back to plain text if HTML isn't available
        const textMatch = rawContent.match(/Content-Type: text\/plain.*?\r\n\r\n([\s\S]*?)(?:\r\n--|-$)/i);
        if (textMatch && textMatch[1]) {
          return {
            contentType: 'text',
            content: textMatch[1].trim()
          };
        }
      } catch (e) {
        console.error('Error parsing MIME content:', e);
      }
    }
    
    // If no MIME parsing worked or content isn't MIME formatted, return as is
    return {
      contentType: 'text',
      content: rawContent || ''
    };
  };

  // Fetch inbox emails from the API
  useEffect(() => {
    const fetchInboxEmails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get token from cookies using the utility function
        const token = getAuthToken();
        console.log("Token retrieved:", token ? `${token.substring(0, 10)}...` : 'No token found');

        if (!token) {
          throw new Error('No access token available');
        }

        // Get linked email ID from cookies or localStorage as fallback
        const linkedEmailId = getCookie('linkedEmailId') || 
                              (typeof window !== 'undefined' ? localStorage.getItem('linkedEmailId') : null);
        console.log("Linked Email ID:", linkedEmailId);

        if (!linkedEmailId) {
          throw new Error('No linked email ID found');
        }

        // Rest of your code remains the same...
        const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(linkedEmailId)}`;
        console.log("Fetching from API endpoint:", apiEndpoint);

        const response = await fetch(apiEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        // If the GET request fails, try with POST instead
        if (!response.ok) {
          console.log("GET request failed with status:", response.status);

          // Alternative: Use POST if the API requires sending data in the body
          const postEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox';
          console.log("Trying POST request to:", postEndpoint);

          const postResponse = await fetch(postEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
              email_id: linkedEmailId
            })
          });

          // Process the POST response
          const postResponseText = await postResponse.text();
          console.log("POST raw response:", postResponseText);

          let postData;
          try {
            postData = JSON.parse(postResponseText);
            console.log("POST parsed response data:", postData);
          } catch (e) {
            console.error("Failed to parse POST response as JSON:", e);
            throw new Error(`Invalid POST response format: ${postResponseText.substring(0, 100)}...`);
          }

          // Check for success/error in POST response
          if (!postResponse.ok || postData.success === false) {
            const errorMessage = postData.message || postResponse.statusText;
            console.error("API POST error:", errorMessage);
            throw new Error(`API POST error: ${errorMessage}`);
          }

          // Process the successful POST response
          processResponseData(postData);
          return;
        }

        // Process the successful GET response
        const responseText = await response.text();
        console.log("Raw response:", responseText);

        let data;
        try {
          data = JSON.parse(responseText);
          console.log("Parsed response data:", data);
        } catch (e) {
          console.error("Failed to parse response as JSON:", e);
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
        console.error('Error fetching inbox emails:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch inbox emails');
      } finally {
        setIsLoading(false);
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
      } else if (data.emails && Array.isArray(data.emails)) {
        emailsData = data.emails;
      } else if (data.inbox && Array.isArray(data.inbox)) {
        emailsData = data.inbox;
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

      if (emailsData.length > 0) {
        console.log("Sample email data structure:", emailsData[0]);
      }

      // Format emails and ensure they have proper structure
      const formattedEmails: Email[] = emailsData.map((email: any) => {
        // Parse and format the email content
        const formattedContent = formatEmailContent(email.content || '');
        
        return {
          id: email.id || email._id || `inbox-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          subject: email.subject || 'No Subject',
          content: formattedContent.content,
          contentType: formattedContent.contentType as 'text' | 'html',
          from: email.from || email.sender || 'Unknown Sender',
          to: email.to || email.recipient || '',
          timestamp: email.date || email.timestamp || email.createdAt || email.created_at || new Date().toISOString(),
          status: email.type || "inbox" as EmailSegment,
          isUrgent: email.isUrgent || email.is_urgent || false,
          hasAttachment: email.hasAttachment || email.has_attachment || false,
          category: email.category || email.type || "inbox",
          isRead: email.isRead || email.is_read || false,
          email_id: email.email_id || null
        };
      });

      // Add emails to store
      formattedEmails.forEach((email: Email) => {
        addEmail(email);
      });
      
      setApiInboxEmails(formattedEmails);
    };

    fetchInboxEmails();
  }, [addEmail]);

  // Rest of your component remains the same...
  const inboxEmails = emails.filter((email) => email.status === "inbox");

  const handleAddSegment = () => {
    if (newSegmentName.trim()) {
      addSegment(newSegmentName);
      setNewSegmentName("");
      setShowNewSegmentInput(false);
    }
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const emailId = result.draggableId;
    const targetSegment = result.destination.droppableId as EmailSegment;
    moveEmail(emailId, targetSegment);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>Error loading inbox: {error}</p>
        <button 
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="relative w-full h-full overflow-x-auto pb-4">
        <div className="flex gap-4 w-max">
          {/* All Mail Column */}
          <Droppable droppableId="all">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="min-w-[350px] w-[350px] max-w-[350px] p-4 rounded-lg border border-gray-200"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">All Mail</h3>
                  {showNewSegmentInput ? (
                    <div className="flex gap-2">
                      <Input
                        value={newSegmentName}
                        onChange={(e) => setNewSegmentName(e.target.value)}
                        placeholder="Segment name"
                        className="w-32"
                      />
                      <Button size="sm" onClick={handleAddSegment}>
                        Add
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewSegmentInput(true)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {inboxEmails
                  .filter((email) => !email.isUrgent)
                  .map((email, index) => (
                    <EmailCard key={email.id} email={email} index={index} />
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Urgent Column */}
          <Droppable droppableId="urgent">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="min-w-[350px] w-[350px] max-w-[350px] p-4 rounded-lg border border-gray-200"
              >
                <h3 className="font-semibold mb-4">Urgent</h3>
                {inboxEmails
                  .filter((email) => email.isUrgent)
                  .map((email, index) => (
                    <EmailCard key={email.id} email={email} index={index} />
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          
          {/* Custom Segments */}
          {customSegments.map((segment) => (
            <Droppable key={segment} droppableId={segment}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="min-w-[350px] w-[350px] max-w-[350px] p-4 rounded-lg border border-gray-200"
                >
                  <h3 className="font-semibold mb-4">{segment}</h3>
                  {emails
                    .filter((email) => email.status === segment)
                    .map((email, index) => (
                      <EmailCard key={email.id} email={email} index={index} />
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </div>
    </DragDropContext> 
  );
};

export default EmailColumns2;



































// import { DragDropContext, Droppable } from "react-beautiful-dnd";
// import { useEmailStore } from "@/store/email-store";
// import { EmailCard } from "./EmailCard";
// import { Button } from "@/components/ui/button";
// import { Plus } from "lucide-react";
// import { useState, useEffect } from "react";
// import { Input } from "@/components/ui/input";
// import { Email, EmailSegment } from "@/lib/types/email";
// import { getCookie, getAuthToken } from "@/lib/utils/cookies"; // Import the cookie utilities


// export const EmailColumns2 = () => {
//   const { emails, moveEmail, customSegments, addSegment, addEmail } = useEmailStore();
//   const [showNewSegmentInput, setShowNewSegmentInput] = useState(false);
//   const [newSegmentName, setNewSegmentName] = useState("");
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [apiInboxEmails, setApiInboxEmails] = useState<Email[]>([]);

//   // Fetch inbox emails from the API
//   useEffect(() => {
//     const fetchInboxEmails = async () => {
//       setIsLoading(true);
//       setError(null);

//       try {
//         // Get token from cookies using the utility function
//         const token = getAuthToken();
//         console.log("Token retrieved:", token ? `${token.substring(0, 10)}...` : 'No token found');

//         if (!token) {
//           throw new Error('No access token available');
//         }

//         // Get linked email ID from cookies or localStorage as fallback
//         const linkedEmailId = getCookie('linkedEmailId') || 
//                               (typeof window !== 'undefined' ? localStorage.getItem('linkedEmailId') : null);
//         console.log("Linked Email ID:", linkedEmailId);

//         if (!linkedEmailId) {
//           throw new Error('No linked email ID found');
//         }

//         // Rest of your code remains the same...
//         const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(linkedEmailId)}`;
//         console.log("Fetching from API endpoint:", apiEndpoint);

//         const response = await fetch(apiEndpoint, {
//           method: 'GET',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           }
//         });

//         // If the GET request fails, try with POST instead
//         if (!response.ok) {
//           console.log("GET request failed with status:", response.status);

//           // Alternative: Use POST if the API requires sending data in the body
//           const postEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox';
//           console.log("Trying POST request to:", postEndpoint);

//           const postResponse = await fetch(postEndpoint, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//               'Authorization': `Bearer ${token}`
//             },
//             body: JSON.stringify({ 
//               email_id: linkedEmailId
//             })
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
//         console.error('Error fetching inbox emails:', err);
//         setError(err instanceof Error ? err.message : 'Failed to fetch inbox emails');
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
//       } else if (data.emails && Array.isArray(data.emails)) {
//         emailsData = data.emails;
//       } else if (data.inbox && Array.isArray(data.inbox)) {
//         emailsData = data.inbox;
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

//       // Format emails and ensure they have proper structure
//       const formattedEmails = emailsData.map((email: any) => ({
//         id: email.id || email._id || `inbox-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
//         subject: email.subject || 'No Subject',
//         content: email.content || email.body?.content || '',
//         from: email.from || email.sender || 'Unknown Sender',
//         to: email.to || email.recipient || '',
//         timestamp: email.timestamp || email.createdAt || email.created_at || new Date().toISOString(),
//         status: "inbox",
//         isUrgent: email.isUrgent || email.is_urgent || false,
//         hasAttachment: email.hasAttachment || email.has_attachment || false,
//         category: email.category || "inbox",
//         isRead: email.isRead || email.is_read || false
//       }));

//       // Add emails to store
//       formattedEmails.forEach(email => {
//         addEmail(email);
//       });
      
//       setApiInboxEmails(formattedEmails);
//     };

//     fetchInboxEmails();
//   }, [addEmail]);

//   // Rest of your component remains the same...
//   const inboxEmails = emails.filter((email) => email.status === "inbox");

//   const handleAddSegment = () => {
//     if (newSegmentName.trim()) {
//       addSegment(newSegmentName);
//       setNewSegmentName("");
//       setShowNewSegmentInput(false);
//     }
//   };

//   const onDragEnd = (result: any) => {
//     if (!result.destination) return;
//     const emailId = result.draggableId;
//     const targetSegment = result.destination.droppableId as EmailSegment;
//     moveEmail(emailId, targetSegment);
//   };

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center h-full">
//         <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="p-4 text-red-500">
//         <p>Error loading inbox: {error}</p>
//         <button 
//           className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" 
//           onClick={() => window.location.reload()}
//         >
//           Try Again
//         </button>
//       </div>
//     );
//   }

//   return (
//     <DragDropContext onDragEnd={onDragEnd}>
//       <div className="relative w-full h-full overflow-x-auto pb-4">
//         <div className="flex gap-4 w-max">
//           {/* All Mail Column */}
//           <Droppable droppableId="all">
//             {(provided) => (
//               <div
//                 ref={provided.innerRef}
//                 {...provided.droppableProps}
//                 className="min-w-[350px] w-[350px] max-w-[350px] p-4 rounded-lg border border-gray-200"
//               >
//                 <div className="flex justify-between items-center mb-4">
//                   <h3 className="font-semibold">All Mail</h3>
//                   {showNewSegmentInput ? (
//                     <div className="flex gap-2">
//                       <Input
//                         value={newSegmentName}
//                         onChange={(e) => setNewSegmentName(e.target.value)}
//                         placeholder="Segment name"
//                         className="w-32"
//                       />
//                       <Button size="sm" onClick={handleAddSegment}>
//                         Add
//                       </Button>
//                     </div>
//                   ) : (
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => setShowNewSegmentInput(true)}
//                     >
//                       <Plus className="w-4 h-4" />
//                     </Button>
//                   )}
//                 </div>
//                 {inboxEmails
//                   .filter((email) => !email.isUrgent)
//                   .map((email, index) => (
//                     <EmailCard key={email.id} email={email} index={index} />
//                   ))}
//                 {provided.placeholder}
//               </div>
//             )}
//           </Droppable>

//           {/* Urgent Column */}
//           <Droppable droppableId="urgent">
//             {(provided) => (
//               <div
//                 ref={provided.innerRef}
//                 {...provided.droppableProps}
//                 className="min-w-[350px] w-[350px] max-w-[350px] p-4 rounded-lg border border-gray-200"
//               >
//                 <h3 className="font-semibold mb-4">Urgent</h3>
//                 {inboxEmails
//                   .filter((email) => email.isUrgent)
//                   .map((email, index) => (
//                     <EmailCard key={email.id} email={email} index={index} />
//                   ))}
//                 {provided.placeholder}
//               </div>
//             )}
//           </Droppable>
          
//           {/* Custom Segments */}
//           {customSegments.map((segment) => (
//             <Droppable key={segment} droppableId={segment}>
//               {(provided) => (
//                 <div
//                   ref={provided.innerRef}
//                   {...provided.droppableProps}
//                   className="min-w-[350px] w-[350px] max-w-[350px] p-4 rounded-lg border border-gray-200"
//                 >
//                   <h3 className="font-semibold mb-4">{segment}</h3>
//                   {emails
//                     .filter((email) => email.status === segment)
//                     .map((email, index) => (
//                       <EmailCard key={email.id} email={email} index={index} />
//                     ))}
//                   {provided.placeholder}
//                 </div>
//               )}
//             </Droppable>
//           ))}
//         </div>
//       </div>
//     </DragDropContext> 
//   );
// };

// export default EmailColumns2;








