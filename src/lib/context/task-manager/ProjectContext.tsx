"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Project } from "@/lib/types/taskManager/types";
import { useTaskManagerApi } from "@/lib/hooks/useTaskmanagerApi";

interface ProjectContextType {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  projectId: string | null;
  setProjectId: (id: string | null) => void;
  isProjectAdmin: boolean;
  isProjectMember: boolean;
  loading: boolean;
}

const ProjectContext = createContext<ProjectContextType>({
  currentProject: null,
  setCurrentProject: () => {},
  projectId: null,
  setProjectId: () => {},
  isProjectAdmin: false,
  isProjectMember: false,
  loading: true,
});

export const useProjectContext = () => useContext(ProjectContext);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  const { useProjectQuery } = useTaskManagerApi();
  
  // Only fetch project data if we have a projectId
  const { data: project, isLoading: isProjectLoading } = useProjectQuery(projectId || "");
  
  // Update currentProject when data is fetched
  useEffect(() => {
    if (project && projectId) {
      setCurrentProject(project);
      setLoading(false);
    } else if (!isProjectLoading && !project && projectId) {
      // Handle case where projectId is invalid
      setCurrentProject(null);
      setLoading(false);
    }
  }, [project, isProjectLoading, projectId]);
  
  // Check if current user is a project admin or member
  const isProjectAdmin = React.useMemo(() => {
    if (!currentProject) return false;
    
    // In a real app, you would get the current user ID from auth context
    const currentUserId = "current-user-id"; // Replace with actual user ID
    
    return currentProject.members.some(
      member => member.userId === currentUserId && member.role === "admin"
    );
  }, [currentProject]);
  
  const isProjectMember = React.useMemo(() => {
    if (!currentProject) return false;
    
    // In a real app, you would get the current user ID from auth context
    const currentUserId = "current-user-id"; // Replace with actual user ID
    
    return currentProject.members.some(
      member => member.userId === currentUserId
    );
  }, [currentProject]);
  
  // Check if we have a stored project in localStorage on mount
  useEffect(() => {
    const storedProjectId = localStorage.getItem("currentProjectId");
    if (storedProjectId) {
      setProjectId(storedProjectId);
    } else {
      setLoading(false);
    }
  }, []);
  
  // Update localStorage when projectId changes
  useEffect(() => {
    if (projectId) {
      localStorage.setItem("currentProjectId", projectId);
    } else {
      localStorage.removeItem("currentProjectId");
    }
  }, [projectId]);
  
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
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};