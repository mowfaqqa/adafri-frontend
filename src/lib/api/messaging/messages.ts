import axiosInstance from "./axios";
import {
  Message,
  MessageCreateData,
  MessageUpdateData,
  ReactionData,
  Thread,
} from "@/lib/types/collab-messaging/message";

/**
 * Send a message
 */
export const sendMessage = async (messageData: MessageCreateData): Promise<Message> => {
  try {
    // Handle file uploads if any
    if (messageData.attachments && messageData.attachments.length > 0) {
      const formData = new FormData();
      formData.append("content", messageData.content);
      formData.append("workspaceId", messageData.workspaceId);

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
  } catch (error) {
    console.error("Send message error:", error);
    throw error;
  }
};

/**
 * Get messages for a channel
 */
export const getChannelMessages = async (
  workspaceId: string,
  channelId: string,
  limit = 50,
  before?: string
): Promise<{ messages: Message[]; hasMore: boolean }> => {
  try {
    const params = { limit, before, workspaceId };
    const response = await axiosInstance.get<{
      messages: Message[];
      hasMore: boolean;
    }>(`/messages/channel/${channelId}`, { params });
    return response.data;
  } catch (error) {
    console.error("Get channel messages error:", error);
    throw error;
  }
};

/**
 * Get messages for a direct message conversation
 */
export const getDirectMessages = async (
  workspaceId: string,
  directMessageId: string,
  limit = 50,
  before?: string
): Promise<{ messages: Message[]; hasMore: boolean }> => {
  try {
    const params = { limit, before, workspaceId };
    const response = await axiosInstance.get<{
      messages: Message[];
      hasMore: boolean;
    }>(`/messages/direct/${directMessageId}`, { params });
    return response.data;
  } catch (error) {
    console.error("Get direct messages error:", error);
    throw error;
  }
};

/**
 * Get thread replies for a message
 */
export const getThreadMessages = async (
  workspaceId: string,
  messageId: string
): Promise<Thread> => {
  try {
    const params = { workspaceId };
    const response = await axiosInstance.get<Thread>(
      `/messages/${messageId}/thread`,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error("Get thread messages error:", error);
    throw error;
  }
};

/**
 * Update a message
 */
export const updateMessage = async (
  messageId: string,
  updateData: MessageUpdateData
): Promise<Message> => {
  try {
    const response = await axiosInstance.put<{ message: Message }>(
      `/messages/${messageId}`,
      updateData
    );
    return response.data.message;
  } catch (error) {
    console.error("Update message error:", error);
    throw error;
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (
  messageId: string
): Promise<{ message: string }> => {
  try {
    const response = await axiosInstance.delete<{ message: string }>(
      `/messages/${messageId}`
    );
    return response.data;
  } catch (error) {
    console.error("Delete message error:", error);
    throw error;
  }
};

/**
 * Add a reaction to a message
 */
export const addReaction = async (
  messageId: string,
  reactionData: ReactionData
): Promise<{ message: string; reaction: { emoji: string; count: number } }> => {
  try {
    const response = await axiosInstance.post<{
      message: string;
      reaction: { emoji: string; count: number };
    }>(`/messages/${messageId}/reactions`, reactionData);
    return response.data;
  } catch (error) {
    console.error("Add reaction error:", error);
    throw error;
  }
};

/**
 * Remove a reaction from a message
 */
export const removeReaction = async (
  messageId: string,
  emoji: string
): Promise<{ message: string }> => {
  try {
    const response = await axiosInstance.delete<{ message: string }>(
      `/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`
    );
    return response.data;
  } catch (error) {
    console.error("Remove reaction error:", error);
    throw error;
  }
};

/**
 * Upload a file
 */
export const uploadFile = async (
  workspaceId: string,
  file: File
): Promise<{
  file: { url: string; filename: string; originalname: string };
}> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("workspaceId", workspaceId);

    const response = await axiosInstance.post<{
      file: { url: string; filename: string; originalname: string };
    }>("/uploads", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Upload file error:", error);
    throw error;
  }
};

/**
 * Search messages
 */
export const searchMessages = async (
  workspaceId: string,
  query: string,
  options?: {
    channelId?: string;
    directMessageId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ messages: Message[]; total: number }> => {
  try {
    const params = { workspaceId, query, ...options };
    const response = await axiosInstance.get<{
      messages: Message[];
      total: number;
    }>("/messages/search", { params });
    return response.data;
  } catch (error) {
    console.error("Search messages error:", error);
    throw error;
  }
};