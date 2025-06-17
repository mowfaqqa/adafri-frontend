/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { Plus, MoreHorizontal, ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { EmailCard } from "./EmailCard";
import { Email, EmailColumn as EmailColumnType, EmailCompose } from "@/lib/types/email2";
import { ComposeModal } from "../AddEmailComponents/ComposeModal";

interface EmailColumnProps {
    column: EmailColumnType;
    emails: Email[];
    onEditColumn: (column: EmailColumnType) => void;
    onDeleteColumn: (column: EmailColumnType) => void;
    currentPage: number;
    onPageChange: (columnId: string, page: number) => void;
    itemsPerPage: number;
}

// Column Actions Component
const ColumnActions = ({
    column,
    onEditColumn,
    onDeleteColumn
}: {
    column: EmailColumnType;
    onEditColumn: (column: EmailColumnType) => void;
    onDeleteColumn: (column: EmailColumnType) => void;
}) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded-full hover:bg-white/20 transition-colors text-white"
                >
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onEditColumn(column)}>
                    Edit Column
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => onDeleteColumn(column)}
                    disabled={["inbox", "urgent", "archive"].includes(column.id)}
                    className="text-red-600 focus:text-red-600"
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
    currentPage,
    onPageChange,
    itemsPerPage
}: EmailColumnProps) => {
    const [isComposeOpen, setIsComposeOpen] = useState(false);

    const emailsInColumn = emails.filter(
        (email) => email?.status.toLowerCase() === column?.id.toLowerCase()
    );

    // Pagination logic
    const totalPages = Math.ceil(emailsInColumn.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedEmails = emailsInColumn.slice(startIndex, endIndex);
    const showPagination = emailsInColumn.length > itemsPerPage;

    // Get the icon component
    const IconComponent = column.icon;

    return (
        <Droppable droppableId={column.id}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="w-[300px] flex-shrink-0 group relative"
                >
                    <div className={`bg-gray-100 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 transition-all shadow-sm duration-300 hover:-translate-y-1 pb-16 ${snapshot.isDraggingOver ? "border-blue-400 bg-blue-50/80" : ""
                        }`}>
                        <div className="flex justify-between items-center mb-4">
                            <div className="space-y-2 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    {/* Icon with gradient background */}
                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${column.gradient} flex items-center justify-center flex-shrink-0`}>
                                        <IconComponent className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="font-bold text-base text-gray-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300 truncate">
                                        {column.title}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="px-2 py-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex-shrink-0">
                                        <p className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                                            {emailsInColumn.length} email{emailsInColumn.length !== 1 ? "s" : ""}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0">
                                <ColumnActions
                                    column={column}
                                    onEditColumn={onEditColumn}
                                    onDeleteColumn={onDeleteColumn}
                                />
                            </div>
                        </div>

                        <div className="space-y-3 min-h-[120px] mb-4 overflow-hidden">
                            {paginatedEmails.length > 0 ? (
                                paginatedEmails.map((email, index) => (
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
                                                <div className="w-full overflow-hidden">
                                                    <EmailCard email={email} index={index} />
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))
                            ) : (
                                <div className="h-20 border-2 border-dashed border-gray-300/60 rounded-xl flex items-center justify-center bg-gradient-to-br from-gray-50/50 to-gray-100/30 hover:from-blue-50/50 hover:to-purple-50/30 transition-all duration-300 group/drop">
                                    <div className="text-center space-y-1">
                                        <div className={`w-6 h-6 mx-auto rounded-full bg-gradient-to-r ${column.gradient} flex items-center justify-center transition-all duration-300`}>
                                            <IconComponent className="w-3 h-3 text-white" />
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium group-hover/drop:text-gray-700 transition-colors duration-300">
                                            Drop emails here
                                        </p>
                                    </div>
                                </div>
                            )}
                            {provided.placeholder}
                        </div>

                        {/* Pagination Controls - shown before Add Email button */}
                        {showPagination && (
                            <div className="flex items-center justify-between mb-3 px-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onPageChange(column.id, Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="h-8 w-8 p-0 rounded-full hover:bg-gray-200"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                        {currentPage} of {totalPages}
                                    </span>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onPageChange(column.id, Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="h-8 w-8 p-0 rounded-full hover:bg-gray-200"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}

                        {/* Add Email Button positioned at bottom center */}
                        <div className="absolute bottom-2 left-4 right-4">
                            <Button
                                variant="ghost"
                                className="w-full justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-200 transition-colors duration-200 rounded-xl py-2 px-3 bg-transparent"
                                onClick={() => setIsComposeOpen(true)}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Email
                            </Button>
                        </div>
                    </div>

                    {/* Compose Modal */}
                    <ComposeModal
                        isOpen={isComposeOpen}
                        onClose={() => setIsComposeOpen(false)}
                    />
                </div>
            )}
        </Droppable>
    );
};

export default EmailColumn;























































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