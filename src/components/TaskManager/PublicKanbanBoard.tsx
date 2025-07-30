"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Tag, 
  BarChart2, 
  Clock, 
  Users, 
  Target,
  Eye,
  CheckCircle2,
  Circle,
  XCircle,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Code
} from "lucide-react";

interface PublicTaskData {
  id: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  tags: string[];
  assignees: string[];
  date: string;
  createdAt: string;
  category: string;
  sprint?: string;
  storyPoints?: number;
}

interface PublicKanbanBoardProps {
  tasks: PublicTaskData[];
  onTaskClick: (task: PublicTaskData) => void;
  projectName: string;
}

export const PublicKanbanBoard: React.FC<PublicKanbanBoardProps> = ({
  tasks,
  onTaskClick,
  projectName,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Define status columns based on common task statuses
  const statusColumns = [
    {
      id: "todo",
      name: "To Do",
      color: "bg-slate-100",
      textColor: "text-slate-700",
      borderColor: "border-slate-200",
      icon: Circle,
      matchPatterns: ["todo", "to do", "pending", "backlog"]
    },
    {
      id: "in-progress",
      name: "In Progress",
      color: "bg-blue-100",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
      icon: Clock,
      matchPatterns: ["in-progress", "in progress", "working", "active", "development"]
    },
    {
      id: "review",
      name: "Review",
      color: "bg-yellow-100",
      textColor: "text-yellow-700",
      borderColor: "border-yellow-200",
      icon: AlertCircle,
      matchPatterns: ["review", "testing", "qa", "validation"]
    },
    {
      id: "done",
      name: "Done",
      color: "bg-green-100",
      textColor: "text-green-700",
      borderColor: "border-green-200",
      icon: CheckCircle2,
      matchPatterns: ["done", "completed", "finished", "closed", "resolved"]
    },
    {
      id: "blocked",
      name: "Blocked",
      color: "bg-red-100",
      textColor: "text-red-700",
      borderColor: "border-red-200",
      icon: XCircle,
      matchPatterns: ["blocked", "stuck", "waiting", "on hold"]
    }
  ];

  // Category filters
  const categoryFilters = [
    { id: "all", label: "All Tasks", icon: Sparkles, gradient: "from-blue-500 to-cyan-500" },
    { id: "sprints", label: "Sprints", icon: Target, gradient: "from-green-500 to-emerald-500" },
    { id: "marketing", label: "Marketing", icon: TrendingUp, gradient: "from-orange-500 to-red-500" },
    { id: "sales", label: "Sales", icon: Users, gradient: "from-purple-500 to-pink-500" },
    { id: "development", label: "Development", icon: Code, gradient: "from-indigo-500 to-purple-500" },
  ];

  // Helper function to determine which column a task belongs to
  const getTaskColumn = (task: PublicTaskData) => {
    const taskStatus = task.status.toLowerCase();
    
    for (const column of statusColumns) {
      if (column.matchPatterns.some(pattern => taskStatus.includes(pattern))) {
        return column;
      }
    }
    
    // Default to todo if no match found
    return statusColumns[0];
  };

  // Filter tasks based on active filter
  const filteredTasks = tasks.filter(task => {
    if (activeFilter === "all") return true;
    return task.category === activeFilter;
  });

  // Group tasks by column
  const tasksByColumn = statusColumns.map(column => ({
    ...column,
    tasks: filteredTasks.filter(task => getTaskColumn(task).id === column.id)
  }));

  // Get progress gradient
  const getProgressGradient = (progress: number) => {
    if (progress >= 80) return "from-emerald-500 to-teal-600";
    if (progress >= 50) return "from-blue-500 to-indigo-600";
    if (progress >= 20) return "from-amber-500 to-orange-600";
    return "from-rose-500 to-pink-600";
  };

  // Task Card Component
  const PublicTaskCard: React.FC<{ task: PublicTaskData }> = ({ task }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        onClick={() => onTaskClick(task)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group"
      >
        {/* Task Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
            {task.title}
          </h4>
          {isHovered && (
            <Eye className="h-4 w-4 text-blue-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-500">Progress</span>
            <span className="text-xs font-semibold text-gray-700">{task.progress}%</span>
          </div>
          <div className="relative">
            <Progress value={task.progress} className="h-1.5 bg-gray-100" />
            <div 
              className={`absolute inset-0 bg-gradient-to-r ${getProgressGradient(task.progress)} rounded-full transition-all duration-300`}
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>

        {/* Sprint Info (if applicable) */}
        {task.category === 'sprints' && (
          <div className="flex items-center gap-2 mb-2">
            {task.sprint && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                <Target className="h-2 w-2 mr-1" />
                {task.sprint}
              </Badge>
            )}
            {task.storyPoints && (
              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                <BarChart2 className="h-2 w-2 mr-1" />
                {task.storyPoints} pts
              </Badge>
            )}
          </div>
        )}

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.tags.slice(0, 2).map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <Tag className="h-2 w-2 mr-1" />
                {tag}
              </Badge>
            ))}
            {task.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-500">
                +{task.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          {/* Due Date */}
          <div className="flex items-center text-xs text-gray-500">
            {task.date ? (
              <>
                <Calendar className="h-3 w-3 mr-1" />
                <span>{new Date(task.date).toLocaleDateString()}</span>
              </>
            ) : (
              <span>No due date</span>
            )}
          </div>

          {/* Assignees */}
          <div className="flex -space-x-1">
            {task.assignees.length > 0 ? (
              task.assignees.slice(0, 3).map((assignee, index) => (
                <Avatar
                  key={index}
                  className="h-5 w-5 border border-white shadow-sm"
                >
                  <AvatarImage src={assignee} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs font-bold">
                    {`U${index + 1}`}
                  </AvatarFallback>
                </Avatar>
              ))
            ) : (
              <span className="text-xs text-gray-400">Unassigned</span>
            )}
            {task.assignees.length > 3 && (
              <div className="h-5 w-5 bg-gray-200 border border-white rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Column Component
  const KanbanColumn: React.FC<{ column: any; tasks: PublicTaskData[] }> = ({ column, tasks }) => {
    const IconComponent = column.icon;

    return (
      <div className="w-72 flex-shrink-0 bg-gray-50 rounded-lg p-3">
        {/* Column Header */}
        <div className={`flex items-center justify-between mb-3 pb-2 border-b ${column.borderColor}`}>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${column.color}`}>
              <IconComponent className={`h-4 w-4 ${column.textColor}`} />
            </div>
            <div>
              <h3 className={`font-semibold text-sm ${column.textColor}`}>
                {column.name}
              </h3>
              <span className="text-xs text-gray-500">{tasks.length} tasks</span>
            </div>
          </div>
          <Badge variant="outline" className={`${column.color} ${column.textColor} border-transparent text-xs`}>
            {tasks.length}
          </Badge>
        </div>

        {/* Tasks */}
        <div className="space-y-2">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <PublicTaskCard key={task.id} task={task} />
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <IconComponent className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tasks</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-10 mb-6">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            {/* Title */}
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {projectName} - Task Board
              </h1>
              <p className="text-sm text-gray-600">
                Public view • {filteredTasks.length} total tasks
              </p>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categoryFilters.map((filter) => {
                const IconComponent = filter.icon;
                const isActive = activeFilter === filter.id;
                const taskCount = filter.id === "all" 
                  ? tasks.length 
                  : tasks.filter(task => task.category === filter.id).length;

                return (
                  <Button
                    key={filter.id}
                    variant="ghost"
                    onClick={() => setActiveFilter(filter.id)}
                    className={`flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? `bg-gradient-to-r ${filter.gradient} text-white shadow-md hover:shadow-lg`
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{filter.label}</span>
                    <Badge 
                      variant="secondary" 
                      className={`ml-1 ${
                        isActive 
                          ? "bg-white/20 text-white border-white/30" 
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {taskCount}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="max-w-[1300px] mx-auto px-4">
        <div className="flex gap-4 overflow-x-auto pb-6">
          {tasksByColumn.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={column.tasks}
            />
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tasks found
            </h3>
            <p className="text-gray-600">
              {activeFilter === "all" 
                ? "This project doesn't have any tasks yet."
                : `No tasks found in the ${categoryFilters.find(f => f.id === activeFilter)?.label} category.`
              }
            </p>
          </div>
        </div>
      )}

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        ::-webkit-scrollbar {
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background-color: rgba(0,0,0,0.2);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
};