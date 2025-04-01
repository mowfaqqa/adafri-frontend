"use client";
import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { EmailList, sampleEmails } from "./EmailComponent";
import { Email } from "@/lib/types/email";
import { getCookie } from "@/lib/utils/cookies";

interface DashboardEmailCompProps {
  className?: string;
}

// Helper function to parse the API response
const parseEmailResponse = (data: any): Email[] => {
  try {
    // Check if data exists and has the correct format
    if (!data) return [];
    
    // If data is already an array of emails, return it
    if (Array.isArray(data) && data.length > 0 && 'subject' in data[0]) {
      return data;
    }
    
    // If data has a data property that's an array
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }
    
    // If data is in a different format, try to extract emails
    if (typeof data === 'object') {
      // Look for any array property that might contain emails
      for (const key in data) {
        if (Array.isArray(data[key])) {
          const possibleEmails = data[key];
          if (possibleEmails.length > 0 && 'subject' in possibleEmails[0]) {
            return possibleEmails;
          }
        }
      }
    }
    
    console.error("Could not parse email data:", data);
    return [];
  } catch (error) {
    console.error("Error parsing email data:", error);
    return [];
  }
};

const DashboardEmailComp: React.FC<DashboardEmailCompProps> = ({ className }) => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get linkedEmailId directly from cookie
  const email_id = getCookie('linkedEmailId') || "";
  
  useEffect(() => {
    const fetchEmails = async () => {
      try {
        setLoading(true);
        // Get access token directly from cookie
        const token = getCookie('accessToken');
        
        console.log("Fetching emails for:", email_id);
        
        if (!token) {
          console.error("No auth token found");
          setEmails(sampleEmails);
          return;
        }
        
        const response = await fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(email_id)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch emails: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log("Raw API Response:", responseData);
        
        // Try to parse the email data from the response
        const parsedEmails = parseEmailResponse(responseData);
        
        if (parsedEmails.length > 0) {
          console.log("Successfully parsed emails:", parsedEmails.length);
          setEmails(parsedEmails);
        } else {
          console.warn("No emails found in response, using sample data");
          setEmails(sampleEmails);
        }
      } catch (err) {
        console.error('Error fetching emails:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setEmails(sampleEmails);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmails();
    console.log(email_id);
    
  }, [email_id]);
  
  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <p>Loading emails...</p>
      </div>
    );
  }
  
  return (
    <div className={className}>
      {error && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded overflow-hidden">
          <p className="text-red-600 text-sm">{error}</p>
          <p className="text-xs text-gray-500 mt-1">Using sample data instead</p>
        </div>
      )}
      <EmailList emails={emails} />
    </div>
  );
};

export default DashboardEmailComp;














// "use client";
// import React, { useState, useEffect } from 'react';
// import { cn } from "@/lib/utils";
// import { EmailList, sampleEmails } from "./EmailComponent";
// import { Email } from "@/lib/types/email";
// import { getCookie } from "@/lib/utils/cookies";

// interface DashboardEmailCompProps {
//   className?: string;
// }

// const DashboardEmailComp: React.FC<DashboardEmailCompProps> = ({ className }) => {
//   const [emails, setEmails] = useState<Email[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
//   // Get linkedEmailId directly from cookie
//   const email_id = getCookie('linkedEmailId') || "";
  
//   useEffect(() => {
//     const fetchEmails = async () => {
//       try {
//         setLoading(true);
//         // Get access token directly from cookie
//         const token = getCookie('accessToken');
        
//         // Debug information
//         console.log("Email ID:", email_id);
//         console.log("Token exists:", !!token);
        
//         if (!token) {
//           console.error("No auth token found");
//           setDebugInfo("No auth token found");
//           setEmails(sampleEmails);
//           return;
//         }
        
//         if (!email_id) {
//           console.error("No linked email ID found");
//           setDebugInfo("No linked email ID found");
//           setEmails(sampleEmails);
//           return;
//         }
        
//         const apiUrl = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(email_id)}`;
//         console.log("API URL:", apiUrl);
        
//         const response = await fetch(apiUrl, {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//         });
        
//         console.log("Response status:", response.status);
        
//         if (!response.ok) {
//           throw new Error(`Failed to fetch emails: ${response.status} ${response.statusText}`);
//         }
        
