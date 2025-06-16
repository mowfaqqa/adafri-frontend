"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ProjectFormData,
  ProjectVisibility,
} from "@/lib/types/taskManager/types";
import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface NewProjectFormProps {
  onSuccess?: (projectId: string) => void;
}

const NewProjectForm: React.FC<NewProjectFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0], // Today in YYYY-MM-DD
    endDate: "",
    visibility: "private",
  });

  const { useCreateProjectMutation } = useAuthAwareTaskManagerApi();
  const createProjectMutation = useCreateProjectMutation();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVisibilityChange = (value: ProjectVisibility) => {
    setFormData((prev) => ({ ...prev, visibility: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createProjectMutation.mutate(formData, {
      onSuccess: (data) => {
        if (onSuccess && data) {
          onSuccess(data.id);
        }
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name*</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Enter project name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
          placeholder="Enter project description"
          className="min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date*</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
            required
            // className="[&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:mr-2"
            // style={{ direction: 'rtl', textAlign: 'left' }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date (Optional)</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            value={formData.endDate || ""}
            onChange={handleChange}
            min={formData.startDate} // Ensure end date is after start date
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Project Visibility</Label>
        <RadioGroup
          value={formData.visibility}
          onValueChange={(value) =>
            handleVisibilityChange(value as ProjectVisibility)
          }
          className="flex flex-col space-y-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="private" id="private" />
            <Label htmlFor="private" className="text-gray-600 font-normal">Private (Only members can access)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="team" id="team" />
            <Label htmlFor="team" className="text-gray-600 font-normal">Team (Available to all team members)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="public" id="public" />
            <Label htmlFor="public" className="text-gray-600 font-normal">Public (Anyone can access)</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          className="bg-teal-600"
          disabled={createProjectMutation.isPending}
        >
          {createProjectMutation.isPending ? "Creating..." : "Create Project"}
        </Button>
      </div>
    </form>
  );
};
export default NewProjectForm;
