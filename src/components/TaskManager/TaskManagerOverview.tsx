/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
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

// interface Task {
//   id: string;
//   title: string;
//   description: string;
//   status: "todo" | "inProgress" | "done";
//   date: string;
//   tags: string[];
//   assignees: string[];
// }
// interface Column {
//   id: any;
//   title: string;
// }
const TaskManagerOverview = () => {
  const [activeTab, setActiveTab] = useState<TabType>("viewAll");
  const [columns, setColumns] = useState<Column[]>([
    { id: "todo", title: "To Do's" },
    { id: "inProgress", title: "In Progress" },
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "CRM Dashboard",
      description: "Lorem lorem lorem",
      status: "inProgress",
      date: "25 Sep, 2024",
      tags: ["marketing", "crm"],
      assignees: ["/assets/Image-3.png"],
      category: "marketing",
      progress: 65,
    },
    {
      id: "2",
      title: "Orders",
      description:
        "Sales and marketing are two business functions within an organization.",
      status: "todo",
      date: "25 Sep, 2022",
      tags: ["marketing", "sales"],
      assignees: ["/assets/Image-4.png"],
      category: "sprints",
    },
    {
      id: "3",
      title: "Orders",
      description:
        "Sales and marketing are two business functions within an organization.",
      status: "todo",
      date: "25 Sep, 2022",
      tags: ["marketing", "sales"],
      assignees: ["/assets/Image-4.png"],
      category: "sprints",
    },
    {
      id: "4",
      title: "Marketing",
      description:
        "Sales and marketing are two business functions within an organization.",
      status: "todo",
      date: "25 Sep, 2022",
      tags: ["marketing", "sales"],
      assignees: ["/assets/Image-4.png"],
      category: "development",
    },
    {
      id: "5",
      title: "Development",
      description:
        "Sales and marketing are two business functions within an organization.",
      status: "todo",
      date: "25 Sep, 2022",
      tags: ["marketing", "sales"],
      assignees: ["/assets/Image-4.png"],
      category: "development",
    },
  ]);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    tags: "",
    storyPoints: "",
    sprint: "",
    progress: 0,
  });

  const [newColumn, setNewColumn] = useState("");
  const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);

  const filteredTasks = tasks.filter((task) =>
    activeTab === "viewAll" ? true : task.category === activeTab
  );

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = (e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    setTasks(
      tasks.map((task) => (task.id === taskId ? { ...task, status } : task))
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const addNewTask = () => {
    const task: Task = {
      id: Math.random().toString(),
      title: newTask.title,
      description: newTask.description,
      status: "todo",
      date: new Date().toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      category: activeTab === "viewAll" ? "marketing" : activeTab,
      progress: newTask.progress,
      ...(activeTab === "sprints" && {
        storyPoints: parseInt(newTask.storyPoints),
        sprint: newTask.sprint,
      }),
      tags: newTask.tags.split(",").map((tag) => tag.trim()),
      assignees: ["/assets/placeholder/32/32"],
    };
    setTasks([...tasks, task]);
    setNewTask({
      title: "",
      description: "",
      tags: "",
      storyPoints: "",
      sprint: "",
      progress: 0,
    });
  };

  const addNewColumn = () => {
    if (newColumn.trim()) {
      const columnId = newColumn.toLowerCase().replace(/\s+/g, "-");
      setColumns([...columns, { id: columnId, title: newColumn }]);
      setNewColumn("");
      setShowNewColumnDialog(false);
    }
  };
  const TaskColumn = ({ column, tasks }: { column: Column; tasks: Task[] }) => (
    <div
      className="w-80 bg-gray-50 rounded-lg p-4"
      onDrop={(e) => handleDrop(e, column.id)}
      onDragOver={handleDragOver}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">{column.title}</h3>
        <Plus className="w-5 h-5 text-gray-500 cursor-pointer" />
      </div>

      {tasks
        .filter((task) => task.status === column.id)
        .map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => handleDragStart(e, task.id)}
          >
            {activeTab === "sprints" ? (
              <SprintTaskCard task={task} />
            ) : (
              <StandardTaskCard task={task} />
            )}
          </div>
        ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div>
            <p className="mb-2 flex items-center p-1 gap-2 text-black underline">
              <ArrowLeft className="w-4 h-4" />
              go back to dashboard
            </p>
            <h1 className="text-2xl font-bold">Task Manager</h1>
          </div>
          <div className="flex-grow" />
          <NewTaskModal
            activeTab={activeTab}
            newTask={newTask}
            setNewTask={setNewTask}
            addNewTask={addNewTask}
          />
        </div>

        <div className="flex gap-4 mb-6">
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
              className="px-4"
              onClick={() => setActiveTab(tab.id as TabType)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        {columns.map((column) => (
          <TaskColumn key={column.id} column={column} tasks={filteredTasks} />
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
              <Button onClick={addNewColumn}>Create Column</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TaskManagerOverview;