//         const data = await response.json();
//         console.log("API Response:", data);
        
//         if (data.success && Array.isArray(data.data)) {
//           setEmails(data.data);
//           setDebugInfo(null);
//         } else {
//           console.error("API returned success: false or invalid data format", data);
//           setDebugInfo(`API error: ${JSON.stringify(data)}`);
//           setEmails(sampleEmails); // Fallback to sample data
//         }
//       } catch (err) {
//         console.error('Error fetching emails:', err);
//         setError(err instanceof Error ? err.message : 'An unknown error occurred');
//         // setDebugInfo(err instanceof Error ? err.stack : 'Unknown error stack');
//         setEmails(sampleEmails); // Fallback to sample data
//       } finally {
//         setLoading(false);
//       }
//     };
    
//     fetchEmails();
//   }, [email_id]);
  
//   if (loading) {
//     return (
//       <div className={cn("flex items-center justify-center p-4", className)}>
//         <p>Loading emails...</p>
//       </div>
//     );
//   }
  
//   if (error) {
//     return (
//       <div className={cn("flex flex-col items-center justify-center p-4", className)}>
//         <p className="text-red-500 mb-2">Error loading emails: {error}</p>
//         {debugInfo && (
//           <details className="mt-2 p-2 bg-gray-100 rounded text-xs">
//             <summary>Debug Information</summary>
//             <pre className="whitespace-pre-wrap">{debugInfo}</pre>
//             <p className="mt-2">Email ID: {email_id || 'Not found'}</p>
//             <p>Auth Token: {getCookie('accessToken') ? 'Present' : 'Not found'}</p>
//           </details>
//         )}
//         <div className="mt-4">
//           <EmailList emails={sampleEmails} />
//         </div>
//       </div>
//     );
//   }
  
//   return (
//     <div className={className}>
//       {debugInfo && (
//         <details className="mb-2 p-2 bg-gray-100 rounded text-xs">
//           <summary>Debug Information</summary>
//           <pre className="whitespace-pre-wrap">{debugInfo}</pre>
//           <p className="mt-2">Email ID: {email_id || 'Not found'}</p>
//         </details>
//       )}
//       <EmailList emails={emails} />
//     </div>
//   );
// };

// export default DashboardEmailComp;




// "use client";

// import React, { useState } from 'react';
// import { cn } from "@/lib/utils";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
// import { FileIcon } from 'lucide-react';

// interface EmailAttachment {
//   name: string;
//   type: string;
// }

// interface Email {
//   id: string;
//   timestamp: string;
//   sender: string;
//   subject: string;
//   preview: string;
//   attachments?: EmailAttachment[];
// }

// interface EmailPreviewProps {
//   emails: Email[];
//   className?: string;
// }

// interface TabProps {
//   activeTab: string;
//   setActiveTab: (tab: string) => void;
// }

// const AttachmentChip: React.FC<{ attachment: EmailAttachment }> = ({ attachment }) => (
//   <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
//     <FileIcon className="w-4 h-4 text-red-500" />
//     <span>{attachment.name}</span>
//   </div>
// );

// const EmailPreview: React.FC<{ email: Email }> = ({ email }) => (
//   <div className="p-4 hover:bg-gray-50 transition-colors">
//     <div className="flex items-start gap-3">
//       <Checkbox className="mt-1.5" />
//       <div className="flex-1 space-y-1">
//         <div className="text-sm text-gray-500">{email.timestamp}</div>
//         <div className="font-medium">{email.sender}</div>
//         <div className="font-medium">{email.subject}</div>
//         <div className="text-gray-600 text-sm line-clamp-1">{email.preview}</div>
//         {email.attachments && email.attachments.length > 0 && (
//           <div className="flex gap-2 mt-2 flex-wrap">
//             {email.attachments.map((attachment, index) => (
//               <AttachmentChip key={index} attachment={attachment} />
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   </div>
// );

