/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useContext, useCallback } from "react";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { toast } from "sonner";
import { getSelectedLinkedEmailId, getSelectedLinkedEmailType } from "@/lib/utils/cookies";
import { AuthContext } from "@/lib/context/auth";
import { Email, EmailColumn as EmailColumnType, EmailCompose, EmailFilter, EmailAccountType, PaginationState } from "@/lib/types/email";
import { useCombinedAuth } from "@/components/providers/useCombinedAuth";

// Import our components
import SearchFilterBar from "./SearchFilterBar";
import { LoadingState, ErrorState, NoEmailState } from "./InboxStates";
import EmailBoard from "./EmailBoard";
import { ComposeModal } from "../AddEmailComponents/ComposeModal";
import { useEmailStore } from "@/store/email-store";
import { useEmailAccountListener } from "@/lib/hooks/email/useEmailAccountListener";

const ProfessionalEmailInbox = () => {
    // Move all hooks to the top level
    const { token, user } = useContext(AuthContext);
    const { djombi } = useCombinedAuth();
    const djombiTokens = djombi.token || "";

    // Get email store methods including moveEmail and updateEmailStatus
    const { 
        emails, 
        isLoading, 
        loadingError, 
        activeCategory,
        setActiveCategory,
        fetchEmails,
        moveEmail,
        updateEmailStatus,
        setEmails, // For direct state updates if needed
        getCustomColumns,
        saveCustomColumns
    } = useEmailStore();

    // Get current selected email info from cookies
    const currentSelectedEmailId = getSelectedLinkedEmailId();
    const currentSelectedEmailType = getSelectedLinkedEmailType();

    // FIXED: Use persistence manager for columns instead of localStorage directly
    const [columns, setColumns] = useState<EmailColumnType[]>([]);
    
    const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);
    const [showComposeDialog, setShowComposeDialog] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [emailAccountType, setEmailAccountType] = useState<EmailAccountType>("personal");
    const [emailFilter, setEmailFilter] = useState<EmailFilter>({
        searchTerm: "",
        dateRange: "all",
        hasAttachment: null,
        isRead: null
    });
    const [composeEmail, setComposeEmail] = useState<EmailCompose>({
        to: "",
        subject: "",
        content: ""
    });
    const [pagination, setPagination] = useState<PaginationState>({});
    const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
    const [editingColumnName, setEditingColumnName] = useState("");

    const itemsPerPage = 12;

    // Listen for email account changes
    useEmailAccountListener({
        onEmailAccountChange: (detail) => {
            console.log('Inbox component received email account change:', detail);
            // Update email account type based on the selection
            setEmailAccountType(detail.accountType as EmailAccountType);
            
            // FIXED: Reload columns for the new account
            loadColumnsForAccount();
        },
        onRefreshNeeded: () => {
            // The email store will handle the refresh automatically
            console.log('Email account changed, store will refresh automatically');
            
            // FIXED: Also reload columns when refresh is needed
            loadColumnsForAccount();
        }
    });

    // FIXED: Load columns from persistence manager
    const loadColumnsForAccount = useCallback(() => {
        try {
            const loadedColumns = getCustomColumns();
            console.log(`Loaded ${loadedColumns.length} columns for current account`);
            setColumns(loadedColumns);
        } catch (error) {
            console.error('Error loading columns for account:', error);
            // Fallback to default columns
            const defaultColumns = [
                { id: "inbox", title: "Inbox", icon: "📧", gradient: "from-blue-500 to-cyan-500" },
                { id: "urgent", title: "Urgent", icon: "🚨", gradient: "from-red-500 to-orange-500" },
                { id: "follow-up", title: "Follow-Up", icon: "📁", gradient: "from-gray-500 to-slate-500" }
            ];
            setColumns(defaultColumns);
        }
    }, [getCustomColumns]);

    // Initialize pagination state for each column
    const initializePagination = (columns: EmailColumnType[]) => {
        const initialPagination: PaginationState = {};
        columns.forEach(column => {
            initialPagination[column.id] = {
                currentPage: 1,
                itemsPerPage: itemsPerPage
            };
        });
        setPagination(initialPagination);
    };

    // FIXED: Save columns using persistence manager instead of localStorage
    const saveColumnsToAccount = useCallback((columnsToSave: EmailColumnType[]) => {
        try {
            saveCustomColumns(columnsToSave);
            console.log(`Saved ${columnsToSave.length} columns for current account`);
        } catch (error) {
            console.error('Error saving columns for account:', error);
        }
    }, [saveCustomColumns]);

    // Save columns whenever they change
    useEffect(() => {
        if (columns.length > 0) {
            saveColumnsToAccount(columns);
        }
    }, [columns, saveColumnsToAccount]);

    // Filter emails based on filters
    const getFilteredEmails = (emails: Email[]): Email[] => {
        let filtered = [...emails];

        // Apply search filter
        if (emailFilter.searchTerm) {
            const searchTerm = emailFilter.searchTerm.toLowerCase();
            filtered = filtered.filter(email =>
                email.subject.toLowerCase().includes(searchTerm) ||
                email.from.toLowerCase().includes(searchTerm) ||
                email.content.toLowerCase().includes(searchTerm)
            );
        }

        // Apply attachment filter
        if (emailFilter.hasAttachment !== null) {
            filtered = filtered.filter(email => email.hasAttachment === emailFilter.hasAttachment);
        }

        // Apply read status filter
        if (emailFilter.isRead !== null) {
            filtered = filtered.filter(email => email.isRead === emailFilter.isRead);
        }

        return filtered;
    };

    const filteredEmails = getFilteredEmails(emails);

    // Handle pagination
    const handlePageChange = (columnId: string, page: number) => {
        setPagination(prev => ({
            ...prev,
            [columnId]: {
                ...prev[columnId],
                currentPage: page
            }
        }));
    };

    // Handle compose email
    const handleComposeEmail = (compose: EmailCompose) => {
        setComposeEmail(compose);
        setShowComposeDialog(true);
    };

    const handleSendEmail = async () => {
        try {
            // Implement your email sending logic here
            console.log("Sending email:", composeEmail);
            
            // For now, just show success message
            toast.success("Email sent successfully!");
            setShowComposeDialog(false);
            setComposeEmail({ to: "", subject: "", content: "" });
        } catch (error) {
            toast.error("Failed to send email");
        }
    };

    // Initialize component
    useEffect(() => {
        // Load columns for current account
        loadColumnsForAccount();
        
        // Check if we have a selected email and fetch inbox emails
        const selectedEmailId = getSelectedLinkedEmailId();
        if (selectedEmailId && djombiTokens) {
            console.log('Fetching inbox emails for selected account:', selectedEmailId);
            fetchEmails('inbox', true);
        }
    }, [djombiTokens, fetchEmails, loadColumnsForAccount]);

    // Initialize pagination when columns change
    useEffect(() => {
        initializePagination(columns);
    }, [columns]);

    // FIXED: Handle adding a new column with persistence
    const handleAddColumn = (newColumn: Omit<EmailColumnType, 'id'> & { id?: string }) => {
        const columnWithId = {
            ...newColumn,
            id: newColumn.id || newColumn.title.toLowerCase().replace(/\s+/g, '-')
        };
        
        const updatedColumns = [...columns, columnWithId];
        setColumns(updatedColumns);
        
        toast.success(`Created new "${columnWithId.title}" column`);
    };

    // Handle column icon update
    const handleUpdateColumnIcon = (columnId: string, icon: string) => {
        const updatedColumns = columns.map(col =>
            col.id === columnId
                ? { ...col, icon: icon }
                : col
        );
        
        setColumns(updatedColumns);
        toast.success("Column icon updated");
    };

    // Handle drag start
    const handleDragStart = () => {
        setIsDragging(true);
    };

    // FIXED: Enhanced drag end handler with better email status handling
    const handleDragEnd = (result: DropResult) => {
        setIsDragging(false);

        if (!result.destination) {
            console.log('No destination for drag operation');
            return;
        }

        const { draggableId, source, destination } = result;
        const emailId = draggableId;
        const sourceColumnId = source.droppableId;
        const destinationColumnId = destination.droppableId;

        // If dropped in same position, do nothing
        if (sourceColumnId === destinationColumnId && source.index === destination.index) {
            console.log('Email dropped in same position');
            return;
        }

        console.log(`Drag end: Moving email ${emailId} from ${sourceColumnId} to ${destinationColumnId}`);

        // Call the email move handler to actually update the email
        handleEmailMove(emailId, destinationColumnId);
    };

    // FIXED: Enhanced email move handler with proper urgent handling
    const handleEmailMove = useCallback((emailId: string, targetColumnId: string) => {
        console.log(`ProfessionalEmailInbox: Moving email ${emailId} to ${targetColumnId}`);
        
        try {
            // Find the email to move
            const emailToMove = emails.find(email => email.id === emailId);
            if (!emailToMove) {
                console.error(`Email with ID ${emailId} not found`);
                toast.error('Email not found');
                return;
            }

            // Check if email is already in target column
            if (emailToMove.status.toLowerCase() === targetColumnId.toLowerCase()) {
                console.log(`Email ${emailId} is already in column ${targetColumnId}`);
                toast.info('Email is already in this column');
                return;
            }

            console.log(`Moving email from ${emailToMove.status} to ${targetColumnId}`);

            // FIXED: Always use updateEmailStatus for consistent behavior across all columns
            if (updateEmailStatus) {
                console.log('Using store updateEmailStatus method for all columns including urgent');
                updateEmailStatus(emailId, targetColumnId);
            } 
            // Fallback methods
            else if (moveEmail) {
                console.log('Using store moveEmail method');
                moveEmail(emailId, targetColumnId as any);
            } 
            else if (setEmails) {
                console.log('Using direct state update method');
                const updatedEmails = emails.map(email => 
                    email.id === emailId 
                        ? { ...email, status: targetColumnId, category: targetColumnId }
                        : email
                );
                setEmails(updatedEmails);
            }
            
            // Show success message
            const destinationColumn = columns.find(col => col.id === targetColumnId);
            toast.success(`Email moved to ${destinationColumn?.title || targetColumnId}`);
            
            console.log(`Successfully moved email ${emailId} to ${targetColumnId}`);
            
        } catch (error) {
            console.error('Error moving email:', error);
            toast.error('Failed to move email');
        }
    }, [emails, columns, moveEmail, updateEmailStatus, setEmails]);

    // Handle column editing - Trello style
    const handleEditColumn = (column: EmailColumnType) => {
        setEditingColumnId(column.id);
        setEditingColumnName(column.title);
    };

    const handleSaveColumnEdit = () => {
        if (!editingColumnId || !editingColumnName.trim()) {
            toast.error("Please enter a valid column name");
            return;
        }

        const updatedColumns = columns.map(col =>
            col.id === editingColumnId
                ? { ...col, title: editingColumnName.trim() }
                : col
        );
        
        setColumns(updatedColumns);
        setEditingColumnId(null);
        setEditingColumnName("");
        toast.success("Column updated successfully");
    };

    const handleCancelColumnEdit = () => {
        setEditingColumnId(null);
        setEditingColumnName("");
    };

    // FIXED: Enhanced delete column with persistence
    const handleDeleteColumn = (column: EmailColumnType) => {
        if (["inbox", "urgent", "follow-up"].includes(column.id)) {
            toast.error("Default columns cannot be deleted.");
            return;
        }
        
        const updatedColumns = columns.filter(col => col.id !== column.id);
        setColumns(updatedColumns);
        toast.success(`Deleted "${column.title}" column`);
    };

    // Loading state - use email store loading state
    if (isLoading) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(0, 0.00%, 100.00%)' }}>
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="w-12 h-12 mx-auto rounded-full bg-blue-500 animate-spin">
                            <div className="absolute inset-1 bg-white rounded-full"></div>
                        </div>
                    </div>
                    <p className="text-base font-normal text-gray-700">Loading email board...</p>
                </div>
            </div>
        );
    }

    // Error state - use email store error state
    if (loadingError) {
        if (loadingError.includes('select an email account')) {
            return <NoEmailState message="Please select an email account in the dropdown above" />;
        }

        return (
            <ErrorState 
                error={loadingError} 
                onRetry={() => {
                    const selectedEmailId = getSelectedLinkedEmailId();
                    if (selectedEmailId) {
                        fetchEmails('inbox', true);
                    }
                }} 
            />
        );
    }

    return (
        <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
            <div 
                className="min-h-screen"
                style={{ 
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                }}
            >
                <div className="max-w-full mx-auto">
                    {/* Header Section */}
                    <div className="mb-6">
                        <div className="mb-4">
                            <div>
                                <SearchFilterBar
                                    emailFilter={emailFilter}
                                    onFilterChange={setEmailFilter}
                                    emailAccountType={emailAccountType}
                                    onAccountTypeChange={setEmailAccountType}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email Board Container with horizontal scroll */}
                    <div className="board-container mt-5">
                        <EmailBoard
                            columns={columns}
                            emails={filteredEmails}
                            pagination={pagination}
                            itemsPerPage={itemsPerPage}
                            onEditColumn={handleEditColumn}
                            onDeleteColumn={handleDeleteColumn}
                            onUpdateColumnIcon={handleUpdateColumnIcon}
                            onPageChange={handlePageChange}
                            onAddColumn={handleAddColumn}
                            showNewColumnDialog={showNewColumnDialog}
                            onNewColumnDialogChange={setShowNewColumnDialog}
                            editingColumnId={editingColumnId}
                            editingColumnName={editingColumnName}
                            onStartEdit={handleEditColumn}
                            onSaveEdit={handleSaveColumnEdit}
                            onCancelEdit={handleCancelColumnEdit}
                            onEditNameChange={setEditingColumnName}
                            onEmailMove={handleEmailMove}
                        />
                    </div>
                </div>

                {/* Compose Modal */}
                <ComposeModal
                    isOpen={showComposeDialog}
                    onClose={() => setShowComposeDialog(false)}
                />

                {/* Enhanced Debug Info - Uncomment for debugging */}
                {/* {process.env.NODE_ENV === 'development' && (
                    <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs max-w-xs">
                        <div>Selected Email ID: {currentSelectedEmailId?.substring(0, 20) || 'None'}</div>
                        <div>Email Type: {currentSelectedEmailType || 'None'}</div>
                        <div>Account Type: {emailAccountType}</div>
                        <div>Emails Count: {emails.length}</div>
                        <div>Filtered Count: {filteredEmails.length}</div>
                        <div>Columns Count: {columns.length}</div>
                        <div>Is Dragging: {isDragging ? 'Yes' : 'No'}</div>
                        <div>Store Methods Available:</div>
                        <div className="ml-2 text-xs">
                            <div>moveEmail: {moveEmail ? '✓' : '✗'}</div>
                            <div>updateEmailStatus: {updateEmailStatus ? '✓' : '✗'}</div>
                            <div>setEmails: {setEmails ? '✓' : '✗'}</div>
                            <div>getCustomColumns: {getCustomColumns ? '✓' : '✗'}</div>
                            <div>saveCustomColumns: {saveCustomColumns ? '✓' : '✗'}</div>
                        </div>
                    </div>
                )} */}

                {/* Trello-style custom scrollbar */}
                <style jsx>{`
                    .board-container {
                        position: relative;
                    }

                    .board-scroll::-webkit-scrollbar {
                        height: 12px;
                    }
                    
                    .board-scroll::-webkit-scrollbar-track {
                        background: rgba(255, 255, 255, 0.3);
                        border-radius: 6px;
                    }
                    
                    .board-scroll::-webkit-scrollbar-thumb {
                        background-color: rgba(0,0,0,0.3);
                        border-radius: 6px;
                        border: 2px solid hsl(214,91.3%,95.5%);
                    }
                    
                    .board-scroll::-webkit-scrollbar-thumb:hover {
                        background-color: rgba(0,0,0,0.5);
                    }

                    .board-scroll {
                        scrollbar-width: thin;
                        scrollbar-color: rgba(0,0,0,0.3) rgba(255, 255, 255, 0.3);
                    }

                    .line-clamp-2 {
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }

                    .group:hover {
                        transform: translateY(-1px);
                    }
                `}</style>
            </div>
        </DragDropContext>
    );
};

export default ProfessionalEmailInbox;




















































// 7/8/2025
// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";
// import { useState, useEffect, useContext, useCallback } from "react";
// import { DragDropContext, DropResult } from "react-beautiful-dnd";
// import { Mail, Archive, AlertCircle, Inbox, Star, CheckCircle, Plus, MoreHorizontal, Check, X } from "lucide-react";
// import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { getCookie } from "@/lib/utils/cookies";
// import { AuthContext } from "@/lib/context/auth";
// import { Email, EmailColumn as EmailColumnType, EmailCompose, EmailFilter, EmailAccountType, PaginationState } from "@/lib/types/email2";
// import { useCombinedAuth } from "@/components/providers/useCombinedAuth";

// // Import our new components
// import SearchFilterBar from "./SearchFilterBar";
// import { LoadingState, ErrorState, NoEmailState } from "./InboxStates";
// import EmailBoard from "./EmailBoard";
// import { ComposeModal } from "../AddEmailComponents/ComposeModal";

// const ProfessionalEmailInbox = () => {
//     // Move all hooks to the top level
//     const { token, user } = useContext(AuthContext);
//     const { djombi } = useCombinedAuth();
//     const djombiTokens = djombi.token || "";

//     // State with corrected default columns
//     const [emails, setEmails] = useState<Email[]>([]);
//     const [columns, setColumns] = useState<EmailColumnType[]>([
//         { id: "inbox", title: "Inbox", icon: "📧", gradient: "from-blue-500 to-cyan-500" },
//         { id: "urgent", title: "Urgent", icon: "🚨", gradient: "from-red-500 to-orange-500" },
//         { id: "follow-up", title: "Follow-Up", icon: "📁", gradient: "from-gray-500 to-slate-500" }
//     ]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);
//     const [showComposeDialog, setShowComposeDialog] = useState(false);
//     const [isDragging, setIsDragging] = useState(false);
//     const [emailAccountType, setEmailAccountType] = useState<EmailAccountType>("personal");
//     const [emailFilter, setEmailFilter] = useState<EmailFilter>({
//         searchTerm: "",
//         dateRange: "all",
//         hasAttachment: null,
//         isRead: null
//     });
//     const [composeEmail, setComposeEmail] = useState<EmailCompose>({
//         to: "",
//         subject: "",
//         content: ""
//     });
//     const [pagination, setPagination] = useState<PaginationState>({});
//     const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
//     const [editingColumnName, setEditingColumnName] = useState("");

//     const itemsPerPage = 12;

//     // Initialize pagination state for each column
//     const initializePagination = (columns: EmailColumnType[]) => {
//         const initialPagination: PaginationState = {};
//         columns.forEach(column => {
//             initialPagination[column.id] = {
//                 currentPage: 1,
//                 itemsPerPage: itemsPerPage
//             };
//         });
//         setPagination(initialPagination);
//     };

//     // Load saved data from localStorage with migration
//     const loadSavedData = () => {
//         try {
//             const savedEmails = localStorage.getItem('emailInboxData');
//             const savedColumns = localStorage.getItem('emailColumnsData');
            
//             if (savedEmails) {
//                 const parsedEmails = JSON.parse(savedEmails);
//                 // Migrate any old "archive" status to "follow-up"
//                 const migratedEmails = parsedEmails.map((email: Email) => ({
//                     ...email,
//                     status: email.status === "archive" ? "follow-up" : email.status
//                 }));
//                 setEmails(migratedEmails);
//             }
            
//             if (savedColumns) {
//                 const parsedColumns = JSON.parse(savedColumns);
//                 // Migrate any old "archive" column to "follow-up"
//                 const migratedColumns = parsedColumns.map((column: EmailColumnType) => {
//                     if (column.id === "archive") {
//                         return {
//                             ...column,
//                             id: "follow-up",
//                             title: "Follow-Up"
//                         };
//                     }
//                     return column;
//                 });
//                 setColumns(migratedColumns);
//             } else {
//                 // If no saved columns, ensure we have the correct default columns
//                 const defaultColumns = [
//                     { id: "inbox", title: "Inbox", icon: "📧", gradient: "from-blue-500 to-cyan-500" },
//                     { id: "urgent", title: "Urgent", icon: "🚨", gradient: "from-red-500 to-orange-500" },
//                     { id: "follow-up", title: "Follow-Up", icon: "📁", gradient: "from-gray-500 to-slate-500" }
//                 ];
//                 setColumns(defaultColumns);
//                 localStorage.setItem('emailColumnsData', JSON.stringify(defaultColumns));
//             }
//         } catch (error) {
//             console.error('Error loading saved data:', error);
//             // Reset to default columns if there's an error
//             const defaultColumns = [
//                 { id: "inbox", title: "Inbox", icon: "📧", gradient: "from-blue-500 to-cyan-500" },
//                 { id: "urgent", title: "Urgent", icon: "🚨", gradient: "from-red-500 to-orange-500" },
//                 { id: "follow-up", title: "Follow-Up", icon: "📁", gradient: "from-gray-500 to-slate-500" }
//             ];
//             setColumns(defaultColumns);
//         }
//     };

