"use client";

import React, { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Column } from "@/lib/types/taskManager/types";
import { DeleteColumnDialog } from "../modals/DeleteColumnDialog";
import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
import { EditColumnDialog } from "../modals/EditColumnDialog";
import { toast } from "sonner";
import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";

interface ColumnActionButtonsProps {
  column: Column;
  projectId?: string; // Allow passing projectId directly
  onAddTask?: () => void;
}

export const ColumnActionButtons: React.FC<ColumnActionButtonsProps> = ({
  column,
  projectId: propProjectId,
  onAddTask,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { projectId: contextProjectId } = useProjectContext(); // Get from context as fallback

  // Use provided projectId or fall back to context
  const projectId = propProjectId || contextProjectId || "";

  const { useDeleteProjectStatusMutation } = useAuthAwareTaskManagerApi();
  const deleteStatusMutation = useDeleteProjectStatusMutation();

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleDelete = () => {
    // Only allow deletion of custom statuses, not default ones
    if (["todo", "in progress", "done"].includes(column.name?.toLowerCase() || "")) {
      toast("Default statuses cannot be deleted.");
      return;
    }
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!projectId) {
      toast("Project ID is missing");
      return;
    }

    deleteStatusMutation.mutate(
      {
        projectId,
        statusId: column.id,
      },
      {
        onSuccess: () => {
          setShowDeleteDialog(false);
        },
      }
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 rounded-full hover:bg-gray-200 transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={handleEdit}>
            Edit Status
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleDelete}
            disabled={["todo", "in progress", "done"].includes(column.name?.toLowerCase() || "")}
            className="text-red-600 focus:text-red-600"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteColumnDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        column={column}
        projectId={projectId}
        onConfirm={confirmDelete}
      />

      <EditColumnDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        column={column}
        projectId={projectId}
      />
    </>
  );
};










































// Muwa Code
// "use client";

// import React, { useState } from "react";
// import { Pencil, Trash2 } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Column } from "@/lib/types/taskManager/types";
// import { DeleteColumnDialog } from "../modals/DeleteColumnDialog";
// import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
// import { EditColumnDialog } from "../modals/EditColumnDialog";
// import { toast } from "sonner";
// import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";

// interface ColumnActionButtonsProps {
//   column: Column;
//   projectId?: string; // Allow passing projectId directly
//   onAddTask?: () => void;
// }

// export const ColumnActionButtons: React.FC<ColumnActionButtonsProps> = ({
//   column,
//   projectId: propProjectId,
//   onAddTask,
// }) => {
//   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
//   const [showEditDialog, setShowEditDialog] = useState(false);
//   const { projectId: contextProjectId } = useProjectContext(); // Get from context as fallback

//   // Use provided projectId or fall back to context
//   const projectId = propProjectId || contextProjectId || "";

//   const { useDeleteProjectStatusMutation, useUpdateProjectStatusMutation } =
//     useAuthAwareTaskManagerApi();
//   const deleteStatusMutation = useDeleteProjectStatusMutation();

//   const handleDelete = () => {
//     if (!projectId) {
//       toast("Project ID is missing");
//       return;
//     }

//     // Only allow deletion of custom statuses, not default ones
//     if (
//       ["todo", "in progress", "done"].includes(column.name?.toLowerCase() || "")
//     ) {
//       toast("Default statuses cannot be deleted.");
//       setShowDeleteDialog(false);
//       return;
//     }

//     deleteStatusMutation.mutate(
//       {
//         projectId,
//         statusId: column.id,
//       },
//       {
//         onSuccess: () => {
//           setShowDeleteDialog(false);
//         },
//       }
//     );
//   };

//   return (
//     <>
//       <div className="flex items-center gap-1">
//         <Button
//           size="icon"
//           className="h-6 w-6 rounded-full group-hover:opacity-100 transition-opacity"
//           onClick={() => setShowEditDialog(true)}
//           title="Edit Status"
//         >
//           <Pencil className="h-4 w-4" />
//         </Button>
//         <Button
//           size="icon"
//           className="h-6 w-6 rounded-full group-hover:opacity-100 transition-opacity hover:text-red-500"
//           onClick={() => setShowDeleteDialog(true)}
//           title="Delete Status"
//           disabled={
//             // Disable for default statuses or if we're currently deleting
//             ["todo", "inProgress", "done"].includes(column.id) ||
//             deleteStatusMutation.isPending ||
//             !projectId
//           }
//         >
//           <Trash2 className="h-4 w-4" />
//         </Button>
//       </div>

//       <DeleteColumnDialog
//         open={showDeleteDialog}
//         onOpenChange={setShowDeleteDialog}
//         column={column}
//         projectId={projectId}
//         onConfirm={handleDelete}
//       />

//       <EditColumnDialog
//         open={showEditDialog}
//         onOpenChange={setShowEditDialog}
//         column={column}
//         projectId={projectId}
//       />
//     </>
//   );
// };