// const TabNavigation: React.FC<TabProps> = ({ activeTab, setActiveTab }) => {
//   return (
//     <div className="flex rounded-md overflow-hidden w-full mb-4">
//       <button 
//         onClick={() => setActiveTab('email')}
//         className={cn(
//           "flex-1 py-2 px-4 text-center font-medium transition-colors",
//           activeTab === 'email' 
//             ? "bg-teal-500 text-white" 
//             : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//         )}
//       >
//         Email
//       </button>
//       <button 
//         onClick={() => setActiveTab('message')}
//         className={cn(
//           "flex-1 py-2 px-4 text-center font-medium transition-colors",
//           activeTab === 'message' 
//             ? "bg-teal-500 text-white" 
//             : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//         )}
//       >
//         Online Message
//       </button>
//     </div>
//   );
// };

// const EmailList: React.FC<EmailPreviewProps> = ({ emails, className }) => {
//   return (
//     <div className={cn("flex-1 divide-y", className)}>
//       {emails.map((email) => (
//         <EmailPreview key={email.id} email={email} />
//       ))}
//     </div>
//   );
// };

// // Placeholder for Online Message component
// const OnlineMessageList: React.FC = () => {
//   return (
//     <div className="flex-1 divide-y">
//       <div className="p-4 hover:bg-gray-50 transition-colors">
//         <div className="flex items-start gap-3">
//           <Checkbox className="mt-1.5" />
//           <div className="flex-1 space-y-1">
//             <div className="text-sm text-gray-500">05/12 - 16:30</div>
//             <div className="font-medium">John Smith</div>
//             <div className="font-medium">Question about service</div>
//             <div className="text-gray-600 text-sm line-clamp-1">Hello, I would like to inquire about...</div>
//           </div>
//         </div>
//       </div>
//       <div className="p-4 hover:bg-gray-50 transition-colors">
//         <div className="flex items-start gap-3">
//           <Checkbox className="mt-1.5" />
//           <div className="flex-1 space-y-1">
//             <div className="text-sm text-gray-500">05/12 - 15:45</div>
//             <div className="font-medium">Sarah Johnson</div>
//             <div className="font-medium">Support request</div>
//             <div className="text-gray-600 text-sm line-clamp-1">I need assistance with my account...</div>
//           </div>
//         </div>
//       </div>
//       {/* Add more message items as needed */}
//     </div>
//   );
// };

// // Main component with tabs
// const TabbedCommunication: React.FC = () => {
//   const [activeTab, setActiveTab] = useState('email');

//   const emails: Email[] = [
//     {
//       id: '1',
//       timestamp: '05/12 - 14:48',
//       sender: 'danielodedara@....',
//       subject: 'Welcome to Adafri Dashboard',
//       preview: 'Hello, my name is Daniel, I am......',
//       attachments: [{ name: '2.pdf', type: 'image' }]
//     },
//     {
//       id: '2',
//       timestamp: '05/12 - 14:48',
//       sender: 'danielodedara@....',
//       subject: 'Welcome to Adafri Dashboard',
//       preview: 'Hello, my name is Daniel, I am......',
//       attachments: [{ name: 'Power.pdf', type: 'image' }]
//     },
//     {
//       id: '3',
//       timestamp: '05/12 - 14:48',
//       sender: 'danielodedara@....',
//       subject: 'Welcome to Adafri Dashboard',
//       preview: 'Hello, my name is Daniel, I am......',
//     },
//     {
//       id: '4',
//       timestamp: '05/12 - 14:48',
//       sender: 'danielodedara@....',
//       subject: 'Welcome to Adafri Dashboard',
//       preview: 'Hello, my name is Daniel, I am......',
//       attachments: [{ name: 'Power.pdf', type: 'image' }]
//     },
//     {
//       id: '5',
//       timestamp: '05/12 - 14:48',
//       sender: 'danielodedara@....',
//       subject: 'Welcome to Adafri Dashboard',
//       preview: 'Hello, my name is Daniel, I am......',
//       attachments: [{ name: 'Power.pdf', type: 'image' }]
//     },
//   ];

//   return (
//     <div className="min-h-screen">
//       <Card className="w-[450px] h-auto flex flex-col py-2 rounded-xl bg-white ml-auto">
//         <CardHeader className="pb-2 border-b">
//           <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
//         </CardHeader>
//         <CardContent className="flex-1 p-0">
//           {activeTab === 'email' ? (
//             <EmailList emails={emails} />
//           ) : (
//             <OnlineMessageList />
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default TabbedCommunication;