"use client";

import React, { useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ColumnHeaderProps {
  column: {
    id: string;
    name: string;
  };
  tasksInColumn: any[];
  onEditClick: () => void;
  onDeleteClick: () => void;
}

const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  column,
  tasksInColumn,
  onEditClick,
  onDeleteClick
}) => {
  const [showActionsModal, setShowActionsModal] = useState<boolean>(false);

  const handleEditClick = (): void => {
    setShowActionsModal(false);
    onEditClick();
  };

  const handleDeleteClick = (): void => {
    setShowActionsModal(false);
    onDeleteClick();
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse"></div>
          <h3 className="font-bold text-lg text-gray-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
            {column.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full">
            <p className="text-xs font-semibold text-gray-600">
              {tasksInColumn.length} task{tasksInColumn.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
        {/* Three-dot menu button */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-full hover:bg-gray-100 transition-colors"
          onClick={() => setShowActionsModal(true)}
          title="Column Actions"
        >
          <MoreVertical className="h-4 w-4 text-gray-600" />
        </Button>

        {/* Actions Modal */}
        <Dialog open={showActionsModal} onOpenChange={setShowActionsModal}>
          <DialogContent className="w-64 p-0 rounded-xl border-0 shadow-xl">
            <div className="py-2">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-sm text-gray-700">
                  Column Actions
                </h3>
              </div>
              <div className="py-1">
                <button
                  onClick={handleEditClick}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <Pencil className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Edit Status
                  </span>
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Delete Status
                  </span>
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ColumnHeader;