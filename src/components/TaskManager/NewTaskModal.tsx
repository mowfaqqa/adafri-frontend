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
import MarketingTaskForm from "./forms/MarketingTaskForm";

const NewTaskModal = ({ activeTab, newTask, setNewTask, addNewTask }: any) => (
  <Dialog>
    {/* This is the card holding the inner card DialogTrigger */}
    <DialogTrigger asChild>
      <Button className="bg-teal-600 fixed bottom-8 md:right-[90px] shadow-lg ">
        <Plus className="w-4 h-4 mr-2" />
        New{" "}
        {activeTab === "sprints"
          ? "Sprint Task"
          : activeTab === "marketing"
          ? "Marketing Task"
          : "Task"}
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
        Create New{" "}
          {activeTab === "sprints"
            ? "Sprint Task"
            : activeTab === "marketing"
            ? "Marketing Task"
            : "Task"}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 mt-4">
        {/* <NewTaskForm /> */} 
        {activeTab === "sprints" ? (
          <CreateSprintForm />
        ) : activeTab === "marketing" ? (
          <MarketingTaskForm />
        ) : (
          <NewTaskForm />
        )}
        {/* <Button onClick={addNewTask}>Create Task</Button> */}
      </div>
    </DialogContent>
  </Dialog>
);

export default NewTaskModal;
