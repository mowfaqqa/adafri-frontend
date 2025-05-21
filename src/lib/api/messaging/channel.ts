import axiosInstance from "./axios";
import {
  Channel,
  ChannelCreateData,
  ChannelMemberData,
  ChannelUpdateData,
  DirectMessageChannel,
} from "@/lib/types/collab-messaging/channel";

/**
 * Get all channels for a workspace
 */
export const getChannels = async (workspaceId: string): Promise<Channel[]> => {
  try {
    const response = await axiosInstance.get<{ channels: Channel[] }>(
      "/channels",
      { params: { workspaceId } }
    );
    return response.data.channels;
  } catch (error) {
    console.error("Get channels error:", error);
    throw error;
  }
};

/**
 * Get a single channel by ID
 */
export const getChannelById = async (channelId: string): Promise<Channel> => {
  try {
    const response = await axiosInstance.get<{ channel: Channel }>(
      `/channels/${channelId}`
    );
    return response.data.channel;
  } catch (error) {
    console.error("Get channel error:", error);
    throw error;
  }
};

/**
 * Create a new channel
 */
export const createChannel = async (channelData: ChannelCreateData): Promise<Channel> => {
  try {
    const response = await axiosInstance.post<{ channel: Channel }>(
      "/channels",
      channelData
    );
    return response.data.channel;
  } catch (error) {
    console.error("Create channel error:", error);
    throw error;
  }
};

/**
 * Update a channel
 */
export const updateChannel = async (
  channelId: string,
  channelData: ChannelUpdateData
): Promise<Channel> => {
  try {
    const response = await axiosInstance.put<{ channel: Channel }>(
      `/channels/${channelId}`,
      channelData
    );
    return response.data.channel;
  } catch (error) {
    console.error("Update channel error:", error);
    throw error;
  }
};

/**
 * Archive a channel
 */
export const archiveChannel = async (channelId: string): Promise<Channel> => {
  try {
    const response = await axiosInstance.put<{ channel: Channel }>(
      `/channels/${channelId}/archive`
    );
    return response.data.channel;
  } catch (error) {
    console.error("Archive channel error:", error);
    throw error;
  }
};

/**
 * Unarchive a channel
 */
export const unarchiveChannel = async (channelId: string): Promise<Channel> => {
  try {
    const response = await axiosInstance.put<{ channel: Channel }>(
      `/channels/${channelId}/unarchive`
    );
    return response.data.channel;
  } catch (error) {
    console.error("Unarchive channel error:", error);
    throw error;
  }
};

/**
 * Add a member to a channel
 */
export const addChannelMember = async (
  channelId: string,
  memberData: ChannelMemberData
): Promise<{ member: any }> => {
  try {
    const response = await axiosInstance.post<{ member: any }>(
      `/channels/${channelId}/members`,
      memberData
    );
    return response.data;
  } catch (error) {
    console.error("Add channel member error:", error);
    throw error;
  }
};

/**
 * Remove a member from a channel
 */
export const removeChannelMember = async (
  channelId: string,
  userId: string
): Promise<{ message: string }> => {
  try {
    const response = await axiosInstance.delete<{ message: string }>(
      `/channels/${channelId}/members/${userId}`
    );
    return response.data;
  } catch (error) {
    console.error("Remove channel member error:", error);
    throw error;
  }
};

/**
 * Add an admin to a channel
 */
export const addChannelAdmin = async (
  channelId: string,
  memberData: ChannelMemberData
): Promise<{ message: string }> => {
  try {
    const response = await axiosInstance.post<{ message: string }>(
      `/channels/${channelId}/admins`,
      memberData
    );
    return response.data;
  } catch (error) {
    console.error("Add channel admin error:", error);
    throw error;
  }
};

/**
 * Get all direct messages for the current user in a workspace
 */
export const getDirectMessages = async (workspaceId: string): Promise<DirectMessageChannel[]> => {
  try {
    const response = await axiosInstance.get<{
      directMessages: DirectMessageChannel[];
    }>(
      "/channels/direct",
      { params: { workspaceId } }
    );
    return response.data.directMessages;
  } catch (error) {
    console.error("Get direct messages error:", error);
    throw error;
  }
};

/**
 * Create or get a direct message channel with another user
 */
export const createDirectMessage = async (
  workspaceId: string,
  userId: string
): Promise<{ directMessage: DirectMessageChannel }> => {
  try {
    const response = await axiosInstance.post<{
      directMessage: DirectMessageChannel;
    }>(
      "/channels/direct",
      { workspaceId, userId }
    );
    return response.data;
  } catch (error) {
    console.error("Create direct message error:", error);
    throw error;
  }
};

/**
 * Get channel members
 */
export const getChannelMembers = async (channelId: string) => {
  try {
    const response = await axiosInstance.get<{ members: any[] }>(
      `/channels/${channelId}/members`
    );
    return response.data.members;
  } catch (error) {
    console.error("Get channel members error:", error);
    throw error;
  }
};