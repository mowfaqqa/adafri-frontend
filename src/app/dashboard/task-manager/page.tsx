import React from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import ProjectDashboard from "@/components/TaskManager/ProjectDashboard";
import { ProjectProvider } from "@/lib/context/task-manager/ProjectContext";

const TaskManager = () => {
  return (
    // <ProtectedRoute>
      <ProjectProvider>
        <ProjectDashboard />
      </ProjectProvider>
    // </ProtectedRoute>
  );
};

export default TaskManager;
