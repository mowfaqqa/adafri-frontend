import taskApiClient from "./client";

// Type for File Attachment responses
interface FileAttachment {
  id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  taskId: string;
  createdAt: string;
  updatedAt?: string;
}

// Type for API response
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Upload file for a task
export const uploadFile = async (taskId: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  // For file uploads, we need to set different headers
  const response = await taskApiClient.post<ApiResponse<FileAttachment>>(
    `/files/upload/${taskId}`,
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
export const getTaskFiles = async (taskId: string) => {
  const response = await taskApiClient.get<ApiResponse<FileAttachment[]>>(
    `/files/task/${taskId}`
  );
  return response.data.data || [];
};

// Get file download URL
export const getFileUrl = (fileId: string) => {
  return `${taskApiClient.defaults.baseURL}/files/${fileId}`;
};

// Delete file
export const deleteFile = async (fileId: string) => {
  const response = await taskApiClient.delete<ApiResponse<null>>(
    `/files/${fileId}`
  );
  return response.data.success;
};
