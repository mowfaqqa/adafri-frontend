"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from "@/lib/utils";
import { getCookie } from "@/lib/utils/cookies";
import { Email } from "@/lib/types/email";
import { Button } from "@/components/ui/button";
import { EmailList } from './EmailComponent';

interface EmailSectionProps {
  className?: string;
}

export const EmailSection: React.FC<EmailSectionProps> = ({ className }) => {
  // State to track which tab is active
  const [activeTab, setActiveTab] = useState<'personal' | 'professional'>('personal');

  // State to track if emails are connected
  const [emailsConnected, setEmailsConnected] = useState({
    personal: false,
    professional: false
  });

  // State for emails and loading
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get linkedEmailId from cookie
  const email_id = getCookie('linkedEmailId') || "";
  const token = getCookie('accessToken');

  // Check if email is connected based on cookies or other indicators
  useEffect(() => {
    // Check if personal email is connected
    const personalConnected = !!getCookie('personalEmailConnected') || !!email_id;

    // Check if professional email is connected
    const professionalConnected = !!getCookie('professionalEmailConnected');

    setEmailsConnected({
      personal: personalConnected,
      professional: professionalConnected
    });

    // Initial fetch if tab is already connected
    if ((activeTab === 'personal' && personalConnected) ||
        (activeTab === 'professional' && professionalConnected)) {
      fetchEmails(activeTab);
    } else {
      setLoading(false);
    }
  }, [activeTab, email_id]);

  // Function to fetch emails based on active tab
  const fetchEmails = async (tabType: 'personal' | 'professional') => {
    try {
      setLoading(true);

      if (!token) {
        console.error("No auth token found");
        setEmails([]);
        setLoading(false);
        return;
      }

      // Use different endpoints or parameters based on tab type
      const emailIdParam = tabType === 'professional'
        ? getCookie('professionalEmailId') || ""
        : email_id;

      if (!emailIdParam) {
        setEmails([]);
        setLoading(false);
        return;
      }

      console.log(`Fetching ${tabType} emails for:`, emailIdParam);

      const response = await fetch(
        `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(emailIdParam)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch emails: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("Raw API Response:", responseData);

      // Try to parse the email data from the response
      const parsedEmails = parseEmailResponse(responseData);
      setEmails(parsedEmails);

    } catch (err) {
      console.error(`Error fetching ${tabType} emails:`, err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to parse the API response
  const parseEmailResponse = (data: any): Email[] => {
    try {
      if (!data) return [];

      if (Array.isArray(data) && data.length > 0 && 'subject' in data[0]) {
        return data;
      }

      if (data.data && Array.isArray(data.data)) {
        return data.data;
      }

      if (typeof data === 'object') {
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

  // Handle tab switch
  const handleTabChange = (tab: 'personal' | 'professional') => {
    setActiveTab(tab);
    if (emailsConnected[tab]) {
      fetchEmails(tab);
    } else {
      setEmails([]);
    }
  };

  // Redirect to Gmail for personal email if not connected
  const connectPersonalEmail = () => {
    if (!emailsConnected.personal) {
      // window.open('https://mail.google.com', '_blank');
    }
  };

  // Connect professional email - would be replaced with actual OAuth flow
  const connectProfessionalEmail = () => {
    // In real implementation, this would trigger an OAuth flow
    console.log("Connecting professional email...");
  };

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 p-4 flex flex-col", className)}>
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4 text-center">EMAILS</h3>

      {/* Tab buttons */}
      <div className="flex justify-center flex-wrap gap-2 mb-4">
        <button
          className={`py-2 px-4 rounded-lg transition-colors ${activeTab === 'personal' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
          onClick={() => handleTabChange('personal')}
        >
          Personal
        </button>
        <button
          className={`py-2 px-4 rounded-lg transition-colors ${activeTab === 'professional' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
          onClick={() => handleTabChange('professional')}
        >
          Professional
        </button>
      </div>

      {/* Content area - with fixed height to ensure scrolling works properly */}
      <div className="w-full flex-1 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100% - 80px)' }}>
        {loading ? (
          <div className="flex justify-center items-center flex-1">
            <div className="w-6 h-6 border-2 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center flex-1 p-4">
            <div className="text-center text-red-500">
              <p>{error}</p>
              <Button 
                variant="outline"
                className="mt-4" 
                onClick={() => fetchEmails(activeTab)}
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : emailsConnected[activeTab] && emails.length > 0 ? (
          <EmailList 
            emails={emails} 
            className="h-full overflow-hidden"
          />
        ) : (
          <div className="flex justify-center items-center flex-1 p-4">
            <div className="text-center">
              <Image
                src="/assets/email-image.png"
                alt="Connect emails"
                width={120}
                height={120}
              />
              <p className="mt-4 text-sm font-medium">
                {activeTab === 'personal'
                  ? 'Connect your personal email'
                  : 'Connect your professional email'}
              </p>
              {/* <Button
                className="mt-4"
                onClick={activeTab === 'personal' ? connectPersonalEmail : connectProfessionalEmail}
              >
                Connect {activeTab === 'personal' ? 'Gmail' : 'Work Email'}
              </Button> */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailSection;
















































// "use client";
// import React, { useState, useEffect } from 'react';
// import Image from 'next/image';
// import { cn } from "@/lib/utils";
// import { EmailList } from "./EmailComponent";
// import { getCookie } from "@/lib/utils/cookies";

// interface EmailSectionProps {
//     className?: string;
// }

// export const EmailSection: React.FC<EmailSectionProps> = ({ className }) => {
//     // State to track which tab is active
//     const [activeTab, setActiveTab] = useState<'personal' | 'professional'>('personal');

//     // State to track if emails are connected
//     const [emailsConnected, setEmailsConnected] = useState({
//         personal: false,
//         professional: false
//     });

//     // State for emails and loading
//     const [emails, setEmails] = useState<any[]>([]);
//     const [loading, setLoading] = useState<boolean>(true);
//     const [error, setError] = useState<string | null>(null);

//     // Get linkedEmailId from cookie
//     const email_id = getCookie('linkedEmailId') || "";
//     const token = getCookie('accessToken');

//     // Check if email is connected based on cookies or other indicators
//     useEffect(() => {
//         // Check if personal email is connected
//         const personalConnected = !!getCookie('personalEmailConnected') || !!email_id;

//         // Check if professional email is connected
//         const professionalConnected = !!getCookie('professionalEmailConnected');

//         setEmailsConnected({
//             personal: personalConnected,
//             professional: professionalConnected
//         });

//         // Initial fetch if tab is already connected
//         if ((activeTab === 'personal' && personalConnected) ||
//             (activeTab === 'professional' && professionalConnected)) {
//             fetchEmails(activeTab);
//         } else {
//             setLoading(false);
//         }
//     }, [activeTab, email_id]);

//     // Function to fetch emails based on active tab
//     const fetchEmails = async (tabType: 'personal' | 'professional') => {
//         try {
//             setLoading(true);

//             if (!token) {
//                 console.error("No auth token found");
//                 setEmails([]);
//                 setLoading(false);
//                 return;
//             }

//             // Use different endpoints or parameters based on tab type
//             const emailIdParam = tabType === 'professional'
//                 ? getCookie('professionalEmailId') || ""
//                 : email_id;

//             if (!emailIdParam) {
//                 setEmails([]);
//                 setLoading(false);
//                 return;
//             }

//             console.log(`Fetching ${tabType} emails for:`, emailIdParam);

//             const response = await fetch(
//                 `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(emailIdParam)}`,
//                 {
//                     headers: {
//                         'Authorization': `Bearer ${token}`,
//                         'Content-Type': 'application/json',
//                     },
//                 }
//             );

//             if (!response.ok) {
//                 throw new Error(`Failed to fetch emails: ${response.status}`);
//             }

//             const responseData = await response.json();
//             console.log("Raw API Response:", responseData);

//             // Try to parse the email data from the response
//             const parsedEmails = parseEmailResponse(responseData);
//             setEmails(parsedEmails);

//         } catch (err) {
//             console.error(`Error fetching ${tabType} emails:`, err);
//             setError(err instanceof Error ? err.message : 'An unknown error occurred');
//             setEmails([]);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Helper function to parse the API response (reused from your code)
//     const parseEmailResponse = (data: any): any[] => {
//         try {
//             if (!data) return [];

//             if (Array.isArray(data) && data.length > 0 && 'subject' in data[0]) {
//                 return data;
//             }

//             if (data.data && Array.isArray(data.data)) {
//                 return data.data;
//             }

//             if (typeof data === 'object') {
//                 for (const key in data) {
//                     if (Array.isArray(data[key])) {
//                         const possibleEmails = data[key];
//                         if (possibleEmails.length > 0 && 'subject' in possibleEmails[0]) {
//                             return possibleEmails;
//                         }
//                     }
//                 }
//             }

//             console.error("Could not parse email data:", data);
//             return [];
//         } catch (error) {
//             console.error("Error parsing email data:", error);
//             return [];
//         }
//     };

//     // Handle tab switch
//     const handleTabChange = (tab: 'personal' | 'professional') => {
//         setActiveTab(tab);
//         if (emailsConnected[tab]) {
//             fetchEmails(tab);
//         } else {
//             setEmails([]);
//         }
//     };

//     // Redirect to Gmail for personal email if not connected
//     const connectPersonalEmail = () => {
//         if (!emailsConnected.personal) {
//             window.open('https://mail.google.com', '_blank');
//         }
//     };

//     // Connect professional email - would be replaced with actual OAuth flow
//     const connectProfessionalEmail = () => {
//         // In real implementation, this would trigger an OAuth flow
//         console.log("Connecting professional email...");
//     };

//     return (
//         <div className={cn("bg-white rounded-lg border border-gray-200 p-6", className)}>
//             <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4 text-center">EMAILS</h3>

//             {/* Tab buttons */}
//             <div className="flex justify-center flex-wrap gap-2 mb-6">
//                 <button
//                     className={`py-2 px-4 rounded-lg transition-colors ${activeTab === 'personal' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
//                         }`}
//                     onClick={() => handleTabChange('personal')}
//                 >
//                     Personal
//                 </button>
//                 <button
//                     className={`py-2 px-4 rounded-lg transition-colors ${activeTab === 'professional' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
//                         }`}
//                     onClick={() => handleTabChange('professional')}
//                 >
//                     Professional
//                 </button>
//             </div>

//             {/* Content area */}
//             <div className="w-full">
//                 {loading ? (
//                     <div className="flex justify-center p-6">
//                         <p>Loading...</p>
//                     </div>
//                 ) : emailsConnected[activeTab] && emails.length > 0 ? (
//                     <EmailList emails={emails} />
//                 ) : (
//                     <div className="flex justify-center p-6">
//                         <div className="text-center">
//                             <Image
//                                 src="/assets/email-image.png"
//                                 alt="Connect emails"
//                                 width={150}
//                                 height={150}
//                             />
//                             <p className="mt-4 text-sm font-medium">
//                                 {activeTab === 'personal'
//                                     ? 'Connect your personal email'
//                                     : 'Connect your professional email'}
//                             </p>
//                             <button
//                                 className="mt-4 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                                 onClick={activeTab === 'personal' ? connectPersonalEmail : connectProfessionalEmail}
//                             >
//                                 Connect {activeTab === 'personal' ? 'Gmail' : 'Work Email'}
//                             </button>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default EmailSection;






































// import React from 'react';
// import Image from 'next/image';

// export const EmailSection: React.FC = () => {
//   return (
//     <div className="bg-white rounded-lg border border-gray-200 p-6">
//       <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4 text-center">EMAILS</h3>

//       {/* Made buttons responsive and flex-wrap to prevent overflow */}
//       <div className="flex justify-center flex-wrap gap-2 mb-6">
//         <button className="py-2 px-4 bg-gray-100 text-gray-800 rounded-lg">Personal</button>
//         <button className="py-2 px-4 bg-blue-600 text-white rounded-lg">Professional</button>
//       </div>

//       <div className="flex justify-center p-6">
//         <div className="text-center">
//           <Image
//             src="/assets/email-image.png"
//             alt="Connect emails"
//             width={150}
//             height={150}
//           />
//           <p className="mt-4 text-sm font-medium">Connect your email pro</p>
//         </div>
//       </div>
//     </div>
//   );
// };