/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Reply, Edit, Trash, Smile } from "lucide-react";
import dynamic from "next/dynamic";

import useMessageStore from "@/store/messaging/messageStore";
import useModalStore from "@/store/messaging/modalStore";
import Avatar from "@/components/custom-ui/avatar";
import { Attachment, Message } from "@/lib/types/collab-messaging/message";

// Dynamically import EmojiPicker to avoid SSR issues
const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="p-2 bg-white rounded-md shadow-md">
      Loading emoji picker...
    </div>
  ),
});

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isOwnMessage }) => {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const {
    updateMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    setActiveThread,
  } = useMessageStore();
  const { openModal } = useModalStore();

  // Format time
  const formatTime = (date: Date) => {
    // If today, show time
    if (new Date(date).toDateString() === new Date().toDateString()) {
      return new Date(date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // Otherwise, show relative time (e.g., "2 days ago")
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Handle message edit
  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(message.content);
  };

  // Handle edit submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editContent.trim() === "" || editContent === message.content) {
      setIsEditing(false);
      return;
    }

    try {
      await updateMessage(message.id, editContent);
      setIsEditing(false);
    } catch (error) {
      console.log("Error updating message:", error);
    }
  };

  // Handle message delete
  const handleDelete = async () => {
    try {
      await deleteMessage(message.id);
    } catch (error) {
      console.log("Error deleting message:", error);
    }
  };

  // Handle thread view
  const handleOpenThread = () => {
    setActiveThread(message.id);
  };

  // Handle emoji reaction
  const handleAddReaction = async (emoji: string) => {
    try {
      await addReaction(message.id, emoji);
      setShowEmojiPicker(false);
    } catch (error) {
      console.log("Error adding reaction:", error);
    }
  };

  // Handle removing a reaction
  const handleRemoveReaction = async (emoji: string) => {
    try {
      await removeReaction(message.id, emoji);
    } catch (error) {
      console.log("Error removing reaction:", error);
    }
  };

  // Check if user has already added a specific reaction
  const hasUserReacted = (emoji: string) => {
    if (!message.reactions) return false;

    const reaction = message.reactions.find((r: any) => r.emoji === emoji);
    return (
      reaction?.users.some((u: any) => u.id === message.sender.id) || false
    );
  };

  // Render attachments
  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <div className="mt-2 grid grid-cols-2 gap-2">
        {message.attachments.map((attachment: any) => (
          <AttachmentItem key={attachment.id} attachment={attachment} />
        ))}
      </div>
    );
  };

  return (
    <div
      className="group relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          <Avatar
            src={message.sender.avatar}
            alt={message.sender.fullName}
            size="md"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <span className="font-semibold">{message.sender.fullName}</span>
            <span className="ml-2 text-xs text-gray-500">
              {formatTime(message.createdAt)}
            </span>
            {message.isEdited && (
              <span className="ml-2 text-xs text-gray-400">(edited)</span>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="mt-1">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                autoFocus
              />
              <div className="mt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-sm bg-emerald-500 text-white rounded hover:bg-emerald-600"
                >
                  Save
                </button>
              </div>
            </form>
          ) : (
            <>
              <p className="text-gray-700 whitespace-pre-wrap">
                {message.content}
              </p>

              {/* Attachments */}
              {renderAttachments()}

              {/* Reactions */}
              {message.reactions && message.reactions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {message.reactions.map((reaction: any) => (
                    <button
                      key={reaction.emoji}
                      onClick={() =>
                        hasUserReacted(reaction.emoji)
                          ? handleRemoveReaction(reaction.emoji)
                          : handleAddReaction(reaction.emoji)
                      }
                      className={`
                        inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs
                        ${
                          hasUserReacted(reaction.emoji)
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }
                      `}
                    >
                      <span>{reaction.emoji}</span>
                      <span>{reaction.count}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Thread indicator */}
              {message.hasThread && (
                <button
                  onClick={handleOpenThread}
                  className="mt-1 text-xs text-emerald-600 hover:underline flex items-center space-x-1"
                >
                  <Reply size={12} />
                  <span>
                    {message.threadCount}{" "}
                    {message.threadCount === 1 ? "reply" : "replies"}
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Message actions */}
      {showActions && !message.isDeleted && (
        <div className="absolute -top-2 right-0 flex space-x-1 bg-white rounded-md shadow-sm border border-gray-200">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Add reaction"
          >
            <Smile size={16} />
          </button>
          <button
            onClick={handleOpenThread}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Reply in thread"
          >
            <Reply size={16} />
          </button>
          {isOwnMessage && (
            <>
              <button
                onClick={handleEdit}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Edit message"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Delete message"
              >
                <Trash size={16} />
              </button>
            </>
          )}
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="absolute right-0 z-10">
          <EmojiPicker
            onEmojiClick={(emojiData) => handleAddReaction(emojiData.emoji)}
            width={300}
            height={350}
          />
        </div>
      )}
    </div>
  );
};

// Attachment component
const AttachmentItem: React.FC<{ attachment: Attachment }> = ({
  attachment,
}) => {
  const isImage = attachment.mimetype.startsWith("image/");
  const isVideo = attachment.mimetype.startsWith("video/");
  const isAudio = attachment.mimetype.startsWith("audio/");
  const isPdf = attachment.mimetype === "application/pdf";

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (isImage) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <img
          src={attachment.url}
          alt={attachment.originalname}
          className="max-h-40 max-w-full object-cover rounded-md"
        />
      </a>
    );
  }

  if (isVideo) {
    return (
      <video
        src={attachment.url}
        controls
        className="max-h-40 max-w-full rounded-md"
      />
    );
  }

  if (isAudio) {
    return <audio src={attachment.url} controls className="w-full" />;
  }

  // For all other file types
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50"
    >
      <div className="mr-2 p-2 bg-gray-100 rounded">
        {isPdf ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M7 18H17V16H7V18Z" fill="currentColor" />
            <path d="M17 14H7V12H17V14Z" fill="currentColor" />
            <path d="M7 10H11V8H7V10Z" fill="currentColor" />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M6 2C4.34315 2 3 3.34315 3 5V19C3 20.6569 4.34315 22 6 22H18C19.6569 22 21 20.6569 21 19V9C21 8.44772 20.5523 8 20 8H17V5C17 3.34315 15.6569 2 14 2H6ZM6 4H14C14.5523 4 15 4.44772 15 5V8H6C5.44772 8 5 7.55228 5 7V5C5 4.44772 5.44772 4 6 4ZM6 20H18C18.5523 20 19 19.5523 19 19V10H6C5.44772 10 5 10.4477 5 11V19C5 19.5523 5.44772 20 6 20Z"
              fill="currentColor"
            />
          </svg>
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 2V8H20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 13H8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 17H8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 9H9H8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">
          {attachment.originalname}
        </p>
        <p className="text-xs text-gray-500">
          {formatFileSize(attachment.size)}
        </p>
      </div>
    </a>
  );
};

export default MessageItem;
