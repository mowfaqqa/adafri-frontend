"use client";

import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { Email } from "@/lib/types/email";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/utils/emails/draftEmailUtils";

interface DraftEmailListProps {
  emails: Email[];
  selectedEmails: string[];
  isLoading: boolean;
  error: string | null;
  onSelectEmail: (id: string) => void;
  onSelectAll: () => void;
  onEditDraft: (email: Email) => void;
  onDeleteDrafts: () => void;
  onRefresh: () => void;
}

export const DraftEmailList = ({
  emails,
  selectedEmails,
  isLoading,
  error,
  onSelectEmail,
  onSelectAll,
  onEditDraft,
  onDeleteDrafts,
  onRefresh
}: DraftEmailListProps) => {
  const handleSingleDelete = (email: Email) => {
    // This will be handled by the parent component
    onDeleteDrafts();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={onRefresh}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No draft emails found
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Select All Header */}
      <div className="p-2 flex items-center bg-gray-50 border-b">
        <Checkbox
          checked={selectedEmails.length === emails.length && emails.length > 0}
          onCheckedChange={onSelectAll}
          className="ml-4"
        />
        {selectedEmails.length > 0 && (
          <div className="ml-4 flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeleteDrafts}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete ({selectedEmails.length})
            </Button>
          </div>
        )}
      </div>

      {/* Email Items */}
      {emails.map((email) => (
        <DraftEmailItem
          key={email.id || `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`}
          email={email}
          isSelected={selectedEmails.includes(email.id || '')}
          onSelect={() => onSelectEmail(email.id || '')}
          onEdit={() => onEditDraft(email)}
          onDelete={() => handleSingleDelete(email)}
        />
      ))}
    </div>
  );
};

interface DraftEmailItemProps {
  email: Email;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const DraftEmailItem = ({
  email,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}: DraftEmailItemProps) => {
  return (
    <div
      className={`flex items-center px-4 py-3 border-b last:border-b-0 hover:bg-slate-50 transition-colors cursor-pointer ${
        isSelected ? 'bg-blue-50' : ''
      }`}
    >
      <div className="mr-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => {}}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        />
      </div>
      
      <div
        className="flex-1 grid grid-cols-12 gap-2"
        onClick={onEdit}
      >
        <div className="col-span-2 text-sm text-gray-600 truncate pr-2">
          To: {email.to || 'No recipient'}
        </div>
        <div className="col-span-7 flex items-center">
          <div className="text-sm truncate">
            <span className="font-medium">
              {email.subject || '(No Subject)'}
            </span>
            {email.content && (
              <span className="text-gray-500"> - {email.content}</span>
            )}
          </div>
        </div>
        <div className="col-span-3 text-right text-sm text-gray-500">
          {formatDate((email as any).timestamp?.toString())}
        </div>
      </div>
      
      <div className="flex space-x-2 ml-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-700"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
};