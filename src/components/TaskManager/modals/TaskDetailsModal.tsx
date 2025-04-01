/* eslint-disable @typescript-eslint/no-explicit-any */
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
} from "lucide-react";
import { useTaskManagerApi } from "@/lib/hooks/useTaskmanagerApi";
import { getFileUrl } from "@/lib/api/task-manager/fileApi";

interface TaskDetailsModalProps {
  task: Task;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen,
  onOpenChange,
}) => {
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
    useColumnsQuery,
  } = useTaskManagerApi();

  const updateTaskMutation = useUpdateTaskMutation();
  const updateProgressMutation = useUpdateTaskProgressMutation();
  const updateStatusMutation = useUpdateTaskStatusMutation();
  const uploadFileMutation = useUploadFileMutation();
  const deleteFileMutation = useDeleteFileMutation();

  // Files query
  const { data: taskFiles = [], isLoading: isLoadingFiles } = useTaskFilesQuery(
    task.id as string
  );

  const { data: columnList = [] } =
    useColumnsQuery();

  // Update local state when task changes
  useEffect(() => {
    setEditedTask(task);
    setCurrentProgress(task.progress);
  }, [task]);

  const handleEditToggle = () => {
    if (isEditMode && hasChanges()) {
      // If saving changes
      updateTaskMutation.mutate(
        { id: task.id as string, updates: editedTask },
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

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseInt(e.target.value);
    setCurrentProgress(newProgress);
  };

  const handleProgressUpdate = () => {
    updateProgressMutation.mutate({
      id: task.id as string,
      progress: currentProgress,
    });
  };

  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate({
      id: task.id as string,
      status: newStatus,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFileMutation.mutate({
        taskId: task.id as string,
        file,
      });
    }
  };

  const handleDeleteFile = (fileId: string) => {
    deleteFileMutation.mutate(fileId);
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
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="p-2 border rounded-md w-full"
                  disabled={updateStatusMutation.isPending}
                >
                  {/* Use the columns from API for status options */}
                  <option value="" disabled>
                    Select status
                  </option>
                  {columnList?.map((column: any) => (
                    <option key={column?.id} value={column?.id}>
                      {column.title}
                    </option>
                  ))}
                </select>
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
                          log.action.slice(1)}
                      </p>
                      <p className="text-sm text-gray-500">{log.description}</p>
                      <p className="text-xs text-gray-400">
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
                      <Paperclip className="h-4 w-4 mr-2 text-gray-400" />
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
                        href={getFileUrl(file.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
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
