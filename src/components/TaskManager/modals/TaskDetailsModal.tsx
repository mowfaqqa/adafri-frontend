"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Task, SprintTask, isSprintTask } from "@/lib/types/taskManager/types";
import { TaskActionButtons } from "../buttons/TaskActionButtons";
import {
  Calendar,
  Tag,
  BarChart2,
  Clock,
  Paperclip,
  Plus,
  Download,
  Trash2,
  File,
  Image,
  FileText,
  Video,
  Music,
  ListChecks,
} from "lucide-react";
import { useTaskManagerApi } from "@/lib/hooks/useTaskmanagerApi";
import { getFileUrl } from "@/lib/api/task-manager/fileApi";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";

interface TaskDetailsModalProps {
  task: Task;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

// Helper function to get the appropriate file icon based on mimetype
const getFileIcon = (mimetype: string) => {
  if (mimetype.startsWith("image/")) {
    return <Image className="h-4 w-4 mr-2 text-gray-400" />;
  } else if (mimetype.startsWith("video/")) {
    return <Video className="h-4 w-4 mr-2 text-gray-400" />;
  } else if (mimetype.startsWith("audio/")) {
    return <Music className="h-4 w-4 mr-2 text-gray-400" />;
  } else if (mimetype.startsWith("text/") || mimetype.includes("document")) {
    return <FileText className="h-4 w-4 mr-2 text-gray-400" />;
  } else {
    return <File className="h-4 w-4 mr-2 text-gray-400" />;
  }
};

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen,
  onOpenChange,
}) => {
  const { projectId } = useProjectContext();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [currentProgress, setCurrentProgress] = useState(task.progress);
  const [activeTab, setActiveTab] = useState("overview");

  // API hooks
  const {
    useUpdateTaskMutation,
    useUpdateTaskProgressMutation,
    useUpdateTaskStatusMutation,
    useTaskFilesQuery,
    useUploadFileMutation,
    useDeleteFileMutation,
    useProjectStatusesQuery,
    useEpicsQuery,
    useMilestonesQuery,
  } = useTaskManagerApi();

  const updateTaskMutation = useUpdateTaskMutation();
  const updateProgressMutation = useUpdateTaskProgressMutation();
  const updateStatusMutation = useUpdateTaskStatusMutation();
  const uploadFileMutation = useUploadFileMutation();
  const deleteFileMutation = useDeleteFileMutation();

  // Fetch project-related data
  const { data: projectStatuses = [] } = useProjectStatusesQuery(
    projectId || ""
  );
  const { data: epics = [] } = useEpicsQuery(projectId || "");
  const { data: milestones = [] } = useMilestonesQuery(projectId || "");

  // Files query
  const { data: taskFiles = [], isLoading: isLoadingFiles } = useTaskFilesQuery(
    projectId || "",
    task.id as string
  );

  // Update local state when task changes
  useEffect(() => {
    setEditedTask(task);
    setCurrentProgress(task.progress);
  }, [task]);

  const handleEditToggle = () => {
    if (isEditMode && hasChanges()) {
      // If saving changes
      updateTaskMutation.mutate(
        {
          projectId: projectId || "",
          taskId: task.id as string,
          updates: editedTask,
        },
        {
          onSuccess: () => {
            setIsEditMode(false);
          },
        }
      );
    } else {
      // Just toggling edit mode
      setIsEditMode(!isEditMode);
    }
  };

  const hasChanges = () => {
    return (
      editedTask.title !== task.title ||
      editedTask.description !== task.description ||
      editedTask.date !== task.date ||
      editedTask.epicId !== task.epicId ||
      editedTask.milestoneId !== task.milestoneId ||
      (isSprintTask(editedTask) &&
        isSprintTask(task) &&
        (editedTask?.storyPoints !== task?.storyPoints ||
          editedTask?.sprint !== task?.sprint))
    );
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditedTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleStoryPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSprintTask(editedTask)) {
      const value = parseInt(e.target.value) || 0;
      setEditedTask(
        (prev) =>
          ({
            ...prev,
            storyPoints: value,
          } as SprintTask)
      );
    }
  };

  const handleEpicChange = (epicId: string) => {
    setEditedTask((prev) => ({ ...prev, epicId }));
  };

  const handleMilestoneChange = (milestoneId: string) => {
    setEditedTask((prev) => ({ ...prev, milestoneId }));
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseInt(e.target.value);
    setCurrentProgress(newProgress);
  };

  const handleProgressUpdate = () => {
    updateProgressMutation.mutate({
      projectId: projectId || "",
      taskId: task.id as string,
      progress: currentProgress,
    });
  };

  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate({
      projectId: projectId || "",
      taskId: task.id as string,
      status: newStatus,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && projectId) {
      uploadFileMutation.mutate({
        projectId,
        taskId: task.id as string,
        file,
      });
    }
  };

  const handleDeleteFile = (fileId: string) => {
    if (!projectId) return;
    deleteFileMutation.mutate({ projectId, fileId });
  };

  // Helper function to find entity by ID
  const getEpicTitle = (epicId: string | undefined) => {
    if (!epicId) return "None";
    const epic = epics.find((e) => e.id === epicId);
    return epic ? epic.title : "Unknown Epic";
  };

  const getMilestoneTitle = (milestoneId: string | undefined) => {
    if (!milestoneId) return "None";
    const milestone = milestones.find((m) => m.id === milestoneId);
    return milestone ? milestone.title : "Unknown Milestone";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl">
            {isEditMode ? (
              <Input
                name="title"
                value={editedTask.title}
                onChange={handleChange}
                className="text-xl font-semibold"
                placeholder="Task Title"
              />
            ) : (
              task.title
            )}
          </DialogTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleEditToggle}>
              {isEditMode
                ? updateTaskMutation.isPending
                  ? "Saving..."
                  : "Save"
                : "Edit"}
            </Button>
            <TaskActionButtons
              task={task}
              projectId={projectId || ""}
              onView={() => {}}
              onEdit={() => setIsEditMode(true)}
              variant="modal"
            />
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
            <TabsTrigger value="attachments">
              Attachments ({taskFiles.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              {isEditMode ? (
                <Textarea
                  name="description"
                  value={editedTask.description}
                  onChange={handleChange}
                  className="min-h-[100px]"
                  placeholder="Task Description"
                />
              ) : (
                <p className="text-sm">{task.description}</p>
              )}
            </div>

            {/* Project Information */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Project</h3>
              <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100">
                {projectId || "Unknown Project"}
              </Badge>
            </div>

            {/* Epic and Milestone */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Epic</h3>
                {isEditMode && isSprintTask(task) ? (
                  <Select
                    value={editedTask.epicId || ""}
                    onValueChange={handleEpicChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an epic" />
                    </SelectTrigger>
                    <SelectContent>
                      {epics.map((epic) => (
                        <SelectItem key={epic.id} value={epic.id}>
                          {epic.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                    {getEpicTitle(task.epicId)}
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Milestone</h3>
                {isEditMode ? (
                  <Select
                    value={editedTask.milestoneId || ""}
                    onValueChange={handleMilestoneChange}
                  >
                    <SelectTrigger className="w-full">
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
                ) : (
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                    {getMilestoneTitle(task.milestoneId)}
                  </Badge>
                )}
              </div>
            </div>

            {/* Sprint-specific fields */}
            {isSprintTask(task) && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Sprint</h3>
                  {isEditMode && isSprintTask(editedTask) ? (
                    <Input
                      name="sprint"
                      value={editedTask?.sprint}
                      onChange={handleChange}
                      placeholder="Sprint Name"
                    />
                  ) : (
                    <Badge>{task.sprint}</Badge>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">
                    Story Points
                  </h3>
                  {isEditMode && isSprintTask(editedTask) ? (
                    <Input
                      name="storyPoints"
                      type="number"
                      value={editedTask.storyPoints}
                      onChange={handleStoryPointsChange}
                      min="0"
                      placeholder="Story Points"
                    />
                  ) : (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <BarChart2 className="h-3 w-3" />
                      {task.storyPoints} pts
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Due Date */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
              {isEditMode ? (
                <Input
                  name="date"
                  value={editedTask.date}
                  onChange={handleChange}
                  placeholder="Due Date"
                />
              ) : (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm">{task.date}</span>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <div className="flex gap-2">
                <Select value={task.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectStatuses.map((status) => (
                      <SelectItem key={status.id} value={status.name}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {updateStatusMutation.isPending && (
                  <span className="text-sm text-gray-500">Updating...</span>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium text-gray-500">Progress</h3>
                <span className="text-sm font-medium">{currentProgress}%</span>
              </div>
              <Progress value={currentProgress} className="h-2" />
              <div className="flex items-center gap-4 mt-2">
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={currentProgress}
                  onChange={handleProgressChange}
                  className="w-full"
                />
                <Button
                  onClick={handleProgressUpdate}
                  disabled={
                    updateProgressMutation.isPending ||
                    currentProgress === task.progress
                  }
                  size="sm"
                >
                  {updateProgressMutation.isPending ? "Updating..." : "Update"}
                </Button>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Assignees */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Assignees</h3>
              <div className="flex -space-x-2">
                {task.assignees.map((assignee, index) => (
                  <Avatar key={index} className="h-8 w-8 border-2 border-white">
                    <AvatarImage src={assignee} />
                    <AvatarFallback>{`U${index + 1}`}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-6 text-sm text-gray-500">
              <div>
                <p className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Created: {new Date(task.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Last Modified: {new Date(task.lastModified).toLocaleString()}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <h3 className="font-medium">Activity History</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {task.activityLog.length > 0 ? (
                [...task.activityLog]
                  .sort(
                    (a, b) =>
                      new Date(b.timestamp).getTime() -
                      new Date(a.timestamp).getTime()
                  )
                  .map((log) => (
                    <div key={log.id} className="border-b pb-2">
                      <p className="text-sm font-medium">
                        {log.action.charAt(0).toUpperCase() +
                          log.action.slice(1).replace(/_/g, " ")}
                      </p>
                      <p className="text-sm text-gray-500">{log.description}</p>
                      <p className="text-xs text-gray-400">
                        By: {log.userId} |{" "}
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-gray-500">No activity recorded.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Attachments</h3>
              <div>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploadFileMutation.isPending}
                />
                <label htmlFor="file-upload">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    disabled={uploadFileMutation.isPending}
                  >
                    <div className="cursor-pointer">
                      <Plus className="h-4 w-4 mr-2" />
                      {uploadFileMutation.isPending
                        ? "Uploading..."
                        : "Add File"}
                    </div>
                  </Button>
                </label>
              </div>
            </div>

            {isLoadingFiles ? (
              <p className="text-sm text-gray-500">Loading files...</p>
            ) : taskFiles.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {taskFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center">
                      {getFileIcon(file.mimetype)}
                      <div>
                        <p className="text-sm font-medium">
                          {file.originalname}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(2)} KB •{" "}
                          {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={getFileUrl(file)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:text-red-500"
                        onClick={() => handleDeleteFile(file.id)}
                        disabled={deleteFileMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No attachments yet.</p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsModal;