//     // Save data to localStorage - memoized to prevent unnecessary re-renders
//     const saveDataToStorage = useCallback(() => {
//         try {
//             localStorage.setItem('emailInboxData', JSON.stringify(emails));
//             localStorage.setItem('emailColumnsData', JSON.stringify(columns));
//         } catch (error) {
//             console.error('Error saving data:', error);
//         }
//     }, [emails, columns]);

//     // Save data whenever emails or columns change
//     useEffect(() => {
//         if (emails.length > 0) {
//             saveDataToStorage();
//         }
//     }, [emails, columns, saveDataToStorage]);

//     // Filter emails based on filters
//     const getFilteredEmails = (emails: Email[]): Email[] => {
//         let filtered = [...emails];

//         // Apply search filter
//         if (emailFilter.searchTerm) {
//             const searchTerm = emailFilter.searchTerm.toLowerCase();
//             filtered = filtered.filter(email =>
//                 email.subject.toLowerCase().includes(searchTerm) ||
//                 email.from.toLowerCase().includes(searchTerm) ||
//                 email.content.toLowerCase().includes(searchTerm)
//             );
//         }

//         // Apply attachment filter
//         if (emailFilter.hasAttachment !== null) {
//             filtered = filtered.filter(email => email.hasAttachment === emailFilter.hasAttachment);
//         }

//         // Apply read status filter
//         if (emailFilter.isRead !== null) {
//             filtered = filtered.filter(email => email.isRead === emailFilter.isRead);
//         }

//         return filtered;
//     };

//     const filteredEmails = getFilteredEmails(emails);

//     // Handle pagination
//     const handlePageChange = (columnId: string, page: number) => {
//         setPagination(prev => ({
//             ...prev,
//             [columnId]: {
//                 ...prev[columnId],
//                 currentPage: page
//             }
//         }));
//     };

//     // Handle compose email
//     const handleComposeEmail = (compose: EmailCompose) => {
//         setComposeEmail(compose);
//         setShowComposeDialog(true);
//     };

//     const handleSendEmail = async () => {
//         try {
//             // Implement your email sending logic here
//             console.log("Sending email:", composeEmail);
            
//             // For now, just show success message
//             toast.success("Email sent successfully!");
//             setShowComposeDialog(false);
//             setComposeEmail({ to: "", subject: "", content: "" });
//         } catch (error) {
//             toast.error("Failed to send email");
//         }
//     };

//     // Process email data from API response
//     const processEmailData = (data: any): Email[] => {
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

//     // Fetch emails using useCallback
//     const fetchEmails = useCallback(async () => {
//         // First load saved data
//         loadSavedData();
        
//         setIsLoading(true);
//         setError(null);

//         try {
//             console.log("Token retrieved:", token ? `${token.access_token.substring(0, 10)}...` : 'No token found');

//             if (!token) {
//                 throw new Error('No access token available');
//             }

//             const linkedEmailId = getCookie('linkedEmailId') ||
//                 (typeof window !== 'undefined' ? localStorage.getItem('linkedEmailId') : null);
//             console.log("Linked Email ID:", linkedEmailId);

//             if (!linkedEmailId) {
//                 throw new Error('No linked email ID found');
//             }

//             const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//             console.log("Fetching from API endpoint:", apiEndpoint);

//             const response = await fetch(apiEndpoint, {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${djombiTokens}`
//                 }
//             });

//             const responseText = await response.text();
//             console.log("Raw response:", responseText);

//             let data;
//             try {
//                 data = JSON.parse(responseText);
//                 console.log("Parsed response data:", data);
//             } catch (e) {
//                 console.error("Failed to parse response as JSON:", e);
//                 throw new Error(`Invalid response format: ${responseText.substring(0, 100)}...`);
//             }

//             if (data.success === false) {
//                 const errorMessage = data.message || response.statusText;
//                 console.error("API error:", errorMessage);
//                 throw new Error(`API error: ${errorMessage}`);
//             }

//             const formattedEmails = processEmailData(data);
            
//             // Merge with existing saved emails, preserving status changes and migrating archive to follow-up
//             const savedEmails = JSON.parse(localStorage.getItem('emailInboxData') || '[]');
//             const mergedEmails = formattedEmails.map(newEmail => {
//                 const existingEmail = savedEmails.find((saved: Email) => saved.id === newEmail.id);
//                 if (existingEmail) {
//                     // Migrate archive status to follow-up
//                     const migratedStatus = existingEmail.status === "archive" ? "follow-up" : existingEmail.status;
//                     return { ...newEmail, status: migratedStatus };
//                 }
//                 return newEmail;
//             });
            
//             setEmails(mergedEmails);
//         } catch (err) {
//             console.error('Error fetching emails:', err);
//             setError(err instanceof Error ? err.message : 'Failed to fetch emails');
//         } finally {
//             setIsLoading(false);
//         }
//     }, [token, djombiTokens]);

//     // Fetch emails on component mount
//     useEffect(() => {
//         fetchEmails();
//     }, [fetchEmails]);

//     // Initialize pagination when columns change
//     useEffect(() => {
//         initializePagination(columns);
//     }, [columns]);

//     // Handle adding a new column
//     const handleAddColumn = (newColumn: Omit<EmailColumnType, 'id'> & { id?: string }) => {
//         const columnWithId = {
//             ...newColumn,
//             id: newColumn.id || newColumn.title.toLowerCase().replace(/\s+/g, '-')
//         };
        
//         const updatedColumns = [...columns, columnWithId];
//         setColumns(updatedColumns);
        
//         // Save to localStorage immediately
//         try {
//             localStorage.setItem('emailColumnsData', JSON.stringify(updatedColumns));
//         } catch (error) {
//             console.error('Error saving columns after addition:', error);
//         }
        
//         toast.success(`Created new "${columnWithId.title}" column`);
//     };

//     // Handle column icon update
//     const handleUpdateColumnIcon = (columnId: string, icon: string) => {
//         const updatedColumns = columns.map(col =>
//             col.id === columnId
//                 ? { ...col, icon: icon }
//                 : col
//         );
        
//         setColumns(updatedColumns);
        
//         // Save to localStorage immediately
//         try {
//             localStorage.setItem('emailColumnsData', JSON.stringify(updatedColumns));
//         } catch (error) {
//             console.error('Error saving columns after icon update:', error);
//         }
        
//         toast.success("Column icon updated");
//     };

//     // Handle drag start
//     const handleDragStart = () => {
//         setIsDragging(true);
//     };

//     // Handle drag end
//     const handleDragEnd = (result: DropResult) => {
//         setIsDragging(false);

//         if (!result.destination) {
//             return;
//         }

//         const { draggableId, source, destination } = result;
//         const emailId = draggableId;
//         const sourceColumnId = source.droppableId;
//         const destinationColumnId = destination.droppableId;

//         if (sourceColumnId === destinationColumnId && source.index === destination.index) {
//             return;
//         }

//         setEmails(prevEmails => {
//             const updatedEmails = prevEmails.map(email => {
//                 if (email.id === emailId) {
//                     return { ...email, status: destinationColumnId };
//                 }
//                 return email;
//             });

//             return updatedEmails;
//         });

//         const destinationColumn = columns.find(col => col.id === destinationColumnId);
//         toast.success(`Email moved to ${destinationColumn?.title || destinationColumnId}`);
//     };

//     // Handle column editing - Trello style
//     const handleEditColumn = (column: EmailColumnType) => {
//         setEditingColumnId(column.id);
//         setEditingColumnName(column.title);
//     };

//     const handleSaveColumnEdit = () => {
//         if (!editingColumnId || !editingColumnName.trim()) {
//             toast.error("Please enter a valid column name");
//             return;
//         }

//         const updatedColumns = columns.map(col =>
//             col.id === editingColumnId
//                 ? { ...col, title: editingColumnName.trim() }
//                 : col
//         );
        
//         setColumns(updatedColumns);
        
//         // Save to localStorage immediately
//         try {
//             localStorage.setItem('emailColumnsData', JSON.stringify(updatedColumns));
//         } catch (error) {
//             console.error('Error saving columns after edit:', error);
//         }

//         setEditingColumnId(null);
//         setEditingColumnName("");
//         toast.success("Column updated successfully");
//     };

//     const handleCancelColumnEdit = () => {
//         setEditingColumnId(null);
//         setEditingColumnName("");
//     };

//     const handleDeleteColumn = (column: EmailColumnType) => {
//         if (["inbox", "urgent", "follow-up"].includes(column.id)) {
//             toast.error("Default columns cannot be deleted.");
//             return;
//         }
        
//         const updatedColumns = columns.filter(col => col.id !== column.id);
//         setColumns(updatedColumns);
        
//         // Save to localStorage immediately
//         try {
//             localStorage.setItem('emailColumnsData', JSON.stringify(updatedColumns));
//         } catch (error) {
//             console.error('Error saving columns after deletion:', error);
//         }
        
//         toast.success(`Deleted "${column.title}" column`);
//     };

//     // Handle email move via drag and drop selector
//     const handleEmailMove = (emailId: string, targetColumnId: string) => {
//         setEmails(prevEmails => {
//             const updatedEmails = prevEmails.map(email => {
//                 if (email.id === emailId) {
//                     return { ...email, status: targetColumnId };
//                 }
//                 return email;
//             });
//             return updatedEmails;
//         });

//         const targetColumn = columns.find(col => col.id === targetColumnId);
//         toast.success(`Email moved to ${targetColumn?.title || targetColumnId}`);
//     };

//     // Loading state - Trello style
//     if (isLoading) {
//         return (
//             <div className="w-full min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(0, 0.00%, 100.00%)' }}>
//                 <div className="text-center space-y-4">
//                     <div className="relative">
//                         <div className="w-12 h-12 mx-auto rounded-full bg-blue-500 animate-spin">
//                             <div className="absolute inset-1 bg-white rounded-full"></div>
//                         </div>
//                     </div>
//                     <p className="text-base font-normal text-gray-700">Loading email board...</p>
//                 </div>
//             </div>
//         );
//     }

//     // Error state
//     if (error) {
//         if (error === 'No linked email ID found') {
//             console.error('Error loading emails: No linked email ID found');
//             return <NoEmailState message="Please link an email to continue" />;
//         }

//         return (
//             <ErrorState 
//                 error={error} 
//                 onRetry={() => window.location.reload()} 
//             />
//         );
//     }

//     return (
//         <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
//             <div 
//                 className="min-h-screen"
//                 style={{ 
//                     fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
//                 }}
//             >
//                 <div className="max-w-full mx-auto">
//                     {/* Header Section */}
//                     <div className="mb-6">
//                         <div className="mb-4">
//                             <div>
//                                 <SearchFilterBar
//                                     emailFilter={emailFilter}
//                                     onFilterChange={setEmailFilter}
//                                     emailAccountType={emailAccountType}
//                                     onAccountTypeChange={setEmailAccountType}
//                                 />
//                             </div>
//                         </div>
//                     </div>

//                     {/* Email Board Container with horizontal scroll */}
//                     <div className="board-container mt-5">
//                         <EmailBoard
//                             columns={columns}
//                             emails={filteredEmails}
//                             pagination={pagination}
//                             itemsPerPage={itemsPerPage}
//                             onEditColumn={handleEditColumn}
//                             onDeleteColumn={handleDeleteColumn}
//                             onUpdateColumnIcon={handleUpdateColumnIcon}
//                             onPageChange={handlePageChange}
//                             onAddColumn={handleAddColumn}
//                             showNewColumnDialog={showNewColumnDialog}
//                             onNewColumnDialogChange={setShowNewColumnDialog}
//                             editingColumnId={editingColumnId}
//                             editingColumnName={editingColumnName}
//                             onStartEdit={handleEditColumn}
//                             onSaveEdit={handleSaveColumnEdit}
//                             onCancelEdit={handleCancelColumnEdit}
//                             onEditNameChange={setEditingColumnName}
//                             onEmailMove={handleEmailMove}
//                         />
//                     </div>
//                 </div>

//                 {/* Compose Modal */}
//                 <ComposeModal
//                     isOpen={showComposeDialog}
//                     onClose={() => setShowComposeDialog(false)}
//                 />

//                 {/* Trello-style custom scrollbar */}
//                 <style jsx>{`
//                     .board-container {
//                         position: relative;
//                     }

//                     .board-scroll::-webkit-scrollbar {
//                         height: 12px;
//                     }
                    
//                     .board-scroll::-webkit-scrollbar-track {
//                         background: rgba(255, 255, 255, 0.3);
//                         border-radius: 6px;
//                     }
                    
//                     .board-scroll::-webkit-scrollbar-thumb {
//                         background-color: rgba(0,0,0,0.3);
//                         border-radius: 6px;
//                         border: 2px solid hsl(214,91.3%,95.5%);
//                     }
                    
//                     .board-scroll::-webkit-scrollbar-thumb:hover {
//                         background-color: rgba(0,0,0,0.5);
//                     }

//                     .board-scroll {
//                         scrollbar-width: thin;
//                         scrollbar-color: rgba(0,0,0,0.3) rgba(255, 255, 255, 0.3);
//                     }

//                     .line-clamp-2 {
//                         display: -webkit-box;
//                         -webkit-line-clamp: 2;
//                         -webkit-box-orient: vertical;
//                         overflow: hidden;
//                     }

//                     .group:hover {
//                         transform: translateY(-1px);
//                     }
//                 `}</style>
//             </div>
//         </DragDropContext>
//     );
// };

// export default ProfessionalEmailInbox;















































// 2:21pm 30/06/2025
// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";
// import { useState, useEffect, useContext, useCallback } from "react";
// import { DragDropContext, DropResult } from "react-beautiful-dnd";
// import { Mail, Archive, AlertCircle, Inbox, Star, CheckCircle, Plus, MoreHorizontal, Check, X } from "lucide-react";
// import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { getCookie } from "@/lib/utils/cookies";
// import { AuthContext } from "@/lib/context/auth";
// import { Email, EmailColumn as EmailColumnType, EmailCompose, EmailFilter, EmailAccountType, PaginationState } from "@/lib/types/email2";
// import { useCombinedAuth } from "@/components/providers/useCombinedAuth";

// // Import our new components
// import SearchFilterBar from "./SearchFilterBar";
// import { LoadingState, ErrorState, NoEmailState } from "./InboxStates";
// import EmailBoard from "./EmailBoard";
// import { ComposeModal } from "../AddEmailComponents/ComposeModal";

// const ProfessionalEmailInbox = () => {
//     // Move all hooks to the top level
//     const { token, user } = useContext(AuthContext);
//     const { djombi } = useCombinedAuth();
//     const djombiTokens = djombi.token || "";

//     // State
//     const [emails, setEmails] = useState<Email[]>([]);
//     const [columns, setColumns] = useState<EmailColumnType[]>([
//         { id: "inbox", title: "Inbox", icon: "📧", gradient: "from-blue-500 to-cyan-500" },
//         { id: "urgent", title: "Urgent", icon: "🚨", gradient: "from-red-500 to-orange-500" },
//         { id: "archive", title: "Archive", icon: "📁", gradient: "from-gray-500 to-slate-500" }
//     ]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);
//     const [showComposeDialog, setShowComposeDialog] = useState(false);
//     const [isDragging, setIsDragging] = useState(false);
//     const [emailAccountType, setEmailAccountType] = useState<EmailAccountType>("personal");
//     const [emailFilter, setEmailFilter] = useState<EmailFilter>({
//         searchTerm: "",
//         dateRange: "all",
//         hasAttachment: null,
//         isRead: null
//     });
//     const [composeEmail, setComposeEmail] = useState<EmailCompose>({
//         to: "",
//         subject: "",
//         content: ""
//     });
//     const [pagination, setPagination] = useState<PaginationState>({});
//     const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
//     const [editingColumnName, setEditingColumnName] = useState("");

//     const itemsPerPage = 12;

//     // Initialize pagination state for each column
//     const initializePagination = (columns: EmailColumnType[]) => {
//         const initialPagination: PaginationState = {};
//         columns.forEach(column => {
//             initialPagination[column.id] = {
//                 currentPage: 1,
//                 itemsPerPage: itemsPerPage
//             };
//         });
//         setPagination(initialPagination);
//     };

//     // Load saved data from localStorage
//     const loadSavedData = () => {
//         try {
//             const savedEmails = localStorage.getItem('emailInboxData');
//             const savedColumns = localStorage.getItem('emailColumnsData');
            
//             if (savedEmails) {
//                 const parsedEmails = JSON.parse(savedEmails);
//                 setEmails(parsedEmails);
//             }
            
//             if (savedColumns) {
//                 const parsedColumns = JSON.parse(savedColumns);
//                 setColumns(parsedColumns);
//             }
//         } catch (error) {
//             console.error('Error loading saved data:', error);
//         }
//     };

//     // Save data to localStorage - memoized to prevent unnecessary re-renders
//     const saveDataToStorage = useCallback(() => {
//         try {
//             localStorage.setItem('emailInboxData', JSON.stringify(emails));
//             localStorage.setItem('emailColumnsData', JSON.stringify(columns));
//         } catch (error) {
//             console.error('Error saving data:', error);
//         }
//     }, [emails, columns]);

//     // Save data whenever emails or columns change
//     useEffect(() => {
//         if (emails.length > 0) {
//             saveDataToStorage();
//         }
//     }, [emails, columns, saveDataToStorage]);

//     // Filter emails based on filters
//     const getFilteredEmails = (emails: Email[]): Email[] => {
//         let filtered = [...emails];

//         // Apply search filter
//         if (emailFilter.searchTerm) {
//             const searchTerm = emailFilter.searchTerm.toLowerCase();
//             filtered = filtered.filter(email =>
//                 email.subject.toLowerCase().includes(searchTerm) ||
//                 email.from.toLowerCase().includes(searchTerm) ||
//                 email.content.toLowerCase().includes(searchTerm)
//             );
//         }

//         // Apply attachment filter
//         if (emailFilter.hasAttachment !== null) {
//             filtered = filtered.filter(email => email.hasAttachment === emailFilter.hasAttachment);
//         }

//         // Apply read status filter
//         if (emailFilter.isRead !== null) {
//             filtered = filtered.filter(email => email.isRead === emailFilter.isRead);
//         }

//         return filtered;
//     };

//     const filteredEmails = getFilteredEmails(emails);

//     // Handle pagination
//     const handlePageChange = (columnId: string, page: number) => {
//         setPagination(prev => ({
//             ...prev,
//             [columnId]: {
//                 ...prev[columnId],
//                 currentPage: page
//             }
//         }));
//     };

//     // Handle compose email
//     const handleComposeEmail = (compose: EmailCompose) => {
//         setComposeEmail(compose);
//         setShowComposeDialog(true);
//     };

//     const handleSendEmail = async () => {
//         try {
//             // Implement your email sending logic here
//             console.log("Sending email:", composeEmail);
            
//             // For now, just show success message
//             toast.success("Email sent successfully!");
//             setShowComposeDialog(false);
//             setComposeEmail({ to: "", subject: "", content: "" });
//         } catch (error) {
//             toast.error("Failed to send email");
//         }
//     };

//     // Process email data from API response
//     const processEmailData = (data: any): Email[] => {
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

//     // Fetch emails using useCallback
//     const fetchEmails = useCallback(async () => {
//         // First load saved data
//         loadSavedData();
        
//         setIsLoading(true);
//         setError(null);

//         try {
//             console.log("Token retrieved:", token ? `${token.access_token.substring(0, 10)}...` : 'No token found');

//             if (!token) {
//                 throw new Error('No access token available');
//             }

//             const linkedEmailId = getCookie('linkedEmailId') ||
//                 (typeof window !== 'undefined' ? localStorage.getItem('linkedEmailId') : null);
//             console.log("Linked Email ID:", linkedEmailId);

//             if (!linkedEmailId) {
//                 throw new Error('No linked email ID found');
//             }

//             const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//             console.log("Fetching from API endpoint:", apiEndpoint);

//             const response = await fetch(apiEndpoint, {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${djombiTokens}`
//                 }
//             });

//             const responseText = await response.text();
//             console.log("Raw response:", responseText);

//             let data;
//             try {
//                 data = JSON.parse(responseText);
//                 console.log("Parsed response data:", data);
//             } catch (e) {
//                 console.error("Failed to parse response as JSON:", e);
//                 throw new Error(`Invalid response format: ${responseText.substring(0, 100)}...`);
//             }

//             if (data.success === false) {
//                 const errorMessage = data.message || response.statusText;
//                 console.error("API error:", errorMessage);
//                 throw new Error(`API error: ${errorMessage}`);
//             }

//             const formattedEmails = processEmailData(data);
            
//             // Merge with existing saved emails, preserving status changes
//             const savedEmails = JSON.parse(localStorage.getItem('emailInboxData') || '[]');
//             const mergedEmails = formattedEmails.map(newEmail => {
//                 const existingEmail = savedEmails.find((saved: Email) => saved.id === newEmail.id);
//                 return existingEmail ? { ...newEmail, status: existingEmail.status } : newEmail;
//             });
            
//             setEmails(mergedEmails);
//         } catch (err) {
//             console.error('Error fetching emails:', err);
//             setError(err instanceof Error ? err.message : 'Failed to fetch emails');
//         } finally {
//             setIsLoading(false);
//         }
//     }, [token, djombiTokens]);

//     // Fetch emails on component mount
//     useEffect(() => {
//         fetchEmails();
//     }, [fetchEmails]);

//     // Initialize pagination when columns change
//     useEffect(() => {
//         initializePagination(columns);
//     }, [columns]);

