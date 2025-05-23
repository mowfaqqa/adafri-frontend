"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Project } from "@/lib/types/taskManager/types";
import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
import { AuthContext } from "../auth";

interface ProjectContextType {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  projectId: string | null;
  setProjectId: (id: string | null) => void;
  isProjectAdmin: boolean;
  isProjectMember: boolean;
  loading: boolean;
  currentUserId: string | null;
}

const ProjectContext = createContext<ProjectContextType>({
  currentProject: null,
  setCurrentProject: () => {},
  projectId: null,
  setProjectId: () => {},
  isProjectAdmin: false,
  isProjectMember: false,
  loading: true,
  currentUserId: null,
});

export const useProjectContext = () => useContext(ProjectContext);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Get auth context and task manager API
  const { user } = useContext(AuthContext);
  const { useProjectQuery } = useAuthAwareTaskManagerApi();

  // Get current user ID from auth context
  const currentUserId = user?.uid || null;

  // Only fetch project data if we have a projectId and user is authenticated
  const { data: project, isLoading: isProjectLoading } = useProjectQuery(
    projectId || ""
  );

  // Update currentProject when data is fetched
  useEffect(() => {
    if (project && projectId) {
      setCurrentProject(project);
      setLoading(false);
    } else if (!isProjectLoading && !project && projectId) {
      // Handle case where projectId is invalid
      setCurrentProject(null);
      setLoading(false);
    } else if (!currentUserId) {
      // User not authenticated
      setCurrentProject(null);
      setLoading(false);
    }
  }, [project, isProjectLoading, projectId, currentUserId]);

  // Check if current user is a project admin
  const isProjectAdmin = React.useMemo(() => {
    if (!currentProject || !currentUserId) return false;

    return currentProject.members.some(
      (member) => member.userId === currentUserId && member.role === "admin"
    );
  }, [currentProject, currentUserId]);

  // Check if current user is a project member
  const isProjectMember = React.useMemo(() => {
    if (!currentProject || !currentUserId) return false;

    return currentProject.members.some(
      (member) => member.userId === currentUserId
    );
  }, [currentProject, currentUserId]);

  // Check if we have a stored project in localStorage on mount
  useEffect(() => {
    if (currentUserId) {
      const storedProjectId = localStorage.getItem(
        `currentProjectId_${currentUserId}`
      );
      if (storedProjectId) {
        setProjectId(storedProjectId);
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [currentUserId]);

  // Update localStorage when projectId changes (scoped to user)
  useEffect(() => {
    if (currentUserId) {
      if (projectId) {
        localStorage.setItem(`currentProjectId_${currentUserId}`, projectId);
      } else {
        localStorage.removeItem(`currentProjectId_${currentUserId}`);
      }
    }
  }, [projectId, currentUserId]);

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        setCurrentProject,
        projectId,
        setProjectId,
        isProjectAdmin,
        isProjectMember,
        loading,
        currentUserId,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
