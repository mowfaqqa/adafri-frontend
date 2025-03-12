import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { useEmailStore } from "@/store/email-store";
import { EmailCard } from "./EmailCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { EmailSegment } from "@/lib/types/email";

export const EmailSent = () => {
    const { emails, moveEmail, customSegments, addSegment, activeCategory } =
        useEmailStore();
    const [showNewSegmentInput, setShowNewSegmentInput] = useState(false);
    const [newSegmentName, setNewSegmentName] = useState("");

    const filteredEmails = emails.filter(
        (email) => email.status === activeCategory
    );

    const handleAddSegment = () => {
        if (newSegmentName.trim()) {
            addSegment(newSegmentName);
            setNewSegmentName("");
            setShowNewSegmentInput(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onDragEnd = (result: any) => {
        if (!result.destination) return;
        const emailId = result.draggableId;
        const targetSegment = result.destination.droppableId as EmailSegment;
        moveEmail(emailId, targetSegment);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="relative w-full h-full overflow-x-auto pb-4">
            <div className="flex gap-4 w-max">
              
            </div>
          </div>
        </DragDropContext>

    );
};





