// types/TaskManager/types.ts

export type TaskStatus = "todo" | "inProgress" | "done";
export type StandardTaskCategory = "marketing" | "sales" | "development";
export type TaskCategory = StandardTaskCategory | "sprints";
export type TabType = "viewAll" | TaskCategory;

// Base interface for common task properties
interface BaseTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  lastModified: string;
  date: string;
  tags: string[];
  assignees: string[];
  progress: number;
  activityLog: ActivityLogEntry[];
}

// Sprint specific task interface
export interface SprintTask extends BaseTask {
  category: "sprints";
  storyPoints: number;
  sprint: string;
}

// Standard task interface
export interface StandardTask extends BaseTask {
  category: "viewAll" | StandardTaskCategory;
}

// Union type for all task types
export type Task = SprintTask | StandardTask;

export interface Column {
  id: TaskStatus;
  title: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  action: "created" | "updated" | "statusChanged" | "deleted";
  description: string;
  userId: string;
}

// Form-related types
export interface BaseTaskFormData {
  title: string;
  description: string;
  tags: string;
  status: string;
  date: string;
  assignees: string[];
  progress: number;
}

export interface SprintTaskFormData extends BaseTaskFormData {
  category: "sprints";
  storyPoints: number;
  sprint: string;
}

export interface StandardTaskFormData extends BaseTaskFormData {
  category: StandardTaskCategory;
}

export type NewTaskFormData = SprintTaskFormData | StandardTaskFormData;

// Context types
export interface TaskManagerContextType {
  tasks: Task[];
  columns: Column[];
  addTask: (task: NewTaskFormData) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, newStatus: TaskStatus) => void;
  addColumn: (title: string) => void;
}
