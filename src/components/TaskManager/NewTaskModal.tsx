/* eslint-disable @typescript-eslint/no-unused-vars */
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
import NewTaskForm from "./forms/NewTaskForm";
import CreateSprintForm from "./forms/CreateSprintForm";

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
        <NewTaskForm />
        {activeTab === "sprints" && <CreateSprintForm />}
        <Button onClick={addNewTask}>Create Task</Button>
      </div>
    </DialogContent>
  </Dialog>
);

export default NewTaskModal;