//     // Handle adding a new column
//     const handleAddColumn = (newColumn: Omit<EmailColumnType, 'id'> & { id?: string }) => {
//         const columnWithId = {
//             ...newColumn,
//             id: newColumn.id || newColumn.title.toLowerCase().replace(/\s+/g, '-')
//         };
        
//         const updatedColumns = [...columns, columnWithId];
//         setColumns(updatedColumns);
        
//         // Save to localStorage immediately
//         try {
//             localStorage.setItem('emailColumnsData', JSON.stringify(updatedColumns));
//         } catch (error) {
//             console.error('Error saving columns after addition:', error);
//         }
        
//         toast.success(`Created new "${columnWithId.title}" column`);
//     };

//     // Handle column icon update
//     const handleUpdateColumnIcon = (columnId: string, icon: string) => {
//         const updatedColumns = columns.map(col =>
//             col.id === columnId
//                 ? { ...col, icon: icon }
//                 : col
//         );
        
//         setColumns(updatedColumns);
        
//         // Save to localStorage immediately
//         try {
//             localStorage.setItem('emailColumnsData', JSON.stringify(updatedColumns));
//         } catch (error) {
//             console.error('Error saving columns after icon update:', error);
//         }
        
//         toast.success("Column icon updated");
//     };

//     // Handle drag start
//     const handleDragStart = () => {
//         setIsDragging(true);
//     };

//     // Handle drag end
//     const handleDragEnd = (result: DropResult) => {
//         setIsDragging(false);

//         if (!result.destination) {
//             return;
//         }

//         const { draggableId, source, destination } = result;
//         const emailId = draggableId;
//         const sourceColumnId = source.droppableId;
//         const destinationColumnId = destination.droppableId;

//         if (sourceColumnId === destinationColumnId && source.index === destination.index) {
//             return;
//         }

//         setEmails(prevEmails => {
//             const updatedEmails = prevEmails.map(email => {
//                 if (email.id === emailId) {
//                     return { ...email, status: destinationColumnId };
//                 }
//                 return email;
//             });

//             return updatedEmails;
//         });

//         const destinationColumn = columns.find(col => col.id === destinationColumnId);
//         toast.success(`Email moved to ${destinationColumn?.title || destinationColumnId}`);
//     };

//     // Handle column editing - Trello style
//     const handleEditColumn = (column: EmailColumnType) => {
//         setEditingColumnId(column.id);
//         setEditingColumnName(column.title);
//     };

//     const handleSaveColumnEdit = () => {
//         if (!editingColumnId || !editingColumnName.trim()) {
//             toast.error("Please enter a valid column name");
//             return;
//         }

//         const updatedColumns = columns.map(col =>
//             col.id === editingColumnId
//                 ? { ...col, title: editingColumnName.trim() }
//                 : col
//         );
        
//         setColumns(updatedColumns);
        
//         // Save to localStorage immediately
//         try {
//             localStorage.setItem('emailColumnsData', JSON.stringify(updatedColumns));
//         } catch (error) {
//             console.error('Error saving columns after edit:', error);
//         }

//         setEditingColumnId(null);
//         setEditingColumnName("");
//         toast.success("Column updated successfully");
//     };

//     const handleCancelColumnEdit = () => {
//         setEditingColumnId(null);
//         setEditingColumnName("");
//     };

//     const handleDeleteColumn = (column: EmailColumnType) => {
//         if (["inbox", "urgent", "archive"].includes(column.id)) {
//             toast.error("Default columns cannot be deleted.");
//             return;
//         }
        
//         const updatedColumns = columns.filter(col => col.id !== column.id);
//         setColumns(updatedColumns);
        
//         // Save to localStorage immediately
//         try {
//             localStorage.setItem('emailColumnsData', JSON.stringify(updatedColumns));
//         } catch (error) {
//             console.error('Error saving columns after deletion:', error);
//         }
        
//         toast.success(`Deleted "${column.title}" column`);
//     };

//     // Handle email move via drag and drop selector
//     const handleEmailMove = (emailId: string, targetColumnId: string) => {
//         setEmails(prevEmails => {
//             const updatedEmails = prevEmails.map(email => {
//                 if (email.id === emailId) {
//                     return { ...email, status: targetColumnId };
//                 }
//                 return email;
//             });
//             return updatedEmails;
//         });

//         const targetColumn = columns.find(col => col.id === targetColumnId);
//         toast.success(`Email moved to ${targetColumn?.title || targetColumnId}`);
//     };

//     // Loading state - Trello style
//     if (isLoading) {
//         return (
//             <div className="w-full min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(0, 0.00%, 100.00%)' }}>
//                 <div className="text-center space-y-4">
//                     <div className="relative">
//                         <div className="w-12 h-12 mx-auto rounded-full bg-blue-500 animate-spin">
//                             <div className="absolute inset-1 bg-white rounded-full"></div>
//                         </div>
//                     </div>
//                     <p className="text-base font-normal text-gray-700">Loading email board...</p>
//                 </div>
//             </div>
//         );
//     }

//     // Error state
//     if (error) {
//         if (error === 'No linked email ID found') {
//             console.error('Error loading emails: No linked email ID found');
//             return <NoEmailState message="Please link an email to continue" />;
//         }

//         return (
//             <ErrorState 
//                 error={error} 
//                 onRetry={() => window.location.reload()} 
//             />
//         );
//     }

//     return (
//         <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
//             <div 
//                 className="min-h-screen"
//                 style={{ 
//                     fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
//                 }}
//             >
//                 <div className="max-w-full mx-auto">
//                     {/* Header Section */}
//                     <div className="mb-6">
//                         <div className="mb-4">
//                             <div>
//                                 <SearchFilterBar
//                                     emailFilter={emailFilter}
//                                     onFilterChange={setEmailFilter}
//                                     emailAccountType={emailAccountType}
//                                     onAccountTypeChange={setEmailAccountType}
//                                 />
//                             </div>
//                         </div>
//                     </div>

//                     {/* Email Board Container with horizontal scroll */}
//                     <div className="board-container mt-5">
//                         <EmailBoard
//                             columns={columns}
//                             emails={filteredEmails}
//                             pagination={pagination}
//                             itemsPerPage={itemsPerPage}
//                             onEditColumn={handleEditColumn}
//                             onDeleteColumn={handleDeleteColumn}
//                             onUpdateColumnIcon={handleUpdateColumnIcon}
//                             onPageChange={handlePageChange}
//                             onAddColumn={handleAddColumn}
//                             showNewColumnDialog={showNewColumnDialog}
//                             onNewColumnDialogChange={setShowNewColumnDialog}
//                             editingColumnId={editingColumnId}
//                             editingColumnName={editingColumnName}
//                             onStartEdit={handleEditColumn}
//                             onSaveEdit={handleSaveColumnEdit}
//                             onCancelEdit={handleCancelColumnEdit}
//                             onEditNameChange={setEditingColumnName}
//                             onEmailMove={handleEmailMove}
//                         />
//                     </div>
//                 </div>

//                 {/* Compose Modal */}
//                 <ComposeModal
//                     isOpen={showComposeDialog}
//                     onClose={() => setShowComposeDialog(false)}
//                 />

//                 {/* Trello-style custom scrollbar */}
//                 <style jsx>{`
//                     .board-container {
//                         position: relative;
//                     }

//                     .board-scroll::-webkit-scrollbar {
//                         height: 12px;
//                     }
                    
//                     .board-scroll::-webkit-scrollbar-track {
//                         background: rgba(255, 255, 255, 0.3);
//                         border-radius: 6px;
//                     }
                    
//                     .board-scroll::-webkit-scrollbar-thumb {
//                         background-color: rgba(0,0,0,0.3);
//                         border-radius: 6px;
//                         border: 2px solid hsl(214,91.3%,95.5%);
//                     }
                    
//                     .board-scroll::-webkit-scrollbar-thumb:hover {
//                         background-color: rgba(0,0,0,0.5);
//                     }

//                     .board-scroll {
//                         scrollbar-width: thin;
//                         scrollbar-color: rgba(0,0,0,0.3) rgba(255, 255, 255, 0.3);
//                     }

//                     .line-clamp-2 {
//                         display: -webkit-box;
//                         -webkit-line-clamp: 2;
//                         -webkit-box-orient: vertical;
//                         overflow: hidden;
//                     }

//                     .group:hover {
//                         transform: translateY(-1px);
//                     }
//                 `}</style>
//             </div>
//         </DragDropContext>
//     );
// };

// export default ProfessionalEmailInbox;


































































// 6/29/2025 03:00am
// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";
// import { useState, useEffect, useContext, useCallback } from "react";
// import { DragDropContext, DropResult } from "react-beautiful-dnd";
// import { Mail, Archive, AlertCircle, Inbox, Star, CheckCircle, Plus, MoreHorizontal, Check, X } from "lucide-react";
// import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { getCookie } from "@/lib/utils/cookies";
// import { AuthContext } from "@/lib/context/auth";
// import { Email, EmailColumn as EmailColumnType, EmailCompose, EmailFilter, EmailAccountType, PaginationState } from "@/lib/types/email2";
// import { useCombinedAuth } from "@/components/providers/useCombinedAuth";

// // Import our new components
// import SearchFilterBar from "./SearchFilterBar";
// import { LoadingState, ErrorState, NoEmailState } from "./InboxStates";
// import EmailBoard from "./EmailBoard";
// import { ComposeModal } from "../AddEmailComponents/ComposeModal";

// const ProfessionalEmailInbox = () => {
//     // Move all hooks to the top level
//     const { token, user } = useContext(AuthContext);
//     const { djombi } = useCombinedAuth();
//     const djombiTokens = djombi.token || "";

//     // State
//     const [emails, setEmails] = useState<Email[]>([]);
//     const [columns, setColumns] = useState<EmailColumnType[]>([
//         { id: "inbox", title: "Inbox", icon: "📧", gradient: "from-blue-500 to-cyan-500" },
//         { id: "urgent", title: "Urgent", icon: "🚨", gradient: "from-red-500 to-orange-500" },
//         { id: "archive", title: "Archive", icon: "📁", gradient: "from-gray-500 to-slate-500" }
//     ]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);
//     const [showComposeDialog, setShowComposeDialog] = useState(false);
//     const [isDragging, setIsDragging] = useState(false);
//     const [emailAccountType, setEmailAccountType] = useState<EmailAccountType>("personal");
//     const [emailFilter, setEmailFilter] = useState<EmailFilter>({
//         searchTerm: "",
//         dateRange: "all",
//         hasAttachment: null,
//         isRead: null
//     });
//     const [composeEmail, setComposeEmail] = useState<EmailCompose>({
//         to: "",
//         subject: "",
//         content: ""
//     });
//     const [pagination, setPagination] = useState<PaginationState>({});
//     const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
//     const [editingColumnName, setEditingColumnName] = useState("");

//     const itemsPerPage = 12;

//     // Initialize pagination state for each column
//     const initializePagination = (columns: EmailColumnType[]) => {
//         const initialPagination: PaginationState = {};
//         columns.forEach(column => {
//             initialPagination[column.id] = {
//                 currentPage: 1,
//                 itemsPerPage: itemsPerPage
//             };
//         });
//         setPagination(initialPagination);
//     };

//     // Load saved data from localStorage
//     const loadSavedData = () => {
//         try {
//             const savedEmails = localStorage.getItem('emailInboxData');
//             const savedColumns = localStorage.getItem('emailColumnsData');
            
//             if (savedEmails) {
//                 const parsedEmails = JSON.parse(savedEmails);
//                 setEmails(parsedEmails);
//             }
            
//             if (savedColumns) {
//                 const parsedColumns = JSON.parse(savedColumns);
//                 setColumns(parsedColumns);
//             }
//         } catch (error) {
//             console.error('Error loading saved data:', error);
//         }
//     };

//     // Save data to localStorage
//     const saveDataToStorage = () => {
//         try {
//             localStorage.setItem('emailInboxData', JSON.stringify(emails));
//             localStorage.setItem('emailColumnsData', JSON.stringify(columns));
//         } catch (error) {
//             console.error('Error saving data:', error);
//         }
//     };

//     // Save data whenever emails or columns change
//     useEffect(() => {
//         if (emails.length > 0) {
//             saveDataToStorage();
//         }
//     }, [emails, columns]);

//     // Filter emails based on filters
//     const getFilteredEmails = (emails: Email[]): Email[] => {
//         let filtered = [...emails];

//         // Apply search filter
//         if (emailFilter.searchTerm) {
//             const searchTerm = emailFilter.searchTerm.toLowerCase();
//             filtered = filtered.filter(email =>
//                 email.subject.toLowerCase().includes(searchTerm) ||
//                 email.from.toLowerCase().includes(searchTerm) ||
//                 email.content.toLowerCase().includes(searchTerm)
//             );
//         }

//         // Apply attachment filter
//         if (emailFilter.hasAttachment !== null) {
//             filtered = filtered.filter(email => email.hasAttachment === emailFilter.hasAttachment);
//         }

//         // Apply read status filter
//         if (emailFilter.isRead !== null) {
//             filtered = filtered.filter(email => email.isRead === emailFilter.isRead);
//         }

//         return filtered;
//     };

//     const filteredEmails = getFilteredEmails(emails);

//     // Handle pagination
//     const handlePageChange = (columnId: string, page: number) => {
//         setPagination(prev => ({
//             ...prev,
//             [columnId]: {
//                 ...prev[columnId],
//                 currentPage: page
//             }
//         }));
//     };

//     // Handle compose email
//     const handleComposeEmail = (compose: EmailCompose) => {
//         setComposeEmail(compose);
//         setShowComposeDialog(true);
//     };

//     const handleSendEmail = async () => {
//         try {
//             // Implement your email sending logic here
//             console.log("Sending email:", composeEmail);
            
//             // For now, just show success message
//             toast.success("Email sent successfully!");
//             setShowComposeDialog(false);
//             setComposeEmail({ to: "", subject: "", content: "" });
//         } catch (error) {
//             toast.error("Failed to send email");
//         }
//     };

//     // Process email data from API response
//     const processEmailData = (data: any): Email[] => {
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

//     // Fetch emails using useCallback
//     const fetchEmails = useCallback(async () => {
//         // First load saved data
//         loadSavedData();
        
//         setIsLoading(true);
//         setError(null);

//         try {
//             console.log("Token retrieved:", token ? `${token.access_token.substring(0, 10)}...` : 'No token found');

//             if (!token) {
//                 throw new Error('No access token available');
//             }

//             const linkedEmailId = getCookie('linkedEmailId') ||
//                 (typeof window !== 'undefined' ? localStorage.getItem('linkedEmailId') : null);
//             console.log("Linked Email ID:", linkedEmailId);

//             if (!linkedEmailId) {
//                 throw new Error('No linked email ID found');
//             }

//             const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//             console.log("Fetching from API endpoint:", apiEndpoint);

//             const response = await fetch(apiEndpoint, {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${djombiTokens}`
//                 }
//             });

//             const responseText = await response.text();
//             console.log("Raw response:", responseText);

//             let data;
//             try {
//                 data = JSON.parse(responseText);
//                 console.log("Parsed response data:", data);
//             } catch (e) {
//                 console.error("Failed to parse response as JSON:", e);
//                 throw new Error(`Invalid response format: ${responseText.substring(0, 100)}...`);
//             }

//             if (data.success === false) {
//                 const errorMessage = data.message || response.statusText;
//                 console.error("API error:", errorMessage);
//                 throw new Error(`API error: ${errorMessage}`);
//             }

//             const formattedEmails = processEmailData(data);
            
//             // Merge with existing saved emails, preserving status changes
//             const savedEmails = JSON.parse(localStorage.getItem('emailInboxData') || '[]');
//             const mergedEmails = formattedEmails.map(newEmail => {
//                 const existingEmail = savedEmails.find((saved: Email) => saved.id === newEmail.id);
//                 return existingEmail ? { ...newEmail, status: existingEmail.status } : newEmail;
//             });
            
//             setEmails(mergedEmails);
//         } catch (err) {
//             console.error('Error fetching emails:', err);
//             setError(err instanceof Error ? err.message : 'Failed to fetch emails');
//         } finally {
//             setIsLoading(false);
//         }
//     }, [token, djombiTokens]);

//     // Fetch emails on component mount
//     useEffect(() => {
//         fetchEmails();
//     }, [fetchEmails]);

//     // Initialize pagination when columns change
//     useEffect(() => {
//         initializePagination(columns);
//     }, [columns]);

//     // Handle adding a new column
//     const handleAddColumn = (newColumn: Omit<EmailColumnType, 'id'> & { id?: string }) => {
//         const columnWithId = {
//             ...newColumn,
//             id: newColumn.id || newColumn.title.toLowerCase().replace(/\s+/g, '-')
//         };
        
//         const updatedColumns = [...columns, columnWithId];
//         setColumns(updatedColumns);
        
//         // Save to localStorage immediately
//         try {
//             localStorage.setItem('emailColumnsData', JSON.stringify(updatedColumns));
//         } catch (error) {
//             console.error('Error saving columns after addition:', error);
//         }
        
//         toast.success(`Created new "${columnWithId.title}" column`);
//     };

//     // Handle column icon update
//     const handleUpdateColumnIcon = (columnId: string, icon: string) => {
//         const updatedColumns = columns.map(col =>
//             col.id === columnId
//                 ? { ...col, icon: icon }
//                 : col
//         );
        
//         setColumns(updatedColumns);
        
//         // Save to localStorage immediately
//         try {
//             localStorage.setItem('emailColumnsData', JSON.stringify(updatedColumns));
//         } catch (error) {
//             console.error('Error saving columns after icon update:', error);
//         }
        
//         toast.success("Column icon updated");
//     };

//     // Handle drag start
//     const handleDragStart = () => {
//         setIsDragging(true);
//     };

//     // Handle drag end
//     const handleDragEnd = (result: DropResult) => {
//         setIsDragging(false);

//         if (!result.destination) {
//             return;
//         }

//         const { draggableId, source, destination } = result;
//         const emailId = draggableId;
//         const sourceColumnId = source.droppableId;
//         const destinationColumnId = destination.droppableId;

//         if (sourceColumnId === destinationColumnId && source.index === destination.index) {
//             return;
//         }

//         setEmails(prevEmails => {
//             const updatedEmails = prevEmails.map(email => {
//                 if (email.id === emailId) {
//                     return { ...email, status: destinationColumnId };
//                 }
//                 return email;
//             });

//             return updatedEmails;
//         });

//         const destinationColumn = columns.find(col => col.id === destinationColumnId);
//         toast.success(`Email moved to ${destinationColumn?.title || destinationColumnId}`);
//     };

//     // Handle column editing - Trello style
//     const handleEditColumn = (column: EmailColumnType) => {
//         setEditingColumnId(column.id);
//         setEditingColumnName(column.title);
//     };

//     const handleSaveColumnEdit = () => {
//         if (!editingColumnId || !editingColumnName.trim()) {
//             toast.error("Please enter a valid column name");
//             return;
//         }

//         const updatedColumns = columns.map(col =>
//             col.id === editingColumnId
//                 ? { ...col, title: editingColumnName.trim() }
//                 : col
//         );
        
//         setColumns(updatedColumns);
        
//         // Save to localStorage immediately
//         try {
//             localStorage.setItem('emailColumnsData', JSON.stringify(updatedColumns));
//         } catch (error) {
//             console.error('Error saving columns after edit:', error);
//         }

//         setEditingColumnId(null);
//         setEditingColumnName("");
//         toast.success("Column updated successfully");
//     };

//     const handleCancelColumnEdit = () => {
//         setEditingColumnId(null);
//         setEditingColumnName("");
//     };

//     const handleDeleteColumn = (column: EmailColumnType) => {
//         if (["inbox", "urgent", "archive"].includes(column.id)) {
//             toast.error("Default columns cannot be deleted.");
//             return;
//         }
        
//         const updatedColumns = columns.filter(col => col.id !== column.id);
//         setColumns(updatedColumns);
        
//         // Save to localStorage immediately
//         try {
//             localStorage.setItem('emailColumnsData', JSON.stringify(updatedColumns));
//         } catch (error) {
//             console.error('Error saving columns after deletion:', error);
//         }
        
//         toast.success(`Deleted "${column.title}" column`);
//     };

//     // Handle email move via drag and drop selector
//     const handleEmailMove = (emailId: string, targetColumnId: string) => {
//         setEmails(prevEmails => {
//             const updatedEmails = prevEmails.map(email => {
//                 if (email.id === emailId) {
//                     return { ...email, status: targetColumnId };
//                 }
//                 return email;
//             });
//             return updatedEmails;
//         });

//         const targetColumn = columns.find(col => col.id === targetColumnId);
//         toast.success(`Email moved to ${targetColumn?.title || targetColumnId}`);
//     };

//     // Loading state - Trello style
//     if (isLoading) {
//         return (
//             <div className="w-full min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(0, 0.00%, 100.00%)' }}>
//                 <div className="text-center space-y-4">
//                     <div className="relative">
//                         <div className="w-12 h-12 mx-auto rounded-full bg-blue-500 animate-spin">
//                             <div className="absolute inset-1 bg-white rounded-full"></div>
//                         </div>
//                     </div>
//                     <p className="text-base font-normal text-gray-700">Loading email board...</p>
//                 </div>
//             </div>
//         );
//     }

