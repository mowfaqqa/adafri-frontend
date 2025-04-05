import { useEmailStore } from "@/store/email-store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, Trash2, Send, Archive } from "lucide-react";
import { useState, useEffect } from "react";
import { Email, EmailCategory } from "@/lib/types/email";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";           
import { getAuthToken, getCookie, isAuthenticated } from "@/lib/utils/cookies"; // Import cookie utilities

interface EmailSpamProps {
    onBack?: () => void;
}

export const EmailSpam = ({ onBack }: EmailSpamProps) => {
    const { emails } = useEmailStore();
    const [apiSpamEmails, setApiSpamEmails] = useState<Email[]>([]);
    const [filterDate, setFilterDate] = useState<string | null>(null);
    const [sortNewest, setSortNewest] = useState(true);
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSpamEmails = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Get token from cookies instead of localStorage
                const token = getAuthToken();
                console.log("Token retrieved:", token ? `${token.substring(0, 10)}...` : 'No token found');

                if (!token) {
                    throw new Error('No access token available');
                }

                // Get linked email ID from cookies instead of localStorage
                const linkedEmailId = getCookie('linkedEmailId');
                console.log("Linked Email ID:", linkedEmailId);

                if (!linkedEmailId) {
                    throw new Error('No linked email ID found');
                }

                // Use query parameters with GET request for spam emails
                const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/spam?email_id=${encodeURIComponent(linkedEmailId)}`;
                console.log("Fetching from API endpoint:", apiEndpoint);

                const response = await fetch(apiEndpoint, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                    // No body for GET requests
                });

                // If the GET request fails, try with POST instead
                if (!response.ok) {
                    console.log("GET request failed with status:", response.status);

                    // Alternative: Use POST if the API requires sending data in the body
                    const postEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/spam';
                    console.log("Trying POST request to:", postEndpoint);

                    const postResponse = await fetch(postEndpoint, {
                        method: 'POST', // Change to POST for body
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
                console.error('Error fetching spam emails:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch spam emails');
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
            } else if (data.spam && Array.isArray(data.spam)) {
                emailsData = data.spam;
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
                id: email.id || email._id || `spam-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                content: email.content || email.body?.content || '',
                createdAt: email.createdAt || email.created_at || Date.now(),
                status: "spam"
            }));

            setApiSpamEmails(formattedEmails);
        };

        fetchSpamEmails();
    }, []);

    // Sort and filter emails
    const sortedAndFilteredEmails = [...apiSpamEmails]
    .filter(email => {
        if (!filterDate) return true;
        const emailDate = new Date((email as any).createdAt ?? Date.now()).toDateString();
        return emailDate === filterDate;
      })
      .sort((a, b) => {
        const dateA = new Date((a as any).createdAt ?? Date.now()).getTime();
        const dateB = new Date((b as any).createdAt ?? Date.now()).getTime();
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

    const deleteSpam = async () => {
        if (selectedEmails.length === 0) return;

        try {
            // Get token and email ID from cookies
            const token = getAuthToken();
            const linkedEmailId = getCookie('linkedEmailId');

            if (!token) {
                throw new Error('No access token found');
            }

            if (!linkedEmailId) {
                throw new Error('No linked email ID found');
            }

            // Direct API call with proper endpoint for deleting spam emails
            const responses = await Promise.all(
                selectedEmails.map(id =>
                    fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/spam/${id}?email_id=${encodeURIComponent(linkedEmailId)}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    })
                )
            );

            // If any DELETE requests failed, try with POST method for deletion
            const failedDeletes = responses.filter(response => !response.ok);

            if (failedDeletes.length > 0) {
                console.log(`${failedDeletes.length} DELETE requests failed. Trying alternative approach...`);

                // Try POST method for deletion if supported by your API
                const alternativeResponses = await Promise.all(
                    selectedEmails.map(id =>
                        fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/spam/delete`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                email_id: linkedEmailId,
                                spam_id: id
                            })
                        })
                    )
                );

                const stillFailedDeletes = alternativeResponses.filter(response => !response.ok);
                if (stillFailedDeletes.length > 0) {
                    throw new Error(`Failed to delete ${stillFailedDeletes.length} spam emails using alternative method`);
                }
            }

            // Remove deleted emails from state
            setApiSpamEmails(prev =>
                prev.filter(email => !selectedEmails.includes(email.id || ''))
            );

            // Clear selection
            setSelectedEmails([]);

        } catch (err) {
            console.error('Error deleting spam emails:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete spam emails');
        }
    };

    const notSpam = async () => {
        if (selectedEmails.length === 0) return;

        try {
            // Get token and email ID from cookies
            const token = getAuthToken();
            const linkedEmailId = getCookie('linkedEmailId');

            if (!token) {
                throw new Error('No access token found');
            }

            if (!linkedEmailId) {
                throw new Error('No linked email ID found');
            }

            // Mark emails as not spam (move to inbox)
            const responses = await Promise.all(
                selectedEmails.map(id =>
                    fetch(`https://email-service-latest-agqz.onrender.com/api/v1/emails/spam/${id}/notspam`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            email_id: linkedEmailId
                        })
                    })
                )
            );

            const failedRequests = responses.filter(response => !response.ok);
            if (failedRequests.length > 0) {
                throw new Error(`Failed to mark ${failedRequests.length} emails as not spam`);
            }

            // Remove moved emails from state
            setApiSpamEmails(prev =>
                prev.filter(email => !selectedEmails.includes(email.id || ''))
            );

            // Clear selection
            setSelectedEmails([]);

        } catch (err) {
            console.error('Error marking emails as not spam:', err);
            setError(err instanceof Error ? err.message : 'Failed to mark emails as not spam');
        }
    };

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

    return (
        <div className="flex flex-col rounded-lg h-full bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-4">
                    {onBack && (
                        <Button variant="ghost" size="icon" onClick={onBack}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <h1 className="text-xl font-semibold">Spam</h1>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => setSortNewest(!sortNewest)}
                    >
                        <Filter className="h-4 w-4" />
                        {sortNewest ? 'Newest' : 'Oldest'}
                    </Button>
                </div>
            </div>

            {/* Email List */}
            <div className="flex-grow overflow-auto">
                {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
                    </div>
                ) : error ? (
                    <div className="p-4 text-red-500">{error}</div>
                ) : sortedAndFilteredEmails.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p>No spam emails found</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        <div className="p-2 flex items-center bg-gray-50">
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
                                        onClick={notSpam}
                                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                        <Send className="h-4 w-4 mr-1" />
                                        Not Spam
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={deleteSpam}
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
                                key={email.id || `spam-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`}
                                className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedEmails.includes(email.id || '') ? 'bg-blue-50' : ''}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3 flex-grow">
                                        <div>
                                            <Checkbox
                                                checked={selectedEmails.includes(email.id || '')}
                                                onCheckedChange={() => toggleSelectEmail(email.id || '')}
                                            />
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex-1 grid grid-cols-12 gap-2">
                                                <div className="col-span-2 text-sm font-medium text-gray-600">
                                                    {email.from}
                                                </div>
                                                <div className="col-span-7 flex items-center">
                                                    <div className="text-sm truncate">
                                                        <span className="font-medium">{email.subject}</span> - {email.content}
                                                    </div>
                                                </div>
                                                <div className="col-span-3 text-right text-sm text-gray-500">
                                                    {formatDate((email as any).createdAt?.toString())}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 ml-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-blue-500 hover:text-blue-700"
                                            onClick={() => {
                                                setSelectedEmails([email.id || '']);
                                                notSpam();
                                            }}
                                        >
                                            <Send className="h-4 w-4 mr-1" />
                                            Not Spam
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700"
                                            onClick={() => {
                                                setSelectedEmails([email.id || '']);
                                                deleteSpam();
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailSpam;