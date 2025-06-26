import { EmailColumn as EmailColumnType, Email, PaginationState } from "@/lib/types/email2";
import EmailColumn from "./EmailColumn";
import AddColumnDialog from "./AddColumnDialog";
import { toast } from "sonner";

interface EmailBoardProps {
  columns: EmailColumnType[];
  emails: Email[];
  pagination: PaginationState;
  itemsPerPage: number;
  onEditColumn: (column: EmailColumnType) => void;
  onDeleteColumn: (column: EmailColumnType) => void;
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
  
  // Default email move handler if not provided
  const handleEmailMove = (emailId: string, targetColumnId: string) => {
    if (onEmailMove) {
      onEmailMove(emailId, targetColumnId);
    } else {
      // Fallback behavior - just show success message
      const targetColumn = columns.find(col => col.id === targetColumnId);
      toast.success(`Email moved to ${targetColumn?.title || targetColumnId}`);
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