import { useEmailStore } from "@/store/email-store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, RefreshCw, X, Mail, Clock, User, Search } from "lucide-react";
import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { Email, EmailCategory } from "@/lib/types/email";
import { Checkbox } from "@/components/ui/checkbox";
import { getSelectedLinkedEmailId, getSelectedLinkedEmailType } from "@/lib/utils/cookies";
import { createEmailPreview, EmailContentRenderer } from "@/lib/utils/emails/email-content-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AuthContext } from "@/lib/context/auth";
import { useCombinedAuth } from "../../providers/useCombinedAuth";
import Image from "next/image";

interface EmailSentProps {
  onBack?: () => void;
}

export const EmailSent = ({ onBack }: EmailSentProps) => {
  // Use email store 
  const { 
    emails, 
    isLoading, 
    loadingError, 
    fetchEmails,
    setActiveCategory,
    activeCategory,
    refreshCurrentCategory
  } = useEmailStore();
  
  const { token, user } = useContext(AuthContext);
  const { djombi } = useCombinedAuth();
  const djombiTokens = djombi.token || "";
  
  // Local UI state only
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [sortNewest, setSortNewest] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // FIXED: Track component state without causing re-renders
  const isInitialized = useRef(false);
  const currentEmailId = useRef<string | null>(null);
  const hasLoadedSentEmails = useRef(false);

  // FIXED: Enhanced refresh function that resets cache
  const handleRefresh = useCallback(() => {
    console.log('Manual refresh triggered for sent emails');
    hasLoadedSentEmails.current = false; // Reset to allow fresh fetch
    fetchEmails('sent', true);
  }, [fetchEmails]);

  // FIXED: Single initialization effect
  useEffect(() => {
    if (!isInitialized.current) {
      console.log('EmailSent component initializing');
      setMounted(true);
      setActiveCategory('sent');
      isInitialized.current = true;
      
      // Get initial email ID
      const emailId = getSelectedLinkedEmailId();
      currentEmailId.current = emailId;
      console.log('Initial email ID:', emailId);
    }
  }, []); // Empty deps - only run once

  // FIXED: Listen for changes in emails array to refresh display
  useEffect(() => {
    const sentEmails = emails.filter(email => 
      email.status === "sent" || email.category === "sent"
    );
    
    // If we have sent emails but haven't loaded them before, mark as loaded
    if (sentEmails.length > 0 && !hasLoadedSentEmails.current) {
      console.log('Found sent emails in store, marking as loaded');
      hasLoadedSentEmails.current = true;
    }
  }, [emails]); // React to changes in emails array

  // FIXED: Separate effect for fetching emails with better conditions
  useEffect(() => {
    const emailId = getSelectedLinkedEmailId();
    const emailType = getSelectedLinkedEmailType();
    
    // Check if email account changed
    const emailChanged = currentEmailId.current !== emailId;
    if (emailChanged) {
      console.log('Email account changed, resetting sent emails cache');
      currentEmailId.current = emailId;
      hasLoadedSentEmails.current = false; // Reset cache on email change
    }
    
    // FIXED: Only fetch if all conditions are met and we haven't loaded yet
    const shouldFetch = (
      isInitialized.current &&
      activeCategory === 'sent' &&
      emailId && 
      djombiTokens && 
      !isLoading &&
      !hasLoadedSentEmails.current // FIXED: Only fetch once per email account
    );

    if (shouldFetch) {
      console.log('Fetching sent emails:', {
        emailId: emailId?.substring(0, 20) + '...',
        emailType,
        activeCategory,
        hasLoadedBefore: hasLoadedSentEmails.current
      });
      
      hasLoadedSentEmails.current = true; // Mark as loaded
      fetchEmails('sent', false); // Don't force refresh on initial load
    } else {
      console.log('Skipping sent emails fetch:', {
        isInitialized: isInitialized.current,
        activeCategory,
        hasEmailId: !!emailId,
        hasToken: !!djombiTokens,
        isLoading,
        hasLoaded: hasLoadedSentEmails.current
      });
    }
  }, [activeCategory, djombiTokens, isLoading, fetchEmails]);
  
  // FIXED: Memoize sent emails filtering
  const sentEmails = useCallback(() => {
    return emails.filter(email => 
      email.status === "sent" || email.category === "sent"
    );
  }, [emails]);

  // FIXED: Memoize search filtering
  const filteredEmails = useCallback(() => {
    const sent = sentEmails();
    if (!searchTerm) return sent;
    
    const searchLower = searchTerm.toLowerCase();
    return sent.filter(email =>
      email.subject?.toLowerCase().includes(searchLower) ||
      email.to?.toLowerCase().includes(searchLower) ||
      email.content?.toLowerCase().includes(searchLower)
    );
  }, [sentEmails, searchTerm]);

  // FIXED: Memoize sorting
  const sortedEmails = useCallback(() => {
    return [...filteredEmails()].sort((a, b) => {
      const dateA = new Date(a.timestamp || 0).getTime();
      const dateB = new Date(b.timestamp || 0).getTime();
      return sortNewest ? dateB - dateA : dateA - dateB;
    });
  }, [filteredEmails, sortNewest]);
  
  // FIXED: Memoize date filtering
  const displayedEmails = useCallback(() => {
    if (!filterDate) return sortedEmails();
    
    return sortedEmails().filter(email => {
      const emailDate = new Date(email.timestamp || 0).toLocaleDateString();
      return emailDate === filterDate;
    });
  }, [sortedEmails, filterDate]);

  // Get current values for rendering
  const currentSentEmails = sentEmails();
  const currentDisplayedEmails = displayedEmails();

  // FIXED: Stable event handlers
  const toggleSort = useCallback(() => {
    setSortNewest(prev => !prev);
  }, []);

  const toggleSelect = useCallback((emailId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedEmails(prev => 
      prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  }, []);
  
  const handleRowClick = useCallback((email: Email) => {
    setSelectedEmail(email);
    setShowDialog(true);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  // FIXED: Better state detection
  const shouldShowLoading = isLoading && currentDisplayedEmails.length === 0;
  const shouldShowError = !isLoading && loadingError && currentDisplayedEmails.length === 0;
  const shouldShowEmpty = !isLoading && !loadingError && currentDisplayedEmails.length === 0;
  const shouldShowEmails = currentDisplayedEmails.length > 0;

  const currentSelectedEmailId = getSelectedLinkedEmailId();
  const currentSelectedEmailType = getSelectedLinkedEmailType();

  return (
    <div className="w-full h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-slate-100">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Sent Emails</h1>
                <p className="text-sm text-slate-600">
                  {currentDisplayedEmails.length} email{currentDisplayedEmails.length !== 1 ? 's' : ''} sent
                  {currentSelectedEmailType && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {currentSelectedEmailType} account
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search sent emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 w-64 bg-slate-50 border-slate-200 focus:bg-white"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={clearSearch}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleSort}
              className="bg-white hover:bg-slate-50"
            >
              <Clock className="w-4 h-4 mr-2" />
              {sortNewest ? "Newest First" : "Oldest First"}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="bg-white hover:bg-slate-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button variant="outline" size="sm" className="bg-white hover:bg-slate-50">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="h-[calc(100vh-100px)] overflow-hidden">
        <div className="h-full bg-white mx-6 my-4 rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          
          {/* Content Area */}
          <div className="h-full overflow-y-auto">
            {shouldShowLoading ? (
              <div className="flex flex-col justify-center items-center h-full bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <Mail className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-slate-600 mt-4 font-medium">Loading sent emails...</p>
                <p className="text-slate-500 text-sm">Fetching emails from {currentSelectedEmailType || 'selected'} account</p>
              </div>
            ) : shouldShowError ? (
              <div className="flex flex-col justify-center items-center h-full bg-gradient-to-br from-red-50 to-orange-50">
                <div className="p-4 bg-red-100 rounded-full mb-4">
                  <X className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Failed to Load Sent Emails</h3>
                <p className="text-red-600 text-center mb-4 max-w-md">{loadingError}</p>
                <Button 
                  onClick={handleRefresh}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : shouldShowEmpty ? (
              <div className="flex flex-col justify-center items-center h-full bg-gradient-to-br from-slate-50 to-gray-50">
                <div className="flex items-center justify-center mb-6 mx-auto">
                    <Image
                                    src="/icons/no-data.svg"
                                    alt="No data"
                                    width={70}
                                    height={70}
                                    className="w-56 h-56"
                                  />
                                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No Sent Emails Found</h3>
                <p className="text-slate-600 text-center max-w-md">
                  {searchTerm 
                    ? `No emails match your search "${searchTerm}"` 
                    : currentSelectedEmailType 
                      ? `No sent emails found in your ${currentSelectedEmailType} account`
                      : "You haven't sent any emails yet or no account is selected"
                  }
                </p>
                {searchTerm && (
                  <Button 
                    variant="outline" 
                    onClick={clearSearch}
                    className="mt-4"
                  >
                    Clear Search
                  </Button>
                )}
                {!currentSelectedEmailId && (
                  <p className="text-sm text-slate-500 mt-2">
                    Please select an email account from the dropdown above
                  </p>
                )}
              </div>
            ) : shouldShowEmails ? (
              <div className="divide-y divide-slate-100">
                {currentDisplayedEmails.map((email, index) => (
                  <div 
                    key={email.id} 
                    className={`flex items-center px-6 py-4 hover:bg-slate-50 transition-all duration-200 cursor-pointer group border-l-4 border-transparent hover:border-l-green-400 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-25'
                    }`}
                    onClick={() => handleRowClick(email)}
                  >
                    <div className="mr-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedEmails.includes(email.id || "")}
                        onCheckedChange={() => {}}
                        onClick={(e) => toggleSelect(email.id || "", e as React.MouseEvent)}
                        className="border-slate-300 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                    </div>
                    
                    <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                      {/* Recipient */}
                      <div className="col-span-3 flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div className="text-sm font-medium text-slate-700 truncate">
                          {email.to}
                        </div>
                      </div>
                      
                      {/* Subject and Preview */}
                      <div className="col-span-6 flex items-center">
                        <div className="text-sm truncate">
                          <span className="font-semibold text-slate-800 group-hover:text-slate-900">
                            {email.subject || "(No Subject)"}
                          </span>
                          {email.content && (
                            <span className="text-slate-500 ml-2 group-hover:text-slate-600">
                              - {mounted ? createEmailPreview(email.content, 60) : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Timestamp */}
                      <div className="col-span-3 text-right">
                        <div className="text-sm text-slate-500 group-hover:text-slate-600">
                          {email.timestamp ? (
                            <div className="flex flex-col items-end">
                              <span className="font-medium">
                                {new Date(email.timestamp).toLocaleDateString()}
                              </span>
                              <span className="text-xs">
                                {new Date(email.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                          ) : (
                            <span>Unknown time</span>
                          )}
                        </div>
                        {email.hasAttachment && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-600">
                              📎 Attachment
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      
      {/* Email Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-slate-200 pb-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold text-slate-800 mb-2">
                  {selectedEmail?.subject || "Email Details"}
                </DialogTitle>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    To: {selectedEmail?.to}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedEmail?.timestamp ? 
                      new Date(selectedEmail.timestamp).toLocaleString() : 
                      "Unknown time"}
                  </span>
                </div>
              </div>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>
          
          {selectedEmail && (
            <div className="space-y-6 pt-4">
              {/* Email Headers */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-12 gap-3 text-sm">
                  <div className="col-span-2 font-semibold text-slate-700">From:</div>
                  <div className="col-span-10 text-slate-800">{selectedEmail.from}</div>
                  
                  <div className="col-span-2 font-semibold text-slate-700">To:</div>
                  <div className="col-span-10 text-slate-800">{selectedEmail.to}</div>
                  
                  <div className="col-span-2 font-semibold text-slate-700">Subject:</div>
                  <div className="col-span-10 text-slate-800 font-medium">{selectedEmail.subject}</div>
                  
                  <div className="col-span-2 font-semibold text-slate-700">Date:</div>
                  <div className="col-span-10 text-slate-800">
                    {selectedEmail.timestamp ? 
                      new Date(selectedEmail.timestamp).toLocaleString() : 
                      "Unknown time"}
                  </div>
                </div>
              </div>
              
              {/* Email Content */}
              <div className="border-t border-slate-200 pt-6">
                <div className="prose prose-slate max-w-none">
                  {mounted && <EmailContentRenderer content={selectedEmail.content} />}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Debug Info (Development Only) */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black text-white p-3 rounded-lg text-xs max-w-xs z-50">
          <div className="space-y-1">
            <div>Initialized: {isInitialized.current ? 'Yes' : 'No'}</div>
            <div>Active Category: {activeCategory}</div>
            <div>Selected Email ID: {currentSelectedEmailId?.substring(0, 20) || 'None'}</div>
            <div>Email Type: {currentSelectedEmailType || 'None'}</div>
            <div>Store Emails: {emails.length}</div>
            <div>Sent Emails: {currentSentEmails.length}</div>
            <div>Displayed: {currentDisplayedEmails.length}</div>
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>Has Loaded: {hasLoadedSentEmails.current ? 'Yes' : 'No'}</div>
            <div>Error: {loadingError || 'None'}</div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default EmailSent;




























































































// 7/8/2025
// import { useEmailStore } from "@/lib/store/email-store";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Filter, RefreshCw, X } from "lucide-react";
// import { useState, useEffect, useContext, useCallback } from "react";
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
// import { useCombinedAuth } from "../../providers/useCombinedAuth";
// import { DjombiProfileService } from "@/lib/services/DjombiProfileService";

// interface EmailSentProps {
//   onBack?: () => void;
// }

// // Helper function to get Djombi access token
// const getDjombiAccessToken = (): string | null => {
//   // First try from DjombiProfileService
//   const { accessToken } = DjombiProfileService.getStoredDjombiTokens();
//   if (accessToken) {
//     return accessToken;
//   }
  
//   // Fallback to localStorage directly
//   if (typeof window !== 'undefined') {
//     const storedToken = localStorage.getItem('djombi_access_token');
//     if (storedToken) {
//       return storedToken;
//     }
//   }
  
//   return null;
// };

// // Helper function to get linked email ID
// const getLinkedEmailId = (): string | null => {
//   // First try cookies
//   const emailIdFromCookie = getCookie('linkedEmailId');
//   if (emailIdFromCookie) {
//     return emailIdFromCookie;
//   }
  
//   // Then try localStorage
//   if (typeof window !== 'undefined') {
//     const emailIdFromStorage = localStorage.getItem('linkedEmailId');
//     if (emailIdFromStorage) {
//       return emailIdFromStorage;
//     }
//   }
  
//   return null;
// };

// export const EmailSent = ({ onBack }: EmailSentProps) => {
//   const { emails, addEmail } = useEmailStore();
  
//   // Move all hooks to the top level
//   const { token, user } = useContext(AuthContext);
//   const { djombi } = useCombinedAuth();
  
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

//   // Helper function to process response data - memoized to prevent unnecessary re-renders
//   const processResponseData = useCallback((data: any) => {
//     console.log("Processing sent response data:", data);
//     console.log("Full response structure:", JSON.stringify(data, null, 2));
    
//     // Check if data contains emails (handle different response structures)
//     let emailsData: any[] = [];
    
//     // More comprehensive response structure handling
//     if (Array.isArray(data)) {
//       emailsData = data;
//     } else if (data.data && Array.isArray(data.data)) {
//       emailsData = data.data;
//     } else if (data.sent && Array.isArray(data.sent)) {
//       emailsData = data.sent;
//     } else if (data.emails && Array.isArray(data.emails)) {
//       emailsData = data.emails;
//     } else if (data.sentEmails && Array.isArray(data.sentEmails)) {
//       emailsData = data.sentEmails;
//     } else if (data.result && Array.isArray(data.result)) {
//       emailsData = data.result;
//     } else if (data.items && Array.isArray(data.items)) {
//       emailsData = data.items;
//     } else if (data.messages && Array.isArray(data.messages)) {
//       emailsData = data.messages;
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
    
//     console.log(`Found ${emailsData.length} emails in response`);
    
//     if (emailsData.length === 0) {
//       console.log("No sent emails found in the response - setting empty array");
//       setApiSentEmails([]);
//       return;
//     }
    
//     console.log("Sample email data structure:", emailsData[0]);
    
//     // First, filter out invalid emails, then map them to the correct structure
//     const validEmailsData = emailsData.filter(email => email && typeof email === 'object');
//     console.log(`Filtering: ${emailsData.length} -> ${validEmailsData.length} valid emails`);
    
//     // Now map the valid emails to the correct structure
//     const formattedEmails: Email[] = validEmailsData.map((email: any, index: number): Email => {
//       const formatted = {
//         id: email.id || email._id || email.messageId || email.message_id || `sent-${Date.now()}-${index}`,
//         subject: email.subject || email.Subject || 'No Subject',
//         content: email.content || email.body || email.Body || email.textContent || email.htmlContent || '',
//         contentType: email.contentType || email.content_type || 'text',
//         from: email.from || email.sender || email.From || 'Unknown Sender',
//         to: email.to || email.recipient || email.To || email.recipients || '',
//         timestamp: email.timestamp || email.createdAt || email.created_at || email.date || email.Date || new Date().toISOString(),
//         status: "sent",
//         isUrgent: Boolean(email.isUrgent || email.is_urgent || email.priority === 'high' || false),
//         hasAttachment: Boolean(email.hasAttachment || email.has_attachment || email.attachments || false),
//         category: "sent",
//         isRead: true, // Sent emails are always read
//         email_id: email.email_id || email.emailId || null
//       };
      
//       console.log(`Formatted email ${index + 1}:`, formatted);
//       return formatted;
//     });
    
//     console.log(`Successfully processed ${formattedEmails.length} sent emails`);
    
//     // Update the API state with all sent emails from server
//     setApiSentEmails(formattedEmails);
    
//     // Also add to email store for consistency, but avoid duplicates
//     formattedEmails.forEach(email => {
//       const exists = emails.some(e => e.id === email.id);
//       if (!exists) {
//         console.log(`Adding new email to store: ${email.subject}`);
//         addEmail({
//           ...email,
//           status: "sent",
//         });
//       }
//     });
    
//   }, [emails, addEmail]); // Include 'emails' in dependency array since it's used in the forEach loop
  
//  // Use useCallback to memoize the function and include dependencies
// const fetchSentEmails = useCallback(async () => {
//   setIsLoading(true);
//   setError(null);
  
//   try {
//     console.log("Starting fetchSentEmails...");

//     // Get Djombi access token using utility function
//     const djombiToken = getDjombiAccessToken();
//     console.log("Djombi token retrieved:", djombiToken ? `${djombiToken.substring(0, 10)}...` : 'No Djombi token found');
    
//     if (!djombiToken) {
//       throw new Error('No Djombi access token available. Please log in again.');
//     }
    
//     // Get linked email ID using utility function
//     const linkedEmailId = getLinkedEmailId();
//     console.log("Linked Email ID:", linkedEmailId);
    
//     if (!linkedEmailId) {
//       console.log("Checking localStorage for linkedEmailId...");
//       if (typeof window !== 'undefined') {
//         const storageKeys = Object.keys(localStorage);
//         console.log("Available localStorage keys:", storageKeys);
//         console.log("linkedEmailId value:", localStorage.getItem('linkedEmailId'));
//       }
//       throw new Error('No linked email ID found. Please link your email first.');
//     }
    
//     // Try GET request with proper URL encoding and parameters
//     const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/sent?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=50`;
//     console.log("Fetching from API endpoint:", apiEndpoint);
    
//     const response = await axios.get(apiEndpoint, {
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${djombiToken}`
//       },
//       timeout: 30000 // 30 second timeout
//     });
    
//     console.log("GET response status:", response.status);
//     console.log("GET response headers:", response.headers);
//     console.log("GET response data:", response.data);
    
//     // Check for success/error in response
//     if (response.data.success === false) {
//       const errorMessage = response.data.message || 'API request failed';
//       console.error("API error:", errorMessage);
      
//       // If API explicitly says no sent emails, that's fine
//       if (errorMessage.toLowerCase().includes('no sent emails') || 
//           errorMessage.toLowerCase().includes('not found')) {
//         console.log("API confirmed no sent emails exist");
//         setApiSentEmails([]);
//         return;
//       }
      
//       throw new Error(`API error: ${errorMessage}`);
//     }
    
//     // Process successful response
//     if (response.status === 200) {
//       console.log("Successfully received sent emails response");
//       processResponseData(response.data);
//     } else {
//       console.warn(`Unexpected response status: ${response.status}`);
//       processResponseData(response.data);
//     }
    
//   } catch (err) {
//     console.error('Failed to fetch sent emails:', err);
    
//     // Enhanced error logging
//     if (err instanceof Error) {
//       console.error('Error details:', {
//         message: err.message,
//         name: err.name,
//         stack: err.stack
//       });
//     }
    
//     if (axios.isAxiosError(err)) {
//       console.error('Axios error details:', {
//         status: err.response?.status,
//         statusText: err.response?.statusText,
//         data: err.response?.data,
//         headers: err.response?.headers,
//         config: {
//           url: err.config?.url,
//           method: err.config?.method,
//           headers: err.config?.headers
//         }
//       });
      
//       // Handle specific error cases
//       if (err.response?.status === 404) {
//         console.log("Sent emails endpoint returned 404 - no sent emails exist");
//         setApiSentEmails([]);
//         return;
//       } else if (err.response?.status === 401) {
//         setError('Authentication failed. Please log in again.');
//         return;
//       } else if (err.response?.status === 403) {
//         setError('Access denied. Please check your permissions.');
//         return;
//       }
//     }
    
//     setError(err instanceof Error ? err.message : 'Failed to fetch sent emails');
    
//     // Fallback to local data if API fails
//     const localSentEmails = emails.filter(email => email.status === "sent" || email.category === "sent");
//     if (localSentEmails.length > 0) {
//       console.log("Using local sent emails as fallback:", localSentEmails.length);
//       setApiSentEmails(localSentEmails);
//     } else {
//       console.log("No local sent emails found either");
//       setApiSentEmails([]);
//     }
//   } finally {
//     setIsLoading(false);
//     setIsRefreshing(false);
//   }
// }, [emails, processResponseData]); // Include 'emails' here since it's used in the fallback section
  
//   useEffect(() => {
//     fetchSentEmails();
//   }, [fetchSentEmails]);
  
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
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default EmailSent;











































// import { useEmailStore } from "@/lib/store/email-store";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Filter, RefreshCw, X } from "lucide-react";
// import { useState, useEffect, useContext, useCallback } from "react";
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
// import { useCombinedAuth } from "../../providers/useCombinedAuth";
// import { DjombiProfileService } from "@/lib/services/DjombiProfileService";

// interface EmailSentProps {
//   onBack?: () => void;
// }

// // Helper function to get Djombi access token
// const getDjombiAccessToken = (): string | null => {
//   // First try from DjombiProfileService
//   const { accessToken } = DjombiProfileService.getStoredDjombiTokens();
//   if (accessToken) {
//     return accessToken;
//   }
  
//   // Fallback to localStorage directly
//   if (typeof window !== 'undefined') {
//     const storedToken = localStorage.getItem('djombi_access_token');
//     if (storedToken) {
//       return storedToken;
//     }
//   }
  
//   return null;
// };

// // Helper function to get linked email ID
// const getLinkedEmailId = (): string | null => {
//   // First try cookies
//   const emailIdFromCookie = getCookie('linkedEmailId');
//   if (emailIdFromCookie) {
//     return emailIdFromCookie;
//   }
  
//   // Then try localStorage
//   if (typeof window !== 'undefined') {
//     const emailIdFromStorage = localStorage.getItem('linkedEmailId');
//     if (emailIdFromStorage) {
//       return emailIdFromStorage;
//     }
//   }
  
//   return null;
// };

// export const EmailSent = ({ onBack }: EmailSentProps) => {
//   const { emails, addEmail } = useEmailStore();
  
//   // Move all hooks to the top level
//   const { token, user } = useContext(AuthContext);
//   const { djombi } = useCombinedAuth();
  
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

//   // Helper function to process response data - memoized to prevent unnecessary re-renders
//   const processResponseData = useCallback((data: any) => {
//     console.log("Processing sent response data:", data);
//     console.log("Full response structure:", JSON.stringify(data, null, 2));
    
//     // Check if data contains emails (handle different response structures)
//     let emailsData: any[] = [];
    
//     // More comprehensive response structure handling
//     if (Array.isArray(data)) {
//       emailsData = data;
//     } else if (data.data && Array.isArray(data.data)) {
//       emailsData = data.data;
//     } else if (data.sent && Array.isArray(data.sent)) {
//       emailsData = data.sent;
//     } else if (data.emails && Array.isArray(data.emails)) {
//       emailsData = data.emails;
//     } else if (data.sentEmails && Array.isArray(data.sentEmails)) {
//       emailsData = data.sentEmails;
//     } else if (data.result && Array.isArray(data.result)) {
//       emailsData = data.result;
//     } else if (data.items && Array.isArray(data.items)) {
//       emailsData = data.items;
//     } else if (data.messages && Array.isArray(data.messages)) {
//       emailsData = data.messages;
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
    
//     console.log(`Found ${emailsData.length} emails in response`);
    
//     if (emailsData.length === 0) {
//       console.log("No sent emails found in the response - setting empty array");
//       setApiSentEmails([]);
//       return;
//     }
    
//     console.log("Sample email data structure:", emailsData[0]);
    
//     // First, filter out invalid emails, then map them to the correct structure
//     const validEmailsData = emailsData.filter(email => email && typeof email === 'object');
//     console.log(`Filtering: ${emailsData.length} -> ${validEmailsData.length} valid emails`);
    
//     // Now map the valid emails to the correct structure
//     const formattedEmails: Email[] = validEmailsData.map((email: any, index: number): Email => {
//       const formatted = {
//         id: email.id || email._id || email.messageId || email.message_id || `sent-${Date.now()}-${index}`,
//         subject: email.subject || email.Subject || 'No Subject',
//         content: email.content || email.body || email.Body || email.textContent || email.htmlContent || '',
//         contentType: email.contentType || email.content_type || 'text',
//         from: email.from || email.sender || email.From || 'Unknown Sender',
//         to: email.to || email.recipient || email.To || email.recipients || '',
//         timestamp: email.timestamp || email.createdAt || email.created_at || email.date || email.Date || new Date().toISOString(),
//         status: "sent",
//         isUrgent: Boolean(email.isUrgent || email.is_urgent || email.priority === 'high' || false),
//         hasAttachment: Boolean(email.hasAttachment || email.has_attachment || email.attachments || false),
//         category: "sent",
//         isRead: true, // Sent emails are always read
//         email_id: email.email_id || email.emailId || null
//       };
      
//       console.log(`Formatted email ${index + 1}:`, formatted);
//       return formatted;
//     });
    
//     console.log(`Successfully processed ${formattedEmails.length} sent emails`);
    
//     // Update the API state with all sent emails from server
//     setApiSentEmails(formattedEmails);
    
//     // Also add to email store for consistency, but avoid duplicates
//     formattedEmails.forEach(email => {
//       const exists = emails.some(e => e.id === email.id);
//       if (!exists) {
//         console.log(`Adding new email to store: ${email.subject}`);
//         addEmail({
//           ...email,
//           status: "sent",
//         });
//       }
//     });
    
//   }, [emails, addEmail]);
  
//  // Use useCallback to memoize the function and include dependencies
// const fetchSentEmails = useCallback(async () => {
//   setIsLoading(true);
//   setError(null);
  
//   try {
//     console.log("Starting fetchSentEmails...");

//     // Get Djombi access token using utility function
//     const djombiToken = getDjombiAccessToken();
//     console.log("Djombi token retrieved:", djombiToken ? `${djombiToken.substring(0, 10)}...` : 'No Djombi token found');
    
//     if (!djombiToken) {
//       throw new Error('No Djombi access token available. Please log in again.');
//     }
    
//     // Get linked email ID using utility function
//     const linkedEmailId = getLinkedEmailId();
//     console.log("Linked Email ID:", linkedEmailId);
    
//     if (!linkedEmailId) {
//       console.log("Checking localStorage for linkedEmailId...");
//       if (typeof window !== 'undefined') {
//         const storageKeys = Object.keys(localStorage);
//         console.log("Available localStorage keys:", storageKeys);
//         console.log("linkedEmailId value:", localStorage.getItem('linkedEmailId'));
//       }
//       throw new Error('No linked email ID found. Please link your email first.');
//     }
    
//     // Try GET request with proper URL encoding and parameters
//     const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/sent?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=50`;
//     console.log("Fetching from API endpoint:", apiEndpoint);
    
//     const response = await axios.get(apiEndpoint, {
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${djombiToken}`
//       },
//       timeout: 30000 // 30 second timeout
//     });
    
//     console.log("GET response status:", response.status);
//     console.log("GET response headers:", response.headers);
//     console.log("GET response data:", response.data);
    
//     // Check for success/error in response
//     if (response.data.success === false) {
//       const errorMessage = response.data.message || 'API request failed';
//       console.error("API error:", errorMessage);
      
//       // If API explicitly says no sent emails, that's fine
//       if (errorMessage.toLowerCase().includes('no sent emails') || 
//           errorMessage.toLowerCase().includes('not found')) {
//         console.log("API confirmed no sent emails exist");
//         setApiSentEmails([]);
//         return;
//       }
      
//       throw new Error(`API error: ${errorMessage}`);
//     }
    
//     // Process successful response
//     if (response.status === 200) {
//       console.log("Successfully received sent emails response");
//       processResponseData(response.data);
//     } else {
//       console.warn(`Unexpected response status: ${response.status}`);
//       processResponseData(response.data);
//     }
    
//   } catch (err) {
//     console.error('Failed to fetch sent emails:', err);
    
//     // Enhanced error logging
//     if (err instanceof Error) {
//       console.error('Error details:', {
//         message: err.message,
//         name: err.name,
//         stack: err.stack
//       });
//     }
    
//     if (axios.isAxiosError(err)) {
//       console.error('Axios error details:', {
//         status: err.response?.status,
//         statusText: err.response?.statusText,
//         data: err.response?.data,
//         headers: err.response?.headers,
//         config: {
//           url: err.config?.url,
//           method: err.config?.method,
//           headers: err.config?.headers
//         }
//       });
      
//       // Handle specific error cases
//       if (err.response?.status === 404) {
//         console.log("Sent emails endpoint returned 404 - no sent emails exist");
//         setApiSentEmails([]);
//         return;
//       } else if (err.response?.status === 401) {
//         setError('Authentication failed. Please log in again.');
//         return;
//       } else if (err.response?.status === 403) {
//         setError('Access denied. Please check your permissions.');
//         return;
//       }
//     }
    
//     setError(err instanceof Error ? err.message : 'Failed to fetch sent emails');
    
//     // Fallback to local data if API fails
//     const localSentEmails = emails.filter(email => email.status === "sent" || email.category === "sent");
//     if (localSentEmails.length > 0) {
//       console.log("Using local sent emails as fallback:", localSentEmails.length);
//       setApiSentEmails(localSentEmails);
//     } else {
//       console.log("No local sent emails found either");
//       setApiSentEmails([]);
//     }
//   } finally {
//     setIsLoading(false);
//     setIsRefreshing(false);
//   }
// }, [processResponseData]); // Include processResponseData as dependency and remove unnecessary token dependencies
  
//   useEffect(() => {
//     fetchSentEmails();
//   }, [fetchSentEmails]);
  
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
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default EmailSent;



























































// 29/6/2025 10:46
// import { useEmailStore } from "@/lib/store/email-store";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Filter, RefreshCw, X } from "lucide-react";
// import { useState, useEffect, useContext, useCallback } from "react";
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
// import { useCombinedAuth } from "../../providers/useCombinedAuth";
// import { DjombiProfileService } from "@/lib/services/DjombiProfileService";

// interface EmailSentProps {
//   onBack?: () => void;
// }

// // Helper function to get Djombi access token
// const getDjombiAccessToken = (): string | null => {
//   // First try from DjombiProfileService
//   const { accessToken } = DjombiProfileService.getStoredDjombiTokens();
//   if (accessToken) {
//     return accessToken;
//   }
  
//   // Fallback to localStorage directly
//   if (typeof window !== 'undefined') {
//     const storedToken = localStorage.getItem('djombi_access_token');
//     if (storedToken) {
//       return storedToken;
//     }
//   }
  
//   return null;
// };

// // Helper function to get linked email ID
// const getLinkedEmailId = (): string | null => {
//   // First try cookies
//   const emailIdFromCookie = getCookie('linkedEmailId');
//   if (emailIdFromCookie) {
//     return emailIdFromCookie;
//   }
  
//   // Then try localStorage
//   if (typeof window !== 'undefined') {
//     const emailIdFromStorage = localStorage.getItem('linkedEmailId');
//     if (emailIdFromStorage) {
//       return emailIdFromStorage;
//     }
//   }
  
//   return null;
// };

// export const EmailSent = ({ onBack }: EmailSentProps) => {
//   const { emails, addEmail } = useEmailStore();
  
//   // Move all hooks to the top level
//   const { token, user } = useContext(AuthContext);
//   const { djombi } = useCombinedAuth();
  
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

//   // Helper function to process response data - memoized to prevent unnecessary re-renders
//   const processResponseData = useCallback((data: any) => {
//     console.log("Processing sent response data:", data);
    
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
//       console.log("No sent emails found in the response");
//       setApiSentEmails([]);
//       return;
//     }
    
//     console.log("Sample email data structure:", emailsData[0]);
//     console.log(`Found ${emailsData.length} sent emails in response`);
    
//     // First, filter out invalid emails, then map them to the correct structure
//     const validEmailsData = emailsData.filter(email => email && typeof email === 'object');
    
//     // Now map the valid emails to the correct structure
//     const formattedEmails: Email[] = validEmailsData.map((email: any): Email => {
//       return {
//         id: email.id || email._id || `sent-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
//         subject: email.subject || 'No Subject',
//         content: email.content || '',
//         contentType: email.contentType || 'text',
//         from: email.from || email.sender || 'Unknown Sender',
//         to: email.to || email.recipient || '',
//         timestamp: email.timestamp || email.createdAt || email.created_at || new Date().toISOString(),
//         status: "sent",
//         isUrgent: Boolean(email.isUrgent || email.is_urgent || false),
//         hasAttachment: Boolean(email.hasAttachment || email.has_attachment || false),
//         category: "sent",
//         isRead: true, // Sent emails are always read
//         email_id: email.email_id || null
//       };
//     });
    
//     console.log(`Processed ${formattedEmails.length} sent emails`);
    
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
//   }, [emails, addEmail]);
  
//  // Use useCallback to memoize the function and include dependencies
// const fetchSentEmails = useCallback(async () => {
//   setIsLoading(true);
//   setError(null);
  
//   try {
//     console.log("Starting fetchSentEmails...");

//     // Get Djombi access token using utility function
//     const djombiToken = getDjombiAccessToken();
//     console.log("Djombi token retrieved:", djombiToken ? `${djombiToken.substring(0, 10)}...` : 'No Djombi token found');
    
//     if (!djombiToken) {
//       throw new Error('No Djombi access token available. Please log in again.');
//     }
    
//     // Get linked email ID using utility function
//     const linkedEmailId = getLinkedEmailId();
//     console.log("Linked Email ID:", linkedEmailId);
    
//     if (!linkedEmailId) {
//       console.log("Checking localStorage for linkedEmailId...");
//       if (typeof window !== 'undefined') {
//         const storageKeys = Object.keys(localStorage);
//         console.log("Available localStorage keys:", storageKeys);
//         console.log("linkedEmailId value:", localStorage.getItem('linkedEmailId'));
//       }
//       throw new Error('No linked email ID found. Please link your email first.');
//     }
    
//     // First try GET request with proper URL encoding and parameters
//     const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/sent?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//     console.log("Fetching from API endpoint:", apiEndpoint);
    
//     try {
//       const response = await axios.get(apiEndpoint, {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${djombiToken}` // Use Djombi token
//         }
//       });
      
//       console.log("GET response status:", response.status);
//       console.log("GET response data:", response.data);
      
//       // Check for success/error in response
//       if (response.data.success === false) {
//         const errorMessage = response.data.message || 'API request failed';
//         console.error("API error:", errorMessage);
//         throw new Error(`API error: ${errorMessage}`);
//       }
      
//       processResponseData(response.data);
//     } catch (getError) {
//       console.log("GET request failed, trying POST fallback:", getError);
      
//       // Try POST request as fallback with query parameters (same pattern as drafts)
//       const postEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/sent?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//       console.log("Trying POST request to:", postEndpoint);
      
//       try {
//         const postResponse = await axios.post(postEndpoint, {
//           email_id: linkedEmailId,
//           content: "" // Add empty content similar to drafts fallback
//         }, {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${djombiToken}` // Use Djombi token
//           }
//         });
        
//         console.log("POST response status:", postResponse.status);
//         console.log("POST response data:", postResponse.data);
        
//         // Check for success/error in POST response
//         if (postResponse.data.success === false) {
//           const errorMessage = postResponse.data.message || 'API POST request failed';
//           console.error("API POST error:", errorMessage);
//           throw new Error(`API POST error: ${errorMessage}`);
//         }
        
//         // Process the successful POST response
//         processResponseData(postResponse.data);
//       } catch (postError) {
//         console.error("POST request also failed:", postError);
//         throw postError;
//       }
//     }
//   } catch (err) {
//     console.error('Failed to fetch sent emails:', err);
    
//     // Enhanced error logging
//     if (err instanceof Error) {
//       console.error('Error details:', {
//         message: err.message,
//         name: err.name,
//         stack: err.stack
//       });
//     }
    
//     if (axios.isAxiosError(err)) {
//       console.error('Axios error details:', {
//         status: err.response?.status,
//         statusText: err.response?.statusText,
//         data: err.response?.data,
//         headers: err.response?.headers
//       });
//     }
    
//     setError(err instanceof Error ? err.message : 'Failed to fetch sent emails');
    
//     // Fallback to local data if API fails
//     const localSentEmails = emails.filter(email => email.status === "sent");
//     if (localSentEmails.length > 0) {
//       console.log("Using local sent emails as fallback");
//       setApiSentEmails(localSentEmails);
//     } else {
//       setApiSentEmails([]);
//     }
//   } finally {
//     setIsLoading(false);
//     setIsRefreshing(false);
//   }
// }, [processResponseData]); // Include processResponseData as dependency and remove unnecessary token dependencies
  
//   useEffect(() => {
//     fetchSentEmails();
//   }, [fetchSentEmails]);
  
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
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default EmailSent;















































// import { useEmailStore } from "@/lib/store/email-store";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Filter, RefreshCw, X } from "lucide-react";
// import { useState, useEffect, useContext, useCallback } from "react";
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
// import { useCombinedAuth } from "../../providers/useCombinedAuth";
// import { DjombiProfileService } from "@/lib/services/DjombiProfileService";

// interface EmailSentProps {
//   onBack?: () => void;
// }

// // Helper function to get Djombi access token
// const getDjombiAccessToken = (): string | null => {
//   // First try from DjombiProfileService
//   const { accessToken } = DjombiProfileService.getStoredDjombiTokens();
//   if (accessToken) {
//     return accessToken;
//   }
  
//   // Fallback to localStorage directly
//   if (typeof window !== 'undefined') {
//     const storedToken = localStorage.getItem('djombi_access_token');
//     if (storedToken) {
//       return storedToken;
//     }
//   }
  
//   return null;
// };

// // Helper function to get linked email ID
// const getLinkedEmailId = (): string | null => {
//   // First try cookies
//   const emailIdFromCookie = getCookie('linkedEmailId');
//   if (emailIdFromCookie) {
//     return emailIdFromCookie;
//   }
  
//   // Then try localStorage
//   if (typeof window !== 'undefined') {
//     const emailIdFromStorage = localStorage.getItem('linkedEmailId');
//     if (emailIdFromStorage) {
//       return emailIdFromStorage;
//     }
//   }
  
//   return null;
// };

// export const EmailSent = ({ onBack }: EmailSentProps) => {
//   const { emails, addEmail } = useEmailStore();
  
//   // Move all hooks to the top level
//   const { token, user } = useContext(AuthContext);
//   const { djombi } = useCombinedAuth();
  
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

//   // Helper function to process response data
//   const processResponseData = (data: any) => {
//     console.log("Processing sent response data:", data);
    
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
//       console.log("No sent emails found in the response");
//       setApiSentEmails([]);
//       return;
//     }
    
//     console.log("Sample email data structure:", emailsData[0]);
//     console.log(`Found ${emailsData.length} sent emails in response`);
    
//     // First, filter out invalid emails, then map them to the correct structure
//     const validEmailsData = emailsData.filter(email => email && typeof email === 'object');
    
//     // Now map the valid emails to the correct structure
//     const formattedEmails: Email[] = validEmailsData.map((email: any): Email => {
//       return {
//         id: email.id || email._id || `sent-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
//         subject: email.subject || 'No Subject',
//         content: email.content || '',
//         contentType: email.contentType || 'text',
//         from: email.from || email.sender || 'Unknown Sender',
//         to: email.to || email.recipient || '',
//         timestamp: email.timestamp || email.createdAt || email.created_at || new Date().toISOString(),
//         status: "sent",
//         isUrgent: Boolean(email.isUrgent || email.is_urgent || false),
//         hasAttachment: Boolean(email.hasAttachment || email.has_attachment || false),
//         category: "sent",
//         isRead: true, // Sent emails are always read
//         email_id: email.email_id || null
//       };
//     });
    
//     console.log(`Processed ${formattedEmails.length} sent emails`);
    
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
  
//  // Use useCallback to memoize the function and include dependencies
// const fetchSentEmails = useCallback(async () => {
//   setIsLoading(true);
//   setError(null);
  
//   try {
//     console.log("Starting fetchSentEmails...");

//     // Get Djombi access token using utility function
//     const djombiToken = getDjombiAccessToken();
//     console.log("Djombi token retrieved:", djombiToken ? `${djombiToken.substring(0, 10)}...` : 'No Djombi token found');
    
//     if (!djombiToken) {
//       throw new Error('No Djombi access token available. Please log in again.');
//     }
    
//     // Get linked email ID using utility function
//     const linkedEmailId = getLinkedEmailId();
//     console.log("Linked Email ID:", linkedEmailId);
    
//     if (!linkedEmailId) {
//       console.log("Checking localStorage for linkedEmailId...");
//       if (typeof window !== 'undefined') {
//         const storageKeys = Object.keys(localStorage);
//         console.log("Available localStorage keys:", storageKeys);
//         console.log("linkedEmailId value:", localStorage.getItem('linkedEmailId'));
//       }
//       throw new Error('No linked email ID found. Please link your email first.');
//     }
    
//     // First try GET request with proper URL encoding and parameters
//     const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/sent?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//     console.log("Fetching from API endpoint:", apiEndpoint);
    
//     try {
//       const response = await axios.get(apiEndpoint, {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${djombiToken}` // Use Djombi token
//         }
//       });
      
//       console.log("GET response status:", response.status);
//       console.log("GET response data:", response.data);
      
//       // Check for success/error in response
//       if (response.data.success === false) {
//         const errorMessage = response.data.message || 'API request failed';
//         console.error("API error:", errorMessage);
//         throw new Error(`API error: ${errorMessage}`);
//       }
      
//       processResponseData(response.data);
//     } catch (getError) {
//       console.log("GET request failed, trying POST fallback:", getError);
      
//       // Try POST request as fallback with query parameters (same pattern as drafts)
//       const postEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/sent?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//       console.log("Trying POST request to:", postEndpoint);
      
//       try {
//         const postResponse = await axios.post(postEndpoint, {
//           email_id: linkedEmailId,
//           content: "" // Add empty content similar to drafts fallback
//         }, {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${djombiToken}` // Use Djombi token
//           }
//         });
        
//         console.log("POST response status:", postResponse.status);
//         console.log("POST response data:", postResponse.data);
        
//         // Check for success/error in POST response
//         if (postResponse.data.success === false) {
//           const errorMessage = postResponse.data.message || 'API POST request failed';
//           console.error("API POST error:", errorMessage);
//           throw new Error(`API POST error: ${errorMessage}`);
//         }
        
//         // Process the successful POST response
//         processResponseData(postResponse.data);
//       } catch (postError) {
//         console.error("POST request also failed:", postError);
//         throw postError;
//       }
//     }
//   } catch (err) {
//     console.error('Failed to fetch sent emails:', err);
    
//     // Enhanced error logging
//     if (err instanceof Error) {
//       console.error('Error details:', {
//         message: err.message,
//         name: err.name,
//         stack: err.stack
//       });
//     }
    
//     if (axios.isAxiosError(err)) {
//       console.error('Axios error details:', {
//         status: err.response?.status,
//         statusText: err.response?.statusText,
//         data: err.response?.data,
//         headers: err.response?.headers
//       });
//     }
    
//     setError(err instanceof Error ? err.message : 'Failed to fetch sent emails');
    
//     // Fallback to local data if API fails
//     const localSentEmails = emails.filter(email => email.status === "sent");
//     if (localSentEmails.length > 0) {
//       console.log("Using local sent emails as fallback");
//       setApiSentEmails(localSentEmails);
//     } else {
//       setApiSentEmails([]);
//     }
//   } finally {
//     setIsLoading(false);
//     setIsRefreshing(false);
//   }
// }, [token, djombi.token, emails, addEmail]);
  
//   useEffect(() => {
//     fetchSentEmails();
//   }, [fetchSentEmails]);
  
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
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default EmailSent;

















































// import { useEmailStore } from "@/lib/store/email-store";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Filter, RefreshCw, X } from "lucide-react";
// import { useState, useEffect, useContext, useCallback } from "react";
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
// import { useCombinedAuth } from "../../providers/useCombinedAuth";

// interface EmailSentProps {
//   onBack?: () => void;
// }

// export const EmailSent = ({ onBack }: EmailSentProps) => {
//   const { emails, addEmail } = useEmailStore();
  
//   // Move all hooks to the top level
//   const { token, user } = useContext(AuthContext);
//   const { djombi } = useCombinedAuth();
  
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
    
//     console.log(`Processed ${formattedEmails.length} sent emails`);
    
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
  
//   // Use useCallback to memoize the function and include dependencies
//   const fetchSentEmails = useCallback(async () => {
//     setIsLoading(true);
//     setError(null);
    
//     try {
//       console.log("Token retrieved:", token ? `${token.access_token.substring(0, 10)}...` : 'No token found');

//       const djombiTokens = djombi.token || "";
      
//       if (!token) {
//         throw new Error('No access token available');
//       }
      
//       // Get linked email ID - use the same approach as ProfessionalEmailInbox
//       const linkedEmailId = getCookie('linkedEmailId') ||
//         (typeof window !== 'undefined' ? localStorage.getItem('linkedEmailId') : null);
//       console.log("Linked Email ID:", linkedEmailId);
      
//       if (!linkedEmailId) {
//         throw new Error('No linked email ID found');
//       }
      
//       // Use axios instead of fetch
//       const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/sent?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//       console.log("Fetching from API endpoint:", apiEndpoint);
      
//       const response = await axios.get(apiEndpoint, {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${djombiTokens}`,
//         }
//       });
      
//       console.log("GET response data:", response.data);
      
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
//   }, [token, djombi.token, emails, addEmail]);
  
//   useEffect(() => {
//     fetchSentEmails();
//   }, [fetchSentEmails]);
  
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
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default EmailSent;

































































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

































































