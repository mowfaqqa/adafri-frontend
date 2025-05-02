// components/TaskManager/cards/SprintTaskCard.tsx
import React, { useState } from "react";
import { Calendar, Tag, BarChart2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SprintTask } from "@/lib/types/taskManager/types";
import { TaskActionButtons } from "../TaskManager/buttons/TaskActionButtons";
import TaskDetailsModal from "../TaskManager/modals/TaskDetailsModal";

interface SprintTaskCardProps {
  task: SprintTask;
  className?: string;
}

const SprintTaskCard: React.FC<SprintTaskCardProps> = ({
  task,
  className = "",
}) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  return (
    <>
      <Card
        className={`group hover:shadow-md transition-shadow ${className}`}
        draggable
      >
        <CardContent className="p-4 space-y-4">
          {/* Header with title and actions */}
          <div className="flex items-start justify-between">
            <h3 className="font-medium line-clamp-2">{task.title}</h3>
            <TaskActionButtons
              task={task}
              onView={() => setShowDetailsModal(true)}
              onEdit={() => {
                setShowDetailsModal(true);
              }}
              variant="card"
            />
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2">
            {task.description}
          </p>

          {/* Sprint Info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <BarChart2 className="h-3 w-3" />
                {task.storyPoints} pts
              </Badge>
              <Badge>{task.sprint}</Badge>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Progress</span>
              <span className="font-medium">{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-2" />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {task.tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-1"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </Badge>
            ))}
          </div>

          {/* Footer with date and assignees */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center text-gray-500 text-sm">
              <Calendar className="h-4 w-4 mr-1" />
              {task.date}
            </div>
            <div className="flex -space-x-2">
              {task.assignees.map((assignee, index) => (
                <Avatar key={index} className="h-6 w-6 border-2 border-white">
                  <AvatarImage src={assignee} />
                  <AvatarFallback>{`U${index + 1}`}</AvatarFallback>
                </Avatar>
              ))}
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
