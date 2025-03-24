/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import NewTaskForm from "./forms/NewTaskForm";
import CreateSprintForm from "./forms/CreateSprintForm";
import MarketingTaskForm from "./forms/MarketingTaskForm";
import { useState } from "react";
import { NewTaskFormData, TabType } from "@/lib/types/taskManager/types";
import { useTaskManagerApi } from "@/lib/hooks/useTaskmanagerApi";

interface NewTaskModalProps {
  activeTab: TabType;
}
const NewTaskModal: React.FC<NewTaskModalProps> = ({ activeTab }) => {
  const [open, setOpen] = useState(false);
  const { useCreateTaskMutation } = useTaskManagerApi();
  const createTaskMutation = useCreateTaskMutation();

  const handleSubmit = (formData: NewTaskFormData) => {
    const taskData = {
      ...formData,
      status: formData.status || "todo",
    };

    createTaskMutation.mutate(taskData, {
      onSuccess: () => {
        setOpen(false);
      },
    });
  };
  return (
    <Dialog>
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
          {/* <NewTaskForm /> */}
          {activeTab === "sprints" ? (
            <CreateSprintForm
              onSubmit={handleSubmit}
              isSubmitting={createTaskMutation.isPending}
            />
          ) : activeTab === "marketing" ? (
            <MarketingTaskForm
            // onSubmit={handleSubmit}
            // isSubmitting={createTaskMutation.isPending}
            />
          ) : (
            <NewTaskForm
              onSubmit={handleSubmit}
              isSubmitting={createTaskMutation.isPending}
            />
          )}
          {/* <Button onClick={addNewTask}>Create Task</Button> */}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewTaskModal;
