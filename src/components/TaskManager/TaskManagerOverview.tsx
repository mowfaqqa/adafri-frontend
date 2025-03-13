/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import {
  Column,
  TabType,
  Task,
} from "@/lib/interfaces/TaskManager/task.interface";
import SprintTaskCard from "../Cards/SprintTaskCard";
import StandardTaskCard from "../Cards/StandardTaskCard";
import NewTaskModal from "./NewTaskModal";
import { SprintTask, StandardTask } from "@/lib/types/taskManager/types";
import { useTaskManagerApi } from "@/lib/hooks/useTaskmanagerApi";
import { toast } from "@/hooks/use-toast";

const TaskManagerOverview = () => {
  const [activeTab, setActiveTab] = useState<TabType>("viewAll");
  const [newColumn, setNewColumn] = useState("");
  const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);

  //API Hooks
  const {
    useTasksQuery,
    useColumnsQuery,
    useCreateColumnMutation,
    useUpdateTaskStatusMutation,
  } = useTaskManagerApi();
  //fetch tasks and columns
  const {
    data: tasks = [],
    isLoading: isLoadingTasks,
    error: tasksError,
  } = useTasksQuery(activeTab === "viewAll" ? undefined : activeTab);

  const {
    data: columns = [],
    isLoading: isLoadingColumns,
    error: columnsError,
  } = useColumnsQuery();

  // Set up mutations
  const createColumnMutation = useCreateColumnMutation();
  const updateTaskStatusMutation = useUpdateTaskStatusMutation();

  //handling loading nad error states
  useEffect(() => {
    if (tasksError) {
      toast({
        title: "Error loading tasks",
        description:
          "There was a problem loading your tasks. Please try again.",
        variant: "destructive",
      });
    }
    if (columnsError) {
      toast({
        title: "Error loading columns",
        description:
          "There was a problem loading your columns. Please try again.",
        variant: "destructive",
      });
    }
  }, [tasksError, columnsError]);

  //Add new column
  const addNewColumn = () => {
    if (newColumn.trim()) {
      createColumnMutation.mutate(newColumn, {
        onSuccess: () => {
          setNewColumn("");
          setShowNewColumnDialog(false);
        },
      });
    }
  };

  // Helper functions for task type discrimination
  const isSprintTask = (task: Task): task is SprintTask => {
    return task.category === "sprints";
  };

  const isStandardTask = (task: Task): task is StandardTask => {
    return task.category !== "sprints";
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");

    if (taskId) {
      updateTaskStatusMutation.mutate({ id: taskId, status });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const renderTask = (task: Task) => {
    if (isSprintTask(task)) {
      return <SprintTaskCard task={task} className="mb-4" />;
    }
    if (isStandardTask(task)) {
      return <StandardTaskCard task={task} className="mb-4" />;
    }
    return null;
  };

  const TaskColumn = ({ column, tasks }: { column: Column; tasks: Task[] }) => (
    <div
      className="w-80 rounded-lg px-4"
      onDrop={(e) => handleDrop(e, column.id)}
      onDragOver={handleDragOver}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">{column.title}</h3>
        <Plus className="w-5 h-5 text-gray-500 cursor-pointer" />
      </div>

      <div className="space-y-4">
        {tasks
          .filter(
            (task) =>
              task.status.toLowerCase() ===
              column.title?.split(" ").join("").toLowerCase()
          )
          .map((task) => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task.id as string)}
            >
              {renderTask(task)}
            </div>
          ))}
      </div>
    </div>
  );

  // Loading state
  if (isLoadingTasks || isLoadingColumns) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p>Loading task manager...</p>
      </div>
    );
  }
  return (
    <div className="w-full h-screen overflow-y-auto px-8 py-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6 ml-4">
          <div>
            <h1 className="text-2xl font-bold ">Task Manager</h1>
          </div>
          <div className="flex-grow" />
          <NewTaskModal activeTab={activeTab} />
        </div>

        <div className="flex gap-4 mb-6 ml-4  ">
          {[
            { id: "viewAll", label: "View All" },
            { id: "sprints", label: "Sprints" },
            { id: "marketing", label: "Marketing" },
            { id: "sales", label: "Sales" },
            { id: "development", label: "Development" },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              className={`px-4 ${
                activeTab === tab.id && "bg-white text-black"
              }`}
              onClick={() => setActiveTab(tab.id as TabType)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
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
                <span>Create a new list</span>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Column</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input
                placeholder="Column Name"
                value={newColumn}
                onChange={(e) => setNewColumn(e.target.value)}
              />
              <Button
                onClick={addNewColumn}
                disabled={createColumnMutation.isPending}
              >
                {createColumnMutation.isPending
                  ? "Creating..."
                  : "Create Column"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TaskManagerOverview;
