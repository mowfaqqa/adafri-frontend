// src/components/task-manager/EpicsPanel.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EpicsList from "./EpicsList";
import EpicForm from "./EpicForm";
import { Epic } from "@/lib/types/taskManager/types";

const EpicsPanel: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [epicToEdit, setEpicToEdit] = useState<Epic | undefined>(undefined);

  const handleCreateClick = () => {
    setEpicToEdit(undefined);
    setIsFormOpen(true);
  };

  const handleEditEpic = (epic: Epic) => {
    setEpicToEdit(epic);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEpicToEdit(undefined);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Epics</h2>
        <Button className="bg-teal-600" onClick={handleCreateClick}>
          Create Epic
        </Button>
      </div>

      {/* Epic list component */}
      <EpicsList onEdit={handleEditEpic} />

      {/* Create/Edit dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {epicToEdit ? "Edit Epic" : "Create New Epic"}
            </DialogTitle>
          </DialogHeader>
          <EpicForm
            onSubmit={handleFormClose}
            onCancel={handleFormClose}
            epicToEdit={epicToEdit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EpicsPanel;
