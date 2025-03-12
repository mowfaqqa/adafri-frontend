import TaskManagerOverview from "@/components/TaskManager/TaskManagerOverview";
import { TaskManagerProvider } from "@/lib/context/TaskmanagerContext";
import React from "react";


const TaskManager = () => {
  return (
    <TaskManagerProvider>
      <TaskManagerOverview />
    </TaskManagerProvider>
  );
};

export default TaskManager;
