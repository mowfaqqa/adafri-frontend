// types/column.ts
import { LucideIcon } from "lucide-react";

export interface IconOption {
  icon: LucideIcon;
  name: string;
}

export interface GradientOption {
  name: string;
  gradient: string;
  preview: string;
}

export interface BaseColumn {
  id: string;
  name?: string;
  title?: string;
  gradient?: string;
  color?: string;
  icon?: IconOption | LucideIcon | any;
}

export interface ColumnData {
  id?: string;
  title: string;
  name: string;
  icon: IconOption;
  gradient: string;
  color?: string;
}

export interface CreateColumnPayload {
  projectId: string;
  name: string;
  color: string;
  icon: string;
  gradient: string;
}

export interface UpdateColumnPayload {
  projectId: string;
  statusId: string;
  name: string;
}

// Extend the existing Column type if needed
export interface ExtendedColumn extends BaseColumn {
  // Add any additional properties your API returns
}