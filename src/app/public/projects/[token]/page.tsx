// app/public/projects/[token]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Loader2,
  FolderOpen,
  CheckCircle2,
  Circle,
  XCircle,
  ChevronDown
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { PublicTaskDetailsModal } from "@/components/PublicTaskDetailsModal";
import { PublicKanbanBoard } from "@/components/TaskManager/PublicKanbanBoard";
import Link from "next/link";
import Image from "next/image";

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

interface PublicMember {
  displayName: string;
  role: string;
}

interface PublicProjectData {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  members: PublicMember[];
}

interface PublicProjectResponse {
  project: PublicProjectData;
  tasks: PublicTaskData[];
}

interface Feature {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
}

interface Tab {
  id: string;
  label: string;
  features: Feature[];
}

const PublicProjectPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [data, setData] = useState<PublicProjectResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTask, setSelectedTask] = useState<PublicTaskData | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (tabId: string) => {
    setOpenDropdown(openDropdown === tabId ? null : tabId);
  };

  const closeDropdown = () => {
    setOpenDropdown(null);
  };


  useEffect(() => {
    const fetchPublicProject = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/public/projects/${token}`);
        
        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError("Failed to load project data");
        }
      } catch (err: any) {
        console.error("Error fetching public project:", err);
        if (err.response?.status === 404) {
          setError("Project not found or sharing has been disabled");
        } else if (err.response?.status === 403) {
          setError("Access denied - project sharing may have been disabled");
        } else {
          setError("Failed to load project. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchPublicProject();
    }
  }, [token]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-slate-600">Loading project...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-[1300px] mx-auto">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to Load Project
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

  const { project, tasks } = data;

  // Calculate project statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => 
    task.status.toLowerCase() === 'done' || task.status.toLowerCase() === 'completed'
  ).length;
  const inProgressTasks = tasks.filter(task => 
    task.status.toLowerCase() === 'in-progress' || task.status.toLowerCase() === 'in progress'
  ).length;
  const todoTasks = tasks.filter(task => 
    task.status.toLowerCase() === 'todo'
  ).length;

  const averageProgress = totalTasks > 0 
    ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / totalTasks)
    : 0;

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

  const handleTaskClick = (task: PublicTaskData) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Logo and Button */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* logo and Navigation */}
            <div className="flex items-center gap-8">
              {/* Logo */}
              <div className="p-2 flex items-center justify-center">
                <Link
                  href="https://djombi.tech"
                  className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <Image
                      src="/icons/icon-main.png"
                      width={32}
                      height={32}
                      alt="icon"
                    />
                  </div>
                
                    <Image
                      src="/icons/djombi-icon.png"
                      width={120}
                      height={32}
                      alt="icon"
                      className="ml-2"
                    />
                </Link>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-6">
                {tabsData.map((tab) => (
                  <div key={tab.id} className="relative">
                    <button
                      onClick={() => toggleDropdown(tab.id)}
                      className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
                    >
                      <span className="font-medium">{tab.label}</span>
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform duration-200 ${
                          openDropdown === tab.id ? 'rotate-180' : ''
                        }`} 
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {openDropdown === tab.id && (
                      <>
                        {/* Backdrop */}
                        <div 
                          className="fixed inset-0 z-10"
                          onClick={closeDropdown}
                        />
                        
                        {/* Dropdown Content */}
                        <div className={`absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-20 overflow-hidden ${
                            tab.features.length > 4 ? 'w-96' : 'w-80'
                          }`}>
                            <div className="p-4">
                              <div className={`grid gap-3 ${
                                tab.features.length > 4 ? 'grid-cols-2' : 'grid-cols-1'
                              }`}>
                              {tab.features.map((feature) => (
                                <Link
                                  key={feature.id}
                                  href={feature.link}
                                  onClick={closeDropdown}
                                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-slate-50 ${
                                    !feature.isActive ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'
                                  }`}
                                >
                                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Image
                                      src={feature.imageUrl}
                                      width={24}
                                      height={24}
                                      alt={feature.title}
                                      className="w-6 h-6"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-slate-900 text-sm">
                                      {feature.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 truncate">
                                      {feature.subtitle}
                                    </p>
                                  </div>
                                  {/* {!feature.isActive && (
                                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                      Soon
                                    </span>
                                  )} */}
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Signup Button */}
           <Link
           
            href="https://djombi.tech/auth/login" target="_blank">
               <button
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
              >
                Signup
            </button>
           </Link>
          </div>
        </div>
      </div>


      {/* Header */}
      <div className="">
        <div className="max-w-[1800px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Public Project View
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
      <div className="max-w-[1800px] mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-8 bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-slate-200/50">
            <TabsTrigger value="overview" className="rounded-lg font-medium">
              <Target className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="board" className="rounded-lg font-medium">
              <FolderOpen className="h-4 w-4 mr-2" />
              Board View
            </TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-lg font-medium">
              <Zap className="h-4 w-4 mr-2" />
              Tasks ({totalTasks})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Project Header */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                  {project.name}
                </CardTitle>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {project.description || "No description provided."}
                </p>
                <div className="flex flex-wrap gap-4 pt-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Started: {new Date(project.startDate).toLocaleDateString()}</span>
                  </div>
                  {project.endDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Ends: {new Date(project.endDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{totalTasks}</div>
                    <div className="text-sm text-gray-600">Total Tasks</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">{completedTasks}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-500 mb-2">{inProgressTasks}</div>
                    <div className="text-sm text-gray-600">In Progress</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">{averageProgress}%</div>
                    <div className="text-sm text-gray-600">Avg Progress</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Team Members */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500" />
                  Team Members ({project.members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.members.map((member, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-bold">
                          {member.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{member.displayName}</p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${member.role === 'admin' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}
                        >
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="board" className="mt-0">
            <PublicKanbanBoard
              tasks={tasks}
              onTaskClick={handleTaskClick}
              projectName={project.name}
            />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  Project Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tasks.length > 0 ? (
                  <div className="space-y-4">
                    {tasks.map((task) => {
                      const statusInfo = getStatusInfo(task.status);
                      return (
                        <div
                          key={task.id}
                          className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl hover:bg-white/60 transition-colors duration-200 cursor-pointer group"
                          onClick={() => handleTaskClick(task)}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-3 mb-2">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors duration-200">
                                    {task.title}
                                  </h3>
                                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                    {task.description || "No description"}
                                  </p>
                                </div>
                                <Badge className={`${statusInfo.color} flex items-center gap-1`}>
                                  {statusInfo.icon}
                                  {task.status}
                                </Badge>
                              </div>

                              {/* Progress Bar */}
                              <div className="mb-3">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs font-medium text-gray-600">Progress</span>
                                  <span className="text-xs font-bold text-blue-600">{task.progress}%</span>
                                </div>
                                <Progress value={task.progress} className="h-2 bg-slate-200" />
                              </div>

                              {/* Task Details */}
                              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                {task.category === 'sprints' && (
                                  <>
                                    {task.sprint && (
                                      <div className="flex items-center gap-1">
                                        <Target className="h-3 w-3" />
                                        <span>{task.sprint}</span>
                                      </div>
                                    )}
                                    {task.storyPoints && (
                                      <div className="flex items-center gap-1">
                                        <BarChart2 className="h-3 w-3" />
                                        <span>{task.storyPoints} pts</span>
                                      </div>
                                    )}
                                  </>
                                )}
                                {task.date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{task.date}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>

                              {/* Tags */}
                              {task.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-3">
                                  {task.tags.map((tag, tagIndex) => (
                                    <Badge
                                      key={tagIndex}
                                      variant="secondary"
                                      className="text-xs flex items-center gap-1"
                                    >
                                      <Tag className="h-2 w-2" />
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Assignees */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-gray-500">Team:</span>
                              <div className="flex -space-x-1">
                                {task.assignees.length > 0 ? (
                                  task.assignees.slice(0, 3).map((assignee, index) => (
                                    <Avatar
                                      key={index}
                                      className="h-6 w-6 border-2 border-white shadow-sm"
                                    >
                                      <AvatarImage src={assignee} />
                                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs font-bold">
                                        {`U${index + 1}`}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-400 italic">Unassigned</span>
                                )}
                                {task.assignees.length > 3 && (
                                  <div className="h-6 w-6 bg-gray-200 border-2 border-white rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                                    +{task.assignees.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Zap className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 italic">No tasks in this project yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer Note */}
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">
            This is a public view of <strong>{project.name}</strong>. 
            Some sensitive information may be hidden for privacy.
          </p>
        </div>
      </div>

      {/* Task Details Modal */}
      <PublicTaskDetailsModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        projectName={project.name}
      />
    </div>
  );
};


const tabsData: Tab[] = [
  {
    id: "marketing",
    label: "Marketing", 
    features: [
      {
        id: "crm",
        title: "CRM",
        subtitle: "Manage customer relationships efficiently",
        imageUrl: "/icons/crm.png",
        link: "/dashboard/crm",
        isActive: true
      },
      {
        id: "post-publisher",
        title: "Post Publisher",
        subtitle: "Schedule and publish social content",
        imageUrl: "/icons/post-publisher.png",
        link: "/dashboard/post-publisher",
        isActive: true
      },
      {
        id: "social-listening",
        title: "Social Listening",
        subtitle: "Schedule and publish social content",
        imageUrl: "/icons/social.png",
        link: "/dashboard/social-listening",
        isActive: false
      },
      {
        id: "ai-calling",
        title: "AI Calling",
        subtitle: "Automated voice customer outreach",
        imageUrl: "/icons/ai-calling.png",
        link: "/dashboard/ai-calling",
        isActive: false
      },
    ]
  },
  {
    id: "tools",
    label: "Tools",
    features: [
      {
        id: "professional-mail",
        title: "Professional Mail",
        subtitle: "Send branded emails with ease",
        imageUrl: "/icons/online-meeting.png",
        link: "/dashboard/professional-mail",
        isActive: true
      },
      {
        id: "task-manager",
        title: "Task Manager",
        subtitle: "Organize and track your projects",
        imageUrl: "/icons/task-manager.png",
        link: "/dashboard/task-manager",
        isActive: true
      },
      {
        id: "invoice",
        title: "Invoice",
        subtitle: "Create and manage invoices",
        imageUrl: "/icons/invoice.png",
        link: "/dashboard/invoices",
        isActive: true
      },
      {
        id: "note",
        title: "Note",
        subtitle: "Capture and organize your ideas",
        imageUrl: "/icons/note.png",
        link: "/dashboard/notes",
        isActive: true
      },
      {
        id: "internal-message",
        title: "Internal Message",
        subtitle: "Team communication platform",
        imageUrl: "/icons/internal-message.png",
        link: "/dashboard/messaging",
        isActive: true
      },
      {
        id: "website-builder",
        title: "Website Builder",
        subtitle: "Build stunning websites easily",
        imageUrl: "/icons/website-builder.png",
        link: "/dashboard/website-builder",
        isActive: false
      },
      {
        id: "online-meeting",
        title: "Online Meeting",
        subtitle: "Host virtual meetings and calls",
        imageUrl: "/icons/online-meeting2.png",
        link: "/dashboard/online-message",
        isActive: false
      },
      {
        id: "e-sign",
        title: "E-Sign",
        subtitle: "Digital document signing",
        imageUrl: "/icons/e-sign.png",
        link: "/dashboard/e-sign",
        isActive: false
      },
      {
        id: "image-editor",
        title: "Image Editor",
        subtitle: "Edit and enhance your images",
        imageUrl: "/icons/image-editor.png",
        link: "/dashboard/image-editor",
        isActive: false
      },
    ],
  },
  {
    id: "advertising",
    label: "Advertising",
    features: [
      {
        id: "google-ads",
        title: "Google Ads",
        subtitle: "Run targeted Google advertising",
        imageUrl: "/icons/google-ads.png",
        link: "/dashboard/google-ads",
        isActive: true
      },
      {
        id: "sms",
        title: "SMS",
        subtitle: "Send bulk SMS campaigns",
        imageUrl: "/icons/sms.png",
        link: "/dashboard/google-ads",
        isActive: true
      },
      {
        id: "mass-mailing",
        title: "Mass Mailing",
        subtitle: "Email marketing at scale",
        imageUrl: "/icons/mass-mailing.png",
        link: "/dashboard/google-ads",
        isActive: true
      },
      {
        id: "Meta",
        title: "Meta",
        subtitle: "Facebook and Instagram ads",
        imageUrl: "/icons/meta.png",
        link: "/dashboard/meta",
        isActive: false
      },
      {
        id: "twitter",
        title: "Twitter",
        subtitle: "Promote on Twitter platform",
        imageUrl: "/icons/twitter.png",
        link: "/dashboard/twitter",
        isActive: false
      },
      {
        id: "tiktok",
        title: "Tiktok",
        subtitle: "Reach younger audiences",
        imageUrl: "/icons/tiktok.png",
        link: "/dashboard/tiktok",
        isActive: false
      },
      {
        id: "linkedIn",
        title: "LinkedIn",
        subtitle: "Professional network advertising",
        imageUrl: "/icons/linkedin.png",
        link: "/dashboard/linkedin",
        isActive: false
      },
      {
        id: "spotify",
        title: "Spotify",
        subtitle: "Audio advertising campaigns",
        imageUrl: "/icons/spotify.png",
        link: "/dashboard/spotify",
        isActive: false
      },
    ],
  }
];

export default PublicProjectPage;






































































// Muwa Original Code Snippet
// // app/public/projects/[token]/page.tsx
// "use client";

// import React, { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Button } from "@/components/ui/button";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { 
//   Calendar, 
//   Tag, 
//   BarChart2, 
//   Clock, 
//   Users, 
//   Target,
//   Zap,
//   ArrowLeft,
//   ExternalLink,
//   Eye,
//   AlertCircle,
//   Loader2,
//   FolderOpen,
//   CheckCircle2,
//   Circle,
//   XCircle
// } from "lucide-react";
// import { useParams, useRouter } from "next/navigation";
// import axios from "axios";
// import { PublicTaskDetailsModal } from "@/components/PublicTaskDetailsModal";
// import { PublicKanbanBoard } from "@/components/TaskManager/PublicKanbanBoard";

// interface PublicTaskData {
//   id: string;
//   title: string;
//   description: string;
//   status: string;
//   progress: number;
//   tags: string[];
//   assignees: string[];
//   date: string;
//   createdAt: string;
//   category: string;
//   sprint?: string;
//   storyPoints?: number;
// }

// interface PublicMember {
//   displayName: string;
//   role: string;
// }

// interface PublicProjectData {
//   id: string;
//   name: string;
//   description: string;
//   startDate: string;
//   endDate?: string;
//   members: PublicMember[];
// }

// interface PublicProjectResponse {
//   project: PublicProjectData;
//   tasks: PublicTaskData[];
// }

// const PublicProjectPage: React.FC = () => {
//   const params = useParams();
//   const router = useRouter();
//   const token = params.token as string;
  
//   const [data, setData] = useState<PublicProjectResponse | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [activeTab, setActiveTab] = useState("overview");
//   const [selectedTask, setSelectedTask] = useState<PublicTaskData | null>(null);
//   const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

//   useEffect(() => {
//     const fetchPublicProject = async () => {
//       try {
//         setLoading(true);
//         const response = await axios.get(`/api/public/projects/${token}`);
        
//         if (response.data.success) {
//           setData(response.data.data);
//         } else {
//           setError("Failed to load project data");
//         }
//       } catch (err: any) {
//         console.error("Error fetching public project:", err);
//         if (err.response?.status === 404) {
//           setError("Project not found or sharing has been disabled");
//         } else if (err.response?.status === 403) {
//           setError("Access denied - project sharing may have been disabled");
//         } else {
//           setError("Failed to load project. Please try again later.");
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (token) {
//       fetchPublicProject();
//     }
//   }, [token]);

//   // Loading state
//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
//         <div className="text-center space-y-4">
//           <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
//           <p className="text-slate-600">Loading project...</p>
//         </div>
//       </div>
//     );
//   }

//   // Error state
//   if (error || !data) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
//         <Card className="max-w-[1300px] mx-auto">
//           <CardContent className="text-center py-8">
//             <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
//             <h2 className="text-xl font-semibold text-gray-900 mb-2">
//               Unable to Load Project
//             </h2>
//             <p className="text-gray-600 mb-4">
//               {error || "Something went wrong"}
//             </p>
//             <Button 
//               onClick={() => router.back()} 
//               variant="outline"
//               className="mr-2"
//             >
//               <ArrowLeft className="h-4 w-4 mr-2" />
//               Go Back
//             </Button>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   const { project, tasks } = data;

//   // Calculate project statistics
//   const totalTasks = tasks.length;
//   const completedTasks = tasks.filter(task => 
//     task.status.toLowerCase() === 'done' || task.status.toLowerCase() === 'completed'
//   ).length;
//   const inProgressTasks = tasks.filter(task => 
//     task.status.toLowerCase() === 'in-progress' || task.status.toLowerCase() === 'in progress'
//   ).length;
//   const todoTasks = tasks.filter(task => 
//     task.status.toLowerCase() === 'todo'
//   ).length;

//   const averageProgress = totalTasks > 0 
//     ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / totalTasks)
//     : 0;

//   // Get status color and icon
//   const getStatusInfo = (status: string) => {
//     const statusMap: Record<string, { color: string; icon: React.ReactNode }> = {
//       'todo': { color: 'bg-slate-100 text-slate-800', icon: <Circle className="h-4 w-4" /> },
//       'in-progress': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-4 w-4" /> },
//       'in progress': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-4 w-4" /> },
//       'done': { color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-4 w-4" /> },
//       'completed': { color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-4 w-4" /> },
//       'blocked': { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4" /> },
//     };
//     return statusMap[status.toLowerCase()] || { color: 'bg-gray-100 text-gray-800', icon: <Circle className="h-4 w-4" /> };
//   };

//   const handleTaskClick = (task: PublicTaskData) => {
//     setSelectedTask(task);
//     setIsTaskModalOpen(true);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
//       {/* Header */}
//       <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-10">
//         <div className="max-w-[1300px] mx-auto px-4 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <FolderOpen className="h-6 w-6 text-blue-600" />
//               <div>
//                 <h1 className="text-lg font-semibold text-gray-900">
//                   Public Project View
//                 </h1>
//                 <p className="text-sm text-gray-600">
//                   {project.name}
//                 </p>
//               </div>
//             </div>
//             <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
//               <ExternalLink className="h-3 w-3 mr-1" />
//               Public
//             </Badge>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="max-w-[1300px] mx-auto px-4 py-8">
//         <Tabs value={activeTab} onValueChange={setActiveTab}>
//           <TabsList className="grid grid-cols-3 mb-8 bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-slate-200/50">
//             <TabsTrigger value="overview" className="rounded-lg font-medium">
//               <Target className="h-4 w-4 mr-2" />
//               Overview
//             </TabsTrigger>
//             <TabsTrigger value="board" className="rounded-lg font-medium">
//               <FolderOpen className="h-4 w-4 mr-2" />
//               Board View
//             </TabsTrigger>
//             <TabsTrigger value="tasks" className="rounded-lg font-medium">
//               <Zap className="h-4 w-4 mr-2" />
//               Tasks ({totalTasks})
//             </TabsTrigger>
//           </TabsList>

//           <TabsContent value="overview" className="space-y-6">
//             {/* Project Header */}
//             <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
//               <CardHeader>
//                 <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
//                   {project.name}
//                 </CardTitle>
//                 <p className="text-gray-600 leading-relaxed text-lg">
//                   {project.description || "No description provided."}
//                 </p>
//                 <div className="flex flex-wrap gap-4 pt-4 text-sm text-gray-600">
//                   <div className="flex items-center gap-2">
//                     <Calendar className="h-4 w-4" />
//                     <span>Started: {new Date(project.startDate).toLocaleDateString()}</span>
//                   </div>
//                   {project.endDate && (
//                     <div className="flex items-center gap-2">
//                       <Calendar className="h-4 w-4" />
//                       <span>Ends: {new Date(project.endDate).toLocaleDateString()}</span>
//                     </div>
//                   )}
//                 </div>
//               </CardHeader>
//             </Card>

//             {/* Statistics Grid */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//               <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
//                 <CardContent className="pt-6">
//                   <div className="text-center">
//                     <div className="text-3xl font-bold text-blue-600 mb-2">{totalTasks}</div>
//                     <div className="text-sm text-gray-600">Total Tasks</div>
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
//                 <CardContent className="pt-6">
//                   <div className="text-center">
//                     <div className="text-3xl font-bold text-green-600 mb-2">{completedTasks}</div>
//                     <div className="text-sm text-gray-600">Completed</div>
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
//                 <CardContent className="pt-6">
//                   <div className="text-center">
//                     <div className="text-3xl font-bold text-blue-500 mb-2">{inProgressTasks}</div>
//                     <div className="text-sm text-gray-600">In Progress</div>
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
//                 <CardContent className="pt-6">
//                   <div className="text-center">
//                     <div className="text-3xl font-bold text-purple-600 mb-2">{averageProgress}%</div>
//                     <div className="text-sm text-gray-600">Avg Progress</div>
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Team Members */}
//             <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Users className="h-5 w-5 text-indigo-500" />
//                   Team Members ({project.members.length})
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                   {project.members.map((member, index) => (
//                     <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
//                       <Avatar className="h-10 w-10">
//                         <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-bold">
//                           {member.displayName.charAt(0).toUpperCase()}
//                         </AvatarFallback>
//                       </Avatar>
//                       <div>
//                         <p className="font-medium text-gray-900">{member.displayName}</p>
//                         <Badge 
//                           variant="outline" 
//                           className={`text-xs ${member.role === 'admin' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}
//                         >
//                           {member.role}
//                         </Badge>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </CardContent>
//             </Card>
//           </TabsContent>

//           <TabsContent value="board" className="mt-0">
//             <PublicKanbanBoard
//               tasks={tasks}
//               onTaskClick={handleTaskClick}
//               projectName={project.name}
//             />
//           </TabsContent>

//           <TabsContent value="tasks" className="space-y-6">
//             <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Zap className="h-5 w-5 text-blue-500" />
//                   Project Tasks
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {tasks.length > 0 ? (
//                   <div className="space-y-4">
//                     {tasks.map((task) => {
//                       const statusInfo = getStatusInfo(task.status);
//                       return (
//                         <div
//                           key={task.id}
//                           className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl hover:bg-white/60 transition-colors duration-200 cursor-pointer group"
//                           onClick={() => handleTaskClick(task)}
//                         >
//                           <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
//                             <div className="flex-1 min-w-0">
//                               <div className="flex items-start gap-3 mb-2">
//                                 <div className="flex-1">
//                                   <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors duration-200">
//                                     {task.title}
//                                   </h3>
//                                   <p className="text-sm text-gray-600 mb-3 line-clamp-2">
//                                     {task.description || "No description"}
//                                   </p>
//                                 </div>
//                                 <Badge className={`${statusInfo.color} flex items-center gap-1`}>
//                                   {statusInfo.icon}
//                                   {task.status}
//                                 </Badge>
//                               </div>

//                               {/* Progress Bar */}
//                               <div className="mb-3">
//                                 <div className="flex justify-between items-center mb-1">
//                                   <span className="text-xs font-medium text-gray-600">Progress</span>
//                                   <span className="text-xs font-bold text-blue-600">{task.progress}%</span>
//                                 </div>
//                                 <Progress value={task.progress} className="h-2 bg-slate-200" />
//                               </div>

//                               {/* Task Details */}
//                               <div className="flex flex-wrap gap-4 text-xs text-gray-500">
//                                 {task.category === 'sprints' && (
//                                   <>
//                                     {task.sprint && (
//                                       <div className="flex items-center gap-1">
//                                         <Target className="h-3 w-3" />
//                                         <span>{task.sprint}</span>
//                                       </div>
//                                     )}
//                                     {task.storyPoints && (
//                                       <div className="flex items-center gap-1">
//                                         <BarChart2 className="h-3 w-3" />
//                                         <span>{task.storyPoints} pts</span>
//                                       </div>
//                                     )}
//                                   </>
//                                 )}
//                                 {task.date && (
//                                   <div className="flex items-center gap-1">
//                                     <Calendar className="h-3 w-3" />
//                                     <span>{task.date}</span>
//                                   </div>
//                                 )}
//                                 <div className="flex items-center gap-1">
//                                   <Clock className="h-3 w-3" />
//                                   <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
//                                 </div>
//                               </div>

//                               {/* Tags */}
//                               {task.tags.length > 0 && (
//                                 <div className="flex flex-wrap gap-1 mt-3">
//                                   {task.tags.map((tag, tagIndex) => (
//                                     <Badge
//                                       key={tagIndex}
//                                       variant="secondary"
//                                       className="text-xs flex items-center gap-1"
//                                     >
//                                       <Tag className="h-2 w-2" />
//                                       {tag}
//                                     </Badge>
//                                   ))}
//                                 </div>
//                               )}
//                             </div>

//                             {/* Assignees */}
//                             <div className="flex items-center gap-2 flex-shrink-0">
//                               <span className="text-xs text-gray-500">Team:</span>
//                               <div className="flex -space-x-1">
//                                 {task.assignees.length > 0 ? (
//                                   task.assignees.slice(0, 3).map((assignee, index) => (
//                                     <Avatar
//                                       key={index}
//                                       className="h-6 w-6 border-2 border-white shadow-sm"
//                                     >
//                                       <AvatarImage src={assignee} />
//                                       <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs font-bold">
//                                         {`U${index + 1}`}
//                                       </AvatarFallback>
//                                     </Avatar>
//                                   ))
//                                 ) : (
//                                   <span className="text-xs text-gray-400 italic">Unassigned</span>
//                                 )}
//                                 {task.assignees.length > 3 && (
//                                   <div className="h-6 w-6 bg-gray-200 border-2 border-white rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
//                                     +{task.assignees.length - 3}
//                                   </div>
//                                 )}
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 ) : (
//                   <div className="text-center py-12">
//                     <Zap className="h-12 w-12 text-slate-300 mx-auto mb-4" />
//                     <p className="text-slate-500 italic">No tasks in this project yet.</p>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </TabsContent>
//         </Tabs>

//         {/* Footer Note */}
//         <div className="text-center py-6">
//           <p className="text-sm text-gray-500">
//             This is a public view of <strong>{project.name}</strong>. 
//             Some sensitive information may be hidden for privacy.
//           </p>
//         </div>
//       </div>

//       {/* Task Details Modal */}
//       <PublicTaskDetailsModal
//         task={selectedTask}
//         isOpen={isTaskModalOpen}
//         onOpenChange={setIsTaskModalOpen}
//         projectName={project.name}
//       />
//     </div>
//   );
// };

// export default PublicProjectPage;