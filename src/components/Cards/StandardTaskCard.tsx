import { MoreVertical } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Task } from "@/lib/interfaces/TaskManager/task.interface";

const StandardTaskCard = ({ task }: { task: Task }) => (
  <Card className="mb-4 cursor-move">
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium mb-2">{task.title}</h4>
          <p className="text-sm text-gray-500 mb-4">{task.description}</p>
          <div className="flex gap-2 mb-4">
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <MoreVertical className="w-5 h-5 text-gray-400" />
      </div>
      <div className="flex justify-between items-center">
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
        <span className="text-sm text-gray-500">{task.date}</span>
      </div>
    </CardContent>
  </Card>
);

export default StandardTaskCard;