//     // Error state
//     if (error) {
//         if (error === 'No linked email ID found') {
//             console.error('Error loading emails: No linked email ID found');
//             return <NoEmailState message="Please link an email to continue" />;
//         }

//         return (
//             <ErrorState 
//                 error={error} 
//                 onRetry={() => window.location.reload()} 
//             />
//         );
//     }

//     return (
//         <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
//             <div 
//                 className="min-h-screen"
//                 style={{ 
//                     fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
//                 }}
//             >
//                 <div className="max-w-full mx-auto">
//                     {/* Header Section */}
//                     <div className="mb-6">
//                         <div className="mb-4">
//                             <div>
//                                 <SearchFilterBar
//                                     emailFilter={emailFilter}
//                                     onFilterChange={setEmailFilter}
//                                     emailAccountType={emailAccountType}
//                                     onAccountTypeChange={setEmailAccountType}
//                                 />
//                             </div>
//                         </div>
//                     </div>

//                     {/* Email Board Container with horizontal scroll */}
//                     <div className="board-container mt-5">
//                         <EmailBoard
//                             columns={columns}
//                             emails={filteredEmails}
//                             pagination={pagination}
//                             itemsPerPage={itemsPerPage}
//                             onEditColumn={handleEditColumn}
//                             onDeleteColumn={handleDeleteColumn}
//                             onUpdateColumnIcon={handleUpdateColumnIcon}
//                             onPageChange={handlePageChange}
//                             onAddColumn={handleAddColumn}
//                             showNewColumnDialog={showNewColumnDialog}
//                             onNewColumnDialogChange={setShowNewColumnDialog}
//                             editingColumnId={editingColumnId}
//                             editingColumnName={editingColumnName}
//                             onStartEdit={handleEditColumn}
//                             onSaveEdit={handleSaveColumnEdit}
//                             onCancelEdit={handleCancelColumnEdit}
//                             onEditNameChange={setEditingColumnName}
//                             onEmailMove={handleEmailMove}
//                         />
//                     </div>
//                 </div>

//                 {/* Compose Modal */}
//                 <ComposeModal
//                     isOpen={showComposeDialog}
//                     onClose={() => setShowComposeDialog(false)}
//                 />

//                 {/* Trello-style custom scrollbar */}
//                 <style jsx>{`
//                     .board-container {
//                         position: relative;
//                     }

//                     .board-scroll::-webkit-scrollbar {
//                         height: 12px;
//                     }
                    
//                     .board-scroll::-webkit-scrollbar-track {
//                         background: rgba(255, 255, 255, 0.3);
//                         border-radius: 6px;
//                     }
                    
//                     .board-scroll::-webkit-scrollbar-thumb {
//                         background-color: rgba(0,0,0,0.3);
//                         border-radius: 6px;
//                         border: 2px solid hsl(214,91.3%,95.5%);
//                     }
                    
//                     .board-scroll::-webkit-scrollbar-thumb:hover {
//                         background-color: rgba(0,0,0,0.5);
//                     }

//                     .board-scroll {
//                         scrollbar-width: thin;
//                         scrollbar-color: rgba(0,0,0,0.3) rgba(255, 255, 255, 0.3);
//                     }

//                     .line-clamp-2 {
//                         display: -webkit-box;
//                         -webkit-line-clamp: 2;
//                         -webkit-box-orient: vertical;
//                         overflow: hidden;
//                     }

//                     .group:hover {
//                         transform: translateY(-1px);
//                     }
//                 `}</style>
//             </div>
//         </DragDropContext>
//     );
// };

// export default ProfessionalEmailInbox;

































































// 28/6/2025 2:32
// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";
// import { useState, useEffect, useContext, useCallback } from "react";
// import { DragDropContext, DropResult } from "react-beautiful-dnd";
// import { Mail, Archive, AlertCircle, Inbox, Star, CheckCircle, Plus, MoreHorizontal, Check, X } from "lucide-react";
// import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { getCookie } from "@/lib/utils/cookies";
// import { AuthContext } from "@/lib/context/auth";
// import { Email, EmailColumn as EmailColumnType, EmailCompose, EmailFilter, EmailAccountType, PaginationState } from "@/lib/types/email2";
// import { useCombinedAuth } from "@/components/providers/useCombinedAuth";

// // Import our new components
// import SearchFilterBar from "./SearchFilterBar";
// import { LoadingState, ErrorState, NoEmailState } from "./InboxStates";
// import EmailBoard from "./EmailBoard";
// import { ComposeModal } from "../AddEmailComponents/ComposeModal";

// const ProfessionalEmailInbox = () => {
//     // Move all hooks to the top level
//     const { token, user } = useContext(AuthContext);
//     const { djombi } = useCombinedAuth();
//     const djombiTokens = djombi.token || "";

//     // State
//     const [emails, setEmails] = useState<Email[]>([]);
//     const [columns, setColumns] = useState<EmailColumnType[]>([
//         { id: "inbox", title: "Inbox", icon: Inbox, gradient: "from-blue-500 to-cyan-500" },
//         { id: "urgent", title: "Urgent", icon: AlertCircle, gradient: "from-red-500 to-orange-500" },
//         { id: "follow-up", title: "Follow-Up", icon: Archive, gradient: "from-gray-500 to-slate-500" }
//     ]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);
//     const [showComposeDialog, setShowComposeDialog] = useState(false);
//     const [isDragging, setIsDragging] = useState(false);
//     const [emailAccountType, setEmailAccountType] = useState<EmailAccountType>("personal");
//     const [emailFilter, setEmailFilter] = useState<EmailFilter>({
//         searchTerm: "",
//         dateRange: "all",
//         hasAttachment: null,
//         isRead: null
//     });
//     const [composeEmail, setComposeEmail] = useState<EmailCompose>({
//         to: "",
//         subject: "",
//         content: ""
//     });
//     const [pagination, setPagination] = useState<PaginationState>({});
//     const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
//     const [editingColumnName, setEditingColumnName] = useState("");

//     const itemsPerPage = 12;

//     // Initialize pagination state for each column
//     const initializePagination = (columns: EmailColumnType[]) => {
//         const initialPagination: PaginationState = {};
//         columns.forEach(column => {
//             initialPagination[column.id] = {
//                 currentPage: 1,
//                 itemsPerPage: itemsPerPage
//             };
//         });
//         setPagination(initialPagination);
//     };

//     // Filter emails based on filters
//     const getFilteredEmails = (emails: Email[]): Email[] => {
//         let filtered = [...emails];

//         // Apply search filter
//         if (emailFilter.searchTerm) {
//             const searchTerm = emailFilter.searchTerm.toLowerCase();
//             filtered = filtered.filter(email =>
//                 email.subject.toLowerCase().includes(searchTerm) ||
//                 email.from.toLowerCase().includes(searchTerm) ||
//                 email.content.toLowerCase().includes(searchTerm)
//             );
//         }

//         // Apply attachment filter
//         if (emailFilter.hasAttachment !== null) {
//             filtered = filtered.filter(email => email.hasAttachment === emailFilter.hasAttachment);
//         }

//         // Apply read status filter
//         if (emailFilter.isRead !== null) {
//             filtered = filtered.filter(email => email.isRead === emailFilter.isRead);
//         }

//         return filtered;
//     };

//     const filteredEmails = getFilteredEmails(emails);

//     // Handle pagination
//     const handlePageChange = (columnId: string, page: number) => {
//         setPagination(prev => ({
//             ...prev,
//             [columnId]: {
//                 ...prev[columnId],
//                 currentPage: page
//             }
//         }));
//     };

//     // Handle compose email
//     const handleComposeEmail = (compose: EmailCompose) => {
//         setComposeEmail(compose);
//         setShowComposeDialog(true);
//     };

//     const handleSendEmail = async () => {
//         try {
//             // Implement your email sending logic here
//             console.log("Sending email:", composeEmail);
            
//             // For now, just show success message
//             toast.success("Email sent successfully!");
//             setShowComposeDialog(false);
//             setComposeEmail({ to: "", subject: "", content: "" });
//         } catch (error) {
//             toast.error("Failed to send email");
//         }
//     };

//     // Process email data from API response
//     const processEmailData = (data: any): Email[] => {
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

//     // Fetch emails using useCallback
//     const fetchEmails = useCallback(async () => {
//         setIsLoading(true);
//         setError(null);

//         try {
//             console.log("Token retrieved:", token ? `${token.access_token.substring(0, 10)}...` : 'No token found');

//             if (!token) {
//                 throw new Error('No access token available');
//             }

//             const linkedEmailId = getCookie('linkedEmailId') ||
//                 (typeof window !== 'undefined' ? localStorage.getItem('linkedEmailId') : null);
//             console.log("Linked Email ID:", linkedEmailId);

//             if (!linkedEmailId) {
//                 throw new Error('No linked email ID found');
//             }

//             const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//             console.log("Fetching from API endpoint:", apiEndpoint);

//             const response = await fetch(apiEndpoint, {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${djombiTokens}`
//                 }
//             });

//             const responseText = await response.text();
//             console.log("Raw response:", responseText);

//             let data;
//             try {
//                 data = JSON.parse(responseText);
//                 console.log("Parsed response data:", data);
//             } catch (e) {
//                 console.error("Failed to parse response as JSON:", e);
//                 throw new Error(`Invalid response format: ${responseText.substring(0, 100)}...`);
//             }

//             if (data.success === false) {
//                 const errorMessage = data.message || response.statusText;
//                 console.error("API error:", errorMessage);
//                 throw new Error(`API error: ${errorMessage}`);
//             }

//             const formattedEmails = processEmailData(data);
//             setEmails(formattedEmails);
//         } catch (err) {
//             console.error('Error fetching emails:', err);
//             setError(err instanceof Error ? err.message : 'Failed to fetch emails');
//         } finally {
//             setIsLoading(false);
//         }
//     }, [token, djombiTokens]);

//     // Fetch emails
//     useEffect(() => {
//         fetchEmails();
//     }, [fetchEmails]);

//     // Initialize pagination when columns change
//     useEffect(() => {
//         initializePagination(columns);
//     }, [columns]);

//     // Handle adding a new column
//     const handleAddColumn = (newColumn: Omit<EmailColumnType, 'id'> & { id?: string }) => {
//         const columnWithId = {
//             ...newColumn,
//             id: newColumn.id || newColumn.title.toLowerCase().replace(/\s+/g, '-')
//         };
        
//         setColumns([...columns, columnWithId]);
//         toast.success(`Created new "${columnWithId.title}" column`);
//     };

//     // Handle drag start
//     const handleDragStart = () => {
//         setIsDragging(true);
//     };

//     // Handle drag end
//     const handleDragEnd = (result: DropResult) => {
//         setIsDragging(false);

//         if (!result.destination) {
//             return;
//         }

//         const { draggableId, source, destination } = result;
//         const emailId = draggableId;
//         const sourceColumnId = source.droppableId;
//         const destinationColumnId = destination.droppableId;

//         if (sourceColumnId === destinationColumnId && source.index === destination.index) {
//             return;
//         }

//         setEmails(prevEmails => {
//             const updatedEmails = prevEmails.map(email => {
//                 if (email.id === emailId) {
//                     return { ...email, status: destinationColumnId };
//                 }
//                 return email;
//             });

//             return updatedEmails;
//         });

//         const destinationColumn = columns.find(col => col.id === destinationColumnId);
//         toast.success(`Email moved to ${destinationColumn?.title || destinationColumnId}`);
//     };

//     // Handle column editing - Trello style
//     const handleEditColumn = (column: EmailColumnType) => {
//         setEditingColumnId(column.id);
//         setEditingColumnName(column.title);
//     };

//     const handleSaveColumnEdit = () => {
//         if (!editingColumnId || !editingColumnName.trim()) {
//             toast.error("Please enter a valid column name");
//             return;
//         }

//         setColumns(prevColumns =>
//             prevColumns.map(col =>
//                 col.id === editingColumnId
//                     ? { ...col, title: editingColumnName.trim() }
//                     : col
//             )
//         );

//         setEditingColumnId(null);
//         setEditingColumnName("");
//         toast.success("Column updated successfully");
//     };

//     const handleCancelColumnEdit = () => {
//         setEditingColumnId(null);
//         setEditingColumnName("");
//     };

//     const handleDeleteColumn = (column: EmailColumnType) => {
//         if (["inbox", "urgent", "archive"].includes(column.id)) {
//             toast.error("Default columns cannot be deleted.");
//             return;
//         }
        
//         setColumns(columns.filter(col => col.id !== column.id));
//         toast.success(`Deleted "${column.title}" column`);
//     };

//     // Handle email move via drag and drop selector
//     const handleEmailMove = (emailId: string, targetColumnId: string) => {
//         setEmails(prevEmails => {
//             const updatedEmails = prevEmails.map(email => {
//                 if (email.id === emailId) {
//                     return { ...email, status: targetColumnId };
//                 }
//                 return email;
//             });
//             return updatedEmails;
//         });

//         const targetColumn = columns.find(col => col.id === targetColumnId);
//         toast.success(`Email moved to ${targetColumn?.title || targetColumnId}`);
//     };

//     // Loading state - Trello style
//     if (isLoading) {
//         return (
//             <div className="w-full min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(0, 0.00%, 100.00%)' }}>
//                 <div className="text-center space-y-4">
//                     <div className="relative">
//                         <div className="w-12 h-12 mx-auto rounded-full bg-blue-500 animate-spin">
//                             <div className="absolute inset-1 bg-white rounded-full"></div>
//                         </div>
//                     </div>
//                     <p className="text-base font-normal text-gray-700">Loading email board...</p>
//                 </div>
//             </div>
//         );
//     }

//     // Error state
//     if (error) {
//         if (error === 'No linked email ID found') {
//             console.error('Error loading emails: No linked email ID found');
//             return <NoEmailState message="Please link an email to continue" />;
//         }

//         return (
//             <ErrorState 
//                 error={error} 
//                 onRetry={() => window.location.reload()} 
//             />
//         );
//     }

//     return (
//         <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
//             <div 
//                 className="min-h-screen"
//                 style={{ 
//                     fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
//                 }}
//             >
//                 <div className="max-w-full mx-auto">
//                     {/* Header Section */}
//                     <div className="mb-6">
//                         <div className="mb-4">
//                             <div>
//                                 <SearchFilterBar
//                                     emailFilter={emailFilter}
//                                     onFilterChange={setEmailFilter}
//                                     emailAccountType={emailAccountType}
//                                     onAccountTypeChange={setEmailAccountType}
//                                 />
//                             </div>
//                         </div>
//                     </div>

//                     {/* Email Board Container with horizontal scroll */}
//                     <div className="board-container mt-5">
//                         <EmailBoard
//                             columns={columns}
//                             emails={filteredEmails}
//                             pagination={pagination}
//                             itemsPerPage={itemsPerPage}
//                             onEditColumn={handleEditColumn}
//                             onDeleteColumn={handleDeleteColumn}
//                             onPageChange={handlePageChange}
//                             onAddColumn={handleAddColumn}
//                             showNewColumnDialog={showNewColumnDialog}
//                             onNewColumnDialogChange={setShowNewColumnDialog}
//                             editingColumnId={editingColumnId}
//                             editingColumnName={editingColumnName}
//                             onStartEdit={handleEditColumn}
//                             onSaveEdit={handleSaveColumnEdit}
//                             onCancelEdit={handleCancelColumnEdit}
//                             onEditNameChange={setEditingColumnName}
//                             onEmailMove={handleEmailMove}
//                         />
//                     </div>
//                 </div>

//                 {/* Compose Modal */}
//                 <ComposeModal
//                     isOpen={showComposeDialog}
//                     onClose={() => setShowComposeDialog(false)}
//                 />

//                 {/* Trello-style custom scrollbar */}
//                 <style jsx>{`
//                     .board-container {
//                         position: relative;
//                     }

//                     .board-scroll::-webkit-scrollbar {
//                         height: 12px;
//                     }
                    
//                     .board-scroll::-webkit-scrollbar-track {
//                         background: rgba(255, 255, 255, 0.3);
//                         border-radius: 6px;
//                     }
                    
//                     .board-scroll::-webkit-scrollbar-thumb {
//                         background-color: rgba(0,0,0,0.3);
//                         border-radius: 6px;
//                         border: 2px solid hsl(214,91.3%,95.5%);
//                     }
                    
//                     .board-scroll::-webkit-scrollbar-thumb:hover {
//                         background-color: rgba(0,0,0,0.5);
//                     }

//                     .board-scroll {
//                         scrollbar-width: thin;
//                         scrollbar-color: rgba(0,0,0,0.3) rgba(255, 255, 255, 0.3);
//                     }

//                     .line-clamp-2 {
//                         display: -webkit-box;
//                         -webkit-line-clamp: 2;
//                         -webkit-box-orient: vertical;
//                         overflow: hidden;
//                     }

//                     .group:hover {
//                         transform: translateY(-1px);
//                     }
//                 `}</style>
//             </div>
//         </DragDropContext>
//     );
// };

// export default ProfessionalEmailInbox;







































































// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";
// import { useState, useEffect, useContext, useCallback } from "react";
// import { DragDropContext, DropResult } from "react-beautiful-dnd";
// import { Mail, Archive, AlertCircle, Inbox, Star, CheckCircle, Plus, MoreHorizontal, Check, X } from "lucide-react";
// import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { getCookie } from "@/lib/utils/cookies";
// import { AuthContext } from "@/lib/context/auth";
// import { Email, EmailColumn as EmailColumnType, EmailCompose, EmailFilter, EmailAccountType, PaginationState } from "@/lib/types/email2";
// import { useCombinedAuth } from "@/components/providers/useCombinedAuth";

// // Import our new components
// import SearchFilterBar from "./SearchFilterBar";
// import { LoadingState, ErrorState, NoEmailState } from "./InboxStates";
// import EmailBoard from "./EmailBoard";
// import { ComposeModal } from "../AddEmailComponents/ComposeModal";

// const ProfessionalEmailInbox = () => {
//     // Move all hooks to the top level
//     const { token, user } = useContext(AuthContext);
//     const { djombi } = useCombinedAuth();
//     const djombiTokens = djombi.token || "";

//     // State
//     const [emails, setEmails] = useState<Email[]>([]);
//     const [columns, setColumns] = useState<EmailColumnType[]>([
//         { id: "inbox", title: "Inbox", icon: Inbox, gradient: "from-blue-500 to-cyan-500" },
//         { id: "urgent", title: "Urgent", icon: AlertCircle, gradient: "from-red-500 to-orange-500" },
//         { id: "archive", title: "Archive", icon: Archive, gradient: "from-gray-500 to-slate-500" }
//     ]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);
//     const [showComposeDialog, setShowComposeDialog] = useState(false);
//     const [isDragging, setIsDragging] = useState(false);
//     const [emailAccountType, setEmailAccountType] = useState<EmailAccountType>("personal");
//     const [emailFilter, setEmailFilter] = useState<EmailFilter>({
//         searchTerm: "",
//         dateRange: "all",
//         hasAttachment: null,
//         isRead: null
//     });
//     const [composeEmail, setComposeEmail] = useState<EmailCompose>({
//         to: "",
//         subject: "",
//         content: ""
//     });
//     const [pagination, setPagination] = useState<PaginationState>({});
//     const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
//     const [editingColumnName, setEditingColumnName] = useState("");

//     const itemsPerPage = 12;

//     // Initialize pagination state for each column
//     const initializePagination = (columns: EmailColumnType[]) => {
//         const initialPagination: PaginationState = {};
//         columns.forEach(column => {
//             initialPagination[column.id] = {
//                 currentPage: 1,
//                 itemsPerPage: itemsPerPage
//             };
//         });
//         setPagination(initialPagination);
//     };

//     // Filter emails based on filters
//     const getFilteredEmails = (emails: Email[]): Email[] => {
//         let filtered = [...emails];

//         // Apply search filter
//         if (emailFilter.searchTerm) {
//             const searchTerm = emailFilter.searchTerm.toLowerCase();
//             filtered = filtered.filter(email =>
//                 email.subject.toLowerCase().includes(searchTerm) ||
//                 email.from.toLowerCase().includes(searchTerm) ||
//                 email.content.toLowerCase().includes(searchTerm)
//             );
//         }

//         // Apply attachment filter
//         if (emailFilter.hasAttachment !== null) {
//             filtered = filtered.filter(email => email.hasAttachment === emailFilter.hasAttachment);
//         }

//         // Apply read status filter
//         if (emailFilter.isRead !== null) {
//             filtered = filtered.filter(email => email.isRead === emailFilter.isRead);
//         }

//         return filtered;
//     };

//     const filteredEmails = getFilteredEmails(emails);

//     // Handle pagination
//     const handlePageChange = (columnId: string, page: number) => {
//         setPagination(prev => ({
//             ...prev,
//             [columnId]: {
//                 ...prev[columnId],
//                 currentPage: page
//             }
//         }));
//     };

//     // Handle compose email
//     const handleComposeEmail = (compose: EmailCompose) => {
//         setComposeEmail(compose);
//         setShowComposeDialog(true);
//     };

//     const handleSendEmail = async () => {
//         try {
//             // Implement your email sending logic here
//             console.log("Sending email:", composeEmail);
            
