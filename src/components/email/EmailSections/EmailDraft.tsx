import { useEmailStore } from "@/lib/store/email-store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, Trash2, Send, Archive, Edit, RefreshCw } from "lucide-react";
import { useState, useEffect, useContext, useCallback } from "react";
import { Email, EmailCategory } from "@/lib/types/email";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { getCookie, getAuthToken } from "@/lib/utils/cookies"; // Import cookie functions
import axios from "axios";
import { AuthContext } from "@/lib/context/auth";
import { useCombinedAuth } from "../../providers/useCombinedAuth";
import { ComposeModal } from "./ComposeModal";

interface EmailDraftProps {
  onBack?: () => void;
}

// Helper function to get access token from cookies
const getAccessToken = () => {
  return getAuthToken();
};

// Helper function to get linked email ID from cookies
const getLinkedEmailId = () => {
  return getCookie('linkedEmailId');
};

export const EmailDraft = ({ onBack }: EmailDraftProps) => {
  const { emails, updateDraft } = useEmailStore();
  
  // Move all hooks to the top level
  const { token, user } = useContext(AuthContext);
  const { djombi } = useCombinedAuth();
  
  const [apiDraftEmails, setApiDraftEmails] = useState<Email[]>([]);
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [sortNewest, setSortNewest] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add state for controlling the ComposeModal
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<Email | null>(null);

  // Add missing toggleSort function
  const toggleSort = () => {
    setSortNewest(!sortNewest);
  };

  // Helper function to process response data
  const processResponseData = (data: any) => {
    // Check if data contains emails (handle different response structures)
    let emailsData: any[] = [];

    if (Array.isArray(data)) {
      emailsData = data;
    } else if (data.data && Array.isArray(data.data)) {
      emailsData = data.data;
    } else if (data.drafts && Array.isArray(data.drafts)) {
      emailsData = data.drafts;
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
    const formattedEmails = emailsData.map((email: any) => ({
      ...email,
      id: email.id || email._id || `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      content: email.content || '',
      createdAt: email.createdAt || email.created_at || Date.now(),
      status: "draft"
    }));

    setApiDraftEmails(formattedEmails);
  };

  // Use useCallback to memoize the function and include dependencies
  const fetchDraftEmails = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Token retrieved:", token ? `${token.access_token.substring(0, 10)}...` : 'No token found');

      const djombiTokens = djombi.token || "";

      if (!token) {
        throw new Error('No access token available');
      }

      // Get linked email ID from cookies
      const linkedEmailId = getLinkedEmailId();
      console.log("Linked Email ID:", linkedEmailId);

      if (!linkedEmailId) {
        throw new Error('No linked email ID found');
      }

      // Use axios instead of fetch for GET request
      const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
      console.log("Fetching from API endpoint:", apiEndpoint);

      try {
        const response = await axios.get(apiEndpoint, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${djombiTokens}`
          }
        });

        console.log("GET response data:", response.data);
        processResponseData(response.data);
      } catch (getError) {
        console.log("GET request failed:", getError);

        // Alternative: Use POST if the API requires sending data in the body
        const postEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts';
        console.log("Trying POST request to:", postEndpoint);

        try {
          const postResponse = await axios.post(postEndpoint,
            { email_id: linkedEmailId, content: "" }, // Adding empty content as POST requires it
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token.access_token}`
              }
            }
          );

          console.log("POST response data:", postResponse.data);

          // Check for success/error in POST response
          if (postResponse.data.success === false) {
            const errorMessage = postResponse.data.message || 'API request failed';
            console.error("API POST error:", errorMessage);
            throw new Error(`API POST error: ${errorMessage}`);
          }

          // Process the successful POST response
          processResponseData(postResponse.data);
        } catch (postError) {
          console.error("POST request also failed:", postError);
          throw postError;
        }
      }
    } catch (err) {
      console.error('Error fetching draft emails:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch draft emails');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, djombi.token]); // Add dependencies

  useEffect(() => {
    fetchDraftEmails();
  }, [fetchDraftEmails]); // Now fetchDraftEmails is included as dependency

  // Handle refresh button click
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDraftEmails();
  };

  // Sort and filter emails
  const sortedAndFilteredEmails = [...apiDraftEmails]
    .filter(email => {
      if (!filterDate) return true;
      const emailDate = new Date(email.timestamp ?? Date.now()).toDateString();
      return emailDate === filterDate;
    })
    .sort((a, b) => {
      const dateA = new Date(a.timestamp ?? Date.now()).getTime();
      const dateB = new Date(b.timestamp ?? Date.now()).getTime();
      return sortNewest ? dateB - dateA : dateA - dateB;
    });

  const toggleSelectEmail = (id: string) => {
    setSelectedEmails(prev =>
      prev.includes(id)
        ? prev.filter(emailId => emailId !== id)
        : [...prev, id]
    );
  };

  const selectAllEmails = () => {
    if (selectedEmails.length === sortedAndFilteredEmails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(sortedAndFilteredEmails.map(email => email.id || ''));
    }
  };

  // Use useCallback for deleteDrafts to access hooks at component level
  const deleteDrafts = useCallback(async () => {
    if (selectedEmails.length === 0) return;

    try {
      if (!token) {
        throw new Error('No access token found');
      }

      // Use axios for DELETE requests
      const deletePromises = selectedEmails.map(id =>
        axios.delete(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/${id}`, {
          headers: {
            'Authorization': `Bearer ${token.access_token}`,
            'Content-Type': 'application/json'
          }
        }).catch(error => {
          console.log(`DELETE request failed for ID ${id}:`, error);
          return { status: error.response?.status || 500, ok: false };
        })
      );

      const responses = await Promise.all(deletePromises);

      // If any DELETE requests failed, try with POST method for deletion
      const failedDeletes = responses.filter(response => !response.status || response.status >= 400);

      if (failedDeletes.length > 0) {
        console.log(`${failedDeletes.length} DELETE requests failed. Trying alternative approach...`);

        // Try POST method for deletion if supported by your API
        const alternativePromises = selectedEmails.map(id =>
          axios.post(`https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/delete`,
            { draft_id: id },  // FIXED: Only send draft_id without email_id
            {
              headers: {
                'Authorization': `Bearer ${token.access_token}`,
                'Content-Type': 'application/json'
              }
            }
          ).catch(error => {
            console.log(`POST delete request failed for ID ${id}:`, error);
            return { status: error.response?.status || 500, ok: false };
          })
        );

        const alternativeResponses = await Promise.all(alternativePromises);
        const stillFailedDeletes = alternativeResponses.filter(response => !response.status || response.status >= 400);

        if (stillFailedDeletes.length > 0) {
          throw new Error(`Failed to delete ${stillFailedDeletes.length} drafts using alternative method`);
        }
      }

      // Remove deleted emails from state
      setApiDraftEmails(prev =>
        prev.filter(email => !selectedEmails.includes(email.id || ''))
      );

      // Clear selection
      setSelectedEmails([]);

    } catch (err) {
      console.error('Error deleting drafts:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete drafts');
    }
  }, [selectedEmails, token]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Update draft using axios instead of fetch
  const updateDraftInApi = useCallback(async (draftId: string, updatedData: any) => {
    try {
      if (!token) {
        throw new Error('No access token found');
      }

      // Use PUT request with axios to update the existing draft
      const response = await axios.put(
        `https://email-service-latest-agqz.onrender.com/api/v1/emails/drafts/${draftId}`,
        updatedData,
        {
          headers: {
            'Authorization': `Bearer ${token.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update the local state with the updated draft
      const updatedEmail = response.data;
      console.log('Draft updated successfully:', updatedEmail);

      setApiDraftEmails(prev =>
        prev.map(email =>
          email.id === draftId ? { ...email, ...updatedData } : email
        )
      );

      return updatedEmail;
    } catch (err) {
      console.error('Error updating draft:', err);
      throw err;
    }
  }, [token]);

  // Handler to open ComposeModal with selected draft data
  const handleEditDraft = (email: Email) => {
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
  const handleComposeModalClose = (savedDraft?: Email) => {
    setIsComposeModalOpen(false);

    // If a draft was saved and it's an edit (has an ID), update the local state
    if (savedDraft && selectedDraft && savedDraft.id === selectedDraft.id) {
      setApiDraftEmails(prev =>
        prev.map(email =>
          email.id === savedDraft.id ? savedDraft : email
        )
      );
    }

    setSelectedDraft(null);
  };

  // Handler for saving draft changes
  const handleSaveDraft = async (draftData: Email) => {
    try {
      if (draftData.id) {
        // Update existing draft
        await updateDraftInApi(draftData.id, {
          to: draftData.to,
          subject: draftData.subject,
          content: draftData.content
        });

        // Update local state
        setApiDraftEmails(prev =>
          prev.map(email =>
            email.id === draftData.id ? draftData : email
          )
        );
      }
    } catch (err) {
      console.error('Error saving draft:', err);
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto pb-4">
      {/* Header */}
      <div className="border rounded-lg bg-white overflow-hidden h-[calc(100vh-120px)]">
        <div className="sticky top-0 bg-background z-10 p-4 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {onBack && (
                <Button variant="ghost" size="icon" onClick={onBack}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <h1 className="text-xl font-semibold">Drafts</h1>
            </div>
            <div className="flex items-center space-x-2">
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
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Email List */}
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
          ) : sortedAndFilteredEmails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No draft emails found
            </div>
          ) : (
            <div className="space-y-0">
              <div className="p-2 flex items-center bg-gray-50 border-b">
                <Checkbox
                  checked={selectedEmails.length === sortedAndFilteredEmails.length && sortedAndFilteredEmails.length > 0}
                  onCheckedChange={selectAllEmails}
                  className="ml-4"
                />
                {selectedEmails.length > 0 && (
                  <div className="ml-4 flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={deleteDrafts}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>

              {sortedAndFilteredEmails.map((email) => (
                <div
                  key={email.id || `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`}
                  className={`flex items-center px-4 py-3 border-b last:border-b-0 hover:bg-slate-50 transition-colors cursor-pointer ${selectedEmails.includes(email.id || '') ? 'bg-blue-50' : ''}`}
                >
                  <div className="mr-3">
                    <Checkbox
                      checked={selectedEmails.includes(email.id || '')}
                      onCheckedChange={() => { }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectEmail(email.id || '');
                      }}
                    />
                  </div>
                  <div
                    className="flex-1 grid grid-cols-12 gap-2"
                    onClick={() => handleEditDraft(email)}
                  >
                    <div className="col-span-2 text-sm text-gray-600 truncate pr-2">
                      To: {email.to}
                    </div>
                    <div className="col-span-7 flex items-center">
                      <div className="text-sm truncate">
                        <span className="font-medium">{email.subject}</span>
                        {email.content && (
                          <span className="text-gray-500"> - {email.content}</span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-3 text-right text-sm text-gray-500">
                      {formatDate((email as any).timestamp?.toString())}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditDraft(email);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEmails([email.id || '']);
                        deleteDrafts();
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
    </div>
  );
};

export default EmailDraft;




































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















