"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  PenSquare,
  Calendar,
  Plus,
  AlertTriangle,
  Paperclip,
  ListChecks,
  X,
  Sparkles,
  Target,
  Users,
  Tag,
  Clock,
  Zap,
  Layers,
  Activity,
  BarChart3,
  Rocket,
  CheckCircle,
  Flame,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SprintTaskFormData } from "@/lib/types/taskManager/types";
import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";

interface CreateSprintFormProps {
  onSubmit: (data: SprintTaskFormData) => void;
  isSubmitting: boolean;
  projectId: string;
  defaultStatus?: string;
}

const CreateSprintForm: React.FC<CreateSprintFormProps> = ({
  onSubmit,
  isSubmitting,
  projectId,
  defaultStatus,
}) => {
  const { currentProject } = useProjectContext();
  const { useEpicsQuery, useMilestonesQuery, useProjectStatusesQuery } =
    useAuthAwareTaskManagerApi();

  // Fetch epics, milestones, and statuses for the current project
  const { data: epics = [] } = useEpicsQuery(projectId);
  const { data: milestones = [] } = useMilestonesQuery(projectId);
  const { data: statuses = [] } = useProjectStatusesQuery(projectId);

  const [formData, setFormData] = useState<SprintTaskFormData>({
    title: "",
    description: "",
    status: statuses.length > 0 ? statuses[0].name : "todo",
    date: new Date().toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    tags: "",
    assignees: [],
    category: "sprints",
    progress: 0,
    storyPoints: 0,
    sprint: "Sprint 1",
    projectId: projectId,
    epicId: "", // Will be populated when user selects an epic
    milestoneId: "", // Optional - will be populated if user selects a milestone
  });

  useEffect(() => {
    if (defaultStatus) {
      setFormData((prev) => ({ ...prev, status: defaultStatus }));
    } else if (statuses.length > 0 && !formData.status) {
      setFormData((prev) => ({ ...prev, status: statuses[0].name }));
    }
  }, [defaultStatus, statuses]);

  const [priority, setPriority] = useState<string>("medium");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStoryPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 0;
    setFormData((prev) => ({ ...prev, storyPoints: value }));
  };

  const handleEpicChange = (epicId: string) => {
    setFormData((prev) => ({ ...prev, epicId }));
  };

  const handleMilestoneChange = (milestoneId: string) => {
    setFormData((prev) => ({ ...prev, milestoneId }));
  };

  const handleStatusChange = (status: string) => {
    setFormData((prev) => ({ ...prev, status }));
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    // Map priority to tags
    let tags = formData.tags;
    if (!tags.includes(priority)) {
      tags = tags ? `${tags},${priority}` : priority;
    }

    onSubmit({
      ...formData,
      tags,
    });
  };

  const priorityOptions = [
    { value: "high", label: "High", color: "bg-red-500", border: "border-red-200" },
    { value: "medium", label: "Medium", color: "bg-amber-500", border: "border-amber-200" },
    { value: "low", label: "Low", color: "bg-green-500", border: "border-green-200" },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Animated Header */}
      <div className="relative mb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 opacity-10 animate-pulse"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-teal-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg blur opacity-75 animate-pulse"></div>
              <div className="relative p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg">
                <Rocket className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-teal-800 to-cyan-800 bg-clip-text text-transparent">
                Create Sprint Task
              </h2>
              <p className="text-gray-500 text-xs">Turn epics into actionable sprints ⚡</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Form Container */}
      <div className="max-h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-teal-300 scrollbar-track-gray-100 pr-2">
        <form onSubmit={handleSubmitForm} className="space-y-5">
          
          {/* Task Title - Compact Design */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            <div className="relative p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <Label className="text-sm font-semibold text-gray-700">Task Name</Label>
              </div>
              <Input
                name="title"
                placeholder="What sprint task needs to be accomplished?"
                className="border-0 bg-transparent text-normal font-medium placeholder:text-gray-400 focus:ring-1 focus:ring-blue-500"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Description - Compact */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            <div className="relative p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <PenSquare className="w-4 h-4 text-purple-600" />
                <Label className="text-sm font-semibold text-gray-700">Description</Label>
              </div>
              <Textarea
                name="description"
                placeholder="Describe the sprint task details..."
                className="min-h-[80px] border-0 bg-transparent placeholder:text-gray-400 focus:ring-1 focus:ring-purple-500 resize-none"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Epic & Milestone - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              <div className="relative p-3 border border-gray-200 rounded-lg hover:border-emerald-300 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <Label className="text-sm font-semibold text-gray-700">Epic</Label>
                </div>
                <Select
                  value={formData.epicId}
                  onValueChange={handleEpicChange}
                  required
                >
                  <SelectTrigger className="border-0 bg-transparent h-8">
                    <SelectValue placeholder="Select epic" />
                  </SelectTrigger>
                  <SelectContent>
                    {epics.length === 0 ? (
                      <div className="p-2 text-center text-sm text-gray-500">
                        No epics found. Please create one first.
                      </div>
                    ) : (
                      epics.map((epic) => (
                        <SelectItem key={epic.id} value={epic.id}>
                          {epic.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              <div className="relative p-3 border border-gray-200 rounded-lg hover:border-indigo-300 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-indigo-600" />
                  <Label className="text-sm font-semibold text-gray-700">Milestone</Label>
                </div>
                <Select
                  value={formData?.milestoneId || undefined}
                  onValueChange={handleMilestoneChange}
                >
                  <SelectTrigger className="border-0 bg-transparent h-8">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {milestones.length === 0 ? (
                      <div className="p-2 text-center text-sm text-gray-500">
                        No milestones available
                      </div>
                    ) : (
                      milestones.map((milestone) => (
                        <SelectItem key={milestone.id} value={milestone.id}>
                          {milestone.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formData.milestoneId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-1 text-xs text-gray-500 h-4 p-0 hover:text-red-500"
                    onClick={() => handleMilestoneChange("")}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Status & Sprint - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              <div className="relative p-3 border border-gray-200 rounded-lg hover:border-teal-300 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <ListChecks className="w-4 h-4 text-teal-600" />
                  <Label className="text-sm font-semibold text-gray-700">Status</Label>
                </div>
                <Select value={formData.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="border-0 bg-transparent h-8">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.name}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              <div className="relative p-3 border border-gray-200 rounded-lg hover:border-violet-300 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-violet-600" />
                  <Label className="text-sm font-semibold text-gray-700">Sprint</Label>
                </div>
                <Input
                  name="sprint"
                  placeholder="Sprint Name"
                  className="border-0 bg-transparent h-8 focus:ring-1 focus:ring-violet-500"
                  value={formData.sprint}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Story Points & Due Date - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              <div className="relative p-3 border border-gray-200 rounded-lg hover:border-orange-300 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-orange-600" />
                  <Label className="text-sm font-semibold text-gray-700">Story Points</Label>
                </div>
                <Input
                  name="storyPoints"
                  type="number"
                  placeholder="0"
                  className="border-0 bg-transparent h-8 focus:ring-1 focus:ring-orange-500"
                  value={formData.storyPoints || ""}
                  onChange={handleStoryPointsChange}
                  min={0}
                  required
                />
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              <div className="relative p-3 border border-gray-200 rounded-lg hover:border-red-300 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-red-600" />
                  <Label className="text-sm font-semibold text-gray-700">Due Date</Label>
                </div>
                <Input
                  name="date"
                  type="text"
                  placeholder="Due Date"
                  className="border-0 bg-transparent h-8 focus:ring-1 focus:ring-red-500"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Priority - Modern Pills */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            <div className="relative p-4 border border-gray-200 rounded-lg hover:border-rose-300 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <Flame className="w-4 h-4 text-rose-600" />
                <Label className="text-sm font-semibold text-gray-700">Priority Level</Label>
              </div>
              <div className="flex gap-2">
                {priorityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPriority(option.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      priority === option.value
                        ? `${option.color} text-white shadow-md scale-105`
                        : `bg-gray-100 text-gray-600 hover:bg-gray-200 ${option.border} border`
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${priority === option.value ? 'bg-white' : option.color}`}></div>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tags - Compact */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            <div className="relative p-4 border border-gray-200 rounded-lg hover:border-cyan-300 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <Tag className="w-4 h-4 text-cyan-600" />
                <Label className="text-sm font-semibold text-gray-700">Tags</Label>
              </div>
              <Input
                name="tags"
                placeholder="sprint, backend, urgent..."
                className="border-0 bg-transparent focus:ring-1 focus:ring-cyan-500"
                value={formData.tags}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Assignees - Compact */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            <div className="relative p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-4 h-4 text-green-600" />
                <Label className="text-sm font-semibold text-gray-700">Team Members</Label>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-full border shadow-sm hover:shadow-md transition-all text-xs">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white">WL</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">Williams Lady</span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-full border shadow-sm hover:shadow-md transition-all text-xs">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback className="text-xs bg-gradient-to-r from-green-500 to-teal-600 text-white">AK</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">Abdou Koli</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-auto border-dashed border-gray-300 bg-transparent hover:border-green-400 transition-colors rounded-full px-2"
                >
                  <Plus className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600 ml-1">Add</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Info Note - Compact */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-gray-500" />
              <p className="text-xs text-gray-600">
                📎 Files can be attached after creating the sprint task
              </p>
            </div>
          </div>

        </form>
      </div>

      {/* Fixed Action Buttons */}
      <div className="mt-6 pt-4 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="px-6 py-2 text-sm border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="px-6 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 text-sm"
            disabled={isSubmitting || epics.length === 0}
            onClick={handleSubmitForm}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Add Sprint Task
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateSprintForm;




































// import React, { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import {
//   PenSquare,
//   Calendar,
//   Plus,
//   AlertTriangle,
//   Paperclip,
//   ListChecks,
// } from "lucide-react";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { SprintTaskFormData } from "@/lib/types/taskManager/types";
// import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";

// interface CreateSprintFormProps {
//   onSubmit: (data: SprintTaskFormData) => void;
//   isSubmitting: boolean;
//   projectId: string;
//   defaultStatus?: string;
// }

// const CreateSprintForm: React.FC<CreateSprintFormProps> = ({
//   onSubmit,
//   isSubmitting,
//   projectId,
//   defaultStatus,
// }) => {
//   const { currentProject } = useProjectContext();
//   const { useEpicsQuery, useMilestonesQuery, useProjectStatusesQuery } =
//     useAuthAwareTaskManagerApi();

//   // Fetch epics, milestones, and statuses for the current project
//   const { data: epics = [] } = useEpicsQuery(projectId);
//   const { data: milestones = [] } = useMilestonesQuery(projectId);
//   const { data: statuses = [] } = useProjectStatusesQuery(projectId);

//   const [formData, setFormData] = useState<SprintTaskFormData>({
//     title: "",
//     description: "",
//     status: statuses.length > 0 ? statuses[0].name : "todo",
//     date: new Date().toLocaleDateString("en-US", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//     }),
//     tags: "",
//     assignees: [],
//     category: "sprints",
//     progress: 0,
//     storyPoints: 0,
//     sprint: "Sprint 1",
//     projectId: projectId,
//     epicId: "", // Will be populated when user selects an epic
//     milestoneId: "", // Optional - will be populated if user selects a milestone
//   });

//    useEffect(() => {
//     if (defaultStatus) {
//       setFormData((prev) => ({ ...prev, status: defaultStatus }));
//     } else if (statuses.length > 0 && !formData.status) {
//       setFormData((prev) => ({ ...prev, status: statuses[0].name }));
//     }
//   }, [defaultStatus, statuses]);

//   const [priority, setPriority] = useState<string>("medium");

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
//   ) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleStoryPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = parseInt(e.target.value, 10) || 0;
//     setFormData((prev) => ({ ...prev, storyPoints: value }));
//   };

//   const handleEpicChange = (epicId: string) => {
//     setFormData((prev) => ({ ...prev, epicId }));
//   };

//   const handleMilestoneChange = (milestoneId: string) => {
//     setFormData((prev) => ({ ...prev, milestoneId }));
//   };

//   const handleStatusChange = (status: string) => {
//     setFormData((prev) => ({ ...prev, status }));
//   };

//   const handleSubmitForm = (e: React.FormEvent) => {
//     e.preventDefault();

//     // Map priority to tags
//     let tags = formData.tags;
//     if (!tags.includes(priority)) {
//       tags = tags ? `${tags},${priority}` : priority;
//     }

//     onSubmit({
//       ...formData,
//       tags,
//     });
//   };
//   return (
//     <form onSubmit={handleSubmitForm}>
//       <Card className="w-full max-w-xl bg-white rounded-0 border-none">
//         <CardHeader className="border-b">
//           <CardTitle className="text-xl font-semibold">
//             Create Sprint Task
//           </CardTitle>
//         </CardHeader>

//         <CardContent className="space-y-6 pt-6">
//           <div className="space-y-4">
//             {/* Task Name Input */}
//             <div className="flex items-start gap-3">
//               <PenSquare className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Input
//                   name="title"
//                   placeholder="Task Name"
//                   className="border-gray-200"
//                   value={formData.title}
//                   onChange={handleChange}
//                   required
//                 />
//               </div>
//             </div>

//             {/* Description Input */}
//             <div className="flex items-start gap-3">
//               <PenSquare className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Textarea
//                   name="description"
//                   placeholder="Description"
//                   className="min-h-[100px] border-gray-200"
//                   value={formData.description}
//                   onChange={handleChange}
//                   required
//                 />
//               </div>
//             </div>

//             {/* Epic Selection */}
//             <div className="flex items-start gap-3">
//               <ListChecks className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Label className="mb-2 block">Epic</Label>
//                 <Select
//                   value={formData.epicId}
//                   onValueChange={handleEpicChange}
//                   required
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select an epic" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {epics.length === 0 ? (
//                       <div className="p-2 text-center text-sm text-gray-500">
//                         No epics found. Please create one first.
//                       </div>
//                     ) : (
//                       epics.map((epic) => (
//                         <SelectItem key={epic.id} value={epic.id}>
//                           {epic.title}
//                         </SelectItem>
//                       ))
//                     )}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>

//             {/* Milestone Selection (Optional) */}
//             <div className="flex items-start gap-3">
//               <ListChecks className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Label className="mb-2 block">Milestone (Optional)</Label>
//                 <Select
//                   value={formData?.milestoneId || undefined}
//                   onValueChange={handleMilestoneChange}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select a milestone (optional)" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {milestones.length === 0 ? (
//                       <div className="p-2 text-center text-sm text-gray-500">
//                         No milestones available
//                       </div>
//                     ) : (
//                       milestones.map((milestone) => (
//                         <SelectItem key={milestone.id} value={milestone.id}>
//                           {milestone.title}
//                         </SelectItem>
//                       ))
//                     )}
//                   </SelectContent>
//                 </Select>
//                 {formData.milestoneId && (
//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="sm"
//                     className="mt-1 text-xs text-gray-500"
//                     onClick={() => handleMilestoneChange("")}
//                   >
//                     Clear selection
//                   </Button>
//                 )}
//               </div>
//             </div>

//             {/* Status Selection */}
//             <div className="flex items-start gap-3">
//               <ListChecks className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Label className="mb-2 block">Status</Label>
//                 <Select
//                   value={formData.status}
//                   onValueChange={handleStatusChange}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select status" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {statuses.map((status) => (
//                       <SelectItem key={status.id} value={status.name}>
//                         {status.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>

//             {/* Sprint Name */}
//             <div className="flex items-start gap-3">
//               <PenSquare className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Label className="mb-2 block">Sprint</Label>
//                 <Input
//                   name="sprint"
//                   placeholder="Sprint Name"
//                   className="border-gray-200"
//                   value={formData.sprint}
//                   onChange={handleChange}
//                   required
//                 />
//               </div>
//             </div>

//             {/* Story Points */}
//             <div className="flex items-start gap-3">
//               <PenSquare className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Label className="mb-2 block">Story Points</Label>
//                 <Input
//                   name="storyPoints"
//                   type="number"
//                   placeholder="Story Points"
//                   className="border-gray-200"
//                   value={formData.storyPoints || ""}
//                   onChange={handleStoryPointsChange}
//                   min={0}
//                   required
//                 />
//               </div>
//             </div>

//             {/* Due Date Input */}
//             <div className="flex items-start gap-3">
//               <Calendar className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Input
//                   name="date"
//                   type="text"
//                   placeholder="Due Date"
//                   className="border-gray-200"
//                   value={formData.date}
//                   onChange={handleChange}
//                   required
//                 />
//               </div>
//             </div>

//             {/* Priority Level */}
//             <div className="flex items-start gap-3 p-0">
//               <AlertTriangle className="w-6 h-6 text-gray-500" />
//               <div className="flex-1 item-center">
//                 <RadioGroup
//                   value={priority}
//                   onValueChange={setPriority}
//                   className="flex gap-6"
//                 >
//                   <div className="flex items-center space-x-2">
//                     <RadioGroupItem value="high" id="high-sprint" />
//                     <Label
//                       htmlFor="high-sprint"
//                       className="text-red-600 font-medium"
//                     >
//                       High
//                     </Label>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <RadioGroupItem value="medium" id="medium-sprint" />
//                     <Label
//                       htmlFor="medium-sprint"
//                       className="text-yellow-600 font-medium"
//                     >
//                       Medium
//                     </Label>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <RadioGroupItem value="low" id="low-sprint" />
//                     <Label
//                       htmlFor="low-sprint"
//                       className="text-green-600 font-medium"
//                     >
//                       Low
//                     </Label>
//                   </div>
//                 </RadioGroup>
//               </div>
//             </div>

//             {/* Tags */}
//             <div className="flex items-start gap-3">
//               <Plus className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Label className="mb-2 block">Tags (comma separated)</Label>
//                 <Input
//                   name="tags"
//                   placeholder="Enter tags separated by commas"
//                   className="border-gray-200"
//                   value={formData.tags}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             {/* Attachment Note - for Cloudinary integration */}
//             <div className="flex items-start gap-3">
//               <Paperclip className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <p className="text-sm text-gray-500">
//                   Files can be attached after creating the sprint task
//                 </p>
//               </div>
//             </div>

//             {/* Assignees */}
//             <div className="flex items-start gap-3">
//               <div className="w-5 h-5 mt-2">
//                 <Plus className="w-full h-full text-gray-500" />
//               </div>
//               <div className="flex-1">
//                 <Label className="mb-2 block">Assignees</Label>
//                 <div className="flex items-center gap-2">
//                   <div className="flex items-center rounded-full pr-3">
//                     <Avatar className="h-6 w-6">
//                       <AvatarImage src="/placeholder-avatar.jpg" />
//                       <AvatarFallback>WL</AvatarFallback>
//                     </Avatar>
//                     <span className="ml-2 text-sm">Williams Lady</span>
//                   </div>
//                   <div className="flex items-center rounded-full pr-3">
//                     <Avatar className="h-6 w-6">
//                       <AvatarImage src="/placeholder-avatar.jpg" />
//                       <AvatarFallback>AK</AvatarFallback>
//                     </Avatar>
//                     <span className="ml-2 text-sm">Abdou Koli</span>
//                   </div>
//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="sm"
//                     className="rounded-full"
//                   >
//                     <Plus className="w-4 h-4" />
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Form Actions */}
//           <div className="flex justify-end gap-3 pt-4 border-t">
//             <Button type="button" variant="outline" className="px-6">
//               Cancel
//             </Button>
//             <Button
//               type="submit"
//               className="px-6 bg-teal-600"
//               disabled={isSubmitting || epics.length === 0}
//             >
//               {isSubmitting ? "Creating..." : "+ Add Sprint Task"}
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </form>
//   );
// };

// export default CreateSprintForm;





















































// import React, { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import {
//   PenSquare,
//   Calendar,
//   Plus,
//   AlertTriangle,
//   Paperclip,
//   ListChecks,
// } from "lucide-react";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { SprintTaskFormData } from "@/lib/types/taskManager/types";
// import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";

// interface CreateSprintFormProps {
//   onSubmit: (data: SprintTaskFormData) => void;
//   isSubmitting: boolean;
//   projectId: string;
//   defaultStatus?: string;
// }

// const CreateSprintForm: React.FC<CreateSprintFormProps> = ({
//   onSubmit,
//   isSubmitting,
//   projectId,
//   defaultStatus,
// }) => {
//   const { currentProject } = useProjectContext();
//   const { useEpicsQuery, useMilestonesQuery, useProjectStatusesQuery } =
//     useAuthAwareTaskManagerApi();

//   // Fetch epics, milestones, and statuses for the current project
//   const { data: epics = [] } = useEpicsQuery(projectId);
//   const { data: milestones = [] } = useMilestonesQuery(projectId);
//   const { data: statuses = [] } = useProjectStatusesQuery(projectId);

//   const [formData, setFormData] = useState<SprintTaskFormData>({
//     title: "",
//     description: "",
//     status: statuses.length > 0 ? statuses[0].name : "todo",
//     date: new Date().toLocaleDateString("en-US", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//     }),
//     tags: "",
//     assignees: [],
//     category: "sprints",
//     progress: 0,
//     storyPoints: 0,
//     sprint: "Sprint 1",
//     projectId: projectId,
//     epicId: "", // Will be populated when user selects an epic
//     milestoneId: "", // Optional - will be populated if user selects a milestone
//   });

//    useEffect(() => {
//     if (defaultStatus) {
//       setFormData((prev) => ({ ...prev, status: defaultStatus }));
//     } else if (statuses.length > 0 && !formData.status) {
//       setFormData((prev) => ({ ...prev, status: statuses[0].name }));
//     }
//   }, [defaultStatus, statuses]);

//   const [priority, setPriority] = useState<string>("medium");

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
//   ) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleStoryPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = parseInt(e.target.value, 10) || 0;
//     setFormData((prev) => ({ ...prev, storyPoints: value }));
//   };

//   const handleEpicChange = (epicId: string) => {
//     setFormData((prev) => ({ ...prev, epicId }));
//   };

//   const handleMilestoneChange = (milestoneId: string) => {
//     setFormData((prev) => ({ ...prev, milestoneId }));
//   };

//   const handleStatusChange = (status: string) => {
//     setFormData((prev) => ({ ...prev, status }));
//   };

//   const handleSubmitForm = (e: React.FormEvent) => {
//     e.preventDefault();

//     // Map priority to tags
//     let tags = formData.tags;
//     if (!tags.includes(priority)) {
//       tags = tags ? `${tags},${priority}` : priority;
//     }

//     onSubmit({
//       ...formData,
//       tags,
//     });
//   };
//   return (
//     <form onSubmit={handleSubmitForm}>
//       <Card className="w-full max-w-xl bg-white rounded-0 border-none">
//         <CardHeader className="border-b">
//           <CardTitle className="text-xl font-semibold">
//             Create Sprint Task
//           </CardTitle>
//         </CardHeader>

//         <CardContent className="space-y-6 pt-6">
//           <div className="space-y-4">
//             {/* Task Name Input */}
//             <div className="flex items-start gap-3">
//               <PenSquare className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Input
//                   name="title"
//                   placeholder="Task Name"
//                   className="border-gray-200"
//                   value={formData.title}
//                   onChange={handleChange}
//                   required
//                 />
//               </div>
//             </div>

//             {/* Description Input */}
//             <div className="flex items-start gap-3">
//               <PenSquare className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Textarea
//                   name="description"
//                   placeholder="Description"
//                   className="min-h-[100px] border-gray-200"
//                   value={formData.description}
//                   onChange={handleChange}
//                   required
//                 />
//               </div>
//             </div>

//             {/* Epic Selection */}
//             <div className="flex items-start gap-3">
//               <ListChecks className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Label className="mb-2 block">Epic</Label>
//                 <Select
//                   value={formData.epicId}
//                   onValueChange={handleEpicChange}
//                   required
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select an epic" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {epics.length === 0 ? (
//                       <div className="p-2 text-center text-sm text-gray-500">
//                         No epics found. Please create one first.
//                       </div>
//                     ) : (
//                       epics.map((epic) => (
//                         <SelectItem key={epic.id} value={epic.id}>
//                           {epic.title}
//                         </SelectItem>
//                       ))
//                     )}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>

//             {/* Milestone Selection (Optional) */}
//             <div className="flex items-start gap-3">
//               <ListChecks className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Label className="mb-2 block">Milestone (Optional)</Label>
//                 <Select
//                   value={formData?.milestoneId}
//                   onValueChange={handleMilestoneChange}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select a milestone" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="">None</SelectItem>
//                     {milestones.map((milestone) => (
//                       <SelectItem key={milestone.id} value={milestone.id}>
//                         {milestone.title}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>

//             {/* Status Selection */}
//             <div className="flex items-start gap-3">
//               <ListChecks className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Label className="mb-2 block">Status</Label>
//                 <Select
//                   value={formData.status}
//                   onValueChange={handleStatusChange}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select status" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {statuses.map((status) => (
//                       <SelectItem key={status.id} value={status.name}>
//                         {status.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>

//             {/* Sprint Name */}
//             <div className="flex items-start gap-3">
//               <PenSquare className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Label className="mb-2 block">Sprint</Label>
//                 <Input
//                   name="sprint"
//                   placeholder="Sprint Name"
//                   className="border-gray-200"
//                   value={formData.sprint}
//                   onChange={handleChange}
//                   required
//                 />
//               </div>
//             </div>

//             {/* Story Points */}
//             <div className="flex items-start gap-3">
//               <PenSquare className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Label className="mb-2 block">Story Points</Label>
//                 <Input
//                   name="storyPoints"
//                   type="number"
//                   placeholder="Story Points"
//                   className="border-gray-200"
//                   value={formData.storyPoints || ""}
//                   onChange={handleStoryPointsChange}
//                   min={0}
//                   required
//                 />
//               </div>
//             </div>

//             {/* Due Date Input */}
//             <div className="flex items-start gap-3">
//               <Calendar className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Input
//                   name="date"
//                   type="text"
//                   placeholder="Due Date"
//                   className="border-gray-200"
//                   value={formData.date}
//                   onChange={handleChange}
//                   required
//                 />
//               </div>
//             </div>

//             {/* Priority Level */}
//             <div className="flex items-start gap-3 p-0">
//               <AlertTriangle className="w-6 h-6 text-gray-500" />
//               <div className="flex-1 item-center">
//                 <RadioGroup
//                   value={priority}
//                   onValueChange={setPriority}
//                   className="flex gap-6"
//                 >
//                   <div className="flex items-center space-x-2">
//                     <RadioGroupItem value="high" id="high-sprint" />
//                     <Label
//                       htmlFor="high-sprint"
//                       className="text-red-600 font-medium"
//                     >
//                       High
//                     </Label>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <RadioGroupItem value="medium" id="medium-sprint" />
//                     <Label
//                       htmlFor="medium-sprint"
//                       className="text-yellow-600 font-medium"
//                     >
//                       Medium
//                     </Label>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <RadioGroupItem value="low" id="low-sprint" />
//                     <Label
//                       htmlFor="low-sprint"
//                       className="text-green-600 font-medium"
//                     >
//                       Low
//                     </Label>
//                   </div>
//                 </RadioGroup>
//               </div>
//             </div>

//             {/* Tags */}
//             <div className="flex items-start gap-3">
//               <Plus className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Label className="mb-2 block">Tags (comma separated)</Label>
//                 <Input
//                   name="tags"
//                   placeholder="Enter tags separated by commas"
//                   className="border-gray-200"
//                   value={formData.tags}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             {/* Attachment Note - for Cloudinary integration */}
//             <div className="flex items-start gap-3">
//               <Paperclip className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <p className="text-sm text-gray-500">
//                   Files can be attached after creating the sprint task
//                 </p>
//               </div>
//             </div>

//             {/* Assignees */}
//             <div className="flex items-start gap-3">
//               <div className="w-5 h-5 mt-2">
//                 <Plus className="w-full h-full text-gray-500" />
//               </div>
//               <div className="flex-1">
//                 <Label className="mb-2 block">Assignees</Label>
//                 <div className="flex items-center gap-2">
//                   <div className="flex items-center rounded-full pr-3">
//                     <Avatar className="h-6 w-6">
//                       <AvatarImage src="/placeholder-avatar.jpg" />
//                       <AvatarFallback>WL</AvatarFallback>
//                     </Avatar>
//                     <span className="ml-2 text-sm">Williams Lady</span>
//                   </div>
//                   <div className="flex items-center rounded-full pr-3">
//                     <Avatar className="h-6 w-6">
//                       <AvatarImage src="/placeholder-avatar.jpg" />
//                       <AvatarFallback>AK</AvatarFallback>
//                     </Avatar>
//                     <span className="ml-2 text-sm">Abdou Koli</span>
//                   </div>
//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="sm"
//                     className="rounded-full"
//                   >
//                     <Plus className="w-4 h-4" />
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Form Actions */}
//           <div className="flex justify-end gap-3 pt-4 border-t">
//             <Button type="button" variant="outline" className="px-6">
//               Cancel
//             </Button>
//             <Button
//               type="submit"
//               className="px-6 bg-teal-600"
//               disabled={isSubmitting || epics.length === 0}
//             >
//               {isSubmitting ? "Creating..." : "+ Add Sprint Task"}
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </form>
//   );
// };

// export default CreateSprintForm;
