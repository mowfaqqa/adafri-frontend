import { create } from 'zustand';
import * as channelApi from '@/lib/api/messaging/channel';
import { Channel, ChannelCreateData, DirectMessageChannel } from '@/lib/types/collab-messaging/channel';
import socketClient from '@/lib/socket/messagingSocketClient/socketClient';
import useWorkspaceStore from './workspaceStore';

interface ChannelState {
  // Channels organized by workspace
  channelsByWorkspace: Record<string, Channel[]>;
  // DMs organized by workspace
  directMessagesByWorkspace: Record<string, DirectMessageChannel[]>;
  
  selectedChannelId: string | null;
  selectedDirectMessageId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchChannels: (workspaceId: string) => Promise<void>;
  fetchDirectMessages: (workspaceId: string) => Promise<void>;
  selectChannel: (workspaceId: string, channelId: string) => void;
  selectDirectMessage: (workspaceId: string, dmId: string) => void;
  createChannel: (channelData: ChannelCreateData) => Promise<Channel>;
  updateChannel: (channelId: string, channelData: any) => Promise<void>;
  addChannelMember: (channelId: string, userId: string) => Promise<void>;
  removeChannelMember: (channelId: string, userId: string) => Promise<void>;
  createDirectMessage: (workspaceId: string, userId: string) => Promise<DirectMessageChannel>;
  clearSelection: () => void;
  clearError: () => void;
}

const useChannelStore = create<ChannelState>((set, get) => ({
  channelsByWorkspace: {},
  directMessagesByWorkspace: {},
  selectedChannelId: null,
  selectedDirectMessageId: null,
  isLoading: false,
  error: null,
  
  fetchChannels: async (workspaceId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const channels = await channelApi.getChannels(workspaceId);
      
      set((state) => ({
        channelsByWorkspace: {
          ...state.channelsByWorkspace,
          [workspaceId]: channels,
        },
        isLoading: false,
      }));
    } catch (error: any) {
      let errorMessage = 'Failed to fetch channels';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
    }
  },
  
  fetchDirectMessages: async (workspaceId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const directMessages = await channelApi.getDirectMessages(workspaceId);
      
      set((state) => ({
        directMessagesByWorkspace: {
          ...state.directMessagesByWorkspace,
          [workspaceId]: directMessages,
        },
        isLoading: false,
      }));
    } catch (error: any) {
      let errorMessage = 'Failed to fetch direct messages';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
    }
  },
  
  selectChannel: (workspaceId: string, channelId: string) => {
    const { selectedChannelId, selectedDirectMessageId } = get();
    
    // Check if workspace is selected
    const currentWorkspace = useWorkspaceStore.getState().selectedWorkspaceId;
    if (currentWorkspace !== workspaceId) {
      useWorkspaceStore.getState().selectWorkspace(workspaceId);
    }
    
    // Leave previous channel if different
    if (selectedChannelId && selectedChannelId !== channelId) {
      socketClient.leaveChannel(currentWorkspace || workspaceId, selectedChannelId);
    }
    
    // Leave previous DM if any
    if (selectedDirectMessageId) {
      socketClient.leaveDirectMessage(currentWorkspace || workspaceId, selectedDirectMessageId);
      set({ selectedDirectMessageId: null });
    }
    
    // Join new channel
    socketClient.joinChannel(workspaceId, channelId);
    set({ selectedChannelId: channelId });
  },
  
  selectDirectMessage: (workspaceId: string, dmId: string) => {
    const { selectedChannelId, selectedDirectMessageId } = get();
    
    // Check if workspace is selected
    const currentWorkspace = useWorkspaceStore.getState().selectedWorkspaceId;
    if (currentWorkspace !== workspaceId) {
      useWorkspaceStore.getState().selectWorkspace(workspaceId);
    }
    
    // Leave previous DM if different
    if (selectedDirectMessageId && selectedDirectMessageId !== dmId) {
      socketClient.leaveDirectMessage(currentWorkspace || workspaceId, selectedDirectMessageId);
    }
    
    // Leave previous channel if any
    if (selectedChannelId) {
      socketClient.leaveChannel(currentWorkspace || workspaceId, selectedChannelId);
      set({ selectedChannelId: null });
    }
    
    // Join new DM
    socketClient.joinDirectMessage(workspaceId, dmId);
    set({ selectedDirectMessageId: dmId });
  },
  
  createChannel: async (channelData: ChannelCreateData) => {
    try {
      set({ isLoading: true, error: null });
      
      const newChannel = await channelApi.createChannel(channelData);
      
      set((state) => {
        const workspaceChannels = state.channelsByWorkspace[channelData.workspaceId] || [];
        
        return {
          channelsByWorkspace: {
            ...state.channelsByWorkspace,
            [channelData.workspaceId]: [...workspaceChannels, newChannel],
          },
          isLoading: false,
        };
      });
      
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
      
      set((state) => {
        // Find the workspace this channel belongs to
        const workspaceId = updatedChannel.workspaceId;
        const workspaceChannels = state.channelsByWorkspace[workspaceId] || [];
        
        return {
          channelsByWorkspace: {
            ...state.channelsByWorkspace,
            [workspaceId]: workspaceChannels.map((channel) => 
              channel.id === channelId ? updatedChannel : channel
            ),
          },
          isLoading: false,
        };
      });
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
      
      set((state) => {
        // Find the workspace this channel belongs to
        const workspaceId = updatedChannel.workspaceId;
        const workspaceChannels = state.channelsByWorkspace[workspaceId] || [];
        
        return {
          channelsByWorkspace: {
            ...state.channelsByWorkspace,
            [workspaceId]: workspaceChannels.map((channel) => 
              channel.id === channelId ? updatedChannel : channel
            ),
          },
          isLoading: false,
        };
      });
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
      
      set((state) => {
        // Find the workspace this channel belongs to
        const workspaceId = updatedChannel.workspaceId;
        const workspaceChannels = state.channelsByWorkspace[workspaceId] || [];
        
        return {
          channelsByWorkspace: {
            ...state.channelsByWorkspace,
            [workspaceId]: workspaceChannels.map((channel) => 
              channel.id === channelId ? updatedChannel : channel
            ),
          },
          isLoading: false,
        };
      });
    } catch (error: any) {
      let errorMessage = 'Failed to remove member from channel';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  createDirectMessage: async (workspaceId: string, userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { directMessage } = await channelApi.createDirectMessage(workspaceId, userId);
      
      set((state) => {
        const workspaceDMs = state.directMessagesByWorkspace[workspaceId] || [];
        
        // Check if this DM already exists in our list
        const dmExists = workspaceDMs.find((dm) => dm.id === directMessage.id);
        
        if (!dmExists) {
          return {
            directMessagesByWorkspace: {
              ...state.directMessagesByWorkspace,
              [workspaceId]: [...workspaceDMs, directMessage],
            },
            isLoading: false,
          };
        }
        
        return { isLoading: false };
      });
      
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
    const workspaceId = useWorkspaceStore.getState().selectedWorkspaceId;
    
    if (workspaceId) {
      if (selectedChannelId) {
        socketClient.leaveChannel(workspaceId, selectedChannelId);
      }
      
      if (selectedDirectMessageId) {
        socketClient.leaveDirectMessage(workspaceId, selectedDirectMessageId);
      }
    }
    
    set({ selectedChannelId: null, selectedDirectMessageId: null });
  },
  
  clearError: () => set({ error: null }),
}));

export default useChannelStore;
