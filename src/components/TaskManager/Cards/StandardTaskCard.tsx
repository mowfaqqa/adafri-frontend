"use client";
import React, { useState } from "react";
import { Calendar, Tag, Paperclip } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StandardTask } from "@/lib/types/taskManager/types";
import TaskDetailsModal from "../modals/TaskDetailsModal";
import { TaskActionButtons } from "../buttons/TaskActionButtons";
import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";
import { getFileUrl } from "@/lib/api/task-manager/fileApi";
import ShareButton from "../buttons/ShareButton";

interface StandardTaskCardProps {
  task: StandardTask;
  className?: string;
  coverStyle?: React.CSSProperties | null;
  hasCustomCover?: boolean;
}

const StandardTaskCard: React.FC<StandardTaskCardProps> = ({
  task,
  className = "",
  coverStyle = null,
  hasCustomCover = false,
}) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { projectId } = useProjectContext();
  const { useTaskFilesQuery } = useAuthAwareTaskManagerApi();

  // Fetch task files to show image previews
  const { data: taskFiles = [] } = useTaskFilesQuery(
    projectId || "",
    task.id as string
  );

  // Filter for image files only
  const imageFiles = taskFiles.filter(
    (file) => file.mimetype && file.mimetype.startsWith("image/")
  );

  // Dynamic styling based on progress
  const getProgressGradient = (progress: number) => {
    if (progress >= 80) return "from-emerald-500 to-teal-600";
    if (progress >= 50) return "from-blue-500 to-indigo-600";
    if (progress >= 20) return "from-amber-500 to-orange-600";
    return "from-rose-500 to-pink-600";
  };

  const getCardAccent = (progress: number) => {
    if (hasCustomCover) return "border-l-transparent"; // Remove border accent when custom cover is used
    if (progress >= 80) return "border-l-emerald-500 shadow-emerald-100";
    if (progress >= 50) return "border-l-blue-500 shadow-blue-100";
    if (progress >= 20) return "border-l-amber-500 shadow-amber-100";
    return "border-l-rose-500 shadow-rose-100";
  };

  // Get priority-based badge styling
  const getPriorityBadgeStyle = (tag: string) => {
    const lowerTag = tag.toLowerCase();
    if (lowerTag.includes("high")) {
      return "bg-gradient-to-r from-red-100 to-red-50 border-red-200 text-red-800 hover:from-red-50 hover:to-red-25";
    }
    if (lowerTag.includes("medium")) {
      return "bg-gradient-to-r from-amber-100 to-amber-50 border-amber-200 text-amber-800 hover:from-amber-50 hover:to-amber-25";
    }
    if (lowerTag.includes("low")) {
      return "bg-gradient-to-r from-green-100 to-green-50 border-green-200 text-green-800 hover:from-green-50 hover:to-green-25";
    }
    return "bg-gradient-to-r from-gray-100 to-gray-50 border-gray-200/70 text-gray-700 hover:from-gray-50 hover:to-white";
  };

  // Get text colors based on cover
  const getTextColor = (baseClass: string) => {
    if (hasCustomCover) {
      return baseClass
        .replace("text-gray-", "text-white/")
        .replace("text-slate-", "text-white/");
    }
    return baseClass;
  };

  // Get background colors for elements based on cover
  const getElementBackground = (baseClass: string) => {
    if (hasCustomCover) {
      return "bg-white/20 backdrop-blur-sm border-white/30";
    }
    return baseClass;
  };

  return (
    <>
      <Card
        className={`group relative overflow-hidden transition-all duration-300 ease-out
          hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1 
          ${hasCustomCover ? "bg-transparent border-transparent" : `border-l-4 ${getCardAccent(task.progress)} bg-gradient-to-br from-white via-white to-gray-50/30`}
          backdrop-blur-sm border border-gray-200/60 cursor-pointer ${className}`}
        draggable
        onClick={() => setShowDetailsModal(true)}
        style={hasCustomCover ? coverStyle || {} : {}} // Apply cover style only when custom cover exists
      >
        {/* Subtle background pattern - only show if no custom cover */}
        {!hasCustomCover && (
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/[0.02] pointer-events-none" />
        )}

        {/* Animated border gradient on hover - only show if no custom cover */}
        {!hasCustomCover && (
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
            -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"
          />
        )}

        <CardContent className="relative p-4 space-y-2">
          {/* Header with title and actions */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3
              className={`font-semibold line-clamp-2 text-base leading-tight
              group-hover:opacity-90 transition-colors duration-200 ${
                hasCustomCover
                  ? "text-white"
                  : "text-gray-900 group-hover:text-gray-800"
              }`}
            >
              {task.title}
            </h3>
            <div
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <ShareButton
                type="task"
                projectId={projectId || ""}
                taskId={task.id as string}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600 rounded-full"
              />
              <TaskActionButtons
                task={task}
                onEdit={() => {
                  setShowDetailsModal(true);
                }}
                variant="card"
              />
            </div>
          </div>

          {/* Description with enhanced styling */}
          <p
            className={`line-clamp-1 leading-relaxed text-xs mb-2 ${
              hasCustomCover ? "text-white/90" : "text-gray-600"
            }`}
          >
            {task.description}
          </p>

          {/* Image previews section - only show if there are images */}
          {imageFiles.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-1 mb-2">
                <Paperclip
                  className={`h-3 w-3 ${hasCustomCover ? "text-white/70" : "text-gray-400"}`}
                />
                <span
                  className={`text-xs font-medium ${
                    hasCustomCover ? "text-white/80" : "text-gray-500"
                  }`}
                >
                  {imageFiles.length} image{imageFiles.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-2">
                {imageFiles.slice(0, 2).map((file, index) => (
                  <div
                    key={file.id}
                    className={`relative w-full h-40 rounded-lg overflow-hidden border transition-colors duration-200 ${
                      hasCustomCover
                        ? "bg-white/10 border-white/20 hover:border-white/40"
                        : "bg-gray-100 border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={getFileUrl(file)}
                      alt={file.originalname}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Overlay for additional images count on second image */}
                    {index === 1 && imageFiles.length > 2 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          +{imageFiles.length - 2}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced progress section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span
                className={`text-xs font-medium ${
                  hasCustomCover ? "text-white/90" : "text-gray-700"
                }`}
              >
                Progress
              </span>
              <div className="flex items-center gap-1">
                <span
                  className={`text-xs font-bold bg-gradient-to-r ${getProgressGradient(task.progress)} 
                  bg-clip-text ${hasCustomCover ? "text-white" : "text-transparent"}`}
                >
                  {task.progress}%
                </span>
                {task.progress === 100 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>
            </div>
            <div className="relative">
              <Progress
                value={task.progress}
                className={`h-2 border shadow-inner ${
                  hasCustomCover
                    ? "bg-white/20 border-white/30"
                    : "bg-gray-100 border-gray-200/50"
                }`}
              />
              <div
                className={`absolute inset-0 bg-gradient-to-r ${getProgressGradient(task.progress)} 
                rounded-full transition-all duration-500 ease-out opacity-90`}
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>

          {/* Enhanced tags section */}
          <div className="flex flex-wrap gap-1.5">
            {task.tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className={`flex items-center gap-1 px-2 py-1 font-medium
                  hover:shadow-sm transition-all duration-200 text-xs ${
                    hasCustomCover
                      ? "bg-white/20 border-white/30 text-white hover:bg-white/30"
                      : getPriorityBadgeStyle(tag)
                  }`}
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </Badge>
            ))}
          </div>

          {/* Enhanced footer */}
          <div
            className={`flex items-center justify-between pt-3 border-t transition-colors duration-200 ${
              hasCustomCover ? "border-white/20" : "border-gray-100/80"
            }`}
          >
            <div
              className={`flex items-center text-sm font-medium ${
                hasCustomCover ? "text-white/90" : "text-gray-500"
              }`}
            >
              {task.date}
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium ${
                  hasCustomCover ? "text-white/70" : "text-gray-400"
                }`}
              >
                Team
              </span>
              <div className="flex -space-x-2">
                {task.assignees.map((assignee, index) => (
                  <Avatar
                    key={index}
                    className={`h-8 w-8 border-2 shadow-sm transition-all duration-200 hover:scale-110 ${
                      hasCustomCover
                        ? "border-white/30 ring-2 ring-white/20 hover:ring-white/40"
                        : "border-white ring-2 ring-gray-100 hover:ring-gray-200"
                    }`}
                  >
                    <AvatarImage src={assignee} />
                    <AvatarFallback
                      className={`text-xs font-semibold ${
                        hasCustomCover
                          ? "bg-white/20 text-white"
                          : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600"
                      }`}
                    >
                      {`U${index + 1}`}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <TaskDetailsModal
        task={task}
        isOpen={showDetailsModal}
        onOpenChange={setShowDetailsModal}
      />
    </>
  );
};

export default StandardTaskCard;

// "use client";
// import React, { useState } from "react";
// import { Calendar, Tag, Paperclip } from "lucide-react";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
// import { StandardTask } from "@/lib/types/taskManager/types";
// import TaskDetailsModal from "../modals/TaskDetailsModal";
// import { TaskActionButtons } from "../buttons/TaskActionButtons";
// import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
// import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";
// import { getFileUrl } from "@/lib/api/task-manager/fileApi";

// interface StandardTaskCardProps {
//   task: StandardTask;
//   className?: string;
// }

// const StandardTaskCard: React.FC<StandardTaskCardProps> = ({
//   task,
//   className = "",
// }) => {
//   const [showDetailsModal, setShowDetailsModal] = useState(false);
//   const { projectId } = useProjectContext();
//   const { useTaskFilesQuery } = useAuthAwareTaskManagerApi();

//   // Fetch task files to show image previews
//   const { data: taskFiles = [] } = useTaskFilesQuery(
//     projectId || "",
//     task.id as string
//   );

//   // Filter for image files only
//   const imageFiles = taskFiles.filter(file =>
//     file.mimetype && file.mimetype.startsWith('image/')
//   );

//   // Dynamic styling based on progress
//   const getProgressGradient = (progress: number) => {
//     if (progress >= 80) return "from-emerald-500 to-teal-600";
//     if (progress >= 50) return "from-blue-500 to-indigo-600";
//     if (progress >= 20) return "from-amber-500 to-orange-600";
//     return "from-rose-500 to-pink-600";
//   };

//   const getCardAccent = (progress: number) => {
//     if (progress >= 80) return "border-l-emerald-500 shadow-emerald-100";
//     if (progress >= 50) return "border-l-blue-500 shadow-blue-100";
//     if (progress >= 20) return "border-l-amber-500 shadow-amber-100";
//     return "border-l-rose-500 shadow-rose-100";
//   };

//   // Get priority-based badge styling
//   const getPriorityBadgeStyle = (tag: string) => {
//     const lowerTag = tag.toLowerCase();
//     if (lowerTag.includes('high')) {
//       return "bg-gradient-to-r from-red-100 to-red-50 border-red-200 text-red-800 hover:from-red-50 hover:to-red-25";
//     }
//     if (lowerTag.includes('medium')) {
//       return "bg-gradient-to-r from-amber-100 to-amber-50 border-amber-200 text-amber-800 hover:from-amber-50 hover:to-amber-25";
//     }
//     if (lowerTag.includes('low')) {
//       return "bg-gradient-to-r from-green-100 to-green-50 border-green-200 text-green-800 hover:from-green-50 hover:to-green-25";
//     }
//     return "bg-gradient-to-r from-gray-100 to-gray-50 border-gray-200/70 text-gray-700 hover:from-gray-50 hover:to-white";
//   };

//   return (
//     <>
//       <Card
//         className={`group relative overflow-hidden transition-all duration-300 ease-out
//           hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1
//           border-l-4 ${getCardAccent(task.progress)}
//           bg-gradient-to-br from-white via-white to-gray-50/30
//           backdrop-blur-sm border border-gray-200/60 cursor-pointer ${className}`}
//         draggable
//         onClick={() => setShowDetailsModal(true)}
//       >
//         {/* Subtle background pattern */}
//         <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/[0.02] pointer-events-none" />

//         {/* Animated border gradient on hover */}
//         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
//           -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

//         <CardContent className="relative p-4 space-y-2">
//           {/* Header with title and actions */}
//           <div className="flex items-start justify-between gap-2 mb-1">
//             <h3 className="font-semibold text-gray-900 line-clamp-2 text-base leading-tight
//               group-hover:text-gray-800 transition-colors duration-200">
//               {task.title}
//             </h3>
//             <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
//                  onClick={(e) => e.stopPropagation()}>
//               <TaskActionButtons
//                 task={task}
//                 // onView={() => setShowDetailsModal(true)} // Commented out - card click handles this
//                 onEdit={() => {
//                   setShowDetailsModal(true);
//                 }}
//                 variant="card"
//               />
//             </div>
//           </div>

//           {/* Description with enhanced styling */}
//           <p className="text-gray-600 line-clamp-1 leading-relaxed text-xs mb-2">
//             {task.description}
//           </p>

//           {/* Image previews section - only show if there are images */}
//           {imageFiles.length > 0 && (
//             <div className="mb-3">
//               <div className="flex items-center gap-1 mb-2">
//                 <Paperclip className="h-3 w-3 text-gray-400" />
//                 <span className="text-xs text-gray-500 font-medium">
//                   {imageFiles.length} image{imageFiles.length > 1 ? 's' : ''}
//                 </span>
//               </div>
//               <div className="space-y-2">
//                 {imageFiles.slice(0, 2).map((file, index) => (
//                   <div
//                     key={file.id}
//                     className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 hover:border-gray-300 transition-colors duration-200"
//                     onClick={(e) => e.stopPropagation()}
//                   >
//                     <img
//                       src={getFileUrl(file)}
//                       alt={file.originalname}
//                       className="w-full h-full object-cover"
//                       loading="lazy"
//                     />
//                     {/* Overlay for additional images count on second image */}
//                     {index === 1 && imageFiles.length > 2 && (
//                       <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
//                         <span className="text-white text-sm font-semibold">
//                           +{imageFiles.length - 2}
//                         </span>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Enhanced progress section */}
//           <div className="space-y-2">
//             <div className="flex justify-between items-center">
//               <span className="text-xs font-medium text-gray-700">Progress</span>
//               <div className="flex items-center gap-1">
//                 <span className={`text-xs font-bold bg-gradient-to-r ${getProgressGradient(task.progress)}
//                   bg-clip-text text-transparent`}>
//                   {task.progress}%
//                 </span>
//                 {task.progress === 100 && (
//                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
//                 )}
//               </div>
//             </div>
//             <div className="relative">
//               <Progress
//                 value={task.progress}
//                 className="h-2 bg-gray-100 border border-gray-200/50 shadow-inner"
//               />
//               <div className={`absolute inset-0 bg-gradient-to-r ${getProgressGradient(task.progress)}
//                 rounded-full transition-all duration-500 ease-out opacity-90`}
//                 style={{ width: `${task.progress}%` }}
//               />
//             </div>
//           </div>

//           {/* Enhanced tags section */}
//           <div className="flex flex-wrap gap-1.5">
//             {task.tags.map((tag, index) => (
//               <Badge
//                 key={index}
//                 variant="secondary"
//                 className={`flex items-center gap-1 px-2 py-1
//                   ${getPriorityBadgeStyle(tag)} font-medium
//                   hover:shadow-sm transition-all duration-200 text-xs`}
//               >
//                 <Tag className="h-2.5 w-2.5" />
//                 {tag}
//               </Badge>
//             ))}
//           </div>

//           {/* Enhanced footer */}
//           <div className="flex items-center justify-between pt-3 border-t border-gray-100/80">
//             <div className="flex items-center text-gray-500 text-sm font-medium">
//               {task.date}
//             </div>

//             <div className="flex items-center gap-2">
//               <span className="text-xs text-gray-400 font-medium">Team</span>
//               <div className="flex -space-x-2">
//                 {task.assignees.map((assignee, index) => (
//                   <Avatar
//                     key={index}
//                     className="h-8 w-8 border-2 border-white shadow-sm
//                       ring-2 ring-gray-100 hover:ring-gray-200
//                       transition-all duration-200 hover:scale-110"
//                   >
//                     <AvatarImage src={assignee} />
//                     <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200
//                       text-gray-600 text-xs font-semibold">
//                       {`U${index + 1}`}
//                     </AvatarFallback>
//                   </Avatar>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       <TaskDetailsModal
//         task={task}
//         isOpen={showDetailsModal}
//         onOpenChange={setShowDetailsModal}
//       />
//     </>
//   );
// };

// export default StandardTaskCard;

// "use client";
// import React, { useState } from "react";
// import { Calendar, Tag } from "lucide-react";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
// import { StandardTask } from "@/lib/types/taskManager/types";
// import TaskDetailsModal from "../modals/TaskDetailsModal";
// import { TaskActionButtons } from "../buttons/TaskActionButtons";

// interface StandardTaskCardProps {
//   task: StandardTask;
//   className?: string;
// }

// const StandardTaskCard: React.FC<StandardTaskCardProps> = ({
//   task,
//   className = "",
// }) => {
//   const [showDetailsModal, setShowDetailsModal] = useState(false);

//   // Dynamic styling based on progress
//   const getProgressGradient = (progress: number) => {
//     if (progress >= 80) return "from-emerald-500 to-teal-600";
//     if (progress >= 50) return "from-blue-500 to-indigo-600";
//     if (progress >= 20) return "from-amber-500 to-orange-600";
//     return "from-rose-500 to-pink-600";
//   };

//   const getCardAccent = (progress: number) => {
//     if (progress >= 80) return "border-l-emerald-500 shadow-emerald-100";
//     if (progress >= 50) return "border-l-blue-500 shadow-blue-100";
//     if (progress >= 20) return "border-l-amber-500 shadow-amber-100";
//     return "border-l-rose-500 shadow-rose-100";
//   };

//   // Get priority-based badge styling
//   const getPriorityBadgeStyle = (tag: string) => {
//     const lowerTag = tag.toLowerCase();
//     if (lowerTag.includes('high')) {
//       return "bg-gradient-to-r from-red-100 to-red-50 border-red-200 text-red-800 hover:from-red-50 hover:to-red-25";
//     }
//     if (lowerTag.includes('medium')) {
//       return "bg-gradient-to-r from-amber-100 to-amber-50 border-amber-200 text-amber-800 hover:from-amber-50 hover:to-amber-25";
//     }
//     if (lowerTag.includes('low')) {
//       return "bg-gradient-to-r from-green-100 to-green-50 border-green-200 text-green-800 hover:from-green-50 hover:to-green-25";
//     }
//     return "bg-gradient-to-r from-gray-100 to-gray-50 border-gray-200/70 text-gray-700 hover:from-gray-50 hover:to-white";
//   };

//   return (
//     <>
//       <Card
//         className={`group relative overflow-hidden transition-all duration-300 ease-out
//           hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1
//           border-l-4 ${getCardAccent(task.progress)}
//           bg-gradient-to-br from-white via-white to-gray-50/30
//           backdrop-blur-sm border border-gray-200/60 ${className}`}
//         draggable
//       >
//         {/* Subtle background pattern */}
//         <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/[0.02] pointer-events-none" />

//         {/* Animated border gradient on hover */}
//         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
//           -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

//         <CardContent className="relative p-4 space-y-2">
//           {/* Header with title and actions */}
//           <div className="flex items-start justify-between gap-2 mb-1">
//             <h3 className="font-semibold text-gray-900 line-clamp-2 text-base leading-tight
//               group-hover:text-gray-800 transition-colors duration-200">
//               {task.title}
//             </h3>
//             <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
//               <TaskActionButtons
//                 task={task}
//                 onView={() => setShowDetailsModal(true)}
//                 onEdit={() => {
//                   setShowDetailsModal(true);
//                 }}
//                 variant="card"
//               />
//             </div>
//           </div>

//           {/* Description with enhanced styling */}
//           <p className="text-gray-600 line-clamp-1 leading-relaxed text-xs mb-2">
//             {task.description}
//           </p>

//           {/* Enhanced progress section */}
//           <div className="space-y-2">
//             <div className="flex justify-between items-center">
//               <span className="text-xs font-medium text-gray-700">Progress</span>
//               <div className="flex items-center gap-1">
//                 <span className={`text-xs font-bold bg-gradient-to-r ${getProgressGradient(task.progress)}
//                   bg-clip-text text-transparent`}>
//                   {task.progress}%
//                 </span>
//                 {task.progress === 100 && (
//                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
//                 )}
//               </div>
//             </div>
//             <div className="relative">
//               <Progress
//                 value={task.progress}
//                 className="h-2 bg-gray-100 border border-gray-200/50 shadow-inner"
//               />
//               <div className={`absolute inset-0 bg-gradient-to-r ${getProgressGradient(task.progress)}
//                 rounded-full transition-all duration-500 ease-out opacity-90`}
//                 style={{ width: `${task.progress}%` }}
//               />
//             </div>
//           </div>

//           {/* Enhanced tags section */}
//           <div className="flex flex-wrap gap-1.5">
//             {task.tags.map((tag, index) => (
//               <Badge
//                 key={index}
//                 variant="secondary"
//                 className={`flex items-center gap-1 px-2 py-1
//                   ${getPriorityBadgeStyle(tag)} font-medium
//                   hover:shadow-sm transition-all duration-200 text-xs`}
//               >
//                 <Tag className="h-2.5 w-2.5" />
//                 {tag}
//               </Badge>
//             ))}
//           </div>

//           {/* Enhanced footer */}
//           <div className="flex items-center justify-between pt-3 border-t border-gray-100/80">
//             <div className="flex items-center text-gray-500 text-sm font-medium">
//               {task.date}
//             </div>

//             <div className="flex items-center gap-2">
//               <span className="text-xs text-gray-400 font-medium">Team</span>
//               <div className="flex -space-x-2">
//                 {task.assignees.map((assignee, index) => (
//                   <Avatar
//                     key={index}
//                     className="h-8 w-8 border-2 border-white shadow-sm
//                       ring-2 ring-gray-100 hover:ring-gray-200
//                       transition-all duration-200 hover:scale-110"
//                   >
//                     <AvatarImage src={assignee} />
//                     <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200
//                       text-gray-600 text-xs font-semibold">
//                       {`U${index + 1}`}
//                     </AvatarFallback>
//                   </Avatar>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       <TaskDetailsModal
//         task={task}
//         isOpen={showDetailsModal}
//         onOpenChange={setShowDetailsModal}
//       />
//     </>
//   );
// };

// export default StandardTaskCard;

// "use state";
// import React, { useState } from "react";
// import { Calendar, Tag } from "lucide-react";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
// import { StandardTask } from "@/lib/types/taskManager/types";
// import TaskDetailsModal from "../modals/TaskDetailsModal";
// import { TaskActionButtons } from "../buttons/TaskActionButtons";

// interface StandardTaskCardProps {
//   task: StandardTask;
//   className?: string;
// }

// const StandardTaskCard: React.FC<StandardTaskCardProps> = ({
//   task,
//   className = "",
// }) => {
//   const [showDetailsModal, setShowDetailsModal] = useState(false);

//   return (
//     <>
//       <Card
//         className={`group hover:shadow-md transition-shadow ${className}`}
//         draggable
//       >
//         <CardContent className="p-4 space-y-4">
//           {/* Header with title and actions */}
//           <div className="flex items-start justify-between">
//             <h3 className="font-medium line-clamp-2">{task.title}</h3>
//             <TaskActionButtons
//               task={task}
//               onView={() => setShowDetailsModal(true)}
//               onEdit={() => {
//                 setShowDetailsModal(true);
//                 // The edit mode will be handled within the modal
//               }}
//               variant="card"
//             />
//           </div>

//           {/* Description */}
//           <p className="text-sm text-gray-600 line-clamp-2">
//             {task.description}
//           </p>

//           {/* Progress bar */}
//           <div className="space-y-1">
//             <div className="flex justify-between text-sm">
//               <span className="text-gray-500">Progress</span>
//               <span className="font-medium">{task.progress}%</span>
//             </div>
//             <Progress value={task.progress} className="h-2" />
//           </div>

//           {/* Tags */}
//           <div className="flex flex-wrap gap-2">
//             {task.tags.map((tag, index) => (
//               <Badge
//                 key={index}
//                 variant="secondary"
//                 className="flex items-center gap-1"
//               >
//                 <Tag className="h-3 w-3" />
//                 {tag}
//               </Badge>
//             ))}
//           </div>

//           {/* Footer with date and assignees */}
//           <div className="flex items-center justify-between pt-2">
//             <div className="flex items-center text-gray-500 text-sm">
//               <Calendar className="h-4 w-4 mr-1" />
//               {task.date}
//             </div>
//             <div className="flex -space-x-2">
//               {task.assignees.map((assignee, index) => (
//                 <Avatar key={index} className="h-6 w-6 border-2 border-white">
//                   <AvatarImage src={assignee} />
//                   <AvatarFallback>{`U${index + 1}`}</AvatarFallback>
//                 </Avatar>
//               ))}
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       <TaskDetailsModal
//         task={task}
//         isOpen={showDetailsModal}
//         onOpenChange={setShowDetailsModal}
//       />
//     </>
//   );
// };

// export default StandardTaskCard;
