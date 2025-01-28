/* eslint-disable @typescript-eslint/no-explicit-any */
import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

const NewTaskModal = ({ activeTab, newTask, setNewTask, addNewTask }: any) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button>
        <Plus className="w-4 h-4 mr-2" />
        New {activeTab === "sprints" ? "Sprint Task" : "Task"}
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          Create New {activeTab === "sprints" ? "Sprint Task" : "Task"}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 mt-4">
        <Input
          placeholder="Task Title"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
        />
        <Textarea
          placeholder="Task Description"
          value={newTask?.description}
          onChange={(e) =>
            setNewTask({ ...newTask, description: e.target.value })
          }
        />
        <Input
          placeholder="Tags (comma separated)"
          value={newTask?.tags}
          onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
        />
        {activeTab === "sprints" && (
          <>
            <Input
              type="number"
              placeholder="Story Points"
              value={newTask.storyPoints}
              onChange={(e) =>
                setNewTask({ ...newTask, storyPoints: e.target.value })
              }
            />
            <Input
              placeholder="Sprint (e.g., Sprint 23)"
              value={newTask.sprint}
              onChange={(e) =>
                setNewTask({ ...newTask, sprint: e.target.value })
              }
            />
            <div className="space-y-2">
              <label className="text-sm">Progress</label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="Progress (%)"
                value={newTask.progress}
                onChange={(e) =>
                  setNewTask({ ...newTask, progress: parseInt(e.target.value) })
                }
              />
            </div>
          </>
        )}
        <Button onClick={addNewTask}>Create Task</Button>
      </div>
    </DialogContent>
  </Dialog>
);

export default NewTaskModal;
