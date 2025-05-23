"use client";

import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";
import NewProjectForm from "./forms/NewProjectForm";

const ProjectSelect: React.FC = () => {
  const { projectId, setProjectId } = useProjectContext();
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);

  const { useProjectsQuery } = useAuthAwareTaskManagerApi();
  const { data: projects = [], isLoading } = useProjectsQuery();

  const handleProjectChange = (value: string) => {
    setProjectId(value);
  };

  const handleCreateNewProject = () => {
    setShowNewProjectDialog(true);
  };

  const handleProjectCreated = (newProjectId: string) => {
    setProjectId(newProjectId);
    setShowNewProjectDialog(false);
  };

  if (isLoading) {
    return (
      <div className="w-60 h-10 animate-pulse bg-gray-200 rounded-md"></div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={projectId || ""} onValueChange={handleProjectChange}>
        <SelectTrigger className="w-60">
          <SelectValue placeholder="Select a project" />
        </SelectTrigger>
        <SelectContent>
          {projects.length === 0 ? (
            <div className="p-2 text-center text-sm text-gray-500">
              No projects found
            </div>
          ) : (
            projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      <Dialog
        open={showNewProjectDialog}
        onOpenChange={setShowNewProjectDialog}
      >
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCreateNewProject}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
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

export default ProjectSelect;
