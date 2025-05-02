// src/lib/api/task-manager/taskApi.ts
import {
  NewTaskFormData,
  SprintTaskFormData,
  StandardTaskFormData,
  Task,
} from "@/lib/types/taskManager/types";
import taskApiClient from "./client";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

const taskApi = taskApiClient;

// Get all tasks for a project with optional filters
export const getProjectTasks = async (
  projectId: string,
  category?: string,
  status?: string,
  epicId?: string,
  milestoneId?: string,
  assignee?: string
) => {
  const params: Record<string, string> = {};

  if (category && category !== "viewAll") params.category = category;
  if (status) params.status = status;
  if (epicId) params.epicId = epicId;
  if (milestoneId) params.milestoneId = milestoneId;
  if (assignee) params.assignee = assignee;

  const response = await taskApi.get(`/projects/${projectId}/tasks`, {
    params,
  });
  return response.data?.data || [];
};

// Get tasks assigned to the current user across all projects
export const getMyTasks = async (status?: string) => {
  const params: Record<string, string> = {};
  if (status) params.status = status;

  const response = await taskApi.get(`/tasks/my-tasks`, { params });
  return response.data?.data || [];
};

// Get task by ID
export const getTaskById = async (projectId: string, taskId: string) => {
  const response = await taskApi.get<ApiResponse<Task>>(
    `/projects/${projectId}/tasks/${taskId}`
  );
  return response.data.data;
};

// Create new task
export const createTask = async (
  projectId: string,
  formData: NewTaskFormData
) => {
  const baseTask = {
    title: formData.title,
    description: formData.description,
    status: formData.status,
    date: formData.date,
    tags: Array.isArray(formData.tags)
      ? formData.tags
      : formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag !== ""),
    assignees: formData.assignees,
    progress: formData.progress,
    projectId: projectId,
    epicId: formData.epicId,
    milestoneId: formData.milestoneId,
  };

  let taskData;

  if (formData.category === "sprints") {
    const sprintData = formData as SprintTaskFormData;
    taskData = {
      ...baseTask,
      category: "sprints",
      storyPoints: sprintData.storyPoints,
      sprint: sprintData.sprint,
    };
  } else {
    const standardData = formData as StandardTaskFormData;
    taskData = {
      ...baseTask,
      category: standardData.category,
    };
  }

  const response = await taskApi.post(`/projects/${projectId}/tasks`, taskData);
  return response.data.data;
};

// Update task
export const updateTask = async (
  projectId: string,
  taskId: string,
  updates: any
) => {
  const response = await taskApi.put(
    `/projects/${projectId}/tasks/${taskId}`,
    updates!
  );
  return response.data.data;
};

// Delete task
export const deleteTask = async (projectId: string, taskId: string) => {
  const response = await taskApi.delete(
    `/projects/${projectId}/tasks/${taskId}`
  );
  return response.data.success;
};

// Update task status
export const updateTaskStatus = async (
  projectId: string,
  taskId: string,
  status: string
) => {
  const response = await taskApi.patch(
    `/projects/${projectId}/tasks/${taskId}/status`,
    { status }
  );
  return response.data.data;
};

// Update task progress
export const updateTaskProgress = async (
  projectId: string,
  taskId: string,
  progress: number
) => {
  const response = await taskApi.patch(
    `/projects/${projectId}/tasks/${taskId}/progress`,
    { progress }
  );
  return response.data.data;
};

// Update task assignees
export const updateTaskAssignees = async (
  projectId: string,
  taskId: string,
  assignees: string[]
) => {
  const response = await taskApi.patch(
    `/projects/${projectId}/tasks/${taskId}/assignees`,
    { assignees }
  );
  return response.data.data;
};
