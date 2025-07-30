// components/PublicTaskDetailsModal.tsx
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  Tag, 
  BarChart2, 
  Clock, 
  Users, 
  Target,
  Zap,
  CheckCircle2,
  Circle,
  XCircle,
  Eye,
  ExternalLink
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

interface PublicTaskDetailsModalProps {
  task: PublicTaskData | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
}

export const PublicTaskDetailsModal: React.FC<PublicTaskDetailsModalProps> = ({
  task,
  isOpen,
  onOpenChange,
  projectName,
}) => {
  if (!task) return null;

  // Get status color and icon
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { color: string; icon: React.ReactNode }> = {
      'todo': { color: 'bg-slate-100 text-slate-800', icon: <Circle className="h-4 w-4" /> },
      'in-progress': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-4 w-4" /> },
      'in progress': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-4 w-4" /> },
      'done': { color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-4 w-4" /> },
      'completed': { color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-4 w-4" /> },
      'blocked': { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4" /> },
    };
    return statusMap[status.toLowerCase()] || { color: 'bg-gray-100 text-gray-800', icon: <Circle className="h-4 w-4" /> };
  };

  // Get progress gradient
  const getProgressGradient = (progress: number) => {
    if (progress >= 80) return "from-emerald-500 to-teal-600";
    if (progress >= 50) return "from-blue-500 to-indigo-600";
    if (progress >= 20) return "from-amber-500 to-orange-600";
    return "from-rose-500 to-pink-600";
  };

  const statusInfo = getStatusInfo(task.status);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-slate-50 to-blue-50/30 border-0 shadow-2xl rounded-2xl">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-xl animate-pulse delay-700"></div>
        </div>

        <DialogHeader className="relative z-10 border-b border-slate-200/50 pb-6 mb-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Eye className="h-3 w-3 mr-1" />
                  Public View
                </Badge>
                <Badge className={`${statusInfo.color} flex items-center gap-1`}>
                  {statusInfo.icon}
                  {task.status}
                </Badge>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-800 bg-clip-text text-transparent leading-tight">
                {task.title}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                From project: <strong>{projectName}</strong>
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="relative z-10 space-y-6 pt-6">
          {/* Description */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center">
              <Target className="h-4 w-4 mr-2 text-purple-500" />
              Description
            </h3>
            <p className="text-slate-700 leading-relaxed bg-slate-50/50 rounded-xl p-3 border border-slate-200/30 text-sm">
              {task.description || "No description provided."}
            </p>
          </div>

          {/* Progress */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 shadow-sm">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider flex items-center">
                  <BarChart2 className="h-4 w-4 mr-2 text-blue-500" />
                  Progress
                </h3>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {task.progress}%
                </span>
              </div>
              <div className="relative">
                <Progress value={task.progress} className="h-3 bg-slate-200" />
                <div 
                  className={`absolute inset-0 bg-gradient-to-r ${getProgressGradient(task.progress)} rounded-full transition-all duration-500 ease-out`}
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sprint Information (if applicable) */}
          {task.category === 'sprints' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {task.sprint && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-green-500" />
                    Sprint
                  </h3>
                  <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 px-3 py-2 rounded-xl font-medium">
                    {task.sprint}
                  </Badge>
                </div>
              )}
              
              {task.storyPoints && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center">
                    <BarChart2 className="h-4 w-4 mr-2 text-orange-500" />
                    Story Points
                  </h3>
                  <Badge 
                    variant="outline" 
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-red-50 text-orange-800 border-orange-200 px-3 py-2 rounded-xl font-medium w-fit"
                  >
                    <BarChart2 className="h-4 w-4" />
                    {task.storyPoints} pts
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Due Date */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-red-500" />
              Due Date
            </h3>
            <div className="flex items-center bg-slate-50/50 rounded-xl p-3 border border-slate-200/30">
              <Calendar className="h-5 w-5 mr-3 text-slate-400" />
              <span className="font-medium text-slate-700">
                {task.date || "No due date"}
              </span>
            </div>
          </div>

          {/* Tags and Assignees */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tags */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center">
                <Tag className="h-4 w-4 mr-2 text-pink-500" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {task.tags.length > 0 ? (
                  task.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 border border-pink-200 px-2 py-1 rounded-xl font-medium text-xs"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-slate-500 italic text-sm">No tags assigned</span>
                )}
              </div>
            </div>

            {/* Assignees */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center">
                <Users className="h-4 w-4 mr-2 text-indigo-500" />
                Team
              </h3>
              <div className="flex -space-x-2">
                {task.assignees.length > 0 ? (
                  task.assignees.map((assignee, index) => (
                    <Avatar
                      key={index}
                      className="h-10 w-10 border-2 border-white shadow-lg hover:scale-110 transition-transform duration-200"
                    >
                      <AvatarImage src={assignee} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-bold text-sm">
                        {`U${index + 1}`}
                      </AvatarFallback>
                    </Avatar>
                  ))
                ) : (
                  <span className="text-slate-500 italic text-sm">No assignees</span>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-slate-500" />
              Timeline
            </h3>
            <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-200/30">
              <p className="text-sm text-slate-700">
                <span className="font-medium">Created:</span> {new Date(task.createdAt).toLocaleDateString()} at {new Date(task.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Public View</p>
                <p>
                  You're viewing this task publicly. Some sensitive information may be hidden for privacy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};