/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { MoreHorizontal, Check, X, Move, Mail, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { EmailCard } from "./EmailCard";
import { Email, EmailColumn as EmailColumnType } from "@/lib/types/email2";

interface EmailColumnProps {
    column: EmailColumnType;
    emails: Email[];
    onEditColumn: (column: EmailColumnType) => void;
    onDeleteColumn: (column: EmailColumnType) => void;
    onUpdateColumnIcon?: (columnId: string, icon: string) => void;
    currentPage: number;
    onPageChange: (columnId: string, page: number) => void;
    itemsPerPage: number;
    editingColumnId: string | null;
    editingColumnName: string;
    onStartEdit: (column: EmailColumnType) => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onEditNameChange: (name: string) => void;
    onEmailMove: (emailId: string, targetColumnId: string) => void;
}

// Icon/Emoji Selector Component
const IconEmojiSelector = ({
    currentIcon,
    onIconSelect,
    onClose
}: {
    currentIcon?: string;
    onIconSelect: (icon: string) => void;
    onClose: () => void;
}) => {
    const [activeTab, setActiveTab] = useState<'popular' | 'categories'>('popular');

    const popularIcons = ['📧', '⭐', '🔥', '✅', '⏰', '📝', '💼', '🎯', '📊', '💌', '🚨', '📅'];

    const iconCategories = {
        Priority: ['🔥', '⚡', '❗', '🚨', '⭐', '💎', '👑', '🎯'],
        Action: ['✅', '📝', '🏃‍♂️', '⚡', '🔧', '🛠️', '💪', '🎯'],
        Time: ['⏰', '⏳', '📅', '⌛', '🕐', '📆', '⏱️', '🔔'],
        Work: ['💼', '📊', '📈', '💻', '📋', '📄', '🏢', '👔'],
        Communication: ['📧', '💌', '📬', '📭', '📮', '💬', '🗨️', '📞']
    };

    const IconButton = ({ icon }: { icon: string }) => (
        <button
            onClick={() => onIconSelect(icon)}
            className={`w-8 h-8 flex items-center justify-center rounded-md hover:bg-blue-50 transition-colors text-lg ${
                currentIcon === icon ? 'bg-blue-100 ring-2 ring-blue-400' : ''
            }`}
        >
            {icon}
        </button>
    );

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 z-50">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">Choose Icon</h4>
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                    onClick={onClose}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-3">
                <button
                    onClick={() => setActiveTab('popular')}
                    className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'popular'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Popular
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'categories'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Categories
                </button>
            </div>

            {/* Content */}
            <div className="max-h-48 overflow-y-auto">
                {activeTab === 'popular' ? (
                    <div className="grid grid-cols-6 gap-2">
                        {popularIcons.map((icon) => (
                            <IconButton key={icon} icon={icon} />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {Object.entries(iconCategories).map(([category, icons]) => (
                            <div key={category}>
                                <h5 className="text-xs font-medium text-gray-600 mb-2">{category}</h5>
                                <div className="grid grid-cols-8 gap-1">
                                    {icons.map((icon) => (
                                        <IconButton key={icon} icon={icon} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Remove Icon Option */}
            {currentIcon && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                        onClick={() => onIconSelect('')}
                        className="w-full text-sm text-gray-600 hover:text-gray-800 py-1"
                    >
                        Remove Icon
                    </button>
                </div>
            )}
        </div>
    );
};

// Drag and Drop Email Selector Component
const DragDropEmailSelector = ({ 
    emails, 
    currentColumnId, 
    onEmailMove 
}: { 
    emails: Email[], 
    currentColumnId: string,
    onEmailMove: (emailId: string, targetColumnId: string) => void 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Get emails from other columns that can be moved
    const availableEmails = emails.filter(email => email.status !== currentColumnId);
    
    if (availableEmails.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No emails available to move</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 mb-3 px-2">
                Select emails to move here:
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
                {availableEmails.map((email) => (
                    <div
                        key={email.id}
                        className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200 group"
                        onClick={() => {
                            onEmailMove(email.id, currentColumnId);
                            setIsOpen(false);
                        }}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                        From: {email.status}
                                    </div>
                                    {email.isUrgent && (
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    )}
                                </div>
                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                    {email.subject}
                                </h4>
                                <p className="text-xs text-gray-600 truncate">
                                    From: {email.from}
                                </p>
                            </div>
                            <Move className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="text-xs text-gray-500 px-2 mt-2">
                Click on any email to move it to this column
            </div>
        </div>
    );
};

// Column Actions Component - Trello Style
const ColumnActions = ({
    column,
    onDeleteColumn,
    onChangeIcon
}: {
    column: EmailColumnType;
    onDeleteColumn: (column: EmailColumnType) => void;
    onChangeIcon: () => void;
}) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
                >
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-white border border-gray-200 shadow-lg rounded-sm">
                <DropdownMenuItem 
                    onClick={onChangeIcon}
                    className="text-gray-700 hover:bg-gray-100 text-sm px-3 py-2 cursor-pointer"
                >
                    <Palette className="h-4 w-4 mr-2" />
                    Change Icon
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                    onClick={() => onDeleteColumn(column)}
                    disabled={["inbox", "urgent", "follow-up"].includes(column.id)}
                    className="text-gray-700 hover:bg-gray-100 text-sm px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const EmailColumn = ({
    column,
    emails,
    onEditColumn,
    onDeleteColumn,
    onUpdateColumnIcon,
    currentPage,
    onPageChange,
    itemsPerPage,
    editingColumnId,
    editingColumnName,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onEditNameChange,
    onEmailMove
}: EmailColumnProps) => {
    const [showDragDropSelector, setShowDragDropSelector] = useState(false);
    const [showIconSelector, setShowIconSelector] = useState(false);

    const emailsInColumn = emails.filter(
        (email) => email?.status.toLowerCase() === column?.id.toLowerCase()
    );

    // Pagination logic
    const totalPages = Math.ceil(emailsInColumn.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedEmails = emailsInColumn.slice(startIndex, endIndex);

    const isEditing = editingColumnId === column.id;

    // Handle email move
    const handleEmailMove = (emailId: string, targetColumnId: string) => {
        onEmailMove(emailId, targetColumnId);
        setShowDragDropSelector(false);
    };

    // Handle icon selection
    const handleIconSelect = (icon: string) => {
        if (onUpdateColumnIcon) {
            onUpdateColumnIcon(column.id, icon);
        }
        setShowIconSelector(false);
    };

    return (
        <Droppable droppableId={column.id}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="w-72 flex-shrink-0 rounded-2xl p-2 relative"
                    style={{ backgroundColor: '#ebecf0' }}
                >
                    <div className={`transition-all duration-300 ${
                        snapshot.isDraggingOver ? "bg-blue-50/80 border-blue-400" : ""
                    }`}>
                        {/* Column Header - Trello Style */}
                        <div className="flex justify-between items-center mb-2 px-2">
                            <div className="flex-1">
                                {isEditing ? (
                                    <div className="flex items-center gap-1">
                                        <Input
                                            value={editingColumnName}
                                            onChange={(e) => onEditNameChange(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    onSaveEdit();
                                                } else if (e.key === 'Escape') {
                                                    onCancelEdit();
                                                }
                                            }}
                                            className="h-7 text-sm font-semibold text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white rounded-sm"
                                            autoFocus
                                        />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 rounded"
                                            onClick={onSaveEdit}
                                        >
                                            <Check className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 rounded"
                                            onClick={onCancelEdit}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            {column.icon && (
                                                <span className="text-sm">{column.icon}</span>
                                            )}
                                            <h3 
                                                className="text-sm font-semibold text-gray-700 cursor-pointer hover:text-gray-900 font-sans"
                                                onClick={() => onStartEdit(column)}
                                                title="Click to edit"
                                                style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
                                            >
                                                {column.title}
                                            </h3>
                                        </div>
                                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                                            {emailsInColumn.length}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {!isEditing && (
                                <ColumnActions 
                                    column={column} 
                                    onDeleteColumn={onDeleteColumn}
                                    onChangeIcon={() => setShowIconSelector(true)}
                                />
                            )}
                        </div>

                        {/* Icon Selector */}
                        {showIconSelector && (
                            <div className="absolute top-12 right-2 z-50">
                                <IconEmojiSelector
                                    currentIcon={column.icon}
                                    onIconSelect={handleIconSelect}
                                    onClose={() => setShowIconSelector(false)}
                                />
                            </div>
                        )}

                        {/* Emails Container - Trello style */}
                        <ol className="space-y-2">
                            {paginatedEmails.length > 0 ? (
                                paginatedEmails.map((email, index) => (
                                    <li key={email.id}>
                                        <Draggable key={email.id} draggableId={email.id} index={startIndex + index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`transform hover:scale-[1.02] transition-transform duration-200 ${
                                                        snapshot.isDragging ? "shadow-lg opacity-80" : ""
                                                    }`}
                                                    style={{
                                                        ...provided.draggableProps.style,
                                                        animationDelay: `${index * 100}ms`,
                                                        animation: 'fadeInUp 0.5s ease-out forwards'
                                                    }}
                                                >
                                                    <div className="relative rounded-lg border hover:shadow-md hover:border-blue-500 hover:border-2 transition-all cursor-pointer group overflow-hidden border-gray-200 shadow-sm bg-white"
                                                        style={{ 
                                                            boxShadow: '0 1px 0 rgba(9,30,66,.25)',
                                                            borderRadius: '10px',
                                                            minHeight: '60px',
                                                        }}
                                                    >
                                                        <EmailCard email={email} index={index} />
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    </li>
                                ))
                            ) : (
                                <div className="rounded-xl border-2 border-dashed border-transparent" />
                            )}
                            {provided.placeholder}
                        </ol>

                        {/* Drag and Drop Email Button - Trello Style */}
                        <div className={paginatedEmails.length > 0 ? "mt-2" : "mt-1"}>
                            {!showDragDropSelector ? (
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-gray-600 hover:text-gray-800 hover:!bg-gray-400 transition-colors rounded-sm py-1.5 px-2 text-sm font-normal h-auto"
                                    onClick={() => setShowDragDropSelector(true)}
                                >
                                    <Move className="w-4 h-4 mr-1" />
                                    Drag & drop mail
                                </Button>
                            ) : (
                                <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-medium text-gray-700">Move emails here</h4>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                                            onClick={() => setShowDragDropSelector(false)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <DragDropEmailSelector
                                        emails={emails}
                                        currentColumnId={column.id}
                                        onEmailMove={handleEmailMove}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Droppable>
    );
};

export default EmailColumn;

































































// 28/6/2025 2:32
// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";
// import { useState } from "react";
// import { Droppable, Draggable } from "react-beautiful-dnd";
// import { MoreHorizontal, Check, X, Move, Mail } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { EmailCard } from "./EmailCard";
// import { Email, EmailColumn as EmailColumnType } from "@/lib/types/email2";

// interface EmailColumnProps {
//     column: EmailColumnType;
//     emails: Email[];
//     onEditColumn: (column: EmailColumnType) => void;
//     onDeleteColumn: (column: EmailColumnType) => void;
//     currentPage: number;
//     onPageChange: (columnId: string, page: number) => void;
//     itemsPerPage: number;
//     editingColumnId: string | null;
//     editingColumnName: string;
//     onStartEdit: (column: EmailColumnType) => void;
//     onSaveEdit: () => void;
//     onCancelEdit: () => void;
//     onEditNameChange: (name: string) => void;
//     onEmailMove: (emailId: string, targetColumnId: string) => void;
// }

// // Drag and Drop Email Selector Component
// const DragDropEmailSelector = ({ 
//     emails, 
//     currentColumnId, 
//     onEmailMove 
// }: { 
//     emails: Email[], 
//     currentColumnId: string,
//     onEmailMove: (emailId: string, targetColumnId: string) => void 
// }) => {
//     const [isOpen, setIsOpen] = useState(false);
    
//     // Get emails from other columns that can be moved
//     const availableEmails = emails.filter(email => email.status !== currentColumnId);
    
//     if (availableEmails.length === 0) {
//         return (
//             <div className="text-center py-8 text-gray-500">
//                 <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
//                 <p className="text-sm">No emails available to move</p>
//             </div>
//         );
//     }

//     return (
//         <div className="space-y-2">
//             <div className="text-sm font-medium text-gray-700 mb-3 px-2">
//                 Select emails to move here:
//             </div>
//             <div className="max-h-64 overflow-y-auto space-y-1">
//                 {availableEmails.map((email) => (
//                     <div
//                         key={email.id}
//                         className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200 group"
//                         onClick={() => {
//                             onEmailMove(email.id, currentColumnId);
//                             setIsOpen(false);
//                         }}
//                     >
//                         <div className="flex items-start justify-between">
//                             <div className="flex-1 min-w-0">
//                                 <div className="flex items-center gap-2 mb-1">
//                                     <div className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
//                                         From: {email.status}
//                                     </div>
//                                     {email.isUrgent && (
//                                         <div className="w-2 h-2 bg-red-500 rounded-full"></div>
//                                     )}
//                                 </div>
//                                 <h4 className="text-sm font-medium text-gray-900 truncate">
//                                     {email.subject}
//                                 </h4>
//                                 <p className="text-xs text-gray-600 truncate">
//                                     From: {email.from}
//                                 </p>
//                             </div>
//                             <Move className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
//                         </div>
//                     </div>
//                 ))}
//             </div>
//             <div className="text-xs text-gray-500 px-2 mt-2">
//                 Click on any email to move it to this column
//             </div>
//         </div>
//     );
// };

// // Column Actions Component - Trello Style
// const ColumnActions = ({
//     column,
//     onDeleteColumn
// }: {
//     column: EmailColumnType;
//     onDeleteColumn: (column: EmailColumnType) => void;
// }) => {
//     return (
//         <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//                 <Button
//                     size="sm"
//                     variant="ghost"
//                     className="h-6 w-6 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
//                 >
//                     <MoreHorizontal className="h-4 w-4" />
//                 </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-32 bg-white border border-gray-200 shadow-lg rounded-sm">
//                 <DropdownMenuItem 
//                     onClick={() => onDeleteColumn(column)}
//                     disabled={["inbox", "urgent", "archive"].includes(column.id)}
//                     className="text-gray-700 hover:bg-gray-100 text-sm px-3 py-2"
//                 >
//                     Delete
//                 </DropdownMenuItem>
//             </DropdownMenuContent>
//         </DropdownMenu>
//     );
// };

// const EmailColumn = ({
//     column,
//     emails,
//     onEditColumn,
//     onDeleteColumn,
//     currentPage,
//     onPageChange,
//     itemsPerPage,
//     editingColumnId,
//     editingColumnName,
//     onStartEdit,
//     onSaveEdit,
//     onCancelEdit,
//     onEditNameChange,
//     onEmailMove
// }: EmailColumnProps) => {
//     const [showDragDropSelector, setShowDragDropSelector] = useState(false);

//     const emailsInColumn = emails.filter(
//         (email) => email?.status.toLowerCase() === column?.id.toLowerCase()
//     );

//     // Pagination logic
//     const totalPages = Math.ceil(emailsInColumn.length / itemsPerPage);
//     const startIndex = (currentPage - 1) * itemsPerPage;
//     const endIndex = startIndex + itemsPerPage;
//     const paginatedEmails = emailsInColumn.slice(startIndex, endIndex);

//     const isEditing = editingColumnId === column.id;

//     // Handle email move
//     const handleEmailMove = (emailId: string, targetColumnId: string) => {
//         onEmailMove(emailId, targetColumnId);
//         setShowDragDropSelector(false);
//     };

//     return (
//         <Droppable droppableId={column.id}>
//             {(provided, snapshot) => (
//                 <div
//                     ref={provided.innerRef}
//                     {...provided.droppableProps}
//                     className="w-72 flex-shrink-0 rounded-2xl p-2"
//                     style={{ backgroundColor: '#ebecf0' }}
//                 >
//                     <div className={`transition-all duration-300 ${
//                         snapshot.isDraggingOver ? "bg-blue-50/80 border-blue-400" : ""
//                     }`}>
//                         {/* Column Header - Trello Style */}
//                         <div className="flex justify-between items-center mb-2 px-2">
//                             <div className="flex-1">
//                                 {isEditing ? (
//                                     <div className="flex items-center gap-1">
//                                         <Input
//                                             value={editingColumnName}
//                                             onChange={(e) => onEditNameChange(e.target.value)}
//                                             onKeyDown={(e) => {
//                                                 if (e.key === 'Enter') {
//                                                     onSaveEdit();
//                                                 } else if (e.key === 'Escape') {
//                                                     onCancelEdit();
//                                                 }
//                                             }}
//                                             className="h-7 text-sm font-semibold text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white rounded-sm"
//                                             autoFocus
//                                         />
//                                         <Button
//                                             size="sm"
//                                             variant="ghost"
//                                             className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 rounded"
//                                             onClick={onSaveEdit}
//                                         >
//                                             <Check className="h-3 w-3" />
//                                         </Button>
//                                         <Button
//                                             size="sm"
//                                             variant="ghost"
//                                             className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 rounded"
//                                             onClick={onCancelEdit}
//                                         >
//                                             <X className="h-3 w-3" />
//                                         </Button>
//                                     </div>
//                                 ) : (
//                                     <div className="flex items-center gap-2">
//                                         <h3 
//                                             className="text-sm font-semibold text-gray-700 cursor-pointer hover:text-gray-900 font-sans"
//                                             onClick={() => onStartEdit(column)}
//                                             title="Click to edit"
//                                             style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
//                                         >
//                                             {column.title}
//                                         </h3>
//                                         <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
//                                             {emailsInColumn.length}
//                                         </span>
//                                     </div>
//                                 )}
//                             </div>
//                             {!isEditing && (
//                                 <ColumnActions 
//                                     column={column} 
//                                     onDeleteColumn={onDeleteColumn}
//                                 />
//                             )}
//                         </div>

//                         {/* Emails Container - Trello style */}
//                         <ol className="space-y-2">
//                             {paginatedEmails.length > 0 ? (
//                                 paginatedEmails.map((email, index) => (
//                                     <li key={email.id}>
//                                         <Draggable key={email.id} draggableId={email.id} index={startIndex + index}>
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
//                                                     <div className="relative rounded-lg border hover:shadow-md hover:border-blue-500 hover:border-2 transition-all cursor-pointer group overflow-hidden border-gray-200 shadow-sm bg-white"
//                                                         style={{ 
//                                                             boxShadow: '0 1px 0 rgba(9,30,66,.25)',
//                                                             borderRadius: '10px',
//                                                             minHeight: '60px',
//                                                         }}
//                                                     >
//                                                         <EmailCard email={email} index={index} />
//                                                     </div>
//                                                 </div>
//                                             )}
//                                         </Draggable>
//                                     </li>
//                                 ))
//                             ) : (
//                                 <div className="rounded-xl border-2 border-dashed border-transparent" />
//                             )}
//                             {provided.placeholder}
//                         </ol>

//                         {/* Drag and Drop Email Button - Trello Style */}
//                         <div className={paginatedEmails.length > 0 ? "mt-2" : "mt-1"}>
//                             {!showDragDropSelector ? (
//                                 <Button
//                                     variant="ghost"
//                                     className="w-full justify-start text-gray-600 hover:text-gray-800 hover:!bg-gray-400 transition-colors rounded-sm py-1.5 px-2 text-sm font-normal h-auto"
//                                     onClick={() => setShowDragDropSelector(true)}
//                                 >
//                                     <Move className="w-4 h-4 mr-1" />
//                                     Drag & drop mail
//                                 </Button>
//                             ) : (
//                                 <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
//                                     <div className="flex items-center justify-between mb-3">
//                                         <h4 className="text-sm font-medium text-gray-700">Move emails here</h4>
//                                         <Button
//                                             size="sm"
//                                             variant="ghost"
//                                             className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
//                                             onClick={() => setShowDragDropSelector(false)}
//                                         >
//                                             <X className="h-4 w-4" />
//                                         </Button>
//                                     </div>
//                                     <DragDropEmailSelector
//                                         emails={emails}
//                                         currentColumnId={column.id}
//                                         onEmailMove={handleEmailMove}
//                                     />
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </Droppable>
//     );
// };

// export default EmailColumn;

























































// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";
// import { useState } from "react";
// import { Droppable, Draggable } from "react-beautiful-dnd";
// import { MoreHorizontal, Check, X, Move, Mail } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { EmailCard } from "./EmailCard";
// import { Email, EmailColumn as EmailColumnType } from "@/lib/types/email2";

// interface EmailColumnProps {
//     column: EmailColumnType;
//     emails: Email[];
//     onEditColumn: (column: EmailColumnType) => void;
//     onDeleteColumn: (column: EmailColumnType) => void;
//     currentPage: number;
//     onPageChange: (columnId: string, page: number) => void;
//     itemsPerPage: number;
//     editingColumnId: string | null;
//     editingColumnName: string;
//     onStartEdit: (column: EmailColumnType) => void;
//     onSaveEdit: () => void;
//     onCancelEdit: () => void;
//     onEditNameChange: (name: string) => void;
//     onEmailMove: (emailId: string, targetColumnId: string) => void;
// }

// // Drag and Drop Email Selector Component
// const DragDropEmailSelector = ({ 
//     emails, 
//     currentColumnId, 
//     onEmailMove 
// }: { 
//     emails: Email[], 
//     currentColumnId: string,
//     onEmailMove: (emailId: string, targetColumnId: string) => void 
// }) => {
//     const [isOpen, setIsOpen] = useState(false);
    
//     // Get emails from other columns that can be moved
//     const availableEmails = emails.filter(email => email.status !== currentColumnId);
    
//     if (availableEmails.length === 0) {
//         return (
//             <div className="text-center py-8 text-gray-500">
//                 <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
//                 <p className="text-sm">No emails available to move</p>
//             </div>
//         );
//     }

//     return (
//         <div className="space-y-2">
//             <div className="text-sm font-medium text-gray-700 mb-3 px-2">
//                 Select emails to move here:
//             </div>
//             <div className="max-h-64 overflow-y-auto space-y-1">
//                 {availableEmails.map((email) => (
//                     <div
//                         key={email.id}
//                         className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200 group"
//                         onClick={() => {
//                             onEmailMove(email.id, currentColumnId);
//                             setIsOpen(false);
//                         }}
//                     >
//                         <div className="flex items-start justify-between">
//                             <div className="flex-1 min-w-0">
//                                 <div className="flex items-center gap-2 mb-1">
//                                     <div className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
//                                         From: {email.status}
//                                     </div>
//                                     {email.isUrgent && (
//                                         <div className="w-2 h-2 bg-red-500 rounded-full"></div>
//                                     )}
//                                 </div>
//                                 <h4 className="text-sm font-medium text-gray-900 truncate">
//                                     {email.subject}
//                                 </h4>
//                                 <p className="text-xs text-gray-600 truncate">
//                                     From: {email.from}
//                                 </p>
//                             </div>
//                             <Move className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
//                         </div>
//                     </div>
//                 ))}
//             </div>
//             <div className="text-xs text-gray-500 px-2 mt-2">
//                 Click on any email to move it to this column
//             </div>
//         </div>
//     );
// };

// // Column Actions Component - Trello Style
// const ColumnActions = ({
//     column,
//     onDeleteColumn
// }: {
//     column: EmailColumnType;
//     onDeleteColumn: (column: EmailColumnType) => void;
// }) => {
//     return (
//         <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//                 <Button
//                     size="sm"
//                     variant="ghost"
//                     className="h-6 w-6 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
//                 >
//                     <MoreHorizontal className="h-4 w-4" />
//                 </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-32 bg-white border border-gray-200 shadow-lg rounded-sm">
//                 <DropdownMenuItem 
//                     onClick={() => onDeleteColumn(column)}
//                     disabled={["inbox", "urgent", "archive"].includes(column.id)}
//                     className="text-gray-700 hover:bg-gray-100 text-sm px-3 py-2"
//                 >
//                     Delete
//                 </DropdownMenuItem>
//             </DropdownMenuContent>
//         </DropdownMenu>
//     );
// };

// const EmailColumn = ({
//     column,
//     emails,
//     onEditColumn,
//     onDeleteColumn,
//     currentPage,
//     onPageChange,
//     itemsPerPage,
//     editingColumnId,
//     editingColumnName,
//     onStartEdit,
//     onSaveEdit,
//     onCancelEdit,
//     onEditNameChange,
//     onEmailMove
// }: EmailColumnProps) => {
//     const [showDragDropSelector, setShowDragDropSelector] = useState(false);

//     const emailsInColumn = emails.filter(
//         (email) => email?.status.toLowerCase() === column?.id.toLowerCase()
//     );

//     // Pagination logic
//     const totalPages = Math.ceil(emailsInColumn.length / itemsPerPage);
//     const startIndex = (currentPage - 1) * itemsPerPage;
//     const endIndex = startIndex + itemsPerPage;
//     const paginatedEmails = emailsInColumn.slice(startIndex, endIndex);

//     const isEditing = editingColumnId === column.id;

//     // Handle email move
//     const handleEmailMove = (emailId: string, targetColumnId: string) => {
//         onEmailMove(emailId, targetColumnId);
//         setShowDragDropSelector(false);
//     };

//     return (
//         <Droppable droppableId={column.id}>
//             {(provided, snapshot) => (
//                 <div
//                     ref={provided.innerRef}
//                     {...provided.droppableProps}
//                     className="w-72 flex-shrink-0 rounded-2xl p-2"
//                     style={{ backgroundColor: '#ebecf0' }}
//                 >
//                     <div className={`transition-all duration-300 ${
//                         snapshot.isDraggingOver ? "bg-blue-50/80 border-blue-400" : ""
//                     }`}>
//                         {/* Column Header - Trello Style */}
//                         <div className="flex justify-between items-center mb-2 px-2">
//                             <div className="flex-1">
//                                 {isEditing ? (
//                                     <div className="flex items-center gap-1">
//                                         <Input
//                                             value={editingColumnName}
//                                             onChange={(e) => onEditNameChange(e.target.value)}
//                                             onKeyDown={(e) => {
//                                                 if (e.key === 'Enter') {
//                                                     onSaveEdit();
//                                                 } else if (e.key === 'Escape') {
//                                                     onCancelEdit();
//                                                 }
//                                             }}
//                                             className="h-7 text-sm font-semibold text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white rounded-sm"
//                                             autoFocus
//                                         />
//                                         <Button
//                                             size="sm"
//                                             variant="ghost"
//                                             className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 rounded"
//                                             onClick={onSaveEdit}
//                                         >
//                                             <Check className="h-3 w-3" />
//                                         </Button>
//                                         <Button
//                                             size="sm"
//                                             variant="ghost"
//                                             className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 rounded"
//                                             onClick={onCancelEdit}
//                                         >
//                                             <X className="h-3 w-3" />
//                                         </Button>
//                                     </div>
//                                 ) : (
//                                     <div className="flex items-center gap-2">
//                                         <h3 
//                                             className="text-sm font-semibold text-gray-700 cursor-pointer hover:text-gray-900 font-sans"
//                                             onClick={() => onStartEdit(column)}
//                                             title="Click to edit"
//                                             style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
//                                         >
//                                             {column.title}
//                                         </h3>
//                                         <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
//                                             {emailsInColumn.length}
//                                         </span>
//                                     </div>
//                                 )}
//                             </div>
//                             {!isEditing && (
//                                 <ColumnActions 
//                                     column={column} 
//                                     onDeleteColumn={onDeleteColumn}
//                                 />
//                             )}
//                         </div>

//                         {/* Emails Container - Trello style */}
//                         <ol className="space-y-2">
//                             {paginatedEmails.length > 0 ? (
//                                 paginatedEmails.map((email, index) => (
//                                     <li key={email.id}>
//                                         <Draggable key={email.id} draggableId={email.id} index={startIndex + index}>
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
//                                                     <div className="relative rounded-lg border hover:shadow-md hover:border-blue-500 hover:border-2 transition-all cursor-pointer group overflow-hidden border-gray-200 shadow-sm bg-white"
//                                                         style={{ 
//                                                             boxShadow: '0 1px 0 rgba(9,30,66,.25)',
//                                                             borderRadius: '10px',
//                                                             minHeight: '60px',
//                                                         }}
//                                                     >
//                                                         <EmailCard email={email} index={index} />
//                                                     </div>
//                                                 </div>
//                                             )}
//                                         </Draggable>
//                                     </li>
//                                 ))
//                             ) : (
//                                 <div className="rounded-xl border-2 border-dashed border-transparent" />
//                             )}
//                             {provided.placeholder}
//                         </ol>

//                         {/* Drag and Drop Email Button - Trello Style */}
//                         <div className={paginatedEmails.length > 0 ? "mt-2" : "mt-1"}>
//                             {!showDragDropSelector ? (
//                                 <Button
//                                     variant="ghost"
//                                     className="w-full justify-start text-gray-600 hover:text-gray-800 hover:!bg-gray-400 transition-colors rounded-sm py-1.5 px-2 text-sm font-normal h-auto"
//                                     onClick={() => setShowDragDropSelector(true)}
//                                 >
//                                     <Move className="w-4 h-4 mr-1" />
//                                     Drag & drop mail
//                                 </Button>
//                             ) : (
//                                 <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
//                                     <div className="flex items-center justify-between mb-3">
//                                         <h4 className="text-sm font-medium text-gray-700">Move emails here</h4>
//                                         <Button
//                                             size="sm"
//                                             variant="ghost"
//                                             className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
//                                             onClick={() => setShowDragDropSelector(false)}
//                                         >
//                                             <X className="h-4 w-4" />
//                                         </Button>
//                                     </div>
//                                     <DragDropEmailSelector
//                                         emails={emails}
//                                         currentColumnId={column.id}
//                                         onEmailMove={handleEmailMove}
//                                     />
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </Droppable>
//     );
// };

// export default EmailColumn;



























































// Updated working
// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";
// import { useState } from "react";
// import { Droppable, Draggable } from "react-beautiful-dnd";
// import { Plus, MoreHorizontal, Check, X } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { EmailCard } from "./EmailCard";
// import { Email, EmailColumn as EmailColumnType } from "@/lib/types/email2";
// import { ComposeModal } from "../AddEmailComponents/ComposeModal";

// interface EmailColumnProps {
//     column: EmailColumnType;
//     emails: Email[];
//     onEditColumn: (column: EmailColumnType) => void;
//     onDeleteColumn: (column: EmailColumnType) => void;
//     currentPage: number;
//     onPageChange: (columnId: string, page: number) => void;
//     itemsPerPage: number;
//     editingColumnId: string | null;
//     editingColumnName: string;
//     onStartEdit: (column: EmailColumnType) => void;
//     onSaveEdit: () => void;
//     onCancelEdit: () => void;
//     onEditNameChange: (name: string) => void;
// }

// // Column Actions Component - Trello Style
// const ColumnActions = ({
//     column,
//     onDeleteColumn
// }: {
//     column: EmailColumnType;
//     onDeleteColumn: (column: EmailColumnType) => void;
// }) => {
//     return (
//         <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//                 <Button
//                     size="sm"
//                     variant="ghost"
//                     className="h-6 w-6 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
//                 >
//                     <MoreHorizontal className="h-4 w-4" />
//                 </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-32 bg-white border border-gray-200 shadow-lg rounded-sm">
//                 <DropdownMenuItem 
//                     onClick={() => onDeleteColumn(column)}
//                     disabled={["inbox", "urgent", "archive"].includes(column.id)}
//                     className="text-gray-700 hover:bg-gray-100 text-sm px-3 py-2"
//                 >
//                     Delete
//                 </DropdownMenuItem>
//             </DropdownMenuContent>
//         </DropdownMenu>
//     );
// };

// const EmailColumn = ({
//     column,
//     emails,
//     onEditColumn,
//     onDeleteColumn,
//     currentPage,
//     onPageChange,
//     itemsPerPage,
//     editingColumnId,
//     editingColumnName,
//     onStartEdit,
//     onSaveEdit,
//     onCancelEdit,
//     onEditNameChange
// }: EmailColumnProps) => {
//     const [isComposeOpen, setIsComposeOpen] = useState(false);

//     const emailsInColumn = emails.filter(
//         (email) => email?.status.toLowerCase() === column?.id.toLowerCase()
//     );

//     // Pagination logic
//     const totalPages = Math.ceil(emailsInColumn.length / itemsPerPage);
//     const startIndex = (currentPage - 1) * itemsPerPage;
//     const endIndex = startIndex + itemsPerPage;
//     const paginatedEmails = emailsInColumn.slice(startIndex, endIndex);

//     const isEditing = editingColumnId === column.id;

//     return (
//         <Droppable droppableId={column.id}>
//             {(provided, snapshot) => (
//                 <div
//                     ref={provided.innerRef}
//                     {...provided.droppableProps}
//                     className="w-72 flex-shrink-0 rounded-2xl p-2"
//                     style={{ backgroundColor: '#ebecf0' }}
//                 >
//                     <div className={`transition-all duration-300 ${
//                         snapshot.isDraggingOver ? "bg-blue-50/80 border-blue-400" : ""
//                     }`}>
//                         {/* Column Header - Trello Style */}
//                         <div className="flex justify-between items-center mb-2 px-2">
//                             <div className="flex-1">
//                                 {isEditing ? (
//                                     <div className="flex items-center gap-1">
//                                         <Input
//                                             value={editingColumnName}
//                                             onChange={(e) => onEditNameChange(e.target.value)}
//                                             onKeyDown={(e) => {
//                                                 if (e.key === 'Enter') {
//                                                     onSaveEdit();
//                                                 } else if (e.key === 'Escape') {
//                                                     onCancelEdit();
//                                                 }
//                                             }}
//                                             className="h-7 text-sm font-semibold text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white rounded-sm"
//                                             autoFocus
//                                         />
//                                         <Button
//                                             size="sm"
//                                             variant="ghost"
//                                             className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 rounded"
//                                             onClick={onSaveEdit}
//                                         >
//                                             <Check className="h-3 w-3" />
//                                         </Button>
//                                         <Button
//                                             size="sm"
//                                             variant="ghost"
//                                             className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 rounded"
//                                             onClick={onCancelEdit}
//                                         >
//                                             <X className="h-3 w-3" />
//                                         </Button>
//                                     </div>
//                                 ) : (
//                                     <div className="flex items-center gap-2">
//                                         <h3 
//                                             className="text-sm font-semibold text-gray-700 cursor-pointer hover:text-gray-900 font-sans"
//                                             onClick={() => onStartEdit(column)}
//                                             title="Click to edit"
//                                             style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
//                                         >
//                                             {column.title}
//                                         </h3>
//                                     </div>
//                                 )}
//                             </div>
//                             {!isEditing && (
//                                 <ColumnActions 
//                                     column={column} 
//                                     onDeleteColumn={onDeleteColumn}
//                                 />
//                             )}
//                         </div>

//                         {/* Emails Container - Trello style */}
//                         <ol className="space-y-2">
//                             {paginatedEmails.length > 0 ? (
//                                 paginatedEmails.map((email, index) => (
//                                     <li key={email.id}>
//                                         <Draggable key={email.id} draggableId={email.id} index={startIndex + index}>
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
//                                                     <div className="relative rounded-lg border hover:shadow-md hover:border-blue-500 hover:border-2 transition-all cursor-pointer group overflow-hidden border-gray-200 shadow-sm bg-white"
//                                                         style={{ 
//                                                             boxShadow: '0 1px 0 rgba(9,30,66,.25)',
//                                                             borderRadius: '10px',
//                                                             minHeight: '60px',
//                                                         }}
//                                                     >
//                                                         <EmailCard email={email} index={index} />
//                                                     </div>
//                                                 </div>
//                                             )}
//                                         </Draggable>
//                                     </li>
//                                 ))
//                             ) : (
//                                 <div className="rounded-xl border-2 border-dashed border-transparent" />
//                             )}
//                             {provided.placeholder}
//                         </ol>

//                         {/* Add Email Button - Trello Style */}
//                         <div className={paginatedEmails.length > 0 ? "mt-2" : "mt-1"}>
//                             <Button
//                                 variant="ghost"
//                                 className="w-full justify-start text-gray-600 hover:text-gray-800 hover:!bg-gray-400 transition-colors rounded-sm py-1.5 px-2 text-sm font-normal h-auto"
//                                 onClick={() => setIsComposeOpen(true)}
//                             >
//                                 <Plus className="w-4 h-4 mr-1" />
//                                 Add an email
//                             </Button>
//                         </div>

//                         {/* Compose Modal */}
//                         <ComposeModal
//                             isOpen={isComposeOpen}
//                             onClose={() => setIsComposeOpen(false)}
//                         />
//                     </div>
//                 </div>
//             )}
//         </Droppable>
//     );
// };

// export default EmailColumn;




































































// Daniel UI
// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";
// import { useState } from "react";
// import { Droppable, Draggable } from "react-beautiful-dnd";
// import { Plus, MoreHorizontal, ChevronLeft, ChevronRight, Mail } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { toast } from "sonner";
// import { EmailCard } from "./EmailCard";
// import { Email, EmailColumn as EmailColumnType, EmailCompose } from "@/lib/types/email2";
// import { ComposeModal } from "../AddEmailComponents/ComposeModal";

// interface EmailColumnProps {
//     column: EmailColumnType;
//     emails: Email[];
//     onEditColumn: (column: EmailColumnType) => void;
//     onDeleteColumn: (column: EmailColumnType) => void;
//     currentPage: number;
//     onPageChange: (columnId: string, page: number) => void;
//     itemsPerPage: number;
// }

// // Column Actions Component
// const ColumnActions = ({
//     column,
//     onEditColumn,
//     onDeleteColumn
// }: {
//     column: EmailColumnType;
//     onEditColumn: (column: EmailColumnType) => void;
//     onDeleteColumn: (column: EmailColumnType) => void;
// }) => {
//     return (
//         <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//                 <Button
//                     size="icon"
//                     variant="ghost"
//                     className="h-6 w-6 rounded-full hover:bg-white/20 transition-colors text-white"
//                 >
//                     <MoreHorizontal className="h-4 w-4" />
//                 </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-40">
//                 <DropdownMenuItem onClick={() => onEditColumn(column)}>
//                     Edit Column
//                 </DropdownMenuItem>
//                 <DropdownMenuItem
//                     onClick={() => onDeleteColumn(column)}
//                     disabled={["inbox", "urgent", "archive"].includes(column.id)}
//                     className="text-red-600 focus:text-red-600"
//                 >
//                     Delete
//                 </DropdownMenuItem>
//             </DropdownMenuContent>
//         </DropdownMenu>
//     );
// };

// const EmailColumn = ({
//     column,
//     emails,
//     onEditColumn,
//     onDeleteColumn,
//     currentPage,
//     onPageChange,
//     itemsPerPage
// }: EmailColumnProps) => {
//     const [isComposeOpen, setIsComposeOpen] = useState(false);

//     const emailsInColumn = emails.filter(
//         (email) => email?.status.toLowerCase() === column?.id.toLowerCase()
//     );

//     // Pagination logic
//     const totalPages = Math.ceil(emailsInColumn.length / itemsPerPage);
//     const startIndex = (currentPage - 1) * itemsPerPage;
//     const endIndex = startIndex + itemsPerPage;
//     const paginatedEmails = emailsInColumn.slice(startIndex, endIndex);
//     const showPagination = emailsInColumn.length > itemsPerPage;

//     // Get the icon component
//     const IconComponent = column.icon;

//     return (
//         <Droppable droppableId={column.id}>
//             {(provided, snapshot) => (
//                 <div
//                     ref={provided.innerRef}
//                     {...provided.droppableProps}
//                     className="w-[272px] flex-shrink-0 group relative"
//                 >
//                     <div className={`bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 transition-all shadow-lg duration-300 hover:-translate-y-1 pb-16 ${snapshot.isDraggingOver ? "border-blue-400 bg-blue-50/80" : ""
//                         }`}>
//                         <div className="flex justify-between items-center mb-2">
//                             <div className="space-y-2 flex-1 min-w-0">
//                                 <div className="flex items-center gap-2">
//                                     {/* Icon with gradient background */}
//                                     <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${column.gradient} flex items-center justify-center flex-shrink-0`}>
//                                         <IconComponent className="w-4 h-4 text-white" />
//                                     </div>
//                                     <h3 className="font-bold text-base text-gray-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300 truncate">
//                                         {column.title}
//                                     </h3>
//                                 </div>
//                                 <div className="flex items-center gap-2">
//                                     <div className="px-2 py-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex-shrink-0">
//                                         <p className="text-xs font-semibold text-gray-600 whitespace-nowrap">
//                                             {emailsInColumn.length} email{emailsInColumn.length !== 1 ? "s" : ""}
//                                         </p>
//                                     </div>
//                                 </div>
//                             </div>
//                             <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0">
//                                 <ColumnActions
//                                     column={column}
//                                     onEditColumn={onEditColumn}
//                                     onDeleteColumn={onDeleteColumn}
//                                 />
//                             </div>
//                         </div>

//                         <div className="space-y-3 min-h-[10px] mb-4 overflow-hidden">
//                             {paginatedEmails.length > 0 ? (
//                                 paginatedEmails.map((email, index) => (
//                                     <Draggable key={email.id} draggableId={email.id} index={startIndex + index}>
//                                         {(provided, snapshot) => (
//                                             <div
//                                                 ref={provided.innerRef}
//                                                 {...provided.draggableProps}
//                                                 {...provided.dragHandleProps}
//                                                 className={`transform hover:scale-[1.02] transition-transform duration-200 ${
//                                                     snapshot.isDragging ? "shadow-lg opacity-80" : ""
//                                                 }`}
//                                                 style={{
//                                                     ...provided.draggableProps.style,
//                                                     animationDelay: `${index * 100}ms`,
//                                                     animation: 'fadeInUp 0.5s ease-out forwards'
//                                                 }}
//                                             >
//                                                 <div className="w-full overflow-hidden">
//                                                     <EmailCard email={email} index={index} />
//                                                 </div>
//                                             </div>
//                                         )}
//                                     </Draggable>
//                                 ))
//                             ) : (
//                                <div className="rounded-xl border-2 border-dashed border-transparent" />
//                             )}
//                             {provided.placeholder}
//                         </div>

//                         {/* Pagination Controls - shown before Add Email button */}
//                         {showPagination && (
//                             <div className="flex items-center justify-between mb-3 px-2">
//                                 <Button
//                                     variant="ghost"
//                                     size="sm"
//                                     onClick={() => onPageChange(column.id, Math.max(1, currentPage - 1))}
//                                     disabled={currentPage === 1}
//                                     className="h-8 w-8 p-0 rounded-full hover:bg-gray-200"
//                                 >
//                                     <ChevronLeft className="h-4 w-4" />
//                                 </Button>

//                                 <div className="flex items-center gap-1">
//                                     <span className="text-xs text-gray-500 whitespace-nowrap">
//                                         {currentPage} of {totalPages}
//                                     </span>
//                                 </div>

//                                 <Button
//                                     variant="ghost"
//                                     size="sm"
//                                     onClick={() => onPageChange(column.id, Math.min(totalPages, currentPage + 1))}
//                                     disabled={currentPage === totalPages}
//                                     className="h-8 w-8 p-0 rounded-full hover:bg-gray-200"
//                                 >
//                                     <ChevronRight className="h-4 w-4" />
//                                 </Button>
//                             </div>
//                         )}

//                         {/* Add Email Button positioned at bottom center */}
//                         <div className="absolute bottom-2 left-4 right-4">
//                             <Button
//                                 variant="ghost"
//                                 className="w-full justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-200 transition-colors duration-200 rounded-xl py-2 px-3 bg-transparent"
//                                 onClick={() => setIsComposeOpen(true)}
//                             >
//                                 <Plus className="w-4 h-4 mr-2" />
//                                 Add Email
//                             </Button>
//                         </div>
//                     </div>

//                     {/* Compose Modal */}
//                     <ComposeModal
//                         isOpen={isComposeOpen}
//                         onClose={() => setIsComposeOpen(false)}
//                     />
//                 </div>
//             )}
//         </Droppable>
//     );
// };

// export default EmailColumn;























































// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";
// import { useState } from "react";
// import { Droppable, Draggable } from "react-beautiful-dnd";
// import { Plus, MoreHorizontal, ChevronLeft, ChevronRight, Mail } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { toast } from "sonner";
// import { EmailCard } from "./EmailCard";
// import { Email, EmailColumn as EmailColumnType, EmailCompose } from "@/lib/types/email2";
// import { ComposeModal } from "./ComposeModal";

// interface EmailColumnProps {
//     column: EmailColumnType;
//     emails: Email[];
//     onEditColumn: (column: EmailColumnType) => void;
//     onDeleteColumn: (column: EmailColumnType) => void;
//     currentPage: number;
//     onPageChange: (columnId: string, page: number) => void;
//     itemsPerPage: number;
// }

// // Column Actions Component
// const ColumnActions = ({
//     column,
//     onEditColumn,
//     onDeleteColumn
// }: {
//     column: EmailColumnType;
//     onEditColumn: (column: EmailColumnType) => void;
//     onDeleteColumn: (column: EmailColumnType) => void;
// }) => {
//     return (
//         <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//                 <Button
//                     size="icon"
//                     variant="ghost"
//                     className="h-6 w-6 rounded-full hover:bg-gray-200 transition-colors"
//                 >
//                     <MoreHorizontal className="h-4 w-4" />
//                 </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-40">
//                 <DropdownMenuItem onClick={() => onEditColumn(column)}>
//                     Edit Column
//                 </DropdownMenuItem>
//                 <DropdownMenuItem
//                     onClick={() => onDeleteColumn(column)}
//                     disabled={["inbox", "urgent", "archive"].includes(column.id)}
//                     className="text-red-600 focus:text-red-600"
//                 >
//                     Delete
//                 </DropdownMenuItem>
//             </DropdownMenuContent>
//         </DropdownMenu>
//     );
// };

// const EmailColumn = ({
//     column,
//     emails,
//     onEditColumn,
//     onDeleteColumn,
//     currentPage,
//     onPageChange,
//     itemsPerPage
// }: EmailColumnProps) => {
//     const [isComposeOpen, setIsComposeOpen] = useState(false);

//     const emailsInColumn = emails.filter(
//         (email) => email?.status.toLowerCase() === column?.id.toLowerCase()
//     );

//     // Pagination logic
//     const totalPages = Math.ceil(emailsInColumn.length / itemsPerPage);
//     const startIndex = (currentPage - 1) * itemsPerPage;
//     const endIndex = startIndex + itemsPerPage;
//     const paginatedEmails = emailsInColumn.slice(startIndex, endIndex);
//     const showPagination = emailsInColumn.length > itemsPerPage;

//     return (
//         <Droppable droppableId={column.id}>
//             {(provided, snapshot) => (
//                 <div
//                     ref={provided.innerRef}
//                     {...provided.droppableProps}
//                     className="w-[300px] flex-shrink-0 group relative"
//                 >
//                     <div className={`bg-gray-100 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 transition-all shadow-sm duration-300 hover:-translate-y-1 pb-16 ${snapshot.isDraggingOver ? "border-blue-400 bg-blue-50/80" : ""
//                         }`}>
//                         <div className="flex justify-between items-center mb-4">
//                             <div className="space-y-2 flex-1 min-w-0">
//                                 <div className="flex items-center gap-2">
//                                     <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse flex-shrink-0"></div>
//                                     <h3 className="font-bold text-base text-gray-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300 truncate">
//                                         {column.title}
//                                     </h3>
//                                 </div>
//                                 <div className="flex items-center gap-2">
//                                     <div className="px-2 py-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex-shrink-0">
//                                         <p className="text-xs font-semibold text-gray-600 whitespace-nowrap">
//                                             {emailsInColumn.length} email{emailsInColumn.length !== 1 ? "s" : ""}
//                                         </p>
//                                     </div>
//                                 </div>
//                             </div>
//                             <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0">
//                                 <ColumnActions
//                                     column={column}
//                                     onEditColumn={onEditColumn}
//                                     onDeleteColumn={onDeleteColumn}
//                                 />
//                             </div>
//                         </div>

//                         <div className="space-y-3 min-h-[120px] mb-4 overflow-hidden">
//                             {paginatedEmails.length > 0 ? (
//                                 paginatedEmails.map((email, index) => (
//                                     <Draggable key={email.id} draggableId={email.id} index={startIndex + index}>
//                                         {(provided, snapshot) => (
//                                             <div
//                                                 ref={provided.innerRef}
//                                                 {...provided.draggableProps}
//                                                 {...provided.dragHandleProps}
//                                                 className={`transform hover:scale-[1.02] transition-transform duration-200 ${snapshot.isDragging ? "shadow-lg opacity-80" : ""
//                                                     }`}
//                                                 style={{
//                                                     ...provided.draggableProps.style,
//                                                     animationDelay: `${index * 100}ms`,
//                                                     animation: 'fadeInUp 0.5s ease-out forwards'
//                                                 }}
//                                             >
//                                                 <div className="w-full overflow-hidden">
//                                                     <EmailCard email={email} index={index} />
//                                                 </div>
//                                             </div>
//                                         )}
//                                     </Draggable>
//                                 ))
//                             ) : (
//                                 <div className="h-20 border-2 border-dashed border-gray-300/60 rounded-xl flex items-center justify-center bg-gradient-to-br from-gray-50/50 to-gray-100/30 hover:from-blue-50/50 hover:to-purple-50/30 transition-all duration-300 group/drop">
//                                     <div className="text-center space-y-1">
//                                         <div className="w-6 h-6 mx-auto rounded-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center group-hover/drop:from-blue-400 group-hover/drop:to-purple-400 transition-all duration-300">
//                                             <Plus className="w-3 h-3 text-white" />
//                                         </div>
//                                         <p className="text-xs text-gray-500 font-medium group-hover/drop:text-gray-700 transition-colors duration-300">
//                                             Drop emails here
//                                         </p>
//                                     </div>
//                                 </div>
//                             )}
//                             {provided.placeholder}
//                         </div>

//                         {/* Pagination Controls - shown before Add Email button */}
//                         {showPagination && (
//                             <div className="flex items-center justify-between mb-3 px-2">
//                                 <Button
//                                     variant="ghost"
//                                     size="sm"
//                                     onClick={() => onPageChange(column.id, Math.max(1, currentPage - 1))}
//                                     disabled={currentPage === 1}
//                                     className="h-8 w-8 p-0 rounded-full hover:bg-gray-200"
//                                 >
//                                     <ChevronLeft className="h-4 w-4" />
//                                 </Button>

//                                 <div className="flex items-center gap-1">
//                                     <span className="text-xs text-gray-500 whitespace-nowrap">
//                                         {currentPage} of {totalPages}
//                                     </span>
//                                 </div>

//                                 <Button
//                                     variant="ghost"
//                                     size="sm"
//                                     onClick={() => onPageChange(column.id, Math.min(totalPages, currentPage + 1))}
//                                     disabled={currentPage === totalPages}
//                                     className="h-8 w-8 p-0 rounded-full hover:bg-gray-200"
//                                 >
//                                     <ChevronRight className="h-4 w-4" />
//                                 </Button>
//                             </div>
//                         )}

//                         {/* Add Email Button positioned at bottom center */}
//                         <div className="absolute bottom-2 left-4 right-4">
//                             <Button
//                                 variant="ghost"
//                                 className="w-full justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-200 transition-colors duration-200 rounded-xl py-2 px-3 bg-transparent"
//                                 onClick={() => setIsComposeOpen(true)}
//                             >
//                                 <Plus className="w-4 h-4 mr-2" />
//                                 Add Email
//                             </Button>
//                         </div>
//                     </div>

//                     {/* Compose Modal */}
//                     <ComposeModal
//                         isOpen={isComposeOpen}
//                         onClose={() => setIsComposeOpen(false)}
//                     />
//                 </div>
//             )}
//         </Droppable>
//     );
// };

// export default EmailColumn;