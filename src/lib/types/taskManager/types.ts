// types/TaskManager/types.ts

export type TaskStatus = string;
export type StandardTaskCategory = "marketing" | "sales" | "development";
export type TaskCategory = StandardTaskCategory | "sprints";
export type TabType = "viewAll" | TaskCategory;

export type ProjectVisibility = "private" | "team" | "public";
export type ProjectRole = "admin" | "member";

export interface ProjectMember {
  userId: string;
  role: ProjectRole;
  addedAt: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  createdBy: string;
  members: ProjectMember[];
  visibility: ProjectVisibility;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  statuses?: string[];
}

export interface Epic {
  id: string;
  title: string;
  description: string;
  projectId: string;
  startDate: string;
  endDate?: string;
  status: string;
  createdBy: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  projectId: string;
  dueDate: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTag {
  id: string;
  name: string;
  color: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStatus {
  id: string;
  name: string;
  color: string;
  projectId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

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
  storyPoints?: number;
  sprint?: string;
  userId: string;
  projectId: string;
  epicId?: string;
  milestoneId?: string;
}

// Sprint specific task interface
export interface SprintTask extends BaseTask {
  category: "sprints";
  epicId: string;
  sprint: string;
  storyPoints: number;
}

// Standard task interface
export interface StandardTask extends BaseTask {
  category: StandardTaskCategory;
}

// Union type for all task types
export type Task = SprintTask | StandardTask;

export interface Column {
  id: string;
  title: string;
  name: string;
  color?: string;
  order?: number;
  projectId?: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  action:
    | "created"
    | "updated"
    | "statusChanged"
    | "deleted"
    | "file_attached"
    | "file_removed"
    | "status_updated"
    | "progress_updated"
    | "assignees_updated";
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
  projectId: string;
  epicId?: string;
  milestoneId?: string;
}

export interface SprintTaskFormData extends BaseTaskFormData {
  category: "sprints";
  storyPoints: number;
  sprint: string;
  epicId: string;
}

export interface StandardTaskFormData extends BaseTaskFormData {
  category: StandardTaskCategory;
}

export type NewTaskFormData = SprintTaskFormData | StandardTaskFormData;

export interface ProjectFormData {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  visibility: ProjectVisibility;
}

export interface EpicFormData {
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  status: string;
  projectId: string;
}

export interface MilestoneFormData {
  title: string;
  description: string;
  dueDate: string;
  status: string;
  projectId: string;
}

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

export function isSprintTask(task: Task): task is SprintTask {
  return task.category === "sprints";
}

export function isStandardTask(task: Task): task is StandardTask {
  return task.category !== "sprints";
}

export interface FileAttachment {
  id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  taskId: string;
  url: string;
  secureUrl: string;
  publicId: string;
  resourceType?: string;
  format?: string;
  createdAt: string;
  updatedAt?: string;
}
export interface CloudinaryUploadResponse {
  public_id: string;
  version: string;
  signature: string;
  width?: number;
  height?: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  type: string;
  url: string;
  secure_url: string;
}
