"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
import { Milestone, MilestoneFormData } from "@/lib/types/taskManager/types";
import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";

interface MilestoneFormProps {
  onSubmit: () => void;
  onCancel: () => void;
  milestoneToEdit?: Milestone; // Optional milestone for editing
}

const MilestoneForm: React.FC<MilestoneFormProps> = ({
  onSubmit,
  onCancel,
  milestoneToEdit,
}) => {
  const { projectId } = useProjectContext();
  const { useCreateMilestoneMutation, useUpdateMilestoneMutation } =
    useAuthAwareTaskManagerApi();

  // Initialize form state
  const [formData, setFormData] = useState<MilestoneFormData>({
    title: "",
    description: "",
    dueDate: new Date().toISOString().split("T")[0],
    status: "pending",
    projectId: projectId!,
  });

  // Set form data if editing an existing milestone
  useEffect(() => {
    if (milestoneToEdit) {
      setFormData({
        title: milestoneToEdit.title,
        description: milestoneToEdit.description,
        dueDate: milestoneToEdit.dueDate.split("T")[0],
        status: milestoneToEdit.status,
        projectId: projectId!,
      });
    }
  }, [milestoneToEdit]);

  // Mutations for creating/updating milestones
  const createMutation = useCreateMilestoneMutation();
  const updateMutation = useUpdateMilestoneMutation();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (status: string) => {
    setFormData((prev) => ({ ...prev, status }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (milestoneToEdit) {
      // Update existing milestone
      updateMutation.mutate(
        {
          projectId: projectId!,
          milestoneId: milestoneToEdit.id,
          updates: formData,
        },
        {
          onSuccess: () => {
            onSubmit();
          },
        }
      );
    } else {
      // Create new milestone
      createMutation.mutate(
        {
          projectId: projectId!,
          milestoneData: formData,
        },
        {
          onSuccess: () => {
            onSubmit();
          },
        }
      );
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="Milestone title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          placeholder="Describe what this milestone represents"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          value={formData.dueDate}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={handleStatusChange}>
          <SelectTrigger id="status">
            <SelectValue placeholder="Select a status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="on track">On Track</SelectItem>
            <SelectItem value="at risk">At Risk</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" className="bg-teal-600" disabled={isSubmitting}>
          {isSubmitting
            ? milestoneToEdit
              ? "Updating..."
              : "Creating..."
            : milestoneToEdit
              ? "Update Milestone"
              : "Create Milestone"}
        </Button>
      </div>
    </form>
  );
};

export default MilestoneForm;
