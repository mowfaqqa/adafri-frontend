"use client";

import React, { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Column } from "@/lib/types/taskManager/types";
import { DeleteColumnDialog } from "../modals/DeleteColumnDialog";
import { toast } from "@/hooks/use-toast";
import { useTaskManagerApi } from "@/lib/hooks/useTaskmanagerApi";
import { EditColumnDialog } from "../modals/EditColumnDialog";

interface ColumnActionButtonsProps {
  column: Column;
  onAddTask?: () => void;
}

export const ColumnActionButtons: React.FC<ColumnActionButtonsProps> = ({
  column,
  onAddTask,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { useDeleteColumnMutation } = useTaskManagerApi();
  const deleteColumnMutation = useDeleteColumnMutation();

  const handleDelete = () => {
    // Only allow deletion of custom columns, not default ones
    if (["todo", "inProgress", "done"].includes(column.id)) {
      toast({
        title: "Cannot delete default column",
        description: "Default columns cannot be deleted.",
        variant: "destructive",
      });
      setShowDeleteDialog(false);
      return;
    }

    deleteColumnMutation.mutate(column.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
      },
    });
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {onAddTask && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onAddTask}
            title="Add Task"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setShowEditDialog(true)}
          title="Edit Column"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
          onClick={() => setShowDeleteDialog(true)}
          title="Delete Column"
          disabled={
            ["todo", "inProgress", "done"].includes(column.id) ||
            deleteColumnMutation.isPending
          }
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <DeleteColumnDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        column={column}
        onConfirm={handleDelete}
      />

      <EditColumnDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        column={column}
      />
    </>
  );
};
