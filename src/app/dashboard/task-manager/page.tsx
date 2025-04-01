import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import TaskManagerOverview from "@/components/TaskManager/TaskManagerOverview";
import { TaskManagerProvider } from "@/lib/context/TaskmanagerContext";
import React from "react";


const TaskManager = () => {
  return (
    <ProtectedRoute>
      <TaskManagerProvider>
        <TaskManagerOverview />
      </TaskManagerProvider>
    </ProtectedRoute>
  );
};

export default TaskManager;
