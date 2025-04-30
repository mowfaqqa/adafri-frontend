import React from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import ProjectDashboard from "@/components/TaskManager/ProjectDashboard";
import TaskManagerOverview from "@/components/TaskManager/TaskManagerOverview";
import { ProjectProvider } from "@/lib/context/task-manager/ProjectContext";
import { TaskManagerProvider } from "@/lib/context/TaskmanagerContext";

const TaskManager = () => {
  return (
    <ProtectedRoute>
      <ProjectProvider>
        <ProjectDashboard />
      </ProjectProvider>
    </ProtectedRoute>
  );
};

export default TaskManager;
