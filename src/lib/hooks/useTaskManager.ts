// hooks/useTaskManager.ts

import { useState, useEffect } from "react";
import {
  Task,
  Column,
  NewTaskFormData,
  TaskStatus,
  SprintTask,
  StandardTask,
  SprintTaskFormData,
  StandardTaskFormData,
} from "../types/taskManager/types";
import { toast } from "@/hooks/use-toast";

const STORAGE_KEY = "taskManager";

interface StorageData {
  tasks: Task[];
  columns: Column[];
}

const defaultColumns: Column[] = [
  { id: "todo", title: "To Do's" },
  { id: "inProgress", title: "In Progress" },
  { id: "done", title: "Done" },
];

export const useTaskManager = () => {
  // Initialize state from localStorage or defaults
  const [data, setData] = useState<StorageData>(() => {
    if (typeof window === "undefined")
      return { tasks: [], columns: defaultColumns };

    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : { tasks: [], columns: defaultColumns };
  });

  // Persist to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const createActivityLogEntry = (
    action: "created" | "updated" | "statusChanged" | "deleted",
    description: string
  ) => ({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    action,
    description,
    userId: "current-user", // Replace with actual user ID when implementing auth
  });

  const addTask = (formData: NewTaskFormData) => {
    const baseTask = {
      id: crypto.randomUUID(),
      title: formData.title,
      description: formData.description,
      status: formData.status,
      date: formData.date,
      tags: formData.tags.split(",").map((tag) => tag.trim()),
      assignees: formData.assignees,
      progress: formData.progress,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      activityLog: [createActivityLogEntry("created", "Task created")],
    };

    let newTask: Task;

    if (formData.category === "sprints") {
      newTask = {
        ...baseTask,
        category: "sprints",
        storyPoints: (formData as SprintTaskFormData).storyPoints,
        sprint: (formData as SprintTaskFormData).sprint,
      } as SprintTask;
    } else {
      newTask = {
        ...baseTask,
        category: (formData as StandardTaskFormData).category,
      } as StandardTask;
    }

    setData(
      (prev: StorageData): StorageData => ({
        ...prev,
        tasks: [...prev.tasks, newTask],
      })
    );

    toast({
      title: "Task Created",
      description: `"${formData.title}" has been created successfully.`,
    });
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setData((prev: StorageData): StorageData => {
      const updatedTasks = prev.tasks.map((task) => {
        if (task.id === taskId) {
          // Create updated task while preserving the correct type
          const updatedTask: Task =
            task.category === "sprints"
              ? ({
                  ...(task as SprintTask),
                  ...updates,
                  category: "sprints",
                  lastModified: new Date().toISOString(),
                  activityLog: [
                    ...task.activityLog,
                    createActivityLogEntry("updated", "Task updated"),
                  ],
                } as SprintTask)
              : ({
                  ...(task as StandardTask),
                  ...updates,
                  category: task.category,
                  lastModified: new Date().toISOString(),
                  activityLog: [
                    ...task.activityLog,
                    createActivityLogEntry("updated", "Task updated"),
                  ],
                } as StandardTask);

          return updatedTask;
        }
        return task;
      });

      return {
        ...prev,
        tasks: updatedTasks,
      };
    });

    toast({
      title: "Task Updated",
      description: "The task has been updated successfully.",
    });
  };

  const deleteTask = (taskId: string) => {
    setData(
      (prev: StorageData): StorageData => ({
        ...prev,
        tasks: prev.tasks.filter((task) => task.id !== taskId),
      })
    );

    toast({
      title: "Task Deleted",
      description: "The task has been deleted successfully.",
      variant: "destructive",
    });
  };

  const moveTask = (taskId: string, newStatus: TaskStatus) => {
    setData((prev: StorageData): StorageData => {
      const updatedTasks = prev.tasks.map((task) => {
        if (task.id === taskId) {
          const updatedTask: Task =
            task.category === "sprints"
              ? ({
                  ...(task as SprintTask),
                  status: newStatus,
                  lastModified: new Date().toISOString(),
                  activityLog: [
                    ...task.activityLog,
                    createActivityLogEntry(
                      "statusChanged",
                      `Status changed to ${newStatus}`
                    ),
                  ],
                } as SprintTask)
              : ({
                  ...(task as StandardTask),
                  status: newStatus,
                  lastModified: new Date().toISOString(),
                  activityLog: [
                    ...task.activityLog,
                    createActivityLogEntry(
                      "statusChanged",
                      `Status changed to ${newStatus}`
                    ),
                  ],
                } as StandardTask);

          return updatedTask;
        }
        return task;
      });

      return {
        ...prev,
        tasks: updatedTasks,
      };
    });

    toast({
      title: "Task Moved",
      description: `Task status updated to ${newStatus}`,
    });
  };

  const addColumn = (title: string) => {
    const columnId = title.toLowerCase().replace(/\s+/g, "-") as TaskStatus;

    setData(
      (prev: StorageData): StorageData => ({
        ...prev,
        columns: [...prev.columns, { id: columnId, title }],
      })
    );

    toast({
      title: "Column Added",
      description: `New column "${title}" has been added.`,
    });
  };

  return {
    tasks: data.tasks,
    columns: data.columns,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    addColumn,
  };
};
