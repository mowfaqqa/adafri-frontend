/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import * as channelApi from '../../lib/api//messaging/channel';
import { Channel, ChannelCreateData, DirectMessageChannel } from '@/lib/types/collab-messaging/channel';
import socketClient from '@/lib/socket/messagingSocketClient/socketClient';

interface ChannelState {
  channels: Channel[];
  directMessages: DirectMessageChannel[];
  selectedChannelId: string | null;
  selectedDirectMessageId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchChannels: () => Promise<void>;
  fetchDirectMessages: () => Promise<void>;
  selectChannel: (channelId: string) => void;
  selectDirectMessage: (dmId: string) => void;
  createChannel: (channelData: ChannelCreateData) => Promise<Channel>;
  updateChannel: (channelId: string, channelData: any) => Promise<void>;
  addChannelMember: (channelId: string, userId: string) => Promise<void>;
  removeChannelMember: (channelId: string, userId: string) => Promise<void>;
  createDirectMessage: (userId: string) => Promise<DirectMessageChannel>;
  clearSelection: () => void;
  clearError: () => void;
}

const useChannelStore = create<ChannelState>((set, get) => ({
  channels: [],
  directMessages: [],
  selectedChannelId: null,
  selectedDirectMessageId: null,
  isLoading: false,
  error: null,
  
  fetchChannels: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const channels = await channelApi.getChannels();
      
      set({ channels, isLoading: false });
    } catch (error: any) {
      let errorMessage = 'Failed to fetch channels';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
    }
  },
  
  fetchDirectMessages: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const directMessages = await channelApi.getDirectMessages();
      
      set({ directMessages, isLoading: false });
    } catch (error: any) {
      let errorMessage = 'Failed to fetch direct messages';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
    }
  },
  
  selectChannel: (channelId: string) => {
    const { selectedChannelId, selectedDirectMessageId } = get();
    
    // Leave previous channel if different
    if (selectedChannelId && selectedChannelId !== channelId) {
      socketClient.leaveChannel(selectedChannelId);
    }
    
    // Leave previous DM if any
    if (selectedDirectMessageId) {
      socketClient.leaveDirectMessage(selectedDirectMessageId);
      set({ selectedDirectMessageId: null });
    }
    
    // Join new channel
    socketClient.joinChannel(channelId);
    set({ selectedChannelId: channelId });
  },
  
  selectDirectMessage: (dmId: string) => {
    const { selectedChannelId, selectedDirectMessageId } = get();
    
    // Leave previous DM if different
    if (selectedDirectMessageId && selectedDirectMessageId !== dmId) {
      socketClient.leaveDirectMessage(selectedDirectMessageId);
    }
    
    // Leave previous channel if any
    if (selectedChannelId) {
      socketClient.leaveChannel(selectedChannelId);
      set({ selectedChannelId: null });
    }
    
    // Join new DM
    socketClient.joinDirectMessage(dmId);
    set({ selectedDirectMessageId: dmId });
  },
  
  createChannel: async (channelData: ChannelCreateData) => {
    try {
      set({ isLoading: true, error: null });
      
      const newChannel = await channelApi.createChannel(channelData);
      
      set((state) => ({
        channels: [...state.channels, newChannel],
        isLoading: false,
      }));
      
      return newChannel;
    } catch (error: any) {
      let errorMessage = 'Failed to create channel';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  updateChannel: async (channelId: string, channelData: any) => {
    try {
      set({ isLoading: true, error: null });
      
      const updatedChannel = await channelApi.updateChannel(channelId, channelData);
      
      set((state) => ({
        channels: state.channels.map((channel) => 
          channel.id === channelId ? updatedChannel : channel
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      let errorMessage = 'Failed to update channel';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  addChannelMember: async (channelId: string, userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      await channelApi.addChannelMember(channelId, { userId });
      
      // Refresh channel to get updated members
      const updatedChannel = await channelApi.getChannelById(channelId);
      
      set((state) => ({
        channels: state.channels.map((channel) => 
          channel.id === channelId ? updatedChannel : channel
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      let errorMessage = 'Failed to add member to channel';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  removeChannelMember: async (channelId: string, userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      await channelApi.removeChannelMember(channelId, userId);
      
      // Refresh channel to get updated members
      const updatedChannel = await channelApi.getChannelById(channelId);
      
      set((state) => ({
        channels: state.channels.map((channel) => 
          channel.id === channelId ? updatedChannel : channel
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      let errorMessage = 'Failed to remove member from channel';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  createDirectMessage: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { directMessage } = await channelApi.createDirectMessage(userId);
      
      // Check if this DM already exists in our list
      const dmExists = get().directMessages.find((dm) => dm.id === directMessage.id);
      
      if (!dmExists) {
        set((state) => ({
          directMessages: [...state.directMessages, directMessage],
        }));
      }
      
      set({ isLoading: false });
      return directMessage;
    } catch (error: any) {
      let errorMessage = 'Failed to create direct message';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  clearSelection: () => {
    const { selectedChannelId, selectedDirectMessageId } = get();
    
    if (selectedChannelId) {
      socketClient.leaveChannel(selectedChannelId);
    }
    
    if (selectedDirectMessageId) {
      socketClient.leaveDirectMessage(selectedDirectMessageId);
    }
    
    set({ selectedChannelId: null, selectedDirectMessageId: null });
  },
  
  clearError: () => set({ error: null }),
}));

export default useChannelStore;