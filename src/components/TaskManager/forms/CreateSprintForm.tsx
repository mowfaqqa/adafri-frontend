import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  PenSquare,
  Calendar,
  Plus,
  AlertTriangle,
  Paperclip,
  ListChecks,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SprintTaskFormData } from "@/lib/types/taskManager/types";
import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";

interface CreateSprintFormProps {
  onSubmit: (data: SprintTaskFormData) => void;
  isSubmitting: boolean;
  projectId: string;
}

const CreateSprintForm: React.FC<CreateSprintFormProps> = ({
  onSubmit,
  isSubmitting,
  projectId,
}) => {
  const { currentProject } = useProjectContext();
  const { useEpicsQuery, useMilestonesQuery, useProjectStatusesQuery } =
    useAuthAwareTaskManagerApi();

  // Fetch epics, milestones, and statuses for the current project
  const { data: epics = [] } = useEpicsQuery(projectId);
  const { data: milestones = [] } = useMilestonesQuery(projectId);
  const { data: statuses = [] } = useProjectStatusesQuery(projectId);

  const [formData, setFormData] = useState<SprintTaskFormData>({
    title: "",
    description: "",
    status: statuses.length > 0 ? statuses[0].name : "todo",
    date: new Date().toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    tags: "",
    assignees: [],
    category: "sprints",
    progress: 0,
    storyPoints: 0,
    sprint: "Sprint 1",
    projectId: projectId,
    epicId: "", // Will be populated when user selects an epic
    milestoneId: "", // Optional - will be populated if user selects a milestone
  });

  const [priority, setPriority] = useState<string>("medium");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStoryPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 0;
    setFormData((prev) => ({ ...prev, storyPoints: value }));
  };

  const handleEpicChange = (epicId: string) => {
    setFormData((prev) => ({ ...prev, epicId }));
  };

  const handleMilestoneChange = (milestoneId: string) => {
    setFormData((prev) => ({ ...prev, milestoneId }));
  };

  const handleStatusChange = (status: string) => {
    setFormData((prev) => ({ ...prev, status }));
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    // Map priority to tags
    let tags = formData.tags;
    if (!tags.includes(priority)) {
      tags = tags ? `${tags},${priority}` : priority;
    }

    onSubmit({
      ...formData,
      tags,
    });
  };
  return (
    <form onSubmit={handleSubmitForm}>
      <Card className="w-full max-w-xl bg-white rounded-0 border-none">
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-semibold">
            Create Sprint Task
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4">
            {/* Task Name Input */}
            <div className="flex items-start gap-3">
              <PenSquare className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <Input
                  name="title"
                  placeholder="Task Name"
                  className="border-gray-200"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Description Input */}
            <div className="flex items-start gap-3">
              <PenSquare className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <Textarea
                  name="description"
                  placeholder="Description"
                  className="min-h-[100px] border-gray-200"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Epic Selection */}
            <div className="flex items-start gap-3">
              <ListChecks className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <Label className="mb-2 block">Epic</Label>
                <Select
                  value={formData.epicId}
                  onValueChange={handleEpicChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an epic" />
                  </SelectTrigger>
                  <SelectContent>
                    {epics.length === 0 ? (
                      <div className="p-2 text-center text-sm text-gray-500">
                        No epics found. Please create one first.
                      </div>
                    ) : (
                      epics.map((epic) => (
                        <SelectItem key={epic.id} value={epic.id}>
                          {epic.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Milestone Selection (Optional) */}
            <div className="flex items-start gap-3">
              <ListChecks className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <Label className="mb-2 block">Milestone (Optional)</Label>
                <Select
                  value={formData?.milestoneId}
                  onValueChange={handleMilestoneChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a milestone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {milestones.map((milestone) => (
                      <SelectItem key={milestone.id} value={milestone.id}>
                        {milestone.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status Selection */}
            <div className="flex items-start gap-3">
              <ListChecks className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <Label className="mb-2 block">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.name}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sprint Name */}
            <div className="flex items-start gap-3">
              <PenSquare className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <Label className="mb-2 block">Sprint</Label>
                <Input
                  name="sprint"
                  placeholder="Sprint Name"
                  className="border-gray-200"
                  value={formData.sprint}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Story Points */}
            <div className="flex items-start gap-3">
              <PenSquare className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <Label className="mb-2 block">Story Points</Label>
                <Input
                  name="storyPoints"
                  type="number"
                  placeholder="Story Points"
                  className="border-gray-200"
                  value={formData.storyPoints || ""}
                  onChange={handleStoryPointsChange}
                  min={0}
                  required
                />
              </div>
            </div>

            {/* Due Date Input */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <Input
                  name="date"
                  type="text"
                  placeholder="Due Date"
                  className="border-gray-200"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Priority Level */}
            <div className="flex items-start gap-3 p-0">
              <AlertTriangle className="w-6 h-6 text-gray-500" />
              <div className="flex-1 item-center">
                <RadioGroup
                  value={priority}
                  onValueChange={setPriority}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="high-sprint" />
                    <Label
                      htmlFor="high-sprint"
                      className="text-red-600 font-medium"
                    >
                      High
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium-sprint" />
                    <Label
                      htmlFor="medium-sprint"
                      className="text-yellow-600 font-medium"
                    >
                      Medium
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="low-sprint" />
                    <Label
                      htmlFor="low-sprint"
                      className="text-green-600 font-medium"
                    >
                      Low
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-start gap-3">
              <Plus className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <Label className="mb-2 block">Tags (comma separated)</Label>
                <Input
                  name="tags"
                  placeholder="Enter tags separated by commas"
                  className="border-gray-200"
                  value={formData.tags}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Attachment Note - for Cloudinary integration */}
            <div className="flex items-start gap-3">
              <Paperclip className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">
                  Files can be attached after creating the sprint task
                </p>
              </div>
            </div>

            {/* Assignees */}
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 mt-2">
                <Plus className="w-full h-full text-gray-500" />
              </div>
              <div className="flex-1">
                <Label className="mb-2 block">Assignees</Label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-full pr-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="/placeholder-avatar.jpg" />
                      <AvatarFallback>WL</AvatarFallback>
                    </Avatar>
                    <span className="ml-2 text-sm">Williams Lady</span>
                  </div>
                  <div className="flex items-center rounded-full pr-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="/placeholder-avatar.jpg" />
                      <AvatarFallback>AK</AvatarFallback>
                    </Avatar>
                    <span className="ml-2 text-sm">Abdou Koli</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" className="px-6">
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-6 bg-teal-600"
              disabled={isSubmitting || epics.length === 0}
            >
              {isSubmitting ? "Creating..." : "+ Add Sprint Task"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default CreateSprintForm;
