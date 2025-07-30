// app/public/tasks/[token]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Zap,
  ArrowLeft,
  ExternalLink,
  Eye,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";

interface PublicTask {
  id: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  tags: string[];
  assignees: string[];
  date: string;
  createdAt: string;
  lastModified: string;
  category: string;
  // Sprint-specific fields
  sprint?: string;
  storyPoints?: number;
}

interface PublicProject {
  id: string;
  name: string;
  description: string;
}

interface PublicTaskData {
  task: PublicTask;
  project: PublicProject;
}

const PublicTaskPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [data, setData] = useState<PublicTaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicTask = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/public/tasks/${token}`);
        
        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError("Failed to load task data");
        }
      } catch (err: any) {
        console.error("Error fetching public task:", err);
        if (err.response?.status === 404) {
          setError("Task not found or sharing has been disabled");
        } else if (err.response?.status === 403) {
          setError("Access denied - task sharing may have been disabled");
        } else {
          setError("Failed to load task. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchPublicTask();
    }
  }, [token]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-slate-600">Loading task...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to Load Task
            </h2>
            <p className="text-gray-600 mb-4">
              {error || "Something went wrong"}
            </p>
            <Button 
              onClick={() => router.back()} 
              variant="outline"
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { task, project } = data;

  // Get status color
  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'todo': 'bg-slate-100 text-slate-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'in progress': 'bg-blue-100 text-blue-800',
      'done': 'bg-green-100 text-green-800',
      'completed': 'bg-green-100 text-green-800',
      'blocked': 'bg-red-100 text-red-800',
      'review': 'bg-yellow-100 text-yellow-800',
    };
    return statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Get progress gradient
  const getProgressGradient = (progress: number) => {
    if (progress >= 80) return "from-emerald-500 to-teal-600";
    if (progress >= 50) return "from-blue-500 to-indigo-600";
    if (progress >= 20) return "from-amber-500 to-orange-600";
    return "from-rose-500 to-pink-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Public Task View
                </h1>
                <p className="text-sm text-gray-600">
                  {project.name}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <ExternalLink className="h-3 w-3 mr-1" />
              Public
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Task Header */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                    {task.title}
                  </CardTitle>
                  <p className="text-gray-600 leading-relaxed">
                    {task.description || "No description provided."}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge className={`px-3 py-1 ${getStatusColor(task.status)}`}>
                    {task.status}
                  </Badge>
                  {task.category === 'sprints' && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      Sprint Task
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Progress Card */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider flex items-center">
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
            </CardContent>
          </Card>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sprint Info (if applicable) */}
            {task.category === 'sprints' && task.sprint && (
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
                <CardContent className="pt-6">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3 flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-purple-500" />
                    Sprint Details
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Sprint:</span>
                      <Badge variant="outline">{task.sprint}</Badge>
                    </div>
                    {task.storyPoints && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Story Points:</span>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <BarChart2 className="h-3 w-3" />
                          {task.storyPoints} pts
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Due Date */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-red-500" />
                  Due Date
                </h3>
                <div className="flex items-center bg-slate-50 rounded-lg p-3">
                  <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                  <span className="font-medium text-slate-700">
                    {task.date || "No due date"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3 flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-pink-500" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {task.tags.length > 0 ? (
                    task.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500 italic">No tags assigned</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Assignees */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2 text-indigo-500" />
                  Team
                </h3>
                <div className="flex -space-x-2">
                  {task.assignees.length > 0 ? (
                    task.assignees.map((assignee, index) => (
                      <Avatar
                        key={index}
                        className="h-8 w-8 border-2 border-white shadow-lg"
                      >
                        <AvatarImage src={assignee} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-bold text-xs">
                          {`U${index + 1}`}
                        </AvatarFallback>
                      </Avatar>
                    ))
                  ) : (
                    <span className="text-gray-500 italic">No assignees</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-slate-500" />
                Timeline
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Created</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(task.createdAt).toLocaleDateString()} at{' '}
                    {new Date(task.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Last Modified</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(task.lastModified).toLocaleDateString()} at{' '}
                    {new Date(task.lastModified).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer Note */}
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">
              This is a public view of a task from <strong>{project.name}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicTaskPage;