// src/components/task-manager/EpicsList.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
import { Epic } from "@/lib/types/taskManager/types";
import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";
import { Progress } from "@/components/ui/progress";

interface EpicsListProps {
  onEdit: (epic: Epic) => void;
}

const EpicsList: React.FC<EpicsListProps> = ({ onEdit }) => {
  const { projectId } = useProjectContext();
  const { useEpicsQuery, useDeleteEpicMutation } = useAuthAwareTaskManagerApi();

  // Fetch epics for the current project
  const { data: epics = [], isLoading } = useEpicsQuery(projectId || "");

  // Delete epic mutation
  const deleteMutation = useDeleteEpicMutation();

  const handleDelete = (epicId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this epic? This cannot be undone."
      )
    ) {
      deleteMutation.mutate({
        projectId: projectId!,
        epicId: epicId,
      });
    }
  };

  if (isLoading) {
    return <div>Loading epics...</div>;
  }

  if (epics.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">No Epics Yet</h3>
        <p className="text-gray-500 mb-4">
          Create your first epic to organize related tasks
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {epics.map((epic: any) => (
        <Card key={epic?.id} className="overflow-hidden">
          <CardHeader className="pb-2 flex flex-row justify-between items-start">
            <div>
              <CardTitle className="text-lg font-semibold">
                {epic?.title}
              </CardTitle>
              <div className="text-xs text-gray-500">
                {new Date(epic?.startDate).toLocaleDateString()} -
                {epic?.endDate
                  ? new Date(epic?.endDate).toLocaleDateString()
                  : "Ongoing"}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(epic)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete(epic.id)}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 mb-4 line-clamp-3">
              {epic.description}
            </div>
            <div className="mb-1 flex justify-between text-xs">
              <span>Progress</span>
              <span>{epic.progress}%</span>
            </div>
            <Progress value={epic.progress} className="h-2" />
            <div className="mt-4 text-xs text-gray-500">
              Status: <span className="font-medium">{epic.status}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EpicsList;
