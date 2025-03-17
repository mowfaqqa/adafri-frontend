/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Column } from "@/lib/types/taskManager/types";
import { DeleteColumnDialog } from "../modals/DeleteColumnDialog";
import { useTaskManagerApi } from "@/lib/hooks/useTaskmanagerApi";
import { EditColumnDialog } from "../modals/EditColumnDialog";
import { toast } from "sonner";

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
    if (["todo", "in progress", "done"].includes(column.title.toLowerCase())) {
      toast( "Default columns cannot be deleted.");
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
        <Button
          size="icon"
          className="h-6 w-6 rounded-full group-hover:opacity-100 transition-opacity"
          onClick={() => setShowEditDialog(true)}
          title="Edit Column"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          className="h-6 w-6 rounded-full group-hover:opacity-100 transition-opacity hover:text-red-500"
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
