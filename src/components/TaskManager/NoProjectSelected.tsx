"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
import NewProjectForm from "./forms/NewProjectForm";
import ProjectSelect from "./ProjectSelect";
import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";

const NoProjectSelected: React.FC = () => {
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const { useProjectsQuery } = useAuthAwareTaskManagerApi();
  const { data: projects = [], isLoading } = useProjectsQuery();
  const { setProjectId } = useProjectContext();

  const handleProjectCreated = (newProjectId: string) => {
    setProjectId(newProjectId);
    setShowNewProjectDialog(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6">
      <img
        src="/icons/well-done.svg"
        alt="No Project Icon"
        className="w-80 h-50 mb-4"
      />

      <h2 className="text-2xl font-semibold mb-2">No Project Selected</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Select an existing project or create a new one to get started.
      </p>

      {!isLoading && projects.length > 0 && (
        <ProjectSelect />
      )}

      <Button
        onClick={() => setShowNewProjectDialog(true)}
        className="bg-blue-600 w-full max-w-sm hover:bg-blue-700 text-white"
      >
        Create New Project
      </Button>

      {projects.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground mt-4">
          You don't have any projects yet. Create your first project to get
          started.
        </p>
      )}

      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <NewProjectForm onSuccess={handleProjectCreated} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NoProjectSelected;
