import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, RefreshCw, X, Mail, Clock, User, Search, AlertTriangle } from "lucide-react";
import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { Email } from "@/lib/types/email";
import { Checkbox } from "@/components/ui/checkbox";
import { getSelectedLinkedEmailId, getSelectedLinkedEmailType } from "@/lib/utils/cookies";
import { createEmailPreview, EmailContentRenderer } from "@/lib/utils/emails/email-content-utils";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { AuthContext } from "@/lib/context/auth";
import { useCombinedAuth } from "@/components/providers/useCombinedAuth";
import { useEmailStore } from "@/store/email-store";
import Image from "next/image";

interface EmailSpamProps {
  onBack?: () => void;
}

export const EmailSpam = ({ onBack }: EmailSpamProps) => {
  // Use email store following EmailSent pattern
  const {
    emails,
    isLoading,
    loadingError,
    fetchEmails,
    setActiveCategory,
    activeCategory,
    refreshCurrentCategory,
    moveEmailToCategory
  } = useEmailStore();

  const { token, user } = useContext(AuthContext);
  const { djombi } = useCombinedAuth();
  const djombiTokens = djombi.token || "";

  // Local UI state only - following EmailSent pattern
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [sortNewest, setSortNewest] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Track component state without causing re-renders - following EmailSent pattern
  const isInitialized = useRef(false);
  const currentEmailId = useRef<string | null>(null);
  const hasLoadedSpamEmails = useRef(false);

  // Enhanced refresh function that resets cache - following EmailSent pattern
  const handleRefresh = useCallback(() => {
    console.log('Manual refresh triggered for spam emails');
    hasLoadedSpamEmails.current = false; // Reset to allow fresh fetch
    fetchEmails('spam', true);
  }, [fetchEmails]);

  // Single initialization effect - following EmailSent pattern
  useEffect(() => {
    if (!isInitialized.current) {
      console.log('EmailSpam component initializing');
      setMounted(true);
      setActiveCategory('spam');
      isInitialized.current = true;

      // Get initial email ID
      const emailId = getSelectedLinkedEmailId();
      currentEmailId.current = emailId;
      console.log('Initial email ID for spam:', emailId);
    }
  }, []); // Empty deps - only run once

  // Listen for changes in emails array to refresh display - following EmailSent pattern
  useEffect(() => {
    const spamEmails = emails.filter(email =>
      email.status === "spam" || email.category === "spam"
    );

    // If we have spam emails but haven't loaded them before, mark as loaded
    if (spamEmails.length > 0 && !hasLoadedSpamEmails.current) {
      console.log('Found spam emails in store, marking as loaded');
      hasLoadedSpamEmails.current = true;
    }
  }, [emails]); // React to changes in emails array

  // Separate effect for fetching emails with better conditions - following EmailSent pattern
  useEffect(() => {
    const emailId = getSelectedLinkedEmailId();
    const emailType = getSelectedLinkedEmailType();

    // Check if email account changed
    const emailChanged = currentEmailId.current !== emailId;
    if (emailChanged) {
      console.log('Email account changed, resetting spam emails cache');
      currentEmailId.current = emailId;
      hasLoadedSpamEmails.current = false; // Reset cache on email change
    }

    // Only fetch if all conditions are met and we haven't loaded yet
    const shouldFetch = (
      isInitialized.current &&
      activeCategory === 'spam' &&
      emailId &&
      djombiTokens &&
      !isLoading &&
      !hasLoadedSpamEmails.current // Only fetch once per email account
    );

    if (shouldFetch) {
      console.log('Fetching spam emails:', {
        emailId: emailId?.substring(0, 20) + '...',
        emailType,
        activeCategory,
        hasLoadedBefore: hasLoadedSpamEmails.current
      });

      hasLoadedSpamEmails.current = true; // Mark as loaded
      fetchEmails('spam', false); // Don't force refresh on initial load
    } else {
      console.log('Skipping spam emails fetch:', {
        isInitialized: isInitialized.current,
        activeCategory,
        hasEmailId: !!emailId,
        hasToken: !!djombiTokens,
        isLoading,
        hasLoaded: hasLoadedSpamEmails.current
      });
    }
  }, [activeCategory, djombiTokens, isLoading, fetchEmails]);

  // Memoize spam emails filtering - following EmailSent pattern
  const spamEmails = useCallback(() => {
    return emails.filter(email =>
      email.status === "spam" || email.category === "spam"
    );
  }, [emails]);

  // Memoize search filtering - following EmailSent pattern
  const filteredEmails = useCallback(() => {
    const spam = spamEmails();
    if (!searchTerm) return spam;

    const searchLower = searchTerm.toLowerCase();
    return spam.filter(email =>
      email.subject?.toLowerCase().includes(searchLower) ||
      email.from?.toLowerCase().includes(searchLower) ||
      email.content?.toLowerCase().includes(searchLower)
    );
  }, [spamEmails, searchTerm]);

  // Memoize sorting - following EmailSent pattern
  const sortedEmails = useCallback(() => {
    return [...filteredEmails()].sort((a, b) => {
      const dateA = new Date(a.timestamp || 0).getTime();
      const dateB = new Date(b.timestamp || 0).getTime();
      return sortNewest ? dateB - dateA : dateA - dateB;
    });
  }, [filteredEmails, sortNewest]);

  // Memoize date filtering - following EmailSent pattern
  const displayedEmails = useCallback(() => {
    if (!filterDate) return sortedEmails();

    return sortedEmails().filter(email => {
      const emailDate = new Date(email.timestamp || 0).toLocaleDateString();
      return emailDate === filterDate;
    });
  }, [sortedEmails, filterDate]);

  // Get current values for rendering
  const currentSpamEmails = spamEmails();
  const currentDisplayedEmails = displayedEmails();

  // Stable event handlers - following EmailSent pattern
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

  // Handle moving email from spam to inbox using EmailApiService pattern
  const handleMoveToInbox = useCallback(async (emailId: string) => {
    try {
      console.log(`Moving email ${emailId} from spam to inbox...`);

      // Use the store's moveEmailToCategory method which uses EmailApiService internally
      moveEmailToCategory(emailId, 'inbox');

      console.log(`Email ${emailId} moved to inbox successfully`);

    } catch (error) {
      console.error('Error moving email to inbox:', error);
      throw error; // Re-throw to handle in UI
    }
  }, [moveEmailToCategory]);

  // Handle moving email from spam to inbox with feedback
  const handleMoveToInboxWithFeedback = useCallback(async (emailId: string) => {
    try {
      await handleMoveToInbox(emailId);
      // Success feedback could be added here (toast notification, etc.)
    } catch (error) {
      console.error('Failed to move email to inbox:', error);
      // Error feedback could be added here (toast notification, etc.)
    }
  }, [handleMoveToInbox]);

  // Better state detection - following EmailSent pattern
  const shouldShowLoading = isLoading && currentDisplayedEmails.length === 0;
  const shouldShowError = !isLoading && loadingError && currentDisplayedEmails.length === 0;
  const shouldShowEmpty = !isLoading && !loadingError && currentDisplayedEmails.length === 0;
  const shouldShowEmails = currentDisplayedEmails.length > 0;

  const currentSelectedEmailId = getSelectedLinkedEmailId();
  const currentSelectedEmailType = getSelectedLinkedEmailType();

  return (
    <div className="w-full h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-red-50">
      {/* Header Section - following EmailSent pattern */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-slate-100">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Spam Emails</h1>
                <p className="text-sm text-slate-600">
                  {currentDisplayedEmails.length} spam email{currentDisplayedEmails.length !== 1 ? 's' : ''} found
                  {currentSelectedEmailType && (
                    <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
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
                placeholder="Search spam emails..."
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

      {/* Main Content Area - following EmailSent pattern */}
      <div className="h-[calc(100vh-100px)] overflow-hidden">
        <div className="h-full bg-white mx-6 my-4 rounded-xl shadow-lg border border-slate-200 overflow-hidden">

          {/* Content Area */}
          <div className="h-full overflow-y-auto">
            {shouldShowLoading ? (
              <div className="flex flex-col justify-center items-center h-full bg-gradient-to-br from-red-50 to-orange-50">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                  <AlertTriangle className="w-8 h-8 text-red-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-slate-600 mt-4 font-medium">Loading spam emails...</p>
                <p className="text-slate-500 text-sm">Fetching emails from {currentSelectedEmailType || 'selected'} account</p>
              </div>
            ) : shouldShowError ? (
              <div className="flex flex-col justify-center items-center h-full bg-gradient-to-br from-red-50 to-orange-50">
                <div className="p-4 bg-red-100 rounded-full mb-4">
                  <X className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Failed to Load Spam Emails</h3>
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
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No Spam Emails Found</h3>
                <p className="text-slate-600 text-center max-w-md">
                  {searchTerm
                    ? `No emails match your search "${searchTerm}"`
                    : currentSelectedEmailType
                      ? `No spam emails found in your ${currentSelectedEmailType} account`
                      : "No spam emails found or no account is selected"
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
                    className={`flex items-center px-6 py-4 hover:bg-red-50 transition-all duration-200 cursor-pointer group border-l-4 border-transparent hover:border-l-red-400 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'
                      }`}
                    onClick={() => handleRowClick(email)}
                  >
                    <div className="mr-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedEmails.includes(email.id || "")}
                        onCheckedChange={() => { }}
                        onClick={(e) => toggleSelect(email.id || "", e as React.MouseEvent)}
                        className="border-slate-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                      />
                    </div>

                    <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                      {/* Sender */}
                      <div className="col-span-3 flex items-center gap-2">
                        <div className="p-1.5 bg-red-100 rounded-full group-hover:bg-red-200 transition-colors">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        </div>
                        <div className="text-sm font-medium text-slate-700 truncate">
                          {email.from}
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
                                {new Date(email.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

      {/* Email Details Dialog - enhanced for spam */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-slate-200 pb-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  {selectedEmail?.subject || "Spam Email Details"}
                </DialogTitle>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    From: {selectedEmail?.from}
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
              {/* Warning Banner */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Spam Email Warning</span>
                </div>
                <p className="text-red-700 text-sm mt-1">
                  This email has been identified as spam. Be cautious of links and attachments.
                </p>
              </div>

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

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedEmail?.id) {
                      handleMoveToInboxWithFeedback(selectedEmail.id);
                      setShowDialog(false);
                    }
                  }}
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Not Spam - Move to Inbox
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDialog(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Delete Permanently
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Debug Info (Development Only) */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black text-white p-3 rounded-lg text-xs max-w-xs z-50">
          <div className="space-y-1">
            <div>Initialized: {isInitialized.current ? 'Yes' : 'No'}</div>
            <div>Active Category: {activeCategory}</div>
            <div>Selected Email ID: {currentSelectedEmailId?.substring(0, 20) || 'None'}</div>
            <div>Email Type: {currentSelectedEmailType || 'None'}</div>
            <div>Store Emails: {emails.length}</div>
            <div>Spam Emails: {currentSpamEmails.length}</div>
            <div>Displayed: {currentDisplayedEmails.length}</div>
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>Has Loaded: {hasLoadedSpamEmails.current ? 'Yes' : 'No'}</div>
            <div>Error: {loadingError || 'None'}</div>
          </div>
        </div>
      )} */}
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