//             // For now, just show success message
//             toast.success("Email sent successfully!");
//             setShowComposeDialog(false);
//             setComposeEmail({ to: "", subject: "", content: "" });
//         } catch (error) {
//             toast.error("Failed to send email");
//         }
//     };

//     // Process email data from API response
//     const processEmailData = (data: any): Email[] => {
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

//     // Fetch emails using useCallback
//     const fetchEmails = useCallback(async () => {
//         setIsLoading(true);
//         setError(null);

//         try {
//             console.log("Token retrieved:", token ? `${token.access_token.substring(0, 10)}...` : 'No token found');

//             if (!token) {
//                 throw new Error('No access token available');
//             }

//             const linkedEmailId = getCookie('linkedEmailId') ||
//                 (typeof window !== 'undefined' ? localStorage.getItem('linkedEmailId') : null);
//             console.log("Linked Email ID:", linkedEmailId);

//             if (!linkedEmailId) {
//                 throw new Error('No linked email ID found');
//             }

//             const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//             console.log("Fetching from API endpoint:", apiEndpoint);

//             const response = await fetch(apiEndpoint, {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${djombiTokens}`
//                 }
//             });

//             const responseText = await response.text();
//             console.log("Raw response:", responseText);

//             let data;
//             try {
//                 data = JSON.parse(responseText);
//                 console.log("Parsed response data:", data);
//             } catch (e) {
//                 console.error("Failed to parse response as JSON:", e);
//                 throw new Error(`Invalid response format: ${responseText.substring(0, 100)}...`);
//             }

//             if (data.success === false) {
//                 const errorMessage = data.message || response.statusText;
//                 console.error("API error:", errorMessage);
//                 throw new Error(`API error: ${errorMessage}`);
//             }

//             const formattedEmails = processEmailData(data);
//             setEmails(formattedEmails);
//         } catch (err) {
//             console.error('Error fetching emails:', err);
//             setError(err instanceof Error ? err.message : 'Failed to fetch emails');
//         } finally {
//             setIsLoading(false);
//         }
//     }, [token, djombiTokens]);

//     // Fetch emails
//     useEffect(() => {
//         fetchEmails();
//     }, [fetchEmails]);

//     // Initialize pagination when columns change
//     useEffect(() => {
//         initializePagination(columns);
//     }, [columns]);

//     // Handle adding a new column
//     const handleAddColumn = (newColumn: Omit<EmailColumnType, 'id'> & { id?: string }) => {
//         const columnWithId = {
//             ...newColumn,
//             id: newColumn.id || newColumn.title.toLowerCase().replace(/\s+/g, '-')
//         };
        
//         setColumns([...columns, columnWithId]);
//         toast.success(`Created new "${columnWithId.title}" column`);
//     };

//     // Handle drag start
//     const handleDragStart = () => {
//         setIsDragging(true);
//     };

//     // Handle drag end
//     const handleDragEnd = (result: DropResult) => {
//         setIsDragging(false);

//         if (!result.destination) {
//             return;
//         }

//         const { draggableId, source, destination } = result;
//         const emailId = draggableId;
//         const sourceColumnId = source.droppableId;
//         const destinationColumnId = destination.droppableId;

//         if (sourceColumnId === destinationColumnId && source.index === destination.index) {
//             return;
//         }

//         setEmails(prevEmails => {
//             const updatedEmails = prevEmails.map(email => {
//                 if (email.id === emailId) {
//                     return { ...email, status: destinationColumnId };
//                 }
//                 return email;
//             });

//             return updatedEmails;
//         });

//         const destinationColumn = columns.find(col => col.id === destinationColumnId);
//         toast.success(`Email moved to ${destinationColumn?.title || destinationColumnId}`);
//     };

//     // Handle column editing - Trello style
//     const handleEditColumn = (column: EmailColumnType) => {
//         setEditingColumnId(column.id);
//         setEditingColumnName(column.title);
//     };

//     const handleSaveColumnEdit = () => {
//         if (!editingColumnId || !editingColumnName.trim()) {
//             toast.error("Please enter a valid column name");
//             return;
//         }

//         setColumns(prevColumns =>
//             prevColumns.map(col =>
//                 col.id === editingColumnId
//                     ? { ...col, title: editingColumnName.trim() }
//                     : col
//             )
//         );

//         setEditingColumnId(null);
//         setEditingColumnName("");
//         toast.success("Column updated successfully");
//     };

//     const handleCancelColumnEdit = () => {
//         setEditingColumnId(null);
//         setEditingColumnName("");
//     };

//     const handleDeleteColumn = (column: EmailColumnType) => {
//         if (["inbox", "urgent", "archive"].includes(column.id)) {
//             toast.error("Default columns cannot be deleted.");
//             return;
//         }
        
//         setColumns(columns.filter(col => col.id !== column.id));
//         toast.success(`Deleted "${column.title}" column`);
//     };

//     // Handle email move via drag and drop selector
//     const handleEmailMove = (emailId: string, targetColumnId: string) => {
//         setEmails(prevEmails => {
//             const updatedEmails = prevEmails.map(email => {
//                 if (email.id === emailId) {
//                     return { ...email, status: targetColumnId };
//                 }
//                 return email;
//             });
//             return updatedEmails;
//         });

//         const targetColumn = columns.find(col => col.id === targetColumnId);
//         toast.success(`Email moved to ${targetColumn?.title || targetColumnId}`);
//     };

//     // Loading state - Trello style
//     if (isLoading) {
//         return (
//             <div className="w-full min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(0, 0.00%, 100.00%)' }}>
//                 <div className="text-center space-y-4">
//                     <div className="relative">
//                         <div className="w-12 h-12 mx-auto rounded-full bg-blue-500 animate-spin">
//                             <div className="absolute inset-1 bg-white rounded-full"></div>
//                         </div>
//                     </div>
//                     <p className="text-base font-normal text-gray-700">Loading email board...</p>
//                 </div>
//             </div>
//         );
//     }

//     // Error state
//     if (error) {
//         if (error === 'No linked email ID found') {
//             console.error('Error loading emails: No linked email ID found');
//             return <NoEmailState message="Please link an email to continue" />;
//         }

//         return (
//             <ErrorState 
//                 error={error} 
//                 onRetry={() => window.location.reload()} 
//             />
//         );
//     }

//     return (
//         <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
//             <div 
//                 className="min-h-screen"
//                 style={{ 
//                     fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
//                 }}
//             >
//                 <div className="max-w-full mx-auto">
//                     {/* Header Section */}
//                     <div className="mb-6">
//                         <div className="mb-4">
//                             <div>
//                                 <SearchFilterBar
//                                     emailFilter={emailFilter}
//                                     onFilterChange={setEmailFilter}
//                                     emailAccountType={emailAccountType}
//                                     onAccountTypeChange={setEmailAccountType}
//                                 />
//                             </div>
//                         </div>
//                     </div>

//                     {/* Email Board Container with horizontal scroll */}
//                     <div className="board-container mt-5">
//                         <EmailBoard
//                             columns={columns}
//                             emails={filteredEmails}
//                             pagination={pagination}
//                             itemsPerPage={itemsPerPage}
//                             onEditColumn={handleEditColumn}
//                             onDeleteColumn={handleDeleteColumn}
//                             onPageChange={handlePageChange}
//                             onAddColumn={handleAddColumn}
//                             showNewColumnDialog={showNewColumnDialog}
//                             onNewColumnDialogChange={setShowNewColumnDialog}
//                             editingColumnId={editingColumnId}
//                             editingColumnName={editingColumnName}
//                             onStartEdit={handleEditColumn}
//                             onSaveEdit={handleSaveColumnEdit}
//                             onCancelEdit={handleCancelColumnEdit}
//                             onEditNameChange={setEditingColumnName}
//                             onEmailMove={handleEmailMove}
//                         />
//                     </div>
//                 </div>

//                 {/* Compose Modal */}
//                 <ComposeModal
//                     isOpen={showComposeDialog}
//                     onClose={() => setShowComposeDialog(false)}
//                 />

//                 {/* Trello-style custom scrollbar */}
//                 <style jsx>{`
//                     .board-container {
//                         position: relative;
//                     }

//                     .board-scroll::-webkit-scrollbar {
//                         height: 12px;
//                     }
                    
//                     .board-scroll::-webkit-scrollbar-track {
//                         background: rgba(255, 255, 255, 0.3);
//                         border-radius: 6px;
//                     }
                    
//                     .board-scroll::-webkit-scrollbar-thumb {
//                         background-color: rgba(0,0,0,0.3);
//                         border-radius: 6px;
//                         border: 2px solid hsl(214,91.3%,95.5%);
//                     }
                    
//                     .board-scroll::-webkit-scrollbar-thumb:hover {
//                         background-color: rgba(0,0,0,0.5);
//                     }

//                     .board-scroll {
//                         scrollbar-width: thin;
//                         scrollbar-color: rgba(0,0,0,0.3) rgba(255, 255, 255, 0.3);
//                     }

//                     .line-clamp-2 {
//                         display: -webkit-box;
//                         -webkit-line-clamp: 2;
//                         -webkit-box-orient: vertical;
//                         overflow: hidden;
//                     }

//                     .group:hover {
//                         transform: translateY(-1px);
//                     }
//                 `}</style>
//             </div>
//         </DragDropContext>
//     );
// };

// export default ProfessionalEmailInbox;





















































// working latest
// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";
// import { useState, useEffect, useContext, useCallback } from "react";
// import { DragDropContext, DropResult } from "react-beautiful-dnd";
// import { Mail, Archive, AlertCircle, Inbox, Star, CheckCircle, Plus, MoreHorizontal, Check, X } from "lucide-react";
// import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { getCookie } from "@/lib/utils/cookies";
// import { AuthContext } from "@/lib/context/auth";
// import { Email, EmailColumn as EmailColumnType, TabType, TabConfig, EmailCompose, EmailFilter, EmailAccountType, PaginationState } from "@/lib/types/email2";
// import { useCombinedAuth } from "@/components/providers/useCombinedAuth";

// // Import our new components
// import SearchFilterBar from "./SearchFilterBar";
// import TabNavigation from "./TabNavigation";
// import { LoadingState, ErrorState, NoEmailState } from "./InboxStates";
// import EmailBoard from "./EmailBoard";
// import { ComposeModal } from "../AddEmailComponents/ComposeModal";

// const ProfessionalEmailInbox = () => {
//     // Move all hooks to the top level
//     const { token, user } = useContext(AuthContext);
//     const { djombi } = useCombinedAuth();
//     const djombiTokens = djombi.token || "";

//     // State
//     const [emails, setEmails] = useState<Email[]>([]);
//     const [columns, setColumns] = useState<EmailColumnType[]>([
//         { id: "inbox", title: "Inbox", icon: Inbox, gradient: "from-blue-500 to-cyan-500" },
//         { id: "urgent", title: "Urgent", icon: AlertCircle, gradient: "from-red-500 to-orange-500" },
//         { id: "archive", title: "Archive", icon: Archive, gradient: "from-gray-500 to-slate-500" }
//     ]);
//     const [activeTab, setActiveTab] = useState<TabType>("viewAll");
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);
//     const [showComposeDialog, setShowComposeDialog] = useState(false);
//     const [isDragging, setIsDragging] = useState(false);
//     const [emailAccountType, setEmailAccountType] = useState<EmailAccountType>("personal");
//     const [emailFilter, setEmailFilter] = useState<EmailFilter>({
//         searchTerm: "",
//         dateRange: "all",
//         hasAttachment: null,
//         isRead: null
//     });
//     const [composeEmail, setComposeEmail] = useState<EmailCompose>({
//         to: "",
//         subject: "",
//         content: ""
//     });
//     const [pagination, setPagination] = useState<PaginationState>({});
//     const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
//     const [editingColumnName, setEditingColumnName] = useState("");

//     const itemsPerPage = 12;

//     // Tab configuration - Updated with proper icons
//     const tabs: TabConfig[] = [
//         { id: "viewAll", label: "View All", icon: Star, gradient: "from-blue-500 to-cyan-500" },
//         { id: "urgent", label: "Urgent", icon: AlertCircle, gradient: "from-red-500 to-orange-500" },
//         { id: "archive", label: "Archive", icon: Archive, gradient: "from-gray-500 to-slate-500" }
//     ];

//     // Initialize pagination state for each column
//     const initializePagination = (columns: EmailColumnType[]) => {
//         const initialPagination: PaginationState = {};
//         columns.forEach(column => {
//             initialPagination[column.id] = {
//                 currentPage: 1,
//                 itemsPerPage: itemsPerPage
//             };
//         });
//         setPagination(initialPagination);
//     };

//     // Filter emails based on active tab and filters
//     const getFilteredEmails = (emails: Email[]): Email[] => {
//         let filtered = [...emails];

//         // Filter by tab
//         if (activeTab !== "viewAll") {
//             filtered = filtered.filter(email => {
//                 switch (activeTab) {
//                     case "urgent":
//                         return email.isUrgent;
//                     case "archive":
//                         return email.status === "archive";
//                     default:
//                         return true;
//                 }
//             });
//         }

//         // Apply search filter
//         if (emailFilter.searchTerm) {
//             const searchTerm = emailFilter.searchTerm.toLowerCase();
//             filtered = filtered.filter(email =>
//                 email.subject.toLowerCase().includes(searchTerm) ||
//                 email.from.toLowerCase().includes(searchTerm) ||
//                 email.content.toLowerCase().includes(searchTerm)
//             );
//         }

//         // Apply attachment filter
//         if (emailFilter.hasAttachment !== null) {
//             filtered = filtered.filter(email => email.hasAttachment === emailFilter.hasAttachment);
//         }

//         // Apply read status filter
//         if (emailFilter.isRead !== null) {
//             filtered = filtered.filter(email => email.isRead === emailFilter.isRead);
//         }

//         return filtered;
//     };

//     const filteredEmails = getFilteredEmails(emails);

//     // Handle pagination
//     const handlePageChange = (columnId: string, page: number) => {
//         setPagination(prev => ({
//             ...prev,
//             [columnId]: {
//                 ...prev[columnId],
//                 currentPage: page
//             }
//         }));
//     };

//     // Handle compose email
//     const handleComposeEmail = (compose: EmailCompose) => {
//         setComposeEmail(compose);
//         setShowComposeDialog(true);
//     };

//     const handleSendEmail = async () => {
//         try {
//             // Implement your email sending logic here
//             console.log("Sending email:", composeEmail);
            
//             // For now, just show success message
//             toast.success("Email sent successfully!");
//             setShowComposeDialog(false);
//             setComposeEmail({ to: "", subject: "", content: "" });
//         } catch (error) {
//             toast.error("Failed to send email");
//         }
//     };

//     // Process email data from API response
//     const processEmailData = (data: any): Email[] => {
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

//     // Fetch emails using useCallback
//     const fetchEmails = useCallback(async () => {
//         setIsLoading(true);
//         setError(null);

//         try {
//             console.log("Token retrieved:", token ? `${token.access_token.substring(0, 10)}...` : 'No token found');

//             if (!token) {
//                 throw new Error('No access token available');
//             }

//             const linkedEmailId = getCookie('linkedEmailId') ||
//                 (typeof window !== 'undefined' ? localStorage.getItem('linkedEmailId') : null);
//             console.log("Linked Email ID:", linkedEmailId);

//             if (!linkedEmailId) {
//                 throw new Error('No linked email ID found');
//             }

//             const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//             console.log("Fetching from API endpoint:", apiEndpoint);

//             const response = await fetch(apiEndpoint, {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${djombiTokens}`
//                 }
//             });

//             const responseText = await response.text();
//             console.log("Raw response:", responseText);

//             let data;
//             try {
//                 data = JSON.parse(responseText);
//                 console.log("Parsed response data:", data);
//             } catch (e) {
//                 console.error("Failed to parse response as JSON:", e);
//                 throw new Error(`Invalid response format: ${responseText.substring(0, 100)}...`);
//             }

//             if (data.success === false) {
//                 const errorMessage = data.message || response.statusText;
//                 console.error("API error:", errorMessage);
//                 throw new Error(`API error: ${errorMessage}`);
//             }

//             const formattedEmails = processEmailData(data);
//             setEmails(formattedEmails);
//         } catch (err) {
//             console.error('Error fetching emails:', err);
//             setError(err instanceof Error ? err.message : 'Failed to fetch emails');
//         } finally {
//             setIsLoading(false);
//         }
//     }, [token, djombiTokens]);

//     // Fetch emails
//     useEffect(() => {
//         fetchEmails();
//     }, [fetchEmails]);

//     // Initialize pagination when columns change
//     useEffect(() => {
//         initializePagination(columns);
//     }, [columns]);

//     // Handle adding a new column
//     const handleAddColumn = (newColumn: Omit<EmailColumnType, 'id'> & { id?: string }) => {
//         const columnWithId = {
//             ...newColumn,
//             id: newColumn.id || newColumn.title.toLowerCase().replace(/\s+/g, '-')
//         };
        
//         setColumns([...columns, columnWithId]);
//         toast.success(`Created new "${columnWithId.title}" column`);
//     };

//     // Handle drag start
//     const handleDragStart = () => {
//         setIsDragging(true);
//     };

//     // Handle drag end
//     const handleDragEnd = (result: DropResult) => {
//         setIsDragging(false);

//         if (!result.destination) {
//             return;
//         }

//         const { draggableId, source, destination } = result;
//         const emailId = draggableId;
//         const sourceColumnId = source.droppableId;
//         const destinationColumnId = destination.droppableId;

//         if (sourceColumnId === destinationColumnId && source.index === destination.index) {
//             return;
//         }

//         setEmails(prevEmails => {
//             const updatedEmails = prevEmails.map(email => {
//                 if (email.id === emailId) {
//                     return { ...email, status: destinationColumnId };
//                 }
//                 return email;
//             });

//             return updatedEmails;
//         });

//         const destinationColumn = columns.find(col => col.id === destinationColumnId);
//         toast.success(`Email moved to ${destinationColumn?.title || destinationColumnId}`);
//     };

//     // Handle column editing - Trello style
//     const handleEditColumn = (column: EmailColumnType) => {
//         setEditingColumnId(column.id);
//         setEditingColumnName(column.title);
//     };

//     const handleSaveColumnEdit = () => {
//         if (!editingColumnId || !editingColumnName.trim()) {
//             toast.error("Please enter a valid column name");
//             return;
//         }

//         setColumns(prevColumns =>
//             prevColumns.map(col =>
//                 col.id === editingColumnId
//                     ? { ...col, title: editingColumnName.trim() }
//                     : col
//             )
//         );

//         setEditingColumnId(null);
//         setEditingColumnName("");
//         toast.success("Column updated successfully");
//     };

//     const handleCancelColumnEdit = () => {
//         setEditingColumnId(null);
//         setEditingColumnName("");
//     };

//     const handleDeleteColumn = (column: EmailColumnType) => {
//         if (["inbox", "urgent", "archive"].includes(column.id)) {
//             toast.error("Default columns cannot be deleted.");
//             return;
//         }
        
//         setColumns(columns.filter(col => col.id !== column.id));
//         toast.success(`Deleted "${column.title}" column`);
//     };

//     // Loading state - Trello style
//     if (isLoading) {
//         return (
//             <div className="w-full min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(0, 0.00%, 100.00%)' }}>
//                 <div className="text-center space-y-4">
//                     <div className="relative">
//                         <div className="w-12 h-12 mx-auto rounded-full bg-blue-500 animate-spin">
//                             <div className="absolute inset-1 bg-white rounded-full"></div>
//                         </div>
//                     </div>
//                     <p className="text-base font-normal text-gray-700">Loading email board...</p>
//                 </div>
//             </div>
//         );
//     }

//     // Error state
//     if (error) {
//         if (error === 'No linked email ID found') {
//             console.error('Error loading emails: No linked email ID found');
//             return <NoEmailState message="Please link an email to continue" />;
//         }

//         return (
//             <ErrorState 
//                 error={error} 
//                 onRetry={() => window.location.reload()} 
//             />
//         );
//     }

//     return (
//         <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
//             <div 
//                 className="min-h-screen p-4"
//                 style={{ 
//                     // backgroundColor: 'hsl(214,91.3%,95.5%)',
//                     fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
//                 }}
//             >
//                 <div className="max-w-full mx-auto">
//                     {/* Header Section - Trello Style */}
//                     <div className="mb-6">
//                         <div className="mb-4">
//                             <div>
//                                 {/* <h1 className="text-lg font-bold text-gray-800 mb-2">
//                                     Email Inbox
//                                 </h1> */}
//                                 <SearchFilterBar
//                                     emailFilter={emailFilter}
//                                     onFilterChange={setEmailFilter}
//                                     emailAccountType={emailAccountType}
//                                     onAccountTypeChange={setEmailAccountType}
//                                 />
//                             </div>
//                         </div>

//                         {/* Enhanced Tab Navigation - Trello Style */}
//                         <div className="bg-white/70 backdrop-blur-sm p-1 rounded-lg border border-gray-200/50 overflow-x-auto shadow-sm">
//                             <div className="flex gap-1 min-w-max sm:min-w-0">
//                                 {tabs.map((tab) => {
//                                     const IconComponent = tab.icon;
//                                     const isActive = activeTab === tab.id;

