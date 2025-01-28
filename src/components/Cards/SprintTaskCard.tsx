import { Clock } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Task } from "@/lib/interfaces/TaskManager/task.interface";

const SprintTaskCard = ({ task }: { task: Task }) => (
  <Card className="mb-4 cursor-move">
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <div className="w-full">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">{task.title}</h4>
            <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
              {task.sprint}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-3">{task.description}</p>
          <div className="space-y-2 w-full">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="w-full" />
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">
                {task.storyPoints} points
              </span>
            </div>
            <div className="flex -space-x-2">
              {task.assignees.map((assignee, idx) => (
                <img
                  key={idx}
                  src={assignee}
                  alt="assignee"
                  className="w-8 h-8 rounded-full border-2 border-white"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default SprintTaskCard;
