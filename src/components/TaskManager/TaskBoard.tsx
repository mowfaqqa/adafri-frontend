"use client";

import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TabType, Task } from "@/lib/types/taskManager/types";
import { isSprintTask, isStandardTask } from "@/lib/types/taskManager/types";
import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
import { toast } from "sonner";
import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";
import SprintTaskCard from "../Cards/SprintTaskCard";
import StandardTaskCard from "../Cards/StandardTaskCard";
import { ColumnActionButtons } from "./buttons/ColumnActionButtons";
import NewTaskModal from "./NewTaskModal";

const TaskBoard: React.FC = () => {
  const { currentProject, projectId } = useProjectContext();
  const [activeTab, setActiveTab] = useState<TabType>("viewAll");
  const [newColumn, setNewColumn] = useState("");
  const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);

  const tabs = [
    { id: "viewAll", label: "View All" },
    { id: "sprints", label: "Sprints" },
    { id: "marketing", label: "Marketing" },
    { id: "sales", label: "Sales" },
    { id: "development", label: "Development" },
  ];

  // API Hooks
  const {
    useProjectTasksQuery,
    useProjectStatusesQuery,
    useCreateProjectStatusMutation,
    useUpdateTaskStatusMutation,
  } = useAuthAwareTaskManagerApi();

  // Fetch tasks and statuses for the current project
  const {
    data: tasks = [],
    isLoading: isLoadingTasks,
    error: tasksError,
  } = useProjectTasksQuery(
    projectId || "",
    activeTab === "viewAll" ? undefined : activeTab,
    undefined, // status
    undefined, // epicId
    undefined, // milestoneId
    undefined // assignee
  );

  const {
    data: columns = [],
    isLoading: isLoadingColumns,
    error: columnsError,
  } = useProjectStatusesQuery(projectId || "");

  // Set up mutations
  const createColumnMutation = useCreateProjectStatusMutation();
  const updateTaskStatusMutation = useUpdateTaskStatusMutation();

  // Handle loading and error states
  useEffect(() => {
    if (tasksError) {
      toast("There was a problem loading your tasks. Please try again.");
    }
    if (columnsError) {
      toast("There was a problem loading your columns. Please try again.");
    }
  }, [tasksError, columnsError]);

  // Add new column
  const addNewColumn = () => {
    if (newColumn.trim() && projectId) {
      // Default color for new columns
      const color = "#f3f4f6"; // Light gray

      createColumnMutation.mutate(
        { projectId, name: newColumn, color },
        {
          onSuccess: () => {
            setNewColumn("");
            setShowNewColumnDialog(false);
          },
        }
      );
    }
  };

  // Helper function for task type discrimination
  const renderTask = (task: Task) => {
    if (isSprintTask(task)) {
      return <SprintTaskCard task={task} className="mb-4" />;
    }
    if (isStandardTask(task)) {
      return <StandardTaskCard task={task} className="mb-4" />;
    }
    return null;
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");

    if (taskId && projectId) {
      updateTaskStatusMutation.mutate({
        projectId,
        taskId,
        status,
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Task column component
  const TaskColumn = ({ column, tasks }: { column: any; tasks: Task[] }) => {
    const tasksInColumn = tasks.filter(
      (task) => task?.status.toLowerCase() === column?.name.toLowerCase()
    );

    return (
      <div
        className="w-80 rounded-lg px-4"
        onDrop={(e) => handleDrop(e, column.name)}
        onDragOver={handleDragOver}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-semibold text-lg">{column.name}</h3>
            <p className="text-xs text-gray-500">
              {tasksInColumn.length} task{tasksInColumn.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <ColumnActionButtons
              column={column}
              onAddTask={() => {
                // Column-specific task creation
              }}
            />
          </div>
        </div>
        <div className="space-y-4 min-h-[100px]">
          {tasksInColumn.length > 0 ? (
            tasksInColumn.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id as string)}
              >
                {renderTask(task)}
              </div>
            ))
          ) : (
            <div className="h-24 border border-dashed border-gray-300 rounded-md flex items-center justify-center">
              <p className="text-sm text-gray-400">Drop tasks here</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoadingTasks || isLoadingColumns) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <p>Loading task board...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-grow" />
          <NewTaskModal activeTab={activeTab} projectId={projectId || ""} />
        </div>

        <div className="bg-gray-100 p-2 rounded-md inline-flex">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              className={`px-4 ${
                activeTab === tab.id ? "bg-white text-black" : ""
              }`}
              onClick={() => setActiveTab(tab.id as TabType)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-8">
        {columns.map((column: any) => (
          <TaskColumn key={column?.id} column={column} tasks={tasks} />
        ))}

        <Dialog
          open={showNewColumnDialog}
          onOpenChange={setShowNewColumnDialog}
        >
          <DialogTrigger asChild>
            <div className="w-80 bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <span>Create a new status</span>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input
                placeholder="Status Name"
                value={newColumn}
                onChange={(e) => setNewColumn(e.target.value)}
              />
              <Button
                onClick={addNewColumn}
                disabled={createColumnMutation.isPending}
              >
                {createColumnMutation.isPending
                  ? "Creating..."
                  : "Create Status"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TaskBoard;
