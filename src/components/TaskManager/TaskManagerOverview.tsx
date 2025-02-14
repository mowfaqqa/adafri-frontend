"use client";
import { useState } from "react";
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


const TaskManagerOverview = () => {
  const [activeTab, setActiveTab] = useState<TabType>("viewAll");
  const [columns, setColumns] = useState<Column[]>([
    { id: "todo", title: "To Do's" },
    { id: "inProgress", title: "In Progress" },
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    // Standard Task (Marketing)
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
      createdAt: "2024-02-01T10:00:00Z",
      lastModified: "2024-02-10T15:30:00Z",
      activityLog: [
        {
          id: "log1",
          timestamp: "2024-02-01T10:00:00Z",
          action: "created",
          description: "Task created",
          userId: "user1",
        },
      ],
    },

    // Sprint Task
    {
      id: "2",
      title: "User Authentication Flow",
      description: "Implement OAuth2 authentication flow for the application",
      status: "todo",
      date: "25 Sep, 2024",
      tags: ["development", "authentication"],
      assignees: ["/assets/Image-4.png"],
      category: "sprints",
      progress: 30,
      storyPoints: 8, // Added sprint-specific field
      sprint: "Sprint 2", // Added sprint-specific field
      createdAt: "2024-02-01T10:00:00Z",
      lastModified: "2024-02-10T15:30:00Z",
      activityLog: [
        {
          id: "log2",
          timestamp: "2024-02-01T10:00:00Z",
          action: "created",
          description: "Task created",
          userId: "user2",
        },
      ],
    },

    // Another Sprint Task
    {
      id: "3",
      title: "API Integration",
      description: "Integrate payment gateway API with error handling",
      status: "todo",
      date: "28 Sep, 2024",
      tags: ["backend", "integration"],
      assignees: ["/assets/Image-4.png"],
      category: "sprints",
      progress: 15,
      storyPoints: 13, // Added sprint-specific field
      sprint: "Sprint 2", // Added sprint-specific field
      createdAt: "2024-02-01T10:00:00Z",
      lastModified: "2024-02-10T15:30:00Z",
      activityLog: [
        {
          id: "log3",
          timestamp: "2024-02-01T10:00:00Z",
          action: "created",
          description: "Task created",
          userId: "user3",
        },
      ],
    },

    // Development Task
    {
      id: "4",
      title: "Performance Optimization",
      description: "Optimize application performance and reduce load times",
      status: "todo",
      date: "30 Sep, 2024",
      tags: ["development", "optimization"],
      assignees: ["/assets/Image-4.png"],
      category: "development",
      progress: 45,
      createdAt: "2024-02-01T10:00:00Z",
      lastModified: "2024-02-10T15:30:00Z",
      activityLog: [
        {
          id: "log4",
          timestamp: "2024-02-01T10:00:00Z",
          action: "created",
          description: "Task created",
          userId: "user4",
        },
      ],
    },

    // Sales Task
    {
      id: "5",
      title: "Q1 Sales Analysis",
      description: "Analyze Q1 sales data and prepare report",
      status: "todo",
      date: "1 Oct, 2024",
      tags: ["sales", "analysis"],
      assignees: ["/assets/Image-4.png"],
      category: "sales",
      progress: 80,
      createdAt: "2024-02-01T10:00:00Z",
      lastModified: "2024-02-10T15:30:00Z",
      activityLog: [
        {
          id: "log5",
          timestamp: "2024-02-01T10:00:00Z",
          action: "created",
          description: "Task created",
          userId: "user5",
        },
      ],
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

  // const handleDrop = (e: React.DragEvent, status: Task["status"]) => {
  //   e.preventDefault();
  //   const taskId = e.dataTransfer.getData("taskId");
  //   setTasks(
  //     tasks.map((task) => (task.id === taskId ? { ...task, status } : task))
  //   );
  // };
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
      createdAt: "2024-02-01T10:00:00Z",
      lastModified: "2024-02-10T15:30:00Z",
      activityLog: [
        {
          id: "log1",
          timestamp: "2024-02-01T10:00:00Z",
          action: "created",
          description: "Task created",
          userId: "user1",
        },
      ],
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
  const isSprintTask = (task: Task): task is SprintTask => {
    return task.category === "sprints";
  };

  const isStandardTask = (task: Task): task is StandardTask => {
    return task.category !== "sprints";
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
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
    <div className="w-80 bg-gray-50 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">{column.title}</h3>
        <Plus className="w-5 h-5 text-gray-500 cursor-pointer" />
      </div>

      <div className="space-y-4">
        {tasks
          .filter((task) => task.status === column.id)
          .map((task) => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task.id)}
            >
              {renderTask(task)}
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div>
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
