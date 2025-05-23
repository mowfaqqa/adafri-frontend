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
import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
import { toast } from "sonner";

interface EditColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column: Column;
  projectId?: string; // Add projectId as optional parameter
}

export const EditColumnDialog: React.FC<EditColumnDialogProps> = ({
  open,
  onOpenChange,
  column,
  projectId,
}) => {
  // Use column.name for project statuses, fallback to column.title for backwards compatibility
  const [title, setTitle] = useState(column.name || column.title);
  const [color, setColor] = useState(column.color || "#f3f4f6");

  const { useUpdateProjectStatusMutation } = useAuthAwareTaskManagerApi();
  const updateStatusMutation = useUpdateProjectStatusMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast("Please enter a status name.");
      return;
    }

    if (!projectId) {
      toast("Project ID is missing");
      return;
    }

    // Only allow editing of custom columns, not default ones
    if (["todo", "inProgress", "done"].includes(column.id)) {
      toast("Default statuses cannot be edited.");
      onOpenChange(false);
      return;
    }

    updateStatusMutation.mutate(
      {
        projectId,
        statusId: column.id,
        updates: {
          name: title,
          color,
        },
      },
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
          <DialogTitle>Edit Status</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="column-title">Status Name</Label>
              <Input
                id="column-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter status name"
                disabled={["todo", "inProgress", "done"].includes(column.id)}
              />
              {["todo", "inProgress", "done"].includes(column.id) && (
                <p className="text-xs text-amber-500">
                  Default statuses cannot be renamed.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="column-color">Status Color</Label>
              <div className="flex gap-2">
                <Input
                  id="column-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-10 p-1"
                  disabled={["todo", "inProgress", "done"].includes(column.id)}
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#RRGGBB"
                  disabled={["todo", "inProgress", "done"].includes(column.id)}
                />
              </div>
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
                updateStatusMutation.isPending ||
                ["todo", "inProgress", "done"].includes(column.id) ||
                !projectId
              }
            >
              {updateStatusMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
