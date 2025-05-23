"use client";
import React from "react";
import ProjectDashboard from "@/components/TaskManager/ProjectDashboard";
import { ProjectProvider } from "@/lib/context/task-manager/ProjectContext";
import { AuthGuard } from "@/hooks/useAuth";

const TaskManager = () => {
  return (
    // <ProtectedRoute>
    <AuthGuard fallback={<div>Please log in to access this feature.</div>}>
      <ProjectProvider>
        <ProjectDashboard />
      </ProjectProvider>
    </AuthGuard>
    // </ProtectedRoute>
  );
};

export default TaskManager;