//                                     return (
//                                         <Button
//                                             key={tab.id}
//                                             variant="ghost"
//                                             className={`relative px-3 py-2 rounded-md font-medium transition-all duration-200 whitespace-nowrap text-sm ${isActive
//                                                 ? `bg-gradient-to-r ${tab.gradient} text-white shadow-md hover:shadow-lg`
//                                                 : "text-gray-600 hover:text-gray-800 hover:bg-gray-100/80"
//                                             }`}
//                                             onClick={() => setActiveTab(tab.id as TabType)}
//                                         >
//                                             <div className="flex items-center gap-2">
//                                                 <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
//                                                 <span>{tab.label}</span>
//                                             </div>
//                                             {isActive && (
//                                                 <div className="absolute inset-0 rounded-md bg-white/10"></div>
//                                             )}
//                                         </Button>
//                                     );
//                                 })}
//                             </div>
//                         </div>
//                     </div>

//                     {/* Email Board Container with horizontal scroll */}
//                     <div className="board-container mt-5">
//                         <EmailBoard
//                             columns={columns}
//                             emails={filteredEmails}
//                             pagination={pagination}
//                             itemsPerPage={itemsPerPage}
//                             onEditColumn={handleEditColumn}
//                             onDeleteColumn={handleDeleteColumn}
//                             onPageChange={handlePageChange}
//                             onAddColumn={handleAddColumn}
//                             showNewColumnDialog={showNewColumnDialog}
//                             onNewColumnDialogChange={setShowNewColumnDialog}
//                             editingColumnId={editingColumnId}
//                             editingColumnName={editingColumnName}
//                             onStartEdit={handleEditColumn}
//                             onSaveEdit={handleSaveColumnEdit}
//                             onCancelEdit={handleCancelColumnEdit}
//                             onEditNameChange={setEditingColumnName}
//                         />
//                     </div>
//                 </div>

//                 {/* Trello-style custom scrollbar */}
//                 <style jsx>{`
//                     .board-container {
//                         position: relative;
//                     }

//                     .board-scroll::-webkit-scrollbar {
//                         height: 12px;
//                     }
                    
//                     .board-scroll::-webkit-scrollbar-track {
//                         background: rgba(255, 255, 255, 0.3);
//                         border-radius: 6px;
//                     }
                    
//                     .board-scroll::-webkit-scrollbar-thumb {
//                         background-color: rgba(0,0,0,0.3);
//                         border-radius: 6px;
//                         border: 2px solid hsl(214,91.3%,95.5%);
//                     }
                    
//                     .board-scroll::-webkit-scrollbar-thumb:hover {
//                         background-color: rgba(0,0,0,0.5);
//                     }

//                     .board-scroll {
//                         scrollbar-width: thin;
//                         scrollbar-color: rgba(0,0,0,0.3) rgba(255, 255, 255, 0.3);
//                     }

//                     .line-clamp-2 {
//                         display: -webkit-box;
//                         -webkit-line-clamp: 2;
//                         -webkit-box-orient: vertical;
//                         overflow: hidden;
//                     }

//                     .group:hover {
//                         transform: translateY(-1px);
//                     }
//                 `}</style>
//             </div>
//         </DragDropContext>
//     );
// };

// export default ProfessionalEmailInbox;




































































// Daniel UI Design
// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";
// import { useState, useEffect, useContext, useCallback } from "react";
// import { DragDropContext, DropResult } from "react-beautiful-dnd";
// import { Mail, Archive, AlertCircle, Inbox, Star, CheckCircle } from "lucide-react";
// import { toast } from "sonner";
// import { getCookie } from "@/lib/utils/cookies";
// import { AuthContext } from "@/lib/context/auth";
// import { Email, EmailColumn as EmailColumnType, TabType, TabConfig, EmailCompose, EmailFilter, EmailAccountType, PaginationState } from "@/lib/types/email2";
// import { useCombinedAuth } from "@/components/providers/useCombinedAuth";

// // Import our new components
// import SearchFilterBar from "./SearchFilterBar";
// import TabNavigation from "./TabNavigation";
// import EmailBoard from "./EmailBoard";
// import { LoadingState, ErrorState, NoEmailState } from "./InboxStates";

// const ProfessionalEmailInbox = () => {
//     // Move all hooks to the top level
//     const { token, user } = useContext(AuthContext);
//     const { djombi } = useCombinedAuth();
//     const djombiTokens = djombi.token || "";

//     // State
//     const [emails, setEmails] = useState<Email[]>([]);
//     const [columns, setColumns] = useState<EmailColumnType[]>([
//         { id: "inbox", title: "Inbox", icon: Inbox, gradient: "from-blue-500 to-cyan-500" },
//         { id: "urgent", title: "Urgent", icon: AlertCircle, gradient: "from-red-500 to-orange-500" },
//         { id: "archive", title: "Archive", icon: Archive, gradient: "from-gray-500 to-slate-500" }
//     ]);
//     const [activeTab, setActiveTab] = useState<TabType>("viewAll");
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);
//     const [showComposeDialog, setShowComposeDialog] = useState(false);
//     const [isDragging, setIsDragging] = useState(false);
//     const [emailAccountType, setEmailAccountType] = useState<EmailAccountType>("personal");
//     const [emailFilter, setEmailFilter] = useState<EmailFilter>({
//         searchTerm: "",
//         dateRange: "all",
//         hasAttachment: null,
//         isRead: null
//     });
//     const [composeEmail, setComposeEmail] = useState<EmailCompose>({
//         to: "",
//         subject: "",
//         content: ""
//     });
//     const [pagination, setPagination] = useState<PaginationState>({});

//     const itemsPerPage = 12;

//     // Tab configuration - Updated with proper icons
//     const tabs: TabConfig[] = [
//         { id: "viewAll", label: "View All", icon: Star, gradient: "from-blue-500 to-cyan-500" },
//         { id: "urgent", label: "Urgent", icon: AlertCircle, gradient: "from-red-500 to-orange-500" },
//         { id: "archive", label: "Archive", icon: Archive, gradient: "from-gray-500 to-slate-500" }
//     ];

//     // Initialize pagination state for each column
//     const initializePagination = (columns: EmailColumnType[]) => {
//         const initialPagination: PaginationState = {};
//         columns.forEach(column => {
//             initialPagination[column.id] = {
//                 currentPage: 1,
//                 itemsPerPage: itemsPerPage
//             };
//         });
//         setPagination(initialPagination);
//     };

//     // Filter emails based on active tab and filters
//     const getFilteredEmails = (emails: Email[]): Email[] => {
//         let filtered = [...emails];

//         // Filter by tab
//         if (activeTab !== "viewAll") {
//             filtered = filtered.filter(email => {
//                 switch (activeTab) {
//                     case "urgent":
//                         return email.isUrgent;
//                     case "archive":
//                         return email.status === "archive";
//                     default:
//                         return true;
//                 }
//             });
//         }

//         // Apply search filter
//         if (emailFilter.searchTerm) {
//             const searchTerm = emailFilter.searchTerm.toLowerCase();
//             filtered = filtered.filter(email =>
//                 email.subject.toLowerCase().includes(searchTerm) ||
//                 email.from.toLowerCase().includes(searchTerm) ||
//                 email.content.toLowerCase().includes(searchTerm)
//             );
//         }

//         // Apply attachment filter
//         if (emailFilter.hasAttachment !== null) {
//             filtered = filtered.filter(email => email.hasAttachment === emailFilter.hasAttachment);
//         }

//         // Apply read status filter
//         if (emailFilter.isRead !== null) {
//             filtered = filtered.filter(email => email.isRead === emailFilter.isRead);
//         }

//         return filtered;
//     };

//     const filteredEmails = getFilteredEmails(emails);

//     // Handle pagination
//     const handlePageChange = (columnId: string, page: number) => {
//         setPagination(prev => ({
//             ...prev,
//             [columnId]: {
//                 ...prev[columnId],
//                 currentPage: page
//             }
//         }));
//     };

//     // Handle compose email
//     const handleComposeEmail = (compose: EmailCompose) => {
//         setComposeEmail(compose);
//         setShowComposeDialog(true);
//     };

//     const handleSendEmail = async () => {
//         try {
//             // Implement your email sending logic here
//             console.log("Sending email:", composeEmail);
            
//             // For now, just show success message
//             toast.success("Email sent successfully!");
//             setShowComposeDialog(false);
//             setComposeEmail({ to: "", subject: "", content: "" });
//         } catch (error) {
//             toast.error("Failed to send email");
//         }
//     };

//     // Process email data from API response
//     const processEmailData = (data: any): Email[] => {
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

//     // Fetch emails using useCallback
//     const fetchEmails = useCallback(async () => {
//         setIsLoading(true);
//         setError(null);

//         try {
//             console.log("Token retrieved:", token ? `${token.access_token.substring(0, 10)}...` : 'No token found');

//             if (!token) {
//                 throw new Error('No access token available');
//             }

//             const linkedEmailId = getCookie('linkedEmailId') ||
//                 (typeof window !== 'undefined' ? localStorage.getItem('linkedEmailId') : null);
//             console.log("Linked Email ID:", linkedEmailId);

//             if (!linkedEmailId) {
//                 throw new Error('No linked email ID found');
//             }

//             const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//             console.log("Fetching from API endpoint:", apiEndpoint);

//             const response = await fetch(apiEndpoint, {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${djombiTokens}`
//                 }
//             });

//             const responseText = await response.text();
//             console.log("Raw response:", responseText);

//             let data;
//             try {
//                 data = JSON.parse(responseText);
//                 console.log("Parsed response data:", data);
//             } catch (e) {
//                 console.error("Failed to parse response as JSON:", e);
//                 throw new Error(`Invalid response format: ${responseText.substring(0, 100)}...`);
//             }

//             if (data.success === false) {
//                 const errorMessage = data.message || response.statusText;
//                 console.error("API error:", errorMessage);
//                 throw new Error(`API error: ${errorMessage}`);
//             }

//             const formattedEmails = processEmailData(data);
//             setEmails(formattedEmails);
//         } catch (err) {
//             console.error('Error fetching emails:', err);
//             setError(err instanceof Error ? err.message : 'Failed to fetch emails');
//         } finally {
//             setIsLoading(false);
//         }
//     }, [token, djombiTokens]);

//     // Fetch emails
//     useEffect(() => {
//         fetchEmails();
//     }, [fetchEmails]);

//     // Initialize pagination when columns change
//     useEffect(() => {
//         initializePagination(columns);
//     }, [columns]);

//     // Handle adding a new column
//     const handleAddColumn = (newColumn: Omit<EmailColumnType, 'id'> & { id?: string }) => {
//         const columnWithId = {
//             ...newColumn,
//             id: newColumn.id || newColumn.title.toLowerCase().replace(/\s+/g, '-')
//         };
        
//         setColumns([...columns, columnWithId]);
//     };

//     // Handle drag start
//     const handleDragStart = () => {
//         setIsDragging(true);
//     };

//     // Handle drag end
//     const handleDragEnd = (result: DropResult) => {
//         setIsDragging(false);

//         if (!result.destination) {
//             return;
//         }

//         const { draggableId, source, destination } = result;
//         const emailId = draggableId;
//         const sourceColumnId = source.droppableId;
//         const destinationColumnId = destination.droppableId;

//         if (sourceColumnId === destinationColumnId && source.index === destination.index) {
//             return;
//         }

//         setEmails(prevEmails => {
//             const updatedEmails = prevEmails.map(email => {
//                 if (email.id === emailId) {
//                     return { ...email, status: destinationColumnId };
//                 }
//                 return email;
//             });

//             return updatedEmails;
//         });

//         const destinationColumn = columns.find(col => col.id === destinationColumnId);
//         toast.success(`Email moved to ${destinationColumn?.title || destinationColumnId}`);
//     };

//     // Handle column actions
//     const handleEditColumn = (column: EmailColumnType) => {
//         console.log("Edit column:", column);
//     };

//     const handleDeleteColumn = (column: EmailColumnType) => {
//         if (["inbox", "urgent", "archive"].includes(column.id)) {
//             toast.error("Default columns cannot be deleted.");
//             return;
//         }
        
//         setColumns(columns.filter(col => col.id !== column.id));
//         toast.success(`Deleted "${column.title}" column`);
//     };

//     // Loading state
//     if (isLoading) {
//         return <LoadingState message="Loading email inbox..." />;
//     }

//     // Error state
//     if (error) {
//         if (error === 'No linked email ID found') {
//             console.error('Error loading emails: No linked email ID found');
//             return <NoEmailState message="Please link an email to continue" />;
//         }

//         return (
//             <ErrorState 
//                 error={error} 
//                 onRetry={() => window.location.reload()} 
//             />
//         );
//     }

//     return (
//         <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
//             <div className="min-h-screen p-4 sm:p-6 lg:p-8">
//                 <div className="max-w-full mx-auto">
//                     {/* Header Section */}
//                     <div className="mb-8">
//                         <SearchFilterBar
//                             emailFilter={emailFilter}
//                             onFilterChange={setEmailFilter}
//                             emailAccountType={emailAccountType}
//                             onAccountTypeChange={setEmailAccountType}
//                         />

//                         {/* Enhanced Tab Navigation */}
//                         <TabNavigation
//                             tabs={tabs}
//                             activeTab={activeTab}
//                             onTabChange={setActiveTab}
//                         />
//                     </div>

//                     {/* Email Board */}
//                     <EmailBoard
//                         columns={columns}
//                         emails={filteredEmails}
//                         pagination={pagination}
//                         itemsPerPage={itemsPerPage}
//                         onEditColumn={handleEditColumn}
//                         onDeleteColumn={handleDeleteColumn}
//                         onPageChange={handlePageChange}
//                         onAddColumn={handleAddColumn}
//                         showNewColumnDialog={showNewColumnDialog}
//                         onNewColumnDialogChange={setShowNewColumnDialog}
//                     />
//                 </div>

//                 {/* Global Custom Animations and Styles */}
//                 <style jsx>{`
//                     @keyframes fadeInUp {
//                         from {
//                             opacity: 0;
//                             transform: translateY(20px);
//                         }
//                         to {
//                             opacity: 1;
//                             transform: translateY(0);
//                         }
//                     }
//                 `}</style>
//             </div>
//         </DragDropContext>
//     );
// };

// export default ProfessionalEmailInbox;


































































// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";
// import { useState, useEffect, useContext } from "react";
// import { DragDropContext, DropResult } from "react-beautiful-dnd";
// import { Plus, Sparkles, Mail, Archive, AlertCircle, Search, Filter, ChevronDown, User, Briefcase } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Textarea } from "@/components/ui/textarea";
// import { toast } from "sonner";
// import { getCookie } from "@/lib/utils/cookies";
// import { AuthContext } from "@/lib/context/auth";
// import EmailColumn from "./EmailColumn";
// import { Email, EmailColumn as EmailColumnType, TabType, TabConfig, EmailCompose, EmailFilter, EmailAccountType, PaginationState } from "@/lib/types/email2";
// import { useCombinedAuth } from "@/components/providers/useCombinedAuth";

// const ProfessionalEmailInbox = () => {
//     // State
//     const [emails, setEmails] = useState<Email[]>([]);
//     const [columns, setColumns] = useState<EmailColumnType[]>([
//         { id: "inbox", title: "Inbox", icon: Mail, gradient: "from-blue-500 to-cyan-500" },
//         { id: "urgent", title: "Urgent", icon: AlertCircle, gradient: "from-red-500 to-orange-500" },
//         { id: "archive", title: "Archive", icon: Archive, gradient: "from-gray-500 to-slate-500" }
//     ]);
//     const [activeTab, setActiveTab] = useState<TabType>("viewAll");
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [newColumnName, setNewColumnName] = useState("");
//     const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);
//     const [showComposeDialog, setShowComposeDialog] = useState(false);
//     const [isDragging, setIsDragging] = useState(false);
//     const [emailAccountType, setEmailAccountType] = useState<EmailAccountType>("personal");
//     const [emailFilter, setEmailFilter] = useState<EmailFilter>({
//         searchTerm: "",
//         dateRange: "all",
//         hasAttachment: null,
//         isRead: null
//     });
//     const [composeEmail, setComposeEmail] = useState<EmailCompose>({
//         to: "",
//         subject: "",
//         content: ""
//     });
//     const [pagination, setPagination] = useState<PaginationState>({});

//     const itemsPerPage = 12;

//     const { token } = useContext(AuthContext);
//     const { djombi } = useCombinedAuth();
//     const djombiTokens = djombi.token || "";

//     // Tab configuration
//     const tabs: TabConfig[] = [
//         { id: "viewAll", label: "View All", icon: Sparkles, gradient: "from-blue-500 to-cyan-500" },
//         { id: "urgent", label: "Urgent", icon: AlertCircle, gradient: "from-red-500 to-orange-500" },
//         { id: "archive", label: "Archive", icon: Archive, gradient: "from-gray-500 to-slate-500" }
//     ];

//     // Initialize pagination state for each column
//     const initializePagination = (columns: EmailColumnType[]) => {
//         const initialPagination: PaginationState = {};
//         columns.forEach(column => {
//             initialPagination[column.id] = {
//                 currentPage: 1,
//                 itemsPerPage: itemsPerPage
//             };
//         });
//         setPagination(initialPagination);
//     };

//     // Filter emails based on active tab and filters
//     const getFilteredEmails = (emails: Email[]): Email[] => {
//         let filtered = [...emails];

//         // Filter by tab
//         if (activeTab !== "viewAll") {
//             filtered = filtered.filter(email => {
//                 switch (activeTab) {
//                     case "urgent":
//                         return email.isUrgent;
//                     case "archive":
//                         return email.status === "archive";
//                     default:
//                         return true;
//                 }
//             });
//         }

//         // Apply search filter
//         if (emailFilter.searchTerm) {
//             const searchTerm = emailFilter.searchTerm.toLowerCase();
//             filtered = filtered.filter(email =>
//                 email.subject.toLowerCase().includes(searchTerm) ||
//                 email.from.toLowerCase().includes(searchTerm) ||
//                 email.content.toLowerCase().includes(searchTerm)
//             );
//         }

//         // Apply attachment filter
//         if (emailFilter.hasAttachment !== null) {
//             filtered = filtered.filter(email => email.hasAttachment === emailFilter.hasAttachment);
//         }

//         // Apply read status filter
//         if (emailFilter.isRead !== null) {
//             filtered = filtered.filter(email => email.isRead === emailFilter.isRead);
//         }

//         return filtered;
//     };

//     const filteredEmails = getFilteredEmails(emails);

//     // Handle pagination
//     const handlePageChange = (columnId: string, page: number) => {
//         setPagination(prev => ({
//             ...prev,
//             [columnId]: {
//                 ...prev[columnId],
//                 currentPage: page
//             }
//         }));
//     };

//     // Handle compose email
//     const handleComposeEmail = (compose: EmailCompose) => {
//         setComposeEmail(compose);
//         setShowComposeDialog(true);
//     };

//     const handleSendEmail = async () => {
//         try {
//             // Implement your email sending logic here
//             console.log("Sending email:", composeEmail);
            
//             // For now, just show success message
//             toast.success("Email sent successfully!");
//             setShowComposeDialog(false);
//             setComposeEmail({ to: "", subject: "", content: "" });
//         } catch (error) {
//             toast.error("Failed to send email");
//         }
//     };

//     // Process email data from API response
//     const processEmailData = (data: any): Email[] => {
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

//     // Fetch emails
//     useEffect(() => {
//         const fetchEmails = async () => {
//             setIsLoading(true);
//             setError(null);

//             try {
//                 console.log("Token retrieved:", token ? `${token.access_token.substring(0, 10)}...` : 'No token found');

//                 if (!token) {
//                     throw new Error('No access token available');
//                 }

//                 const linkedEmailId = getCookie('linkedEmailId') ||
//                     (typeof window !== 'undefined' ? localStorage.getItem('linkedEmailId') : null);
//                 console.log("Linked Email ID:", linkedEmailId);

//                 if (!linkedEmailId) {
//                     throw new Error('No linked email ID found');
//                 }

//                 const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//                 console.log("Fetching from API endpoint:", apiEndpoint);

//                 const response = await fetch(apiEndpoint, {
//                     method: 'GET',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'Authorization': `Bearer ${djombiTokens}`
//                     }
//                 });

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
//     }, [token, djombiTokens]);

//     // Initialize pagination when columns change
//     useEffect(() => {
//         initializePagination(columns);
//     }, [columns]);

//     // Handle adding a new column
//     const handleAddColumn = () => {
//         if (newColumnName.trim()) {
//             const newColumnId = newColumnName.toLowerCase().replace(/\s+/g, '-');

//             if (columns.some(col => col.id === newColumnId)) {
//                 toast.error("A column with a similar name already exists.");
//                 return;
//             }

//             setColumns([...columns, { 
//                 id: newColumnId, 
//                 title: newColumnName,
//                 icon: Mail,
//                 gradient: "from-blue-500 to-purple-500"
//             }]);
//             setNewColumnName("");
//             setShowNewColumnDialog(false);
//             toast.success(`Created new "${newColumnName}" column`);
//         }
//     };

//     // Handle drag start
//     const handleDragStart = () => {
//         setIsDragging(true);
//     };

//     // Handle drag end
//     const handleDragEnd = (result: DropResult) => {
//         setIsDragging(false);

//         if (!result.destination) {
//             return;
//         }

