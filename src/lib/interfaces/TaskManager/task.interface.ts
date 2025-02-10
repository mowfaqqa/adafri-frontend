/* eslint-disable @typescript-eslint/no-explicit-any */
export type TabType =
  | "viewAll"
  | "sprints"
  | "marketing"
  | "sales"
  | "development";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  date: string;
  tags: string[];
  assignees: string[];
  category: TabType;
  progress?: number;
  storyPoints?: number;
  sprint?: string;
  createdAt: string;
  lastModified?: string;
  activityLog?: any;
}

export interface Column {
  id: string;
  title: string;
}
