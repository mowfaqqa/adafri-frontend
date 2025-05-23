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
import { Epic, EpicFormData } from "@/lib/types/taskManager/types";
import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";
import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";

interface EpicFormProps {
  onSubmit: () => void;
  onCancel: () => void;
  epicToEdit?: Epic; // Optional epic for editing
}

const EpicForm: React.FC<EpicFormProps> = ({
  onSubmit,
  onCancel,
  epicToEdit,
}) => {
  const { projectId } = useProjectContext();
  const { useCreateEpicMutation, useUpdateEpicMutation } = useAuthAwareTaskManagerApi();

  // Initialize form state
  const [formData, setFormData] = useState<EpicFormData>({
    title: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    status: "planning",
    projectId: projectId!,
  });

  // Set form data if editing an existing epic
  useEffect(() => {
    if (epicToEdit) {
      setFormData({
        title: epicToEdit.title,
        description: epicToEdit.description,
        startDate: epicToEdit.startDate.split("T")[0],
        endDate: epicToEdit.endDate ? epicToEdit.endDate.split("T")[0] : "",
        status: epicToEdit.status,
        projectId: projectId!,
      });
    }
  }, [epicToEdit]);

  // Mutations for creating/updating epics
  const createMutation = useCreateEpicMutation();
  const updateMutation = useUpdateEpicMutation();

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

    if (epicToEdit) {
      // Update existing epic
      updateMutation.mutate(
        {
          projectId: projectId!,
          epicId: epicToEdit.id,
          updates: formData,
        },
        {
          onSuccess: () => {
            onSubmit();
          },
        }
      );
    } else {
      // Create new epic
      createMutation.mutate(
        {
          projectId: projectId!,
          epicData: formData,
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
          placeholder="Epic title"
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
          placeholder="Describe this epic and its objectives"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date (Optional)</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={handleStatusChange}>
          <SelectTrigger id="status">
            <SelectValue placeholder="Select a status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="review">Review</SelectItem>
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
            ? epicToEdit
              ? "Updating..."
              : "Creating..."
            : epicToEdit
            ? "Update Epic"
            : "Create Epic"}
        </Button>
      </div>
    </form>
  );
};

export default EpicForm;
