"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  PenSquare,
  Calendar,
  Paperclip,
  Plus,
  AlertTriangle,
  ListChecks,
  X,
  Sparkles,
  Target,
  Users,
  Tag,
  Clock,
  Zap,
  Layers,
} from "lucide-react";
import { Project, StandardTaskFormData } from "@/lib/types/taskManager/types";
import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewTaskFormProps {
  onSubmit: (data: StandardTaskFormData) => void;
  isSubmitting: boolean;
  projectId: string;
  defaultStatus?: string;
}

const NewTaskForm: React.FC<NewTaskFormProps> = ({
  onSubmit,
  isSubmitting,
  projectId,
  defaultStatus,
}) => {
  const { useMilestonesQuery, useProjectStatusesQuery, useProjectQuery } =
    useAuthAwareTaskManagerApi();
  const { data: project } = useProjectQuery(projectId);
  const projectMembers = project?.members || [];
  const { data: milestones = [] } = useMilestonesQuery(projectId);
  const { data: statuses = [] } = useProjectStatusesQuery(projectId);
  const [selectedAssignees, setSelectedAssignees] = useState<any[]>([]);
  const [formData, setFormData] = useState<StandardTaskFormData>({
    title: "",
    description: "",
    status: "todo", // Start with a default value
    date: new Date().toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    tags: "",
    assignees: [],
    category: "development",
    progress: 0,
    projectId: projectId,
    milestoneId: "",
  });

  const [selectedCategory, setSelectedCategory] =
    useState<string>("development");
  const [priority, setPriority] = useState<string>("medium");

  // Update status when defaultStatus prop changes or statuses are loaded
  useEffect(() => {
    if (defaultStatus) {
      setFormData((prev) => ({ ...prev, status: defaultStatus }));
    } else if (statuses.length > 0) {
      setFormData((prev) => ({ ...prev, status: statuses[0].name }));
    }
  }, [defaultStatus, statuses]); // Remove formData.status from dependencies to avoid infinite loop

  const addAssignee = (userId: string) => {
    if (!selectedAssignees.includes(userId)) {
      const newAssignees = [...selectedAssignees, userId];
      setSelectedAssignees(newAssignees);
      setFormData((prev) => ({ ...prev, assignees: newAssignees }));
    }
  };

  const removeAssignee = (userId: string) => {
    const newAssignees = selectedAssignees.filter((id) => id !== userId);
    setSelectedAssignees(newAssignees);
    setFormData((prev) => ({ ...prev, assignees: newAssignees }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (status: string) => {
    setFormData((prev) => ({ ...prev, status }));
  };

  const handleMilestoneChange = (milestoneId: string) => {
    setFormData((prev) => ({
      ...prev,
      milestoneId: milestoneId === "none" ? "" : milestoneId,
    }));
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
      assignees: selectedAssignees,
      category: selectedCategory as any,
    });
  };

  const categoryOptions = [
    { value: "development", label: "🚀 Development", color: "from-blue-500 to-cyan-500" },
    { value: "marketing", label: "📈 Marketing", color: "from-pink-500 to-rose-500" },
    { value: "sales", label: "💼 Sales", color: "from-green-500 to-emerald-500" },
  ];

  const priorityOptions = [
    { value: "high", label: "High", color: "bg-red-500", border: "border-red-200" },
    { value: "medium", label: "Medium", color: "bg-amber-500", border: "border-amber-200" },
    { value: "low", label: "Low", color: "bg-green-500", border: "border-green-200" },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Animated Header */}
      <div className="relative mb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 opacity-10 animate-pulse"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg blur opacity-75 animate-pulse"></div>
              <div className="relative p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-800 to-blue-800 bg-clip-text text-transparent">
                Create New Task
              </h2>
              <p className="text-gray-500 text-xs">Transform ideas into action ✨</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Form Container */}
      <div className="max-h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-gray-100 pr-2">
        <form onSubmit={handleSubmitForm} className="space-y-5">
          
          {/* Task Title - Compact Design */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            <div className="relative p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <Label className="text-sm font-semibold text-gray-700">Task Title</Label>
              </div>
              <Input
                name="title"
                placeholder="What needs to be accomplished?"
                className="border-0 bg-transparent text-base font-medium placeholder:text-gray-400 focus:ring-1 focus:ring-blue-500"
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
                placeholder="Describe the task details..."
                className="min-h-[80px] border-0 bg-transparent placeholder:text-gray-400 focus:ring-1 focus:ring-purple-500 resize-none"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Status & Milestone - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
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
                      <SelectItem key={status.id} value={status.name.toLowerCase()}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              <div className="relative p-3 border border-gray-200 rounded-lg hover:border-indigo-300 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-indigo-600" />
                  <Label className="text-sm font-semibold text-gray-700">Milestone</Label>
                </div>
                <Select value={formData?.milestoneId} onValueChange={handleMilestoneChange}>
                  <SelectTrigger className="border-0 bg-transparent h-8">
                    <SelectValue placeholder="Select milestone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {milestones.map((milestone) => (
                      <SelectItem key={milestone.id} value={milestone.id}>
                        {milestone.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Due Date - Compact */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            <div className="relative p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <Label className="text-sm font-semibold text-gray-700">Due Date</Label>
              </div>
              <Input
                name="date"
                type="date"
                className="border-0 bg-transparent focus:ring-1 focus:ring-orange-500"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Priority - Modern Pills */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            <div className="relative p-4 border border-gray-200 rounded-lg hover:border-rose-300 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
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

          {/* Team Members - Compact */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            <div className="relative p-4 border border-gray-200 rounded-lg hover:border-cyan-300 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-4 h-4 text-cyan-600" />
                <Label className="text-sm font-semibold text-gray-700">Team Members</Label>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selectedAssignees.map((assigneeId) => {
                  const member = projectMembers.find((m) => m.userId === assigneeId);
                  return (
                    <div
                      key={assigneeId}
                      className="flex items-center gap-2 px-2 py-1 bg-white rounded-full border shadow-sm hover:shadow-md transition-all text-xs"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          {member?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member?.email || "Unknown"}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 rounded-full p-0 hover:bg-red-100"
                        onClick={() => removeAssignee(assigneeId)}
                      >
                        <X className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  );
                })}
                <Select onValueChange={addAssignee}>
                  <SelectTrigger className="w-auto border-dashed border-gray-300 bg-transparent hover:border-cyan-400 transition-colors h-7">
                    <div className="flex items-center gap-1 px-1">
                      <Plus className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-600">Add</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {projectMembers.map((member) => (
                      <SelectItem
                        key={member.userId}
                        value={member.userId}
                        disabled={selectedAssignees.includes(member.userId)}
                      >
                        {member.email || member.userId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Category & Tags - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              <div className="relative p-3 border border-gray-200 rounded-lg hover:border-emerald-300 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <Label className="text-sm font-semibold text-gray-700">Category</Label>
                </div>
                <select
                  className="w-full p-2 border-0 bg-transparent rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none text-sm"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              <div className="relative p-3 border border-gray-200 rounded-lg hover:border-pink-300 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-pink-600" />
                  <Label className="text-sm font-semibold text-gray-700">Tags</Label>
                </div>
                <Input
                  name="tags"
                  placeholder="web, frontend, urgent..."
                  className="border-0 bg-transparent focus:ring-1 focus:ring-pink-500 text-sm"
                  value={formData.tags}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Info Note - Compact */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-gray-500" />
              <p className="text-xs text-gray-600">
                💡 Attachments can be added after creating the task
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
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 text-sm"
            disabled={isSubmitting}
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
                Create Task
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewTaskForm;


















































// 30/6/2025
// "use client";
// import React, { useState, useEffect } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Label } from "@/components/ui/label";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import {
//   PenSquare,
//   Calendar,
//   Paperclip,
//   Plus,
//   AlertTriangle,
//   ListChecks,
//   X,
//   Sparkles,
//   Target,
//   Users,
//   Tag,
//   Clock,
//   Zap,
//   Layers,
// } from "lucide-react";
// import { Project, StandardTaskFormData } from "@/lib/types/taskManager/types";
// import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// interface NewTaskFormProps {
//   onSubmit: (data: StandardTaskFormData) => void;
//   isSubmitting: boolean;
//   projectId: string;
//   defaultStatus?: string;
// }

// const NewTaskForm: React.FC<NewTaskFormProps> = ({
//   onSubmit,
//   isSubmitting,
//   projectId,
//   defaultStatus,
// }) => {
//   const { useMilestonesQuery, useProjectStatusesQuery, useProjectQuery } =
//     useAuthAwareTaskManagerApi();
//   const { data: project } = useProjectQuery(projectId);
//   const projectMembers = project?.members || [];
//   const { data: milestones = [] } = useMilestonesQuery(projectId);
//   const { data: statuses = [] } = useProjectStatusesQuery(projectId);
//   const [selectedAssignees, setSelectedAssignees] = useState<any[]>([]);
//   const [formData, setFormData] = useState<StandardTaskFormData>({
//     title: "",
//     description: "",
//     status: defaultStatus || (statuses.length > 0 ? statuses[0].name : "todo"),
//     date: new Date().toLocaleDateString("en-US", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//     }),
//     tags: "",
//     assignees: [],
//     category: "development",
//     progress: 0,
//     projectId: projectId,
//     milestoneId: "",
//   });

//   const [selectedCategory, setSelectedCategory] =
//     useState<string>("development");
//   const [priority, setPriority] = useState<string>("medium");

//   // Update status when defaultStatus prop changes or statuses are loaded
//   useEffect(() => {
//     if (defaultStatus) {
//       setFormData((prev) => ({ ...prev, status: defaultStatus }));
//     } else if (statuses.length > 0 && !formData.status) {
//       setFormData((prev) => ({ ...prev, status: statuses[0].name }));
//     }
//   }, [defaultStatus, statuses]);

//   const addAssignee = (userId: string) => {
//     if (!selectedAssignees.includes(userId)) {
//       const newAssignees = [...selectedAssignees, userId];
//       setSelectedAssignees(newAssignees);
//       setFormData((prev) => ({ ...prev, assignees: newAssignees }));
//     }
//   };

//   const removeAssignee = (userId: string) => {
//     const newAssignees = selectedAssignees.filter((id) => id !== userId);
//     setSelectedAssignees(newAssignees);
//     setFormData((prev) => ({ ...prev, assignees: newAssignees }));
//   };

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
//   ) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleStatusChange = (status: string) => {
//     setFormData((prev) => ({ ...prev, status }));
//   };

//   const handleMilestoneChange = (milestoneId: string) => {
//     setFormData((prev) => ({
//       ...prev,
//       milestoneId: milestoneId === "none" ? "" : milestoneId,
//     }));
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
//       assignees: selectedAssignees,
//       category: selectedCategory as any,
//     });
//   };

//   const categoryOptions = [
//     { value: "development", label: "🚀 Development", color: "from-blue-500 to-cyan-500" },
//     { value: "marketing", label: "📈 Marketing", color: "from-pink-500 to-rose-500" },
//     { value: "sales", label: "💼 Sales", color: "from-green-500 to-emerald-500" },
//   ];

//   const priorityOptions = [
//     { value: "high", label: "High", color: "bg-red-500", border: "border-red-200" },
//     { value: "medium", label: "Medium", color: "bg-amber-500", border: "border-amber-200" },
//     { value: "low", label: "Low", color: "bg-green-500", border: "border-green-200" },
//   ];

//   return (
//     <div className="w-full max-w-2xl mx-auto">
//       {/* Animated Header */}
//       <div className="relative mb-6 overflow-hidden">
//         <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 opacity-10 animate-pulse"></div>
//         <div className="relative bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100 shadow-sm">
//           <div className="flex items-center gap-3">
//             <div className="relative">
//               <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg blur opacity-75 animate-pulse"></div>
//               <div className="relative p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
//                 <Zap className="w-5 h-5 text-white" />
//               </div>
//             </div>
//             <div>
//               <h2 className="text-xl font-bold bg-gradient-to-r from-purple-800 to-blue-800 bg-clip-text text-transparent">
//                 Create New Task
//               </h2>
//               <p className="text-gray-500 text-xs">Transform ideas into action ✨</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Scrollable Form Container */}
//       <div className="max-h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-gray-100 pr-2">
//         <form onSubmit={handleSubmitForm} className="space-y-5">
          
//           {/* Task Title - Compact Design */}
//           <div className="group relative">
//             <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
//             <div className="relative p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-all duration-300">
//               <div className="flex items-center gap-3 mb-2">
//                 <Target className="w-4 h-4 text-blue-600" />
//                 <Label className="text-sm font-semibold text-gray-700">Task Title</Label>
//               </div>
//               <Input
//                 name="title"
//                 placeholder="What needs to be accomplished?"
//                 className="border-0 bg-transparent text-base font-medium placeholder:text-gray-400 focus:ring-1 focus:ring-blue-500"
//                 value={formData.title}
//                 onChange={handleChange}
//                 required
//               />
//             </div>
//           </div>

//           {/* Description - Compact */}
//           <div className="group relative">
//             <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
//             <div className="relative p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-all duration-300">
//               <div className="flex items-center gap-3 mb-2">
//                 <PenSquare className="w-4 h-4 text-purple-600" />
//                 <Label className="text-sm font-semibold text-gray-700">Description</Label>
//               </div>
//               <Textarea
//                 name="description"
//                 placeholder="Describe the task details..."
//                 className="min-h-[80px] border-0 bg-transparent placeholder:text-gray-400 focus:ring-1 focus:ring-purple-500 resize-none"
//                 value={formData.description}
//                 onChange={handleChange}
//                 required
//               />
//             </div>
//           </div>

//           {/* Status & Milestone - Side by Side */}
//           <div className="grid grid-cols-2 gap-4">
//             <div className="group relative">
//               <div className="absolute inset-0 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
//               <div className="relative p-3 border border-gray-200 rounded-lg hover:border-teal-300 transition-all duration-300">
//                 <div className="flex items-center gap-2 mb-2">
//                   <ListChecks className="w-4 h-4 text-teal-600" />
//                   <Label className="text-sm font-semibold text-gray-700">Status</Label>
//                 </div>
//                 <Select value={formData.status} onValueChange={handleStatusChange}>
//                   <SelectTrigger className="border-0 bg-transparent h-8">
//                     <SelectValue placeholder="Select status" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {statuses.map((status) => (
//                       <SelectItem key={status.id} value={status.name.toLowerCase()}>
//                         {status.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>

//             <div className="group relative">
//               <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
//               <div className="relative p-3 border border-gray-200 rounded-lg hover:border-indigo-300 transition-all duration-300">
//                 <div className="flex items-center gap-2 mb-2">
//                   <Target className="w-4 h-4 text-indigo-600" />
//                   <Label className="text-sm font-semibold text-gray-700">Milestone</Label>
//                 </div>
//                 <Select value={formData?.milestoneId} onValueChange={handleMilestoneChange}>
//                   <SelectTrigger className="border-0 bg-transparent h-8">
//                     <SelectValue placeholder="Select milestone" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="none">None</SelectItem>
//                     {milestones.map((milestone) => (
//                       <SelectItem key={milestone.id} value={milestone.id}>
//                         {milestone.title}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
//           </div>

//           {/* Due Date - Compact */}
//           <div className="group relative">
//             <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
//             <div className="relative p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-all duration-300">
//               <div className="flex items-center gap-3 mb-2">
//                 <Clock className="w-4 h-4 text-orange-600" />
//                 <Label className="text-sm font-semibold text-gray-700">Due Date</Label>
//               </div>
//               <Input
//                 name="date"
//                 type="date"
//                 className="border-0 bg-transparent focus:ring-1 focus:ring-orange-500"
//                 value={formData.date}
//                 onChange={handleChange}
//                 required
//               />
//             </div>
//           </div>

//           {/* Priority - Modern Pills */}
//           <div className="group relative">
//             <div className="absolute inset-0 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
//             <div className="relative p-4 border border-gray-200 rounded-lg hover:border-rose-300 transition-all duration-300">
//               <div className="flex items-center gap-3 mb-3">
//                 <AlertTriangle className="w-4 h-4 text-rose-600" />
//                 <Label className="text-sm font-semibold text-gray-700">Priority Level</Label>
//               </div>
//               <div className="flex gap-2">
//                 {priorityOptions.map((option) => (
//                   <button
//                     key={option.value}
//                     type="button"
//                     onClick={() => setPriority(option.value)}
//                     className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
//                       priority === option.value
//                         ? `${option.color} text-white shadow-md scale-105`
//                         : `bg-gray-100 text-gray-600 hover:bg-gray-200 ${option.border} border`
//                     }`}
//                   >
//                     <div className={`w-2 h-2 rounded-full ${priority === option.value ? 'bg-white' : option.color}`}></div>
//                     {option.label}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Team Members - Compact */}
//           <div className="group relative">
//             <div className="absolute inset-0 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
//             <div className="relative p-4 border border-gray-200 rounded-lg hover:border-cyan-300 transition-all duration-300">
//               <div className="flex items-center gap-3 mb-3">
//                 <Users className="w-4 h-4 text-cyan-600" />
//                 <Label className="text-sm font-semibold text-gray-700">Team Members</Label>
//               </div>
//               <div className="flex flex-wrap items-center gap-2">
//                 {selectedAssignees.map((assigneeId) => {
//                   const member = projectMembers.find((m) => m.userId === assigneeId);
//                   return (
//                     <div
//                       key={assigneeId}
//                       className="flex items-center gap-2 px-2 py-1 bg-white rounded-full border shadow-sm hover:shadow-md transition-all text-xs"
//                     >
//                       <Avatar className="h-5 w-5">
//                         <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white">
//                           {member?.name?.charAt(0) || "U"}
//                         </AvatarFallback>
//                       </Avatar>
//                       <span className="font-medium">{member?.name || "Unknown"}</span>
//                       <Button
//                         type="button"
//                         variant="ghost"
//                         size="sm"
//                         className="h-4 w-4 rounded-full p-0 hover:bg-red-100"
//                         onClick={() => removeAssignee(assigneeId)}
//                       >
//                         <X className="w-3 h-3 text-red-500" />
//                       </Button>
//                     </div>
//                   );
//                 })}
//                 <Select onValueChange={addAssignee}>
//                   <SelectTrigger className="w-auto border-dashed border-gray-300 bg-transparent hover:border-cyan-400 transition-colors h-7">
//                     <div className="flex items-center gap-1 px-1">
//                       <Plus className="w-3 h-3 text-gray-500" />
//                       <span className="text-xs text-gray-600">Add</span>
//                     </div>
//                   </SelectTrigger>
//                   <SelectContent>
//                     {projectMembers.map((member) => (
//                       <SelectItem
//                         key={member.userId}
//                         value={member.userId}
//                         disabled={selectedAssignees.includes(member.userId)}
//                       >
//                         {member.name || member.userId}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
//           </div>

//           {/* Category & Tags - Side by Side */}
//           <div className="grid grid-cols-2 gap-4">
//             <div className="group relative">
//               <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
//               <div className="relative p-3 border border-gray-200 rounded-lg hover:border-emerald-300 transition-all duration-300">
//                 <div className="flex items-center gap-2 mb-2">
//                   <Layers className="w-4 h-4 text-emerald-600" />
//                   <Label className="text-sm font-semibold text-gray-700">Category</Label>
//                 </div>
//                 <select
//                   className="w-full p-2 border-0 bg-transparent rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none text-sm"
//                   value={selectedCategory}
//                   onChange={(e) => setSelectedCategory(e.target.value)}
//                 >
//                   {categoryOptions.map((option) => (
//                     <option key={option.value} value={option.value}>
//                       {option.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             <div className="group relative">
//               <div className="absolute inset-0 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
//               <div className="relative p-3 border border-gray-200 rounded-lg hover:border-pink-300 transition-all duration-300">
//                 <div className="flex items-center gap-2 mb-2">
//                   <Tag className="w-4 h-4 text-pink-600" />
//                   <Label className="text-sm font-semibold text-gray-700">Tags</Label>
//                 </div>
//                 <Input
//                   name="tags"
//                   placeholder="web, frontend, urgent..."
//                   className="border-0 bg-transparent focus:ring-1 focus:ring-pink-500 text-sm"
//                   value={formData.tags}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Info Note - Compact */}
//           <div className="p-3 rounded-lg bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200">
//             <div className="flex items-center gap-2">
//               <Paperclip className="w-4 h-4 text-gray-500" />
//               <p className="text-xs text-gray-600">
//                 💡 Attachments can be added after creating the task
//               </p>
//             </div>
//           </div>

//         </form>
//       </div>

//       {/* Fixed Action Buttons */}
//       <div className="mt-6 pt-4 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
//         <div className="flex justify-end gap-3">
//           <Button
//             type="button"
//             variant="outline"
//             className="px-6 py-2 text-sm border-gray-300 hover:bg-gray-50 transition-colors"
//           >
//             Cancel
//           </Button>
//           <Button
//             type="submit"
//             className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 text-sm"
//             disabled={isSubmitting}
//             onClick={handleSubmitForm}
//           >
//             {isSubmitting ? (
//               <div className="flex items-center gap-2">
//                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                 Creating...
//               </div>
//             ) : (
//               <div className="flex items-center gap-2">
//                 <Sparkles className="w-4 h-4" />
//                 Create Task
//               </div>
//             )}
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default NewTaskForm;










































// "use client";
// import React, { useState } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Label } from "@/components/ui/label";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import {
//   PenSquare,
//   Calendar,
//   Paperclip,
//   Plus,
//   AlertTriangle,
//   ListChecks,
//   X,
// } from "lucide-react";
// import { Project, StandardTaskFormData } from "@/lib/types/taskManager/types";
// import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// interface NewTaskFormProps {
//   onSubmit: (data: StandardTaskFormData) => void;
//   isSubmitting: boolean;
//   projectId: string;
// }

// const NewTaskForm: React.FC<NewTaskFormProps> = ({
//   onSubmit,
//   isSubmitting,
//   projectId,
// }) => {
//   const { useMilestonesQuery, useProjectStatusesQuery, useProjectQuery } =
//     useAuthAwareTaskManagerApi();
//   const { data: project } = useProjectQuery(projectId);
//   const projectMembers = project?.members || [];
//   const { data: milestones = [] } = useMilestonesQuery(projectId);
//   const { data: statuses = [] } = useProjectStatusesQuery(projectId);
//   const [selectedAssignees, setSelectedAssignees] = useState<any[]>([]);
//   const [formData, setFormData] = useState<StandardTaskFormData>({
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
//     category: "development",
//     progress: 0,
//     projectId: projectId,
//     milestoneId: "",
//   });

//   const [selectedCategory, setSelectedCategory] =
//     useState<string>("development");
//   const [priority, setPriority] = useState<string>("medium");

//   const addAssignee = (userId: string) => {
//     if (!selectedAssignees.includes(userId)) {
//       const newAssignees = [...selectedAssignees, userId];
//       setSelectedAssignees(newAssignees);
//       setFormData((prev) => ({ ...prev, assignees: newAssignees }));
//     }
//   };

//   const removeAssignee = (userId: string) => {
//     const newAssignees = selectedAssignees.filter((id) => id !== userId);
//     setSelectedAssignees(newAssignees);
//     setFormData((prev) => ({ ...prev, assignees: newAssignees }));
//   };
//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
//   ) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleStatusChange = (status: string) => {
//     setFormData((prev) => ({ ...prev, status }));
//   };

//   const handleMilestoneChange = (milestoneId: string) => {
//     setFormData((prev) => ({
//       ...prev,
//       milestoneId: milestoneId === "none" ? "" : milestoneId,
//     }));
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
//       assignees: selectedAssignees,
//       category: selectedCategory as any,
//     });
//   };

//   return (
//     <form onSubmit={handleSubmitForm}>
//       <Card className="w-full bg-white border-none">
//         <CardContent className="space-y-6 pt-6">
//           <div className="space-y-4">
//             {/* Title Input */}
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
//                       <SelectItem
//                         key={status.id}
//                         value={status.name.toLowerCase()}
//                       >
//                         {status.name}
//                       </SelectItem>
//                     ))}
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
//                     <SelectItem value="none">None</SelectItem>
//                     {milestones.map((milestone) => (
//                       <SelectItem key={milestone.id} value={milestone.id}>
//                         {milestone.title}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>

//             {/* Due Date Input */}
//             <div className="flex items-start gap-3">
//               <Calendar className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Input
//                   name="date"
//                   type="date"
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
//                     <RadioGroupItem value="high" id="high" />
//                     <Label htmlFor="high" className="text-red-600 font-medium">
//                       High
//                     </Label>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <RadioGroupItem value="medium" id="medium" />
//                     <Label
//                       htmlFor="medium"
//                       className="text-yellow-600 font-medium"
//                     >
//                       Medium
//                     </Label>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <RadioGroupItem value="low" id="low" />
//                     <Label htmlFor="low" className="text-green-600 font-medium">
//                       Low
//                     </Label>
//                   </div>
//                 </RadioGroup>
//               </div>
//             </div>
//             <div className="flex items-start gap-3">
//               <div className="w-5 h-5 mt-2">
//                 <Plus className="w-full h-full text-gray-500" />
//               </div>
//               <div className="flex-1">
//                 <Label className="mb-2 block">Assignees</Label>
//                 <div className="flex flex-wrap items-center gap-2">
//                   {/* Show selected assignees */}
//                   {selectedAssignees.map((assigneeId) => {
//                     const member = projectMembers.find(
//                       (m) => m.userId === assigneeId
//                     );
//                     return (
//                       <div
//                         key={assigneeId}
//                         className="flex items-center rounded-full pr-3 bg-gray-100"
//                       >
//                         <Avatar className="h-6 w-6">
//                           <AvatarFallback>
//                             {member?.name?.charAt(0) || "U"}
//                           </AvatarFallback>
//                         </Avatar>
//                         <span className="ml-2 text-sm">
//                           {member?.name || "Unknown"}
//                         </span>
//                         <Button
//                           type="button"
//                           variant="ghost"
//                           size="sm"
//                           className="rounded-full"
//                           onClick={() => removeAssignee(assigneeId)}
//                         >
//                           <X className="w-3 h-3" />
//                         </Button>
//                       </div>
//                     );
//                   })}

//                   {/* Member selection dropdown */}
//                   <Select onValueChange={addAssignee}>
//                     <SelectTrigger className="w-auto">
//                       <Button
//                         type="button"
//                         variant="ghost"
//                         size="sm"
//                         className="rounded-full"
//                       >
//                         <Plus className="w-4 h-4" />
//                         <span className="ml-1">Add Assignee</span>
//                       </Button>
//                     </SelectTrigger>
//                     <SelectContent>
//                       {projectMembers.map((member) => (
//                         <SelectItem
//                           key={member.userId}
//                           value={member.userId}
//                           disabled={selectedAssignees.includes(member.userId)}
//                         >
//                           {member.name || member.userId}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//             </div>

//             {/* Category */}
//             <div className="flex items-start gap-3">
//               <Plus className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Label className="mb-2 block">Category</Label>
//                 <select
//                   className="w-full border rounded p-2"
//                   value={selectedCategory}
//                   onChange={(e) => setSelectedCategory(e.target.value)}
//                 >
//                   <option value="development">Development</option>
//                   <option value="marketing">Marketing</option>
//                   <option value="sales">Sales</option>
//                 </select>
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

//             {/* Attachment Note - removed file input as attachments will be added after creating the task */}
//             <div className="flex items-start gap-3">
//               <Paperclip className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <p className="text-sm text-gray-500">
//                   Attachments can be added after creating the task
//                 </p>
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
//               disabled={isSubmitting}
//             >
//               {isSubmitting ? "Creating..." : "+ Add a task"}
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </form>
//   );
// };

// export default NewTaskForm;
