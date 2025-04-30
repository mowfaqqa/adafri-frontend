
import React, { useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Task } from "@/lib/types/taskManager/types";
import { DeleteConfirmationDialog } from "../modals/DeleteConfirmationDialog";
import { useTaskManagerApi } from "@/lib/hooks/useTaskmanagerApi";
import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";

interface TaskActionButtonsProps {
  task: Task;
  projectId?: string; // Allow passing projectId directly
  onView: () => void;
  onEdit: () => void;
  variant?: "card" | "modal";
}

export const TaskActionButtons: React.FC<TaskActionButtonsProps> = ({
  task,
  projectId: propProjectId, // Project ID from props
  onView,
  onEdit,
  variant = "card",
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { projectId: contextProjectId } = useProjectContext(); // Get project ID from context as fallback
  const { useDeleteTaskMutation } = useTaskManagerApi();
  const deleteTaskMutation = useDeleteTaskMutation();

  // Use provided projectId or fall back to context
  const projectId = propProjectId || contextProjectId || "";

  const handleDelete = () => {
    if (!projectId) {
      console.error("Project ID is missing");
      return;
    }

    deleteTaskMutation.mutate(
      {
        projectId,
        taskId: task.id as string,
      },
      {
        onSuccess: () => {
          setShowDeleteDialog(false);
        },
      }
    );
  };

  // Different styles based on where the buttons are rendered
  const buttonClasses =
    variant === "card"
      ? "h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
      : "h-9 px-3";

  const iconClasses = variant === "card" ? "h-4 w-4" : "h-4 w-4 mr-2";

  return (
    <>
      <div className="flex items-center gap-2">
        {variant === "card" ? (
          // Card variant - icon only buttons
          <>
            <Button
              variant="ghost"
              size="sm"
              className={buttonClasses}
              onClick={onView}
              title="View Details"
            >
              <Eye className={iconClasses} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={buttonClasses}
              onClick={onEdit}
              title="Edit Task"
            >
              <Pencil className={iconClasses} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`${buttonClasses} hover:text-red-500`}
              onClick={() => setShowDeleteDialog(true)}
              title="Delete Task"
              disabled={deleteTaskMutation.isPending || !projectId}
            >
              <Trash2 className={iconClasses} />
            </Button>
          </>
        ) : (
          // Modal variant - buttons with text
          <>
            <Button
              variant="outline"
              size="sm"
              className={buttonClasses}
              onClick={onEdit}
            >
              <Pencil className={iconClasses} />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`${buttonClasses} hover:text-red-500 hover:border-red-500`}
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleteTaskMutation.isPending || !projectId}
            >
              <Trash2 className={iconClasses} />
              {deleteTaskMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </>
        )}
      </div>

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        task={task}
        projectId={projectId}
        onConfirm={handleDelete}
      />
    </>
  );
};
