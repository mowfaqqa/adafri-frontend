"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ProjectFormData,
  ProjectVisibility,
} from "@/lib/types/taskManager/types";
import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { 
  FolderOpen, 
  FileText, 
  Calendar, 
  CalendarCheck, 
  Lock, 
  Users, 
  Globe, 
  Sparkles,
  Target,
  Clock
} from "lucide-react";

interface NewProjectFormProps {
  onSuccess?: (projectId: string) => void;
}

const NewProjectForm: React.FC<NewProjectFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0], // Today in YYYY-MM-DD
    endDate: "",
    visibility: "private",
  });

  const { useCreateProjectMutation } = useAuthAwareTaskManagerApi();
  const createProjectMutation = useCreateProjectMutation();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVisibilityChange = (value: ProjectVisibility) => {
    setFormData((prev) => ({ ...prev, visibility: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createProjectMutation.mutate(formData, {
      onSuccess: (data) => {
        if (onSuccess && data) {
          onSuccess(data.id);
        }
      },
    });
  };

  const getVisibilityConfig = (visibility: ProjectVisibility) => {
    const configs = {
      private: {
        icon: Lock,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-400',
        selectedBg: 'bg-orange-50',
        label: 'Private',
        description: 'Only members can access'
      },
      team: {
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-400',
        selectedBg: 'bg-blue-50',
        label: 'Team',
        description: 'Available to all team members'
      },
      public: {
        icon: Globe,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100',
        borderColor: 'border-emerald-400',
        selectedBg: 'bg-emerald-50',
        label: 'Public',
        description: 'Anyone can access'
      }
    };
    return configs[visibility];
  };

  return (
    <div className="relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 opacity-60" />
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-teal-200 to-blue-200 rounded-full blur-3xl opacity-30 animate-pulse" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000" />
      
      <div className="relative z-10 p-6">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-teal-600 via-blue-600 to-teal-700 p-6 text-white relative overflow-hidden rounded-t-3xl -m-6 mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 to-blue-400/20"></div>
          <div className="relative">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Create New Project</h2>
                <p className="text-teal-100 text-sm">Turn your ideas into organized workflows</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div className="space-y-3">
            <Label 
              htmlFor="name" 
              className="flex items-center text-sm font-semibold text-gray-700"
            >
              <div className="w-6 h-6 bg-teal-100 rounded-lg flex items-center justify-center mr-2">
                <Target className="w-4 h-4 text-teal-600" />
              </div>
              Project Name*
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your project name..."
              className="pl-4 pr-4 py-4 text-lg bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:border-teal-400 focus:bg-white transition-all duration-300 shadow-sm hover:shadow-md"
            />
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label 
              htmlFor="description" 
              className="flex items-center text-sm font-semibold text-gray-700"
            >
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              Description
            </Label>
            <div className="relative">
              <Textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                placeholder="Describe your project goals and objectives..."
                className="min-h-[120px] w-full rounded-2xl border-2 border-gray-200 px-4 py-4 text-lg bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-0 transition-all duration-300 resize-none"
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {formData.description?.length || 0} characters
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label 
                htmlFor="startDate" 
                className="flex items-center text-sm font-semibold text-gray-700"
              >
                <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center mr-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                </div>
                Start Date*
              </Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="pl-4 pr-4 py-4 text-lg bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:border-emerald-400 focus:bg-white transition-all duration-300 shadow-sm hover:shadow-md"
              />
            </div>

            <div className="space-y-3">
              <Label 
                htmlFor="endDate" 
                className="flex items-center text-sm font-semibold text-gray-700"
              >
                <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center mr-2">
                  <CalendarCheck className="w-4 h-4 text-purple-600" />
                </div>
                End Date 
                <span className="text-gray-400 font-normal ml-1">(Optional)</span>
              </Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate || ""}
                onChange={handleChange}
                min={formData.startDate}
                className="pl-4 pr-4 py-4 text-lg bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:border-purple-400 focus:bg-white transition-all duration-300 shadow-sm hover:shadow-md"
              />
            </div>
          </div>

          {/* Project Visibility */}
          <div className="space-y-3">
            <Label className="flex items-center text-sm font-semibold text-gray-700">
              <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center mr-2">
                <FolderOpen className="w-4 h-4 text-indigo-600" />
              </div>
              Project Visibility
            </Label>
            <RadioGroup
              value={formData.visibility}
              onValueChange={(value) =>
                handleVisibilityChange(value as ProjectVisibility)
              }
              className="space-y-2"
            >
              {(['private', 'team', 'public'] as ProjectVisibility[]).map((visibility) => {
                const config = getVisibilityConfig(visibility);
                const isSelected = formData.visibility === visibility;
                const IconComponent = config.icon;
                
                return (
                  <label
                    key={visibility}
                    className={`cursor-pointer p-3 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                      isSelected
                        ? `${config.borderColor} ${config.selectedBg} shadow-md`
                        : 'border-gray-200 bg-white/80 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value={visibility} id={visibility} />
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${config.bgColor}`}>
                        <IconComponent className={`w-3 h-3 ${config.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {config.label}
                        </div>
                        <div className="text-xs text-gray-600">
                          {config.description}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className={cn(
                "px-8 py-4 rounded-2xl font-semibold text-white transition-all duration-300 relative overflow-hidden",
                "bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700",
                "transform hover:scale-[1.02] active:scale-[0.98]",
                "disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none",
                "shadow-lg hover:shadow-xl"
              )}
              disabled={createProjectMutation.isPending}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center space-x-2">
                {createProjectMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Create Project</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectForm;




































// "use client";

// import React, { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import {
//   ProjectFormData,
//   ProjectVisibility,
// } from "@/lib/types/taskManager/types";
// import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// interface NewProjectFormProps {
//   onSuccess?: (projectId: string) => void;
// }

// const NewProjectForm: React.FC<NewProjectFormProps> = ({ onSuccess }) => {
//   const [formData, setFormData] = useState<ProjectFormData>({
//     name: "",
//     description: "",
//     startDate: new Date().toISOString().split("T")[0], // Today in YYYY-MM-DD
//     endDate: "",
//     visibility: "private",
//   });

//   const { useCreateProjectMutation } = useAuthAwareTaskManagerApi();
//   const createProjectMutation = useCreateProjectMutation();

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
//   ) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleVisibilityChange = (value: ProjectVisibility) => {
//     setFormData((prev) => ({ ...prev, visibility: value }));
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();

//     createProjectMutation.mutate(formData, {
//       onSuccess: (data) => {
//         if (onSuccess && data) {
//           onSuccess(data.id);
//         }
//       },
//     });
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       <div className="space-y-2">
//         <Label htmlFor="name">Project Name*</Label>
//         <Input
//           id="name"
//           name="name"
//           value={formData.name}
//           onChange={handleChange}
//           required
//           placeholder="Enter project name"
//         />
//       </div>

//       <div className="space-y-2">
//         <Label htmlFor="description">Description</Label>
//         <Textarea
//           id="description"
//           name="description"
//           value={formData.description || ""}
//           onChange={handleChange}
//           placeholder="Enter project description"
//           className="min-h-[100px]"
//         />
//       </div>

//       <div className="grid grid-cols-2 gap-4">
//         <div className="space-y-2">
//           <Label htmlFor="startDate">Start Date*</Label>
//           <Input
//             id="startDate"
//             name="startDate"
//             type="date"
//             value={formData.startDate}
//             onChange={handleChange}
//             required
//             // className="[&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:mr-2"
//             // style={{ direction: 'rtl', textAlign: 'left' }}
//           />
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="endDate">End Date (Optional)</Label>
//           <Input
//             id="endDate"
//             name="endDate"
//             type="date"
//             value={formData.endDate || ""}
//             onChange={handleChange}
//             min={formData.startDate} // Ensure end date is after start date
//           />
//         </div>
//       </div>

//       <div className="space-y-2">
//         <Label>Project Visibility</Label>
//         <RadioGroup
//           value={formData.visibility}
//           onValueChange={(value) =>
//             handleVisibilityChange(value as ProjectVisibility)
//           }
//           className="flex flex-col space-y-1"
//         >
//           <div className="flex items-center space-x-2">
//             <RadioGroupItem value="private" id="private" />
//             <Label htmlFor="private" className="text-gray-600 font-normal">Private (Only members can access)</Label>
//           </div>
//           <div className="flex items-center space-x-2">
//             <RadioGroupItem value="team" id="team" />
//             <Label htmlFor="team" className="text-gray-600 font-normal">Team (Available to all team members)</Label>
//           </div>
//           <div className="flex items-center space-x-2">
//             <RadioGroupItem value="public" id="public" />
//             <Label htmlFor="public" className="text-gray-600 font-normal">Public (Anyone can access)</Label>
//           </div>
//         </RadioGroup>
//       </div>

//       <div className="flex justify-end pt-4">
//         <Button
//           type="submit"
//           className="bg-teal-600"
//           disabled={createProjectMutation.isPending}
//         >
//           {createProjectMutation.isPending ? "Creating..." : "Create Project"}
//         </Button>
//       </div>
//     </form>
//   );
// };
// export default NewProjectForm;
