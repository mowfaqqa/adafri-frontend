// components/TaskManager/modals/TaskDetailsModal.tsx
import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { TaskActionButtons } from '../buttons/TaskActionButtons';
import { Task, SprintTask } from '@/lib/types/taskManager/types';
import { useTaskManagerContext } from '@/lib/context/TaskmanagerContext';


interface TaskDetailsModalProps {
  task: Task;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen,
  onOpenChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const { updateTask } = useTaskManagerContext();

  const handleSave = () => {
    updateTask(task.id, editedTask);
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const renderViewMode = () => (
    <div className="space-y-6">
      {/* Basic Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-gray-500">Title</Label>
            <p className="font-medium">{task.title}</p>
          </div>
          <div>
            <Label className="text-sm text-gray-500">Description</Label>
            <p className="text-gray-700">{task.description}</p>
          </div>
          <div>
            <Label className="text-sm text-gray-500">Status</Label>
            <Badge variant="outline" className="mt-1">
              {task.status}
            </Badge>
          </div>
          {task.category === 'sprints' && (
            <>
              <div>
                <Label className="text-sm text-gray-500">Story Points</Label>
                <p>{(task as SprintTask).storyPoints}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Sprint</Label>
                <p>{(task as SprintTask).sprint}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Assignees Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assignees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {task.assignees.map((assignee, index) => (
              <div
                key={index}
                className="flex items-center bg-gray-50 rounded-full px-3 py-1"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={assignee} />
                  <AvatarFallback>U{index + 1}</AvatarFallback>
                </Avatar>
                <span className="ml-2 text-sm">Assignee {index + 1}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tags Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {task.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <Label className="text-sm text-gray-500">Created</Label>
            <p>{formatDate(task.createdAt)}</p>
          </div>
          <div>
            <Label className="text-sm text-gray-500">Last Modified</Label>
            <p>{formatDate(task.lastModified)}</p>
          </div>
          <div>
            <Label className="text-sm text-gray-500">Due Date</Label>
            <p>{task.date}</p>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {task.activityLog.map((entry) => (
              <div key={entry.id} className="flex gap-4 text-sm">
                <div className="w-32 flex-shrink-0 text-gray-500">
                  {formatDate(entry.timestamp)}
                </div>
                <div>
                  <span className="font-medium">{entry.action}</span>
                  <span className="text-gray-600"> - {entry.description}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEditMode = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={editedTask.title}
            onChange={(e) =>
              setEditedTask({ ...editedTask, title: e.target.value })
            }
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={editedTask.description}
            onChange={(e) =>
              setEditedTask({ ...editedTask, description: e.target.value })
            }
          />
        </div>
        <div>
          <Label htmlFor="date">Due Date</Label>
          <Input
            id="date"
            value={editedTask.date}
            onChange={(e) =>
              setEditedTask({ ...editedTask, date: e.target.value })
            }
          />
        </div>
        <div>
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input
            id="tags"
            value={editedTask.tags.join(', ')}
            onChange={(e) =>
              setEditedTask({
                ...editedTask,
                tags: e.target.value.split(',').map((tag) => tag.trim()),
              })
            }
          />
        </div>
        {task.category === 'sprints' && (
          <>
            <div>
              <Label htmlFor="storyPoints">Story Points</Label>
              <Input
                id="storyPoints"
                type="number"
                value={(editedTask as SprintTask).storyPoints}
                onChange={(e) =>
                  setEditedTask({
                    ...editedTask,
                    storyPoints: parseInt(e.target.value),
                  } as SprintTask)
                }
              />
            </div>
            <div>
              <Label htmlFor="sprint">Sprint</Label>
              <Input
                id="sprint"
                value={(editedTask as SprintTask).sprint}
                onChange={(e) =>
                  setEditedTask({
                    ...editedTask,
                    sprint: e.target.value,
                  } as SprintTask)
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{task.title}</DialogTitle>
            <TaskActionButtons
              task={task}
              onView={() => {}}
              onEdit={() => setIsEditing(true)}
              variant="modal"
            />
          </div>
        </DialogHeader>

        {isEditing ? renderEditMode() : renderViewMode()}

        {isEditing && (
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setEditedTask(task);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsModal;