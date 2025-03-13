"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Column } from "@/lib/types/taskManager/types";
import { toast } from "@/hooks/use-toast";
import { useTaskManagerApi } from "@/lib/hooks/useTaskmanagerApi";

interface EditColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column: Column;
}

export const EditColumnDialog: React.FC<EditColumnDialogProps> = ({
  open,
  onOpenChange,
  column,
}) => {
  const [title, setTitle] = useState(column.title);

  const { useUpdateColumnMutation } = useTaskManagerApi();
  const updateColumnMutation = useUpdateColumnMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a column title.",
        variant: "destructive",
      });
      return;
    }

    // Only allow editing of custom columns, not default ones
    if (["todo", "inProgress", "done"].includes(column.id)) {
      toast({
        title: "Cannot edit default column",
        description: "Default columns cannot be edited.",
        variant: "destructive",
      });
      onOpenChange(false);
      return;
    }

    updateColumnMutation.mutate(
      { id: column.id, title },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Column</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="column-title">Column Title</Label>
              <Input
                id="column-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter column title"
                disabled={["todo", "inProgress", "done"].includes(column.id)}
              />
              {["todo", "inProgress", "done"].includes(column.id) && (
                <p className="text-xs text-amber-500">
                  Default columns cannot be renamed.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                updateColumnMutation.isPending ||
                ["todo", "inProgress", "done"].includes(column.id)
              }
            >
              {updateColumnMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
