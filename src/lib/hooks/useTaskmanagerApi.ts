/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Task, TaskStatus } from "../types/taskManager/types";
import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateTask,
  updateTaskProgress,
  updateTaskStatus,
} from "../api/task-manager/taskApi";
import {
  createColumn,
  deleteColumn,
  getColumns,
  updateColumn,
} from "../api/task-manager/columnApi";
import {
  deleteFile,
  getTaskFiles,
  uploadFile,
} from "../api/task-manager/fileApi";
import { toast } from "@/hooks/use-toast";

export const useTaskManagerApi = () => {
  const queryClient = useQueryClient();

  //task queries
  const useTasksQuery = (category?: string, status?: TaskStatus) => {
    return useQuery({
      queryKey: ["tasks", category, status],
      queryFn: () => getTasks(category, status),
    });
  };

  const useTaskQuery = (id: string) => {
    return useQuery({
      queryKey: ["task", id],
      queryFn: () => getTaskById(id),
      enabled: !!id,
    });
  };

  //column queries
  const useColumnsQuery = () => {
    return useQuery({
      queryKey: ["columns"],
      queryFn: getColumns,
    });
  };

  // File queries
  const useTaskFilesQuery = (taskId: string) => {
    return useQuery({
      queryKey: ["taskFiles", taskId],
      queryFn: () => getTaskFiles(taskId),
      enabled: !!taskId,
    });
  };

  //Task Mutations
  const useCreateTaskMutation = () => {
    return useMutation({
      mutationFn: (newTask: any) => createTask(newTask),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        toast({
          title: "Task created",
          description: "Your task has been created successfully.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error creating task",
          description:
            error.message || "An error occurred while creating the task.",
          variant: "destructive",
        });
      },
    });
  };
  const useUpdateTaskMutation = () => {
    return useMutation({
      mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
        updateTask(id, updates),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["task", data?.id] });
        toast({
          title: "Task updated",
          description: "Your task has been updated successfully.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error updating task",
          description:
            error.message || "An error occurred while updating the task.",
          variant: "destructive",
        });
      },
    });
  };

  const useDeleteTaskMutation = () => {
    return useMutation({
      mutationFn: (id: string) => deleteTask(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        toast({
          title: "Task deleted",
          description: "Your task has been deleted successfully.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error deleting task",
          description:
            error.message || "An error occurred while deleting the task.",
          variant: "destructive",
        });
      },
    });
  };

  const useUpdateTaskStatusMutation = () => {
    return useMutation({
      mutationFn: ({ id, status }: { id: string; status: string }) =>
        updateTaskStatus(id, status),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["task", data?.id] });
        toast({
          title: "Status updated",
          description: `Task status has been updated to ${data?.status}.`,
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error updating status",
          description:
            error.message ||
            "An error occurred while updating the task status.",
          variant: "destructive",
        });
      },
    });
  };

  const useUpdateTaskProgressMutation = () => {
    return useMutation({
      mutationFn: ({ id, progress }: { id: string; progress: number }) =>
        updateTaskProgress(id, progress),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["task", data?.id] });
        toast({
          title: "Progress updated",
          description: `Task progress has been updated to ${data?.progress}%.`,
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error updating progress",
          description:
            error.message ||
            "An error occurred while updating the task progress.",
          variant: "destructive",
        });
      },
    });
  };

  // Column mutations
  const useCreateColumnMutation = () => {
    return useMutation({
      mutationFn: (title: string) => createColumn(title),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["columns"] });
        toast({
          title: "Column created",
          description: "Your column has been created successfully.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error creating column",
          description:
            error.message || "An error occurred while creating the column.",
          variant: "destructive",
        });
      },
    });
  };

  const useUpdateColumnMutation = () => {
    return useMutation({
      mutationFn: ({ id, title }: { id: string; title: string }) =>
        updateColumn(id, title),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["columns"] });
        toast({
          title: "Column updated",
          description: "Your column has been updated successfully.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error updating column",
          description:
            error.message || "An error occurred while updating the column.",
          variant: "destructive",
        });
      },
    });
  };

  const useDeleteColumnMutation = () => {
    return useMutation({
      mutationFn: (id: string) => deleteColumn(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["columns"] });
        toast({
          title: "Column deleted",
          description: "Your column has been deleted successfully.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error deleting column",
          description:
            error.message || "An error occurred while deleting the column.",
          variant: "destructive",
        });
      },
    });
  };

  // File mutations
  const useUploadFileMutation = () => {
    return useMutation({
      mutationFn: ({ taskId, file }: { taskId: string; file: File }) =>
        uploadFile(taskId, file),
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ["taskFiles", data?.taskId],
        });
        queryClient.invalidateQueries({ queryKey: ["task", data?.taskId] });
        toast({
          title: "File uploaded",
          description: "Your file has been uploaded successfully.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error uploading file",
          description:
            error.message || "An error occurred while uploading the file.",
          variant: "destructive",
        });
      },
    });
  };

  const useDeleteFileMutation = () => {
    return useMutation({
      mutationFn: (fileId: string) => deleteFile(fileId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["taskFiles"] });
        toast({
          title: "File deleted",
          description: "Your file has been deleted successfully.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error deleting file",
          description:
            error.message || "An error occurred while deleting the file.",
          variant: "destructive",
        });
      },
    });
  };

  return {
    useTasksQuery,
    useTaskQuery,
    useColumnsQuery,
    useTaskFilesQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useDeleteTaskMutation,
    useUpdateTaskStatusMutation,
    useUpdateTaskProgressMutation,
    useCreateColumnMutation,
    useUpdateColumnMutation,
    useDeleteColumnMutation,
    useUploadFileMutation,
    useDeleteFileMutation,
  };
};
