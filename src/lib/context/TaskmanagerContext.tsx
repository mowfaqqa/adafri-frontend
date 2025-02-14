"use client";
import { createContext, useContext, ReactNode } from "react";
import { useTaskManager } from "../hooks/useTaskManager";
import { TaskManagerContextType } from "../types/taskManager/types";

const TaskManagerContext = createContext<TaskManagerContextType | undefined>(
  undefined
);

export const TaskManagerProvider = ({ children }: { children: ReactNode }) => {
  const taskManager = useTaskManager();

  return (
    <TaskManagerContext.Provider value={taskManager}>
      {children}
    </TaskManagerContext.Provider>
  );
};

export const useTaskManagerContext = () => {
  const context = useContext(TaskManagerContext);
  if (context === undefined) {
    throw new Error(
      "useTaskManagerContext must be used within a TaskManagerProvider"
    );
  }
  return context;
};
