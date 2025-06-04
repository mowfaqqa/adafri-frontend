/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useContext } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { EmailCard } from "./EmailCard";
import { getCookie, getAuthToken } from "@/lib/utils/cookies";
import { AuthContext } from "@/lib/context/auth";

// Define types
interface Email {
    id: string;
    subject: string;
    content: string;
    from: string;
    to: string;
    timestamp: string;
    status: string;
    isUrgent: boolean;
    hasAttachment: boolean;
    category: string;
    isRead: boolean;
}

interface EmailColumn {
    id: string;
    title: string;
}

const ProfessionalEmailInbox = () => {
    // State
    const [emails, setEmails] = useState<Email[]>([]);
    const [columns, setColumns] = useState<EmailColumn[]>([
        { id: "inbox", title: "Inbox" },
        { id: "urgent", title: "Urgent" },
        { id: "archive", title: "Archive" }
    ]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newColumnName, setNewColumnName] = useState("");
    const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const { token, user } = useContext(AuthContext);
    // Fetch emails
    useEffect(() => {
        const fetchEmails = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Get token from cookies using the utility function
                console.log("Token retrieved:", token ? `${token.access_token.substring(0, 10)}...` : 'No token found');

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

                const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(linkedEmailId)}`;
                console.log("Fetching from API endpoint:", apiEndpoint);

                const response = await fetch(apiEndpoint, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token.access_token}`
                    }
                });

                // If the GET request fails, try with POST instead
                // if (!response.ok) {
                //     console.log("GET request failed with status:", response.status);

                //     // Alternative: Use POST if the API requires sending data in the body
                //     const postEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox';
                //     console.log("Trying POST request to:", postEndpoint);

                //     const postResponse = await fetch(postEndpoint, {
                //         method: 'POST',
                //         headers: {
                //             'Content-Type': 'application/json',
                //             'Authorization': `Bearer ${token}`
                //         },
                //         body: JSON.stringify({
                //             email_id: linkedEmailId
                //         })
                //     });

                //     // Process the POST response
                //     const postResponseText = await postResponse.text();
                //     console.log("POST raw response:", postResponseText);

                //     let postData;
                //     try {
                //         postData = JSON.parse(postResponseText);
                //         console.log("POST parsed response data:", postData);
                //     } catch (e) {
                //         console.error("Failed to parse POST response as JSON:", e);
                //         throw new Error(`Invalid POST response format: ${postResponseText.substring(0, 100)}...`);
                //     }

                //     // Check for success/error in POST response
                //     if (!postResponse.ok || postData.success === false) {
                //         const errorMessage = postData.message || postResponse.statusText;
                //         console.error("API POST error:", errorMessage);
                //         throw new Error(`API POST error: ${errorMessage}`);
                //     }

                //     // Process the successful POST response
                //     const formattedEmails = processEmailData(postData);
                //     setEmails(formattedEmails);
                //     return;
                // }

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

                const formattedEmails = processEmailData(data);
                setEmails(formattedEmails);
            } catch (err) {
                console.error('Error fetching emails:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch emails');
            } finally {
                setIsLoading(false);
            }
        };

        fetchEmails();
    }, []);

    // Process email data from API response
    const processEmailData = (data: any): Email[] => {
        // Determine where the email array is located in the response
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

        // Format emails with consistent structure
        return emailsData.map((email: any) => ({
            id: email.id || email._id || `email-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            subject: email.subject || 'No Subject',
            content: email.content || email.body?.content || '',
            from: email.from || email.sender || 'Unknown Sender',
            to: email.to || email.recipient || '',
            timestamp: email.timestamp || email.createdAt || email.created_at || new Date().toISOString(),
            status: email.isUrgent ? "urgent" : "inbox",
            isUrgent: Boolean(email.isUrgent || email.is_urgent),
            hasAttachment: Boolean(email.hasAttachment || email.has_attachment),
            category: email.category || "inbox",
            isRead: Boolean(email.isRead || email.is_read)
        }));
    };

    // Handle adding a new column
    const handleAddColumn = () => {
        if (newColumnName.trim()) {
            const newColumnId = newColumnName.toLowerCase().replace(/\s+/g, '-');

            // Check if column with same id already exists
            if (columns.some(col => col.id === newColumnId)) {
                toast.error("A column with a similar name already exists.");
                return;
            }

            setColumns([...columns, { id: newColumnId, title: newColumnName }]);
            setNewColumnName("");
            setShowNewColumnDialog(false);
            toast.success(`Created new "${newColumnName}" column`);
        }
    };

    // Handle drag start
    const handleDragStart = () => {
        setIsDragging(true);
    };

    // Handle drag end
    const handleDragEnd = (result: DropResult) => {
        setIsDragging(false);

        // Check if there's no destination or if the item was dropped outside a droppable
        if (!result.destination) {
            return;
        }

        const { draggableId, source, destination } = result;
        const emailId = draggableId;
        const sourceColumnId = source.droppableId;
        const destinationColumnId = destination.droppableId;

        // Don't do anything if dropped in same location
        if (sourceColumnId === destinationColumnId && source.index === destination.index) {
            return;
        }

        // Update email status
        setEmails(prevEmails => {
            const updatedEmails = prevEmails.map(email => {
                if (email.id === emailId) {
                    return { ...email, status: destinationColumnId };
                }
                return email;
            });

            // Optional: Save updated emails to backend
            // saveEmailStatus(emailId, destinationColumnId);

            return updatedEmails;
        });

        // Show a success message
        const destinationColumn = columns.find(col => col.id === destinationColumnId);
        toast.success(`Email moved to ${destinationColumn?.title || destinationColumnId}`);
    };

    // Optional: Save updated email status to backend
    const saveEmailStatus = async (emailId: string, newStatus: string) => {
        try {
            // const token = getAuthToken();
            const { token, user } = useContext(AuthContext);
            if (!token) return;

            // Implement API call to update email status
            // This is a placeholder for where you'd implement the actual API call
            console.log(`Updating email ${emailId} status to ${newStatus}`);

            // Example API call implementation:
            /*
            await fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email_id: emailId,
                    status: newStatus
                })
            });
            */
        } catch (error) {
            console.error('Error saving email status:', error);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    // Error state
    // if (error) {
    //     return (
    //         <div className="p-4 text-red-500">
    //             <p>Error loading emails: {error}</p>
    //             <button
    //                 className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    //                 onClick={() => window.location.reload()}
    //             >
    //                 Try Again
    //             </button>
    //         </div>
    //     );
    // }

    if (error) {
        if (error === 'No linked email ID found') {
            console.error('Error loading emails: No linked email ID found');
            return (
                <div className="flex flex-col justify-center items-center h-full py-10 text-center space-y-4">
                    <img src="/icons/emailnew.png" alt="No Linked Email" className="w-100 h-70" />
                    <p className="text-gray-600 text-lg">Please link an email to continue</p>
                </div>
            );
        }

        return (
            <div className="p-4 text-red-500">
                <p>Error loading emails: {error}</p>
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
        <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
            <div className="relative w-full h-full overflow-x-auto pb-4">
                <div className="flex gap-4 w-max">
                    {columns.map((column) => (
                        <Droppable key={column.id} droppableId={column.id}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`min-w-[350px] w-[350px] max-w-[350px] p-4 rounded-lg border ${snapshot.isDraggingOver
                                            ? "border-blue-400 bg-blue-50"
                                            : "border-gray-200"
                                        } transition-colors duration-200`}
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-semibold">{column.title}</h3>
                                        <span className="text-xs text-gray-500">
                                            {emails.filter(email => email.status === column.id).length} emails
                                        </span>
                                    </div>

                                    <div className="space-y-3 min-h-[100px]">
                                        {emails
                                            .filter((email) => email.status === column.id)
                                            .map((email, index) => (
                                                <Draggable
                                                    key={email.id}
                                                    draggableId={email.id}
                                                    index={index}
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`${snapshot.isDragging ? "shadow-lg" : ""}`}
                                                            style={{
                                                                ...provided.draggableProps.style,
                                                                opacity: snapshot.isDragging ? 0.8 : 1,
                                                            }}
                                                        >
                                                            <EmailCard email={email} index={index} />
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                        {provided.placeholder}
                                    </div>

                                    {emails.filter(email => email.status === column.id).length === 0 && !snapshot.isDraggingOver && (
                                        <div className="h-24 border border-dashed border-gray-300 rounded-md flex items-center justify-center">
                                            <p className="text-sm text-gray-400">Drop emails here</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Droppable>
                    ))}

                    {/* Add Column Button - positioned after all existing columns */}
                    <div className="min-w-[100px] flex items-start pt-4">
                        <Dialog open={showNewColumnDialog} onOpenChange={setShowNewColumnDialog}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="h-10">
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Column
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Column</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                    <Input
                                        placeholder="Column Name"
                                        value={newColumnName}
                                        onChange={(e) => setNewColumnName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleAddColumn();
                                            }
                                        }}
                                    />
                                    <Button onClick={handleAddColumn}>
                                        Create Column
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>
        </DragDropContext>
    );
};

export default ProfessionalEmailInbox;












// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";
// import { useState, useEffect } from "react";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// import { Plus } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { toast } from "sonner";
// import { EmailCard } from "./EmailCard";
// import { getCookie, getAuthToken } from "@/lib/utils/cookies";

// // Define types
// interface Email {
//     id: string;
//     subject: string;
//     content: string;
//     from: string;
//     to: string;
//     timestamp: string;
//     status: string;
//     isUrgent: boolean;
//     hasAttachment: boolean;
//     category: string;
//     isRead: boolean;
// }

// interface EmailColumn {
//     id: string;
//     title: string;
// }

// const ProfessionalEmailInbox = () => {
//     // State
//     const [emails, setEmails] = useState<Email[]>([]);
//     const [columns, setColumns] = useState<EmailColumn[]>([
//         { id: "inbox", title: "Inbox" },
//         { id: "urgent", title: "Urgent" },
//         { id: "archive", title: "Archive" }
//     ]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [newColumnName, setNewColumnName] = useState("");
//     const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);

//     // Fetch emails
//     useEffect(() => {
//         const fetchEmails = async () => {
//             setIsLoading(true);
//             setError(null);

//             try {
//                 // Get token from cookies using the utility function
//                 const token = getAuthToken();
//                 console.log("Token retrieved:", token ? `${token.substring(0, 10)}...` : 'No token found');

//                 if (!token) {
//                     throw new Error('No access token available');
//                 }

//                 // Get linked email ID from cookies or localStorage as fallback
//                 const linkedEmailId = getCookie('linkedEmailId') ||
//                     (typeof window !== 'undefined' ? localStorage.getItem('linkedEmailId') : null);
//                 console.log("Linked Email ID:", linkedEmailId);

//                 if (!linkedEmailId) {
//                     throw new Error('No linked email ID found');
//                 }

//                 const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(linkedEmailId)}`;
//                 console.log("Fetching from API endpoint:", apiEndpoint);

//                 const response = await fetch(apiEndpoint, {
//                     method: 'GET',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'Authorization': `Bearer ${token}`
//                     }
//                 });

//                 // If the GET request fails, try with POST instead
//                 if (!response.ok) {
//                     console.log("GET request failed with status:", response.status);

//                     // Alternative: Use POST if the API requires sending data in the body
//                     const postEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox';
//                     console.log("Trying POST request to:", postEndpoint);

//                     const postResponse = await fetch(postEndpoint, {
//                         method: 'POST',
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
//                     const formattedEmails = processEmailData(postData);
//                     setEmails(formattedEmails);
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

//                 const formattedEmails = processEmailData(data);
//                 setEmails(formattedEmails);
//             } catch (err) {
//                 console.error('Error fetching emails:', err);
//                 setError(err instanceof Error ? err.message : 'Failed to fetch emails');
//             } finally {
//                 setIsLoading(false);
//             }
//         };

//         fetchEmails();
//     }, []);

//     // Process email data from API response
//     const processEmailData = (data: any): Email[] => {
//         // Determine where the email array is located in the response
//         let emailsData: any[] = [];

//         if (Array.isArray(data)) {
//             emailsData = data;
//         } else if (data.data && Array.isArray(data.data)) {
//             emailsData = data.data;
//         } else if (data.emails && Array.isArray(data.emails)) {
//             emailsData = data.emails;
//         } else if (data.inbox && Array.isArray(data.inbox)) {
//             emailsData = data.inbox;
//         } else {
//             console.log("Response structure different than expected:", data);
//             // Look for any array in the response that might contain emails
//             for (const key in data) {
//                 if (Array.isArray(data[key]) && data[key].length > 0) {
//                     console.log(`Found array in response at key: ${key}`, data[key]);
//                     emailsData = data[key];
//                     break;
//                 }
//             }
//         }

//         if (emailsData.length > 0) {
//             console.log("Sample email data structure:", emailsData[0]);
//         }

//         // Format emails with consistent structure
//         return emailsData.map((email: any) => ({
//             id: email.id || email._id || `email-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
//             subject: email.subject || 'No Subject',
//             content: email.content || email.body?.content || '',
//             from: email.from || email.sender || 'Unknown Sender',
//             to: email.to || email.recipient || '',
//             timestamp: email.timestamp || email.createdAt || email.created_at || new Date().toISOString(),
//             status: email.isUrgent ? "urgent" : "inbox",
//             isUrgent: Boolean(email.isUrgent || email.is_urgent),
//             hasAttachment: Boolean(email.hasAttachment || email.has_attachment),
//             category: email.category || "inbox",
//             isRead: Boolean(email.isRead || email.is_read)
//         }));
//     };

//     // Handle adding a new column
//     const handleAddColumn = () => {
//         if (newColumnName.trim()) {
//             const newColumnId = newColumnName.toLowerCase().replace(/\s+/g, '-');

//             // Check if column with same id already exists
//             if (columns.some(col => col.id === newColumnId)) {
//                 toast.error("A column with a similar name already exists.");
//                 return;
//             }

//             setColumns([...columns, { id: newColumnId, title: newColumnName }]);
//             setNewColumnName("");
//             setShowNewColumnDialog(false);
//             toast.success(`Created new "${newColumnName}" column`);
//         }
//     };

//     // Handle drag and drop
//     const handleDragEnd = (result: any) => {
//         if (!result.destination) return;

//         const { draggableId, source, destination } = result;
//         const emailId = draggableId;
//         const destinationColumnId = destination.droppableId;

//         // Don't do anything if dropped in same location
//         if (source.droppableId === destination.droppableId && source.index === destination.index) {
//             return;
//         }

//         // Update email status
//         setEmails(prevEmails => {
//             return prevEmails.map(email => {
//                 if (email.id === emailId) {
//                     return { ...email, status: destinationColumnId };
//                 }
//                 return email;
//             });
//         });

//         toast.success(`Email moved to ${columns.find(col => col.id === destinationColumnId)?.title || destinationColumnId}`);
//     };

//     // Loading state
//     if (isLoading) {
//         return (
//             <div className="flex justify-center items-center h-full py-10">
//                 <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
//             </div>
//         );
//     }

//     // Error state
//     if (error) {
//         return (
//             <div className="p-4 text-red-500">
//                 <p>Error loading emails: {error}</p>
//                 <button
//                     className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//                     onClick={() => window.location.reload()}
//                 >
//                     Try Again
//                 </button>
//             </div>
//         );
//     }

//     return (
//         <DragDropContext onDragEnd={handleDragEnd}>
//             <div className="relative w-full h-full overflow-x-auto pb-4">
//                 <div className="flex gap-4 w-max">
//                     {columns.map((column) => (
//                         <Droppable key={column.id} droppableId={column.id}>
//                             {(provided) => (
//                                 <div
//                                     ref={provided.innerRef}
//                                     {...provided.droppableProps}
//                                     className="min-w-[350px] w-[350px] max-w-[350px] p-4 rounded-lg border border-gray-200"
//                                 >
//                                     <div className="flex justify-between items-center mb-4">
//                                         <h3 className="font-semibold">{column.title}</h3>
//                                         <span className="text-xs text-gray-500">
//                                             {emails.filter(email => email.status === column.id).length} emails
//                                         </span>
//                                     </div>

//                                     <div className="space-y-3">
//                                         {emails
//                                             .filter((email) => email.status === column.id)
//                                             .map((email, index) => (
//                                                 <Draggable
//                                                     key={email.id}
//                                                     draggableId={email.id}
//                                                     index={index}
//                                                 >
//                                                     {(provided, snapshot) => (
//                                                         <div
//                                                             ref={provided.innerRef}
//                                                             {...provided.draggableProps}
//                                                             {...provided.dragHandleProps}
//                                                             style={{
//                                                                 ...provided.draggableProps.style,
//                                                                 opacity: snapshot.isDragging ? 0.8 : 1,
//                                                             }}
//                                                         >
//                                                             <EmailCard email={email} index={index} />
//                                                         </div>
//                                                     )}
//                                                 </Draggable>
//                                             ))}
//                                     </div>

//                                     {provided.placeholder}

//                                     {emails.filter(email => email.status === column.id).length === 0 && (
//                                         <div className="h-24 border border-dashed border-gray-300 rounded-md flex items-center justify-center">
//                                             <p className="text-sm text-gray-400">Drop emails here</p>
//                                         </div>
//                                     )}
//                                 </div>
//                             )}
//                         </Droppable>
//                     ))}

//                     {/* Add Column Button - positioned after all existing columns */}
//                     <div className="min-w-[100px] flex items-start pt-4">
//                         <Dialog open={showNewColumnDialog} onOpenChange={setShowNewColumnDialog}>
//                             <DialogTrigger asChild>
//                                 <Button variant="outline" className="h-10">
//                                     <Plus className="w-4 h-4 mr-2" />
//                                     New Column
//                                 </Button>
//                             </DialogTrigger>
//                             <DialogContent>
//                                 <DialogHeader>
//                                     <DialogTitle>Create New Column</DialogTitle>
//                                 </DialogHeader>
//                                 <div className="space-y-4 mt-4">
//                                     <Input
//                                         placeholder="Column Name"
//                                         value={newColumnName}
//                                         onChange={(e) => setNewColumnName(e.target.value)}
//                                     />
//                                     <Button onClick={handleAddColumn}>
//                                         Create Column
//                                     </Button>
//                                 </div>
//                             </DialogContent>
//                         </Dialog>
//                     </div>
//                 </div>
//             </div>
//         </DragDropContext>
//     );
// };

// export default ProfessionalEmailInbox;