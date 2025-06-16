"use client"
import React, { useState } from "react";
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
  Tag,
  ListChecks,
  Paperclip,
  Target,
  Users,
  Clock,
  Flame,
  Sparkles,
  Megaphone,
  X,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const MarketingTaskForm = () => {
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [newTag, setNewTag] = useState("");
  const [priority, setPriority] = useState<string>("medium");

  const addSubtask = () => {
    if (newSubtask.trim() !== "") {
      setSubtasks([...subtasks, newSubtask]);
      setNewSubtask("");
    }
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() !== "") {
      setTags([...tags, newTag]);
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const priorityOptions = [
    { value: "high", label: "High", color: "bg-red-500", border: "border-red-200" },
    { value: "medium", label: "Medium", color: "bg-amber-500", border: "border-amber-200" },
    { value: "low", label: "Low", color: "bg-green-500", border: "border-green-200" },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-0">
      {/* Animated Header */}
      <div className="relative mb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 opacity-10 animate-pulse"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg blur opacity-75 animate-pulse"></div>
              <div className="relative p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-800 to-pink-800 bg-clip-text text-transparent">
                Create Campaign
              </h2>
              <p className="text-gray-500 text-xs">Launch your next marketing initiative 🚀</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Form Container */}
      <div className="max-h-[65vh] sm:max-h-[70vh] md:max-h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-gray-100 pr-1 sm:pr-2">
        <div className="space-y-4 sm:space-y-5">
          
          {/* Campaign Name - Compact Design */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            <div className="relative p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <Target className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <Label className="text-sm font-semibold text-gray-700">Campaign Name</Label>
              </div>
              <Input
                placeholder="What's your campaign called?"
                className="border-0 bg-transparent text-base font-medium placeholder:text-gray-400 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Objective/Description - Compact */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            <div className="relative p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <PenSquare className="w-4 h-4 text-purple-600" />
                <Label className="text-sm font-semibold text-gray-700">Campaign Objective</Label>
              </div>
              <Textarea
                placeholder="Describe your campaign goals and strategy..."
                className="min-h-[80px] border-0 bg-transparent placeholder:text-gray-400 focus:ring-1 focus:ring-purple-500 resize-none"
              />
            </div>
          </div>

          {/* Due Date - Compact */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            <div className="relative p-4 border border-gray-200 rounded-lg hover:border-red-300 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-4 h-4 text-red-600" />
                <Label className="text-sm font-semibold text-gray-700">Campaign Deadline</Label>
              </div>
              <Input
                type="text"
                placeholder="Select Due Date"
                className="border-0 bg-transparent focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Subtasks - Enhanced */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            <div className="relative p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <ListChecks className="w-4 h-4 text-indigo-600" />
                <Label className="text-sm font-semibold text-gray-700">Campaign Tasks</Label>
              </div>
              
              <div className="flex gap-2 mb-3">
                <Input
                  type="text"
                  placeholder="Add a subtask..."
                  className="border-0 bg-transparent focus:ring-1 focus:ring-indigo-500 flex-1"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-indigo-100 transition-colors"
                  onClick={addSubtask}
                  type="button"
                >
                  <Plus className="w-4 h-4 text-indigo-600" />
                </Button>
              </div>

              {/* Subtasks List */}
              {subtasks.length > 0 && (
                <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
                  {subtasks.map((subtask, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-gray-100 hover:border-indigo-200 transition-colors group/item"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">{subtask}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover/item:opacity-100 hover:bg-red-100 transition-all"
                        onClick={() => removeSubtask(index)}
                        type="button"
                      >
                        <X className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tags - Enhanced */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            <div className="relative p-4 border border-gray-200 rounded-lg hover:border-cyan-300 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <Tag className="w-4 h-4 text-cyan-600" />
                <Label className="text-sm font-semibold text-gray-700">Campaign Tags</Label>
              </div>
              
              <div className="flex gap-2 mb-3">
                <Input
                  type="text"
                  placeholder="Add tags (social, email, seo...)"
                  className="border-0 bg-transparent focus:ring-1 focus:ring-cyan-500 flex-1"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-cyan-100 transition-colors"
                  onClick={addTag}
                  type="button"
                >
                  <Plus className="w-4 h-4 text-cyan-600" />
                </Button>
              </div>

              {/* Tags List */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                  {tags.map((tag, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 rounded-full px-3 py-1 text-sm font-medium border border-cyan-200 hover:border-cyan-300 transition-colors group/tag"
                    >
                      <span>{tag}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 opacity-0 group-hover/tag:opacity-100 hover:bg-red-200 rounded-full transition-all"
                        onClick={() => removeTag(index)}
                        type="button"
                      >
                        <X className="w-2.5 h-2.5 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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

          {/* Assignees - Enhanced */}
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

          {/* Attachment Note - Compact */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-gray-500" />
              <p className="text-xs text-gray-600">
                📎 Files can be attached after creating the campaign
              </p>
            </div>
          </div>

        </div>
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
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 text-sm"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Add Campaign
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MarketingTaskForm;







































// "use client"
// import React, { useState } from "react";
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
//   Tag,
//   ListChecks,
//   Paperclip,
// } from "lucide-react";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// const MarketingTaskForm = () => {
//   const [subtasks, setSubtasks] = useState<string[]>([]);
//   const [tags, setTags] = useState<string[]>([]);
//   const [newSubtask, setNewSubtask] = useState("");
//   const [newTag, setNewTag] = useState("");

//   const addSubtask = () => {
//     if (newSubtask.trim() !== "") {
//       setSubtasks([...subtasks, newSubtask]);
//       setNewSubtask("");
//     }
//   };

//   const addTag = () => {
//     if (newTag.trim() !== "") {
//       setTags([...tags, newTag]);
//       setNewTag("");
//     }
//   };

//   return (
//     <div className="flex items-center justify-center p-4">
//       <Card className="w-full max-w-xl bg-white rounded-2xl">
//         <CardHeader className="border-b">
//           <CardTitle className="text-xl font-semibold">
//             Create Campaign
//           </CardTitle>
//         </CardHeader>

//         <CardContent className="space-y-6 pt-6">
//           <div className="space-y-4">
//             {/* Campaign Name Input */}
//             <div className="flex items-start gap-3">
//               <PenSquare className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Input
//                   placeholder="Campaign Name"
//                   className="border-gray-200"
//                 />
//               </div>
//             </div>

//             {/* Description Input */}
//             <div className="flex items-start gap-3">
//               <PenSquare className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Textarea
//                   placeholder="Objective"
//                   className="min-h-[100px] border-gray-200"
//                 />
//               </div>
//             </div>

//             {/* Duration (Start & End Date) */}
//             <div className="flex items-start gap-3">
//               <Calendar className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Input
//                   type="text"
//                   placeholder="Select Due Date"
//                   className="border-gray-200"
//                 />
//               </div>
//             </div>

//             {/* Subtasks Input */}
//             <div className="flex items-start gap-3">
//               <ListChecks className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Input
//                   type="text"
//                   placeholder="Add Subtask"
//                   className="border-gray-200"
//                   value={newSubtask}
//                   onChange={(e) => setNewSubtask(e.target.value)}
//                 />
//               </div>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 className="rounded-xl"
//                 onClick={addSubtask}
//                 type="button"
//               >
//                 <Plus className="w-4 h-4" />
//               </Button>
//             </div>

//             {/* Subtasks List */}
//             {subtasks.length > 0 && (
//               <div className="ml-8 space-y-2">
//                 {subtasks.map((subtask, index) => (
//                   <div
//                     key={index}
//                     className="flex items-center gap-2 text-sm text-gray-700"
//                   >
//                     <span>• {subtask}</span>
//                   </div>
//                 ))}
//               </div>
//             )}

//             {/* Tags Input */}
//             <div className="flex items-start gap-3">
//               <Tag className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <Input
//                   type="text"
//                   placeholder="Add Tags"
//                   className="border-gray-200"
//                   value={newTag}
//                   onChange={(e) => setNewTag(e.target.value)}
//                 />
//               </div>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 className="rounded-xl"
//                 onClick={addTag}
//                 type="button"
//               >
//                 <Plus className="w-4 h-4" />
//               </Button>
//             </div>

//             {/* Tags List */}
//             {tags.length > 0 && (
//               <div className="ml-8 flex flex-wrap gap-2">
//                 {tags.map((tag, index) => (
//                   <div
//                     key={index}
//                     className="bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm"
//                   >
//                     {tag}
//                   </div>
//                 ))}
//               </div>
//             )}

//             {/* Attachment Note - for Cloudinary integration */}
//             <div className="flex items-start gap-3">
//               <Paperclip className="w-5 h-5 mt-2 text-gray-500" />
//               <div className="flex-1">
//                 <p className="text-sm text-gray-500">
//                   Files can be attached after creating the campaign
//                 </p>
//               </div>
//             </div>

//             {/* Priority Level */}
//             <div className="flex items-start gap-3 p-0">
//               <AlertTriangle className="w-6 h-6 text-gray-500" />
//               <div className="flex-1 item-center">
//                 <RadioGroup defaultValue="medium" className="flex gap-6">
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
//                   <Button variant="ghost" size="sm" className="rounded-full">
//                     <Plus className="w-4 h-4" />
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Form Actions */}
//           <div className="flex justify-end gap-3 pt-4 border-t">
//             <Button variant="outline" className="px-6">
//               Cancel
//             </Button>
//             <Button className="px-6 bg-teal-600">+ Add a Campaign</Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default MarketingTaskForm;
