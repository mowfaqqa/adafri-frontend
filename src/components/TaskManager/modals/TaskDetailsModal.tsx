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
  Sparkles,
  Users,
  Target,
  Zap,
  CheckCircle2,
  Edit3,
  Save,
  X,
} from "lucide-react";
import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
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
    return <Image className="h-4 w-4 mr-2 text-gradient-to-r from-pink-500 to-violet-500" />;
  } else if (mimetype.startsWith("video/")) {
    return <Video className="h-4 w-4 mr-2 text-gradient-to-r from-blue-500 to-purple-500" />;
  } else if (mimetype.startsWith("audio/")) {
    return <Music className="h-4 w-4 mr-2 text-gradient-to-r from-green-500 to-blue-500" />;
  } else if (mimetype.startsWith("text/") || mimetype.includes("document")) {
    return <FileText className="h-4 w-4 mr-2 text-gradient-to-r from-orange-500 to-red-500" />;
  } else {
    return <File className="h-4 w-4 mr-2 text-slate-500" />;
  }
};

// Status color mapping
const getStatusColor = (status: string) => {
  const statusColors: Record<string, string> = {
    'todo': 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 border-slate-300',
    'in-progress': 'bg-gradient-to-r from-blue-100 to-indigo-200 text-blue-800 border-blue-300',
    'in progress': 'bg-gradient-to-r from-blue-100 to-indigo-200 text-blue-800 border-blue-300',
    'done': 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 border-green-300',
    'completed': 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 border-green-300',
    'blocked': 'bg-gradient-to-r from-red-100 to-rose-200 text-red-800 border-red-300',
    'review': 'bg-gradient-to-r from-yellow-100 to-amber-200 text-yellow-800 border-yellow-300',
  };
  return statusColors[status.toLowerCase()] || 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300';
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
  } = useAuthAwareTaskManagerApi();

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
          }) as SprintTask
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
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50/30 border-0 shadow-2xl rounded-2xl ml-8">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-xl animate-pulse delay-700"></div>
        </div>

        <DialogHeader className="relative z-10 border-b border-slate-200/50 pb-6 mb-0 pr-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <DialogTitle className="flex-1">
              {isEditMode ? (
                <div className="relative">
                  <Input
                    name="title"
                    value={editedTask.title}
                    onChange={handleChange}
                    className="text-xl sm:text-2xl font-bold bg-white/80 backdrop-blur-sm border-2 border-purple-200 focus:border-purple-400 rounded-xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md"
                    placeholder="Task Title"
                  />
                  <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400" />
                </div>
              ) : (
                <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-800 bg-clip-text text-transparent leading-tight">
                  {task.title}
                </div>
              )}
            </DialogTitle>

            <div className="flex items-center gap-2 justify-start ">
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
                onView={() => { }}
                onEdit={() => setIsEditMode(true)}
                variant="modal"
              />
            </div>
          </div>
        </DialogHeader>

        <div className="relative z-10 overflow-y-auto flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid grid-cols-3 mb-8 bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-slate-200/50 mx-4 sm:mx-0">
              <TabsTrigger
                value="overview"
                className="rounded-lg font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white transition-all duration-200"
              >
                <Target className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="rounded-lg font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white transition-all duration-200"
              >
                <Zap className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Activity</span>
              </TabsTrigger>
              <TabsTrigger
                value="attachments"
                className="rounded-lg font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white transition-all duration-200"
              >
                <Paperclip className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Files</span>
                <span className="sm:hidden">({taskFiles.length})</span>
                <span className="hidden sm:inline"> ({taskFiles.length})</span>
              </TabsTrigger>
            </TabsList>

            <div className="px-4 sm:px-6">
              {/* Overview TabsContent section with this updated version: */}

              <TabsContent value="overview" className="space-y-6 mt-0">
                <div className="max-h-[600px] overflow-y-auto pr-2 space-y-6">
                  {/* Status & Progress Card - More Compact */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 shadow-sm hover:shadow-sm transition-all duration-200">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="space-y-2">
                          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center">
                            <CheckCircle2 className="h-3 w-3 mr-2 text-green-500" />
                            Status
                          </h3>
                          <div className="flex gap-2">
                            <Select value={task.status} onValueChange={handleStatusChange}>
                              <SelectTrigger className={`w-full border-2 rounded-xl px-3 py-2 text-sm font-medium ${getStatusColor(task.status)}`}>
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
                              <span className="text-xs text-slate-500 self-center">Updating...</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center">
                              <BarChart2 className="h-3 w-3 mr-2 text-blue-500" />
                              Progress
                            </h3>
                            <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              {currentProgress}%
                            </span>
                          </div>
                          <div className="relative">
                            <Progress
                              value={currentProgress}
                              className="h-2 bg-slate-200 rounded-full overflow-hidden"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full opacity-20 animate-pulse"></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="range"
                              min="0"
                              max="100"
                              value={currentProgress}
                              onChange={handleProgressChange}
                              className="flex-1 accent-purple-500 h-2"
                            />
                            <Button
                              onClick={handleProgressUpdate}
                              disabled={
                                updateProgressMutation.isPending ||
                                currentProgress === task.progress
                              }
                              size="sm"
                              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl px-3 py-1 text-xs transition-all duration-200"
                            >
                              {updateProgressMutation.isPending ? "Updating..." : "Update"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description Card - More Compact */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 shadow-sm hover:shadow-sm transition-all duration-200">
                    <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center">
                      <FileText className="h-3 w-3 mr-2 text-orange-500" />
                      Description
                    </h3>
                    {isEditMode ? (
                      <Textarea
                        name="description"
                        value={editedTask.description}
                        onChange={handleChange}
                        className="min-h-[80px] bg-white/60 border-2 border-slate-200 focus:border-purple-400 rounded-xl p-3 resize-none transition-all duration-200 text-sm"
                        placeholder="Describe your task in detail..."
                      />
                    ) : (
                      <p className="text-slate-700 leading-relaxed bg-slate-50/50 rounded-xl p-3 border border-slate-200/30 text-sm">
                        {task.description || "No description provided."}
                      </p>
                    )}
                  </div>

                  {/* Project & Metadata Grid - More Compact */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Project Info Card */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 shadow-sm hover:shadow-sm transition-all duration-200">
                      <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center">
                        <Sparkles className="h-3 w-3 mr-2 text-teal-500" />
                        Project
                      </h3>
                      <Badge className="bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-800 hover:from-teal-200 hover:to-cyan-200 border border-teal-200 px-2 py-1 rounded-xl font-medium text-xs">
                        {projectId || "Unknown Project"}
                      </Badge>
                    </div>

                    {/* Due Date Card */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 shadow-sm hover:shadow-sm transition-all duration-200">
                      <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center">
                        <Calendar className="h-3 w-3 mr-2 text-red-500" />
                        Due Date
                      </h3>
                      {isEditMode ? (
                        <Input
                          name="date"
                          value={editedTask.date}
                          onChange={handleChange}
                          className="bg-white/60 border-2 border-slate-200 focus:border-purple-400 rounded-xl text-sm"
                          placeholder="Due Date"
                        />
                      ) : (
                        <div className="flex items-center bg-slate-50/50 rounded-xl p-2 border border-slate-200/30">
                          <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                          <span className="font-medium text-slate-700 text-sm">{task.date || "No due date"}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Epic & Milestone Grid - More Compact */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 shadow-sm hover:shadow-sm transition-all duration-200">
                      <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center">
                        <Target className="h-3 w-3 mr-2 text-purple-500" />
                        Epic
                      </h3>
                      {isEditMode && isSprintTask(task) ? (
                        <Select
                          value={editedTask.epicId || ""}
                          onValueChange={handleEpicChange}
                        >
                          <SelectTrigger className="w-full bg-white/60 border-2 border-slate-200 focus:border-purple-400 rounded-xl text-sm">
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
                        <Badge className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 hover:from-purple-200 hover:to-indigo-200 border border-purple-200 px-2 py-1 rounded-xl font-medium text-xs">
                          {getEpicTitle(task.epicId)}
                        </Badge>
                      )}
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 shadow-sm hover:shadow-sm transition-all duration-200">
                      <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center">
                        <Zap className="h-3 w-3 mr-2 text-blue-500" />
                        Milestone
                      </h3>
                      {isEditMode ? (
                        <Select
                          value={editedTask.milestoneId || ""}
                          onValueChange={handleMilestoneChange}
                        >
                          <SelectTrigger className="w-full bg-white/60 border-2 border-slate-200 focus:border-purple-400 rounded-xl text-sm">
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
                        <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 hover:from-blue-200 hover:to-cyan-200 border border-blue-200 px-2 py-1 rounded-xl font-medium text-xs">
                          {getMilestoneTitle(task.milestoneId)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Sprint-specific fields - More Compact */}
                  {isSprintTask(task) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 shadow-sm hover:shadow-sm transition-all duration-200">
                        <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center">
                          <ListChecks className="h-3 w-3 mr-2 text-green-500" />
                          Sprint
                        </h3>
                        {isEditMode && isSprintTask(editedTask) ? (
                          <Input
                            name="sprint"
                            value={editedTask?.sprint}
                            onChange={handleChange}
                            className="bg-white/60 border-2 border-slate-200 focus:border-purple-400 rounded-xl text-sm"
                            placeholder="Sprint Name"
                          />
                        ) : (
                          <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 hover:from-green-200 hover:to-emerald-200 border border-green-200 px-2 py-1 rounded-xl font-medium text-xs">
                            {task.sprint}
                          </Badge>
                        )}
                      </div>

                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 shadow-sm hover:shadow-sm transition-all duration-200">
                        <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center">
                          <BarChart2 className="h-3 w-3 mr-2 text-orange-500" />
                          Story Points
                        </h3>
                        {isEditMode && isSprintTask(editedTask) ? (
                          <Input
                            name="storyPoints"
                            type="number"
                            value={editedTask.storyPoints}
                            onChange={handleStoryPointsChange}
                            min="0"
                            className="bg-white/60 border-2 border-slate-200 focus:border-purple-400 rounded-xl text-sm"
                            placeholder="Story Points"
                          />
                        ) : (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 bg-gradient-to-r from-orange-50 to-red-50 text-orange-800 border-orange-200 px-2 py-1 rounded-xl font-medium w-fit text-xs"
                          >
                            <BarChart2 className="h-3 w-3" />
                            {task.storyPoints} pts
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags & Assignees - More Compact */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 shadow-sm hover:shadow-sm transition-all duration-200">
                      <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center">
                        <Tag className="h-3 w-3 mr-2 text-pink-500" />
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {task.tags.length > 0 ? task.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 hover:from-pink-200 hover:to-purple-200 border border-pink-200 px-2 py-1 rounded-xl font-medium text-xs"
                          >
                            <Tag className="h-2 w-2" />
                            {tag}
                          </Badge>
                        )) : (
                          <span className="text-slate-500 italic text-sm">No tags assigned</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 shadow-sm hover:shadow-sm transition-all duration-200">
                      <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center">
                        <Users className="h-3 w-3 mr-2 text-indigo-500" />
                        Assignees
                      </h3>
                      <div className="flex -space-x-1">
                        {task.assignees.length > 0 ? task.assignees.map((assignee, index) => (
                          <Avatar key={index} className="h-8 w-8 border-2 border-white shadow-lg hover:scale-110 transition-transform duration-200">
                            <AvatarImage src={assignee} />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-bold text-xs">
                              {`U${index + 1}`}
                            </AvatarFallback>
                          </Avatar>
                        )) : (
                          <span className="text-slate-500 italic text-sm">No assignees</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metadata Card - More Compact */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 shadow-sm hover:shadow-sm transition-all duration-200">
                    <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center">
                      <Clock className="h-3 w-3 mr-2 text-slate-500" />
                      Timeline
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-200/30">
                        <p className="flex items-center gap-2 text-xs text-slate-600">
                          <Clock className="h-3 w-3 text-green-500" />
                          <span className="font-medium">Created:</span>
                        </p>
                        <p className="text-xs text-slate-800 font-medium mt-1">
                          {new Date(task.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-200/30">
                        <p className="flex items-center gap-2 text-xs text-slate-600">
                          <Clock className="h-3 w-3 text-blue-500" />
                          <span className="font-medium">Last Modified:</span>
                        </p>
                        <p className="text-xs text-slate-800 font-medium mt-1">
                          {new Date(task.lastModified).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-6 mt-0">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                    <Zap className="h-5 w-5 mr-3 text-yellow-500" />
                    Activity History
                  </h3>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {task.activityLog.length > 0 ? (
                      [...task.activityLog]
                        .sort(
                          (a, b) =>
                            new Date(b.timestamp).getTime() -
                            new Date(a.timestamp).getTime()
                        )
                        .map((log, index) => (
                          <div key={log.id} className="relative">
                            {/* Timeline line */}
                            {index !== task.activityLog.length - 1 && (
                              <div className="absolute left-4 top-12 w-0.5 h-full bg-gradient-to-b from-purple-300 to-transparent"></div>
                            )}

                            <div className="flex gap-4 pb-4">
                              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>

                              <div className="flex-1 bg-slate-50/50 rounded-xl p-4 border border-slate-200/30 hover:bg-white/60 transition-colors duration-200">
                                <p className="font-semibold text-slate-800 mb-1">
                                  {log.action.charAt(0).toUpperCase() +
                                    log.action.slice(1).replace(/_/g, " ")}
                                </p>
                                <p className="text-sm text-slate-600 mb-2">{log.description}</p>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {log.userId}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(log.timestamp).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-12">
                        <Zap className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 italic">No activity recorded yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="space-y-6 mt-0">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center">
                      <Paperclip className="h-5 w-5 mr-3 text-blue-500" />
                      Attachments
                    </h3>
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
                          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 rounded-xl px-4 py-2 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <div className="cursor-pointer flex items-center">
                            <Plus className="h-4 w-4 mr-2" />
                            {uploadFileMutation.isPending ? "Uploading..." : "Add File"}
                          </div>
                        </Button>
                      </label>
                    </div>
                  </div>

                  {isLoadingFiles ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                      <p className="text-slate-500">Loading files...</p>
                    </div>
                  ) : taskFiles.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {taskFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50/50 border border-slate-200/30 rounded-xl hover:bg-white/60 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center min-w-0 flex-1">
                            {getFileIcon(file.mimetype)}
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-slate-800 truncate">
                                {file.originalname}
                              </p>
                              <p className="text-xs text-slate-500 flex items-center gap-3">
                                <span>{(file.size / 1024).toFixed(2)} KB</span>
                                <span>•</span>
                                <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <a
                              href={getFileUrl(file)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 hover:bg-green-100 hover:text-green-600 rounded-lg transition-colors duration-200"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors duration-200"
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
                    <div className="text-center py-12">
                      <Paperclip className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 italic mb-4">No attachments yet.</p>
                      <p className="text-xs text-slate-400">Click "Add File" to upload your first attachment.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsModal;






















































// "use client";

// import React, { useState, useEffect } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Task, SprintTask, isSprintTask } from "@/lib/types/taskManager/types";
// import { TaskActionButtons } from "../buttons/TaskActionButtons";
// import {
//   Calendar,
//   Tag,
//   BarChart2,
//   Clock,
//   Paperclip,
//   Plus,
//   Download,
//   Trash2,
//   File,
//   Image,
//   FileText,
//   Video,
//   Music,
//   ListChecks,
// } from "lucide-react";
// import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
// import { getFileUrl } from "@/lib/api/task-manager/fileApi";

// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";

// interface TaskDetailsModalProps {
//   task: Task;
//   isOpen: boolean;
//   onOpenChange: (isOpen: boolean) => void;
// }

// // Helper function to get the appropriate file icon based on mimetype
// const getFileIcon = (mimetype: string) => {
//   if (mimetype.startsWith("image/")) {
//     return <Image className="h-4 w-4 mr-2 text-gray-400" />;
//   } else if (mimetype.startsWith("video/")) {
//     return <Video className="h-4 w-4 mr-2 text-gray-400" />;
//   } else if (mimetype.startsWith("audio/")) {
//     return <Music className="h-4 w-4 mr-2 text-gray-400" />;
//   } else if (mimetype.startsWith("text/") || mimetype.includes("document")) {
//     return <FileText className="h-4 w-4 mr-2 text-gray-400" />;
//   } else {
//     return <File className="h-4 w-4 mr-2 text-gray-400" />;
//   }
// };

// const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
//   task,
//   isOpen,
//   onOpenChange,
// }) => {
//   const { projectId } = useProjectContext();
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [editedTask, setEditedTask] = useState(task);
//   const [currentProgress, setCurrentProgress] = useState(task.progress);
//   const [activeTab, setActiveTab] = useState("overview");

//   // API hooks
//   const {
//     useUpdateTaskMutation,
//     useUpdateTaskProgressMutation,
//     useUpdateTaskStatusMutation,
//     useTaskFilesQuery,
//     useUploadFileMutation,
//     useDeleteFileMutation,
//     useProjectStatusesQuery,
//     useEpicsQuery,
//     useMilestonesQuery,
//   } = useAuthAwareTaskManagerApi();

//   const updateTaskMutation = useUpdateTaskMutation();
//   const updateProgressMutation = useUpdateTaskProgressMutation();
//   const updateStatusMutation = useUpdateTaskStatusMutation();
//   const uploadFileMutation = useUploadFileMutation();
//   const deleteFileMutation = useDeleteFileMutation();

//   // Fetch project-related data
//   const { data: projectStatuses = [] } = useProjectStatusesQuery(
//     projectId || ""
//   );
//   const { data: epics = [] } = useEpicsQuery(projectId || "");
//   const { data: milestones = [] } = useMilestonesQuery(projectId || "");

//   // Files query
//   const { data: taskFiles = [], isLoading: isLoadingFiles } = useTaskFilesQuery(
//     projectId || "",
//     task.id as string
//   );

//   // Update local state when task changes
//   useEffect(() => {
//     setEditedTask(task);
//     setCurrentProgress(task.progress);
//   }, [task]);

//   const handleEditToggle = () => {
//     if (isEditMode && hasChanges()) {
//       // If saving changes
//       updateTaskMutation.mutate(
//         {
//           projectId: projectId || "",
//           taskId: task.id as string,
//           updates: editedTask,
//         },
//         {
//           onSuccess: () => {
//             setIsEditMode(false);
//           },
//         }
//       );
//     } else {
//       // Just toggling edit mode
//       setIsEditMode(!isEditMode);
//     }
//   };

//   const hasChanges = () => {
//     return (
//       editedTask.title !== task.title ||
//       editedTask.description !== task.description ||
//       editedTask.date !== task.date ||
//       editedTask.epicId !== task.epicId ||
//       editedTask.milestoneId !== task.milestoneId ||
//       (isSprintTask(editedTask) &&
//         isSprintTask(task) &&
//         (editedTask?.storyPoints !== task?.storyPoints ||
//           editedTask?.sprint !== task?.sprint))
//     );
//   };

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
//   ) => {
//     const { name, value } = e.target;
//     setEditedTask((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleStoryPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (isSprintTask(editedTask)) {
//       const value = parseInt(e.target.value) || 0;
//       setEditedTask(
//         (prev) =>
//           ({
//             ...prev,
//             storyPoints: value,
//           }) as SprintTask
//       );
//     }
//   };

//   const handleEpicChange = (epicId: string) => {
//     setEditedTask((prev) => ({ ...prev, epicId }));
//   };

//   const handleMilestoneChange = (milestoneId: string) => {
//     setEditedTask((prev) => ({ ...prev, milestoneId }));
//   };

//   const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const newProgress = parseInt(e.target.value);
//     setCurrentProgress(newProgress);
//   };

//   const handleProgressUpdate = () => {
//     updateProgressMutation.mutate({
//       projectId: projectId || "",
//       taskId: task.id as string,
//       progress: currentProgress,
//     });
//   };

//   const handleStatusChange = (newStatus: string) => {
//     updateStatusMutation.mutate({
//       projectId: projectId || "",
//       taskId: task.id as string,
//       status: newStatus,
//     });
//   };

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file && projectId) {
//       uploadFileMutation.mutate({
//         projectId,
//         taskId: task.id as string,
//         file,
//       });
//     }
//   };

//   const handleDeleteFile = (fileId: string) => {
//     if (!projectId) return;
//     deleteFileMutation.mutate({ projectId, fileId });
//   };

//   // Helper function to find entity by ID
//   const getEpicTitle = (epicId: string | undefined) => {
//     if (!epicId) return "None";
//     const epic = epics.find((e) => e.id === epicId);
//     return epic ? epic.title : "Unknown Epic";
//   };

//   const getMilestoneTitle = (milestoneId: string | undefined) => {
//     if (!milestoneId) return "None";
//     const milestone = milestones.find((m) => m.id === milestoneId);
//     return milestone ? milestone.title : "Unknown Milestone";
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader className="flex flex-row items-center justify-between">
//           <DialogTitle className="text-xl">
//             {isEditMode ? (
//               <Input
//                 name="title"
//                 value={editedTask.title}
//                 onChange={handleChange}
//                 className="text-xl font-semibold"
//                 placeholder="Task Title"
//               />
//             ) : (
//               task.title
//             )}
//           </DialogTitle>
//           <div className="flex gap-2">
//             <Button variant="outline" size="sm" onClick={handleEditToggle}>
//               {isEditMode
//                 ? updateTaskMutation.isPending
//                   ? "Saving..."
//                   : "Save"
//                 : "Edit"}
//             </Button>
//             <TaskActionButtons
//               task={task}
//               projectId={projectId || ""}
//               onView={() => {}}
//               onEdit={() => setIsEditMode(true)}
//               variant="modal"
//             />
//           </div>
//         </DialogHeader>

//         <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
//           <TabsList className="grid grid-cols-3 mb-6">
//             <TabsTrigger value="overview">Overview</TabsTrigger>
//             <TabsTrigger value="activity">Activity Log</TabsTrigger>
//             <TabsTrigger value="attachments">
//               Attachments ({taskFiles.length})
//             </TabsTrigger>
//           </TabsList>

//           <TabsContent value="overview" className="space-y-6">
//             {/* Description */}
//             <div className="space-y-2">
//               <h3 className="text-sm font-medium text-gray-500">Description</h3>
//               {isEditMode ? (
//                 <Textarea
//                   name="description"
//                   value={editedTask.description}
//                   onChange={handleChange}
//                   className="min-h-[100px]"
//                   placeholder="Task Description"
//                 />
//               ) : (
//                 <p className="text-sm">{task.description}</p>
//               )}
//             </div>

//             {/* Project Information */}
//             <div className="space-y-2">
//               <h3 className="text-sm font-medium text-gray-500">Project</h3>
//               <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100">
//                 {projectId || "Unknown Project"}
//               </Badge>
//             </div>

//             {/* Epic and Milestone */}
//             <div className="grid grid-cols-2 gap-6">
//               <div className="space-y-2">
//                 <h3 className="text-sm font-medium text-gray-500">Epic</h3>
//                 {isEditMode && isSprintTask(task) ? (
//                   <Select
//                     value={editedTask.epicId || ""}
//                     onValueChange={handleEpicChange}
//                   >
//                     <SelectTrigger className="w-full">
//                       <SelectValue placeholder="Select an epic" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {epics.map((epic) => (
//                         <SelectItem key={epic.id} value={epic.id}>
//                           {epic.title}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 ) : (
//                   <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
//                     {getEpicTitle(task.epicId)}
//                   </Badge>
//                 )}
//               </div>
//               <div className="space-y-2">
//                 <h3 className="text-sm font-medium text-gray-500">Milestone</h3>
//                 {isEditMode ? (
//                   <Select
//                     value={editedTask.milestoneId || ""}
//                     onValueChange={handleMilestoneChange}
//                   >
//                     <SelectTrigger className="w-full">
//                       <SelectValue placeholder="Select a milestone" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="">None</SelectItem>
//                       {milestones.map((milestone) => (
//                         <SelectItem key={milestone.id} value={milestone.id}>
//                           {milestone.title}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 ) : (
//                   <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
//                     {getMilestoneTitle(task.milestoneId)}
//                   </Badge>
//                 )}
//               </div>
//             </div>

//             {/* Sprint-specific fields */}
//             {isSprintTask(task) && (
//               <div className="grid grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <h3 className="text-sm font-medium text-gray-500">Sprint</h3>
//                   {isEditMode && isSprintTask(editedTask) ? (
//                     <Input
//                       name="sprint"
//                       value={editedTask?.sprint}
//                       onChange={handleChange}
//                       placeholder="Sprint Name"
//                     />
//                   ) : (
//                     <Badge>{task.sprint}</Badge>
//                   )}
//                 </div>
//                 <div className="space-y-2">
//                   <h3 className="text-sm font-medium text-gray-500">
//                     Story Points
//                   </h3>
//                   {isEditMode && isSprintTask(editedTask) ? (
//                     <Input
//                       name="storyPoints"
//                       type="number"
//                       value={editedTask.storyPoints}
//                       onChange={handleStoryPointsChange}
//                       min="0"
//                       placeholder="Story Points"
//                     />
//                   ) : (
//                     <Badge
//                       variant="outline"
//                       className="flex items-center gap-1"
//                     >
//                       <BarChart2 className="h-3 w-3" />
//                       {task.storyPoints} pts
//                     </Badge>
//                   )}
//                 </div>
//               </div>
//             )}

//             {/* Due Date */}
//             <div className="space-y-2">
//               <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
//               {isEditMode ? (
//                 <Input
//                   name="date"
//                   value={editedTask.date}
//                   onChange={handleChange}
//                   placeholder="Due Date"
//                 />
//               ) : (
//                 <div className="flex items-center">
//                   <Calendar className="h-4 w-4 mr-2 text-gray-400" />
//                   <span className="text-sm">{task.date}</span>
//                 </div>
//               )}
//             </div>

//             {/* Status */}
//             <div className="space-y-2">
//               <h3 className="text-sm font-medium text-gray-500">Status</h3>
//               <div className="flex gap-2">
//                 <Select value={task.status} onValueChange={handleStatusChange}>
//                   <SelectTrigger className="w-full">
//                     <SelectValue placeholder="Select status" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {projectStatuses.map((status) => (
//                       <SelectItem key={status.id} value={status.name}>
//                         {status.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//                 {updateStatusMutation.isPending && (
//                   <span className="text-sm text-gray-500">Updating...</span>
//                 )}
//               </div>
//             </div>

//             {/* Progress Bar */}
//             <div className="space-y-2">
//               <div className="flex justify-between">
//                 <h3 className="text-sm font-medium text-gray-500">Progress</h3>
//                 <span className="text-sm font-medium">{currentProgress}%</span>
//               </div>
//               <Progress value={currentProgress} className="h-2" />
//               <div className="flex items-center gap-4 mt-2">
//                 <Input
//                   type="range"
//                   min="0"
//                   max="100"
//                   value={currentProgress}
//                   onChange={handleProgressChange}
//                   className="w-full"
//                 />
//                 <Button
//                   onClick={handleProgressUpdate}
//                   disabled={
//                     updateProgressMutation.isPending ||
//                     currentProgress === task.progress
//                   }
//                   size="sm"
//                 >
//                   {updateProgressMutation.isPending ? "Updating..." : "Update"}
//                 </Button>
//               </div>
//             </div>

//             {/* Tags */}
//             <div className="space-y-2">
//               <h3 className="text-sm font-medium text-gray-500">Tags</h3>
//               <div className="flex flex-wrap gap-2">
//                 {task.tags.map((tag, index) => (
//                   <Badge
//                     key={index}
//                     variant="secondary"
//                     className="flex items-center gap-1"
//                   >
//                     <Tag className="h-3 w-3" />
//                     {tag}
//                   </Badge>
//                 ))}
//               </div>
//             </div>

//             {/* Assignees */}
//             <div className="space-y-2">
//               <h3 className="text-sm font-medium text-gray-500">Assignees</h3>
//               <div className="flex -space-x-2">
//                 {task.assignees.map((assignee, index) => (
//                   <Avatar key={index} className="h-8 w-8 border-2 border-white">
//                     <AvatarImage src={assignee} />
//                     <AvatarFallback>{`U${index + 1}`}</AvatarFallback>
//                   </Avatar>
//                 ))}
//               </div>
//             </div>

//             {/* Metadata */}
//             <div className="grid grid-cols-2 gap-6 text-sm text-gray-500">
//               <div>
//                 <p className="flex items-center gap-1">
//                   <Clock className="h-4 w-4" />
//                   Created: {new Date(task.createdAt).toLocaleString()}
//                 </p>
//               </div>
//               <div>
//                 <p className="flex items-center gap-1">
//                   <Clock className="h-4 w-4" />
//                   Last Modified: {new Date(task.lastModified).toLocaleString()}
//                 </p>
//               </div>
//             </div>
//           </TabsContent>

//           <TabsContent value="activity" className="space-y-4">
//             <h3 className="font-medium">Activity History</h3>
//             <div className="space-y-4 max-h-[400px] overflow-y-auto">
//               {task.activityLog.length > 0 ? (
//                 [...task.activityLog]
//                   .sort(
//                     (a, b) =>
//                       new Date(b.timestamp).getTime() -
//                       new Date(a.timestamp).getTime()
//                   )
//                   .map((log) => (
//                     <div key={log.id} className="border-b pb-2">
//                       <p className="text-sm font-medium">
//                         {log.action.charAt(0).toUpperCase() +
//                           log.action.slice(1).replace(/_/g, " ")}
//                       </p>
//                       <p className="text-sm text-gray-500">{log.description}</p>
//                       <p className="text-xs text-gray-400">
//                         By: {log.userId} |{" "}
//                         {new Date(log.timestamp).toLocaleString()}
//                       </p>
//                     </div>
//                   ))
//               ) : (
//                 <p className="text-sm text-gray-500">No activity recorded.</p>
//               )}
//             </div>
//           </TabsContent>

//           <TabsContent value="attachments" className="space-y-4">
//             <div className="flex justify-between items-center">
//               <h3 className="font-medium">Attachments</h3>
//               <div>
//                 <input
//                   type="file"
//                   id="file-upload"
//                   className="hidden"
//                   onChange={handleFileUpload}
//                   disabled={uploadFileMutation.isPending}
//                 />
//                 <label htmlFor="file-upload">
//                   <Button
//                     asChild
//                     variant="outline"
//                     size="sm"
//                     disabled={uploadFileMutation.isPending}
//                   >
//                     <div className="cursor-pointer">
//                       <Plus className="h-4 w-4 mr-2" />
//                       {uploadFileMutation.isPending
//                         ? "Uploading..."
//                         : "Add File"}
//                     </div>
//                   </Button>
//                 </label>
//               </div>
//             </div>

//             {isLoadingFiles ? (
//               <p className="text-sm text-gray-500">Loading files...</p>
//             ) : taskFiles.length > 0 ? (
//               <div className="space-y-2 max-h-[400px] overflow-y-auto">
//                 {taskFiles.map((file) => (
//                   <div
//                     key={file.id}
//                     className="flex items-center justify-between p-3 border rounded-md"
//                   >
//                     <div className="flex items-center">
//                       {getFileIcon(file.mimetype)}
//                       <div>
//                         <p className="text-sm font-medium">
//                           {file.originalname}
//                         </p>
//                         <p className="text-xs text-gray-500">
//                           {(file.size / 1024).toFixed(2)} KB •{" "}
//                           {new Date(file.createdAt).toLocaleDateString()}
//                         </p>
//                       </div>
//                     </div>
//                     <div className="flex gap-2">
//                       <a
//                         href={getFileUrl(file)}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                       >
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           className="h-8 w-8 p-0"
//                         >
//                           <Download className="h-4 w-4" />
//                         </Button>
//                       </a>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         className="h-8 w-8 p-0 hover:text-red-500"
//                         onClick={() => handleDeleteFile(file.id)}
//                         disabled={deleteFileMutation.isPending}
//                       >
//                         <Trash2 className="h-4 w-4" />
//                       </Button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p className="text-sm text-gray-500">No attachments yet.</p>
//             )}
//           </TabsContent>
//         </Tabs>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default TaskDetailsModal;
