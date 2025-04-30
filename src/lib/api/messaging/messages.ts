import axiosInstance from "./axios";
import {
  Message,
  MessageCreateData,
  MessageUpdateData,
  ReactionData,
  Thread,
} from "../../types/collab-messaging/message";

/**
 * Send a message
 */
export const sendMessage = async (
  messageData: MessageCreateData
): Promise<Message> => {
  // Handle file uploads if any
  if (messageData.attachments && messageData.attachments.length > 0) {
    const formData = new FormData();
    formData.append("content", messageData.content);

    if (messageData.channelId) {
      formData.append("channelId", messageData.channelId);
    }

    if (messageData.directMessageId) {
      formData.append("directMessageId", messageData.directMessageId);
    }

    if (messageData.parentId) {
      formData.append("parentId", messageData.parentId);
    }

    messageData.attachments.forEach((file) => {
      formData.append("attachments", file);
    });

    const response = await axiosInstance.post<{ message: Message }>(
      "/messages",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data.message;
  }

  // Regular message without attachments
  const response = await axiosInstance.post<{ message: Message }>(
    "/messages",
    messageData
  );
  return response.data.message;
};

/**
 * Get messages for a channel
 */
export const getChannelMessages = async (
  channelId: string,
  limit = 50,
  before?: string
): Promise<{ messages: Message[]; hasMore: boolean }> => {
  const params = { limit, before };
  const response = await axiosInstance.get<{
    messages: Message[];
    hasMore: boolean;
  }>(`/messages/channel/${channelId}`, { params });
  return response.data;
};

/**
 * Get messages for a direct message conversation
 */
export const getDirectMessages = async (
  directMessageId: string,
  limit = 50,
  before?: string
): Promise<{ messages: Message[]; hasMore: boolean }> => {
  const params = { limit, before };
  const response = await axiosInstance.get<{
    messages: Message[];
    hasMore: boolean;
  }>(`/messages/direct/${directMessageId}`, { params });
  return response.data;
};

/**
 * Get thread replies for a message
 */
export const getThreadMessages = async (messageId: string): Promise<Thread> => {
  const response = await axiosInstance.get<Thread>(
    `/messages/${messageId}/thread`
  );
  return response.data;
};

/**
 * Update a message
 */
export const updateMessage = async (
  messageId: string,
  updateData: MessageUpdateData
): Promise<Message> => {
  const response = await axiosInstance.put<{ message: Message }>(
    `/messages/${messageId}`,
    updateData
  );
  return response.data.message;
};

/**
 * Delete a message
 */
export const deleteMessage = async (
  messageId: string
): Promise<{ message: string }> => {
  const response = await axiosInstance.delete<{ message: string }>(
    `/messages/${messageId}`
  );
  return response.data;
};

/**
 * Add a reaction to a message
 */
export const addReaction = async (
  messageId: string,
  reactionData: ReactionData
): Promise<{ message: string; reaction: { emoji: string; count: number } }> => {
  const response = await axiosInstance.post<{
    message: string;
    reaction: { emoji: string; count: number };
  }>(`/messages/${messageId}/reactions`, reactionData);
  return response.data;
};

/**
 * Remove a reaction from a message
 */
export const removeReaction = async (
  messageId: string,
  emoji: string
): Promise<{ message: string }> => {
  const response = await axiosInstance.delete<{ message: string }>(
    `/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`
  );
  return response.data;
};

/**
 * Upload a file
 */
export const uploadFile = async (
  file: File
): Promise<{
  file: { url: string; filename: string; originalname: string };
}> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post<{
    file: { url: string; filename: string; originalname: string };
  }>("/uploads", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
