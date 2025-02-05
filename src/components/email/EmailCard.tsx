"use client";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Email } from "@/lib/types/email";
import { Paperclip, Trash } from "lucide-react";
import { Draggable } from "react-beautiful-dnd";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useEmailStore } from "@/store/email-store";

interface EmailCardProps {
  email: Email;
  index: number;
}

export const EmailCard = ({ email, index }: EmailCardProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const deleteEmail = useEmailStore((state) => state.deleteEmail);

  const handleDelete = () => {
    deleteEmail(email.id);
  };

  return (
    <>
      <Draggable draggableId={email.id} index={index}>
        {(provided) => (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className="p-4 mb-2 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setShowDialog(true)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox />
                <span className="text-sm text-gray-500">{email.timestamp}</span>
              </div>
              <div className="flex gap-2">
                {email.hasAttachment && <Paperclip className="w-4 h-4" />}
                <Trash
                  className="w-4 h-4 text-gray-400 hover:text-red-500 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                />
              </div>
            </div>
            <div className="mt-2">
              <p className="font-semibold truncate">{email.from}</p>
              <p className="text-sm text-gray-700 truncate">{email.subject}</p>
            </div>
          </Card>
        )}
      </Draggable>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{email.subject}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>From: {email.from}</span>
              <span>To: {email.to}</span>
            </div>
            <div className="border-t pt-4">
              <p className="whitespace-pre-wrap">{email.content}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
