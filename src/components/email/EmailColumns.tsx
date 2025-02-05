import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { useEmailStore } from "@/store/email-store";
import { EmailCard } from "./EmailCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { EmailSegment } from "@/lib/types/email";

export const EmailColumns = () => {
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
      <div className="grid grid-cols-12 gap-4">
        {/* All Mail Column */}
        <Droppable droppableId="all">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="col-span-4 bg-gray-50 p-4 rounded-lg"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">All Mail</h3>
                {showNewSegmentInput ? (
                  <div className="flex gap-2">
                    <Input
                      value={newSegmentName}
                      onChange={(e) => setNewSegmentName(e.target.value)}
                      placeholder="Segment name"
                      className="w-32"
                    />
                    <Button size="sm" onClick={handleAddSegment}>
                      Add
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewSegmentInput(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {filteredEmails
                .filter((email) => !email.isUrgent)
                .map((email, index) => (
                  <EmailCard key={email.id} email={email} index={index} />
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {/* Urgent Column */}
        <Droppable droppableId="urgent">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="col-span-4 bg-gray-50 p-4 rounded-lg"
            >
              <h3 className="font-semibold mb-4">Urgent</h3>
              {filteredEmails
                .filter((email) => email.isUrgent)
                .map((email, index) => (
                  <EmailCard key={email.id} email={email} index={index} />
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {/* Custom Segments */}
        {customSegments.map((segment) => (
          <Droppable key={segment} droppableId={segment}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="col-span-4 bg-gray-50 p-4 rounded-lg"
              >
                <h3 className="font-semibold mb-4">{segment}</h3>
                {/* Custom segment emails would go here */}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
};
