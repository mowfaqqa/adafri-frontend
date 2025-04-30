// src/components/task-manager/MilestonesPanel.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MilestonesList from "./MilestoneList";
import MilestoneForm from "./MilestoneForm";
import { Milestone } from "@/lib/types/taskManager/types";

const MilestonesPanel: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [milestoneToEdit, setMilestoneToEdit] = useState<Milestone | undefined>(undefined);

  const handleCreateClick = () => {
    setMilestoneToEdit(undefined);
    setIsFormOpen(true);
  };

  const handleEditMilestone = (milestone: Milestone) => {
    setMilestoneToEdit(milestone);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setMilestoneToEdit(undefined);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Milestones</h2>
        <Button 
          className="bg-teal-600"
          onClick={handleCreateClick}
        >
          Create Milestone
        </Button>
      </div>

      {/* Milestone list component */}
      <MilestonesList onEdit={handleEditMilestone} />

      {/* Create/Edit dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {milestoneToEdit ? "Edit Milestone" : "Create New Milestone"}
            </DialogTitle>
          </DialogHeader>
          <MilestoneForm
            onSubmit={handleFormClose}
            onCancel={handleFormClose}
            milestoneToEdit={milestoneToEdit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MilestonesPanel;