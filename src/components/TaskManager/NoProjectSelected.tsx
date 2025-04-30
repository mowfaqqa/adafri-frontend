"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTaskManagerApi } from "@/lib/hooks/useTaskmanagerApi";
import { Plus, FolderPlus } from "lucide-react";
import NewProjectForm from "./forms/NewProjectForm";
import ProjectSelect from "./ProjectSelect";
import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";

const NoProjectSelected: React.FC = () => {
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const { useProjectsQuery } = useTaskManagerApi();
  const { data: projects = [], isLoading } = useProjectsQuery();
  const { setProjectId } = useProjectContext();

  const handleProjectCreated = (newProjectId: string) => {
    setProjectId(newProjectId);
    setShowNewProjectDialog(false);
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md text-center mb-8">
        <FolderPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">No Project Selected</h1>
        <p className="text-gray-500 mb-6">
          Select an existing project or create a new one to get started
        </p>

        {isLoading ? (
          <div className="w-full h-10 animate-pulse bg-gray-200 rounded-md mb-4"></div>
        ) : projects.length > 0 ? (
          <div className="mb-4">
            <ProjectSelect />
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => setShowNewProjectDialog(true)}
            className="bg-teal-600 w-full"
          >
            <Plus className="w-4 h-4 mr-2" /> Create New Project
          </Button>

          {projects.length === 0 && !isLoading && (
            <p className="text-sm text-gray-500 mt-2">
              You don't have any projects yet. Create your first project to get
              started.
            </p>
          )}
        </div>
      </div>

      <Dialog
        open={showNewProjectDialog}
        onOpenChange={setShowNewProjectDialog}
      >
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
