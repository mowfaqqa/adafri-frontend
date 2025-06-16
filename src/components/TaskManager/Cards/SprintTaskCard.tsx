"use client";
import React, { useState } from "react";
import { Calendar, Tag, BarChart2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SprintTask } from "@/lib/types/taskManager/types";
import { TaskActionButtons } from "../buttons/TaskActionButtons";
import TaskDetailsModal from "../modals/TaskDetailsModal";

interface SprintTaskCardProps {
  task: SprintTask;
  className?: string;
}

const SprintTaskCard: React.FC<SprintTaskCardProps> = ({
  task,
  className = "",
}) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Dynamic styling based on progress
  const getProgressGradient = (progress: number) => {
    if (progress >= 80) return "from-emerald-500 to-teal-600";
    if (progress >= 50) return "from-blue-500 to-indigo-600";
    if (progress >= 20) return "from-amber-500 to-orange-600";
    return "from-rose-500 to-pink-600";
  };

  const getCardAccent = (progress: number) => {
    if (progress >= 80) return "border-l-emerald-500 shadow-emerald-100";
    if (progress >= 50) return "border-l-blue-500 shadow-blue-100";
    if (progress >= 20) return "border-l-amber-500 shadow-amber-100";
    return "border-l-rose-500 shadow-rose-100";
  };

  // Get priority-based badge styling
  const getPriorityBadgeStyle = (tag: string) => {
    const lowerTag = tag.toLowerCase();
    if (lowerTag.includes('high')) {
      return "bg-gradient-to-r from-red-100 to-red-50 border-red-200 text-red-800 hover:from-red-50 hover:to-red-25";
    }
    if (lowerTag.includes('medium')) {
      return "bg-gradient-to-r from-amber-100 to-amber-50 border-amber-200 text-amber-800 hover:from-amber-50 hover:to-amber-25";
    }
    if (lowerTag.includes('low')) {
      return "bg-gradient-to-r from-green-100 to-green-50 border-green-200 text-green-800 hover:from-green-50 hover:to-green-25";
    }
    return "bg-gradient-to-r from-gray-100 to-gray-50 border-gray-200/70 text-gray-700 hover:from-gray-50 hover:to-white";
  };

  // Story points based styling
  const getStoryPointsStyle = (points: number) => {
    if (points >= 8) return "from-purple-100 to-purple-50 border-purple-200 text-purple-800";
    if (points >= 5) return "from-blue-100 to-blue-50 border-blue-200 text-blue-800";
    if (points >= 3) return "from-green-100 to-green-50 border-green-200 text-green-800";
    return "from-gray-100 to-gray-50 border-gray-200 text-gray-700";
  };

  return (
    <>
      <Card
        className={`group relative overflow-hidden transition-all duration-300 ease-out
          hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1 
          border-l-4 ${getCardAccent(task.progress)}
          bg-gradient-to-br from-white via-white to-gray-50/30
          backdrop-blur-sm border border-gray-200/60 ${className}`}
        draggable
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/[0.02] pointer-events-none" />
        
        {/* Animated border gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
          -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

        <CardContent className="relative p-4 space-y-3">
          {/* Header with title and actions */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-normal text-gray-900 line-clamp-2 text-base leading-tight
              group-hover:text-gray-800 transition-colors duration-200">
              {task.title}
            </h3>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <TaskActionButtons
                task={task}
                onView={() => setShowDetailsModal(true)}
                onEdit={() => {
                  setShowDetailsModal(true);
                }}
                variant="card"
              />
            </div>
          </div>

          {/* Description with enhanced styling */}
          <p className="text-gray-600 line-clamp-1 leading-relaxed text-xs">
            {task.description}
          </p>

          {/* Sprint Info with enhanced styling */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Badge 
                variant="outline" 
                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium
                  bg-gradient-to-r ${getStoryPointsStyle(task.storyPoints)}
                  hover:shadow-sm transition-all duration-200`}
              >
                <BarChart2 className="h-2.5 w-2.5" />
                {task.storyPoints} pts
              </Badge>
              <Badge className="px-2 py-1 text-xs font-medium
                bg-gradient-to-r from-indigo-100 to-indigo-50 
                border-indigo-200 text-indigo-800
                hover:from-indigo-50 hover:to-indigo-25 hover:shadow-sm
                transition-all duration-200">
                {task.sprint}
              </Badge>
            </div>
          </div>

          {/* Enhanced progress section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-700">Progress</span>
              <div className="flex items-center gap-1">
                <span className={`text-xs font-bold bg-gradient-to-r ${getProgressGradient(task.progress)} 
                  bg-clip-text text-transparent`}>
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
                className="h-2 bg-gray-100 border border-gray-200/50 shadow-inner" 
              />
              <div className={`absolute inset-0 bg-gradient-to-r ${getProgressGradient(task.progress)} 
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
                className={`flex items-center gap-1 px-2 py-1 
                  ${getPriorityBadgeStyle(tag)} font-medium
                  hover:shadow-sm transition-all duration-200 text-xs`}
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </Badge>
            ))}
          </div>

          {/* Enhanced footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100/80">
            <div className="flex items-center text-gray-500 text-xs font-medium">
              {task.date}
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 font-medium">Team</span>
              <div className="flex -space-x-1.5">
                {task.assignees.map((assignee, index) => (
                  <Avatar 
                    key={index} 
                    className="h-6 w-6 border-2 border-white shadow-sm
                      ring-1 ring-gray-100 hover:ring-gray-200 
                      transition-all duration-200 hover:scale-110"
                  >
                    <AvatarImage src={assignee} />
                    <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 
                      text-gray-600 text-xs font-semibold">
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

export default SprintTaskCard;






























// // components/TaskManager/cards/SprintTaskCard.tsx
// import React, { useState } from "react";
// import { Calendar, Tag, BarChart2 } from "lucide-react";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
// import { SprintTask } from "@/lib/types/taskManager/types";
// import { TaskActionButtons } from "../buttons/TaskActionButtons";
// import TaskDetailsModal from "../modals/TaskDetailsModal";

// interface SprintTaskCardProps {
//   task: SprintTask;
//   className?: string;
// }

// const SprintTaskCard: React.FC<SprintTaskCardProps> = ({
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
//               }}
//               variant="card"
//             />
//           </div>

//           {/* Description */}
//           <p className="text-sm text-gray-600 line-clamp-2">
//             {task.description}
//           </p>

//           {/* Sprint Info */}
//           <div className="flex items-center justify-between text-sm">
//             <div className="flex items-center gap-2">
//               <Badge variant="outline" className="flex items-center gap-1">
//                 <BarChart2 className="h-3 w-3" />
//                 {task.storyPoints} pts
//               </Badge>
//               <Badge>{task.sprint}</Badge>
//             </div>
//           </div>

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

// export default SprintTaskCard;
