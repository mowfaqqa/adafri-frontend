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