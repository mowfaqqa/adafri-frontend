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
import { toast } from "sonner";

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
        toast("Your task has been created successfully.");
      },
      onError: (error: any) => {
        toast(error.message || "An error occurred while creating the task.");
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
        toast("Your task has been updated successfully.");
      },
      onError: (error: any) => {
        toast(error.message || "An error occurred while updating the task.");
      },
    });
  };

  const useDeleteTaskMutation = () => {
    return useMutation({
      mutationFn: (id: string) => deleteTask(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        toast("Your task has been deleted successfully.");
      },
      onError: (error: any) => {
        toast(error.message || "An error occurred while deleting the task.");
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
        toast(`Task status has been updated to ${data?.status}.`);
      },
      onError: (error: any) => {
        toast(
          error.message || "An error occurred while updating the task status."
        );
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
        toast(`Task progress has been updated to ${data?.progress}%.`);
      },
      onError: (error: any) => {
        toast(
          error.message || "An error occurred while updating the task progress."
        );
      },
    });
  };

  // Column mutations
  const useCreateColumnMutation = () => {
    return useMutation({
      mutationFn: (title: string) => createColumn(title),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["columns"] });
        toast("Your column has been created successfully.");
      },
      onError: (error: any) => {
        toast(error.message || "An error occurred while creating the column.");
      },
    });
  };

  const useUpdateColumnMutation = () => {
    return useMutation({
      mutationFn: ({ id, title }: { id: string; title: string }) =>
        updateColumn(id, title),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["columns"] });
        toast("Your column has been updated successfully.");
      },
      onError: (error: any) => {
        toast(error.message || "An error occurred while updating the column.");
      },
    });
  };

  const useDeleteColumnMutation = () => {
    return useMutation({
      mutationFn: (id: string) => deleteColumn(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["columns"] });
        toast("Your column has been deleted successfully.");
      },
      onError: (error: any) => {
        toast(error.message || "An error occurred while deleting the column.");
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
        toast("Your file has been uploaded successfully.");
      },
      onError: (error: any) => {
        toast(error.message || "An error occurred while uploading the file.");
      },
    });
  };

  const useDeleteFileMutation = () => {
    return useMutation({
      mutationFn: (fileId: string) => deleteFile(fileId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["taskFiles"] });
        toast("Your file has been deleted successfully.");
      },
      onError: (error: any) => {
        toast(error.message || "An error occurred while deleting the file.");
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
