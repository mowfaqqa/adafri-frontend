// src/lib/api/task-manager/fileApi.ts
import taskApiClient from "./client";
import { FileAttachment } from "@/lib/types/taskManager/types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Upload file for a task within a project
export const uploadFile = async (
  projectId: string,
  taskId: string,
  file: File
) => {
  const formData = new FormData();
  formData.append("file", file);

  // For file uploads, we need to set different headers
  const response = await taskApiClient.post<ApiResponse<FileAttachment>>(
    `/projects/${projectId}/files/${taskId}/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data.data;
};

// Get all files for a task
export const getTaskFiles = async (projectId: string, taskId: string) => {
  const response = await taskApiClient.get<ApiResponse<FileAttachment[]>>(
    `/projects/${projectId}/files/${taskId}`
  );
  return response.data.data || [];
};

// Get file URL - updated to use Cloudinary's secure URL
export const getFileUrl = (file: FileAttachment | string) => {
  // If the file is passed as a string (file ID), return the old-style URL for backward compatibility
  if (typeof file === "string") {
    return `${taskApiClient.defaults.baseURL}/projects/any/files/file/${file}`;
  }

  // Use Cloudinary's secure URL if available
  return (
    file.secureUrl ||
    `${taskApiClient.defaults.baseURL}/projects/any/files/file/${file.id}`
  );
};

// Delete file
export const deleteFile = async (projectId: string, fileId: string) => {
  const response = await taskApiClient.delete<ApiResponse<null>>(
    `/projects/${projectId}/files/file/${fileId}`
  );
  return response.data.success;
};
