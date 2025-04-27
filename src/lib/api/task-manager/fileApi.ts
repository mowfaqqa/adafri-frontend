import taskApiClient from "./client";
interface FileAttachment {
  id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  taskId: string;
  url: string;
  secureUrl: string;
  publicId: string;
  resourceType?: string;
  format?: string;
  createdAt: string;
  updatedAt?: string;
}

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

// Get file URL - updated to use Cloudinary's secure URL
export const getFileUrl = (file: FileAttachment | string) => {
  // If the file is passed as a string (file ID), return the old-style URL for backward compatibility
  if (typeof file === "string") {
    return `${taskApiClient.defaults.baseURL}/files/${file}`;
  }

  // Use Cloudinary's secure URL if available
  return file.secureUrl || `${taskApiClient.defaults.baseURL}/files/${file.id}`;
};

// Delete file
export const deleteFile = async (fileId: string) => {
  const response = await taskApiClient.delete<ApiResponse<null>>(
    `/files/${fileId}`
  );
  return response.data.success;
};
