"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import DashboardEmailComp from "./DashboardEmailComp";
import { MessageList, sampleMessages } from "./OnlineMessageComponent";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface TabProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabNavigation: React.FC<TabProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex items-center justify-center bg-gray-100 rounded-lg p-1 space-x-2 w-full max-w-sm mx-auto">
      <button
        onClick={() => setActiveTab("email")}
        className={cn(
          "flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
          activeTab === "email"
            ? "bg-teal-600 text-white shadow-sm"
            : "text-gray-500 hover:bg-gray-200"
        )}
      >
        Email
      </button>
      <button
        onClick={() => setActiveTab("message")}
        className={cn(
          "flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
          activeTab === "message"
            ? "bg-teal-600 text-white shadow-sm"
            : "text-gray-500 hover:bg-gray-200"
        )}
      >
        Online Message
      </button>
    </div>
  );
};

// Extended DashboardEmailComp with pagination
const PaginatedEmailComp: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [emails, setEmails] = useState<any[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  // Simulating email data
  useEffect(() => {
    // This would be replaced with actual API call in a real app
    const dummyEmails = Array(25).fill(null).map((_, index) => ({
      id: `email-${index + 1}`,
      subject: `Email Subject ${index + 1}`,
      sender: `sender${index + 1}@example.com`,
      preview: `This is a preview of email content ${index + 1}. Click to read more about this message.`,
      date: new Date(Date.now() - index * 86400000).toLocaleDateString(),
      unread: index % 3 === 0
    }));
    setEmails(dummyEmails);
  }, []);

  // Calculate pagination
  const totalPages = Math.ceil(emails.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmails = emails.slice(indexOfFirstItem, indexOfLastItem);

  // Scroll handling for pagination
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        
        // If scrolled near bottom and not on last page
        if (scrollTop + clientHeight >= scrollHeight - 20 && currentPage < totalPages) {
          setCurrentPage(prev => prev + 1);
        }
        
        // If scrolled near top and not on first page
        if (scrollTop <= 20 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        }
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      
      return () => {
        contentElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [currentPage, totalPages]);

  return (
    <div className="flex flex-col h-full">
      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto max-h-[500px]"
        style={{ scrollBehavior: 'smooth' }}
      >
        <DashboardEmailComp />
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-4 py-2 border-t">
          <span className="text-sm text-gray-600">
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, emails.length)} of {emails.length} emails
          </span>
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 text-gray-600 hover:text-teal-600 disabled:opacity-50"
              aria-label="Previous page"
            >
              <ChevronRight size={18} className="transform rotate-180" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 text-gray-600 hover:text-teal-600 disabled:opacity-50"
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Extended MessageList with pagination
const PaginatedMessageList: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Calculate pagination
  const totalPages = Math.ceil(sampleMessages.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMessages = sampleMessages.slice(indexOfFirstItem, indexOfLastItem);

  // Scroll handling for pagination
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        
        // If scrolled near bottom and not on last page
        if (scrollTop + clientHeight >= scrollHeight - 20 && currentPage < totalPages) {
          setCurrentPage(prev => prev + 1);
        }
        
        // If scrolled near top and not on first page
        if (scrollTop <= 20 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        }
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      
      return () => {
        contentElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [currentPage, totalPages]);

  return (
    <div className="flex flex-col h-full">
      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto max-h-[500px]"
        style={{ scrollBehavior: 'smooth' }}
      >
        <MessageList messages={currentMessages} />
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-4 py-2 border-t">
          <span className="text-sm text-gray-600">
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sampleMessages.length)} of {sampleMessages.length} messages
          </span>
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 text-gray-600 hover:text-teal-600 disabled:opacity-50"
              aria-label="Previous page"
            >
              <ChevronRight size={18} className="transform rotate-180" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 text-gray-600 hover:text-teal-600 disabled:opacity-50"
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const EmailOnlineMessaging: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [activeTab, setActiveTab] = useState("email");

  return (
    <div className={`min-h-screen ${className}`}>
      <Card className="h-auto flex flex-col py-2 rounded-xl bg-white shadow-md">
        <CardHeader className="pb-2 border-b px-4 sm:px-6">
          <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        </CardHeader>
        <CardContent className="flex-1 p-0">
          {activeTab === "email" ? (
            <PaginatedEmailComp />
          ) : (
            <PaginatedMessageList />
          )}
        </CardContent>
        <CardFooter className="pt-2 pb-4 px-4 sm:px-6">
          <Link 
            href={activeTab === "email" ? "/dashboard/professional-mail" : "/dashboard/messaging"}
            className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors duration-200 text-center"
          >
            View All {activeTab === "email" ? "Emails" : "Messages"}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EmailOnlineMessaging;











































// "use client";

// import React, { useState } from "react";
// import { cn } from "@/lib/utils";
// import { Card, CardHeader, CardContent } from "@/components/ui/card";
// import DashboardEmailComp from "./DashboardEmailComp";
// import { MessageList, sampleMessages } from "./OnlineMessageComponent";

// interface TabProps {
//   activeTab: string;
//   setActiveTab: (tab: string) => void;
// }

// const TabNavigation: React.FC<TabProps> = ({ activeTab, setActiveTab }) => {
//   return (
//     <div className="flex items-center justify-center bg-gray-100 rounded-lg p-1 space-x-2 max-w-sm mx-auto">
//       <button
//         onClick={() => setActiveTab("email")}
//         className={cn(
//           "w-36 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
//           activeTab === "email"
//             ? "bg-teal-600 text-white shadow-sm"
//             : "text-gray-500 hover:bg-gray-200"
//         )}
//       >
//         Email
//       </button>
//       <button
//         onClick={() => setActiveTab("message")}
//         className={cn(
//           "w-36 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
//           activeTab === "message"
//             ? "bg-teal-600 text-white shadow-sm"
//             : "text-gray-500 hover:bg-gray-200"
//         )}
//       >
//         Online Message
//       </button>
//     </div>
//   );
// };

// const EmailOnlineMessaging: React.FC<{ className?: string }> = ({ className = "" }) => {
//   const [activeTab, setActiveTab] = useState("email");

//   return (
//     <div className={`min-h-screen ${className}`}>
//       <Card className="h-auto flex flex-col py-2 rounded-xl bg-white ml-auto shadow-md">
//         <CardHeader className="pb-2 border-b">
//           <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
//         </CardHeader>
//         <CardContent className="flex-1 p-0">
//           {activeTab === "email" ? (
//             <DashboardEmailComp />
//           ) : (
//             <MessageList messages={sampleMessages} />
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default EmailOnlineMessaging;











// File: TabbedCommunication.tsx
// "use client";
// import React, { useState } from "react";
// import { cn } from "@/lib/utils";
// import { Card, CardHeader, CardContent } from "@/components/ui/card";
// import { EmailList, sampleEmails } from "./EmailComponent";
// import { MessageList, sampleMessages } from "./OnlineMessageComponent";

// interface TabProps {
//   activeTab: string;
//   setActiveTab: (tab: string) => void;
// }

// const TabNavigation: React.FC<TabProps> = ({ activeTab, setActiveTab }) => {
//   return (
//     <div className="flex items-center justify-center bg-gray-100 rounded-lg p-1 space-x-2 max-w-sm mx-auto">
//   <button
//     onClick={() => setActiveTab("email")}
//     className={cn(
//       "w-36 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
//       activeTab === "email"
//         ? "bg-teal-600 text-white shadow-sm"
//         : "text-gray-500 hover:bg-gray-200"
//     )}
//   >
//     Email
//   </button>
//   <button
//     onClick={() => setActiveTab("message")}
//     className={cn(
//       "w-36 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
//       activeTab === "message"
//         ? "bg-teal-600 text-white shadow-sm"
//         : "text-gray-500 hover:bg-gray-200"
//     )}
//   >
//     Online Message
//   </button>
// </div>


//   );
// };

// const EmailOnlineMessaging: React.FC<{ className?: string }> = ({ className = "" }) => {
//   const [activeTab, setActiveTab] = useState("email");

//   return (
//     <div className={`min-h-screen ${className}`}>
//       <Card className="h-auto flex flex-col py-2 rounded-xl bg-white ml-auto shadow-md">
//         <CardHeader className="pb-2 border-b">
//           <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
//         </CardHeader>
//         <CardContent className="flex-1 p-0">
//           {activeTab === "email" ? (
//             <EmailList emails={sampleEmails} />
//           ) : (
//             <MessageList messages={sampleMessages} />
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default EmailOnlineMessaging;
