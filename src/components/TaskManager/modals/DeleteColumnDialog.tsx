"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Column } from "@/lib/types/taskManager/types";

interface DeleteColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column: Column;
  projectId?: string; // Add projectId as optional parameter
  onConfirm: () => void;
}

export const DeleteColumnDialog: React.FC<DeleteColumnDialogProps> = ({
  open,
  onOpenChange,
  column,
  projectId,
  onConfirm,
}) => {
  // Use column.name for project statuses, fallback to column.title for backwards compatibility
  const columnName = column.name || column.title;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Status</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the status &quot;{columnName}&quot; and
            may affect tasks currently assigned to this status. Are you sure you
            want to continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
