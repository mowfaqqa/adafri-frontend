// TaskBoard with Trello UI Design - Fixed Cover Display
"use client";
import React, { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Check, X, Clock, Calendar, User, Tag, Sparkles, TrendingUp, Users, Code, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { TabType, Task, Column, isSprintTask, isStandardTask } from "@/lib/types/taskManager/types";
import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
import { toast } from "sonner";
import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";
import SprintTaskCard from "./Cards/SprintTaskCard";
import StandardTaskCard from "./Cards/StandardTaskCard";
import NewTaskModal from "./NewTaskModal";
import ProjectSelect from "./ProjectSelect";
import { DeleteColumnDialog } from "./modals/DeleteColumnDialog";
import AddColumnDialog from "./modals/AddColumnDialog";
import TaskDetailsModal from "./modals/TaskDetailsModal";
import { getFileUrl } from "@/lib/api/task-manager/fileApi";

interface ColumnData {
  id?: string;
  title: string;
  name: string;
  icon: {
    name: string;
    icon: React.ComponentType<any>;
  };
  gradient: string;
  color?: string;
}

interface CreateColumnPayload {
  projectId: string;
  name: string;
  color: string;
  icon: string;
  gradient: string;
}

interface UpdateColumnPayload {
  projectId: string;
  statusId: string;
  name: string;
}

const TaskBoard: React.FC = () => {
  const { currentProject, projectId } = useProjectContext();
  const [activeTab, setActiveTab] = useState<TabType>("viewAll");

  // States for column actions
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState("");
  
  // Task detail modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Tab configuration with Trello-style design
  const tabs = [
    { id: "viewAll", label: "View All", icon: Sparkles, gradient: "from-blue-500 to-cyan-500" },
    { id: "sprints", label: "Sprints", icon: Calendar, gradient: "from-green-500 to-emerald-500" },
    { id: "marketing", label: "Marketing", icon: TrendingUp, gradient: "from-orange-500 to-red-500" },
    { id: "sales", label: "Sales", icon: Users, gradient: "from-purple-500 to-pink-500" },
    { id: "development", label: "Development", icon: Code, gradient: "from-indigo-500 to-purple-500" },
  ];

  // API Hooks
  const {
    useProjectTasksQuery,
    useProjectStatusesQuery,
    useCreateProjectStatusMutation,
    useUpdateTaskStatusMutation,
    useDeleteProjectStatusMutation,
    useUpdateProjectStatusMutation,
    useUpdateTaskMutation,
    useTaskFilesQuery,
  } = useAuthAwareTaskManagerApi();

  // Fetch tasks and statuses for the current project
  const {
    data: tasks = [],
    isLoading: isLoadingTasks,
    error: tasksError,
    refetch: refetchTasks,
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
    refetch: refetchColumns,
  } = useProjectStatusesQuery(projectId || "");

  // Set up mutations
  const createColumnMutation = useCreateProjectStatusMutation();
  const updateTaskStatusMutation = useUpdateTaskStatusMutation();
  const deleteStatusMutation = useDeleteProjectStatusMutation();
  const updateStatusMutation = useUpdateProjectStatusMutation();
  const updateTaskMutation = useUpdateTaskMutation();

  // Handle loading and error states
  useEffect(() => {
    if (tasksError) {
      toast("There was a problem loading your tasks. Please try again.");
    }
    if (columnsError) {
      toast("There was a problem loading your columns. Please try again.");
    }
  }, [tasksError, columnsError]);

  // Force refetch when mutation is successful
  useEffect(() => {
    if (updateStatusMutation.isSuccess) {
      refetchColumns();
    }
  }, [updateStatusMutation.isSuccess, refetchColumns]);

  // Add new column handler
  const handleAddColumn = (columnData: ColumnData) => {
    if (projectId) {
      const payload: CreateColumnPayload = {
        projectId, 
        name: columnData.title, 
        color: columnData.gradient || "#f1f2f4",
        icon: columnData.icon?.name || "Circle",
        gradient: columnData.gradient
      };

      createColumnMutation.mutate(payload, {
        onSuccess: () => {
          toast.success(`Created new "${columnData.title}" column`);
          refetchColumns();
        },
        onError: () => {
          toast.error("Failed to create column. Please try again.");
        }
      });
    }
  };

  // Task completion toggle handler
  const handleTaskCompletion = (taskId: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    
    if (!projectId) return;
    
    // Determine new status based on current status
    const newStatus = currentStatus.toLowerCase() === 'done' || currentStatus.toLowerCase() === 'completed' 
      ? 'todo' 
      : 'done';
    
    updateTaskStatusMutation.mutate({
      projectId,
      taskId,
      status: newStatus,
    }, {
      onSuccess: () => {
        toast.success(`Task marked as ${newStatus === 'done' ? 'complete' : 'incomplete'}`);
        refetchTasks(); // Refetch to get updated task data
      },
      onError: () => {
        toast.error("Failed to update task status");
      }
    });
  };

  // Enhanced Task Card Component with Cover and Completion Toggle
  const TaskCardWrapper = ({ task }: { task: Task }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    // Check if task is completed
    const isCompleted = task.status.toLowerCase() === 'done' || task.status.toLowerCase() === 'completed';
    
    // Get task cover style - improved implementation
    const getTaskCoverStyle = () => {
      if (task.cover) {
        if (task.cover.type === 'gradient') {
          return {
            background: task.cover.value,
            backgroundImage: task.cover.value,
          };
        } else if (task.cover.type === 'image') {
          return {
            backgroundImage: `url(${task.cover.value})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          };
        }
      }
      return null;
    };

    const hasCustomCover = task.cover && (task.cover.type === 'gradient' || task.cover.type === 'image');
    const coverStyle = getTaskCoverStyle();

    const handleCardClick = () => {
      setSelectedTask(task);
      setShowTaskModal(true);
    };

    const cardContent = () => {
      if (isSprintTask(task)) {
        return (
          <SprintTaskCard 
            task={task} 
            className={`w-full h-full ${hasCustomCover ? 'text-white' : ''}`}
          />
        );
      }
      if (isStandardTask(task)) {
        return (
          <StandardTaskCard 
            task={task} 
            className="w-full h-full"
            coverStyle={coverStyle}
            // hasCustomCover={hasCustomCover}
          />
        );
      }
      return null;
    };

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, task.id as string)}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative rounded-lg border hover:shadow-md hover:border-blue-500 hover:border-2 transition-all cursor-pointer group overflow-hidden ${
          hasCustomCover ? 'border-transparent shadow-lg' : 'border-gray-200 shadow-sm bg-white'
        }`}
        style={{ 
          // Apply cover style to the wrapper when custom cover exists
          ...(hasCustomCover ? coverStyle : {}),
          boxShadow: hasCustomCover ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 0 rgba(9,30,66,.25)',
          borderRadius: '10px',
          minHeight: '60px',
        }}
      >
        {/* Completion Toggle - Shows on hover */}
        {isHovered && (
          <div className="absolute top-2 right-2 z-20">
            <Button
              onClick={(e) => handleTaskCompletion(task.id as string, task.status, e)}
              variant="ghost"
              size="sm"
              className={`h-6 w-6 p-0 rounded-full transition-all duration-200 ${
                isCompleted 
                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg' 
                  : 'bg-white/90 hover:bg-white border border-gray-300 text-gray-600 shadow-lg'
              }`}
              title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
            >
              {isCompleted ? (
                <Check className="h-3 w-3" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
            </Button>
          </div>
        )}

        {/* Dark overlay for better text readability on image/gradient covers */}
        {hasCustomCover && task.cover?.type === 'image' && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent rounded-lg z-5"></div>
        )}
        
        {/* Render the appropriate card component */}
        <div className={`relative z-10 w-full h-full ${hasCustomCover ? '' : 'bg-white rounded-lg'}`}>
          {cardContent()}
        </div>
      </div>
    );
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
      }, {
        onSuccess: () => {
          refetchTasks(); // Refetch to get updated task data
        }
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle column editing
  const handleEditColumn = (column: Column) => {
    setEditingColumnId(column.id);
    setEditingColumnName(column.name || (column as any).title || "");
  };

  const handleSaveColumnEdit = () => {
    if (!editingColumnId || !projectId || !editingColumnName.trim()) {
      toast.error("Please enter a valid column name");
      return;
    }

    updateStatusMutation.mutate(
      {
        projectId,
        statusId: editingColumnId,
        updates: {
          name: editingColumnName.trim(),
        },
      },
      {
        onSuccess: () => {
          setEditingColumnId(null);
          setEditingColumnName("");
          toast.success("Column updated successfully");
          refetchColumns();
        },
        onError: (error) => {
          console.error("Update error:", error);
          toast.error("Failed to update column. Please try again.");
        }
      }
    );
  };

  const handleCancelColumnEdit = () => {
    setEditingColumnId(null);
    setEditingColumnName("");
  };

  const handleDeleteColumn = (column: Column) => {
    const columnName = column.name || (column as any).title || "";
    if (["todo", "in progress", "done"].includes(columnName.toLowerCase())) {
      toast("Default statuses cannot be deleted.");
      return;
    }
    setSelectedColumn(column);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!selectedColumn || !projectId) {
      toast("Missing required information");
      return;
    }

    deleteStatusMutation.mutate(
      {
        projectId,
        statusId: selectedColumn.id,
      },
      {
        onSuccess: () => {
          setShowDeleteDialog(false);
          setSelectedColumn(null);
          refetchColumns();
        },
      }
    );
  };

  // Column Actions Component
  const ColumnActions = ({ column }: { column: Column }) => {
    const columnName = column.name || (column as any).title || "";
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32 bg-white border border-gray-200 shadow-lg rounded-sm">
          <DropdownMenuItem 
            onClick={() => handleDeleteColumn(column)}
            disabled={["todo", "in progress", "done"].includes(columnName.toLowerCase())}
            className="text-gray-700 hover:bg-gray-100 text-sm px-3 py-2"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Task column component - Trello Style
  const TaskColumn = ({ column, tasks }: { column: any; tasks: Task[] }) => {
    const columnName = column.name || column.title || "";
    const tasksInColumn = tasks.filter(
      (task) => task?.status.toLowerCase() === columnName.toLowerCase()
    );

    const isEditing = editingColumnId === column.id;

    return (
      <div
        className="w-72 flex-shrink-0 rounded-2xl p-2"
        onDrop={(e) => handleDrop(e, columnName)}
        onDragOver={handleDragOver}
        style={{ backgroundColor: '#ebecf0' }}
      >
        {/* Column Header */}
        <div className="flex justify-between items-center mb-2 px-2">
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-1">
                <Input
                  value={editingColumnName}
                  onChange={(e) => setEditingColumnName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveColumnEdit();
                    } else if (e.key === 'Escape') {
                      handleCancelColumnEdit();
                    }
                  }}
                  className="h-7 text-sm font-semibold text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white rounded-sm"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 rounded"
                  onClick={handleSaveColumnEdit}
                  disabled={updateStatusMutation.isPending}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 rounded"
                  onClick={handleCancelColumnEdit}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 
                  className="text-sm font-semibold text-gray-700 cursor-pointer hover:text-gray-900 font-sans"
                  onClick={() => handleEditColumn(column)}
                  title="Click to edit"
                  style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
                >
                  {columnName}
                </h3>
              </div>
            )}
          </div>
          {!isEditing && (
            <ColumnActions column={column} />
          )}
        </div>

        {/* Tasks Container - Trello style */}
        <ol className="space-y-2">
          {tasksInColumn.map((task, index) => (
            <li key={task.id}>
              <TaskCardWrapper task={task} />
            </li>
          ))}
        </ol>

        {/* Add Task Button */}
        <div className={tasksInColumn.length > 0 ? "mt-2" : "mt-1"}>
          <NewTaskModal 
            activeTab={activeTab} 
            projectId={projectId || ""} 
            defaultStatus={columnName}
            trigger={
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-600 hover:text-gray-800 hover:!bg-gray-400 transition-colors rounded-sm py-1.5 px-2 text-sm font-normal h-auto"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add a card
              </Button>
            }
          />
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoadingTasks || isLoadingColumns) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f1f2f4' }}>
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-500 animate-spin">
              <div className="absolute inset-1 bg-white rounded-full"></div>
            </div>
          </div>
          <p className="text-base font-normal text-gray-700">Loading board...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-4"
      style={{ 
        // backgroundColor: 'hsl(214,91.3%,95.5%)',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}
    >
      <div className="max-w-full mx-auto">
        {/* Header Section - Trello Style */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold text-gray-800 mb-2">
                {currentProject?.name || 'Project Board'}
              </h1>
              <ProjectSelect />
            </div>
          </div>

          {/* Enhanced Tab Navigation - Trello Style */}
          <div className="bg-white/70 backdrop-blur-sm p-1 rounded-lg border border-gray-200/50 overflow-x-auto shadow-sm">
            <div className="flex gap-1 min-w-max sm:min-w-0">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <Button
                    key={tab.id}
                    variant="ghost"
                    className={`relative px-3 py-2 rounded-md font-medium transition-all duration-200 whitespace-nowrap text-sm ${isActive
                        ? `bg-gradient-to-r ${tab.gradient} text-white shadow-md hover:shadow-lg`
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100/80"
                      }`}
                    onClick={() => setActiveTab(tab.id as TabType)}
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                      <span>{tab.label}</span>
                    </div>
                    {isActive && (
                      <div className="absolute inset-0 rounded-md bg-white/10"></div>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Task Board Container with horizontal scroll at bottom */}
        <div className="board-container">
          <div className="flex gap-3 overflow-x-auto pb-4 items-start board-scroll">
            {columns.map((column: any, index: number) => (
              <TaskColumn 
                key={`${column?.id}-${column?.name}-${column?.title}`}
                column={column} 
                tasks={tasks} 
              />
            ))}

            {/* Add New Column - Trello Style */}
            <div className="w-72 flex-shrink-0">
              <AddColumnDialog
                open={false}
                onOpenChange={() => {}}
                onAddColumn={(columnData: any) => handleAddColumn(columnData)}
                existingColumns={columns.map((col: any) => ({
                  id: col.id,
                  name: col.name || col.title,
                  title: col.title || col.name,
                  icon: col.icon,
                  gradient: col.gradient,
                  color: col.color
                }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedColumn && (
        <DeleteColumnDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          column={selectedColumn}
          projectId={projectId || ""}
          onConfirm={confirmDelete}
        />
      )}
      
      {/* Proper Task Detail Modal */}
      {selectedTask && (
        <TaskDetailsModal 
          task={selectedTask}
          isOpen={showTaskModal}
          onOpenChange={setShowTaskModal}
          onTaskUpdate={() => {
            // Refetch tasks when task is updated (including cover changes)
            refetchTasks();
          }}
        />
      )}

      {/* Trello-style custom scrollbar */}
      <style jsx>{`
        .board-container {
          position: relative;
        }

        .board-scroll::-webkit-scrollbar {
          height: 12px;
        }
        
        .board-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 6px;
        }
        
        .board-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(0,0,0,0.3);
          border-radius: 6px;
          border: 2px solid hsl(214,91.3%,95.5%);
        }
        
        .board-scroll::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0,0,0,0.5);
        }

        .board-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,0.3) rgba(255, 255, 255, 0.3);
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .group:hover {
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};

export default TaskBoard;
























































// TaskBoard with Trello UI Design - Latest Standard
// "use client";
// import React, { useState, useEffect } from "react";
// import { Plus, MoreHorizontal, Check, X, Clock, Calendar, User, Tag, Sparkles, TrendingUp, Users, Code } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Input } from "@/components/ui/input";
// import { TabType, Task, Column } from "@/lib/types/taskManager/types";
// import { isSprintTask, isStandardTask } from "@/lib/types/taskManager/types";
// import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
// import { toast } from "sonner";
// import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";
// import SprintTaskCard from "./Cards/SprintTaskCard";
// import StandardTaskCard from "./Cards/StandardTaskCard";
// import NewTaskModal from "./NewTaskModal";
// import ProjectSelect from "./ProjectSelect";
// import { DeleteColumnDialog } from "./modals/DeleteColumnDialog";
// import AddColumnDialog from "./modals/AddColumnDialog";
// import TaskDetailsModal from "./modals/TaskDetailsModal";
// import { getFileUrl } from "@/lib/api/task-manager/fileApi";

// interface ColumnData {
//   id?: string;
//   title: string;
//   name: string;
//   icon: {
//     name: string;
//     icon: React.ComponentType<any>;
//   };
//   gradient: string;
//   color?: string;
// }

// interface CreateColumnPayload {
//   projectId: string;
//   name: string;
//   color: string;
//   icon: string;
//   gradient: string;
// }

// interface UpdateColumnPayload {
//   projectId: string;
//   statusId: string;
//   name: string;
// }

// const TaskBoard: React.FC = () => {
//   const { currentProject, projectId } = useProjectContext();
//   const [activeTab, setActiveTab] = useState<TabType>("viewAll");

//   // States for column actions
//   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
//   const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);
//   const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
//   const [editingColumnName, setEditingColumnName] = useState("");
  
//   // Task detail modal state
//   const [selectedTask, setSelectedTask] = useState<Task | null>(null);
//   const [showTaskModal, setShowTaskModal] = useState(false);

//   // Tab configuration with Trello-style design
//   const tabs = [
//     { id: "viewAll", label: "View All", icon: Sparkles, gradient: "from-blue-500 to-cyan-500" },
//     { id: "sprints", label: "Sprints", icon: Calendar, gradient: "from-green-500 to-emerald-500" },
//     { id: "marketing", label: "Marketing", icon: TrendingUp, gradient: "from-orange-500 to-red-500" },
//     { id: "sales", label: "Sales", icon: Users, gradient: "from-purple-500 to-pink-500" },
//     { id: "development", label: "Development", icon: Code, gradient: "from-indigo-500 to-purple-500" },
//   ];

//   // API Hooks
//   const {
//     useProjectTasksQuery,
//     useProjectStatusesQuery,
//     useCreateProjectStatusMutation,
//     useUpdateTaskStatusMutation,
//     useDeleteProjectStatusMutation,
//     useUpdateProjectStatusMutation,
//   } = useAuthAwareTaskManagerApi();

//   // Fetch tasks and statuses for the current project
//   const {
//     data: tasks = [],
//     isLoading: isLoadingTasks,
//     error: tasksError,
//   } = useProjectTasksQuery(
//     projectId || "",
//     activeTab === "viewAll" ? undefined : activeTab,
//     undefined, // status
//     undefined, // epicId
//     undefined, // milestoneId
//     undefined // assignee
//   );

//   const {
//     data: columns = [],
//     isLoading: isLoadingColumns,
//     error: columnsError,
//     refetch: refetchColumns,
//   } = useProjectStatusesQuery(projectId || "");

//   // Set up mutations
//   const createColumnMutation = useCreateProjectStatusMutation();
//   const updateTaskStatusMutation = useUpdateTaskStatusMutation();
//   const deleteStatusMutation = useDeleteProjectStatusMutation();
//   const updateStatusMutation = useUpdateProjectStatusMutation();

//   // Handle loading and error states
//   useEffect(() => {
//     if (tasksError) {
//       toast("There was a problem loading your tasks. Please try again.");
//     }
//     if (columnsError) {
//       toast("There was a problem loading your columns. Please try again.");
//     }
//   }, [tasksError, columnsError]);

//   // Force refetch when mutation is successful
//   useEffect(() => {
//     if (updateStatusMutation.isSuccess) {
//       refetchColumns();
//     }
//   }, [updateStatusMutation.isSuccess, refetchColumns]);

//   // Add new column handler
//   const handleAddColumn = (columnData: ColumnData) => {
//     if (projectId) {
//       const payload: CreateColumnPayload = {
//         projectId, 
//         name: columnData.title, 
//         color: columnData.gradient || "#f1f2f4",
//         icon: columnData.icon?.name || "Circle",
//         gradient: columnData.gradient
//       };

//       createColumnMutation.mutate(payload, {
//         onSuccess: () => {
//           toast.success(`Created new "${columnData.title}" column`);
//           refetchColumns();
//         },
//         onError: () => {
//           toast.error("Failed to create column. Please try again.");
//         }
//       });
//     }
//   };

//   // Helper function for task type discrimination with card click handling
//   const renderTask = (task: Task) => {
//     const handleCardClick = () => {
//       setSelectedTask(task);
//       setShowTaskModal(true);
//     };

//     if (isSprintTask(task)) {
//       // For now, render inline card since we need onClick prop in card components
//       return (
//         <div
//           key={task.id}
//           onClick={handleCardClick}
//           className="mb-2"
//         >
//           <SprintTaskCard task={task} className="" />
//         </div>
//       );
//     }
//     if (isStandardTask(task)) {
//       // For now, render inline card since we need onClick prop in card components  
//       return (
//         <div
//           key={task.id}
//           onClick={handleCardClick}
//           className="mb-2"
//         >
//           <StandardTaskCard task={task} className="" />
//         </div>
//       );
//     }
//     return null;
//   };

//   // Component to get task cover image from uploaded files
//   const TaskCardWithImage = ({ task }: { task: Task }) => {
//     const { useTaskFilesQuery } = useAuthAwareTaskManagerApi();
    
//     // Fetch task files to get the cover image
//     const { data: taskFiles = [] } = useTaskFilesQuery(
//       projectId || "",
//       task.id as string
//     );

//     // Get the first image file as cover image
//     const coverImageFile = taskFiles.find(file => 
//       file.mimetype && file.mimetype.startsWith('image/')
//     );

//     const handleCardClick = () => {
//       setSelectedTask(task);
//       setShowTaskModal(true);
//     };

//     return (
//       <div
//         draggable
//         onDragStart={(e) => handleDragStart(e, task.id as string)}
//         onClick={handleCardClick}
//         className="bg-white rounded-sm shadow-sm border border-gray-200 p-3 hover:shadow-md hover:border-blue-500 hover:border-2 transition-all cursor-pointer group"
//         style={{ 
//           boxShadow: '0 1px 0 rgba(9,30,66,.25)',
//           borderRadius: '3px'
//         }}
//       >
//         {/* Task cover image from uploaded files */}
//         {coverImageFile && (
//           <div className="w-full h-20 mb-2 rounded-sm overflow-hidden">
//             <img 
//               src={getFileUrl(coverImageFile)} // Use the proper file URL helper
//               alt="Task cover"
//               className="w-full h-full object-cover"
//               onError={(e) => {
//                 // Hide image if it fails to load
//                 (e.target as HTMLImageElement).style.display = 'none';
//               }}
//             />
//           </div>
//         )}
        
//         {/* Labels/Tags at the top */}
//         {(task.tags && task.tags.length > 0) && (
//           <div className="flex flex-wrap gap-1 mb-2">
//             {task.tags.map((tag: string, idx: number) => (
//               <span 
//                 key={idx}
//                 className="px-2 py-1 text-xs rounded-sm bg-blue-100 text-blue-800 font-medium flex items-center gap-1"
//               >
//                 <Tag className="w-2.5 h-2.5" />
//                 {tag}
//               </span>
//             ))}
//           </div>
//         )}
        
//         {/* Task content */}
//         <div className="text-sm text-gray-800 font-normal leading-relaxed mb-2">
//           {task.title || 'Untitled Task'}
//         </div>
        
//         {task.description && (
//           <div className="text-xs text-gray-600 mb-2 line-clamp-2">
//             {task.description}
//           </div>
//         )}

//         {/* Progress bar if exists */}
//         {task.progress !== undefined && task.progress !== null && (
//           <div className="mb-2">
//             <div className="flex items-center justify-between mb-1">
//               <span className="text-xs text-gray-600">Progress</span>
//               <span className="text-xs text-gray-600">{task.progress}%</span>
//             </div>
//             <div className="w-full bg-gray-200 rounded-full h-1.5">
//               <div 
//                 className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
//                 style={{ width: `${task.progress}%` }}
//               ></div>
//             </div>
//           </div>
//         )}
        
//         {/* Task metadata (due date, assignee icons, etc.) */}
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             {(task.date || (task as any).dueDate) && (
//               <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-sm">
//                 <Calendar className="w-3 h-3" />
//                 <span>{new Date(task.date || (task as any).dueDate).toLocaleDateString()}</span>
//               </div>
//             )}
            
//             {(task as any).priority && (
//               <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-sm font-medium ${
//                 (task as any).priority === 'high' ? 'bg-red-100 text-red-700' :
//                 (task as any).priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
//                 'bg-green-100 text-green-700'
//               }`}>
//                 <span>!</span>
//                 {(task as any).priority.charAt(0).toUpperCase() + (task as any).priority.slice(1)}
//               </div>
//             )}
//           </div>
          
//         </div>
//       </div>
//     );
//   };

//   // Drag and drop handlers
//   const handleDragStart = (e: React.DragEvent, taskId: string) => {
//     e.dataTransfer.setData("taskId", taskId);
//   };

//   const handleDrop = (e: React.DragEvent, status: string) => {
//     e.preventDefault();
//     const taskId = e.dataTransfer.getData("taskId");

//     if (taskId && projectId) {
//       updateTaskStatusMutation.mutate({
//         projectId,
//         taskId,
//         status,
//       });
//     }
//   };

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//   };

//   // Handle column editing
//   // Handle column editing - restore inline editing
//   const handleEditColumn = (column: Column) => {
//     setEditingColumnId(column.id);
//     setEditingColumnName(column.name || (column as any).title || "");
//   };

//   const handleSaveColumnEdit = () => {
//     if (!editingColumnId || !projectId || !editingColumnName.trim()) {
//       toast.error("Please enter a valid column name");
//       return;
//     }

//     // Use the mutation parameters that match your API
//     updateStatusMutation.mutate(
//       {
//         projectId,
//         statusId: editingColumnId,
//         updates: {
//           name: editingColumnName.trim(),
//         },
//       },
//       {
//         onSuccess: () => {
//           setEditingColumnId(null);
//           setEditingColumnName("");
//           toast.success("Column updated successfully");
//           refetchColumns();
//         },
//         onError: (error) => {
//           console.error("Update error:", error);
//           toast.error("Failed to update column. Please try again.");
//         }
//       }
//     );
//   };

//   const handleCancelColumnEdit = () => {
//     setEditingColumnId(null);
//     setEditingColumnName("");
//   };

//   const handleDeleteColumn = (column: Column) => {
//     const columnName = column.name || (column as any).title || "";
//     if (["todo", "in progress", "done"].includes(columnName.toLowerCase())) {
//       toast("Default statuses cannot be deleted.");
//       return;
//     }
//     setSelectedColumn(column);
//     setShowDeleteDialog(true);
//   };

//   const confirmDelete = () => {
//     if (!selectedColumn || !projectId) {
//       toast("Missing required information");
//       return;
//     }

//     deleteStatusMutation.mutate(
//       {
//         projectId,
//         statusId: selectedColumn.id,
//       },
//       {
//         onSuccess: () => {
//           setShowDeleteDialog(false);
//           setSelectedColumn(null);
//           refetchColumns();
//         },
//       }
//     );
//   };

//   // Column Actions Component
//   const ColumnActions = ({ column }: { column: Column }) => {
//     const columnName = column.name || (column as any).title || "";
//     return (
//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button
//             size="sm"
//             variant="ghost"
//             className="h-6 w-6 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
//           >
//             <MoreHorizontal className="h-4 w-4" />
//           </Button>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent align="end" className="w-32 bg-white border border-gray-200 shadow-lg rounded-sm">
//           <DropdownMenuItem 
//             onClick={() => handleDeleteColumn(column)}
//             disabled={["todo", "in progress", "done"].includes(columnName.toLowerCase())}
//             className="text-gray-700 hover:bg-gray-100 text-sm px-3 py-2"
//           >
//             Delete
//           </DropdownMenuItem>
//         </DropdownMenuContent>
//       </DropdownMenu>
//     );
//   };

//   // Task column component - Trello Style
//   const TaskColumn = ({ column, tasks }: { column: any; tasks: Task[] }) => {
//     const columnName = column.name || column.title || "";
//     const tasksInColumn = tasks.filter(
//       (task) => task?.status.toLowerCase() === columnName.toLowerCase()
//     );

//     const isEditing = editingColumnId === column.id;

//     return (
//       <div
//         className="w-72 flex-shrink-0 rounded-2xl p-2"
//         onDrop={(e) => handleDrop(e, columnName)}
//         onDragOver={handleDragOver}
//         style={{ backgroundColor: '#ebecf0' }} // Trello column background
//       >
//         {/* Column Header */}
//         <div className="flex justify-between items-center mb-2 px-2">
//           <div className="flex-1">
//             {isEditing ? (
//               <div className="flex items-center gap-1">
//                 <Input
//                   value={editingColumnName}
//                   onChange={(e) => setEditingColumnName(e.target.value)}
//                   onKeyDown={(e) => {
//                     if (e.key === 'Enter') {
//                       handleSaveColumnEdit();
//                     } else if (e.key === 'Escape') {
//                       handleCancelColumnEdit();
//                     }
//                   }}
//                   className="h-7 text-sm font-semibold text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white rounded-sm"
//                   autoFocus
//                 />
//                 <Button
//                   size="sm"
//                   variant="ghost"
//                   className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 rounded"
//                   onClick={handleSaveColumnEdit}
//                   disabled={updateStatusMutation.isPending}
//                 >
//                   <Check className="h-3 w-3" />
//                 </Button>
//                 <Button
//                   size="sm"
//                   variant="ghost"
//                   className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 rounded"
//                   onClick={handleCancelColumnEdit}
//                 >
//                   <X className="h-3 w-3" />
//                 </Button>
//               </div>
//             ) : (
//               <div className="flex items-center gap-2">
//                 {/*radient background like Trello */}

//                 <h3 
//                   className="text-sm font-semibold text-gray-700 cursor-pointer hover:text-gray-900 font-sans"
//                   onClick={() => handleEditColumn(column)}
//                   title="Click to edit"
//                   style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
//                 >
//                   {columnName}
//                 </h3>
//               </div>
//             )}
//           </div>
//           {!isEditing && (
//             <ColumnActions column={column} />
//           )}
//         </div>

//         {/* Tasks Container - Trello style */}
//         <ol className="space-y-2">
//           {tasksInColumn.map((task, index) => (
//             <li key={task.id}>
//               <div
//                 draggable
//                 onDragStart={(e) => handleDragStart(e, task.id as string)}
//                 onClick={() => {
//                   setSelectedTask(task);
//                   setShowTaskModal(true);
//                 }}
//                 className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 hover:shadow-md hover:border-blue-500 hover:border-2 transition-all cursor-pointer group"
//                 style={{ 
//                   boxShadow: '0 1px 0 rgba(9,30,66,.25)',
//                   borderRadius: '10px'
//                 }}
//               >
              
                
                
//                 {/* Task content */}
//                 <div className="text-sm text-gray-800 font-normal leading-relaxed mb-2">
//                   {task.title || 'Untitled Task'}
//                 </div>
                
//                 {task.description && (
//                   <div className="text-xs text-gray-600 mb-2 line-clamp-2">
//                     {task.description}
//                   </div>
//                 )}

//                 {/* Progress bar if exists */}
//                 {task.progress !== undefined && task.progress !== null && (
//                   <div className="mb-2">
//                     <div className="flex items-center justify-between mb-1">
//                       <span className="text-xs text-gray-600">Progress</span>
//                       <span className="text-xs text-gray-600">{task.progress}%</span>
//                     </div>
//                     <div className="w-full bg-gray-200 rounded-full h-1.5">
//                       <div 
//                         className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
//                         style={{ width: `${task.progress}%` }}
//                       ></div>
//                     </div>
//                   </div>
//                 )}

//                 {/* Labels/Tags at the top */}
//                 {(task.tags && task.tags.length > 0) && (
//                   <div className="flex flex-wrap gap-1 mb-2">
//                     {task.tags.map((tag: string, idx: number) => (
//                       <span 
//                         key={idx}
//                         className="px-2 py-1 text-xs rounded-sm bg-blue-100 text-blue-800 font-medium flex items-center gap-1"
//                       >
//                         <Tag className="w-2.5 h-2.5" />
//                         {tag}
//                       </span>
//                     ))}
//                   </div>
//                 )}
                
                
//                 {/* Task metadata (due date, assignee icons, etc.) */}
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     {(task.date || (task as any).dueDate) && (
//                       <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-sm">
//                         <Calendar className="w-3 h-3" />
//                         <span>{new Date(task.date || (task as any).dueDate).toLocaleDateString()}</span>
//                       </div>
//                     )}
                    
//                     {(task as any).priority && (
//                       <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-sm font-medium ${
//                         (task as any).priority === 'high' ? 'bg-red-100 text-red-700' :
//                         (task as any).priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
//                         'bg-green-100 text-green-700'
//                       }`}>
//                         <span>!</span>
//                         {(task as any).priority.charAt(0).toUpperCase() + (task as any).priority.slice(1)}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </li>
//           ))}
//         </ol>

//         {/* Add Task Button - Always visible, positioned right after tasks/header */}
//         <div className={tasksInColumn.length > 0 ? "mt-2" : "mt-1"}>
//           <NewTaskModal 
//             activeTab={activeTab} 
//             projectId={projectId || ""} 
//             defaultStatus={columnName}
//             trigger={
//               <Button
//                 variant="ghost"
//                 className="w-full justify-start text-gray-600 hover:text-gray-800 hover:!bg-gray-400 transition-colors rounded-sm py-1.5 px-2 text-sm font-normal h-auto"
//               >
//                 <Plus className="w-4 h-4 mr-1" />
//                 Add a card
//               </Button>
//             }
//           />
//         </div>
//       </div>
//     );
//   };

//   // Loading state
//   if (isLoadingTasks || isLoadingColumns) {
//     return (
//       <div className="w-full min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f1f2f4' }}>
//         <div className="text-center space-y-4">
//           <div className="relative">
//             <div className="w-12 h-12 mx-auto rounded-full bg-blue-500 animate-spin">
//               <div className="absolute inset-1 bg-white rounded-full"></div>
//             </div>
//           </div>
//           <p className="text-base font-normal text-gray-700">Loading board...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div 
//       className="min-h-screen p-4"
//       style={{ 
//         backgroundColor: 'hsl(214,91.3%,95.5%)', // Trello's actual light blue background from CSS variables
//         fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
//       }}
//     >
//       <div className="max-w-full mx-auto">
//         {/* Header Section - Trello Style */}
//         <div className="mb-4">
//           <div className="flex items-center justify-between mb-4">
//             <div>
//               <h1 className="text-lg font-bold text-gray-800 mb-2">
//                 {currentProject?.name || 'Project Board'}
//               </h1>
//               <ProjectSelect />
//             </div>
//           </div>

//           {/* Enhanced Tab Navigation - Trello Style */}
//           <div className="bg-white/70 backdrop-blur-sm p-1 rounded-lg border border-gray-200/50 overflow-x-auto shadow-sm">
//             <div className="flex gap-1 min-w-max sm:min-w-0">
//               {tabs.map((tab) => {
//                 const IconComponent = tab.icon;
//                 const isActive = activeTab === tab.id;

//                 return (
//                   <Button
//                     key={tab.id}
//                     variant="ghost"
//                     className={`relative px-3 py-2 rounded-md font-medium transition-all duration-200 whitespace-nowrap text-sm ${isActive
//                         ? `bg-gradient-to-r ${tab.gradient} text-white shadow-md hover:shadow-lg`
//                         : "text-gray-600 hover:text-gray-800 hover:bg-gray-100/80"
//                       }`}
//                     onClick={() => setActiveTab(tab.id as TabType)}
//                   >
//                     <div className="flex items-center gap-2">
//                       <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
//                       <span>{tab.label}</span>
//                     </div>
//                     {isActive && (
//                       <div className="absolute inset-0 rounded-md bg-white/10"></div>
//                     )}
//                   </Button>
//                 );
//               })}
//             </div>
//           </div>
//         </div>

//         {/* Task Board Container with horizontal scroll at bottom */}
//         <div className="board-container">
//           <div className="flex gap-3 overflow-x-auto pb-4 items-start board-scroll">
//             {columns.map((column: any, index: number) => (
//               <TaskColumn 
//                 key={`${column?.id}-${column?.name}-${column?.title}`}
//                 column={column} 
//                 tasks={tasks} 
//               />
//             ))}

//             {/* Add New Column - Trello Style */}
//             <div className="w-72 flex-shrink-0">
//               <AddColumnDialog
//                 open={false}
//                 onOpenChange={() => {}}
//                 onAddColumn={(columnData: any) => handleAddColumn(columnData)}
//                 existingColumns={columns.map((col: any) => ({
//                   id: col.id,
//                   name: col.name || col.title,
//                   title: col.title || col.name,
//                   icon: col.icon,
//                   gradient: col.gradient,
//                   color: col.color
//                 }))}
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Modals */}
//       {selectedColumn && (
//         <DeleteColumnDialog
//           open={showDeleteDialog}
//           onOpenChange={setShowDeleteDialog}
//           column={selectedColumn}
//           projectId={projectId || ""}
//           onConfirm={confirmDelete}
//         />
//       )}
      
//       {/* Proper Task Detail Modal */}
//       {selectedTask && (
//         <TaskDetailsModal 
//           task={selectedTask}
//           isOpen={showTaskModal}
//           onOpenChange={setShowTaskModal}
//         />
//       )}

//       {/* Trello-style custom scrollbar */}
//       <style jsx>{`
//         /* Board container styling */
//         .board-container {
//           position: relative;
//         }

//         /* Trello-style scrollbar positioned at bottom */
//         .board-scroll::-webkit-scrollbar {
//           height: 12px;
//         }
        
//         .board-scroll::-webkit-scrollbar-track {
//           background: rgba(255, 255, 255, 0.3);
//           border-radius: 6px;
//         }
        
//         .board-scroll::-webkit-scrollbar-thumb {
//           background-color: rgba(0,0,0,0.3);
//           border-radius: 6px;
//           border: 2px solid hsl(214,91.3%,95.5%);
//         }
        
//         .board-scroll::-webkit-scrollbar-thumb:hover {
//           background-color: rgba(0,0,0,0.5);
//         }

//         /* Firefox scrollbar */
//         .board-scroll {
//           scrollbar-width: thin;
//           scrollbar-color: rgba(0,0,0,0.3) rgba(255, 255, 255, 0.3);
//         }

//         /* Text truncation for task cards */
//         .line-clamp-2 {
//           display: -webkit-box;
//           -webkit-line-clamp: 2;
//           -webkit-box-orient: vertical;
//           overflow: hidden;
//         }

//         /* Hover effect for task cards */
//         .group:hover {
//           transform: translateY(-1px);
//         }
//       `}</style>
//     </div>
//   );
// };

// export default TaskBoard;





















































































// Daniel UI Design System
// Latest Update: 2025-06-19
// "use client";

// import React, { useState, useEffect } from "react";
// import { Plus, Sparkles, Calendar, Users, Code, TrendingUp, MoreHorizontal, Check, X } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Input } from "@/components/ui/input";
// import { TabType, Task, Column } from "@/lib/types/taskManager/types";
// import { isSprintTask, isStandardTask } from "@/lib/types/taskManager/types";
// import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
// import { toast } from "sonner";
// import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";
// import SprintTaskCard from "./Cards/SprintTaskCard";
// import StandardTaskCard from "./Cards/StandardTaskCard";
// import NewTaskModal from "./NewTaskModal";
// import ProjectSelect from "./ProjectSelect";
// import { DeleteColumnDialog } from "./modals/DeleteColumnDialog";
// import AddColumnDialog from "./modals/AddColumnDialog";

// interface ColumnData {
//   id?: string;
//   title: string;
//   name: string;
//   icon: {
//     name: string;
//     icon: React.ComponentType<any>;
//   };
//   gradient: string;
//   color?: string;
// }

// // Type for API calls
// interface CreateColumnPayload {
//   projectId: string;
//   name: string;
//   color: string;
//   icon: string;
//   gradient: string;
// }

// interface UpdateColumnPayload {
//   projectId: string;
//   statusId: string;
//   name: string;
// }

// const TaskBoard: React.FC = () => {
//   const { currentProject, projectId } = useProjectContext();
//   const [activeTab, setActiveTab] = useState<TabType>("viewAll");

//   // States for column actions
//   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
//   const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);
//   const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
//   const [editingColumnName, setEditingColumnName] = useState("");

//   const tabs = [
//     { id: "viewAll", label: "View All", icon: Sparkles, gradient: "from-blue-500 to-cyan-500" },
//     { id: "sprints", label: "Sprints", icon: Calendar, gradient: "from-blue-500 to-cyan-500" },
//     { id: "marketing", label: "Marketing", icon: TrendingUp, gradient: "from-blue-500 to-cyan-500" },
//     { id: "sales", label: "Sales", icon: Users, gradient: "from-blue-500 to-cyan-500" },
//     { id: "development", label: "Development", icon: Code, gradient: "from-blue-500 to-cyan-500" },
//   ];

//   // API Hooks
//   const {
//     useProjectTasksQuery,
//     useProjectStatusesQuery,
//     useCreateProjectStatusMutation,
//     useUpdateTaskStatusMutation,
//     useDeleteProjectStatusMutation,
//     useUpdateProjectStatusMutation,
//   } = useAuthAwareTaskManagerApi();

//   // Fetch tasks and statuses for the current project
//   const {
//     data: tasks = [],
//     isLoading: isLoadingTasks,
//     error: tasksError,
//   } = useProjectTasksQuery(
//     projectId || "",
//     activeTab === "viewAll" ? undefined : activeTab,
//     undefined, // status
//     undefined, // epicId
//     undefined, // milestoneId
//     undefined // assignee
//   );

//   const {
//     data: columns = [],
//     isLoading: isLoadingColumns,
//     error: columnsError,
//     refetch: refetchColumns,
//   } = useProjectStatusesQuery(projectId || "");

//   // Set up mutations
//   const createColumnMutation = useCreateProjectStatusMutation();
//   const updateTaskStatusMutation = useUpdateTaskStatusMutation();
//   const deleteStatusMutation = useDeleteProjectStatusMutation();
//   const updateStatusMutation = useUpdateProjectStatusMutation();

//   // Handle loading and error states
//   useEffect(() => {
//     if (tasksError) {
//       toast("There was a problem loading your tasks. Please try again.");
//     }
//     if (columnsError) {
//       toast("There was a problem loading your columns. Please try again.");
//     }
//   }, [tasksError, columnsError]);

//   // Force refetch when mutation is successful
//   useEffect(() => {
//     if (updateStatusMutation.isSuccess) {
//       refetchColumns();
//     }
//   }, [updateStatusMutation.isSuccess, refetchColumns]);

//   // Add new column handler - Fixed type
//   const handleAddColumn = (columnData: ColumnData) => {
//     if (projectId) {
//       const payload: CreateColumnPayload = {
//         projectId, 
//         name: columnData.title, 
//         color: columnData.gradient || "#f3f4f6",
//         icon: columnData.icon?.name || "Circle",
//         gradient: columnData.gradient
//       };

//       createColumnMutation.mutate(payload, {
//         onSuccess: () => {
//           toast.success(`Created new "${columnData.title}" column`);
//           refetchColumns(); // Refetch to update the UI
//         },
//         onError: () => {
//           toast.error("Failed to create column. Please try again.");
//         }
//       });
//     }
//   };

//   // Helper function for task type discrimination
//   const renderTask = (task: Task) => {
//     if (isSprintTask(task)) {
//       return <SprintTaskCard task={task} className="mb-4" />;
//     }
//     if (isStandardTask(task)) {
//       return <StandardTaskCard task={task} className="mb-4" />;
//     }
//     return null;
//   };

//   // Drag and drop handlers
//   const handleDragStart = (e: React.DragEvent, taskId: string) => {
//     e.dataTransfer.setData("taskId", taskId);
//   };

//   const handleDrop = (e: React.DragEvent, status: string) => {
//     e.preventDefault();
//     const taskId = e.dataTransfer.getData("taskId");

//     if (taskId && projectId) {
//       updateTaskStatusMutation.mutate({
//         projectId,
//         taskId,
//         status,
//       });
//     }
//   };

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//   };

//   // Handle column editing
//   const handleEditColumn = (column: Column) => {
//     setEditingColumnId(column.id);
//     setEditingColumnName(column.name || column.title || "");
//   };

//   const handleSaveColumnEdit = () => {
//     if (!editingColumnId || !projectId || !editingColumnName.trim()) {
//       toast.error("Please enter a valid column name");
//       return;
//     }

//     const payload: UpdateColumnPayload = {
//       projectId,
//       statusId: editingColumnId,
//       name: editingColumnName.trim(),
//     };

//     updateStatusMutation.mutate(payload, {
//       onSuccess: () => {
//         setEditingColumnId(null);
//         setEditingColumnName("");
//         toast.success("Column updated successfully");
//         // Force refetch to ensure UI updates
//         refetchColumns();
//       },
//       onError: (error) => {
//         console.error("Update error:", error);
//         toast.error("Failed to update column. Please try again.");
//       }
//     });
//   };

//   const handleCancelColumnEdit = () => {
//     setEditingColumnId(null);
//     setEditingColumnName("");
//   };

//   const handleDeleteColumn = (column: Column) => {
//     const columnName = column.name || column.title || "";
//     if (["todo", "in progress", "done"].includes(columnName.toLowerCase())) {
//       toast("Default statuses cannot be deleted.");
//       return;
//     }
//     setSelectedColumn(column);
//     setShowDeleteDialog(true);
//   };

//   const confirmDelete = () => {
//     if (!selectedColumn || !projectId) {
//       toast("Missing required information");
//       return;
//     }

//     deleteStatusMutation.mutate(
//       {
//         projectId,
//         statusId: selectedColumn.id,
//       },
//       {
//         onSuccess: () => {
//           setShowDeleteDialog(false);
//           setSelectedColumn(null);
//           refetchColumns(); // Refetch to update the UI
//         },
//       }
//     );
//   };

//   // Column Actions Component
//   const ColumnActions = ({ column }: { column: Column }) => {
//     const columnName = column.name || column.title || "";
//     return (
//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button
//             size="icon"
//             variant="ghost"
//             className="h-6 w-6 rounded-full hover:bg-gray-200 transition-colors"
//           >
//             <MoreHorizontal className="h-4 w-4" />
//           </Button>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent align="end" className="w-40">
//           <DropdownMenuItem 
//             onClick={() => handleDeleteColumn(column)}
//             disabled={["todo", "in progress", "done"].includes(columnName.toLowerCase())}
//             className="text-red-600 focus:text-red-600"
//           >
//             Delete
//           </DropdownMenuItem>
//         </DropdownMenuContent>
//       </DropdownMenu>
//     );
//   };

//   // Task column component
//   const TaskColumn = ({ column, tasks }: { column: any; tasks: Task[] }) => {
//     const columnName = column.name || column.title || "";
//     const tasksInColumn = tasks.filter(
//       (task) => task?.status.toLowerCase() === columnName.toLowerCase()
//     );

//     const isEditing = editingColumnId === column.id;

//     // Get the icon component and gradient - Handle both icon types
//     let IconComponent;
//     if (typeof column.icon === 'function') {
//       IconComponent = column.icon;
//     } else if (column.icon && typeof column.icon === 'object' && column.icon.icon) {
//       IconComponent = column.icon.icon;
//     } else {
//       // Default icon
//       IconComponent = () => (
//         <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
//       );
//     }
    
//     const columnGradient = column.gradient || "from-blue-400 to-purple-500";

//     return (
//       <div
//         className="min-w-[250px] w-70 flex-shrink-0 group relative"
//         onDrop={(e) => handleDrop(e, columnName)}
//         onDragOver={handleDragOver}
//       >
//         <div className="bg-gray-100 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 transition-all shadow-sm duration-300 hover:-translate-y-1 pb-16">
//           <div className="flex justify-between items-center mb-4">
//             <div className="space-y-2 flex-1">
//               <div className="flex items-center gap-2">
//                 <div className={`w-6 h-6 bg-gradient-to-r ${columnGradient} rounded-lg flex items-center justify-center`}>
//                   <IconComponent className="w-4 h-4 text-white" />
//                 </div>
//                 {isEditing ? (
//                   <div className="flex items-center gap-2 flex-1">
//                     <Input
//                       value={editingColumnName}
//                       onChange={(e) => setEditingColumnName(e.target.value)}
//                       onKeyDown={(e) => {
//                         if (e.key === 'Enter') {
//                           handleSaveColumnEdit();
//                         } else if (e.key === 'Escape') {
//                           handleCancelColumnEdit();
//                         }
//                       }}
//                       className="h-7 text-sm font-bold text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
//                       autoFocus
//                     />
//                     <Button
//                       size="icon"
//                       variant="ghost"
//                       className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
//                       onClick={handleSaveColumnEdit}
//                       disabled={updateStatusMutation.isPending}
//                     >
//                       <Check className="h-3 w-3" />
//                     </Button>
//                     <Button
//                       size="icon"
//                       variant="ghost"
//                       className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
//                       onClick={handleCancelColumnEdit}
//                     >
//                       <X className="h-3 w-3" />
//                     </Button>
//                   </div>
//                 ) : (
//                   <h3 
//                     className="font-bold text-base text-gray-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300 cursor-pointer hover:underline"
//                     onClick={() => handleEditColumn(column)}
//                     title="Click to edit"
//                   >
//                     {columnName}
//                   </h3>
//                 )}
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="px-2 py-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full">
//                   <p className="text-xs font-semibold text-gray-600">
//                     {tasksInColumn.length} task{tasksInColumn.length !== 1 ? "s" : ""}
//                   </p>
//                 </div>
//               </div>
//             </div>
//             {!isEditing && (
//               <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
//                 <ColumnActions column={column} />
//               </div>
//             )}
//           </div>
          
//           <div className="space-y-3 min-h-[120px] mb-4">
//             {tasksInColumn.length > 0 ? (
//               tasksInColumn.map((task, index) => (
//                 <div
//                   key={task.id}
//                   draggable
//                   onDragStart={(e) => handleDragStart(e, task.id as string)}
//                   className="transform hover:scale-[1.02] transition-transform duration-200"
//                   style={{
//                     animationDelay: `${index * 100}ms`,
//                     animation: 'fadeInUp 0.5s ease-out forwards'
//                   }}
//                 >
//                   {renderTask(task)}
//                 </div>
//               ))
//             ) : (
//               <div className="h-20 border-2 border-dashed border-gray-300/60 rounded-xl flex items-center justify-center bg-gradient-to-br from-gray-50/50 to-gray-100/30 hover:from-blue-50/50 hover:to-purple-50/30 transition-all duration-300 group/drop">
//                 <div className="text-center space-y-1">
//                   <div className="w-6 h-6 mx-auto rounded-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center group-hover/drop:from-blue-400 group-hover/drop:to-purple-400 transition-all duration-300">
//                     <Plus className="w-3 h-3 text-white" />
//                   </div>
//                   <p className="text-xs text-gray-500 font-medium group-hover/drop:text-gray-700 transition-colors duration-300">
//                     Drop tasks here
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Add Task Button positioned at bottom center */}
//           <div className="absolute bottom-2 left-4 right-4">
//             <NewTaskModal 
//               activeTab={activeTab} 
//               projectId={projectId || ""} 
//               defaultStatus={columnName}
//               trigger={
//                 <Button
//                   variant="ghost"
//                   className="w-full justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-200 transition-colors duration-200 rounded-xl py-2 px-3 bg-transparent"
//                 >
//                   <Plus className="w-4 h-4 mr-2" />
//                   Add Task
//                 </Button>
//               }
//             />
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Loading state
//   if (isLoadingTasks || isLoadingColumns) {
//     return (
//       <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
//         <div className="text-center space-y-4">
//           <div className="relative">
//             <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-spin">
//               <div className="absolute inset-2 bg-white rounded-full"></div>
//             </div>
//           </div>
//           <p className="text-lg font-semibold text-gray-700 animate-pulse">Loading task board...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-100 p-4 sm:p-6 lg:p-8 rounded-2xl">
//       <div className="max-w-full mx-auto">
//         {/* Header Section */}
//         <div className="mb-8">
//           {/* Main Header with Title */}
//           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
//          <div className="flex-grow">
//            <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 mb-2">
//              Project Dashboard
//            </h1>
//            <ProjectSelect />
//          </div>
//        </div>

//           {/* Enhanced Tab Navigation */}
//           <div className="bg-white/80 backdrop-blur-sm p-2 rounded-2xl border border-gray-200/50 overflow-x-auto">
//             <div className="flex gap-2 min-w-max sm:min-w-0">
//               {tabs.map((tab) => {
//                 const IconComponent = tab.icon;
//                 const isActive = activeTab === tab.id;

//                 return (
//                   <Button
//                     key={tab.id}
//                     variant="ghost"
//                     className={`relative px-4 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap ${isActive
//                         ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg hover:shadow-xl transform hover:scale-105`
//                         : "text-gray-600 hover:text-gray-800 hover:bg-gray-100/50"
//                       }`}
//                     onClick={() => setActiveTab(tab.id as TabType)}
//                   >
//                     <div className="flex items-center gap-2">
//                       <IconComponent className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
//                       <span className="text-sm sm:text-base">{tab.label}</span>
//                     </div>
//                     {isActive && (
//                       <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>
//                     )}
//                   </Button>
//                 );
//               })}
//             </div>
//           </div>
//         </div>

//         {/* Task Board - Hidden scrollbar */}
//         <div className="custom-scrollbar-container flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto pb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
//           {columns.map((column: any, index: number) => (
//             <div
//               key={`${column?.id}-${column?.name}-${column?.title}`} // Force re-render on name change
//               style={{
//                 animationDelay: `${index * 150}ms`,
//                 animation: 'slideInFromBottom 0.6s ease-out forwards'
//               }}
//             >
//               <TaskColumn column={column} tasks={tasks} />
//             </div>
//           ))}

//           {/* Add New Column Component */}
//           <AddColumnDialog
//             open={false}
//             onOpenChange={() => {}}
//             onAddColumn={handleAddColumn}
//             existingColumns={columns as Column[]}
//           />
//         </div>
//       </div>

//       {/* Modals */}
//       {selectedColumn && (
//         <DeleteColumnDialog
//           open={showDeleteDialog}
//           onOpenChange={setShowDeleteDialog}
//           column={selectedColumn}
//           projectId={projectId || ""}
//           onConfirm={confirmDelete}
//         />
//       )}

//       {/* Custom Animations */}
//        <style jsx>{`
//         @keyframes fadeInUp {
//           from {
//             opacity: 0;
//             transform: translateY(20px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
        
//         @keyframes slideInFromBottom {
//           from {
//             opacity: 0;
//             transform: translateY(40px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
        
//         /* Custom scrollbar positioned at bottom - Mobile responsive */
//         .custom-scrollbar-container {
//           /* Firefox */
//           scrollbar-width: thin;
//           scrollbar-color: #d1d5db transparent;
//         }
        
//         /* WebKit browsers (Chrome, Safari, Edge) */
//         .custom-scrollbar-container::-webkit-scrollbar {
//           height: 6px; /* Thinner on mobile */
//         }
        
//         @media (min-width: 640px) {
//           .custom-scrollbar-container::-webkit-scrollbar {
//             height: 8px; /* Standard size on desktop */
//           }
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-track {
//           background: transparent;
//           border-radius: 4px;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-thumb {
//           background-color: #d1d5db;
//           border-radius: 4px;
//           opacity: 0.7;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-thumb:hover {
//           background-color: #9ca3af;
//         }
        
//         /* Ensure scrollbar appears at the bottom of content */
//         .custom-scrollbar-container::-webkit-scrollbar-corner {
//           background: transparent;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default TaskBoard;


























































// Latest Update: 2025-06-19
// "use client";

// import React, { useState, useEffect } from "react";
// import { Plus, Sparkles, Calendar, Users, Code, TrendingUp, MoreHorizontal, Check, X } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Input } from "@/components/ui/input";
// import { TabType, Task, Column } from "@/lib/types/taskManager/types";
// import { isSprintTask, isStandardTask } from "@/lib/types/taskManager/types";
// import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
// import { toast } from "sonner";
// import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";
// import SprintTaskCard from "./Cards/SprintTaskCard";
// import StandardTaskCard from "./Cards/StandardTaskCard";
// import NewTaskModal from "./NewTaskModal";
// import ProjectSelect from "./ProjectSelect";
// import { DeleteColumnDialog } from "./modals/DeleteColumnDialog";
// import AddColumnDialog from "./modals/AddColumnDialog";

// interface ColumnData {
//   id?: string;
//   title: string;
//   name: string;
//   icon: {
//     name: string;
//     icon: React.ComponentType<any>;
//   };
//   gradient: string;
//   color?: string;
// }

// const TaskBoard: React.FC = () => {
//   const { currentProject, projectId } = useProjectContext();
//   const [activeTab, setActiveTab] = useState<TabType>("viewAll");

//   // States for column actions
//   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
//   const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);
//   const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
//   const [editingColumnName, setEditingColumnName] = useState("");

//   const tabs = [
//     { id: "viewAll", label: "View All", icon: Sparkles, gradient: "from-blue-500 to-cyan-500" },
//     { id: "sprints", label: "Sprints", icon: Calendar, gradient: "from-blue-500 to-cyan-500" },
//     { id: "marketing", label: "Marketing", icon: TrendingUp, gradient: "from-blue-500 to-cyan-500" },
//     { id: "sales", label: "Sales", icon: Users, gradient: "from-blue-500 to-cyan-500" },
//     { id: "development", label: "Development", icon: Code, gradient: "from-blue-500 to-cyan-500" },
//   ];

//   // API Hooks
//   const {
//     useProjectTasksQuery,
//     useProjectStatusesQuery,
//     useCreateProjectStatusMutation,
//     useUpdateTaskStatusMutation,
//     useDeleteProjectStatusMutation,
//     useUpdateProjectStatusMutation,
//   } = useAuthAwareTaskManagerApi();

//   // Fetch tasks and statuses for the current project
//   const {
//     data: tasks = [],
//     isLoading: isLoadingTasks,
//     error: tasksError,
//   } = useProjectTasksQuery(
//     projectId || "",
//     activeTab === "viewAll" ? undefined : activeTab,
//     undefined, // status
//     undefined, // epicId
//     undefined, // milestoneId
//     undefined // assignee
//   );

//   const {
//     data: columns = [],
//     isLoading: isLoadingColumns,
//     error: columnsError,
//     refetch: refetchColumns,
//   } = useProjectStatusesQuery(projectId || "");

//   // Set up mutations
//   const createColumnMutation = useCreateProjectStatusMutation();
//   const updateTaskStatusMutation = useUpdateTaskStatusMutation();
//   const deleteStatusMutation = useDeleteProjectStatusMutation();
//   const updateStatusMutation = useUpdateProjectStatusMutation();

//   // Handle loading and error states
//   useEffect(() => {
//     if (tasksError) {
//       toast("There was a problem loading your tasks. Please try again.");
//     }
//     if (columnsError) {
//       toast("There was a problem loading your columns. Please try again.");
//     }
//   }, [tasksError, columnsError]);

//   // Add new column handler - Fixed type
//   const handleAddColumn = (columnData: ColumnData) => {
//     if (projectId) {
//       createColumnMutation.mutate(
//         { 
//           projectId, 
//           name: columnData.title, 
//           color: columnData.gradient || "#f3f4f6",
//           icon: columnData.icon.name || "Circle",
//           gradient: columnData.gradient
//         },
//         {
//           onSuccess: () => {
//             toast.success(`Created new "${columnData.title}" column`);
//             refetchColumns(); // Refetch to update the UI
//           },
//           onError: () => {
//             toast.error("Failed to create column. Please try again.");
//           }
//         }
//       );
//     }
//   };

//   // Helper function for task type discrimination
//   const renderTask = (task: Task) => {
//     if (isSprintTask(task)) {
//       return <SprintTaskCard task={task} className="mb-4" />;
//     }
//     if (isStandardTask(task)) {
//       return <StandardTaskCard task={task} className="mb-4" />;
//     }
//     return null;
//   };

//   // Drag and drop handlers
//   const handleDragStart = (e: React.DragEvent, taskId: string) => {
//     e.dataTransfer.setData("taskId", taskId);
//   };

//   const handleDrop = (e: React.DragEvent, status: string) => {
//     e.preventDefault();
//     const taskId = e.dataTransfer.getData("taskId");

//     if (taskId && projectId) {
//       updateTaskStatusMutation.mutate({
//         projectId,
//         taskId,
//         status,
//       });
//     }
//   };

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//   };

//   // Handle column editing
//   const handleEditColumn = (column: Column) => {
//     setEditingColumnId(column.id);
//     setEditingColumnName(column.name || column.title || "");
//   };

//   const handleSaveColumnEdit = () => {
//     if (!editingColumnId || !projectId || !editingColumnName.trim()) {
//       toast.error("Please enter a valid column name");
//       return;
//     }

//     updateStatusMutation.mutate(
//       {
//         projectId,
//         statusId: editingColumnId,
//         name: editingColumnName.trim(),
//       },
//       {
//         onSuccess: () => {
//           setEditingColumnId(null);
//           setEditingColumnName("");
//           toast.success("Column updated successfully");
//           refetchColumns(); // Refetch to update the UI immediately
//         },
//         onError: () => {
//           toast.error("Failed to update column. Please try again.");
//         }
//       }
//     );
//   };

//   const handleCancelColumnEdit = () => {
//     setEditingColumnId(null);
//     setEditingColumnName("");
//   };

//   const handleDeleteColumn = (column: Column) => {
//     const columnName = column.name || column.title || "";
//     if (["todo", "in progress", "done"].includes(columnName.toLowerCase())) {
//       toast("Default statuses cannot be deleted.");
//       return;
//     }
//     setSelectedColumn(column);
//     setShowDeleteDialog(true);
//   };

//   const confirmDelete = () => {
//     if (!selectedColumn || !projectId) {
//       toast("Missing required information");
//       return;
//     }

//     deleteStatusMutation.mutate(
//       {
//         projectId,
//         statusId: selectedColumn.id,
//       },
//       {
//         onSuccess: () => {
//           setShowDeleteDialog(false);
//           setSelectedColumn(null);
//           refetchColumns(); // Refetch to update the UI
//         },
//       }
//     );
//   };

//   // Column Actions Component
//   const ColumnActions = ({ column }: { column: Column }) => {
//     const columnName = column.name || column.title || "";
//     return (
//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button
//             size="icon"
//             variant="ghost"
//             className="h-6 w-6 rounded-full hover:bg-gray-200 transition-colors"
//           >
//             <MoreHorizontal className="h-4 w-4" />
//           </Button>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent align="end" className="w-40">
//           <DropdownMenuItem 
//             onClick={() => handleDeleteColumn(column)}
//             disabled={["todo", "in progress", "done"].includes(columnName.toLowerCase())}
//             className="text-red-600 focus:text-red-600"
//           >
//             Delete
//           </DropdownMenuItem>
//         </DropdownMenuContent>
//       </DropdownMenu>
//     );
//   };

//   // Task column component
//   const TaskColumn = ({ column, tasks }: { column: any; tasks: Task[] }) => {
//     const columnName = column.name || column.title || "";
//     const tasksInColumn = tasks.filter(
//       (task) => task?.status.toLowerCase() === columnName.toLowerCase()
//     );

//     const isEditing = editingColumnId === column.id;

//     // Get the icon component and gradient - Handle both icon types
//     let IconComponent;
//     if (typeof column.icon === 'function') {
//       IconComponent = column.icon;
//     } else if (column.icon && typeof column.icon === 'object' && column.icon.icon) {
//       IconComponent = column.icon.icon;
//     } else {
//       // Default icon
//       IconComponent = () => (
//         <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-green-500"></div>
//       );
//     }
    
//     const columnGradient = column.gradient || "from-blue-400 to-purple-500";

//     return (
//       <div
//         className="min-w-[272px] w-70 flex-shrink-0 group relative"
//         onDrop={(e) => handleDrop(e, columnName)}
//         onDragOver={handleDragOver}
//       >
//         <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-3 border border-gray-200/50 transition-all shadow-lg duration-300 hover:-translate-y-1 pb-16">
//           <div className="flex justify-between items-center mb-4">
//             <div className="space-y-2 flex-1">
//               <div className="flex items-center gap-2">
//                 <div className={`w-6 h-6 bg-gradient-to-r ${columnGradient} rounded-lg flex items-center justify-center`}>
//                   <IconComponent className="w-4 h-4 text-white" />
//                 </div>
//                 {isEditing ? (
//                   <div className="flex items-center gap-2 flex-1">
//                     <Input
//                       value={editingColumnName}
//                       onChange={(e) => setEditingColumnName(e.target.value)}
//                       onKeyDown={(e) => {
//                         if (e.key === 'Enter') {
//                           handleSaveColumnEdit();
//                         } else if (e.key === 'Escape') {
//                           handleCancelColumnEdit();
//                         }
//                       }}
//                       className="h-7 text-sm font-bold text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
//                       autoFocus
//                     />
//                     <Button
//                       size="icon"
//                       variant="ghost"
//                       className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
//                       onClick={handleSaveColumnEdit}
//                       disabled={updateStatusMutation.isPending}
//                     >
//                       <Check className="h-3 w-3" />
//                     </Button>
//                     <Button
//                       size="icon"
//                       variant="ghost"
//                       className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
//                       onClick={handleCancelColumnEdit}
//                     >
//                       <X className="h-3 w-3" />
//                     </Button>
//                   </div>
//                 ) : (
//                   <h3 
//                     className="font-bold text-base text-gray-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300 cursor-pointer hover:underline"
//                     onClick={() => handleEditColumn(column)}
//                     title="Click to edit"
//                   >
//                     {columnName}
//                   </h3>
//                 )}
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="px-2 py-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full">
//                   <p className="text-xs font-semibold text-gray-600">
//                     {tasksInColumn.length} task{tasksInColumn.length !== 1 ? "s" : ""}
//                   </p>
//                 </div>
//               </div>
//             </div>
//             {!isEditing && (
//               <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
//                 <ColumnActions column={column} />
//               </div>
//             )}
//           </div>
          
//           <div className="space-y-3 mb-2">
//             {tasksInColumn.length > 0 ? (
//               tasksInColumn.map((task, index) => (
//                 <div
//                   key={task.id}
//                   draggable
//                   onDragStart={(e) => handleDragStart(e, task.id as string)}
//                   className="transform hover:scale-[1.02] transition-transform duration-200"
//                   style={{
//                     animationDelay: `${index * 100}ms`,
//                     animation: 'fadeInUp 0.5s ease-out forwards'
//                   }}
//                 >
//                   {renderTask(task)}
//                 </div>
//               ))
//             ) : (
//               <div className="rounded-xl border-2 border-dashed border-transparent" />
//             )}
//           </div>

//           {/* Add Task Button positioned at bottom center */}
//           <div className="absolute bottom-2 left-4 right-4">
//             <NewTaskModal 
//               activeTab={activeTab} 
//               projectId={projectId || ""} 
//               defaultStatus={columnName}
//               trigger={
//                 <Button
//                   variant="ghost"
//                   className="w-full justify-center text-gray-600 hover:text-white hover:bg-blue-500 transition-colors duration-200 rounded-xl py-2 px-3 bg-transparent"
//                 >
//                   <Plus className="w-4 h-4 mr-2" />
//                   Add Task
//                 </Button>
//               }
//             />
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Loading state
//   if (isLoadingTasks || isLoadingColumns) {
//     return (
//       <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
//         <div className="text-center space-y-4">
//           <div className="relative">
//             <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-spin">
//               <div className="absolute inset-2 bg-white rounded-full"></div>
//             </div>
//           </div>
//           <p className="text-lg font-semibold text-gray-700 animate-pulse">Loading task board...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     // <div className="min-h-screen bg-gradient-to-br from-blue-100 p-4 sm:p-6 lg:p-8 rounded-2xl">
//     <div className="min-h-screen p-4 sm:p-6 lg:p-8 rounded-2xl">
//       <div className="max-w-full mx-auto">
//         {/* Header Section */}
//         <div className="mb-8">
//           {/* Main Header with Title */}
//           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
//          <div className="flex-grow">
//            <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 mb-2">
//              Project Dashboard
//            </h1>
//            <ProjectSelect />
//          </div>
//        </div>

//           {/* Enhanced Tab Navigation */}
//           <div className="bg-white/80 backdrop-blur-sm p-2 rounded-2xl border border-gray-200/50 overflow-x-auto">
//             <div className="flex gap-2 min-w-max sm:min-w-0">
//               {tabs.map((tab) => {
//                 const IconComponent = tab.icon;
//                 const isActive = activeTab === tab.id;

//                 return (
//                   <Button
//                     key={tab.id}
//                     variant="ghost"
//                     className={`relative px-4 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap ${isActive
//                         ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg hover:shadow-xl transform hover:scale-105`
//                         : "text-gray-600 hover:text-gray-800 hover:bg-gray-100/50"
//                       }`}
//                     onClick={() => setActiveTab(tab.id as TabType)}
//                   >
//                     <div className="flex items-center gap-2">
//                       <IconComponent className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
//                       <span className="text-sm sm:text-base">{tab.label}</span>
//                     </div>
//                     {isActive && (
//                       <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>
//                     )}
//                   </Button>
//                 );
//               })}
//             </div>
//           </div>
//         </div>

//         {/* Task Board - Hidden scrollbar */}
//         <div className="custom-scrollbar-container flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto pb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
//           {columns.map((column: any, index: number) => (
//             <div
//               key={column?.id}
//               style={{
//                 animationDelay: `${index * 150}ms`,
//                 animation: 'slideInFromBottom 0.6s ease-out forwards'
//               }}
//             >
//               <TaskColumn column={column} tasks={tasks} />
//             </div>
//           ))}

//           {/* Add New Column Component */}
//           <AddColumnDialog
//             open={false}
//             onOpenChange={() => {}}
//             onAddColumn={handleAddColumn}
//             existingColumns={columns}
//           />
//         </div>
//       </div>

//       {/* Modals */}
//       {selectedColumn && (
//         <DeleteColumnDialog
//           open={showDeleteDialog}
//           onOpenChange={setShowDeleteDialog}
//           column={selectedColumn}
//           projectId={projectId || ""}
//           onConfirm={confirmDelete}
//         />
//       )}

//       {/* Custom Animations */}
//        <style jsx>{`
//         @keyframes fadeInUp {
//           from {
//             opacity: 0;
//             transform: translateY(20px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
        
//         @keyframes slideInFromBottom {
//           from {
//             opacity: 0;
//             transform: translateY(40px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
        
//         /* Custom scrollbar positioned at bottom - Mobile responsive */
//         .custom-scrollbar-container {
//           /* Firefox */
//           scrollbar-width: thin;
//           scrollbar-color: #d1d5db transparent;
//         }
        
//         /* WebKit browsers (Chrome, Safari, Edge) */
//         .custom-scrollbar-container::-webkit-scrollbar {
//           height: 6px; /* Thinner on mobile */
//         }
        
//         @media (min-width: 640px) {
//           .custom-scrollbar-container::-webkit-scrollbar {
//             height: 8px; /* Standard size on desktop */
//           }
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-track {
//           background: transparent;
//           border-radius: 4px;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-thumb {
//           background-color: #d1d5db;
//           border-radius: 4px;
//           opacity: 0.7;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-thumb:hover {
//           background-color: #9ca3af;
//         }
        
//         /* Ensure scrollbar appears at the bottom of content */
//         .custom-scrollbar-container::-webkit-scrollbar-corner {
//           background: transparent;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default TaskBoard;
























































// // Latest Update: 2025-06-04
// "use client";

// import React, { useState, useEffect } from "react";
// import { Plus, Sparkles, Calendar, Users, Code, TrendingUp, MoreHorizontal } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Input } from "@/components/ui/input";
// import { TabType, Task, Column } from "@/lib/types/taskManager/types";
// import { isSprintTask, isStandardTask } from "@/lib/types/taskManager/types";
// import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
// import { toast } from "sonner";
// import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";
// import SprintTaskCard from "./Cards/SprintTaskCard";
// import StandardTaskCard from "./Cards/StandardTaskCard";
// import NewTaskModal from "./NewTaskModal";
// import ProjectSelect from "./ProjectSelect";
// import { DeleteColumnDialog } from "./modals/DeleteColumnDialog";
// import { EditColumnDialog } from "./modals/EditColumnDialog";

// const TaskBoard: React.FC = () => {
//   const { currentProject, projectId } = useProjectContext();
//   const [activeTab, setActiveTab] = useState<TabType>("viewAll");
//   const [newColumn, setNewColumn] = useState("");
//   const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);

//   // States for column actions
//   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
//   const [showEditDialog, setShowEditDialog] = useState(false);
//   const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);

//   const tabs = [
//     { id: "viewAll", label: "View All", icon: Sparkles, gradient: "from-blue-500 to-cyan-500" },
//     { id: "sprints", label: "Sprints", icon: Calendar, gradient: "from-blue-500 to-cyan-500" },
//     { id: "marketing", label: "Marketing", icon: TrendingUp, gradient: "from-blue-500 to-cyan-500" },
//     { id: "sales", label: "Sales", icon: Users, gradient: "from-blue-500 to-cyan-500" },
//     { id: "development", label: "Development", icon: Code, gradient: "from-blue-500 to-cyan-500" },
//   ];

//   // API Hooks
//   const {
//     useProjectTasksQuery,
//     useProjectStatusesQuery,
//     useCreateProjectStatusMutation,
//     useUpdateTaskStatusMutation,
//     useDeleteProjectStatusMutation,
//   } = useAuthAwareTaskManagerApi();

//   // Fetch tasks and statuses for the current project
//   const {
//     data: tasks = [],
//     isLoading: isLoadingTasks,
//     error: tasksError,
//   } = useProjectTasksQuery(
//     projectId || "",
//     activeTab === "viewAll" ? undefined : activeTab,
//     undefined, // status
//     undefined, // epicId
//     undefined, // milestoneId
//     undefined // assignee
//   );

//   const {
//     data: columns = [],
//     isLoading: isLoadingColumns,
//     error: columnsError,
//   } = useProjectStatusesQuery(projectId || "");

//   // Set up mutations
//   const createColumnMutation = useCreateProjectStatusMutation();
//   const updateTaskStatusMutation = useUpdateTaskStatusMutation();
//   const deleteStatusMutation = useDeleteProjectStatusMutation();

//   // Handle loading and error states
//   useEffect(() => {
//     if (tasksError) {
//       toast("There was a problem loading your tasks. Please try again.");
//     }
//     if (columnsError) {
//       toast("There was a problem loading your columns. Please try again.");
//     }
//   }, [tasksError, columnsError]);

//   // Add new column
//   const addNewColumn = () => {
//     if (newColumn.trim() && projectId) {
//       // Default color for new columns
//       const color = "#f3f4f6"; // Light gray

//       createColumnMutation.mutate(
//         { projectId, name: newColumn, color },
//         {
//           onSuccess: () => {
//             setNewColumn("");
//             setShowNewColumnDialog(false);
//           },
//         }
//       );
//     }
//   };

//   // Helper function for task type discrimination
//   const renderTask = (task: Task) => {
//     if (isSprintTask(task)) {
//       return <SprintTaskCard task={task} className="mb-4" />;
//     }
//     if (isStandardTask(task)) {
//       return <StandardTaskCard task={task} className="mb-4" />;
//     }
//     return null;
//   };

//   // Drag and drop handlers
//   const handleDragStart = (e: React.DragEvent, taskId: string) => {
//     e.dataTransfer.setData("taskId", taskId);
//   };

//   const handleDrop = (e: React.DragEvent, status: string) => {
//     e.preventDefault();
//     const taskId = e.dataTransfer.getData("taskId");

//     if (taskId && projectId) {
//       updateTaskStatusMutation.mutate({
//         projectId,
//         taskId,
//         status,
//       });
//     }
//   };

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//   };

//   // Handle column actions
//   const handleEditColumn = (column: Column) => {
//     setSelectedColumn(column);
//     setShowEditDialog(true);
//   };

//   const handleDeleteColumn = (column: Column) => {
//     if (["todo", "in progress", "done"].includes(column.name?.toLowerCase() || "")) {
//       toast("Default statuses cannot be deleted.");
//       return;
//     }
//     setSelectedColumn(column);
//     setShowDeleteDialog(true);
//   };

//   const confirmDelete = () => {
//     if (!selectedColumn || !projectId) {
//       toast("Missing required information");
//       return;
//     }

//     deleteStatusMutation.mutate(
//       {
//         projectId,
//         statusId: selectedColumn.id,
//       },
//       {
//         onSuccess: () => {
//           setShowDeleteDialog(false);
//           setSelectedColumn(null);
//         },
//       }
//     );
//   };

//   // Column Actions Component
//   const ColumnActions = ({ column }: { column: Column }) => {
//     return (
//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button
//             size="icon"
//             variant="ghost"
//             className="h-6 w-6 rounded-full hover:bg-gray-200 transition-colors"
//           >
//             <MoreHorizontal className="h-4 w-4" />
//           </Button>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent align="end" className="w-40">
//           <DropdownMenuItem onClick={() => handleEditColumn(column)}>
//             Edit Status
//           </DropdownMenuItem>
//           <DropdownMenuItem 
//             onClick={() => handleDeleteColumn(column)}
//             disabled={["todo", "in progress", "done"].includes(column.name?.toLowerCase() || "")}
//             className="text-red-600 focus:text-red-600"
//           >
//             Delete
//           </DropdownMenuItem>
//         </DropdownMenuContent>
//       </DropdownMenu>
//     );
//   };

//   // Task column component
//   const TaskColumn = ({ column, tasks }: { column: any; tasks: Task[] }) => {
//     const tasksInColumn = tasks.filter(
//       (task) => task?.status.toLowerCase() === column?.name.toLowerCase()
//     );

//     return (
//       <div
//         className="min-w-[250px] w-70 flex-shrink-0 group relative"
//         onDrop={(e) => handleDrop(e, column.name)}
//         onDragOver={handleDragOver}
//       >
//         <div className="bg-gray-100 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 transition-all shadow-sm duration-300 hover:-translate-y-1 pb-16">
//           <div className="flex justify-between items-center mb-4">
//             <div className="space-y-2">
//               <div className="flex items-center gap-2">
//                 <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse"></div>
//                 <h3 className="font-bold text-base text-gray-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
//                   {column.name}
//                 </h3>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="px-2 py-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full">
//                   <p className="text-xs font-semibold text-gray-600">
//                     {tasksInColumn.length} task{tasksInColumn.length !== 1 ? "s" : ""}
//                   </p>
//                 </div>
//               </div>
//             </div>
//             <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
//               <ColumnActions column={column} />
//             </div>
//           </div>
          
//           <div className="space-y-3 min-h-[120px] mb-4">
//             {tasksInColumn.length > 0 ? (
//               tasksInColumn.map((task, index) => (
//                 <div
//                   key={task.id}
//                   draggable
//                   onDragStart={(e) => handleDragStart(e, task.id as string)}
//                   className="transform hover:scale-[1.02] transition-transform duration-200"
//                   style={{
//                     animationDelay: `${index * 100}ms`,
//                     animation: 'fadeInUp 0.5s ease-out forwards'
//                   }}
//                 >
//                   {renderTask(task)}
//                 </div>
//               ))
//             ) : (
//               <div className="h-20 border-2 border-dashed border-gray-300/60 rounded-xl flex items-center justify-center bg-gradient-to-br from-gray-50/50 to-gray-100/30 hover:from-blue-50/50 hover:to-purple-50/30 transition-all duration-300 group/drop">
//                 <div className="text-center space-y-1">
//                   <div className="w-6 h-6 mx-auto rounded-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center group-hover/drop:from-blue-400 group-hover/drop:to-purple-400 transition-all duration-300">
//                     <Plus className="w-3 h-3 text-white" />
//                   </div>
//                   <p className="text-xs text-gray-500 font-medium group-hover/drop:text-gray-700 transition-colors duration-300">
//                     Drop tasks here
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Add Task Button positioned at bottom center */}
//           <div className="absolute bottom-2 left-4 right-4">
//             <NewTaskModal 
//               activeTab={activeTab} 
//               projectId={projectId || ""} 
//               defaultStatus={column.name}
//               trigger={
//                 <Button
//                   variant="ghost"
//                   className="w-full justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-200 transition-colors duration-200 rounded-xl py-2 px-3 bg-transparent"
//                 >
//                   <Plus className="w-4 h-4 mr-2" />
//                   Add Task
//                 </Button>
//               }
//             />
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Loading state
//   if (isLoadingTasks || isLoadingColumns) {
//     return (
//       <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
//         <div className="text-center space-y-4">
//           <div className="relative">
//             <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-spin">
//               <div className="absolute inset-2 bg-white rounded-full"></div>
//             </div>
//           </div>
//           <p className="text-lg font-semibold text-gray-700 animate-pulse">Loading task board...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-100 p-4 sm:p-6 lg:p-8 rounded-2xl">
//       <div className="max-w-full mx-auto">
//         {/* Header Section */}
//         <div className="mb-8">
//           {/* Main Header with Title */}
//           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
//          <div className="flex-grow">
//            <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 mb-2">
//              Project Dashboard
//            </h1>
//            <ProjectSelect />
//          </div>
        
//          {/* Right side buttons container */}
//          {/* <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto sm:flex-shrink-0">
//            <div className="w-full sm:w-auto">
//              <NewTaskModal activeTab={activeTab} projectId={projectId || ""} />
//            </div>
//          </div> */}
//        </div>

//           {/* Enhanced Tab Navigation */}
//           <div className="bg-white/80 backdrop-blur-sm p-2 rounded-2xl border border-gray-200/50 overflow-x-auto">
//             <div className="flex gap-2 min-w-max sm:min-w-0">
//               {tabs.map((tab) => {
//                 const IconComponent = tab.icon;
//                 const isActive = activeTab === tab.id;

//                 return (
//                   <Button
//                     key={tab.id}
//                     variant="ghost"
//                     className={`relative px-4 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap ${isActive
//                         ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg hover:shadow-xl transform hover:scale-105`
//                         : "text-gray-600 hover:text-gray-800 hover:bg-gray-100/50"
//                       }`}
//                     onClick={() => setActiveTab(tab.id as TabType)}
//                   >
//                     <div className="flex items-center gap-2">
//                       <IconComponent className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
//                       <span className="text-sm sm:text-base">{tab.label}</span>
//                     </div>
//                     {isActive && (
//                       <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>
//                     )}
//                   </Button>
//                 );
//               })}
//             </div>
//           </div>
//         </div>

//         {/* Task Board - Hidden scrollbar */}
//         <div className="custom-scrollbar-container flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto pb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
//           {columns.map((column: any, index: number) => (
//             <div
//               key={column?.id}
//               style={{
//                 animationDelay: `${index * 150}ms`,
//                 animation: 'slideInFromBottom 0.6s ease-out forwards'
//               }}
//             >
//               <TaskColumn column={column} tasks={tasks} />
//             </div>
//           ))}

//           {/* Add New Column */}
//           <Dialog
//             open={showNewColumnDialog}
//             onOpenChange={setShowNewColumnDialog}
//           >
//             <DialogTrigger asChild>
//               <div className="min-w-[240px] sm:min-w-[260px] w-[240px] sm:w-[280px] flex-shrink-0 group cursor-pointer">
//                 <div className="bg-gradient-to-br from-gray-50/80 to-gray-100/60 backdrop-blur-sm rounded-2xl p-5 border-2 border-dashed border-gray-300/60 hover:border-gray-400/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group-hover:from-blue-50/80 group-hover:to-purple-50/60">
//                   <div className="flex flex-col items-center justify-center space-y-3 py-6">
//                     <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 group-hover:from-blue-500 group-hover:to-purple-500 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
//                       <Plus className="w-6 h-6 text-white" />
//                     </div>
//                     <div className="text-center">
//                       <h3 className="font-semibold text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
//                         Create New Status
//                       </h3>
//                       <p className="text-sm text-gray-500 mt-1">
//                         Add a custom workflow stage
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </DialogTrigger>
//             <DialogContent className="rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
//               <DialogHeader>
//                 <DialogTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
//                   Create New Status
//                 </DialogTitle>
//               </DialogHeader>
//               <div className="space-y-6 mt-6">
//                 <div className="space-y-2">
//                   <label className="text-sm font-semibold text-gray-700">Status Name</label>
//                   <Input
//                     placeholder="Enter status name..."
//                     value={newColumn}
//                     onChange={(e) => setNewColumn(e.target.value)}
//                     className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/80"
//                   />
//                 </div>
//                 <Button
//                   onClick={addNewColumn}
//                   disabled={createColumnMutation.isPending}
//                   className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
//                 >
//                   {createColumnMutation.isPending ? (
//                     <div className="flex items-center gap-2">
//                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                       Creating...
//                     </div>
//                   ) : (
//                     <div className="flex items-center gap-2">
//                       <Plus className="w-4 h-4" />
//                       Create Status
//                     </div>
//                   )}
//                 </Button>
//               </div>
//             </DialogContent>
//           </Dialog>
//         </div>
//       </div>

//       {/* Modals */}
//       {selectedColumn && (
//         <>
//           <DeleteColumnDialog
//             open={showDeleteDialog}
//             onOpenChange={setShowDeleteDialog}
//             column={selectedColumn}
//             projectId={projectId || ""}
//             onConfirm={confirmDelete}
//           />

//           <EditColumnDialog
//             open={showEditDialog}
//             onOpenChange={setShowEditDialog}
//             column={selectedColumn}
//             projectId={projectId || ""}
//           />
//         </>
//       )}

//       {/* Custom Animations */}
//        <style jsx>{`
//         @keyframes fadeInUp {
//           from {
//             opacity: 0;
//             transform: translateY(20px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
        
//         @keyframes slideInFromBottom {
//           from {
//             opacity: 0;
//             transform: translateY(40px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
        
//         /* Custom scrollbar positioned at bottom - Mobile responsive */
//         .custom-scrollbar-container {
//           /* Firefox */
//           scrollbar-width: thin;
//           scrollbar-color: #d1d5db transparent;
//         }
        
//         /* WebKit browsers (Chrome, Safari, Edge) */
//         .custom-scrollbar-container::-webkit-scrollbar {
//           height: 6px; /* Thinner on mobile */
//         }
        
//         @media (min-width: 640px) {
//           .custom-scrollbar-container::-webkit-scrollbar {
//             height: 8px; /* Standard size on desktop */
//           }
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-track {
//           background: transparent;
//           border-radius: 4px;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-thumb {
//           background-color: #d1d5db;
//           border-radius: 4px;
//           opacity: 0.7;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-thumb:hover {
//           background-color: #9ca3af;
//         }
        
//         /* Ensure scrollbar appears at the bottom of content */
//         .custom-scrollbar-container::-webkit-scrollbar-corner {
//           background: transparent;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default TaskBoard;

















































// "use client";

// import React, { useState, useEffect, useMemo } from "react";
// import { Plus, Sparkles, Calendar, Users, Code, TrendingUp, MoreHorizontal, Search, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuCheckboxItem,
// } from "@/components/ui/dropdown-menu";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { TabType, Task, Column } from "@/lib/types/taskManager/types";
// import { isSprintTask, isStandardTask } from "@/lib/types/taskManager/types";
// import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
// import { toast } from "sonner";
// import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";
// import SprintTaskCard from "./Cards/SprintTaskCard";
// import StandardTaskCard from "./Cards/StandardTaskCard";
// import NewTaskModal from "./NewTaskModal";
// import ProjectSelect from "./ProjectSelect";
// import { DeleteColumnDialog } from "./modals/DeleteColumnDialog";
// import { EditColumnDialog } from "./modals/EditColumnDialog";

// // Pagination constants
// const TASKS_PER_PAGE = 4;

// // Filter types
// interface FilterState {
//   searchTerm: string;
//   priorities: string[];
//   assignees: string[];
//   dateRange: {
//     start: string;
//     end: string;
//   };
// }

// const TaskBoard: React.FC = () => {
//   const { currentProject, projectId } = useProjectContext();
//   const [activeTab, setActiveTab] = useState<TabType>("viewAll");
//   const [newColumn, setNewColumn] = useState("");
//   const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);

//   // Pagination states for each column
//   const [columnPages, setColumnPages] = useState<Record<string, number>>({});

//   // Filter states
//   const [filters, setFilters] = useState<FilterState>({
//     searchTerm: "",
//     priorities: [],
//     assignees: [],
//     dateRange: {
//       start: "",
//       end: "",
//     },
//   });
//   const [showFilterPopover, setShowFilterPopover] = useState(false);

//   // States for column actions
//   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
//   const [showEditDialog, setShowEditDialog] = useState(false);
//   const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);

//   const tabs = [
//     { id: "viewAll", label: "View All", icon: Sparkles, gradient: "from-blue-500 to-cyan-500" },
//     { id: "sprints", label: "Sprints", icon: Calendar, gradient: "from-blue-500 to-cyan-500" },
//     { id: "marketing", label: "Marketing", icon: TrendingUp, gradient: "from-blue-500 to-cyan-500" },
//     { id: "sales", label: "Sales", icon: Users, gradient: "from-blue-500 to-cyan-500" },
//     { id: "development", label: "Development", icon: Code, gradient: "from-blue-500 to-cyan-500" },
//   ];

//   // API Hooks
//   const {
//     useProjectTasksQuery,
//     useProjectStatusesQuery,
//     useCreateProjectStatusMutation,
//     useUpdateTaskStatusMutation,
//     useDeleteProjectStatusMutation,
//   } = useAuthAwareTaskManagerApi();

//   // Fetch tasks and statuses for the current project
//   const {
//     data: tasks = [],
//     isLoading: isLoadingTasks,
//     error: tasksError,
//   } = useProjectTasksQuery(
//     projectId || "",
//     activeTab === "viewAll" ? undefined : activeTab,
//     undefined, // status
//     undefined, // epicId
//     undefined, // milestoneId
//     undefined // assignee
//   );

//   const {
//     data: columns = [],
//     isLoading: isLoadingColumns,
//     error: columnsError,
//   } = useProjectStatusesQuery(projectId || "");

//   // Set up mutations
//   const createColumnMutation = useCreateProjectStatusMutation();
//   const updateTaskStatusMutation = useUpdateTaskStatusMutation();
//   const deleteStatusMutation = useDeleteProjectStatusMutation();

//   // Initialize column pages when columns change
//   useEffect(() => {
//     const initialPages: Record<string, number> = {};
//     columns.forEach((column: any) => {
//       initialPages[column.name] = 1;
//     });
//     setColumnPages(initialPages);
//   }, [columns]);

//   // Filter tasks based on search criteria
//   const filteredTasks = useMemo(() => {
//     return tasks.filter((task: Task) => {
//       // Search term filter
//       if (filters.searchTerm) {
//         const searchLower = filters.searchTerm.toLowerCase();
//         const matchesTitle = task.title?.toLowerCase().includes(searchLower);
//         const matchesDescription = task.description?.toLowerCase().includes(searchLower);
//         const matchesAssignee = task.assignee?.toLowerCase().includes(searchLower);
        
//         if (!matchesTitle && !matchesDescription && !matchesAssignee) {
//           return false;
//         }
//       }

//       // Priority filter
//       if (filters.priorities.length > 0 && task.priority) {
//         if (!filters.priorities.includes(task.priority)) {
//           return false;
//         }
//       }

//       // Assignee filter
//       if (filters.assignees.length > 0 && task.assignee) {
//         if (!filters.assignees.includes(task.assignee)) {
//           return false;
//         }
//       }

//       // Date range filter
//       if (filters.dateRange.start || filters.dateRange.end) {
//         const taskDate = new Date(task.createdAt || task.updatedAt || Date.now());
//         const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
//         const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;

//         if (startDate && taskDate < startDate) return false;
//         if (endDate && taskDate > endDate) return false;
//       }

//       return true;
//     });
//   }, [tasks, filters]);

//   // Get unique priorities and assignees for filter options
//   const filterOptions = useMemo(() => {
//     const priorities = Array.from(new Set(tasks.map((task: Task) => task.priority).filter(Boolean)));
//     const assignees = Array.from(new Set(tasks.map((task: Task) => task.assignee).filter(Boolean)));
//     return { priorities, assignees };
//   }, [tasks]);

//   // Handle loading and error states
//   useEffect(() => {
//     if (tasksError) {
//       toast("There was a problem loading your tasks. Please try again.");
//     }
//     if (columnsError) {
//       toast("There was a problem loading your columns. Please try again.");
//     }
//   }, [tasksError, columnsError]);

//   // Add new column
//   const addNewColumn = () => {
//     if (newColumn.trim() && projectId) {
//       const color = "#f3f4f6";

//       createColumnMutation.mutate(
//         { projectId, name: newColumn, color },
//         {
//           onSuccess: () => {
//             setNewColumn("");
//             setShowNewColumnDialog(false);
//           },
//         }
//       );
//     }
//   };

//   // Helper function for task type discrimination
//   const renderTask = (task: Task) => {
//     if (isSprintTask(task)) {
//       return <SprintTaskCard task={task} className="mb-4" />;
//     }
//     if (isStandardTask(task)) {
//       return <StandardTaskCard task={task} className="mb-4" />;
//     }
//     return null;
//   };

//   // Drag and drop handlers
//   const handleDragStart = (e: React.DragEvent, taskId: string) => {
//     e.dataTransfer.setData("taskId", taskId);
//   };

//   const handleDrop = (e: React.DragEvent, status: string) => {
//     e.preventDefault();
//     const taskId = e.dataTransfer.getData("taskId");

//     if (taskId && projectId) {
//       updateTaskStatusMutation.mutate({
//         projectId,
//         taskId,
//         status,
//       });
//     }
//   };

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//   };

//   // Handle column actions
//   const handleEditColumn = (column: Column) => {
//     setSelectedColumn(column);
//     setShowEditDialog(true);
//   };

//   const handleDeleteColumn = (column: Column) => {
//     if (["todo", "in progress", "done"].includes(column.name?.toLowerCase() || "")) {
//       toast("Default statuses cannot be deleted.");
//       return;
//     }
//     setSelectedColumn(column);
//     setShowDeleteDialog(true);
//   };

//   const confirmDelete = () => {
//     if (!selectedColumn || !projectId) {
//       toast("Missing required information");
//       return;
//     }

//     deleteStatusMutation.mutate(
//       {
//         projectId,
//         statusId: selectedColumn.id,
//       },
//       {
//         onSuccess: () => {
//           setShowDeleteDialog(false);
//           setSelectedColumn(null);
//         },
//       }
//     );
//   };

//   // Pagination handlers
//   const handlePageChange = (columnName: string, newPage: number) => {
//     setColumnPages(prev => ({
//       ...prev,
//       [columnName]: newPage
//     }));
//   };

//   // Filter handlers
//   const handleFilterChange = (key: keyof FilterState, value: any) => {
//     setFilters(prev => ({
//       ...prev,
//       [key]: value
//     }));
//   };

//   const clearFilters = () => {
//     setFilters({
//       searchTerm: "",
//       priorities: [],
//       assignees: [],
//       dateRange: { start: "", end: "" }
//     });
//   };

//   const hasActiveFilters = filters.searchTerm || filters.priorities.length > 0 || 
//     filters.assignees.length > 0 || filters.dateRange.start || filters.dateRange.end;

//   // Column Actions Component
//   const ColumnActions = ({ column }: { column: Column }) => {
//     return (
//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button
//             size="icon"
//             variant="ghost"
//             className="h-6 w-6 rounded-full hover:bg-gray-200 transition-colors"
//           >
//             <MoreHorizontal className="h-4 w-4" />
//           </Button>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent align="end" className="w-40">
//           <DropdownMenuItem onClick={() => handleEditColumn(column)}>
//             Edit Status
//           </DropdownMenuItem>
//           <DropdownMenuItem 
//             onClick={() => handleDeleteColumn(column)}
//             disabled={["todo", "in progress", "done"].includes(column.name?.toLowerCase() || "")}
//             className="text-red-600 focus:text-red-600"
//           >
//             Delete
//           </DropdownMenuItem>
//         </DropdownMenuContent>
//       </DropdownMenu>
//     );
//   };

//   // Pagination Component
//   const PaginationControls = ({ columnName, totalTasks }: { columnName: string, totalTasks: number }) => {
//     const currentPage = columnPages[columnName] || 1;
//     const totalPages = Math.ceil(totalTasks / TASKS_PER_PAGE);

//     if (totalPages <= 1) return null;

//     return (
//       <div className="flex items-center justify-between px-2 py-2 bg-gray-50/80 rounded-lg border border-gray-200/50">
//         <span className="text-xs text-gray-600">
//           Page {currentPage} of {totalPages}
//         </span>
//         <div className="flex items-center gap-1">
//           <Button
//             size="sm"
//             variant="ghost"
//             className="h-6 w-6 p-0"
//             onClick={() => handlePageChange(columnName, currentPage - 1)}
//             disabled={currentPage === 1}
//           >
//             <ChevronLeft className="h-3 w-3" />
//           </Button>
//           <Button
//             size="sm"
//             variant="ghost"
//             className="h-6 w-6 p-0"
//             onClick={() => handlePageChange(columnName, currentPage + 1)}
//             disabled={currentPage === totalPages}
//           >
//             <ChevronRight className="h-3 w-3" />
//           </Button>
//         </div>
//       </div>
//     );
//   };

//   // Task column component with pagination
//   const TaskColumn = ({ column, tasks }: { column: any; tasks: Task[] }) => {
//     const tasksInColumn = filteredTasks.filter(
//       (task) => task?.status.toLowerCase() === column?.name.toLowerCase()
//     );

//     const currentPage = columnPages[column.name] || 1;
//     const startIndex = (currentPage - 1) * TASKS_PER_PAGE;
//     const endIndex = startIndex + TASKS_PER_PAGE;
//     const paginatedTasks = tasksInColumn.slice(startIndex, endIndex);

//     return (
//       <div
//         className="min-w-[250px] w-70 flex-shrink-0 group relative"
//         onDrop={(e) => handleDrop(e, column.name)}
//         onDragOver={handleDragOver}
//       >
//         <div className="bg-gray-100 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 transition-all shadow-sm duration-300 hover:-translate-y-1 pb-20">
//           <div className="flex justify-between items-center mb-4">
//             <div className="space-y-2">
//               <div className="flex items-center gap-2">
//                 <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse"></div>
//                 <h3 className="font-bold text-base text-gray-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
//                   {column.name}
//                 </h3>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="px-2 py-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full">
//                   <p className="text-xs font-semibold text-gray-600">
//                     {tasksInColumn.length} task{tasksInColumn.length !== 1 ? "s" : ""}
//                   </p>
//                 </div>
//               </div>
//             </div>
//             <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
//               <ColumnActions column={column} />
//             </div>
//           </div>
          
//           <div className="space-y-3 min-h-[120px] mb-4">
//             {paginatedTasks.length > 0 ? (
//               paginatedTasks.map((task, index) => (
//                 <div
//                   key={task.id}
//                   draggable
//                   onDragStart={(e) => handleDragStart(e, task.id as string)}
//                   className="transform hover:scale-[1.02] transition-transform duration-200"
//                   style={{
//                     animationDelay: `${index * 100}ms`,
//                     animation: 'fadeInUp 0.5s ease-out forwards'
//                   }}
//                 >
//                   {renderTask(task)}
//                 </div>
//               ))
//             ) : (
//               <div className="h-20 border-2 border-dashed border-gray-300/60 rounded-xl flex items-center justify-center bg-gradient-to-br from-gray-50/50 to-gray-100/30 hover:from-blue-50/50 hover:to-purple-50/30 transition-all duration-300 group/drop">
//                 <div className="text-center space-y-1">
//                   <div className="w-6 h-6 mx-auto rounded-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center group-hover/drop:from-blue-400 group-hover/drop:to-purple-400 transition-all duration-300">
//                     <Plus className="w-3 h-3 text-white" />
//                   </div>
//                   <p className="text-xs text-gray-500 font-medium group-hover/drop:text-gray-700 transition-colors duration-300">
//                     {hasActiveFilters ? "No matching tasks" : "Drop tasks here"}
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Pagination Controls */}
//           {tasksInColumn.length > TASKS_PER_PAGE && (
//             <div className="mb-4">
//               <PaginationControls 
//                 columnName={column.name} 
//                 totalTasks={tasksInColumn.length}
//               />
//             </div>
//           )}

//           {/* Add Task Button positioned at bottom center */}
//           <div className="absolute bottom-2 left-4 right-4">
//             <NewTaskModal 
//               activeTab={activeTab} 
//               projectId={projectId || ""} 
//               defaultStatus={column.name}
//               trigger={
//                 <Button
//                   variant="ghost"
//                   className="w-full justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-200 transition-colors duration-200 rounded-xl py-2 px-3 bg-transparent"
//                 >
//                   <Plus className="w-4 h-4 mr-2" />
//                   Add Task
//                 </Button>
//               }
//             />
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Loading state
//   if (isLoadingTasks || isLoadingColumns) {
//     return (
//       <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
//         <div className="text-center space-y-4">
//           <div className="relative">
//             <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-spin">
//               <div className="absolute inset-2 bg-white rounded-full"></div>
//             </div>
//           </div>
//           <p className="text-lg font-semibold text-gray-700 animate-pulse">Loading task board...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-100 p-4 sm:p-6 lg:p-8 rounded-2xl">
//       <div className="max-w-full mx-auto">
//         {/* Header Section */}
//         <div className="mb-8">
//           {/* Main Header with Title */}
//           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
//             <div className="flex-grow">
//               <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 mb-2">
//                 Project Dashboard
//               </h1>
//               <div className="flex items-center gap-4">
//                 <ProjectSelect />
                
//                 {/* Search and Filter Section */}
//                 <div className="flex items-center gap-2">
//                   {/* Search Input */}
//                   <div className="relative">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
//                     <Input
//                       placeholder="Search tasks..."
//                       value={filters.searchTerm}
//                       onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
//                       className="pl-10 pr-4 py-2 w-64 rounded-xl border-gray-300 focus:border-blue-500 bg-white/80 backdrop-blur-sm"
//                     />
//                     {filters.searchTerm && (
//                       <Button
//                         size="sm"
//                         variant="ghost"
//                         className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-200 rounded-full"
//                         onClick={() => handleFilterChange('searchTerm', '')}
//                       >
//                         <X className="h-3 w-3" />
//                       </Button>
//                     )}
//                   </div>

//                   {/* Filter Popover */}
//                   <Popover open={showFilterPopover} onOpenChange={setShowFilterPopover}>
//                     <PopoverTrigger asChild>
//                       <Button
//                         variant="outline"
//                         className={`rounded-xl border-gray-300 bg-white/80 backdrop-blur-sm hover:bg-gray-50 transition-all duration-200 ${hasActiveFilters ? 'border-blue-500 bg-blue-50' : ''}`}
//                       >
//                         <Filter className="h-4 w-4 mr-2" />
//                         Filter
//                         {hasActiveFilters && (
//                           <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs bg-blue-500 text-white rounded-full flex items-center justify-center">
//                             {[filters.priorities.length, filters.assignees.length, filters.dateRange.start ? 1 : 0, filters.dateRange.end ? 1 : 0].filter(Boolean).length}
//                           </Badge>
//                         )}
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-80 p-4 bg-white/95 backdrop-blur-sm rounded-xl border-gray-200 shadow-xl" align="end">
//                       <div className="space-y-4">
//                         <div className="flex items-center justify-between">
//                           <h3 className="font-semibold text-gray-800">Filters</h3>
//                           {hasActiveFilters && (
//                             <Button
//                               size="sm"
//                               variant="ghost"
//                               onClick={clearFilters}
//                               className="text-gray-500 hover:text-gray-700 text-xs"
//                             >
//                               Clear all
//                             </Button>
//                           )}
//                         </div>

//                         {/* Priority Filter */}
//                         <div className="space-y-2">
//                           <label className="text-sm font-medium text-gray-700">Priority</label>
//                           <div className="space-y-1">
//                             {filterOptions.priorities.map((priority) => (
//                               <label key={priority} className="flex items-center space-x-2">
//                                 <input
//                                   type="checkbox"
//                                   checked={filters.priorities.includes(priority)}
//                                   onChange={(e) => {
//                                     if (e.target.checked) {
//                                       handleFilterChange('priorities', [...filters.priorities, priority]);
//                                     } else {
//                                       handleFilterChange('priorities', filters.priorities.filter(p => p !== priority));
//                                     }
//                                   }}
//                                   className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                                 />
//                                 <span className="text-sm text-gray-600 capitalize">{priority}</span>
//                               </label>
//                             ))}
//                           </div>
//                         </div>

//                         {/* Assignee Filter */}
//                         <div className="space-y-2">
//                           <label className="text-sm font-medium text-gray-700">Assignee</label>
//                           <div className="space-y-1 max-h-32 overflow-y-auto">
//                             {filterOptions.assignees.map((assignee) => (
//                               <label key={assignee} className="flex items-center space-x-2">
//                                 <input
//                                   type="checkbox"
//                                   checked={filters.assignees.includes(assignee)}
//                                   onChange={(e) => {
//                                     if (e.target.checked) {
//                                       handleFilterChange('assignees', [...filters.assignees, assignee]);
//                                     } else {
//                                       handleFilterChange('assignees', filters.assignees.filter(a => a !== assignee));
//                                     }
//                                   }}
//                                   className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                                 />
//                                 <span className="text-sm text-gray-600">{assignee}</span>
//                               </label>
//                             ))}
//                           </div>
//                         </div>

//                         {/* Date Range Filter */}
//                         <div className="space-y-2">
//                           <label className="text-sm font-medium text-gray-700">Date Range</label>
//                           <div className="space-y-2">
//                             <Input
//                               type="date"
//                               value={filters.dateRange.start}
//                               onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
//                               className="text-sm"
//                               placeholder="Start date"
//                             />
//                             <Input
//                               type="date"
//                               value={filters.dateRange.end}
//                               onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
//                               className="text-sm"
//                               placeholder="End date"
//                             />
//                           </div>
//                         </div>
//                       </div>
//                     </PopoverContent>
//                   </Popover>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Enhanced Tab Navigation */}
//           <div className="bg-white/80 backdrop-blur-sm p-2 rounded-2xl border border-gray-200/50 overflow-x-auto">
//             <div className="flex gap-2 min-w-max sm:min-w-0">
//               {tabs.map((tab) => {
//                 const IconComponent = tab.icon;
//                 const isActive = activeTab === tab.id;

//                 return (
//                   <Button
//                     key={tab.id}
//                     variant="ghost"
//                     className={`relative px-4 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap ${isActive
//                         ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg hover:shadow-xl transform hover:scale-105`
//                         : "text-gray-600 hover:text-gray-800 hover:bg-gray-100/50"
//                       }`}
//                     onClick={() => setActiveTab(tab.id as TabType)}
//                   >
//                     <div className="flex items-center gap-2">
//                       <IconComponent className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
//                       <span className="text-sm sm:text-base">{tab.label}</span>
//                     </div>
//                     {isActive && (
//                       <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>
//                     )}
//                   </Button>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Active Filters Display */}
//           {hasActiveFilters && (
//             <div className="mt-4 flex flex-wrap items-center gap-2">
//               <span className="text-sm text-gray-600">Active filters:</span>
//               {filters.searchTerm && (
//                 <Badge variant="secondary" className="bg-blue-100 text-blue-800">
//                   Search: {filters.searchTerm}
//                   <Button
//                     size="sm"
//                     variant="ghost"
//                     className="ml-1 h-4 w-4 p-0 hover:bg-blue-200 rounded-full"
//                     onClick={() => handleFilterChange('searchTerm', '')}
//                   >
//                     <X className="h-3 w-3" />
//                   </Button>
//                 </Badge>
//               )}
//               {filters.priorities.map((priority) => (
//                 <Badge key={priority} variant="secondary" className="bg-purple-100 text-purple-800">
//                   Priority: {priority}
//                   <Button
//                     size="sm"
//                     variant="ghost"
//                     className="ml-1 h-4 w-4 p-0 hover:bg-purple-200 rounded-full"
//                     onClick={() => handleFilterChange('priorities', filters.priorities.filter(p => p !== priority))}
//                   >
//                     <X className="h-3 w-3" />
//                   </Button>
//                 </Badge>
//               ))}
//               {filters.assignees.map((assignee) => (
//                 <Badge key={assignee} variant="secondary" className="bg-green-100 text-green-800">
//                   Assignee: {assignee}
//                   <Button
//                     size="sm"
//                     variant="ghost"
//                     className="ml-1 h-4 w-4 p-0 hover:bg-green-200 rounded-full"
//                     onClick={() => handleFilterChange('assignees', filters.assignees.filter(a => a !== assignee))}
//                   >
//                     <X className="h-3 w-3" />
//                   </Button>
//                 </Badge>
//               ))}
//               {(filters.dateRange.start || filters.dateRange.end) && (
//                 <Badge variant="secondary" className="bg-orange-100 text-orange-800">
//                   Date: {filters.dateRange.start || 'Start'} - {filters.dateRange.end || 'End'}
//                   <Button
//                     size="sm"
//                     variant="ghost"
//                     className="ml-1 h-4 w-4 p-0 hover:bg-orange-200 rounded-full"
//                     onClick={() => handleFilterChange('dateRange', { start: '', end: '' })}
//                   >
//                     <X className="h-3 w-3" />
//                   </Button>
//                 </Badge>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Task Board - Hidden scrollbar */}
//         <div className="custom-scrollbar-container flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto pb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
//           {columns.map((column: any, index: number) => (
//             <div
//               key={column?.id}
//               style={{
//                 animationDelay: `${index * 150}ms`,
//                 animation: 'slideInFromBottom 0.6s ease-out forwards'
//               }}
//             >
//               <TaskColumn column={column} tasks={tasks} />
//             </div>
//           ))}

//           {/* Add New Column */}
//           <Dialog
//             open={showNewColumnDialog}
//             onOpenChange={setShowNewColumnDialog}
//           >
//             <DialogTrigger asChild>
//               <div className="min-w-[240px] sm:min-w-[260px] w-[240px] sm:w-[280px] flex-shrink-0 group cursor-pointer">
//                 <div className="bg-gradient-to-br from-gray-50/80 to-gray-100/60 backdrop-blur-sm rounded-2xl p-5 border-2 border-dashed border-gray-300/60 hover:border-gray-400/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group-hover:from-blue-50/80 group-hover:to-purple-50/60">
//                   <div className="flex flex-col items-center justify-center space-y-3 py-6">
//                     <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 group-hover:from-blue-500 group-hover:to-purple-500 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
//                       <Plus className="w-6 h-6 text-white" />
//                     </div>
//                     <div className="text-center">
//                       <h3 className="font-semibold text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
//                         Create New Status
//                       </h3>
//                       <p className="text-sm text-gray-500 mt-1">
//                         Add a custom workflow stage
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </DialogTrigger>
//             <DialogContent className="rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
//               <DialogHeader>
//                 <DialogTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
//                   Create New Status
//                 </DialogTitle>
//               </DialogHeader>
//               <div className="space-y-6 mt-6">
//                 <div className="space-y-2">
//                   <label className="text-sm font-semibold text-gray-700">Status Name</label>
//                   <Input
//                     placeholder="Enter status name..."
//                     value={newColumn}
//                     onChange={(e) => setNewColumn(e.target.value)}
//                     className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/80"
//                   />
//                 </div>
//                 <Button
//                   onClick={addNewColumn}
//                   disabled={createColumnMutation.isPending}
//                   className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
//                 >
//                   {createColumnMutation.isPending ? (
//                     <div className="flex items-center gap-2">
//                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                       Creating...
//                     </div>
//                   ) : (
//                     <div className="flex items-center gap-2">
//                       <Plus className="w-4 h-4" />
//                       Create Status
//                     </div>
//                   )}
//                 </Button>
//               </div>
//             </DialogContent>
//           </Dialog>
//         </div>
//       </div>

//       {/* Modals */}
//       {selectedColumn && (
//         <>
//           <DeleteColumnDialog
//             open={showDeleteDialog}
//             onOpenChange={setShowDeleteDialog}
//             column={selectedColumn}
//             projectId={projectId || ""}
//             onConfirm={confirmDelete}
//           />

//           <EditColumnDialog
//             open={showEditDialog}
//             onOpenChange={setShowEditDialog}
//             column={selectedColumn}
//             projectId={projectId || ""}
//           />
//         </>
//       )}

//       {/* Custom Animations */}
//        <style jsx>{`
//         @keyframes fadeInUp {
//           from {
//             opacity: 0;
//             transform: translateY(20px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
        
//         @keyframes slideInFromBottom {
//           from {
//             opacity: 0;
//             transform: translateY(40px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
        
//         /* Custom scrollbar positioned at bottom - Mobile responsive */
//         .custom-scrollbar-container {
//           /* Firefox */
//           scrollbar-width: thin;
//           scrollbar-color: #d1d5db transparent;
//         }
        
//         /* WebKit browsers (Chrome, Safari, Edge) */
//         .custom-scrollbar-container::-webkit-scrollbar {
//           height: 6px; /* Thinner on mobile */
//         }
        
//         @media (min-width: 640px) {
//           .custom-scrollbar-container::-webkit-scrollbar {
//             height: 8px; /* Standard size on desktop */
//           }
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-track {
//           background: transparent;
//           border-radius: 4px;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-thumb {
//           background-color: #d1d5db;
//           border-radius: 4px;
//           opacity: 0.7;
//         }
        
//         .custom-scrollbar-container::-webkit-scrollbar-thumb:hover {
//           background-color: #9ca3af;
//         }
        
//         /* Ensure scrollbar appears at the bottom of content */
//         .custom-scrollbar-container::-webkit-scrollbar-corner {
//           background: transparent;
//         }

//         /* Smooth transitions for filter badges */
//         .filter-badge-enter {
//           opacity: 0;
//           transform: scale(0.8);
//         }
        
//         .filter-badge-enter-active {
//           opacity: 1;
//           transform: scale(1);
//           transition: opacity 200ms, transform 200ms;
//         }
        
//         .filter-badge-exit {
//           opacity: 1;
//         }
        
//         .filter-badge-exit-active {
//           opacity: 0;
//           transform: scale(0.8);
//           transition: opacity 200ms, transform 200ms;
//         }

//         /* Enhanced pagination controls */
//         .pagination-enter {
//           opacity: 0;
//           transform: translateY(-10px);
//         }
        
//         .pagination-enter-active {
//           opacity: 1;
//           transform: translateY(0);
//           transition: opacity 300ms, transform 300ms;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default TaskBoard;











































































































// EPD Code for UI
// "use client";

// import React, { useState, useEffect } from "react";
// import { Plus, Sparkles, Calendar, Users, Code, TrendingUp } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { TabType, Task } from "@/lib/types/taskManager/types";
// import { isSprintTask, isStandardTask } from "@/lib/types/taskManager/types";
// import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
// import { toast } from "sonner";
// import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";
// import SprintTaskCard from "../Cards/SprintTaskCard";
// import StandardTaskCard from "../Cards/StandardTaskCard";
// import { ColumnActionButtons } from "./buttons/ColumnActionButtons";
// import NewTaskModal from "./NewTaskModal";
// import ProjectSelect from "./ProjectSelect";

// const TaskBoard: React.FC = () => {
//   const { currentProject, projectId } = useProjectContext();
//   const [activeTab, setActiveTab] = useState<TabType>("viewAll");
//   const [newColumn, setNewColumn] = useState("");
//   const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);

//   const tabs = [
//     { id: "viewAll", label: "View All", icon: Sparkles, gradient: "from-purple-500 to-pink-500" },
//     { id: "sprints", label: "Sprints", icon: Calendar, gradient: "from-blue-500 to-cyan-500" },
//     { id: "marketing", label: "Marketing", icon: TrendingUp, gradient: "from-green-500 to-emerald-500" },
//     { id: "sales", label: "Sales", icon: Users, gradient: "from-orange-500 to-red-500" },
//     { id: "development", label: "Development", icon: Code, gradient: "from-indigo-500 to-purple-500" },
//   ];

//   // API Hooks
//   const {
//     useProjectTasksQuery,
//     useProjectStatusesQuery,
//     useCreateProjectStatusMutation,
//     useUpdateTaskStatusMutation,
//   } = useAuthAwareTaskManagerApi();

//   // Fetch tasks and statuses for the current project
//   const {
//     data: tasks = [],
//     isLoading: isLoadingTasks,
//     error: tasksError,
//   } = useProjectTasksQuery(
//     projectId || "",
//     activeTab === "viewAll" ? undefined : activeTab,
//     undefined, // status
//     undefined, // epicId
//     undefined, // milestoneId
//     undefined // assignee
//   );

//   const {
//     data: columns = [],
//     isLoading: isLoadingColumns,
//     error: columnsError,
//   } = useProjectStatusesQuery(projectId || "");

//   // Set up mutations
//   const createColumnMutation = useCreateProjectStatusMutation();
//   const updateTaskStatusMutation = useUpdateTaskStatusMutation();

//   // Handle loading and error states
//   useEffect(() => {
//     if (tasksError) {
//       toast("There was a problem loading your tasks. Please try again.");
//     }
//     if (columnsError) {
//       toast("There was a problem loading your columns. Please try again.");
//     }
//   }, [tasksError, columnsError]);

//   // Add new column
//   const addNewColumn = () => {
//     if (newColumn.trim() && projectId) {
//       // Default color for new columns
//       const color = "#f3f4f6"; // Light gray

//       createColumnMutation.mutate(
//         { projectId, name: newColumn, color },
//         {
//           onSuccess: () => {
//             setNewColumn("");
//             setShowNewColumnDialog(false);
//           },
//         }
//       );
//     }
//   };

//   // Helper function for task type discrimination
//   const renderTask = (task: Task) => {
//     if (isSprintTask(task)) {
//       return <SprintTaskCard task={task} className="mb-4" />;
//     }
//     if (isStandardTask(task)) {
//       return <StandardTaskCard task={task} className="mb-4" />;
//     }
//     return null;
//   };

//   // Drag and drop handlers
//   const handleDragStart = (e: React.DragEvent, taskId: string) => {
//     e.dataTransfer.setData("taskId", taskId);
//   };

//   const handleDrop = (e: React.DragEvent, status: string) => {
//     e.preventDefault();
//     const taskId = e.dataTransfer.getData("taskId");

//     if (taskId && projectId) {
//       updateTaskStatusMutation.mutate({
//         projectId,
//         taskId,
//         status,
//       });
//     }
//   };

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//   };

//   // Task column component
//   const TaskColumn = ({ column, tasks }: { column: any; tasks: Task[] }) => {
//     const tasksInColumn = tasks.filter(
//       (task) => task?.status.toLowerCase() === column?.name.toLowerCase()
//     );

//     return (
//       <div
//         className="min-w-[280px] w-full sm:w-80 flex-shrink-0 group"
//         onDrop={(e) => handleDrop(e, column.name)}
//         onDragOver={handleDragOver}
//       >
//         <div className="bg-gray-100 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
//           <div className="flex justify-between items-center mb-6">
//             <div className="space-y-2">
//               <div className="flex items-center gap-3">
//                 <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse"></div>
//                 <h3 className="font-bold text-lg text-gray-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
//                   {column.name}
//                 </h3>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full">
//                   <p className="text-xs font-semibold text-gray-600">
//                     {tasksInColumn.length} task{tasksInColumn.length !== 1 ? "s" : ""}
//                   </p>
//                 </div>
//               </div>
//             </div>
//             <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
//               <ColumnActionButtons
//                 column={column}
//                 onAddTask={() => {
//                   // Column-specific task creation
//                 }}
//               />
//             </div>
//           </div>
          
//           <div className="space-y-3 min-h-[120px]">
//             {tasksInColumn.length > 0 ? (
//               tasksInColumn.map((task, index) => (
//                 <div
//                   key={task.id}
//                   draggable
//                   onDragStart={(e) => handleDragStart(e, task.id as string)}
//                   className="transform hover:scale-[1.02] transition-transform duration-200"
//                   style={{
//                     animationDelay: `${index * 100}ms`,
//                     animation: 'fadeInUp 0.5s ease-out forwards'
//                   }}
//                 >
//                   {renderTask(task)}
//                 </div>
//               ))
//             ) : (
//               <div className="h-28 border-2 border-dashed border-gray-300/60 rounded-xl flex items-center justify-center bg-gradient-to-br from-gray-50/50 to-gray-100/30 hover:from-blue-50/50 hover:to-purple-50/30 transition-all duration-300 group/drop">
//                 <div className="text-center space-y-2">
//                   <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center group-hover/drop:from-blue-400 group-hover/drop:to-purple-400 transition-all duration-300">
//                     <Plus className="w-4 h-4 text-white" />
//                   </div>
//                   <p className="text-sm text-gray-500 font-medium group-hover/drop:text-gray-700 transition-colors duration-300">
//                     Drop tasks here
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Loading state
//   if (isLoadingTasks || isLoadingColumns) {
//     return (
//       <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
//         <div className="text-center space-y-4">
//           <div className="relative">
//             <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-spin">
//               <div className="absolute inset-2 bg-white rounded-full"></div>
//             </div>
//           </div>
//           <p className="text-lg font-semibold text-gray-700 animate-pulse">Loading task board...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//    <div className="min-h-screen bg-gradient-to-br from-blue-100 p-4 sm:p-6 lg:p-8 rounded-2xl">
//   <div className="max-w-full mx-auto">
//     {/* Header Section */}
//     <div className="mb-8">
//       {/* Main Header with Title and Buttons */}
//       <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
//         <div className="flex-grow">
//           <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 mb-2">
//             Project Dashboard
//           </h1>
//           <ProjectSelect />
//         </div>
        
//         {/* Right side buttons container */}
//         <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto sm:flex-shrink-0">
//           <div className="w-full sm:w-auto">
//             <NewTaskModal activeTab={activeTab} projectId={projectId || ""} />
//           </div>
//         </div>
//       </div>

//       {/* Enhanced Tab Navigation */}
//       <div className="bg-white/80 backdrop-blur-sm p-2 rounded-2xl border border-gray-200/50 overflow-x-auto">
//         <div className="flex gap-2 min-w-max sm:min-w-0">
//           {tabs.map((tab) => {
//             const IconComponent = tab.icon;
//             const isActive = activeTab === tab.id;

//             return (
//               <Button
//                 key={tab.id}
//                 variant="ghost"
//                 className={`relative px-4 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap ${isActive
//                     ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg hover:shadow-xl transform hover:scale-105`
//                     : "text-gray-600 hover:text-gray-800 hover:bg-gray-100/50"
//                   }`}
//                 onClick={() => setActiveTab(tab.id as TabType)}
//               >
//                 <div className="flex items-center gap-2">
//                   <IconComponent className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
//                   <span className="text-sm sm:text-base">{tab.label}</span>
//                 </div>
//                 {isActive && (
//                   <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>
//                 )}
//               </Button>
//             );
//           })}
//         </div>
//       </div>
//     </div>

//     {/* Task Board */}
//     <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-8 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
//       {columns.map((column: any, index: number) => (
//         <div
//           key={column?.id}
//           style={{
//             animationDelay: `${index * 150}ms`,
//             animation: 'slideInFromBottom 0.6s ease-out forwards'
//           }}
//         >
//           <TaskColumn column={column} tasks={tasks} />
//         </div>
//       ))}

//       {/* Add New Column */}
//       <Dialog
//         open={showNewColumnDialog}
//         onOpenChange={setShowNewColumnDialog}
//       >
//         <DialogTrigger asChild>
//           <div className="min-w-[280px] w-80 flex-shrink-0 group cursor-pointer">
//             <div className="bg-gradient-to-br from-gray-50/80 to-gray-100/60 backdrop-blur-sm rounded-2xl p-6 border-2 border-dashed border-gray-300/60 hover:border-gray-400/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group-hover:from-blue-50/80 group-hover:to-purple-50/60">
//               <div className="flex flex-col items-center justify-center space-y-4 py-8">
//                 <div className="w-14 h-14 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 group-hover:from-blue-500 group-hover:to-purple-500 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
//                   <Plus className="w-7 h-7 text-white" />
//                 </div>
//                 <div className="text-center">
//                   <h3 className="font-semibold text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
//                     Create New Status
//                   </h3>
//                   <p className="text-sm text-gray-500 mt-1">
//                     Add a custom workflow stage
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </DialogTrigger>
//         <DialogContent className="rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
//           <DialogHeader>
//             <DialogTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
//               Create New Status
//             </DialogTitle>
//           </DialogHeader>
//           <div className="space-y-6 mt-6">
//             <div className="space-y-2">
//               <label className="text-sm font-semibold text-gray-700">Status Name</label>
//               <Input
//                 placeholder="Enter status name..."
//                 value={newColumn}
//                 onChange={(e) => setNewColumn(e.target.value)}
//                 className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/80"
//               />
//             </div>
//             <Button
//               onClick={addNewColumn}
//               disabled={createColumnMutation.isPending}
//               className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
//             >
//               {createColumnMutation.isPending ? (
//                 <div className="flex items-center gap-2">
//                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                   Creating...
//                 </div>
//               ) : (
//                 <div className="flex items-center gap-2">
//                   <Plus className="w-4 h-4" />
//                   Create Status
//                 </div>
//               )}
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   </div>

//   {/* Custom Animations */}
//   <style jsx>{`
//     @keyframes fadeInUp {
//       from {
//         opacity: 0;
//         transform: translateY(20px);
//       }
//       to {
//         opacity: 1;
//         transform: translateY(0);
//       }
//     }
    
//     @keyframes slideInFromBottom {
//       from {
//         opacity: 0;
//         transform: translateY(40px);
//       }
//       to {
//         opacity: 1;
//         transform: translateY(0);
//       }
//     }
    
//     .scrollbar-thin {
//       scrollbar-width: thin;
//     }
    
//     .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
//       background-color: #d1d5db;
//       border-radius: 9999px;
//     }
    
//     .scrollbar-track-gray-100::-webkit-scrollbar-track {
//       background-color: #f3f4f6;
//       border-radius: 9999px;
//     }
    
//     .scrollbar-thin::-webkit-scrollbar {
//       height: 8px;
//     }
//   `}</style>
// </div>
//   );
// };

// export default TaskBoard;


















































// "use client";

// import React, { useState, useEffect } from "react";
// import { Plus, Sparkles, Calendar, Users, Code, TrendingUp } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { TabType, Task } from "@/lib/types/taskManager/types";
// import { isSprintTask, isStandardTask } from "@/lib/types/taskManager/types";
// import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
// import { toast } from "sonner";
// import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";
// import SprintTaskCard from "../Cards/SprintTaskCard";
// import StandardTaskCard from "../Cards/StandardTaskCard";
// import { ColumnActionButtons } from "./buttons/ColumnActionButtons";
// import NewTaskModal from "./NewTaskModal";

// const TaskBoard: React.FC = () => {
//   const { currentProject, projectId } = useProjectContext();
//   const [activeTab, setActiveTab] = useState<TabType>("viewAll");
//   const [newColumn, setNewColumn] = useState("");
//   const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);

//   const tabs = [
//     { id: "viewAll", label: "View All", icon: Sparkles, gradient: "from-purple-500 to-pink-500" },
//     { id: "sprints", label: "Sprints", icon: Calendar, gradient: "from-blue-500 to-cyan-500" },
//     { id: "marketing", label: "Marketing", icon: TrendingUp, gradient: "from-green-500 to-emerald-500" },
//     { id: "sales", label: "Sales", icon: Users, gradient: "from-orange-500 to-red-500" },
//     { id: "development", label: "Development", icon: Code, gradient: "from-indigo-500 to-purple-500" },
//   ];

//   // API Hooks
//   const {
//     useProjectTasksQuery,
//     useProjectStatusesQuery,
//     useCreateProjectStatusMutation,
//     useUpdateTaskStatusMutation,
//   } = useAuthAwareTaskManagerApi();

//   // Fetch tasks and statuses for the current project
//   const {
//     data: tasks = [],
//     isLoading: isLoadingTasks,
//     error: tasksError,
//   } = useProjectTasksQuery(
//     projectId || "",
//     activeTab === "viewAll" ? undefined : activeTab,
//     undefined, // status
//     undefined, // epicId
//     undefined, // milestoneId
//     undefined // assignee
//   );

//   const {
//     data: columns = [],
//     isLoading: isLoadingColumns,
//     error: columnsError,
//   } = useProjectStatusesQuery(projectId || "");

//   // Set up mutations
//   const createColumnMutation = useCreateProjectStatusMutation();
//   const updateTaskStatusMutation = useUpdateTaskStatusMutation();

//   // Handle loading and error states
//   useEffect(() => {
//     if (tasksError) {
//       toast("There was a problem loading your tasks. Please try again.");
//     }
//     if (columnsError) {
//       toast("There was a problem loading your columns. Please try again.");
//     }
//   }, [tasksError, columnsError]);

//   // Add new column
//   const addNewColumn = () => {
//     if (newColumn.trim() && projectId) {
//       // Default color for new columns
//       const color = "#f3f4f6"; // Light gray

//       createColumnMutation.mutate(
//         { projectId, name: newColumn, color },
//         {
//           onSuccess: () => {
//             setNewColumn("");
//             setShowNewColumnDialog(false);
//           },
//         }
//       );
//     }
//   };

//   // Helper function for task type discrimination
//   const renderTask = (task: Task) => {
//     if (isSprintTask(task)) {
//       return <SprintTaskCard task={task} className="mb-4" />;
//     }
//     if (isStandardTask(task)) {
//       return <StandardTaskCard task={task} className="mb-4" />;
//     }
//     return null;
//   };

//   // Drag and drop handlers
//   const handleDragStart = (e: React.DragEvent, taskId: string) => {
//     e.dataTransfer.setData("taskId", taskId);
//   };

//   const handleDrop = (e: React.DragEvent, status: string) => {
//     e.preventDefault();
//     const taskId = e.dataTransfer.getData("taskId");

//     if (taskId && projectId) {
//       updateTaskStatusMutation.mutate({
//         projectId,
//         taskId,
//         status,
//       });
//     }
//   };

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//   };

//   // Task column component
//   const TaskColumn = ({ column, tasks }: { column: any; tasks: Task[] }) => {
//     const tasksInColumn = tasks.filter(
//       (task) => task?.status.toLowerCase() === column?.name.toLowerCase()
//     );

//     return (
//       <div
//         className="min-w-[280px] w-full sm:w-80 flex-shrink-0 group"
//         onDrop={(e) => handleDrop(e, column.name)}
//         onDragOver={handleDragOver}
//       >
//         <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
//           <div className="flex justify-between items-center mb-6">
//             <div className="space-y-2">
//               <div className="flex items-center gap-3">
//                 <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse"></div>
//                 <h3 className="font-bold text-lg text-gray-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
//                   {column.name}
//                 </h3>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full">
//                   <p className="text-xs font-semibold text-gray-600">
//                     {tasksInColumn.length} task{tasksInColumn.length !== 1 ? "s" : ""}
//                   </p>
//                 </div>
//               </div>
//             </div>
//             <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
//               <ColumnActionButtons
//                 column={column}
//                 onAddTask={() => {
//                   // Column-specific task creation
//                 }}
//               />
//             </div>
//           </div>
          
//           <div className="space-y-3 min-h-[120px]">
//             {tasksInColumn.length > 0 ? (
//               tasksInColumn.map((task, index) => (
//                 <div
//                   key={task.id}
//                   draggable
//                   onDragStart={(e) => handleDragStart(e, task.id as string)}
//                   className="transform hover:scale-[1.02] transition-transform duration-200"
//                   style={{
//                     animationDelay: `${index * 100}ms`,
//                     animation: 'fadeInUp 0.5s ease-out forwards'
//                   }}
//                 >
//                   {renderTask(task)}
//                 </div>
//               ))
//             ) : (
//               <div className="h-28 border-2 border-dashed border-gray-300/60 rounded-xl flex items-center justify-center bg-gradient-to-br from-gray-50/50 to-gray-100/30 hover:from-blue-50/50 hover:to-purple-50/30 transition-all duration-300 group/drop">
//                 <div className="text-center space-y-2">
//                   <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center group-hover/drop:from-blue-400 group-hover/drop:to-purple-400 transition-all duration-300">
//                     <Plus className="w-4 h-4 text-white" />
//                   </div>
//                   <p className="text-sm text-gray-500 font-medium group-hover/drop:text-gray-700 transition-colors duration-300">
//                     Drop tasks here
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Loading state
//   if (isLoadingTasks || isLoadingColumns) {
//     return (
//       <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
//         <div className="text-center space-y-4">
//           <div className="relative">
//             <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-spin">
//               <div className="absolute inset-2 bg-white rounded-full"></div>
//             </div>
//           </div>
//           <p className="text-lg font-semibold text-gray-700 animate-pulse">Loading task board...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 p-4 sm:p-6 lg:p-8 rounded-2xl">
//       <div className="max-w-full mx-auto">
//         {/* Header Section */}
//         <div className="mb-8">
//           <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
//             <div className="flex-grow">
//               <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 mb-2">
//                 Project Dashboard
//               </h1>
//               <p className="text-gray-600 text-sm sm:text-base">Manage your tasks with style and efficiency</p>
//             </div>
//             <div className="w-full sm:w-auto">
//               <NewTaskModal activeTab={activeTab} projectId={projectId || ""} />
//             </div>
//           </div>

//           {/* Enhanced Tab Navigation */}
//           <div className="bg-white/80 backdrop-blur-sm p-2 rounded-2xl border border-gray-200/50 overflow-x-auto">
//             <div className="flex gap-2 min-w-max sm:min-w-0">
//               {tabs.map((tab) => {
//                 const IconComponent = tab.icon;
//                 const isActive = activeTab === tab.id;
                
//                 return (
//                   <Button
//                     key={tab.id}
//                     variant="ghost"
//                     className={`relative px-4 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap ${
//                       isActive
//                         ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg hover:shadow-xl transform hover:scale-105`
//                         : "text-gray-600 hover:text-gray-800 hover:bg-gray-100/50"
//                     }`}
//                     onClick={() => setActiveTab(tab.id as TabType)}
//                   >
//                     <div className="flex items-center gap-2">
//                       <IconComponent className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
//                       <span className="text-sm sm:text-base">{tab.label}</span>
//                     </div>
//                     {isActive && (
//                       <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>
//                     )}
//                   </Button>
//                 );
//               })}
//             </div>
//           </div>
//         </div>

//         {/* Task Board */}
//         <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-8 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
//           {columns.map((column: any, index: number) => (
//             <div
//               key={column?.id}
//               style={{
//                 animationDelay: `${index * 150}ms`,
//                 animation: 'slideInFromBottom 0.6s ease-out forwards'
//               }}
//             >
//               <TaskColumn column={column} tasks={tasks} />
//             </div>
//           ))}

//           {/* Add New Column */}
//           <Dialog
//             open={showNewColumnDialog}
//             onOpenChange={setShowNewColumnDialog}
//           >
//             <DialogTrigger asChild>
//               <div className="min-w-[280px] w-80 flex-shrink-0 group cursor-pointer">
//                 <div className="bg-gradient-to-br from-gray-50/80 to-gray-100/60 backdrop-blur-sm rounded-2xl p-6 border-2 border-dashed border-gray-300/60 hover:border-gray-400/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group-hover:from-blue-50/80 group-hover:to-purple-50/60">
//                   <div className="flex flex-col items-center justify-center space-y-4 py-8">
//                     <div className="w-14 h-14 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 group-hover:from-blue-500 group-hover:to-purple-500 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
//                       <Plus className="w-7 h-7 text-white" />
//                     </div>
//                     <div className="text-center">
//                       <h3 className="font-semibold text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
//                         Create New Status
//                       </h3>
//                       <p className="text-sm text-gray-500 mt-1">
//                         Add a custom workflow stage
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </DialogTrigger>
//             <DialogContent className="rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
//               <DialogHeader>
//                 <DialogTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
//                   Create New Status
//                 </DialogTitle>
//               </DialogHeader>
//               <div className="space-y-6 mt-6">
//                 <div className="space-y-2">
//                   <label className="text-sm font-semibold text-gray-700">Status Name</label>
//                   <Input
//                     placeholder="Enter status name..."
//                     value={newColumn}
//                     onChange={(e) => setNewColumn(e.target.value)}
//                     className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/80"
//                   />
//                 </div>
//                 <Button
//                   onClick={addNewColumn}
//                   disabled={createColumnMutation.isPending}
//                   className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
//                 >
//                   {createColumnMutation.isPending ? (
//                     <div className="flex items-center gap-2">
//                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                       Creating...
//                     </div>
//                   ) : (
//                     <div className="flex items-center gap-2">
//                       <Plus className="w-4 h-4" />
//                       Create Status
//                     </div>
//                   )}
//                 </Button>
//               </div>
//             </DialogContent>
//           </Dialog>
//         </div>
//       </div>

//       {/* Custom Animations */}
//       <style jsx>{`
//         @keyframes fadeInUp {
//           from {
//             opacity: 0;
//             transform: translateY(20px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
        
//         @keyframes slideInFromBottom {
//           from {
//             opacity: 0;
//             transform: translateY(40px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
        
//         .scrollbar-thin {
//           scrollbar-width: thin;
//         }
        
//         .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
//           background-color: #d1d5db;
//           border-radius: 9999px;
//         }
        
//         .scrollbar-track-gray-100::-webkit-scrollbar-track {
//           background-color: #f3f4f6;
//           border-radius: 9999px;
//         }
        
//         .scrollbar-thin::-webkit-scrollbar {
//           height: 8px;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default TaskBoard;





































// "use client";

// import React, { useState, useEffect } from "react";
// import { Plus } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { TabType, Task } from "@/lib/types/taskManager/types";
// import { isSprintTask, isStandardTask } from "@/lib/types/taskManager/types";
// import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
// import { toast } from "sonner";
// import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";
// import SprintTaskCard from "../Cards/SprintTaskCard";
// import StandardTaskCard from "../Cards/StandardTaskCard";
// import { ColumnActionButtons } from "./buttons/ColumnActionButtons";
// import NewTaskModal from "./NewTaskModal";

// const TaskBoard: React.FC = () => {
//   const { currentProject, projectId } = useProjectContext();
//   const [activeTab, setActiveTab] = useState<TabType>("viewAll");
//   const [newColumn, setNewColumn] = useState("");
//   const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);

//   const tabs = [
//     { id: "viewAll", label: "View All" },
//     { id: "sprints", label: "Sprints" },
//     { id: "marketing", label: "Marketing" },
//     { id: "sales", label: "Sales" },
//     { id: "development", label: "Development" },
//   ];

//   // API Hooks
//   const {
//     useProjectTasksQuery,
//     useProjectStatusesQuery,
//     useCreateProjectStatusMutation,
//     useUpdateTaskStatusMutation,
//   } = useAuthAwareTaskManagerApi();

//   // Fetch tasks and statuses for the current project
//   const {
//     data: tasks = [],
//     isLoading: isLoadingTasks,
//     error: tasksError,
//   } = useProjectTasksQuery(
//     projectId || "",
//     activeTab === "viewAll" ? undefined : activeTab,
//     undefined, // status
//     undefined, // epicId
//     undefined, // milestoneId
//     undefined // assignee
//   );

//   const {
//     data: columns = [],
//     isLoading: isLoadingColumns,
//     error: columnsError,
//   } = useProjectStatusesQuery(projectId || "");

//   // Set up mutations
//   const createColumnMutation = useCreateProjectStatusMutation();
//   const updateTaskStatusMutation = useUpdateTaskStatusMutation();

//   // Handle loading and error states
//   useEffect(() => {
//     if (tasksError) {
//       toast("There was a problem loading your tasks. Please try again.");
//     }
//     if (columnsError) {
//       toast("There was a problem loading your columns. Please try again.");
//     }
//   }, [tasksError, columnsError]);

//   // Add new column
//   const addNewColumn = () => {
//     if (newColumn.trim() && projectId) {
//       // Default color for new columns
//       const color = "#f3f4f6"; // Light gray

//       createColumnMutation.mutate(
//         { projectId, name: newColumn, color },
//         {
//           onSuccess: () => {
//             setNewColumn("");
//             setShowNewColumnDialog(false);
//           },
//         }
//       );
//     }
//   };

//   // Helper function for task type discrimination
//   const renderTask = (task: Task) => {
//     if (isSprintTask(task)) {
//       return <SprintTaskCard task={task} className="mb-4" />;
//     }
//     if (isStandardTask(task)) {
//       return <StandardTaskCard task={task} className="mb-4" />;
//     }
//     return null;
//   };

//   // Drag and drop handlers
//   const handleDragStart = (e: React.DragEvent, taskId: string) => {
//     e.dataTransfer.setData("taskId", taskId);
//   };

//   const handleDrop = (e: React.DragEvent, status: string) => {
//     e.preventDefault();
//     const taskId = e.dataTransfer.getData("taskId");

//     if (taskId && projectId) {
//       updateTaskStatusMutation.mutate({
//         projectId,
//         taskId,
//         status,
//       });
//     }
//   };

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//   };

//   // Task column component
//   const TaskColumn = ({ column, tasks }: { column: any; tasks: Task[] }) => {
//     const tasksInColumn = tasks.filter(
//       (task) => task?.status.toLowerCase() === column?.name.toLowerCase()
//     );

//     return (
//       <div
//         className="w-80 rounded-lg px-4"
//         onDrop={(e) => handleDrop(e, column.name)}
//         onDragOver={handleDragOver}
//       >
//         <div className="flex justify-between items-center mb-4">
//           <div>
//             <h3 className="font-semibold text-lg">{column.name}</h3>
//             <p className="text-xs text-gray-500">
//               {tasksInColumn.length} task{tasksInColumn.length !== 1 ? "s" : ""}
//             </p>
//           </div>
//           <div className="flex items-center gap-1">
//             <ColumnActionButtons
//               column={column}
//               onAddTask={() => {
//                 // Column-specific task creation
//               }}
//             />
//           </div>
//         </div>
//         <div className="space-y-4 min-h-[100px]">
//           {tasksInColumn.length > 0 ? (
//             tasksInColumn.map((task) => (
//               <div
//                 key={task.id}
//                 draggable
//                 onDragStart={(e) => handleDragStart(e, task.id as string)}
//               >
//                 {renderTask(task)}
//               </div>
//             ))
//           ) : (
//             <div className="h-24 border border-dashed border-gray-300 rounded-md flex items-center justify-center">
//               <p className="text-sm text-gray-400">Drop tasks here</p>
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   };

//   // Loading state
//   if (isLoadingTasks || isLoadingColumns) {
//     return (
//       <div className="w-full flex items-center justify-center py-12">
//         <p>Loading task board...</p>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <div className="mb-8">
//         <div className="flex items-center gap-4 mb-6">
//           <div className="flex-grow" />
//           <NewTaskModal activeTab={activeTab} projectId={projectId || ""} />
//         </div>

//         <div className="bg-gray-100 p-2 rounded-md inline-flex">
//           {tabs.map((tab) => (
//             <Button
//               key={tab.id}
//               variant="ghost"
//               className={`px-4 ${
//                 activeTab === tab.id ? "bg-white text-black" : ""
//               }`}
//               onClick={() => setActiveTab(tab.id as TabType)}
//             >
//               {tab.label}
//             </Button>
//           ))}
//         </div>
//       </div>

//       <div className="flex gap-6 overflow-x-auto pb-8">
//         {columns.map((column: any) => (
//           <TaskColumn key={column?.id} column={column} tasks={tasks} />
//         ))}

//         <Dialog
//           open={showNewColumnDialog}
//           onOpenChange={setShowNewColumnDialog}
//         >
//           <DialogTrigger asChild>
//             <div className="w-80 bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100">
//               <div className="flex items-center gap-2">
//                 <Plus className="w-5 h-5" />
//                 <span>Create a new status</span>
//               </div>
//             </div>
//           </DialogTrigger>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Create New Status</DialogTitle>
//             </DialogHeader>
//             <div className="space-y-4 mt-4">
//               <Input
//                 placeholder="Status Name"
//                 value={newColumn}
//                 onChange={(e) => setNewColumn(e.target.value)}
//               />
//               <Button
//                 onClick={addNewColumn}
//                 disabled={createColumnMutation.isPending}
//               >
//                 {createColumnMutation.isPending
//                   ? "Creating..."
//                   : "Create Status"}
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       </div>
//     </div>
//   );
// };

// export default TaskBoard;
