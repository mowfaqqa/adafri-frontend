// src/lib/api/task-manager/epicMilestoneApi.ts
import taskApiClient from "./client";
import {
  Epic,
  Milestone,
  EpicFormData,
  MilestoneFormData,
  Task,
} from "@/lib/types/taskManager/types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Epic APIs
export const getEpics = async (projectId: string) => {
  const response = await taskApiClient.get<ApiResponse<Epic[]>>(
    `/projects/${projectId}/epics`
  );
  return response.data.data || [];
};

export const getEpicById = async (projectId: string, epicId: string) => {
  const response = await taskApiClient.get<ApiResponse<Epic>>(
    `/projects/${projectId}/epics/${epicId}`
  );
  return response.data.data;
};

export const createEpic = async (projectId: string, epicData: EpicFormData) => {
  const response = await taskApiClient.post<ApiResponse<Epic>>(
    `/projects/${projectId}/epics`,
    epicData
  );
  return response.data.data;
};

export const updateEpic = async (
  projectId: string,
  epicId: string,
  updates: Partial<EpicFormData>
) => {
  const response = await taskApiClient.put<ApiResponse<Epic>>(
    `/projects/${projectId}/epics/${epicId}`,
    updates
  );
  return response.data.data;
};

export const deleteEpic = async (projectId: string, epicId: string) => {
  const response = await taskApiClient.delete<ApiResponse<null>>(
    `/projects/${projectId}/epics/${epicId}`
  );
  return response.data.success;
};

export const getEpicTasks = async (projectId: string, epicId: string) => {
  const response = await taskApiClient.get<ApiResponse<Task[]>>(
    `/projects/${projectId}/epics/${epicId}/tasks`
  );
  return response.data.data || [];
};

export const updateEpicProgress = async (projectId: string, epicId: string) => {
  const response = await taskApiClient.put<ApiResponse<Epic>>(
    `/projects/${projectId}/epics/${epicId}/progress`,
    {}
  );
  return response.data.data;
};

// Milestone APIs
export const getMilestones = async (projectId: string) => {
  const response = await taskApiClient.get<ApiResponse<Milestone[]>>(
    `/projects/${projectId}/milestones`
  );
  return response.data.data || [];
};

export const getMilestoneById = async (
  projectId: string,
  milestoneId: string
) => {
  const response = await taskApiClient.get<ApiResponse<Milestone>>(
    `/projects/${projectId}/milestones/${milestoneId}`
  );
  return response.data.data;
};

export const createMilestone = async (
  projectId: string,
  milestoneData: MilestoneFormData
) => {
  const response = await taskApiClient.post<ApiResponse<Milestone>>(
    `/projects/${projectId}/milestones`,
    milestoneData
  );
  return response.data.data;
};

export const updateMilestone = async (
  projectId: string,
  milestoneId: string,
  updates: Partial<MilestoneFormData>
) => {
  const response = await taskApiClient.put<ApiResponse<Milestone>>(
    `/projects/${projectId}/milestones/${milestoneId}`,
    updates
  );
  return response.data.data;
};

export const deleteMilestone = async (
  projectId: string,
  milestoneId: string
) => {
  const response = await taskApiClient.delete<ApiResponse<null>>(
    `/projects/${projectId}/milestones/${milestoneId}`
  );
  return response.data.success;
};

export const getMilestoneTasks = async (
  projectId: string,
  milestoneId: string
) => {
  const response = await taskApiClient.get<ApiResponse<Task[]>>(
    `/projects/${projectId}/milestones/${milestoneId}/tasks`
  );
  return response.data.data || [];
};
