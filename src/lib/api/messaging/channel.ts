/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "./axios";
import {
  Channel,
  ChannelCreateData,
  ChannelMemberData,
  ChannelUpdateData,
  DirectMessageChannel,
} from "../../types/collab-messaging/channel";

/**
 * Get all channels
 */
export const getChannels = async (): Promise<Channel[]> => {
  const response = await axiosInstance.get<{ channels: Channel[] }>(
    "/channels"
  );
  return response.data.channels;
};

/**
 * Get a single channel by ID
 */
export const getChannelById = async (channelId: string): Promise<Channel> => {
  const response = await axiosInstance.get<{ channel: Channel }>(
    `/channels/${channelId}`
  );
  return response.data.channel;
};

/**
 * Create a new channel
 */
export const createChannel = async (
  channelData: ChannelCreateData
): Promise<Channel> => {
  const response = await axiosInstance.post<{ channel: Channel }>(
    "/channels",
    channelData
  );
  return response.data.channel;
};

/**
 * Update a channel
 */
export const updateChannel = async (
  channelId: string,
  channelData: ChannelUpdateData
): Promise<Channel> => {
  const response = await axiosInstance.put<{ channel: Channel }>(
    `/channels/${channelId}`,
    channelData
  );
  return response.data.channel;
};

/**
 * Add a member to a channel
 */
export const addChannelMember = async (
  channelId: string,
  memberData: ChannelMemberData
): Promise<{ member: any }> => {
  const response = await axiosInstance.post<{ member: any }>(
    `/channels/${channelId}/members`,
    memberData
  );
  return response.data;
};

/**
 * Remove a member from a channel
 */
export const removeChannelMember = async (
  channelId: string,
  userId: string
): Promise<{ message: string }> => {
  const response = await axiosInstance.delete<{ message: string }>(
    `/channels/${channelId}/members/${userId}`
  );
  return response.data;
};

/**
 * Add an admin to a channel
 */
export const addChannelAdmin = async (
  channelId: string,
  memberData: ChannelMemberData
): Promise<{ message: string }> => {
  const response = await axiosInstance.post<{ message: string }>(
    `/channels/${channelId}/admins`,
    memberData
  );
  return response.data;
};

/**
 * Get all direct messages for the current user
 */
export const getDirectMessages = async (): Promise<DirectMessageChannel[]> => {
  const response = await axiosInstance.get<{
    directMessages: DirectMessageChannel[];
  }>("/channels/direct");
  return response.data.directMessages;
};

/**
 * Create or get a direct message channel with another user
 */
export const createDirectMessage = async (
  userId: string
): Promise<{ directMessage: DirectMessageChannel }> => {
  const response = await axiosInstance.post<{
    directMessage: DirectMessageChannel;
  }>("/channels/direct", { userId });
  return response.data;
};
