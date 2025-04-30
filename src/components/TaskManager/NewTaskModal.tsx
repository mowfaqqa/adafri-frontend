"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import NewTaskForm from "./forms/NewTaskForm";
import CreateSprintForm from "./forms/CreateSprintForm";
import MarketingTaskForm from "./forms/MarketingTaskForm";
import { useState } from "react";
import { NewTaskFormData, TabType } from "@/lib/types/taskManager/types";
import { useTaskManagerApi } from "@/lib/hooks/useTaskmanagerApi";
import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";

interface NewTaskModalProps {
  activeTab: TabType;
  projectId: string;
}

const NewTaskModal: React.FC<NewTaskModalProps> = ({
  activeTab,
  projectId,
}) => {
  const [open, setOpen] = useState(false);
  const { useCreateTaskMutation } = useTaskManagerApi();
  const createTaskMutation = useCreateTaskMutation();
  const { currentProject } = useProjectContext();

  const handleSubmit = (formData: NewTaskFormData) => {
    if (!projectId) {
      return;
    }

    const taskData = {
      ...formData,
      status: formData.status || "todo",
    };

    createTaskMutation.mutate(
      { projectId, taskData },
      {
        onSuccess: () => {
          setOpen(false);
        },
      }
    );
  };

  // Don't show the button if no project is selected
  if (!projectId || !currentProject) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-teal-600 fixed bottom-8 md:right-[90px] shadow-lg ">
          <Plus className="w-4 h-4 mr-2" />
          New{" "}
          {activeTab === "sprints"
            ? "Sprint Task"
            : activeTab === "marketing"
            ? "Marketing Task"
            : "Task"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Create New{" "}
            {activeTab === "sprints"
              ? "Sprint Task"
              : activeTab === "marketing"
              ? "Marketing Task"
              : "Task"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {activeTab === "sprints" ? (
            <CreateSprintForm
              onSubmit={handleSubmit}
              isSubmitting={createTaskMutation.isPending}
              projectId={projectId}
            />
          ) : (
            <NewTaskForm
              onSubmit={handleSubmit}
              isSubmitting={createTaskMutation.isPending}
              projectId={projectId}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewTaskModal;
