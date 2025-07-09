// 1. EmailBoard.tsx - Fixed version
import { EmailColumn as EmailColumnType, Email, PaginationState } from "@/lib/types/email";
import EmailColumn from "./EmailColumn";
import AddColumnDialog from "./AddColumnDialog";
import { toast } from "sonner";
import { useEmailStore } from "@/store/email-store";

interface EmailBoardProps {
  columns: EmailColumnType[];
  emails: Email[];
  pagination: PaginationState;
  itemsPerPage: number;
  onEditColumn: (column: EmailColumnType) => void;
  onDeleteColumn: (column: EmailColumnType) => void;
  onUpdateColumnIcon: (columnId: string, icon: string) => void;
  onPageChange: (columnId: string, page: number) => void;
  onAddColumn: (column: Omit<EmailColumnType, 'id'> & { id?: string }) => void;
  showNewColumnDialog: boolean;
  onNewColumnDialogChange: (open: boolean) => void;
  editingColumnId: string | null;
  editingColumnName: string;
  onStartEdit: (column: EmailColumnType) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditNameChange: (name: string) => void;
  onEmailMove?: (emailId: string, targetColumnId: string) => void;
}

const EmailBoard: React.FC<EmailBoardProps> = ({
  columns,
  emails,
  pagination,
  itemsPerPage,
  onEditColumn,
  onDeleteColumn,
  onUpdateColumnIcon,
  onPageChange,
  onAddColumn,
  showNewColumnDialog,
  onNewColumnDialogChange,
  editingColumnId,
  editingColumnName,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditNameChange,
  onEmailMove
}) => {
  
  // Get email store methods for proper state management
  const { moveEmail, updateEmailStatus } = useEmailStore();
  
  // Enhanced email move handler that updates email status properly
  const handleEmailMove = (emailId: string, targetColumnId: string) => {
    console.log(`EmailBoard: Moving email ${emailId} to column ${targetColumnId}`);
    
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
      
      // Call parent handler first if provided (for any additional logic)
      if (onEmailMove) {
        onEmailMove(emailId, targetColumnId);
      }
      
      // Update email status using store methods
      if (moveEmail) {
        moveEmail(emailId, targetColumnId as any);
      } else if (updateEmailStatus) {
        updateEmailStatus(emailId, targetColumnId);
      } else {
        // Fallback: manually update the email object
        const updatedEmail = { ...emailToMove, status: targetColumnId };
        console.log('Fallback: manually updating email status', updatedEmail);
      }
      
      // Show success message
      const targetColumn = columns.find(col => col.id === targetColumnId);
      toast.success(`Email moved to ${targetColumn?.title || targetColumnId}`);
      
      console.log(`Successfully moved email ${emailId} to ${targetColumnId}`);
      
    } catch (error) {
      console.error('Error moving email in EmailBoard:', error);
      toast.error('Failed to move email');
    }
  };

  return (
    <div className="custom-scrollbar-container flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto pb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
      {columns.map((column: EmailColumnType, index: number) => (
        <div
          key={column?.id}
          style={{
            animationDelay: `${index * 150}ms`,
            animation: 'slideInFromBottom 0.6s ease-out forwards'
          }}
        >
          <EmailColumn 
            column={column} 
            emails={emails}
            onEditColumn={onEditColumn}
            onDeleteColumn={onDeleteColumn}
            onUpdateColumnIcon={onUpdateColumnIcon}
            currentPage={pagination[column.id]?.currentPage || 1}
            onPageChange={onPageChange}
            itemsPerPage={itemsPerPage}
            editingColumnId={editingColumnId}
            editingColumnName={editingColumnName}
            onStartEdit={onStartEdit}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            onEditNameChange={onEditNameChange}
            onEmailMove={handleEmailMove}
          />
        </div>
      ))}

      {/* Add New Column Dialog */}
      <AddColumnDialog
        open={showNewColumnDialog}
        onOpenChange={onNewColumnDialogChange}
        onAddColumn={onAddColumn}
        existingColumns={columns}
      />

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(40px);  
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .custom-scrollbar-container {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
        }
        
        .custom-scrollbar-container::-webkit-scrollbar {
          height: 6px;
        }
        
        @media (min-width: 640px) {
          .custom-scrollbar-container::-webkit-scrollbar {
            height: 8px;
          }
        }
        
        .custom-scrollbar-container::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 4px;
        }
        
        .custom-scrollbar-container::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 4px;
          opacity: 0.7;
        }
        
        .custom-scrollbar-container::-webkit-scrollbar-thumb:hover {
          background-color: #9ca3af;
        }
        
        .custom-scrollbar-container::-webkit-scrollbar-corner {
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default EmailBoard;












































// 1:38
// import { EmailColumn as EmailColumnType, Email, PaginationState } from "@/lib/types/email2";
// import EmailColumn from "./EmailColumn";
// import AddColumnDialog from "./AddColumnDialog";
// import { toast } from "sonner";

// interface EmailBoardProps {
//   columns: EmailColumnType[];
//   emails: Email[];
//   pagination: PaginationState;
//   itemsPerPage: number;
//   onEditColumn: (column: EmailColumnType) => void;
//   onDeleteColumn: (column: EmailColumnType) => void;
//   onUpdateColumnIcon: (columnId: string, icon: string) => void;
//   onPageChange: (columnId: string, page: number) => void;
//   onAddColumn: (column: Omit<EmailColumnType, 'id'> & { id?: string }) => void;
//   showNewColumnDialog: boolean;
//   onNewColumnDialogChange: (open: boolean) => void;
//   editingColumnId: string | null;
//   editingColumnName: string;
//   onStartEdit: (column: EmailColumnType) => void;
//   onSaveEdit: () => void;
//   onCancelEdit: () => void;
//   onEditNameChange: (name: string) => void;
//   onEmailMove?: (emailId: string, targetColumnId: string) => void;
// }

// const EmailBoard: React.FC<EmailBoardProps> = ({
//   columns,
//   emails,
//   pagination,
//   itemsPerPage,
//   onEditColumn,
//   onDeleteColumn,
//   onUpdateColumnIcon,
//   onPageChange,
//   onAddColumn,
//   showNewColumnDialog,
//   onNewColumnDialogChange,
//   editingColumnId,
//   editingColumnName,
//   onStartEdit,
//   onSaveEdit,
//   onCancelEdit,
//   onEditNameChange,
//   onEmailMove
// }) => {
  
//   // Default email move handler if not provided
//   const handleEmailMove = (emailId: string, targetColumnId: string) => {
//     if (onEmailMove) {
//       onEmailMove(emailId, targetColumnId);
//     } else {
//       // Fallback behavior - just show success message
//       const targetColumn = columns.find(col => col.id === targetColumnId);
//       toast.success(`Email moved to ${targetColumn?.title || targetColumnId}`);
//     }
//   };

//   return (
//     <div className="custom-scrollbar-container flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto pb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
//       {columns.map((column: EmailColumnType, index: number) => (
//         <div
//           key={column?.id}
//           style={{
//             animationDelay: `${index * 150}ms`,
//             animation: 'slideInFromBottom 0.6s ease-out forwards'
//           }}
//         >
//           <EmailColumn 
//             column={column} 
//             emails={emails}
//             onEditColumn={onEditColumn}
//             onDeleteColumn={onDeleteColumn}
//             onUpdateColumnIcon={onUpdateColumnIcon}
//             currentPage={pagination[column.id]?.currentPage || 1}
//             onPageChange={onPageChange}
//             itemsPerPage={itemsPerPage}
//             editingColumnId={editingColumnId}
//             editingColumnName={editingColumnName}
//             onStartEdit={onStartEdit}
//             onSaveEdit={onSaveEdit}
//             onCancelEdit={onCancelEdit}
//             onEditNameChange={onEditNameChange}
//             onEmailMove={handleEmailMove}
//           />
//         </div>
//       ))}

//       {/* Add New Column Dialog */}
//       <AddColumnDialog
//         open={showNewColumnDialog}
//         onOpenChange={onNewColumnDialogChange}
//         onAddColumn={onAddColumn}
//         existingColumns={columns}
//       />

//       {/* Custom Styles */}
//       <style jsx>{`
//         @keyframes slideInFromBottom {
//           from {
//             opacity: 0;
//             transform: translateY(40px);  
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
        
//         .custom-scrollbar-container {
//           scrollbar-width: thin;
//           scrollbar-color: #d1d5db transparent;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar {
//           height: 6px;
//         }
        
//         @media (min-width: 640px) {
//           .custom-scrollbar-container::-webkit-scrollbar {
//             height: 8px;
//           }
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-track {
//           background: transparent;
//           border-radius: 4px;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-thumb {
//           background-color: #d1d5db;
//           border-radius: 4px;
//           opacity: 0.7;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-thumb:hover {
//           background-color: #9ca3af;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-corner {
//           background: transparent;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default EmailBoard;













































































// 28/6/2025 2:32
// import { EmailColumn as EmailColumnType, Email, PaginationState } from "@/lib/types/email2";
// import EmailColumn from "./EmailColumn";
// import AddColumnDialog from "./AddColumnDialog";
// import { toast } from "sonner";

// interface EmailBoardProps {
//   columns: EmailColumnType[];
//   emails: Email[];
//   pagination: PaginationState;
//   itemsPerPage: number;
//   onEditColumn: (column: EmailColumnType) => void;
//   onDeleteColumn: (column: EmailColumnType) => void;
//   onPageChange: (columnId: string, page: number) => void;
//   onAddColumn: (column: Omit<EmailColumnType, 'id'> & { id?: string }) => void;
//   showNewColumnDialog: boolean;
//   onNewColumnDialogChange: (open: boolean) => void;
//   editingColumnId: string | null;
//   editingColumnName: string;
//   onStartEdit: (column: EmailColumnType) => void;
//   onSaveEdit: () => void;
//   onCancelEdit: () => void;
//   onEditNameChange: (name: string) => void;
//   onEmailMove?: (emailId: string, targetColumnId: string) => void;
// }

// const EmailBoard: React.FC<EmailBoardProps> = ({
//   columns,
//   emails,
//   pagination,
//   itemsPerPage,
//   onEditColumn,
//   onDeleteColumn,
//   onPageChange,
//   onAddColumn,
//   showNewColumnDialog,
//   onNewColumnDialogChange,
//   editingColumnId,
//   editingColumnName,
//   onStartEdit,
//   onSaveEdit,
//   onCancelEdit,
//   onEditNameChange,
//   onEmailMove
// }) => {
  
//   // Default email move handler if not provided
//   const handleEmailMove = (emailId: string, targetColumnId: string) => {
//     if (onEmailMove) {
//       onEmailMove(emailId, targetColumnId);
//     } else {
//       // Fallback behavior - just show success message
//       const targetColumn = columns.find(col => col.id === targetColumnId);
//       toast.success(`Email moved to ${targetColumn?.title || targetColumnId}`);
//     }
//   };

//   return (
//     <div className="custom-scrollbar-container flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto pb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
//       {columns.map((column: EmailColumnType, index: number) => (
//         <div
//           key={column?.id}
//           style={{
//             animationDelay: `${index * 150}ms`,
//             animation: 'slideInFromBottom 0.6s ease-out forwards'
//           }}
//         >
//           <EmailColumn 
//             column={column} 
//             emails={emails}
//             onEditColumn={onEditColumn}
//             onDeleteColumn={onDeleteColumn}
//             currentPage={pagination[column.id]?.currentPage || 1}
//             onPageChange={onPageChange}
//             itemsPerPage={itemsPerPage}
//             editingColumnId={editingColumnId}
//             editingColumnName={editingColumnName}
//             onStartEdit={onStartEdit}
//             onSaveEdit={onSaveEdit}
//             onCancelEdit={onCancelEdit}
//             onEditNameChange={onEditNameChange}
//             onEmailMove={handleEmailMove}
//           />
//         </div>
//       ))}

//       {/* Add New Column Dialog */}
//       <AddColumnDialog
//         open={showNewColumnDialog}
//         onOpenChange={onNewColumnDialogChange}
//         onAddColumn={onAddColumn}
//         existingColumns={columns}
//       />

//       {/* Custom Styles */}
//       <style jsx>{`
//         @keyframes slideInFromBottom {
//           from {
//             opacity: 0;
//             transform: translateY(40px);  
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
        
//         .custom-scrollbar-container {
//           scrollbar-width: thin;
//           scrollbar-color: #d1d5db transparent;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar {
//           height: 6px;
//         }
        
//         @media (min-width: 640px) {
//           .custom-scrollbar-container::-webkit-scrollbar {
//             height: 8px;
//           }
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-track {
//           background: transparent;
//           border-radius: 4px;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-thumb {
//           background-color: #d1d5db;
//           border-radius: 4px;
//           opacity: 0.7;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-thumb:hover {
//           background-color: #9ca3af;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-corner {
//           background: transparent;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default EmailBoard;



























































































// latest working
// import { EmailColumn as EmailColumnType, Email, PaginationState } from "@/lib/types/email2";
// import EmailColumn from "./EmailColumn";
// import AddColumnDialog from "./AddColumnDialog";

// interface EmailBoardProps {
//   columns: EmailColumnType[];
//   emails: Email[];
//   pagination: PaginationState;
//   itemsPerPage: number;
//   onEditColumn: (column: EmailColumnType) => void;
//   onDeleteColumn: (column: EmailColumnType) => void;
//   onPageChange: (columnId: string, page: number) => void;
//   onAddColumn: (column: Omit<EmailColumnType, 'id'> & { id?: string }) => void;
//   showNewColumnDialog: boolean;
//   onNewColumnDialogChange: (open: boolean) => void;
//   editingColumnId: string | null;
//   editingColumnName: string;
//   onStartEdit: (column: EmailColumnType) => void;
//   onSaveEdit: () => void;
//   onCancelEdit: () => void;
//   onEditNameChange: (name: string) => void;
// }

// const EmailBoard: React.FC<EmailBoardProps> = ({
//   columns,
//   emails,
//   pagination,
//   itemsPerPage,
//   onEditColumn,
//   onDeleteColumn,
//   onPageChange,
//   onAddColumn,
//   showNewColumnDialog,
//   onNewColumnDialogChange,
//   editingColumnId,
//   editingColumnName,
//   onStartEdit,
//   onSaveEdit,
//   onCancelEdit,
//   onEditNameChange
// }) => {
//   return (
//     <div className="custom-scrollbar-container flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto pb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
//       {columns.map((column: EmailColumnType, index: number) => (
//         <div
//           key={column?.id}
//           style={{
//             animationDelay: `${index * 150}ms`,
//             animation: 'slideInFromBottom 0.6s ease-out forwards'
//           }}
//         >
//           <EmailColumn 
//             column={column} 
//             emails={emails}
//             onEditColumn={onEditColumn}
//             onDeleteColumn={onDeleteColumn}
//             currentPage={pagination[column.id]?.currentPage || 1}
//             onPageChange={onPageChange}
//             itemsPerPage={itemsPerPage}
//             editingColumnId={editingColumnId}
//             editingColumnName={editingColumnName}
//             onStartEdit={onStartEdit}
//             onSaveEdit={onSaveEdit}
//             onCancelEdit={onCancelEdit}
//             onEditNameChange={onEditNameChange}
//           />
//         </div>
//       ))}

//       {/* Add New Column Dialog */}
//       <AddColumnDialog
//         open={showNewColumnDialog}
//         onOpenChange={onNewColumnDialogChange}
//         onAddColumn={onAddColumn}
//         existingColumns={columns}
//       />

//       {/* Custom Styles */}
//       <style jsx>{`
//         @keyframes slideInFromBottom {
//           from {
//             opacity: 0;
//             transform: translateY(40px);  
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
        
//         .custom-scrollbar-container {
//           scrollbar-width: thin;
//           scrollbar-color: #d1d5db transparent;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar {
//           height: 6px;
//         }
        
//         @media (min-width: 640px) {
//           .custom-scrollbar-container::-webkit-scrollbar {
//             height: 8px;
//           }
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-track {
//           background: transparent;
//           border-radius: 4px;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-thumb {
//           background-color: #d1d5db;
//           border-radius: 4px;
//           opacity: 0.7;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-thumb:hover {
//           background-color: #9ca3af;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-corner {
//           background: transparent;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default EmailBoard;










































// Daniel UI
// import { EmailColumn as EmailColumnType, Email, PaginationState } from "@/lib/types/email2";
// import EmailColumn from "./EmailColumn";
// import AddColumnDialog from "./AddColumnDialog";

// interface EmailBoardProps {
//   columns: EmailColumnType[];
//   emails: Email[];
//   pagination: PaginationState;
//   itemsPerPage: number;
//   onEditColumn: (column: EmailColumnType) => void;
//   onDeleteColumn: (column: EmailColumnType) => void;
//   onPageChange: (columnId: string, page: number) => void;
//   onAddColumn: (column: Omit<EmailColumnType, 'id'> & { id?: string }) => void;
//   showNewColumnDialog: boolean;
//   onNewColumnDialogChange: (open: boolean) => void;
// }

// const EmailBoard: React.FC<EmailBoardProps> = ({
//   columns,
//   emails,
//   pagination,
//   itemsPerPage,
//   onEditColumn,
//   onDeleteColumn,
//   onPageChange,
//   onAddColumn,
//   showNewColumnDialog,
//   onNewColumnDialogChange
// }) => {
//   return (
//     <div className="custom-scrollbar-container flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto pb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
//       {columns.map((column: EmailColumnType, index: number) => (
//         <div
//           key={column?.id}
//           style={{
//             animationDelay: `${index * 150}ms`,
//             animation: 'slideInFromBottom 0.6s ease-out forwards'
//           }}
//         >
//           <EmailColumn 
//             column={column} 
//             emails={emails}
//             onEditColumn={onEditColumn}
//             onDeleteColumn={onDeleteColumn}
//             currentPage={pagination[column.id]?.currentPage || 1}
//             onPageChange={onPageChange}
//             itemsPerPage={itemsPerPage}
//           />
//         </div>
//       ))}

//       {/* Add New Column Dialog */}
//       <AddColumnDialog
//         open={showNewColumnDialog}
//         onOpenChange={onNewColumnDialogChange}
//         onAddColumn={onAddColumn}
//         existingColumns={columns}
//       />

//       {/* Custom Styles */}
//       <style jsx>{`
//         @keyframes slideInFromBottom {
//           from {
//             opacity: 0;
//             transform: translateY(40px);  
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
        
//         .custom-scrollbar-container {
//           scrollbar-width: thin;
//           scrollbar-color: #d1d5db transparent;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar {
//           height: 6px;
//         }
        
//         @media (min-width: 640px) {
//           .custom-scrollbar-container::-webkit-scrollbar {
//             height: 8px;
//           }
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-track {
//           background: transparent;
//           border-radius: 4px;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-thumb {
//           background-color: #d1d5db;
//           border-radius: 4px;
//           opacity: 0.7;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-thumb:hover {
//           background-color: #9ca3af;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-corner {
//           background: transparent;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default EmailBoard;