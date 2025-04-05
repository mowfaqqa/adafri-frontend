/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Draggable } from "react-beautiful-dnd";
import { Clock, Paperclip, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Define Email interface
interface Email {
  id: string;
  subject: string;
  content: string;
  from: string;
  to: string;
  timestamp: string;
  status: string;
  isUrgent: boolean;
  hasAttachment: boolean;
  category: string;
  isRead: boolean;
}

interface EmailCardProps {
  email: Email;
  index: number;
}

export const EmailCard2: React.FC<EmailCardProps> = ({ email, index }) => {
  // Format timestamp
  const formattedTime = formatDistanceToNow(new Date(email.timestamp), { addSuffix: true });
  
  // Get sender name
  const getSenderName = (from: string) => {
    try {
      // Try to parse out name from email format: "Name <email@domain.com>"
      const matches = from.match(/^([^<]+)/);
      if (matches && matches[1]) {
        return matches[1].trim();
      }
      // If no name part, use the email part
      return from.split('@')[0] || from;
    } catch (error) {
      // Fallback to the original string if parsing fails
      return from;
    }
  };

  return (
    <Draggable draggableId={email.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            p-3 rounded-md border bg-white shadow-sm mb-2
            ${snapshot.isDragging ? 'shadow-md' : ''}
            ${email.isRead ? 'opacity-70' : ''}
          `}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.8 : 1,
          }}
        >
          <div className="flex justify-between items-start">
            <div className="font-medium text-sm truncate max-w-[70%]">
              {email.subject}
            </div>
            <div className="flex items-center space-x-1">
              {email.isUrgent && (
                <span className="text-red-500" title="Urgent">
                  <AlertCircle className="h-4 w-4" />
                </span>
              )}
              {email.hasAttachment && (
                <span className="text-gray-500" title="Has Attachment">
                  <Paperclip className="h-4 w-4" />
                </span>
              )}
            </div>
          </div>
          
          <div className="text-xs text-gray-600 mt-1 truncate">
            {getSenderName(email.from)}
          </div>
          
          <div className="text-xs text-gray-400 mt-2 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {formattedTime}
          </div>
          
          <div className="text-xs text-gray-500 mt-2 truncate max-h-10 overflow-hidden">
            {email.content}
          </div>
        </div>
      )}
    </Draggable>
  );
};