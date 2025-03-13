/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  NewTaskFormData,
  SprintTaskFormData,
  StandardTaskFormData,
  Task,
  TaskStatus,
} from "@/lib/types/taskManager/types";
import taskApiClient from "./client";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
const taskApi = taskApiClient;
//Get all tasks with optional filters
export const getTasks = async (category?: string, status?: TaskStatus) => {
  const params: Record<string, string> = {};
  if (category && category !== "viewAll") params.category = category;
  if (status) params.status = status;

  const response = await taskApi.get("/tasks", { params });
  return response.data?.data || [];
};

//get task by ID
// Get task by ID
export const getTaskById = async (id: string) => {
  const response = await taskApi.get<ApiResponse<Task>>(`/tasks/${id}`);
  return response.data.data;
};

// Create new task
export const createTask = async (formData: NewTaskFormData) => {
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

  const response = await taskApi.post("/tasks", taskData);
  return response.data.data;
};

// Update task
export const updateTask = async (id: string, updates: any) => {
  const response = await taskApi.put(`/tasks/${id}`, updates!);
  return response.data.data;
};

// Delete task
export const deleteTask = async (id: string) => {
  const response = await taskApi.delete(`/tasks/${id}`);
  return response.data.success;
};

// Update task status
export const updateTaskStatus = async (id: string, status: string) => {
  const response = await taskApi.patch(`/tasks/${id}/status`, { status });
  return response.data.data;
};

// Update task progress
export const updateTaskProgress = async (id: string, progress: number) => {
  const response = await taskApi.patch(`/tasks/${id}/progress`, { progress });
  return response.data.data;
};
