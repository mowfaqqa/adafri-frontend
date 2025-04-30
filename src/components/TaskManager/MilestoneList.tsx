// src/components/task-manager/MilestonesList.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTaskManagerApi } from "@/lib/hooks/useTaskmanagerApi";
import { Milestone } from "@/lib/types/taskManager/types";
import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";
import { Badge } from "@/components/ui/badge";

interface MilestonesListProps {
  onEdit: (milestone: Milestone) => void;
}

const MilestonesList: React.FC<MilestonesListProps> = ({ onEdit }) => {
  const { projectId } = useProjectContext();
  const { useMilestonesQuery, useDeleteMilestoneMutation } =
    useTaskManagerApi();

  // Fetch milestones for the current project
  const { data: milestones = [], isLoading } = useMilestonesQuery(
    projectId || ""
  );

  // Delete milestone mutation
  const deleteMutation = useDeleteMilestoneMutation();

  const handleDelete = (milestoneId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this milestone? This cannot be undone."
      )
    ) {
      deleteMutation.mutate({
        projectId: projectId!,
        milestoneId: milestoneId,
      });
    }
  };

  if (isLoading) {
    return <div>Loading milestones...</div>;
  }

  if (milestones.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">No Milestones Yet</h3>
        <p className="text-gray-500 mb-4">
          Create your first milestone to track important project checkpoints
        </p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "at risk":
        return "bg-red-100 text-red-800";
      case "on track":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {milestones.map((milestone) => {
        // Calculate if milestone is overdue
        const isOverdue =
          new Date(milestone.dueDate) < new Date() &&
          milestone.status.toLowerCase() !== "completed";

        return (
          <Card
            key={milestone.id}
            className={`overflow-hidden ${isOverdue ? "border-red-300" : ""}`}
          >
            <CardHeader className="pb-2 flex flex-row justify-between items-start">
              <div>
                <CardTitle className="text-lg font-semibold">
                  {milestone.title}
                </CardTitle>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>
                    Due: {new Date(milestone.dueDate).toLocaleDateString()}
                  </span>
                  {isOverdue && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(milestone)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(milestone.id)}>
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-700 mb-4 line-clamp-3">
                {milestone.description}
              </div>
              <Badge className={getStatusColor(milestone.status)}>
                {milestone.status}
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MilestonesList;