//         const { draggableId, source, destination } = result;
//         const emailId = draggableId;
//         const sourceColumnId = source.droppableId;
//         const destinationColumnId = destination.droppableId;

//         if (sourceColumnId === destinationColumnId && source.index === destination.index) {
//             return;
//         }

//         setEmails(prevEmails => {
//             const updatedEmails = prevEmails.map(email => {
//                 if (email.id === emailId) {
//                     return { ...email, status: destinationColumnId };
//                 }
//                 return email;
//             });

//             return updatedEmails;
//         });

//         const destinationColumn = columns.find(col => col.id === destinationColumnId);
//         toast.success(`Email moved to ${destinationColumn?.title || destinationColumnId}`);
//     };

//     // Handle column actions
//     const handleEditColumn = (column: EmailColumnType) => {
//         console.log("Edit column:", column);
//     };

//     const handleDeleteColumn = (column: EmailColumnType) => {
//         if (["inbox", "urgent", "archive"].includes(column.id)) {
//             toast.error("Default columns cannot be deleted.");
//             return;
//         }
        
//         setColumns(columns.filter(col => col.id !== column.id));
//         toast.success(`Deleted "${column.title}" column`);
//     };

//     // Loading state
//     if (isLoading) {
//         return (
//             <div className="w-full min-h-screen flex items-center justify-center">
//                 <div className="text-center space-y-4">
//                     <div className="relative">
//                         <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-spin">
//                             <div className="absolute inset-2 bg-white rounded-full"></div>
//                         </div>
//                     </div>
//                     <p className="text-lg font-semibold text-gray-700 animate-pulse">Loading email inbox...</p>
//                 </div>
//             </div>
//         );
//     }

//     // Error state
//     if (error) {
//         if (error === 'No linked email ID found') {
//             console.error('Error loading emails: No linked email ID found');
//             return (
//                 <div className="flex flex-col justify-center items-center h-full py-10 text-center space-y-4">
//                     <img src="/icons/emailnew.png" alt="No Linked Email" className="w-100 h-70" />
//                     <p className="text-gray-600 text-lg">Please link an email to continue</p>
//                 </div>
//             );
//         }

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
//         <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
//             <div className="min-h-screen p-4 sm:p-6 lg:p-8">
//                 <div className="max-w-full mx-auto">
//                     {/* Header Section */}
//                     <div className="mb-8">
//                         <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-2">
//                             <div className="flex-grow">
//                                 <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 mb-2">
//                                     Email Inbox
//                                 </h1>
//                             </div>
                            
//                             {/* Email Account Type Toggle */}
//                             <DropdownMenu>
//                                 <DropdownMenuTrigger asChild>
//                                     <Button
//                                         variant="outline"
//                                         className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-gray-50"
//                                     >
//                                         {emailAccountType === "personal" ? (
//                                             <User className="w-4 h-4" />
//                                         ) : (
//                                             <Briefcase className="w-4 h-4" />
//                                         )}
//                                         <span className="capitalize">{emailAccountType}</span>
//                                         <ChevronDown className="w-4 h-4" />
//                                     </Button>
//                                 </DropdownMenuTrigger>
//                                 <DropdownMenuContent align="end" className="w-48">
//                                     <DropdownMenuItem 
//                                         onClick={() => setEmailAccountType("personal")}
//                                         className="flex items-center gap-2"
//                                     >
//                                         <User className="w-4 h-4" />
//                                         Personal Email
//                                     </DropdownMenuItem>
//                                     <DropdownMenuItem 
//                                         onClick={() => setEmailAccountType("professional")}
//                                         className="flex items-center gap-2"
//                                     >
//                                         <Briefcase className="w-4 h-4" />
//                                         Professional Email
//                                     </DropdownMenuItem>
//                                 </DropdownMenuContent>
//                             </DropdownMenu>

//                             {/* Search and Filter Section - Right Side */}
//                                 <div className="flex items-center gap-2">
//                                     <div className="relative">
//                                         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                                         <Input
//                                             placeholder="Search..."
//                                             value={emailFilter.searchTerm}
//                                             onChange={(e) => setEmailFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
//                                             className="pl-10 pr-4 w-48 h-10 bg-white/80 backdrop-blur-sm border-gray-200 rounded-xl text-sm"
//                                         />
//                                     </div>
                                    
//                                     <DropdownMenu>
//                                         <DropdownMenuTrigger asChild>
//                                             <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white/80 backdrop-blur-sm h-10 px-3">
//                                                 <Filter className="w-4 h-4" />
//                                                 <span className="hidden sm:inline">Filters</span>
//                                             </Button>
//                                         </DropdownMenuTrigger>
//                                         <DropdownMenuContent align="end" className="w-48">
//                                             <DropdownMenuItem 
//                                                 onClick={() => setEmailFilter(prev => ({ ...prev, hasAttachment: prev.hasAttachment === true ? null : true }))}
//                                             >
//                                                 {emailFilter.hasAttachment === true ? "✓ " : ""}With Attachments
//                                             </DropdownMenuItem>
//                                             <DropdownMenuItem 
//                                                 onClick={() => setEmailFilter(prev => ({ ...prev, isRead: prev.isRead === false ? null : false }))}
//                                             >
//                                                 {emailFilter.isRead === false ? "✓ " : ""}Unread Only
//                                             </DropdownMenuItem>
//                                             <DropdownMenuItem 
//                                                 onClick={() => setEmailFilter({ searchTerm: "", dateRange: "all", hasAttachment: null, isRead: null })}
//                                             >
//                                                 Clear Filters
//                                             </DropdownMenuItem>
//                                         </DropdownMenuContent>
//                                     </DropdownMenu>
//                                 </div>
//                         </div>

//                         {/* Enhanced Tab Navigation with Search and Filter */}
//                         <div className="bg-white/80 backdrop-blur-sm p-2 rounded-2xl border border-gray-200/50 overflow-x-auto">
//                             <div className="flex items-center justify-between gap-4 min-w-max sm:min-w-0">
//                                 {/* Tab Navigation */}
//                                 <div className="flex gap-2">
//                                 {tabs.map((tab) => {
//                                     const IconComponent = tab.icon;
//                                     const isActive = activeTab === tab.id;

//                                     return (
//                                         <Button
//                                             key={tab.id}
//                                             variant="ghost"
//                                             className={`relative px-4 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap ${
//                                                 isActive
//                                                     ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg hover:shadow-xl transform hover:scale-105`
//                                                     : "text-gray-600 hover:text-gray-800 hover:bg-gray-100/50"
//                                             }`}
//                                             onClick={() => setActiveTab(tab.id as TabType)}
//                                         >
//                                             <div className="flex items-center gap-2">
//                                                 <IconComponent className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
//                                                 <span className="text-sm sm:text-base">{tab.label}</span>
//                                             </div>
//                                             {isActive && (
//                                                 <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>
//                                             )}
//                                         </Button>
//                                     );
//                                 })}
//                                 </div>

                                
//                             </div>
//                         </div>
//                     </div>

//                     {/* Email Board */}
//                     <div className="custom-scrollbar-container flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto pb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
//                         {columns.map((column: EmailColumnType, index: number) => (
//                             <div
//                                 key={column?.id}
//                                 style={{
//                                     animationDelay: `${index * 150}ms`,
//                                     animation: 'slideInFromBottom 0.6s ease-out forwards'
//                                 }}
//                             >
//                                 <EmailColumn 
//                                     column={column} 
//                                     emails={filteredEmails}
//                                     onEditColumn={handleEditColumn}
//                                     onDeleteColumn={handleDeleteColumn}
//                                     currentPage={pagination[column.id]?.currentPage || 1}
//                                     onPageChange={handlePageChange}
//                                     itemsPerPage={itemsPerPage}
//                                 />
//                             </div>
//                         ))}

//                         {/* Add New Column Dialog */}
//                         <Dialog open={showNewColumnDialog} onOpenChange={setShowNewColumnDialog}>
//                             <DialogTrigger asChild>
//                                 <div className="min-w-[240px] sm:min-w-[260px] w-[240px] sm:w-[280px] flex-shrink-0 group cursor-pointer">
//                                     <div className="bg-gradient-to-br from-gray-50/80 to-gray-100/60 backdrop-blur-sm rounded-2xl p-5 border-2 border-dashed border-gray-300/60 hover:border-gray-400/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group-hover:from-blue-50/80 group-hover:to-purple-50/60">
//                                         <div className="flex flex-col items-center justify-center space-y-3 py-6">
//                                             <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 group-hover:from-blue-500 group-hover:to-purple-500 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
//                                                 <Plus className="w-6 h-6 text-white" />
//                                             </div>
//                                             <div className="text-center">
//                                                 <h3 className="font-semibold text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
//                                                     Create New Column
//                                                 </h3>
//                                                 <p className="text-sm text-gray-500 mt-1">
//                                                     Add a custom email category
//                                                 </p>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </DialogTrigger>
//                             <DialogContent className="rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
//                                 <DialogHeader>
//                                     <DialogTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
//                                         Create New Column
//                                     </DialogTitle>
//                                 </DialogHeader>
//                                 <div className="space-y-6 mt-6">
//                                     <div className="space-y-2">
//                                         <label className="text-sm font-semibold text-gray-700">Column Name</label>
//                                         <Input
//                                             placeholder="Enter column name..."
//                                             value={newColumnName}
//                                             onChange={(e) => setNewColumnName(e.target.value)}
//                                             onKeyDown={(e) => {
//                                                 if (e.key === 'Enter') {
//                                                     handleAddColumn();
//                                                 }
//                                             }}
//                                             className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/80"
//                                         />
//                                     </div>
//                                     <Button
//                                         onClick={handleAddColumn}
//                                         className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
//                                     >
//                                         <div className="flex items-center gap-2">
//                                             <Plus className="w-4 h-4" />
//                                             Create Column
//                                         </div>
//                                     </Button>
//                                 </div>
//                             </DialogContent>
//                         </Dialog>
//                     </div>

//                 </div>

//                 {/* Custom Animations and Styles */}
//                 <style jsx>{`
//                     @keyframes fadeInUp {
//                         from {
//                             opacity: 0;
//                             transform: translateY(20px);
//                         }
//                         to {
//                             opacity: 1;
//                             transform: translateY(0);
//                         }
//                     }
                    
//                     @keyframes slideInFromBottom {
//                         from {
//                             opacity: 0;
//                             transform: translateY(40px);
//                         }
//                         to {
//                             opacity: 1;
//                             transform: translateY(0);
//                         }
//                     }
                    
//                     .custom-scrollbar-container {
//                         scrollbar-width: thin;
//                         scrollbar-color: #d1d5db transparent;
//                     }
                    
//                     .custom-scrollbar-container::-webkit-scrollbar {
//                         height: 6px;
//                     }
                    
//                     @media (min-width: 640px) {
//                         .custom-scrollbar-container::-webkit-scrollbar {
//                             height: 8px;
//                         }
//                     }
                    
//                     .custom-scrollbar-container::-webkit-scrollbar-track {
//                         background: transparent;
//                         border-radius: 4px;
//                     }
                    
//                     .custom-scrollbar-container::-webkit-scrollbar-thumb {
//                         background-color: #d1d5db;
//                         border-radius: 4px;
//                         opacity: 0.7;
//                     }
                    
//                     .custom-scrollbar-container::-webkit-scrollbar-thumb:hover {
//                         background-color: #9ca3af;
//                     }
                    
//                     .custom-scrollbar-container::-webkit-scrollbar-corner {
//                         background: transparent;
//                     }
//                 `}</style>
//             </div>
//         </DragDropContext>
//     );
// };

// export default ProfessionalEmailInbox;
































































// UI Updates
// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";
// import { useState, useEffect, useContext } from "react";
// import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
// import { Plus, Sparkles, Mail, Archive, AlertCircle, MoreHorizontal } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { toast } from "sonner";
// import { EmailCard } from "./EmailCard";
// import { getCookie, getAuthToken } from "@/lib/utils/cookies";
// import { AuthContext } from "@/lib/context/auth";
// import { useCombinedAuth } from "../../providers/useCombinedAuth";

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
//     icon?: any;
//     gradient?: string;
// }

// type TabType = "viewAll" | "urgent" | "archive" | "personal" | "work";

// const ProfessionalEmailInbox = () => {
//     // State
//     const [emails, setEmails] = useState<Email[]>([]);
//     const [columns, setColumns] = useState<EmailColumn[]>([
//         { id: "inbox", title: "Inbox", icon: Mail, gradient: "from-blue-500 to-cyan-500" },
//         { id: "urgent", title: "Urgent", icon: AlertCircle, gradient: "from-red-500 to-orange-500" },
//         { id: "archive", title: "Archive", icon: Archive, gradient: "from-gray-500 to-slate-500" }
//     ]);
//     const [activeTab, setActiveTab] = useState<TabType>("viewAll");
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [newColumnName, setNewColumnName] = useState("");
//     const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);
//     const [isDragging, setIsDragging] = useState(false);

//     const { token, user } = useContext(AuthContext);
//     const { djombi } = useCombinedAuth()
//     const djombiTokens = djombi.token || ""

//     // Tab configuration
//     const tabs = [
//         { id: "viewAll", label: "View All", icon: Sparkles, gradient: "from-blue-500 to-cyan-500" },
//         { id: "urgent", label: "Urgent", icon: AlertCircle, gradient: "from-red-500 to-orange-500" },
//         { id: "archive", label: "Archive", icon: Archive, gradient: "from-gray-500 to-slate-500" },
//         { id: "personal", label: "Personal", icon: Mail, gradient: "from-green-500 to-emerald-500" },
//         { id: "work", label: "Work", icon: Mail, gradient: "from-purple-500 to-violet-500" },
//     ];

//     // Fetch emails
//     useEffect(() => {
//         const fetchEmails = async () => {
//             setIsLoading(true);
//             setError(null);

//             try {
//                 console.log("Token retrieved:", token ? `${token.access_token.substring(0, 10)}...` : 'No token found');

//                 if (!token) {
//                     throw new Error('No access token available');
//                 }

//                 const linkedEmailId = getCookie('linkedEmailId') ||
//                     (typeof window !== 'undefined' ? localStorage.getItem('linkedEmailId') : null);
//                 console.log("Linked Email ID:", linkedEmailId);

//                 if (!linkedEmailId) {
//                     throw new Error('No linked email ID found');
//                 }

//                 const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//                 console.log("Fetching from API endpoint:", apiEndpoint);

//                 const response = await fetch(apiEndpoint, {
//                     method: 'GET',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'Authorization': `Bearer ${djombiTokens}`
//                     }
//                 });

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

//             if (columns.some(col => col.id === newColumnId)) {
//                 toast.error("A column with a similar name already exists.");
//                 return;
//             }

//             setColumns([...columns, { 
//                 id: newColumnId, 
//                 title: newColumnName,
//                 icon: Mail,
//                 gradient: "from-blue-500 to-purple-500"
//             }]);
//             setNewColumnName("");
//             setShowNewColumnDialog(false);
//             toast.success(`Created new "${newColumnName}" column`);
//         }
//     };

//     // Handle drag start
//     const handleDragStart = () => {
//         setIsDragging(true);
//     };

//     // Handle drag end
//     const handleDragEnd = (result: DropResult) => {
//         setIsDragging(false);

//         if (!result.destination) {
//             return;
//         }

//         const { draggableId, source, destination } = result;
//         const emailId = draggableId;
//         const sourceColumnId = source.droppableId;
//         const destinationColumnId = destination.droppableId;

//         if (sourceColumnId === destinationColumnId && source.index === destination.index) {
//             return;
//         }

//         setEmails(prevEmails => {
//             const updatedEmails = prevEmails.map(email => {
//                 if (email.id === emailId) {
//                     return { ...email, status: destinationColumnId };
//                 }
//                 return email;
//             });

//             return updatedEmails;
//         });

//         const destinationColumn = columns.find(col => col.id === destinationColumnId);
//         toast.success(`Email moved to ${destinationColumn?.title || destinationColumnId}`);
//     };

//     // Handle column actions
//     const handleEditColumn = (column: EmailColumn) => {
//         // Placeholder for edit functionality
//         console.log("Edit column:", column);
//     };

//     const handleDeleteColumn = (column: EmailColumn) => {
//         if (["inbox", "urgent", "archive"].includes(column.id)) {
//             toast.error("Default columns cannot be deleted.");
//             return;
//         }
        
//         setColumns(columns.filter(col => col.id !== column.id));
//         toast.success(`Deleted "${column.title}" column`);
//     };

//     // Column Actions Component
//     const ColumnActions = ({ column }: { column: EmailColumn }) => {
//         return (
//             <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                     <Button
//                         size="icon"
//                         variant="ghost"
//                         className="h-6 w-6 rounded-full hover:bg-gray-200 transition-colors"
//                     >
//                         <MoreHorizontal className="h-4 w-4" />
//                     </Button>
//                 </DropdownMenuTrigger>
//                 <DropdownMenuContent align="end" className="w-40">
//                     <DropdownMenuItem onClick={() => handleEditColumn(column)}>
//                         Edit Column
//                     </DropdownMenuItem>
//                     <DropdownMenuItem 
//                         onClick={() => handleDeleteColumn(column)}
//                         disabled={["inbox", "urgent", "archive"].includes(column.id)}
//                         className="text-red-600 focus:text-red-600"
//                     >
//                         Delete
//                     </DropdownMenuItem>
//                 </DropdownMenuContent>
//             </DropdownMenu>
//         );
//     };

//     // Email column component
//     const EmailColumn = ({ column, emails }: { column: EmailColumn; emails: Email[] }) => {
//         const emailsInColumn = emails.filter(
//             (email) => email?.status.toLowerCase() === column?.id.toLowerCase()
//         );

//         return (
//             <Droppable droppableId={column.id}>
//                 {(provided, snapshot) => (
//                     <div
//                         ref={provided.innerRef}
//                         {...provided.droppableProps}
//                         className="min-w-[250px] w-70 flex-shrink-0 group relative"
//                     >
//                         <div className={`bg-gray-100 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 transition-all shadow-sm duration-300 hover:-translate-y-1 pb-16 ${
//                             snapshot.isDraggingOver ? "border-blue-400 bg-blue-50/80" : ""
//                         }`}>
//                             <div className="flex justify-between items-center mb-4">
//                                 <div className="space-y-2">
//                                     <div className="flex items-center gap-2">
//                                         <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse"></div>
//                                         <h3 className="font-bold text-base text-gray-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
//                                             {column.title}
//                                         </h3>
//                                     </div>
//                                     <div className="flex items-center gap-2">
//                                         <div className="px-2 py-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full">
//                                             <p className="text-xs font-semibold text-gray-600">
//                                                 {emailsInColumn.length} email{emailsInColumn.length !== 1 ? "s" : ""}
//                                             </p>
//                                         </div>
//                                     </div>
//                                 </div>
//                                 <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
//                                     <ColumnActions column={column} />
//                                 </div>
//                             </div>
                            
//                             <div className="space-y-3 min-h-[120px] mb-4">
//                                 {emailsInColumn.length > 0 ? (
//                                     emailsInColumn.map((email, index) => (
//                                         <Draggable key={email.id} draggableId={email.id} index={index}>
//                                             {(provided, snapshot) => (
//                                                 <div
//                                                     ref={provided.innerRef}
//                                                     {...provided.draggableProps}
//                                                     {...provided.dragHandleProps}
//                                                     className={`transform hover:scale-[1.02] transition-transform duration-200 ${
//                                                         snapshot.isDragging ? "shadow-lg opacity-80" : ""
//                                                     }`}
//                                                     style={{
//                                                         ...provided.draggableProps.style,
//                                                         animationDelay: `${index * 100}ms`,
//                                                         animation: 'fadeInUp 0.5s ease-out forwards'
//                                                     }}
//                                                 >
//                                                     <EmailCard email={email} index={index} />
//                                                 </div>
//                                             )}
//                                         </Draggable>
//                                     ))
//                                 ) : (
//                                     <div className="h-20 border-2 border-dashed border-gray-300/60 rounded-xl flex items-center justify-center bg-gradient-to-br from-gray-50/50 to-gray-100/30 hover:from-blue-50/50 hover:to-purple-50/30 transition-all duration-300 group/drop">
//                                         <div className="text-center space-y-1">
//                                             <div className="w-6 h-6 mx-auto rounded-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center group-hover/drop:from-blue-400 group-hover/drop:to-purple-400 transition-all duration-300">
//                                                 <Plus className="w-3 h-3 text-white" />
//                                             </div>
//                                             <p className="text-xs text-gray-500 font-medium group-hover/drop:text-gray-700 transition-colors duration-300">
//                                                 Drop emails here
//                                             </p>
//                                         </div>
//                                     </div>
//                                 )}
//                                 {provided.placeholder}
//                             </div>

//                             {/* Add Email Button positioned at bottom center */}
//                             <div className="absolute bottom-2 left-4 right-4">
//                                 <Button
//                                     variant="ghost"
//                                     className="w-full justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-200 transition-colors duration-200 rounded-xl py-2 px-3 bg-transparent"
//                                     onClick={() => {
//                                         // Placeholder for add email functionality
//                                         toast.info("Add email functionality would be implemented here");
//                                     }}
//                                 >
//                                     <Plus className="w-4 h-4 mr-2" />
//                                     Add Email
//                                 </Button>
//                             </div>
//                         </div>
//                     </div>
//                 )}
//             </Droppable>
//         );
//     };

