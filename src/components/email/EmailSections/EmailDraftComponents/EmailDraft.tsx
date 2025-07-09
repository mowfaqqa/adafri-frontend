"use client";

import { useEmailStore } from "@/store/email-store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, RefreshCw, Mail, Clock, Edit, Search, Trash2 } from "lucide-react";
import { useState, useEffect, useContext } from "react";
import { Email } from "@/lib/types/email";
import { AuthContext } from "@/lib/context/auth";
import { ComposeModal } from "../AddEmailComponents/ComposeModal";
import { DraftEmailList } from "./DraftEmailList";
import { getSelectedLinkedEmailId, getSelectedLinkedEmailType } from "@/lib/utils/cookies";
import { useCombinedAuth } from "@/components/providers/useCombinedAuth";
import { emailApiService } from "@/lib/services/emailApiService";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useEmailAccountListener } from "@/lib/hooks/email/useEmailAccountListener";
import Image from "next/image";


interface EmailDraftProps {
  onBack?: () => void;
}

export const EmailDraft = ({ onBack }: EmailDraftProps) => {
  // Use email store instead of local state management
  const { 
    emails, 
    isLoading, 
    loadingError, 
    fetchEmails,
    setActiveCategory,
    updateDraft 
  } = useEmailStore();
  
  // Move all hooks to the top level
  const { token } = useContext(AuthContext);
  const { djombi } = useCombinedAuth();
  const djombiTokens = djombi.token || "";
  
  // Get current selected email info from cookies
  const currentSelectedEmailId = getSelectedLinkedEmailId();
  const currentSelectedEmailType = getSelectedLinkedEmailType();
  
  // Local UI state only
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [sortNewest, setSortNewest] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // ComposeModal state
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<Email | null>(null);

  // Listen for email account changes
  useEmailAccountListener({
    onEmailAccountChange: (detail) => {
      console.log('EmailDraft component received email account change:', detail);
      // The email store will automatically refresh draft emails
    },
    onRefreshNeeded: () => {
      console.log('Email account changed, draft emails will refresh automatically');
    }
  });

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Set active category to 'draft' and fetch draft emails when component mounts
  useEffect(() => {
    console.log('EmailDraft component mounted, setting active category to draft');
    setActiveCategory('draft');
  }, [setActiveCategory]);

  // Separate effect for fetching emails to avoid dependency loops
  useEffect(() => {
    // Only fetch if we have both the required auth and the component is mounted
    if (currentSelectedEmailId && djombiTokens && mounted) {
      console.log('Fetching draft emails for selected account:', currentSelectedEmailId);
      fetchEmails('draft', true);
    }
  }, [currentSelectedEmailId, djombiTokens, mounted, fetchEmails]);

  // Manual refresh function
  const handleRefresh = () => {
    console.log('Manual refresh triggered for draft emails');
    fetchEmails('draft', true);
  };

  // Toggle sort function
  const toggleSort = () => {
    setSortNewest(!sortNewest);
  };

  // Get draft emails from store
  const draftEmails = emails.filter(email => 
    email.status === "draft" || email.category === "draft"
  );

  // Apply search filter
  const filteredEmails = searchTerm 
    ? draftEmails.filter(email =>
        email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : draftEmails;

  // Sort by date
  const sortedEmails = [...filteredEmails].sort((a, b) => {
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

  // Toggle select email
  const toggleSelectEmail = (id: string) => {
    setSelectedEmails(prev =>
      prev.includes(id)
        ? prev.filter(emailId => emailId !== id)
        : [...prev, id]
    );
  };

  // Select all emails
  const selectAllEmails = () => {
    if (selectedEmails.length === displayedEmails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(displayedEmails.map(email => email.id || ''));
    }
  };

  // Delete drafts using EmailApiService
  const deleteDrafts = async () => {
    if (selectedEmails.length === 0) {
      toast.warning("Please select drafts to delete");
      return;
    }

    try {
      console.log(`Deleting ${selectedEmails.length} draft(s) using EmailApiService`);
      
      // Delete each selected draft using EmailApiService
      const deletePromises = selectedEmails.map(async (id) => {
        try {
          await emailApiService.deleteDraft(id);
          return { id, success: true };
        } catch (error) {
          console.error(`Failed to delete draft ${id}:`, error);
          return { id, success: false, error };
        }
      });

      const results = await Promise.all(deletePromises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (successful.length > 0) {
        toast.success(`Successfully deleted ${successful.length} draft(s)`);
        
        // Refresh drafts to update the list
        setTimeout(() => {
          fetchEmails('draft', true);
        }, 500);
      }

      if (failed.length > 0) {
        toast.error(`Failed to delete ${failed.length} draft(s)`);
      }

      // Clear selection
      setSelectedEmails([]);

    } catch (err) {
      console.error('Error deleting drafts:', err);
      toast.error('Failed to delete drafts. Please try again.');
    }
  };

  // Update draft using EmailApiService
  const updateDraftInApi = async (draftId: string, updatedData: any) => {
    try {
      console.log(`Updating draft ${draftId} using EmailApiService`);
      
      if (!currentSelectedEmailId) {
        throw new Error('No selected email account found');
      }

      const response = await emailApiService.updateDraft({
        id: draftId,
        to: updatedData.to || "",
        subject: updatedData.subject || "",
        content: updatedData.content || "",
        email_id: currentSelectedEmailId
      });

      console.log('Draft updated successfully:', response);
      toast.success('Draft updated successfully');

      // Refresh drafts to show updated data
      setTimeout(() => {
        fetchEmails('draft', true);
      }, 500);

      return response;
    } catch (err) {
      console.error('Error updating draft:', err);
      toast.error('Failed to update draft');
      throw err;
    }
  };

  // Handler to open ComposeModal with selected draft data
  const handleEditDraft = (email: Email) => {
    console.log('Opening compose modal for draft:', email.id);
    
    // Set the selected draft in the store for editing
    if (updateDraft) {
      updateDraft({
        id: email.id,
        to: email.to || "",
        subject: email.subject || "",
        content: email.content || "",
        status: "draft"
      });
    }

    // Set the selected draft for the modal
    setSelectedDraft(email);

    // Open the compose modal
    setIsComposeModalOpen(true);
  };

  // Handler for when the ComposeModal is closed
  const handleComposeModalClose = () => {
    setIsComposeModalOpen(false);
    setSelectedDraft(null);
    
    // Refresh drafts after closing modal
    setTimeout(() => {
      fetchEmails('draft', true);
    }, 500);
  };

  // Handler for saving draft changes
  const handleSaveDraft = async (draftData: Email) => {
    try {
      if (draftData.id) {
        await updateDraftInApi(draftData.id, {
          to: draftData.to,
          subject: draftData.subject,
          content: draftData.content
        });
      }
    } catch (err) {
      console.error('Error saving draft:', err);
    }
  };

  // Handler for single email deletion
  const handleSingleEmailDelete = (email: Email) => {
    setSelectedEmails([email.id || '']);
    setTimeout(() => {
      deleteDrafts();
    }, 100);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-orange-50">
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
              <div className="p-2 bg-orange-100 rounded-lg">
                <Edit className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Draft Emails</h1>
                <p className="text-sm text-slate-600">
                  {displayedEmails.length} draft{displayedEmails.length !== 1 ? 's' : ''} saved
                  {currentSelectedEmailType && (
                    <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
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
                placeholder="Search drafts..."
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
                  <ArrowLeft className="w-3 h-3" />
                </Button>
              )}
            </div>
            
            {/* Selected Actions */}
            {selectedEmails.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={deleteDrafts}
                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete ({selectedEmails.length})
              </Button>
            )}
            
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
            {isLoading ? (
              <div className="flex flex-col justify-center items-center h-full bg-gradient-to-br from-orange-50 to-yellow-50">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                  <Edit className="w-8 h-8 text-orange-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-slate-600 mt-4 font-medium">Loading draft emails...</p>
                <p className="text-slate-500 text-sm">Fetching drafts from {currentSelectedEmailType || 'selected'} account</p>
              </div>
            ) : loadingError ? (
              <div className="flex flex-col justify-center items-center h-full bg-gradient-to-br from-red-50 to-orange-50">
                <div className="p-4 bg-red-100 rounded-full mb-4">
                  <ArrowLeft className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Failed to Load Draft Emails</h3>
                <p className="text-red-600 text-center mb-4 max-w-md">{loadingError}</p>
                <Button 
                  onClick={handleRefresh}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : displayedEmails.length === 0 ? (
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
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No Draft Emails Found</h3>
                <p className="text-slate-600 text-center max-w-md">
                  {searchTerm 
                    ? `No drafts match your search "${searchTerm}"` 
                    : currentSelectedEmailType 
                      ? `No draft emails found in your ${currentSelectedEmailType} account`
                      : "You haven't saved any draft emails yet"
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
              </div>
            ) : (
              <DraftEmailList
                emails={displayedEmails}
                selectedEmails={selectedEmails}
                isLoading={isLoading}
                error={loadingError}
                onSelectEmail={toggleSelectEmail}
                onSelectAll={selectAllEmails}
                onEditDraft={handleEditDraft}
                onDeleteDrafts={deleteDrafts}
                onRefresh={handleRefresh}
                // onSingleDelete={handleSingleEmailDelete}
              />
            )}
          </div>
        </div>
      </div>

      {/* Compose Modal */}
      <ComposeModal
        isOpen={isComposeModalOpen}
        onClose={handleComposeModalClose}
        editMode={true}
        draftEmail={selectedDraft}
        onSaveDraft={handleSaveDraft}
      />

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black text-white p-3 rounded-lg text-xs max-w-xs z-50">
          <div className="space-y-1">
            <div>Selected Email ID: {currentSelectedEmailId || 'None'}</div>
            <div>Email Type: {currentSelectedEmailType || 'None'}</div>
            <div>Draft Emails: {draftEmails.length}</div>
            <div>Displayed: {displayedEmails.length}</div>
            <div>Selected: {selectedEmails.length}</div>
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailDraft;













































// 7:46
// "use client";

// import { useEmailStore } from "@/lib/store/email-store";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Filter, RefreshCw } from "lucide-react";
// import { useState, useEffect, useContext, useCallback } from "react";
// import { Email } from "@/lib/types/email";
// import axios from "axios";
// import { AuthContext } from "@/lib/context/auth";
// import { ComposeModal } from "../AddEmailComponents/ComposeModal";
// import { DraftEmailList } from "./DraftEmailList";
// import { getLinkedEmailId, getDjombiAccessToken, processResponseData } from "@/lib/utils/emails/draftEmailUtils";
// import { useCombinedAuth } from "@/components/providers/useCombinedAuth";


// interface EmailDraftProps {
//   onBack?: () => void;
// }

// export const EmailDraft = ({ onBack }: EmailDraftProps) => {
//   const { updateDraft } = useEmailStore();
  
//   // Move all hooks to the top level
//   const { token } = useContext(AuthContext);
//   const { djombi } = useCombinedAuth();
//   const [apiDraftEmails, setApiDraftEmails] = useState<Email[]>([]);
//   const [filterDate, setFilterDate] = useState<string | null>(null);
//   const [sortNewest, setSortNewest] = useState(true);
//   const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   // Add state for controlling the ComposeModal
//   const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
//   const [selectedDraft, setSelectedDraft] = useState<Email | null>(null);

//   // Add missing toggleSort function
//   const toggleSort = () => {
//     setSortNewest(!sortNewest);
//   };

//   // Memoize processResponseData to prevent unnecessary re-renders
//   const memoizedProcessResponseData = useCallback((data: any) => {
//     return processResponseData(data);
//   }, []);

//   // Use useCallback to memoize the function and include only necessary dependencies
//   const fetchDraftEmails = useCallback(async () => {
//     setIsLoading(true);
//     setError(null);

//     try {
//       console.log("Starting fetchDraftEmails...");

//       // Get Djombi token using the utility function
//       const djombiToken = getDjombiAccessToken();
//       console.log("Djombi token retrieved:", djombiToken ? `${djombiToken.substring(0, 10)}...` : 'No Djombi token found');

//       if (!djombiToken) {
//         throw new Error('No Djombi access token available. Please log in again.');
//       }

//       // Get linked email ID using the utility function
//       const linkedEmailId = getLinkedEmailId();
//       console.log("Linked Email ID:", linkedEmailId);

//       if (!linkedEmailId) {
//         console.log("Checking localStorage for linkedEmailId...");
//         if (typeof window !== 'undefined') {
//           const storageKeys = Object.keys(localStorage);
//           console.log("Available localStorage keys:", storageKeys);
//           console.log("linkedEmailId value:", localStorage.getItem('linkedEmailId'));
//         }
//         throw new Error('No linked email ID found. Please link your email first.');
//       }

//       // Use axios instead of fetch for GET request
//       const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//       console.log("Fetching from API endpoint:", apiEndpoint);

//       try {
//         const response = await axios.get(apiEndpoint, {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${djombiToken}` // Use Djombi token
//           }
//         });

//         console.log("GET response data:", response.data);
//         const formattedEmails = memoizedProcessResponseData(response.data);
//         setApiDraftEmails(formattedEmails);
//       } catch (getError) {
//         console.log("GET request failed:", getError);

//         // Alternative: Use POST if the API requires sending data in the body
//         const postEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts';
//         console.log("Trying POST request to:", postEndpoint);

//         try {
//           const postResponse = await axios.post(postEndpoint,
//             { email_id: linkedEmailId, content: "" }, // Adding empty content as POST requires it
//             {
//               headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${djombiToken}` // Use Djombi token
//               }
//             }
//           );

//           console.log("POST response data:", postResponse.data);

//           // Check for success/error in POST response
//           if (postResponse.data.success === false) {
//             const errorMessage = postResponse.data.message || 'API request failed';
//             console.error("API POST error:", errorMessage);
//             throw new Error(`API POST error: ${errorMessage}`);
//           }

//           // Process the successful POST response
//           const formattedEmails = memoizedProcessResponseData(postResponse.data);
//           setApiDraftEmails(formattedEmails);
//         } catch (postError) {
//           console.error("POST request also failed:", postError);
//           throw postError;
//         }
//       }
//     } catch (err) {
//       console.error('Error fetching draft emails:', err);
//       setError(err instanceof Error ? err.message : 'Failed to fetch draft emails');
//     } finally {
//       setIsLoading(false);
//       setIsRefreshing(false);
//     }
//   }, [memoizedProcessResponseData]); // Only include memoizedProcessResponseData as dependency

//   useEffect(() => {
//     fetchDraftEmails();
//   }, [fetchDraftEmails]); // Now fetchDraftEmails is included as dependency

//   // Handle refresh button click
//   const handleRefresh = () => {
//     setIsRefreshing(true);
//     fetchDraftEmails();
//   };

//   // Sort and filter emails
//   const sortedAndFilteredEmails = [...apiDraftEmails]
//     .filter(email => {
//       if (!filterDate) return true;
//       const emailDate = new Date(email.timestamp ?? Date.now()).toDateString();
//       return emailDate === filterDate;
//     })
//     .sort((a, b) => {
//       const dateA = new Date(a.timestamp ?? Date.now()).getTime();
//       const dateB = new Date(b.timestamp ?? Date.now()).getTime();
//       return sortNewest ? dateB - dateA : dateA - dateB;
//     });

//   const toggleSelectEmail = (id: string) => {
//     setSelectedEmails(prev =>
//       prev.includes(id)
//         ? prev.filter(emailId => emailId !== id)
//         : [...prev, id]
//     );
//   };

//   const selectAllEmails = () => {
//     if (selectedEmails.length === sortedAndFilteredEmails.length) {
//       setSelectedEmails([]);
//     } else {
//       setSelectedEmails(sortedAndFilteredEmails.map(email => email.id || ''));
//     }
//   };

//   // Use useCallback for deleteDrafts to access hooks at component level
//   const deleteDrafts = useCallback(async () => {
//     if (selectedEmails.length === 0) return;

//     try {
//       const djombiToken = getDjombiAccessToken();
      
//       if (!djombiToken) {
//         throw new Error('No Djombi access token found');
//       }

//       const linkedEmailId = getLinkedEmailId();

//       // Use axios for DELETE requests with Djombi token
//       const deletePromises = selectedEmails.map(id =>
//         axios.delete(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/${id}?email_id=${linkedEmailId}`, {
//           headers: {
//             'Authorization': `Bearer ${djombiToken}`, // Use Djombi token
//             'Content-Type': 'application/json'
//           }
//         }).catch(error => {
//           console.log(`DELETE request failed for ID ${id}:`, error);
//           return { status: error.response?.status || 500, ok: false };
//         })
//       );

//       const responses = await Promise.all(deletePromises);

//       // If any DELETE requests failed, try with POST method for deletion
//       const failedDeletes = responses.filter(response => !response.status || response.status >= 400);

//       if (failedDeletes.length > 0) {
//         console.log(`${failedDeletes.length} DELETE requests failed. Trying alternative approach...`);

//         // Try POST method for deletion if supported by your API
//         const alternativePromises = selectedEmails.map(id =>
//           axios.post(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/delete`,
//             { draft_id: id },  // Only send draft_id without email_id
//             {
//               headers: {
//                 'Authorization': `Bearer ${djombiToken}`, // Use Djombi token
//                 'Content-Type': 'application/json'
//               }
//             }
//           ).catch(error => {
//             console.log(`POST delete request failed for ID ${id}:`, error);
//             return { status: error.response?.status || 500, ok: false };
//           })
//         );

//         const alternativeResponses = await Promise.all(alternativePromises);
//         const stillFailedDeletes = alternativeResponses.filter(response => !response.status || response.status >= 400);

//         if (stillFailedDeletes.length > 0) {
//           throw new Error(`Failed to delete ${stillFailedDeletes.length} drafts using alternative method`);
//         }
//       }

//       // Remove deleted emails from state
//       setApiDraftEmails(prev =>
//         prev.filter(email => !selectedEmails.includes(email.id || ''))
//       );

//       // Clear selection
//       setSelectedEmails([]);

//     } catch (err) {
//       console.error('Error deleting drafts:', err);
//       setError(err instanceof Error ? err.message : 'Failed to delete drafts');
//     }
//   }, [selectedEmails]);

//   // Update draft using axios instead of fetch
//   const updateDraftInApi = useCallback(async (draftId: string, updatedData: any) => {
//     try {
//       const djombiToken = getDjombiAccessToken();
//       const linkedEmailId = getLinkedEmailId();
      
//       if (!djombiToken) {
//         throw new Error('No Djombi access token found');
//       }

//       // Use PUT request with axios to update the existing draft
//       const response = await axios.put(
//         `https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/${draftId}?email_id=${linkedEmailId}`,
//         updatedData,
//         {
//           headers: {
//             'Authorization': `Bearer ${djombiToken}`, // Use Djombi token
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       // Update the local state with the updated draft
//       const updatedEmail = response.data;
//       console.log('Draft updated successfully:', updatedEmail);

//       setApiDraftEmails(prev =>
//         prev.map(email =>
//           email.id === draftId ? { ...email, ...updatedData } : email
//         )
//       );

//       return updatedEmail;
//     } catch (err) {
//       console.error('Error updating draft:', err);
//       throw err;
//     }
//   }, []);

//   // Handler to open ComposeModal with selected draft data
//   const handleEditDraft = (email: Email) => {
//     // Set the selected draft in the store for editing
//     if (updateDraft) {
//       updateDraft({
//         id: email.id,
//         to: email.to || "",
//         subject: email.subject || "",
//         content: email.content || "",
//         status: "draft"
//       });
//     }

//     // Set the selected draft for the modal
//     setSelectedDraft(email);

//     // Open the compose modal
//     setIsComposeModalOpen(true);
//   };

//   // Handler for when the ComposeModal is closed
//   const handleComposeModalClose = (savedDraft?: Email) => {
//     setIsComposeModalOpen(false);

//     // If a draft was saved and it's an edit (has an ID), update the local state
//     if (savedDraft && selectedDraft && savedDraft.id === selectedDraft.id) {
//       setApiDraftEmails(prev =>
//         prev.map(email =>
//           email.id === savedDraft.id ? savedDraft : email
//         )
//       );
//     }

//     setSelectedDraft(null);
//   };

//   // Handler for saving draft changes
//   const handleSaveDraft = async (draftData: Email) => {
//     try {
//       if (draftData.id) {
//         // Update existing draft
//         await updateDraftInApi(draftData.id, {
//           to: draftData.to,
//           subject: draftData.subject,
//           content: draftData.content
//         });

//         // Update local state
//         setApiDraftEmails(prev =>
//           prev.map(email =>
//             email.id === draftData.id ? draftData : email
//           )
//         );
//       }
//     } catch (err) {
//       console.error('Error saving draft:', err);
//       setError(err instanceof Error ? err.message : 'Failed to save draft');
//     }
//   };

//   // Handler for single email deletion
//   const handleSingleEmailDelete = (email: Email) => {
//     setSelectedEmails([email.id || '']);
//     deleteDrafts();
//   };

//   return (
//     <div className="w-full h-full overflow-y-auto pb-4">
//       {/* Header */}
//       <div className="border rounded-lg bg-white overflow-hidden h-[calc(100vh-120px)]">
//         <div className="sticky top-0 bg-background z-10 p-4 border-b">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center space-x-4">
//               {onBack && (
//                 <Button variant="ghost" size="icon" onClick={onBack}>
//                   <ArrowLeft className="h-5 w-5" />
//                 </Button>
//               )}
//               <h1 className="text-xl font-semibold">Drafts</h1>
//             </div>
//             <div className="flex items-center space-x-2">
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
//                 <Filter className="h-4 w-4" />
//               </Button>
//             </div>
//           </div>
//         </div>

//         {/* Email List */}
//         <div className="overflow-y-auto h-[calc(100%-60px)]">
//           <DraftEmailList
//             emails={sortedAndFilteredEmails}
//             selectedEmails={selectedEmails}
//             isLoading={isLoading}
//             error={error}
//             onSelectEmail={toggleSelectEmail}
//             onSelectAll={selectAllEmails}
//             onEditDraft={handleEditDraft}
//             onDeleteDrafts={deleteDrafts}
//             onRefresh={handleRefresh}
//           />
//         </div>
//       </div>

//       {/* Compose Modal */}
//       <ComposeModal
//         isOpen={isComposeModalOpen}
//         onClose={handleComposeModalClose}
//         editMode={true}
//         draftEmail={selectedDraft}
//         onSaveDraft={handleSaveDraft}
//       />
//     </div>
//   );
// };

// export default EmailDraft;



































































// 29/6/2025 3:00
// "use client";

// import { useEmailStore } from "@/lib/store/email-store";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Filter, RefreshCw } from "lucide-react";
// import { useState, useEffect, useContext, useCallback } from "react";
// import { Email } from "@/lib/types/email";
// import axios from "axios";
// import { AuthContext } from "@/lib/context/auth";
// import { ComposeModal } from "../AddEmailComponents/ComposeModal";
// import { DraftEmailList } from "./DraftEmailList";
// import { getLinkedEmailId, getDjombiAccessToken, processResponseData } from "@/lib/utils/emails/draftEmailUtils";
// import { useCombinedAuth } from "@/components/providers/useCombinedAuth";


// interface EmailDraftProps {
//   onBack?: () => void;
// }

// export const EmailDraft = ({ onBack }: EmailDraftProps) => {
//   const { updateDraft } = useEmailStore();
  
//   // Move all hooks to the top level
//   const { token } = useContext(AuthContext);
//   const { djombi } = useCombinedAuth();
//   const [apiDraftEmails, setApiDraftEmails] = useState<Email[]>([]);
//   const [filterDate, setFilterDate] = useState<string | null>(null);
//   const [sortNewest, setSortNewest] = useState(true);
//   const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   // Add state for controlling the ComposeModal
//   const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
//   const [selectedDraft, setSelectedDraft] = useState<Email | null>(null);

//   // Add missing toggleSort function
//   const toggleSort = () => {
//     setSortNewest(!sortNewest);
//   };

//   // Use useCallback to memoize the function and include dependencies
//   const fetchDraftEmails = useCallback(async () => {
//     setIsLoading(true);
//     setError(null);

//     try {
//       console.log("Starting fetchDraftEmails...");

//       // Get Djombi token using the utility function
//       const djombiToken = getDjombiAccessToken();
//       console.log("Djombi token retrieved:", djombiToken ? `${djombiToken.substring(0, 10)}...` : 'No Djombi token found');

//       if (!djombiToken) {
//         throw new Error('No Djombi access token available. Please log in again.');
//       }

//       // Get linked email ID using the utility function
//       const linkedEmailId = getLinkedEmailId();
//       console.log("Linked Email ID:", linkedEmailId);

//       if (!linkedEmailId) {
//         console.log("Checking localStorage for linkedEmailId...");
//         if (typeof window !== 'undefined') {
//           const storageKeys = Object.keys(localStorage);
//           console.log("Available localStorage keys:", storageKeys);
//           console.log("linkedEmailId value:", localStorage.getItem('linkedEmailId'));
//         }
//         throw new Error('No linked email ID found. Please link your email first.');
//       }

//       // Use axios instead of fetch for GET request
//       const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//       console.log("Fetching from API endpoint:", apiEndpoint);

//       try {
//         const response = await axios.get(apiEndpoint, {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${djombiToken}` // Use Djombi token
//           }
//         });

//         console.log("GET response data:", response.data);
//         const formattedEmails = processResponseData(response.data);
//         setApiDraftEmails(formattedEmails);
//       } catch (getError) {
//         console.log("GET request failed:", getError);

//         // Alternative: Use POST if the API requires sending data in the body
//         const postEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts';
//         console.log("Trying POST request to:", postEndpoint);

//         try {
//           const postResponse = await axios.post(postEndpoint,
//             { email_id: linkedEmailId, content: "" }, // Adding empty content as POST requires it
//             {
//               headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${djombiToken}` // Use Djombi token
//               }
//             }
//           );

//           console.log("POST response data:", postResponse.data);

//           // Check for success/error in POST response
//           if (postResponse.data.success === false) {
//             const errorMessage = postResponse.data.message || 'API request failed';
//             console.error("API POST error:", errorMessage);
//             throw new Error(`API POST error: ${errorMessage}`);
//           }

//           // Process the successful POST response
//           const formattedEmails = processResponseData(postResponse.data);
//           setApiDraftEmails(formattedEmails);
//         } catch (postError) {
//           console.error("POST request also failed:", postError);
//           throw postError;
//         }
//       }
//     } catch (err) {
//       console.error('Error fetching draft emails:', err);
//       setError(err instanceof Error ? err.message : 'Failed to fetch draft emails');
//     } finally {
//       setIsLoading(false);
//       setIsRefreshing(false);
//     }
//   }, [token, djombi.token]); // Add dependencies

//   useEffect(() => {
//     fetchDraftEmails();
//   }, [fetchDraftEmails]); // Now fetchDraftEmails is included as dependency

//   // Handle refresh button click
//   const handleRefresh = () => {
//     setIsRefreshing(true);
//     fetchDraftEmails();
//   };

//   // Sort and filter emails
//   const sortedAndFilteredEmails = [...apiDraftEmails]
//     .filter(email => {
//       if (!filterDate) return true;
//       const emailDate = new Date(email.timestamp ?? Date.now()).toDateString();
//       return emailDate === filterDate;
//     })
//     .sort((a, b) => {
//       const dateA = new Date(a.timestamp ?? Date.now()).getTime();
//       const dateB = new Date(b.timestamp ?? Date.now()).getTime();
//       return sortNewest ? dateB - dateA : dateA - dateB;
//     });

//   const toggleSelectEmail = (id: string) => {
//     setSelectedEmails(prev =>
//       prev.includes(id)
//         ? prev.filter(emailId => emailId !== id)
//         : [...prev, id]
//     );
//   };

//   const selectAllEmails = () => {
//     if (selectedEmails.length === sortedAndFilteredEmails.length) {
//       setSelectedEmails([]);
//     } else {
//       setSelectedEmails(sortedAndFilteredEmails.map(email => email.id || ''));
//     }
//   };

//   // Use useCallback for deleteDrafts to access hooks at component level
//   const deleteDrafts = useCallback(async () => {
//     if (selectedEmails.length === 0) return;

//     try {
//       const djombiToken = getDjombiAccessToken();
      
//       if (!djombiToken) {
//         throw new Error('No Djombi access token found');
//       }

//       const linkedEmailId = getLinkedEmailId();

//       // Use axios for DELETE requests with Djombi token
//       const deletePromises = selectedEmails.map(id =>
//         axios.delete(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/${id}?email_id=${linkedEmailId}`, {
//           headers: {
//             'Authorization': `Bearer ${djombiToken}`, // Use Djombi token
//             'Content-Type': 'application/json'
//           }
//         }).catch(error => {
//           console.log(`DELETE request failed for ID ${id}:`, error);
//           return { status: error.response?.status || 500, ok: false };
//         })
//       );

//       const responses = await Promise.all(deletePromises);

//       // If any DELETE requests failed, try with POST method for deletion
//       const failedDeletes = responses.filter(response => !response.status || response.status >= 400);

//       if (failedDeletes.length > 0) {
//         console.log(`${failedDeletes.length} DELETE requests failed. Trying alternative approach...`);

//         // Try POST method for deletion if supported by your API
//         const alternativePromises = selectedEmails.map(id =>
//           axios.post(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/delete`,
//             { draft_id: id },  // Only send draft_id without email_id
//             {
//               headers: {
//                 'Authorization': `Bearer ${djombiToken}`, // Use Djombi token
//                 'Content-Type': 'application/json'
//               }
//             }
//           ).catch(error => {
//             console.log(`POST delete request failed for ID ${id}:`, error);
//             return { status: error.response?.status || 500, ok: false };
//           })
//         );

//         const alternativeResponses = await Promise.all(alternativePromises);
//         const stillFailedDeletes = alternativeResponses.filter(response => !response.status || response.status >= 400);

//         if (stillFailedDeletes.length > 0) {
//           throw new Error(`Failed to delete ${stillFailedDeletes.length} drafts using alternative method`);
//         }
//       }

//       // Remove deleted emails from state
//       setApiDraftEmails(prev =>
//         prev.filter(email => !selectedEmails.includes(email.id || ''))
//       );

//       // Clear selection
//       setSelectedEmails([]);

//     } catch (err) {
//       console.error('Error deleting drafts:', err);
//       setError(err instanceof Error ? err.message : 'Failed to delete drafts');
//     }
//   }, [selectedEmails]);

//   // Update draft using axios instead of fetch
//   const updateDraftInApi = useCallback(async (draftId: string, updatedData: any) => {
//     try {
//       const djombiToken = getDjombiAccessToken();
//       const linkedEmailId = getLinkedEmailId();
      
//       if (!djombiToken) {
//         throw new Error('No Djombi access token found');
//       }

//       // Use PUT request with axios to update the existing draft
//       const response = await axios.put(
//         `https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/${draftId}?email_id=${linkedEmailId}`,
//         updatedData,
//         {
//           headers: {
//             'Authorization': `Bearer ${djombiToken}`, // Use Djombi token
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       // Update the local state with the updated draft
//       const updatedEmail = response.data;
//       console.log('Draft updated successfully:', updatedEmail);

//       setApiDraftEmails(prev =>
//         prev.map(email =>
//           email.id === draftId ? { ...email, ...updatedData } : email
//         )
//       );

//       return updatedEmail;
//     } catch (err) {
//       console.error('Error updating draft:', err);
//       throw err;
//     }
//   }, []);

//   // Handler to open ComposeModal with selected draft data
//   const handleEditDraft = (email: Email) => {
//     // Set the selected draft in the store for editing
//     if (updateDraft) {
//       updateDraft({
//         id: email.id,
//         to: email.to || "",
//         subject: email.subject || "",
//         content: email.content || "",
//         status: "draft"
//       });
//     }

//     // Set the selected draft for the modal
//     setSelectedDraft(email);

//     // Open the compose modal
//     setIsComposeModalOpen(true);
//   };

//   // Handler for when the ComposeModal is closed
//   const handleComposeModalClose = (savedDraft?: Email) => {
//     setIsComposeModalOpen(false);

//     // If a draft was saved and it's an edit (has an ID), update the local state
//     if (savedDraft && selectedDraft && savedDraft.id === selectedDraft.id) {
//       setApiDraftEmails(prev =>
//         prev.map(email =>
//           email.id === savedDraft.id ? savedDraft : email
//         )
//       );
//     }

//     setSelectedDraft(null);
//   };

//   // Handler for saving draft changes
//   const handleSaveDraft = async (draftData: Email) => {
//     try {
//       if (draftData.id) {
//         // Update existing draft
//         await updateDraftInApi(draftData.id, {
//           to: draftData.to,
//           subject: draftData.subject,
//           content: draftData.content
//         });

//         // Update local state
//         setApiDraftEmails(prev =>
//           prev.map(email =>
//             email.id === draftData.id ? draftData : email
//           )
//         );
//       }
//     } catch (err) {
//       console.error('Error saving draft:', err);
//       setError(err instanceof Error ? err.message : 'Failed to save draft');
//     }
//   };

//   // Handler for single email deletion
//   const handleSingleEmailDelete = (email: Email) => {
//     setSelectedEmails([email.id || '']);
//     deleteDrafts();
//   };

//   return (
//     <div className="w-full h-full overflow-y-auto pb-4">
//       {/* Header */}
//       <div className="border rounded-lg bg-white overflow-hidden h-[calc(100vh-120px)]">
//         <div className="sticky top-0 bg-background z-10 p-4 border-b">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center space-x-4">
//               {onBack && (
//                 <Button variant="ghost" size="icon" onClick={onBack}>
//                   <ArrowLeft className="h-5 w-5" />
//                 </Button>
//               )}
//               <h1 className="text-xl font-semibold">Drafts</h1>
//             </div>
//             <div className="flex items-center space-x-2">
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
//                 <Filter className="h-4 w-4" />
//               </Button>
//             </div>
//           </div>
//         </div>

//         {/* Email List */}
//         <div className="overflow-y-auto h-[calc(100%-60px)]">
//           <DraftEmailList
//             emails={sortedAndFilteredEmails}
//             selectedEmails={selectedEmails}
//             isLoading={isLoading}
//             error={error}
//             onSelectEmail={toggleSelectEmail}
//             onSelectAll={selectAllEmails}
//             onEditDraft={handleEditDraft}
//             onDeleteDrafts={deleteDrafts}
//             onRefresh={handleRefresh}
//           />
//         </div>
//       </div>

//       {/* Compose Modal */}
//       <ComposeModal
//         isOpen={isComposeModalOpen}
//         onClose={handleComposeModalClose}
//         editMode={true}
//         draftEmail={selectedDraft}
//         onSaveDraft={handleSaveDraft}
//       />
//     </div>
//   );
// };

// export default EmailDraft;
































































// import { useEmailStore } from "@/lib/store/email-store";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Filter, Trash2, Send, Archive, Edit, RefreshCw } from "lucide-react";
// import { useState, useEffect, useContext, useCallback } from "react";
// import { Email, EmailCategory } from "@/lib/types/email";
// import { Checkbox } from "@/components/ui/checkbox";
// import Link from "next/link";
// import { getCookie, getAuthToken } from "@/lib/utils/cookies"; // Import cookie functions
// import axios from "axios";
// import { AuthContext } from "@/lib/context/auth";
// import { useCombinedAuth } from "../../../providers/useCombinedAuth";
// import { ComposeModal } from "../AddEmailComponents/ComposeModal";

// interface EmailDraftProps {
//   onBack?: () => void;
// }

// // Helper function to get access token from cookies
// const getAccessToken = () => {
//   return getAuthToken();
// };

// // Helper function to get linked email ID from cookies
// const getLinkedEmailId = () => {
//   return getCookie('linkedEmailId');
// };

// export const EmailDraft = ({ onBack }: EmailDraftProps) => {
//   const { emails, updateDraft } = useEmailStore();
  
//   // Move all hooks to the top level
//   const { token, user } = useContext(AuthContext);
//   const { djombi } = useCombinedAuth();
  
//   const [apiDraftEmails, setApiDraftEmails] = useState<Email[]>([]);
//   const [filterDate, setFilterDate] = useState<string | null>(null);
//   const [sortNewest, setSortNewest] = useState(true);
//   const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   // Add state for controlling the ComposeModal
//   const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
//   const [selectedDraft, setSelectedDraft] = useState<Email | null>(null);

//   // Add missing toggleSort function
//   const toggleSort = () => {
//     setSortNewest(!sortNewest);
//   };

//   // Helper function to process response data
//   const processResponseData = (data: any) => {
//     // Check if data contains emails (handle different response structures)
//     let emailsData: any[] = [];

//     if (Array.isArray(data)) {
//       emailsData = data;
//     } else if (data.data && Array.isArray(data.data)) {
//       emailsData = data.data;
//     } else if (data.drafts && Array.isArray(data.drafts)) {
//       emailsData = data.drafts;
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

//     if (emailsData.length > 0) {
//       console.log("Sample email data structure:", emailsData[0]);
//     }

//     // Format emails and ensure they have proper structure
//     const formattedEmails = emailsData.map((email: any) => ({
//       ...email,
//       id: email.id || email._id || `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
//       content: email.content || '',
//       createdAt: email.createdAt || email.created_at || Date.now(),
//       status: "draft"
//     }));

//     setApiDraftEmails(formattedEmails);
//   };

//   // Use useCallback to memoize the function and include dependencies
//   const fetchDraftEmails = useCallback(async () => {
//     setIsLoading(true);
//     setError(null);

//     try {
//       console.log("Token retrieved:", token ? `${token.access_token.substring(0, 10)}...` : 'No token found');

//       const djombiTokens = djombi.token || "";

//       if (!token) {
//         throw new Error('No access token available');
//       }

//       // Get linked email ID from cookies
//       const linkedEmailId = getLinkedEmailId();
//       console.log("Linked Email ID:", linkedEmailId);

//       if (!linkedEmailId) {
//         throw new Error('No linked email ID found');
//       }

//       // Use axios instead of fetch for GET request
//       const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//       console.log("Fetching from API endpoint:", apiEndpoint);

//       try {
//         const response = await axios.get(apiEndpoint, {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${djombiTokens}`
//           }
//         });

//         console.log("GET response data:", response.data);
//         processResponseData(response.data);
//       } catch (getError) {
//         console.log("GET request failed:", getError);

//         // Alternative: Use POST if the API requires sending data in the body
//         const postEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts';
//         console.log("Trying POST request to:", postEndpoint);

//         try {
//           const postResponse = await axios.post(postEndpoint,
//             { email_id: linkedEmailId, content: "" }, // Adding empty content as POST requires it
//             {
//               headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${token.access_token}`
//               }
//             }
//           );

//           console.log("POST response data:", postResponse.data);

//           // Check for success/error in POST response
//           if (postResponse.data.success === false) {
//             const errorMessage = postResponse.data.message || 'API request failed';
//             console.error("API POST error:", errorMessage);
//             throw new Error(`API POST error: ${errorMessage}`);
//           }

//           // Process the successful POST response
//           processResponseData(postResponse.data);
//         } catch (postError) {
//           console.error("POST request also failed:", postError);
//           throw postError;
//         }
//       }
//     } catch (err) {
//       console.error('Error fetching draft emails:', err);
//       setError(err instanceof Error ? err.message : 'Failed to fetch draft emails');
//     } finally {
//       setIsLoading(false);
//       setIsRefreshing(false);
//     }
//   }, [token, djombi.token]); // Add dependencies

//   useEffect(() => {
//     fetchDraftEmails();
//   }, [fetchDraftEmails]); // Now fetchDraftEmails is included as dependency

//   // Handle refresh button click
//   const handleRefresh = () => {
//     setIsRefreshing(true);
//     fetchDraftEmails();
//   };

//   // Sort and filter emails
//   const sortedAndFilteredEmails = [...apiDraftEmails]
//     .filter(email => {
//       if (!filterDate) return true;
//       const emailDate = new Date(email.timestamp ?? Date.now()).toDateString();
//       return emailDate === filterDate;
//     })
//     .sort((a, b) => {
//       const dateA = new Date(a.timestamp ?? Date.now()).getTime();
//       const dateB = new Date(b.timestamp ?? Date.now()).getTime();
//       return sortNewest ? dateB - dateA : dateA - dateB;
//     });

//   const toggleSelectEmail = (id: string) => {
//     setSelectedEmails(prev =>
//       prev.includes(id)
//         ? prev.filter(emailId => emailId !== id)
//         : [...prev, id]
//     );
//   };

//   const selectAllEmails = () => {
//     if (selectedEmails.length === sortedAndFilteredEmails.length) {
//       setSelectedEmails([]);
//     } else {
//       setSelectedEmails(sortedAndFilteredEmails.map(email => email.id || ''));
//     }
//   };

//   // Use useCallback for deleteDrafts to access hooks at component level
//   const deleteDrafts = useCallback(async () => {
//     if (selectedEmails.length === 0) return;

//     try {
//       if (!token) {
//         throw new Error('No access token found');
//       }

//       // Use axios for DELETE requests
//       const deletePromises = selectedEmails.map(id =>
//         axios.delete(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/${id}`, {
//           headers: {
//             'Authorization': `Bearer ${token.access_token}`,
//             'Content-Type': 'application/json'
//           }
//         }).catch(error => {
//           console.log(`DELETE request failed for ID ${id}:`, error);
//           return { status: error.response?.status || 500, ok: false };
//         })
//       );

//       const responses = await Promise.all(deletePromises);

//       // If any DELETE requests failed, try with POST method for deletion
//       const failedDeletes = responses.filter(response => !response.status || response.status >= 400);

//       if (failedDeletes.length > 0) {
//         console.log(`${failedDeletes.length} DELETE requests failed. Trying alternative approach...`);

//         // Try POST method for deletion if supported by your API
//         const alternativePromises = selectedEmails.map(id =>
//           axios.post(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/delete`,
//             { draft_id: id },  // FIXED: Only send draft_id without email_id
//             {
//               headers: {
//                 'Authorization': `Bearer ${token.access_token}`,
//                 'Content-Type': 'application/json'
//               }
//             }
//           ).catch(error => {
//             console.log(`POST delete request failed for ID ${id}:`, error);
//             return { status: error.response?.status || 500, ok: false };
//           })
//         );

//         const alternativeResponses = await Promise.all(alternativePromises);
//         const stillFailedDeletes = alternativeResponses.filter(response => !response.status || response.status >= 400);

//         if (stillFailedDeletes.length > 0) {
//           throw new Error(`Failed to delete ${stillFailedDeletes.length} drafts using alternative method`);
//         }
//       }

//       // Remove deleted emails from state
//       setApiDraftEmails(prev =>
//         prev.filter(email => !selectedEmails.includes(email.id || ''))
//       );

//       // Clear selection
//       setSelectedEmails([]);

//     } catch (err) {
//       console.error('Error deleting drafts:', err);
//       setError(err instanceof Error ? err.message : 'Failed to delete drafts');
//     }
//   }, [selectedEmails, token]);

//   const formatDate = (dateString: string | undefined) => {
//     if (!dateString) return '';

//     const date = new Date(dateString);
//     const today = new Date();
//     const yesterday = new Date(today);
//     yesterday.setDate(yesterday.getDate() - 1);

//     if (date.toDateString() === today.toDateString()) {
//       return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     } else if (date.toDateString() === yesterday.toDateString()) {
//       return 'Yesterday';
//     } else {
//       return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
//     }
//   };

//   // Update draft using axios instead of fetch
//   const updateDraftInApi = useCallback(async (draftId: string, updatedData: any) => {
//     try {
//       if (!token) {
//         throw new Error('No access token found');
//       }

//       // Use PUT request with axios to update the existing draft
//       const response = await axios.put(
//         `https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/${draftId}`,
//         updatedData,
//         {
//           headers: {
//             'Authorization': `Bearer ${token.access_token}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       // Update the local state with the updated draft
//       const updatedEmail = response.data;
//       console.log('Draft updated successfully:', updatedEmail);

//       setApiDraftEmails(prev =>
//         prev.map(email =>
//           email.id === draftId ? { ...email, ...updatedData } : email
//         )
//       );

//       return updatedEmail;
//     } catch (err) {
//       console.error('Error updating draft:', err);
//       throw err;
//     }
//   }, [token]);

//   // Handler to open ComposeModal with selected draft data
//   const handleEditDraft = (email: Email) => {
//     // Set the selected draft in the store for editing
//     if (updateDraft) {
//       updateDraft({
//         id: email.id,
//         to: email.to || "",
//         subject: email.subject || "",
//         content: email.content || "",
//         status: "draft"
//       });
//     }

//     // Set the selected draft for the modal
//     setSelectedDraft(email);

//     // Open the compose modal
//     setIsComposeModalOpen(true);
//   };

//   // Handler for when the ComposeModal is closed
//   const handleComposeModalClose = (savedDraft?: Email) => {
//     setIsComposeModalOpen(false);

//     // If a draft was saved and it's an edit (has an ID), update the local state
//     if (savedDraft && selectedDraft && savedDraft.id === selectedDraft.id) {
//       setApiDraftEmails(prev =>
//         prev.map(email =>
//           email.id === savedDraft.id ? savedDraft : email
//         )
//       );
//     }

//     setSelectedDraft(null);
//   };

//   // Handler for saving draft changes
//   const handleSaveDraft = async (draftData: Email) => {
//     try {
//       if (draftData.id) {
//         // Update existing draft
//         await updateDraftInApi(draftData.id, {
//           to: draftData.to,
//           subject: draftData.subject,
//           content: draftData.content
//         });

//         // Update local state
//         setApiDraftEmails(prev =>
//           prev.map(email =>
//             email.id === draftData.id ? draftData : email
//           )
//         );
//       }
//     } catch (err) {
//       console.error('Error saving draft:', err);
//       setError(err instanceof Error ? err.message : 'Failed to save draft');
//     }
//   };

//   return (
//     <div className="w-full h-full overflow-y-auto pb-4">
//       {/* Header */}
//       <div className="border rounded-lg bg-white overflow-hidden h-[calc(100vh-120px)]">
//         <div className="sticky top-0 bg-background z-10 p-4 border-b">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center space-x-4">
//               {onBack && (
//                 <Button variant="ghost" size="icon" onClick={onBack}>
//                   <ArrowLeft className="h-5 w-5" />
//                 </Button>
//               )}
//               <h1 className="text-xl font-semibold">Drafts</h1>
//             </div>
//             <div className="flex items-center space-x-2">
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
//                 <Filter className="h-4 w-4" />
//               </Button>
//             </div>
//           </div>
//         </div>

//         {/* Email List */}
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
//           ) : sortedAndFilteredEmails.length === 0 ? (
//             <div className="text-center py-8 text-muted-foreground">
//               No draft emails found
//             </div>
//           ) : (
//             <div className="space-y-0">
//               <div className="p-2 flex items-center bg-gray-50 border-b">
//                 <Checkbox
//                   checked={selectedEmails.length === sortedAndFilteredEmails.length && sortedAndFilteredEmails.length > 0}
//                   onCheckedChange={selectAllEmails}
//                   className="ml-4"
//                 />
//                 {selectedEmails.length > 0 && (
//                   <div className="ml-4 flex items-center space-x-2">
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={deleteDrafts}
//                       className="text-red-500 hover:text-red-700 hover:bg-red-50"
//                     >
//                       <Trash2 className="h-4 w-4 mr-1" />
//                       Delete
//                     </Button>
//                   </div>
//                 )}
//               </div>

//               {sortedAndFilteredEmails.map((email) => (
//                 <div
//                   key={email.id || `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`}
//                   className={`flex items-center px-4 py-3 border-b last:border-b-0 hover:bg-slate-50 transition-colors cursor-pointer ${selectedEmails.includes(email.id || '') ? 'bg-blue-50' : ''}`}
//                 >
//                   <div className="mr-3">
//                     <Checkbox
//                       checked={selectedEmails.includes(email.id || '')}
//                       onCheckedChange={() => { }}
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         toggleSelectEmail(email.id || '');
//                       }}
//                     />
//                   </div>
//                   <div
//                     className="flex-1 grid grid-cols-12 gap-2"
//                     onClick={() => handleEditDraft(email)}
//                   >
//                     <div className="col-span-2 text-sm text-gray-600 truncate pr-2">
//                       To: {email.to}
//                     </div>
//                     <div className="col-span-7 flex items-center">
//                       <div className="text-sm truncate">
//                         <span className="font-medium">{email.subject}</span>
//                         {email.content && (
//                           <span className="text-gray-500"> - {email.content}</span>
//                         )}
//                       </div>
//                     </div>
//                     <div className="col-span-3 text-right text-sm text-gray-500">
//                       {formatDate((email as any).timestamp?.toString())}
//                     </div>
//                   </div>
//                   <div className="flex space-x-2 ml-4">
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       className="text-gray-500 hover:text-gray-700"
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleEditDraft(email);
//                       }}
//                     >
//                       <Edit className="h-4 w-4 mr-1" />
//                       Edit
//                     </Button>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       className="text-red-500 hover:text-red-700"
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         setSelectedEmails([email.id || '']);
//                         deleteDrafts();
//                       }}
//                     >
//                       <Trash2 className="h-4 w-4 mr-1" />
//                       Delete
//                     </Button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Compose Modal */}
//       <ComposeModal
//         isOpen={isComposeModalOpen}
//         onClose={handleComposeModalClose}
//         editMode={true}
//         draftEmail={selectedDraft}
//         onSaveDraft={handleSaveDraft}
//       />
//     </div>
//   );
// };

// export default EmailDraft;




































// import { useEmailStore } from "@/store/email-store";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Filter, Trash2, Send, Archive, Edit } from "lucide-react";
// import { useState, useEffect } from "react";
// import { Email, EmailCategory } from "@/lib/types/email";
// import { Checkbox } from "@/components/ui/checkbox";
// import Link from "next/link";
// import { getCookie, getAuthToken } from "@/lib/utils/cookies"; // Import cookie functions
// import { ComposeModal } from "./ComposeModal"; // Import ComposeModal

// interface EmailDraftProps {
//   onBack?: () => void;
// }

// // Helper function to get access token from cookies
// const getAccessToken = () => {
//   return getAuthToken();
// };

// // Helper function to get linked email ID from cookies
// const getLinkedEmailId = () => {
//   return getCookie('linkedEmailId');
// };

// export const EmailDraft = ({ onBack }: EmailDraftProps) => {
//   const { emails, updateDraft } = useEmailStore();
//   const [apiDraftEmails, setApiDraftEmails] = useState<Email[]>([]);
//   const [filterDate, setFilterDate] = useState<string | null>(null);
//   const [sortNewest, setSortNewest] = useState(true);
//   const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Add state for controlling the ComposeModal
//   const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
//   const [selectedDraft, setSelectedDraft] = useState<Email | null>(null);

//   useEffect(() => {
//     const fetchDraftEmails = async () => {
//       setIsLoading(true);
//       setError(null);

//       try {
//         // Get token from cookies
//         const token = getAccessToken();
//         console.log("Token retrieved:", token ? `${token.substring(0, 10)}...` : 'No token found');

//         if (!token) {
//           throw new Error('No access token available');
//         }

//         // Get linked email ID from cookies
//         const linkedEmailId = getLinkedEmailId();
//         console.log("Linked Email ID:", linkedEmailId);

//         if (!linkedEmailId) {
//           throw new Error('No linked email ID found');
//         }

//         // Use the same approach as EmailSent - use query parameters with GET request
//         const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts?email_id=${encodeURIComponent(linkedEmailId)}`;
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
//           const postEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts';
//           console.log("Trying POST request to:", postEndpoint);

//           const postResponse = await fetch(postEndpoint, {
//             method: 'POST', // Change to POST for body
//             headers: {
//               'Content-Type': 'application/json',
//               'Authorization': `Bearer ${token}`
//             },
//             body: JSON.stringify({
//               email_id: linkedEmailId,
//               content: "" // Adding empty content as POST requires it
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
//         console.error('Error fetching draft emails:', err);
//         setError(err instanceof Error ? err.message : 'Failed to fetch draft emails');
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
//       } else if (data.drafts && Array.isArray(data.drafts)) {
//         emailsData = data.drafts;
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
//         ...email,
//         id: email.id || email._id || `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
//         content: email.content || '',
//         createdAt: email.createdAt || email.created_at || Date.now(),
//         status: "draft"
//       }));

//       setApiDraftEmails(formattedEmails);
//     };

//     fetchDraftEmails();
//   }, []);

//   // Sort and filter emails
//   const sortedAndFilteredEmails = [...apiDraftEmails]
//     .filter(email => {
//       if (!filterDate) return true;
//       const emailDate = new Date(email.timestamp ?? Date.now()).toDateString();
//       return emailDate === filterDate;
//     })
//     .sort((a, b) => {
//       const dateA = new Date(a.timestamp ?? Date.now()).getTime();
//       const dateB = new Date(b.timestamp ?? Date.now()).getTime();
//       return sortNewest ? dateB - dateA : dateA - dateB;
//     });
//   const toggleSelectEmail = (id: string) => {
//     setSelectedEmails(prev =>
//       prev.includes(id)
//         ? prev.filter(emailId => emailId !== id)
//         : [...prev, id]
//     );
//   };

//   const selectAllEmails = () => {
//     if (selectedEmails.length === sortedAndFilteredEmails.length) {
//       setSelectedEmails([]);
//     } else {
//       setSelectedEmails(sortedAndFilteredEmails.map(email => email.id || ''));
//     }
//   };

//   const deleteDrafts = async () => {
//     if (selectedEmails.length === 0) return;

//     try {
//       const token = getAccessToken();

//       if (!token) {
//         throw new Error('No access token found');
//       }

//       // FIXED: Use the correct API endpoint format for deletion
//       // The drafts/:id endpoint doesn't need email_id in the query params
//       const responses = await Promise.all(
//         selectedEmails.map(id =>
//           fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/${id}`, {
//             method: 'DELETE',
//             headers: {
//               'Authorization': `Bearer ${token}`,
//               'Content-Type': 'application/json'
//             }
//           })
//         )
//       );

//       // If any DELETE requests failed, try with POST method for deletion
//       const failedDeletes = responses.filter(response => !response.ok);

//       if (failedDeletes.length > 0) {
//         console.log(`${failedDeletes.length} DELETE requests failed. Trying alternative approach...`);

//         // Try POST or PUT method for deletion if supported by your API
//         const alternativeResponses = await Promise.all(
//           selectedEmails.map(id =>
//             fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/delete`, {
//               method: 'POST',
//               headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//               },
//               body: JSON.stringify({
//                 draft_id: id  // FIXED: Only send draft_id without email_id
//               })
//             })
//           )
//         );

//         const stillFailedDeletes = alternativeResponses.filter(response => !response.ok);
//         if (stillFailedDeletes.length > 0) {
//           throw new Error(`Failed to delete ${stillFailedDeletes.length} drafts using alternative method`);
//         }
//       }

//       // Remove deleted emails from state
//       setApiDraftEmails(prev =>
//         prev.filter(email => !selectedEmails.includes(email.id || ''))
//       );

//       // Clear selection
//       setSelectedEmails([]);

//     } catch (err) {
//       console.error('Error deleting drafts:', err);
//       setError(err instanceof Error ? err.message : 'Failed to delete drafts');
//     }
//   };

//   const formatDate = (dateString: string | undefined) => {
//     if (!dateString) return '';

//     const date = new Date(dateString);
//     const today = new Date();
//     const yesterday = new Date(today);
//     yesterday.setDate(yesterday.getDate() - 1);

//     if (date.toDateString() === today.toDateString()) {
//       return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     } else if (date.toDateString() === yesterday.toDateString()) {
//       return 'Yesterday';
//     } else {
//       return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
//     }
//   };

//   // FIXED: Update draft instead of creating a new one
//   const updateDraftInApi = async (draftId: string, updatedData: any) => {
//     try {
//       const token = getAuthToken();

//       if (!token) {
//         throw new Error('No access token found');
//       }

//       // Use PUT request to update the existing draft
//       const response = await fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/${draftId}`, {
//         method: 'PUT',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(updatedData)
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to update draft: ${response.statusText}`);
//       }

//       // Refresh the drafts list
//       const updatedEmail = await response.json();
//       console.log('Draft updated successfully:', updatedEmail);

//       // Update the local state with the updated draft
//       setApiDraftEmails(prev =>
//         prev.map(email =>
//           email.id === draftId ? { ...email, ...updatedData } : email
//         )
//       );

//       return updatedEmail;
//     } catch (err) {
//       console.error('Error updating draft:', err);
//       throw err;
//     }
//   };

//   // Handler to open ComposeModal with selected draft data
//   const handleEditDraft = (email: Email) => {
//     // Set the selected draft in the store for editing
//     if (updateDraft) {
//       updateDraft({
//         id: email.id,
//         to: email.to || "",
//         subject: email.subject || "",
//         content: email.content || "",
//         status: "draft"
//       });
//     }

//     // Set the selected draft for the modal
//     setSelectedDraft(email);

//     // Open the compose modal
//     setIsComposeModalOpen(true);
//   };

//   // Handler for when the ComposeModal is closed
//   const handleComposeModalClose = (savedDraft?: Email) => {
//     setIsComposeModalOpen(false);

//     // If a draft was saved and it's an edit (has an ID), update the local state
//     if (savedDraft && selectedDraft && savedDraft.id === selectedDraft.id) {
//       setApiDraftEmails(prev =>
//         prev.map(email =>
//           email.id === savedDraft.id ? savedDraft : email
//         )
//       );
//     }

//     setSelectedDraft(null);
//   };

//   // Handler for saving draft changes
//   const handleSaveDraft = async (draftData: Email) => {
//     try {
//       if (draftData.id) {
//         // Update existing draft
//         await updateDraftInApi(draftData.id, {
//           to: draftData.to,
//           subject: draftData.subject,
//           content: draftData.content
//         });

//         // Update local state
//         setApiDraftEmails(prev =>
//           prev.map(email =>
//             email.id === draftData.id ? draftData : email
//           )
//         );
//       }
//     } catch (err) {
//       console.error('Error saving draft:', err);
//       setError(err instanceof Error ? err.message : 'Failed to save draft');
//     }
//   };

//   return (
//     <div className="flex flex-col rounded-lg h-full bg-white">
//       {/* Header */}
//       <div className="flex items-center justify-between p-4 border-b">
//         <div className="flex items-center space-x-4">
//           {onBack && (
//             <Button variant="ghost" size="icon" onClick={onBack}>
//               <ArrowLeft className="h-5 w-5" />
//             </Button>
//           )}
//           <h1 className="text-xl font-semibold">Drafts</h1>
//         </div>
//         <div className="flex items-center space-x-2">
//           <Button
//             variant="outline"
//             className="flex items-center gap-2"
//             onClick={() => setSortNewest(!sortNewest)}
//           >
//             <Filter className="h-4 w-4" />
//             {sortNewest ? 'Newest' : 'Oldest'}
//           </Button>
//         </div>
//       </div>

//       {/* Email List */}
//       <div className="flex-grow overflow-auto">
//         {isLoading ? (
//           <div className="flex justify-center items-center h-32">
//             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
//           </div>
//         ) : error ? (
//           <div className="p-4 text-red-500">{error}</div>
//         ) : sortedAndFilteredEmails.length === 0 ? (
//           <div className="p-8 text-center text-gray-500">
//             <p>No draft emails found</p>
//           </div>
//         ) : (
//           <div className="divide-y">
//             <div className="p-2 flex items-center bg-gray-50">
//               <Checkbox
//                 checked={selectedEmails.length === sortedAndFilteredEmails.length && sortedAndFilteredEmails.length > 0}
//                 onCheckedChange={selectAllEmails}
//                 className="ml-4"
//               />
//               {selectedEmails.length > 0 && (
//                 <div className="ml-4 flex items-center space-x-2">
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={deleteDrafts}
//                     className="text-red-500 hover:text-red-700 hover:bg-red-50"
//                   >
//                     <Trash2 className="h-4 w-4 mr-1" />
//                     Delete
//                   </Button>
//                 </div>
//               )}
//             </div>

//             {sortedAndFilteredEmails.map((email) => (
//               <div
//                 key={email.id || `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`}
//                 className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedEmails.includes(email.id || '') ? 'bg-blue-50' : ''}`}
//               >
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center space-x-3 flex-grow">
//                     <div>
//                       <Checkbox
//                         checked={selectedEmails.includes(email.id || '')}
//                         onCheckedChange={() => toggleSelectEmail(email.id || '')}
//                       />
//                     </div>
//                     <div
//                       className="flex-grow"
//                       onClick={() => handleEditDraft(email)}
//                     >
//                       <div className="flex-1 grid grid-cols-12 gap-2">
//                         <div className="col-span-2 text-sm text-gray-600 truncate pr-2">
//                           To: {email.to}
//                         </div>
//                         <div className="col-span-7 flex items-center">
//                           <div className="text-sm truncate">
//                             {email.subject} - {email.content}
//                           </div>
//                         </div>
//                         <div className="col-span-3 text-right text-sm text-gray-500">
//                           {formatDate((email as any).timestamp?.toString())}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="flex space-x-2 ml-4">
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       className="text-gray-500 hover:text-gray-700"
//                       onClick={() => handleEditDraft(email)}
//                     >
//                       <Edit className="h-4 w-4 mr-1" />
//                       Edit
//                     </Button>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       className="text-red-500 hover:text-red-700"
//                       onClick={() => {
//                         setSelectedEmails([email.id || '']);
//                         deleteDrafts();
//                       }}
//                     >
//                       <Trash2 className="h-4 w-4 mr-1" />
//                       Delete
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Compose Modal */}
//       <ComposeModal
//         isOpen={isComposeModalOpen}
//         onClose={handleComposeModalClose}
//         editMode={true}
//         draftEmail={selectedDraft}
//         onSaveDraft={handleSaveDraft}  // ADDED: Pass the save handler to update existing drafts
//       />
//     </div>
//   );
// };

// export default EmailDraft;





















// import { useEmailStore } from "@/store/email-store";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Filter, Trash2, Send, Archive, Edit } from "lucide-react";
// import { useState, useEffect } from "react";
// import { Email, EmailCategory } from "@/lib/types/email";
// import { Checkbox } from "@/components/ui/checkbox";
// import Link from "next/link";
// import { getCookie, getAuthToken } from "@/lib/utils/cookies"; // Import cookie functions

// interface EmailDraftProps {
//   onBack?: () => void;
// }

// // Helper function to get access token from cookies
// const getAccessToken = () => {
//   return getAuthToken();
// };

// // Helper function to get linked email ID from cookies
// const getLinkedEmailId = () => {
//   return getCookie('linkedEmailId');
// };

// export const EmailDraft = ({ onBack }: EmailDraftProps) => {
//   const { emails } = useEmailStore();
//   const [apiDraftEmails, setApiDraftEmails] = useState<Email[]>([]);
//   const [filterDate, setFilterDate] = useState<string | null>(null);
//   const [sortNewest, setSortNewest] = useState(true);
//   const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchDraftEmails = async () => {
//       setIsLoading(true);
//       setError(null);

//       try {
//         // Get token from cookies
//         const token = getAccessToken();
//         console.log("Token retrieved:", token ? `${token.substring(0, 10)}...` : 'No token found');

//         if (!token) {
//           throw new Error('No access token available');
//         }

//         // Get linked email ID from cookies
//         const linkedEmailId = getLinkedEmailId();
//         console.log("Linked Email ID:", linkedEmailId);

//         if (!linkedEmailId) {
//           throw new Error('No linked email ID found');
//         }

//         // Use the same approach as EmailSent - use query parameters with GET request
//         const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts?email_id=${encodeURIComponent(linkedEmailId)}`;
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
//           const postEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts';
//           console.log("Trying POST request to:", postEndpoint);

//           const postResponse = await fetch(postEndpoint, {
//             method: 'POST', // Change to POST for body
//             headers: {
//               'Content-Type': 'application/json',
//               'Authorization': `Bearer ${token}`
//             },
//             body: JSON.stringify({
//               email_id: linkedEmailId,
//               content: "" // Adding empty content as POST requires it
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
//         console.error('Error fetching draft emails:', err);
//         setError(err instanceof Error ? err.message : 'Failed to fetch draft emails');
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
//       } else if (data.drafts && Array.isArray(data.drafts)) {
//         emailsData = data.drafts;
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
//         ...email,
//         id: email.id || email._id || `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
//         content: email.content || '',
//         createdAt: email.createdAt || email.created_at || Date.now(),
//         status: "draft"
//       }));

//       setApiDraftEmails(formattedEmails);
//     };

//     fetchDraftEmails();
//   }, []);

//   // Sort and filter emails
//   const sortedAndFilteredEmails = [...apiDraftEmails]
//     .filter(email => {
//       if (!filterDate) return true;
//       const emailDate = new Date(email.createdAt || Date.now()).toDateString();
//       return emailDate === filterDate;
//     })
//     .sort((a, b) => {
//       const dateA = new Date(a.createdAt || Date.now()).getTime();
//       const dateB = new Date(b.createdAt || Date.now()).getTime();
//       return sortNewest ? dateB - dateA : dateA - dateB;
//     });

//   const toggleSelectEmail = (id: string) => {
//     setSelectedEmails(prev =>
//       prev.includes(id)
//         ? prev.filter(emailId => emailId !== id)
//         : [...prev, id]
//     );
//   };

//   const selectAllEmails = () => {
//     if (selectedEmails.length === sortedAndFilteredEmails.length) {
//       setSelectedEmails([]);
//     } else {
//       setSelectedEmails(sortedAndFilteredEmails.map(email => email.id || ''));
//     }
//   };

//   const deleteDrafts = async () => {
//     if (selectedEmails.length === 0) return;

//     try {
//       const token = getAccessToken();
//       const linkedEmailId = getLinkedEmailId();

//       if (!token) {
//         throw new Error('No access token found');
//       }

//       if (!linkedEmailId) {
//         throw new Error('No linked email ID found');
//       }

//       // Use the same approach as the fetch - direct API call with proper endpoint
//       const responses = await Promise.all(
//         selectedEmails.map(id =>
//           fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/${id}?email_id=${encodeURIComponent(linkedEmailId)}`, {
//             method: 'DELETE',
//             headers: {
//               'Authorization': `Bearer ${token}`,
//               'Content-Type': 'application/json'
//             }
//           })
//         )
//       );

//       // If any DELETE requests failed, try with POST method for deletion
//       const failedDeletes = responses.filter(response => !response.ok);

//       if (failedDeletes.length > 0) {
//         console.log(`${failedDeletes.length} DELETE requests failed. Trying alternative approach...`);

//         // Try POST or PUT method for deletion if supported by your API
//         const alternativeResponses = await Promise.all(
//           selectedEmails.map(id =>
//             fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/delete`, {
//               method: 'POST',
//               headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//               },
//               body: JSON.stringify({
//                 email_id: linkedEmailId,
//                 draft_id: id
//               })
//             })
//           )
//         );

//         const stillFailedDeletes = alternativeResponses.filter(response => !response.ok);
//         if (stillFailedDeletes.length > 0) {
//           throw new Error(`Failed to delete ${stillFailedDeletes.length} drafts using alternative method`);
//         }
//       }

//       // Remove deleted emails from state
//       setApiDraftEmails(prev =>
//         prev.filter(email => !selectedEmails.includes(email.id || ''))
//       );

//       // Clear selection
//       setSelectedEmails([]);

//     } catch (err) {
//       console.error('Error deleting drafts:', err);
//       setError(err instanceof Error ? err.message : 'Failed to delete drafts');
//     }
//   };

//   const formatDate = (dateString: string | undefined) => {
//     if (!dateString) return '';

//     const date = new Date(dateString);
//     const today = new Date();
//     const yesterday = new Date(today);
//     yesterday.setDate(yesterday.getDate() - 1);

//     if (date.toDateString() === today.toDateString()) {
//       return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     } else if (date.toDateString() === yesterday.toDateString()) {
//       return 'Yesterday';
//     } else {
//       return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
//     }
//   };

//   return (
//     <div className="flex flex-col rounded-lg h-full bg-white">
//       {/* Header */}
//       <div className="flex items-center justify-between p-4 border-b">
//         <div className="flex items-center space-x-4">
//           {onBack && (
//             <Button variant="ghost" size="icon" onClick={onBack}>
//               <ArrowLeft className="h-5 w-5" />
//             </Button>
//           )}
//           <h1 className="text-xl font-semibold">Drafts</h1>
//         </div>
//         <div className="flex items-center space-x-2">
//           <Button
//             variant="outline"
//             className="flex items-center gap-2"
//             onClick={() => setSortNewest(!sortNewest)}
//           >
//             <Filter className="h-4 w-4" />
//             {sortNewest ? 'Newest' : 'Oldest'}
//           </Button>
//         </div>
//       </div>

//       {/* Email List */}
//       <div className="flex-grow overflow-auto">
//         {isLoading ? (
//           <div className="flex justify-center items-center h-32">
//             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
//           </div>
//         ) : error ? (
//           <div className="p-4 text-red-500">{error}</div>
//         ) : sortedAndFilteredEmails.length === 0 ? (
//           <div className="p-8 text-center text-gray-500">
//             <p>No draft emails found</p>
//           </div>
//         ) : (
//           <div className="divide-y">
//             <div className="p-2 flex items-center bg-gray-50">
//               <Checkbox
//                 checked={selectedEmails.length === sortedAndFilteredEmails.length && sortedAndFilteredEmails.length > 0}
//                 onCheckedChange={selectAllEmails}
//                 className="ml-4"
//               />
//               {selectedEmails.length > 0 && (
//                 <div className="ml-4 flex items-center space-x-2">
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={deleteDrafts}
//                     className="text-red-500 hover:text-red-700 hover:bg-red-50"
//                   >
//                     <Trash2 className="h-4 w-4 mr-1" />
//                     Delete
//                   </Button>
//                 </div>
//               )}
//             </div>

//             {sortedAndFilteredEmails.map((email) => (
//               <div
//                 key={email.id || `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`}
//                 className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedEmails.includes(email.id || '') ? 'bg-blue-50' : ''}`}
//               >
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center space-x-3 flex-grow">
//                     <div>
//                       <Checkbox
//                         checked={selectedEmails.includes(email.id || '')}
//                         onCheckedChange={() => toggleSelectEmail(email.id || '')}
//                       />
//                     </div>
//                     <Link href={`/email/compose/${email.id || ''}`} className="flex-grow">
//                       <div className="flex-1 grid grid-cols-12 gap-2">
//                         <div className="col-span-2 text-sm text-gray-600 truncate pr-2">
//                           To: {email.to}
//                         </div>
//                         <div className="col-span-7 flex items-center">
//                           <div className="text-sm truncate">
//                             {email.subject} - {email.content}
//                           </div>
//                         </div>
//                         <div className="col-span-3 text-right text-sm text-gray-500">
//                           {formatDate(email.createdAt?.toString())}
//                         </div>
//                       </div>
//                     </Link>
//                   </div>
//                   <div className="flex space-x-2 ml-4">
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       className="text-gray-500 hover:text-gray-700"
//                       asChild
//                     ><Link href={`/email/compose/${email.id || ''}`}>
//                         <Edit className="h-4 w-4 mr-1" />
//                         Edit
//                       </Link>
//                     </Button>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       className="text-red-500 hover:text-red-700"
//                       onClick={() => {
//                         setSelectedEmails([email.id || '']);
//                         deleteDrafts();
//                       }}
//                     >
//                       <Trash2 className="h-4 w-4 mr-1" />
//                       Delete
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default EmailDraft;











// import { useEmailStore } from "@/store/email-store";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Filter, Trash2, Send, Archive, Edit } from "lucide-react";
// import { useState, useEffect } from "react";
// import { Email, EmailCategory } from "@/lib/types/email";
// import { Checkbox } from "@/components/ui/checkbox";
// import Link from "next/link";

// interface EmailDraftProps {
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

// export const EmailDraft = ({ onBack }: EmailDraftProps) => {
//   const { emails } = useEmailStore();
//   const [apiDraftEmails, setApiDraftEmails] = useState<Email[]>([]);
//   const [filterDate, setFilterDate] = useState<string | null>(null);
//   const [sortNewest, setSortNewest] = useState(true);
//   const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchDraftEmails = async () => {
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

//         // Use the same approach as EmailSent - use query parameters with GET request
//         const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts?email_id=${encodeURIComponent(linkedEmailId)}`;
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
//           const postEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts';
//           console.log("Trying POST request to:", postEndpoint);

//           const postResponse = await fetch(postEndpoint, {
//             method: 'POST', // Change to POST for body
//             headers: {
//               'Content-Type': 'application/json',
//               'Authorization': `Bearer ${token}`
//             },
//             body: JSON.stringify({
//               email_id: linkedEmailId,
//               content: "" // Adding empty content as POST requires it
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
//         console.error('Error fetching draft emails:', err);
//         setError(err instanceof Error ? err.message : 'Failed to fetch draft emails');
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
//       } else if (data.drafts && Array.isArray(data.drafts)) {
//         emailsData = data.drafts;
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
//         ...email,
//         id: email.id || email._id || `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
//         content: email.content || '',
//         createdAt: email.createdAt || email.created_at || Date.now(),
//         status: "draft"
//       }));

//       setApiDraftEmails(formattedEmails);
//     };

//     fetchDraftEmails();
//   }, []);

//   // Sort and filter emails
//   const sortedAndFilteredEmails = [...apiDraftEmails]
//     .filter(email => {
//       if (!filterDate) return true;
//       const emailDate = new Date(email.createdAt || Date.now()).toDateString();
//       return emailDate === filterDate;
//     })
//     .sort((a, b) => {
//       const dateA = new Date(a.createdAt || Date.now()).getTime();
//       const dateB = new Date(b.createdAt || Date.now()).getTime();
//       return sortNewest ? dateB - dateA : dateA - dateB;
//     });

//   const toggleSelectEmail = (id: string) => {
//     setSelectedEmails(prev =>
//       prev.includes(id)
//         ? prev.filter(emailId => emailId !== id)
//         : [...prev, id]
//     );
//   };

//   const selectAllEmails = () => {
//     if (selectedEmails.length === sortedAndFilteredEmails.length) {
//       setSelectedEmails([]);
//     } else {
//       setSelectedEmails(sortedAndFilteredEmails.map(email => email.id || ''));
//     }
//   };

//   const deleteDrafts = async () => {
//     if (selectedEmails.length === 0) return;

//     try {
//       const token = getAccessToken();
//       const linkedEmailId = getLinkedEmailId();

//       if (!token) {
//         throw new Error('No access token found');
//       }

//       if (!linkedEmailId) {
//         throw new Error('No linked email ID found');
//       }

//       // Use the same approach as the fetch - direct API call with proper endpoint
//       const responses = await Promise.all(
//         selectedEmails.map(id =>
//           fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/${id}?email_id=${encodeURIComponent(linkedEmailId)}`, {
//             method: 'DELETE',
//             headers: {
//               'Authorization': `Bearer ${token}`,
//               'Content-Type': 'application/json'
//             }
//           })
//         )
//       );

//       // If any DELETE requests failed, try with POST method for deletion
//       const failedDeletes = responses.filter(response => !response.ok);

//       if (failedDeletes.length > 0) {
//         console.log(`${failedDeletes.length} DELETE requests failed. Trying alternative approach...`);

//         // Try POST or PUT method for deletion if supported by your API
//         const alternativeResponses = await Promise.all(
//           selectedEmails.map(id =>
//             fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/delete`, {
//               method: 'POST',
//               headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//               },
//               body: JSON.stringify({
//                 email_id: linkedEmailId,
//                 draft_id: id
//               })
//             })
//           )
//         );

//         const stillFailedDeletes = alternativeResponses.filter(response => !response.ok);
//         if (stillFailedDeletes.length > 0) {
//           throw new Error(`Failed to delete ${stillFailedDeletes.length} drafts using alternative method`);
//         }
//       }

//       // Remove deleted emails from state
//       setApiDraftEmails(prev =>
//         prev.filter(email => !selectedEmails.includes(email.id || ''))
//       );

//       // Clear selection
//       setSelectedEmails([]);

//     } catch (err) {
//       console.error('Error deleting drafts:', err);
//       setError(err instanceof Error ? err.message : 'Failed to delete drafts');
//     }
//   };

//   const formatDate = (dateString: string | undefined) => {
//     if (!dateString) return '';

//     const date = new Date(dateString);
//     const today = new Date();
//     const yesterday = new Date(today);
//     yesterday.setDate(yesterday.getDate() - 1);

//     if (date.toDateString() === today.toDateString()) {
//       return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     } else if (date.toDateString() === yesterday.toDateString()) {
//       return 'Yesterday';
//     } else {
//       return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
//     }
//   };

//   return (
//     <div className="flex flex-col rounded-lg h-full bg-white">
//       {/* Header */}
//       <div className="flex items-center justify-between p-4 border-b">
//         <div className="flex items-center space-x-4">
//           {onBack && (
//             <Button variant="ghost" size="icon" onClick={onBack}>
//               <ArrowLeft className="h-5 w-5" />
//             </Button>
//           )}
//           <h1 className="text-xl font-semibold">Drafts</h1>
//         </div>
//         <div className="flex items-center space-x-2">
//           <Button
//             variant="outline"
//             className="flex items-center gap-2"
//             onClick={() => setSortNewest(!sortNewest)}
//           >
//             <Filter className="h-4 w-4" />
//             {sortNewest ? 'Newest' : 'Oldest'}
//           </Button>
//         </div>
//       </div>

//       {/* Email List */}
//       <div className="flex-grow overflow-auto">
//         {isLoading ? (
//           <div className="flex justify-center items-center h-32">
//             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
//           </div>
//         ) : error ? (
//           <div className="p-4 text-red-500">{error}</div>
//         ) : sortedAndFilteredEmails.length === 0 ? (
//           <div className="p-8 text-center text-gray-500">
//             <p>No draft emails found</p>
//           </div>
//         ) : (
//           <div className="divide-y">
//             <div className="p-2 flex items-center bg-gray-50">
//               <Checkbox
//                 checked={selectedEmails.length === sortedAndFilteredEmails.length && sortedAndFilteredEmails.length > 0}
//                 onCheckedChange={selectAllEmails}
//                 className="ml-4"
//               />
//               {selectedEmails.length > 0 && (
//                 <div className="ml-4 flex items-center space-x-2">
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={deleteDrafts}
//                     className="text-red-500 hover:text-red-700 hover:bg-red-50"
//                   >
//                     <Trash2 className="h-4 w-4 mr-1" />
//                     Delete
//                   </Button>
//                 </div>
//               )}
//             </div>

//             {sortedAndFilteredEmails.map((email) => (
//               <div
//                 key={email.id || `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`}
//                 className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedEmails.includes(email.id || '') ? 'bg-blue-50' : ''}`}
//               >
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center space-x-3 flex-grow">
//                     <div>
//                       <Checkbox
//                         checked={selectedEmails.includes(email.id || '')}
//                         onCheckedChange={() => toggleSelectEmail(email.id || '')}
//                       />
//                     </div>
//                     <Link href={`/email/compose/${email.id || ''}`} className="flex-grow">
//                       <div className="flex-1 grid grid-cols-12 gap-2">
//                         <div className="col-span-2 text-sm text-gray-600">
//                           To: {email.to}
//                         </div>
//                         <div className="col-span-7 flex items-center">
//                           <div className="text-sm truncate">
//                             {email.subject} - {email.content}
//                           </div>
//                         </div>
//                         <div className="col-span-3 text-right text-sm text-gray-500">
//                           {/* {formatDate(email.createdAt?.toString())} */}
//                         </div>
//                       </div>
//                     </Link>
//                   </div>
//                   <div className="flex space-x-2 ml-4">
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       className="text-gray-500 hover:text-gray-700"
//                       asChild
//                     ><Link href={`/email/compose/${email.id || ''}`}>
//                         <Edit className="h-4 w-4 mr-1" />
//                         Edit
//                       </Link>
//                     </Button>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       className="text-red-500 hover:text-red-700"
//                       onClick={() => {
//                         setSelectedEmails([email.id || '']);
//                         deleteDrafts();
//                       }}
//                     >
//                       <Trash2 className="h-4 w-4 mr-1" />
//                       Delete
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default EmailDraft;

























// import { useEmailStore } from "@/store/email-store";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Filter, Trash2, Send, Archive, Edit } from "lucide-react";
// import { useState, useEffect } from "react";
// import { Email, EmailCategory } from "@/lib/types/email";
// import { Checkbox } from "@/components/ui/checkbox";
// import Link from "next/link";

// interface EmailDraftProps {
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

// export const EmailDraft = ({ onBack }: EmailDraftProps) => {
//   const { emails } = useEmailStore();
//   const [apiDraftEmails, setApiDraftEmails] = useState<Email[]>([]);
//   const [filterDate, setFilterDate] = useState<string | null>(null);
//   const [sortNewest, setSortNewest] = useState(true);
//   const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchDraftEmails = async () => {
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

//         // Use the same approach as EmailSent - use query parameters with GET request
//         const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts?email_id=${encodeURIComponent(linkedEmailId)}`;
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
//           const postEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts';
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
//         console.error('Error fetching draft emails:', err);
//         setError(err instanceof Error ? err.message : 'Failed to fetch draft emails');
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
//       } else if (data.drafts && Array.isArray(data.drafts)) {
//         emailsData = data.drafts;
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
//         ...email,
//         id: email.id || email._id || `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
//         content: email.body?.content || email.content || '',
//         status: "draft"
//       }));

//       setApiDraftEmails(formattedEmails);
//     };

//     fetchDraftEmails();
//   }, []);

//   // Sort and filter emails
//   const sortedAndFilteredEmails = [...apiDraftEmails]
//     .filter(email => {
//       if (!filterDate) return true;
//       const emailDate = new Date(email.createdAt || Date.now()).toDateString();
//       return emailDate === filterDate;
//     })
//     .sort((a, b) => {
//       const dateA = new Date(a.createdAt || Date.now()).getTime();
//       const dateB = new Date(b.createdAt || Date.now()).getTime();
//       return sortNewest ? dateB - dateA : dateA - dateB;
//     });

//   const toggleSelectEmail = (id: string) => {
//     setSelectedEmails(prev =>
//       prev.includes(id)
//         ? prev.filter(emailId => emailId !== id)
//         : [...prev, id]
//     );
//   };

//   const selectAllEmails = () => {
//     if (selectedEmails.length === sortedAndFilteredEmails.length) {
//       setSelectedEmails([]);
//     } else {
//       setSelectedEmails(sortedAndFilteredEmails.map(email => email.id || ''));
//     }
//   };

//   const deleteDrafts = async () => {
//     if (selectedEmails.length === 0) return;

//     try {
//       const token = getAccessToken();
//       const linkedEmailId = getLinkedEmailId();

//       if (!token) {
//         throw new Error('No access token found');
//       }

//       if (!linkedEmailId) {
//         throw new Error('No linked email ID found');
//       }

//       // Use the same approach as the fetch - direct API call with proper endpoint
//       const responses = await Promise.all(
//         selectedEmails.map(id =>
//           fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/${id}?email_id=${encodeURIComponent(linkedEmailId)}`, {
//             method: 'DELETE',
//             headers: {
//               'Authorization': `Bearer ${token}`,
//               'Content-Type': 'application/json'
//             }
//           })
//         )
//       );

//       // If any DELETE requests failed, try with POST method for deletion
//       const failedDeletes = responses.filter(response => !response.ok);

//       if (failedDeletes.length > 0) {
//         console.log(`${failedDeletes.length} DELETE requests failed. Trying alternative approach...`);

//         // Try POST or PUT method for deletion if supported by your API
//         const alternativeResponses = await Promise.all(
//           selectedEmails.map(id =>
//             fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/delete`, {
//               method: 'POST',
//               headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//               },
//               body: JSON.stringify({
//                 email_id: linkedEmailId,
//                 draft_id: id
//               })
//             })
//           )
//         );

//         const stillFailedDeletes = alternativeResponses.filter(response => !response.ok);
//         if (stillFailedDeletes.length > 0) {
//           throw new Error(`Failed to delete ${stillFailedDeletes.length} drafts using alternative method`);
//         }
//       }

//       // Remove deleted emails from state
//       setApiDraftEmails(prev =>
//         prev.filter(email => !selectedEmails.includes(email.id || ''))
//       );

//       // Clear selection
//       setSelectedEmails([]);

//     } catch (err) {
//       console.error('Error deleting drafts:', err);
//       setError(err instanceof Error ? err.message : 'Failed to delete drafts');
//     }
//   };

//   const formatDate = (dateString: string | undefined) => {
//     if (!dateString) return '';

//     const date = new Date(dateString);
//     const today = new Date();
//     const yesterday = new Date(today);
//     yesterday.setDate(yesterday.getDate() - 1);

//     if (date.toDateString() === today.toDateString()) {
//       return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     } else if (date.toDateString() === yesterday.toDateString()) {
//       return 'Yesterday';
//     } else {
//       return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
//     }
//   };

//   return (
//     <div className="flex flex-col rounded-lg h-full bg-white">
//       {/* Header */}
//       <div className="flex items-center justify-between p-4 border-b">
//         <div className="flex items-center space-x-4">
//           {onBack && (
//             <Button variant="ghost" size="icon" onClick={onBack}>
//               <ArrowLeft className="h-5 w-5" />
//             </Button>
//           )}
//           <h1 className="text-xl font-semibold">Drafts</h1>
//         </div>
//         <div className="flex items-center space-x-2">
//           <Button
//             variant="outline"
//             className="flex items-center gap-2"
//             onClick={() => setSortNewest(!sortNewest)}
//           >
//             <Filter className="h-4 w-4" />
//             {sortNewest ? 'Newest' : 'Oldest'}
//           </Button>
//         </div>
//       </div>

//       {/* Email List */}
//       <div className="flex-grow overflow-auto">
//         {isLoading ? (
//           <div className="flex justify-center items-center h-32">
//             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
//           </div>
//         ) : error ? (
//           <div className="p-4 text-red-500">{error}</div>
//         ) : sortedAndFilteredEmails.length === 0 ? (
//           <div className="p-8 text-center text-gray-500">
//             <p>No draft emails found</p>
//           </div>
//         ) : (
//           <div className="divide-y">
//             <div className="p-2 flex items-center bg-gray-50">
//               <Checkbox
//                 checked={selectedEmails.length === sortedAndFilteredEmails.length && sortedAndFilteredEmails.length > 0}
//                 onCheckedChange={selectAllEmails}
//                 className="ml-4"
//               />
//               {selectedEmails.length > 0 && (
//                 <div className="ml-4 flex items-center space-x-2">
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={deleteDrafts}
//                     className="text-red-500 hover:text-red-700 hover:bg-red-50"
//                   >
//                     <Trash2 className="h-4 w-4 mr-1" />
//                     Delete
//                   </Button>
//                 </div>
//               )}
//             </div>

//             {sortedAndFilteredEmails.map((email) => (
//               <div
//                 key={email.id || `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`}
//                 className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedEmails.includes(email.id || '') ? 'bg-blue-50' : ''}`}
//               >
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center space-x-3 flex-grow">
//                     <div>
//                       <Checkbox
//                         checked={selectedEmails.includes(email.id || '')}
//                         onCheckedChange={() => toggleSelectEmail(email.id || '')}
//                       />
//                     </div>
//                     <Link href={`/email/compose/${email.id || ''}`} className="flex-grow">
//                       <div className="flex-1 grid grid-cols-12 gap-2">
//                         <div className="col-span-2 text-sm text-gray-600">
//                           To: {email.to}
//                         </div>
//                         <div className="col-span-7 flex items-center">
//                           <div className="text-sm truncate">
//                             {email.subject} - {email.content}
//                           </div>
//                         </div>
//                         <div className="col-span-3 text-right text-sm text-gray-500">
//                           {email.timestamp ?
//                             new Date(email.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
//                             ""}
//                         </div>
//                       </div>
//                     </Link>
//                   </div>
//                   <div className="flex space-x-2 ml-4">
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       className="text-gray-500 hover:text-gray-700"
//                       asChild
//                     >
//                       <Link href={`/email/compose/${email.id}`}>
//                         <Edit className="h-4 w-4 mr-1" />
//                         Edit
//                       </Link>
//                     </Button>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       className="text-red-500 hover:text-red-700"
//                       onClick={() => {
//                         setSelectedEmails([email.id]);
//                         deleteDrafts();
//                       }}
//                     >
//                       <Trash2 className="h-4 w-4 mr-1" />
//                       Delete
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default EmailDraft;















