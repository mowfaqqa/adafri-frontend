// src/lib/api/task-manager/projectApi.ts
import taskApiClient from "./client";
import {
  Project,
  ProjectFormData,
  ProjectMember,
  ProjectRole,
  ProjectStatus,
  ProjectTag,
} from "@/lib/types/taskManager/types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Get all projects for the current user
export const getProjects = async () => {
  const response = await taskApiClient.get<ApiResponse<Project[]>>("/projects");
  return response.data.data || [];
};

// Get project by ID
export const getProjectById = async (id: string) => {
  const response = await taskApiClient.get<ApiResponse<Project>>(
    `/projects/${id}`
  );
  return response.data.data;
};

// Create new project
export const createProject = async (projectData: ProjectFormData) => {
  const response = await taskApiClient.post<ApiResponse<Project>>(
    "/projects",
    projectData
  );
  return response.data.data;
};

// Update project
export const updateProject = async (
  id: string,
  updates: Partial<ProjectFormData>
) => {
  const response = await taskApiClient.put<ApiResponse<Project>>(
    `/projects/${id}`,
    updates
  );
  return response.data.data;
};

// Delete project
export const deleteProject = async (id: string) => {
  const response = await taskApiClient.delete<ApiResponse<null>>(
    `/projects/${id}`
  );
  return response.data.success;
};

// Project Members
export const addProjectMember = async (
  projectId: string,
  memberUserId: string,
  role: ProjectRole
) => {
  const response = await taskApiClient.post<ApiResponse<Project>>(
    `/projects/${projectId}/members`,
    {
      memberUserId,
      role,
    }
  );
  return response.data.data;
};

export const removeProjectMember = async (
  projectId: string,
  memberId: string
) => {
  const response = await taskApiClient.delete<ApiResponse<Project>>(
    `/projects/${projectId}/members/${memberId}`
  );
  return response.data.data;
};

export const updateMemberRole = async (
  projectId: string,
  memberId: string,
  role: ProjectRole
) => {
  const response = await taskApiClient.put<ApiResponse<Project>>(
    `/projects/${projectId}/members/${memberId}`,
    {
      role,
    }
  );
  return response.data.data;
};

// Project Tags
export const getProjectTags = async (projectId: string) => {
  const response = await taskApiClient.get<ApiResponse<ProjectTag[]>>(
    `/projects/${projectId}/tags`
  );
  return response.data.data || [];
};

export const createProjectTag = async (
  projectId: string,
  name: string,
  color: string
) => {
  const response = await taskApiClient.post<ApiResponse<ProjectTag>>(
    `/projects/${projectId}/tags`,
    {
      name,
      color,
    }
  );
  return response.data.data;
};

export const updateProjectTag = async (
  projectId: string,
  tagId: string,
  updates: Partial<ProjectTag>
) => {
  const response = await taskApiClient.put<ApiResponse<ProjectTag>>(
    `/projects/${projectId}/tags/${tagId}`,
    updates
  );
  return response.data.data;
};

export const deleteProjectTag = async (projectId: string, tagId: string) => {
  const response = await taskApiClient.delete<ApiResponse<null>>(
    `/projects/${projectId}/tags/${tagId}`
  );
  return response.data.success;
};

// Project Statuses
export const getProjectStatuses = async (projectId: string) => {
  const response = await taskApiClient.get<ApiResponse<ProjectStatus[]>>(
    `/projects/${projectId}/statuses`
  );
  return response.data.data || [];
};

export const createProjectStatus = async (
  projectId: string,
  name: string,
  color: string
) => {
  const response = await taskApiClient.post<ApiResponse<ProjectStatus>>(
    `/projects/${projectId}/statuses`,
    {
      name,
      color,
    }
  );
  return response.data.data;
};

export const updateProjectStatus = async (
  projectId: string,
  statusId: string,
  updates: Partial<ProjectStatus>
) => {
  const response = await taskApiClient.put<ApiResponse<ProjectStatus>>(
    `/projects/${projectId}/statuses/${statusId}`,
    updates
  );
  return response.data.data;
};

export const deleteProjectStatus = async (
  projectId: string,
  statusId: string
) => {
  const response = await taskApiClient.delete<ApiResponse<null>>(
    `/projects/${projectId}/statuses/${statusId}`
  );
  return response.data.success;
};

export const reorderProjectStatuses = async (
  projectId: string,
  statusIds: string[]
) => {
  const response = await taskApiClient.put<ApiResponse<ProjectStatus[]>>(
    `/projects/${projectId}/statuses/reorder`,
    {
      statusIds,
    }
  );
  return response.data.data;
};

// Enable public sharing for a project
export const enableProjectPublicSharing = async (projectId: string) => {
  const response = await taskApiClient.post<ApiResponse<{
    isPublicSharingEnabled: boolean;
    publicShareToken: string;
    publicUrl: string;
  }>>(`/projects/${projectId}/enable-public-sharing`);
  return response.data.data;
};

// Disable public sharing for a project
export const disableProjectPublicSharing = async (projectId: string) => {
  const response = await taskApiClient.post<ApiResponse<{
    isPublicSharingEnabled: boolean;
  }>>(`/projects/${projectId}/disable-public-sharing`);
  return response.data.data;
};

// Get public sharing status for a project
export const getProjectPublicSharingStatus = async (projectId: string) => {
  const response = await taskApiClient.get<ApiResponse<{
    isPublicSharingEnabled: boolean;
    publicShareToken?: string;
    publicUrl?: string;
  }>>(`/projects/${projectId}/public-sharing-status`);
  return response.data.data;
};