//     // Loading state
//     if (isLoading) {
//         return (
//             <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
//                 <div className="text-center space-y-4">
//                     <div className="relative">
//                         <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-spin">
//                             <div className="absolute inset-2 bg-white rounded-full"></div>
//                         </div>
//                     </div>
//                     <p className="text-lg font-semibold text-gray-700 animate-pulse">Loading email inbox...</p>
//                 </div>
//             </div>
//         );
//     }

//     // Error state
//     if (error) {
//         if (error === 'No linked email ID found') {
//             console.error('Error loading emails: No linked email ID found');
//             return (
//                 <div className="flex flex-col justify-center items-center h-full py-10 text-center space-y-4">
//                     <img src="/icons/emailnew.png" alt="No Linked Email" className="w-100 h-70" />
//                     <p className="text-gray-600 text-lg">Please link an email to continue</p>
//                 </div>
//             );
//         }

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
//         <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
//             <div className="min-h-screen bg-gradient-to-br from-blue-100 p-4 sm:p-6 lg:p-8 rounded-2xl">
//                 <div className="max-w-full mx-auto">
//                     {/* Header Section */}
//                     <div className="mb-8">
//                         {/* Main Header with Title */}
//                         <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
//                             <div className="flex-grow">
//                                 <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 mb-2">
//                                     Email Inbox
//                                 </h1>
//                                 <p className="text-gray-600">Manage your emails efficiently</p>
//                             </div>
//                         </div>

//                         {/* Enhanced Tab Navigation */}
//                         <div className="bg-white/80 backdrop-blur-sm p-2 rounded-2xl border border-gray-200/50 overflow-x-auto">
//                             <div className="flex gap-2 min-w-max sm:min-w-0">
//                                 {tabs.map((tab) => {
//                                     const IconComponent = tab.icon;
//                                     const isActive = activeTab === tab.id;

//                                     return (
//                                         <Button
//                                             key={tab.id}
//                                             variant="ghost"
//                                             className={`relative px-4 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap ${
//                                                 isActive
//                                                     ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg hover:shadow-xl transform hover:scale-105`
//                                                     : "text-gray-600 hover:text-gray-800 hover:bg-gray-100/50"
//                                             }`}
//                                             onClick={() => setActiveTab(tab.id as TabType)}
//                                         >
//                                             <div className="flex items-center gap-2">
//                                                 <IconComponent className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
//                                                 <span className="text-sm sm:text-base">{tab.label}</span>
//                                             </div>
//                                             {isActive && (
//                                                 <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>
//                                             )}
//                                         </Button>
//                                     );
//                                 })}
//                             </div>
//                         </div>
//                     </div>

//                     {/* Email Board - Hidden scrollbar */}
//                     <div className="custom-scrollbar-container flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto pb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
//                         {columns.map((column: EmailColumn, index: number) => (
//                             <div
//                                 key={column?.id}
//                                 style={{
//                                     animationDelay: `${index * 150}ms`,
//                                     animation: 'slideInFromBottom 0.6s ease-out forwards'
//                                 }}
//                             >
//                                 <EmailColumn column={column} emails={emails} />
//                             </div>
//                         ))}

//                         {/* Add New Column */}
//                         <Dialog
//                             open={showNewColumnDialog}
//                             onOpenChange={setShowNewColumnDialog}
//                         >
//                             <DialogTrigger asChild>
//                                 <div className="min-w-[240px] sm:min-w-[260px] w-[240px] sm:w-[280px] flex-shrink-0 group cursor-pointer">
//                                     <div className="bg-gradient-to-br from-gray-50/80 to-gray-100/60 backdrop-blur-sm rounded-2xl p-5 border-2 border-dashed border-gray-300/60 hover:border-gray-400/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group-hover:from-blue-50/80 group-hover:to-purple-50/60">
//                                         <div className="flex flex-col items-center justify-center space-y-3 py-6">
//                                             <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 group-hover:from-blue-500 group-hover:to-purple-500 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
//                                                 <Plus className="w-6 h-6 text-white" />
//                                             </div>
//                                             <div className="text-center">
//                                                 <h3 className="font-semibold text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
//                                                     Create New Column
//                                                 </h3>
//                                                 <p className="text-sm text-gray-500 mt-1">
//                                                     Add a custom email category
//                                                 </p>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </DialogTrigger>
//                             <DialogContent className="rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
//                                 <DialogHeader>
//                                     <DialogTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
//                                         Create New Column
//                                     </DialogTitle>
//                                 </DialogHeader>
//                                 <div className="space-y-6 mt-6">
//                                     <div className="space-y-2">
//                                         <label className="text-sm font-semibold text-gray-700">Column Name</label>
//                                         <Input
//                                             placeholder="Enter column name..."
//                                             value={newColumnName}
//                                             onChange={(e) => setNewColumnName(e.target.value)}
//                                             onKeyDown={(e) => {
//                                                 if (e.key === 'Enter') {
//                                                     handleAddColumn();
//                                                 }
//                                             }}
//                                             className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/80"
//                                         />
//                                     </div>
//                                     <Button
//                                         onClick={handleAddColumn}
//                                         className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
//                                     >
//                                         <div className="flex items-center gap-2">
//                                             <Plus className="w-4 h-4" />
//                                             Create Column
//                                         </div>
//                                     </Button>
//                                 </div>
//                             </DialogContent>
//                         </Dialog>
//                     </div>
//                 </div>

//                 {/* Custom Animations */}
//                 <style jsx>{`
//                     @keyframes fadeInUp {
//                         from {
//                             opacity: 0;
//                             transform: translateY(20px);
//                         }
//                         to {
//                             opacity: 1;
//                             transform: translateY(0);
//                         }
//                     }
                    
//                     @keyframes slideInFromBottom {
//                         from {
//                             opacity: 0;
//                             transform: translateY(40px);
//                         }
//                         to {
//                             opacity: 1;
//                             transform: translateY(0);
//                         }
//                     }
                    
//                     /* Custom scrollbar positioned at bottom - Mobile responsive */
//                     .custom-scrollbar-container {
//                         /* Firefox */
//                         scrollbar-width: thin;
//                         scrollbar-color: #d1d5db transparent;
//                     }
                    
//                     /* WebKit browsers (Chrome, Safari, Edge) */
//                     .custom-scrollbar-container::-webkit-scrollbar {
//                         height: 6px; /* Thinner on mobile */
//                     }
                    
//                     @media (min-width: 640px) {
//                         .custom-scrollbar-container::-webkit-scrollbar {
//                             height: 8px; /* Standard size on desktop */
//                         }
//                     }
                    
//                     .custom-scrollbar-container::-webkit-scrollbar-track {
//                         background: transparent;
//                         border-radius: 4px;
//                     }
                    
//                     .custom-scrollbar-container::-webkit-scrollbar-thumb {
//                         background-color: #d1d5db;
//                         border-radius: 4px;
//                         opacity: 0.7;
//                     }
                    
//                     .custom-scrollbar-container::-webkit-scrollbar-thumb:hover {
//                         background-color: #9ca3af;
//                     }
                    
//                     /* Ensure scrollbar appears at the bottom of content */
//                     .custom-scrollbar-container::-webkit-scrollbar-corner {
//                         background: transparent;
//                     }
//                 `}</style>
//             </div>
//         </DragDropContext>
//     );
// };

// export default ProfessionalEmailInbox;















































// Former UI Design
// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";
// import { useState, useEffect, useContext } from "react";
// import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
// import { Plus } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { toast } from "sonner";
// import { EmailCard } from "./EmailCard";
// import { getCookie, getAuthToken } from "@/lib/utils/cookies";
// import { AuthContext } from "@/lib/context/auth";
// import { useCombinedAuth } from "../providers/useCombinedAuth";

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
//     const [isDragging, setIsDragging] = useState(false);

//     const { token, user } = useContext(AuthContext);
//     const { djombi } = useCombinedAuth()
//     const djombiTokens = djombi.token || ""
//     // Fetch emails
//     useEffect(() => {
//         const fetchEmails = async () => {
//             setIsLoading(true);
//             setError(null);

//             try {
//                 // Get token from cookies using the utility function
//                 console.log("Token retrieved:", token ? `${token.access_token.substring(0, 10)}...` : 'No token found');

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

//                 const apiEndpoint = `https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox?email_id=${encodeURIComponent(linkedEmailId)}&offset=1&limit=20`;
//                 console.log("Fetching from API endpoint:", apiEndpoint);

//                 const response = await fetch(apiEndpoint, {
//                     method: 'GET',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'Authorization': `Bearer ${djombiTokens}`
//                     }
//                 });

//                 // If the GET request fails, try with POST instead
//                 // if (!response.ok) {
//                 //     console.log("GET request failed with status:", response.status);

//                 //     // Alternative: Use POST if the API requires sending data in the body
//                 //     const postEndpoint = 'https://email-service-latest-agqz.onrender.com/api/v1/emails/inbox';
//                 //     console.log("Trying POST request to:", postEndpoint);

//                 //     const postResponse = await fetch(postEndpoint, {
//                 //         method: 'POST',
//                 //         headers: {
//                 //             'Content-Type': 'application/json',
//                 //             'Authorization': `Bearer ${token}`
//                 //         },
//                 //         body: JSON.stringify({
//                 //             email_id: linkedEmailId
//                 //         })
//                 //     });

//                 //     // Process the POST response
//                 //     const postResponseText = await postResponse.text();
//                 //     console.log("POST raw response:", postResponseText);

//                 //     let postData;
//                 //     try {
//                 //         postData = JSON.parse(postResponseText);
//                 //         console.log("POST parsed response data:", postData);
//                 //     } catch (e) {
//                 //         console.error("Failed to parse POST response as JSON:", e);
//                 //         throw new Error(`Invalid POST response format: ${postResponseText.substring(0, 100)}...`);
//                 //     }

//                 //     // Check for success/error in POST response
//                 //     if (!postResponse.ok || postData.success === false) {
//                 //         const errorMessage = postData.message || postResponse.statusText;
//                 //         console.error("API POST error:", errorMessage);
//                 //         throw new Error(`API POST error: ${errorMessage}`);
//                 //     }

//                 //     // Process the successful POST response
//                 //     const formattedEmails = processEmailData(postData);
//                 //     setEmails(formattedEmails);
//                 //     return;
//                 // }

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

//     // Handle drag start
//     const handleDragStart = () => {
//         setIsDragging(true);
//     };

//     // Handle drag end
//     const handleDragEnd = (result: DropResult) => {
//         setIsDragging(false);

//         // Check if there's no destination or if the item was dropped outside a droppable
//         if (!result.destination) {
//             return;
//         }

//         const { draggableId, source, destination } = result;
//         const emailId = draggableId;
//         const sourceColumnId = source.droppableId;
//         const destinationColumnId = destination.droppableId;

//         // Don't do anything if dropped in same location
//         if (sourceColumnId === destinationColumnId && source.index === destination.index) {
//             return;
//         }

//         // Update email status
//         setEmails(prevEmails => {
//             const updatedEmails = prevEmails.map(email => {
//                 if (email.id === emailId) {
//                     return { ...email, status: destinationColumnId };
//                 }
//                 return email;
//             });

//             // Optional: Save updated emails to backend
//             // saveEmailStatus(emailId, destinationColumnId);

//             return updatedEmails;
//         });

//         // Show a success message
//         const destinationColumn = columns.find(col => col.id === destinationColumnId);
//         toast.success(`Email moved to ${destinationColumn?.title || destinationColumnId}`);
//     };

//     // Optional: Save updated email status to backend
//     const saveEmailStatus = async (emailId: string, newStatus: string) => {
//         try {
//             // const token = getAuthToken();
//             const { token, user } = useContext(AuthContext);
//             if (!token) return;

//             // Implement API call to update email status
//             // This is a placeholder for where you'd implement the actual API call
//             console.log(`Updating email ${emailId} status to ${newStatus}`);

//             // Example API call implementation:
//             /*
//             await fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails/update-status', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${token}`
//                 },
//                 body: JSON.stringify({
//                     email_id: emailId,
//                     status: newStatus
//                 })
//             });
//             */
//         } catch (error) {
//             console.error('Error saving email status:', error);
//         }
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
//     // if (error) {
//     //     return (
//     //         <div className="p-4 text-red-500">
//     //             <p>Error loading emails: {error}</p>
//     //             <button
//     //                 className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//     //                 onClick={() => window.location.reload()}
//     //             >
//     //                 Try Again
//     //             </button>
//     //         </div>
//     //     );
//     // }

//     if (error) {
//         if (error === 'No linked email ID found') {
//             console.error('Error loading emails: No linked email ID found');
//             return (
//                 <div className="flex flex-col justify-center items-center h-full py-10 text-center space-y-4">
//                     <img src="/icons/emailnew.png" alt="No Linked Email" className="w-100 h-70" />
//                     <p className="text-gray-600 text-lg">Please link an email to continue</p>
//                 </div>
//             );
//         }

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
//         <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
//             <div className="relative w-full h-full overflow-x-auto pb-4">
//                 <div className="flex gap-4 w-max">
//                     {columns.map((column) => (
//                         <Droppable key={column.id} droppableId={column.id}>
//                             {(provided, snapshot) => (
//                                 <div
//                                     ref={provided.innerRef}
//                                     {...provided.droppableProps}
//                                     className={`min-w-[350px] w-[350px] max-w-[350px] p-4 rounded-lg border ${snapshot.isDraggingOver
//                                         ? "border-blue-400 bg-blue-50"
//                                         : "border-gray-200"
//                                         } transition-colors duration-200`}
//                                 >
//                                     <div className="flex justify-between items-center mb-4">
//                                         <h3 className="font-semibold">{column.title}</h3>
//                                         <span className="text-xs text-gray-500">
//                                             {emails.filter(email => email.status === column.id).length} emails
//                                         </span>
//                                     </div>

//                                     <div className="space-y-3 min-h-[100px]">
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
//                                                             className={`${snapshot.isDragging ? "shadow-lg" : ""}`}
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
//                                         {provided.placeholder}
//                                     </div>

//                                     {emails.filter(email => email.status === column.id).length === 0 && !snapshot.isDraggingOver && (
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
//                                         onKeyDown={(e) => {
//                                             if (e.key === 'Enter') {
//                                                 handleAddColumn();
//                                             }
//                                         }}
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
































































// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";
// import { useState, useEffect, useContext } from "react";
// import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
// import { Plus } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { toast } from "sonner";
// import { EmailCard } from "./EmailCard";
// import { getCookie, getAuthToken } from "@/lib/utils/cookies";
// import { AuthContext } from "@/lib/context/auth";
// import { DjombiProfileService, DjombiTokens, DjombiServiceResult } from "@/lib/services/DjombiProfileService"; // Update path as needed
// import { useCombinedAuth } from "../providers/useCombinedAuth";

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

// // Add interface for component props
// interface ProfessionalEmailInboxProps {
//     // Optional: You can make djombiTokens optional since we're fetching it internally
//     djombiTokens?: DjombiTokens;
// }

// const ProfessionalEmailInbox = ({ djombiTokens }: ProfessionalEmailInboxProps) => {
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
//     const [isDragging, setIsDragging] = useState(false);
//     const [fetchedDjombiTokens, setFetchedDjombiTokens] = useState<DjombiTokens | null>(null);

//     const { token, user } = useContext(AuthContext);
//     const { djombi } = useCombinedAuth()
//     const djombiTokens = djombi.token || ""

//     // Use either passed djombiTokens or fetched ones
//     const activeDjombiTokens = djombiTokens || fetchedDjombiTokens;

//     // Fetch Djombi tokens if not provided as props
//     useEffect(() => {
//         const fetchDjombiTokens = async () => {
//             // Skip fetching if tokens are already provided as props
//             if (djombiTokens) {
//                 console.log("Using provided djombiTokens:", djombiTokens);
//                 return;
//             }

//             // Check if user is authenticated and has a valid token
//             if (!token) {
//                 console.log("User not authenticated or no token available");
//                 return;
//             }

//             try {
//                 console.log("Fetching Djombi tokens...");
//                 const result: DjombiServiceResult = await DjombiProfileService.getDjombiProfile(token.access_token);

//                 if (result.success && result.tokens) {
//                     console.log("Djombi tokens fetched successfully:", result.tokens);
//                     setFetchedDjombiTokens(result.tokens);

//                     // Optionally store the profile data as well
//                     if (result.profile) {
//                         console.log("Djombi profile data:", result.profile);
//                         // You might want to store this in state: setDjombiProfile(result.profile);
//                     }
//                 } else {
//                     console.error("Failed to fetch Djombi tokens:", result.error);
//                     // Optionally set an error state
//                     // setError(result.error);
//                 }
//             } catch (error) {
//                 console.error("Error fetching Djombi tokens:", error);
//                 // Optionally set an error state
//                 // setError("An unexpected error occurred while fetching Djombi tokens");
//             }
//         };

//         fetchDjombiTokens();
//     }, [token, djombiTokens]); // Added isAuthenticated to dependencies

//     // Fetch emails
//     useEffect(() => {
//         const fetchEmails = async () => {
//             setIsLoading(true);
//             setError(null);

//             try {
//                 // Get token from cookies using the utility function
//                 console.log("Token retrieved:", token ? `${token.access_token.substring(0, 10)}...` : 'No token found');
//                 console.log("Active Djombi tokens:", activeDjombiTokens);

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
//                         'Authorization': `Bearer ${djombiTokens}`
//                     }
//                 });

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
//     }, [token, activeDjombiTokens]); // Add activeDjombiTokens as dependency

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

//     // Handle drag start
//     const handleDragStart = () => {
//         setIsDragging(true);
//     };

//     // Handle drag end
//     const handleDragEnd = (result: DropResult) => {
//         setIsDragging(false);

//         // Check if there's no destination or if the item was dropped outside a droppable
//         if (!result.destination) {
//             return;
//         }

//         const { draggableId, source, destination } = result;
//         const emailId = draggableId;
//         const sourceColumnId = source.droppableId;
//         const destinationColumnId = destination.droppableId;

//         // Don't do anything if dropped in same location
//         if (sourceColumnId === destinationColumnId && source.index === destination.index) {
//             return;
//         }

//         // Update email status
//         setEmails(prevEmails => {
//             const updatedEmails = prevEmails.map(email => {
//                 if (email.id === emailId) {
//                     return { ...email, status: destinationColumnId };
//                 }
//                 return email;
//             });

//             // Optional: Save updated emails to backend
//             // saveEmailStatus(emailId, destinationColumnId);

//             return updatedEmails;
//         });

//         // Show a success message
//         const destinationColumn = columns.find(col => col.id === destinationColumnId);
//         toast.success(`Email moved to ${destinationColumn?.title || destinationColumnId}`);
//     };

//     // Optional: Save updated email status to backend
//     const saveEmailStatus = async (emailId: string, newStatus: string) => {
//         try {
//             // const token = getAuthToken();
//             const { token, user } = useContext(AuthContext);
//             if (!token) return;

//             // Implement API call to update email status
//             // This is a placeholder for where you'd implement the actual API call
//             console.log(`Updating email ${emailId} status to ${newStatus}`);

//             // Example API call implementation:
//             /*
//             await fetch('https://email-service-latest-agqz.onrender.com/api/v1/emails/update-status', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${token}`
//                 },
//                 body: JSON.stringify({
//                     email_id: emailId,
//                     status: newStatus
//                 })
//             });
//             */
//         } catch (error) {
//             console.error('Error saving email status:', error);
//         }
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
//         if (error === 'No linked email ID found') {
//             console.error('Error loading emails: No linked email ID found');
//             return (
//                 <div className="flex flex-col justify-center items-center h-full py-10 text-center space-y-4">
//                     <img src="/icons/emailnew.png" alt="No Linked Email" className="w-100 h-70" />
//                     <p className="text-gray-600 text-lg">Please link an email to continue</p>
//                 </div>
//             );
//         }

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
//         <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
//             <div className="relative w-full h-full overflow-x-auto pb-4">
//                 <div className="flex gap-4 w-max">
//                     {columns.map((column) => (
//                         <Droppable key={column.id} droppableId={column.id}>
//                             {(provided, snapshot) => (
//                                 <div
//                                     ref={provided.innerRef}
//                                     {...provided.droppableProps}
//                                     className={`min-w-[350px] w-[350px] max-w-[350px] p-4 rounded-lg border ${snapshot.isDraggingOver
//                                         ? "border-blue-400 bg-blue-50"
//                                         : "border-gray-200"
//                                         } transition-colors duration-200`}
//                                 >
//                                     <div className="flex justify-between items-center mb-4">
//                                         <h3 className="font-semibold">{column.title}</h3>
//                                         <span className="text-xs text-gray-500">
//                                             {emails.filter(email => email.status === column.id).length} emails
//                                         </span>
//                                     </div>

//                                     <div className="space-y-3 min-h-[100px]">
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
//                                                             className={`${snapshot.isDragging ? "shadow-lg" : ""}`}
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
//                                         {provided.placeholder}
//                                     </div>

//                                     {emails.filter(email => email.status === column.id).length === 0 && !snapshot.isDraggingOver && (
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
//                                         onKeyDown={(e) => {
//                                             if (e.key === 'Enter') {
//                                                 handleAddColumn();
//                                             }
//                                         }}
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