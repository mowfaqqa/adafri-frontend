import { create } from "zustand";
import * as messageApi from "@/lib/api/messaging/messages";
import {
  Message,
  Thread,
  TypingIndicator,
} from "@/lib/types/collab-messaging/message";
import socketClient from "@/lib/socket/messagingSocketClient/socketClient";
import useChannelStore from "./channelStore";
import useAuthStore from "./authStore";
import useWorkspaceStore from "./workspaceStore";

interface MessageState {
  // Messages organized by workspace -> channel
  channelMessages: Record<string, Record<string, Message[]>>;
  // DMs organized by workspace -> DM
  directMessages: Record<string, Record<string, Message[]>>;
  // Threads organized by workspace -> parentMessageId
  threads: Record<string, Record<string, Thread>>;
  
  activeThreadId: string | null;
  hasMoreMessages: Record<string, boolean>;
  oldestMessageTimestamp: Record<string, string>;
  isLoading: boolean;
  error: string | null;
  typingUsers: TypingIndicator[];
  searchResults: {
    messages: Message[];
    total: number;
    query: string;
  } | null;

  // Actions
  fetchChannelMessages: (workspaceId: string, channelId: string, limit?: number) => Promise<void>;
  fetchDirectMessages: (workspaceId: string, dmId: string, limit?: number) => Promise<void>;
  fetchOlderMessages: (
    type: "channel" | "dm",
    workspaceId: string,
    id: string,
    limit?: number
  ) => Promise<void>;
  fetchThreadMessages: (workspaceId: string, messageId: string) => Promise<void>;
  sendMessage: (content: string, workspaceId: string, attachments?: File[]) => Promise<void>;
  sendThreadMessage: (
    content: string,
    workspaceId: string,
    parentId: string,
    attachments?: File[]
  ) => Promise<void>;
  updateMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  setActiveThread: (workspaceId: string, messageId: string | null) => void;
  startTyping: (workspaceId: string) => void;
  stopTyping: (workspaceId: string) => void;
  addTypingUser: (user: TypingIndicator) => void;
  removeTypingUser: (userId: string) => void;
  searchMessages: (workspaceId: string, query: string, options?: any) => Promise<void>;
  setupSocketListeners: () => void;
  cleanupSocketListeners: () => void;
  clearMessages: () => void;
  clearError: () => void;
}

const useMessageStore = create<MessageState>((set, get) => ({
  channelMessages: {},
  directMessages: {},
  threads: {},
  activeThreadId: null,
  hasMoreMessages: {},
  oldestMessageTimestamp: {},
  isLoading: false,
  error: null,
  typingUsers: [],
  searchResults: null,

  fetchChannelMessages: async (workspaceId: string, channelId: string, limit = 50) => {
    try {
      set({ isLoading: true, error: null });

      const { messages, hasMore } = await messageApi.getChannelMessages(workspaceId, channelId, limit);

      // Get the oldest message timestamp for pagination
      let oldestTimestamp = "";
      if (messages.length > 0) {
        const oldestMessage = messages[messages.length - 1];
        oldestTimestamp = new Date(oldestMessage.createdAt).toISOString();
      }

      set((state) => {
        // Initialize nested structure if it doesn't exist
        const workspaceMessages = state.channelMessages[workspaceId] || {};
        
        return {
          channelMessages: {
            ...state.channelMessages,
            [workspaceId]: {
              ...workspaceMessages,
              [channelId]: messages,
            },
          },
          hasMoreMessages: {
            ...state.hasMoreMessages,
            [`${workspaceId}:channel:${channelId}`]: hasMore,
          },
          oldestMessageTimestamp: {
            ...state.oldestMessageTimestamp,
            [`${workspaceId}:channel:${channelId}`]: oldestTimestamp,
          },
          isLoading: false,
        };
      });
    } catch (error: any) {
      let errorMessage = "Failed to fetch channel messages";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchDirectMessages: async (workspaceId: string, dmId: string, limit = 50) => {
    try {
      set({ isLoading: true, error: null });

      const { messages, hasMore } = await messageApi.getDirectMessages(workspaceId, dmId, limit);

      // Get the oldest message timestamp for pagination
      let oldestTimestamp = "";
      if (messages.length > 0) {
        const oldestMessage = messages[messages.length - 1];
        oldestTimestamp = new Date(oldestMessage.createdAt).toISOString();
      }

      set((state) => {
        // Initialize nested structure if it doesn't exist
        const workspaceDMs = state.directMessages[workspaceId] || {};
        
        return {
          directMessages: {
            ...state.directMessages,
            [workspaceId]: {
              ...workspaceDMs,
              [dmId]: messages,
            },
          },
          hasMoreMessages: {
            ...state.hasMoreMessages,
            [`${workspaceId}:dm:${dmId}`]: hasMore,
          },
          oldestMessageTimestamp: {
            ...state.oldestMessageTimestamp,
            [`${workspaceId}:dm:${dmId}`]: oldestTimestamp,
          },
          isLoading: false,
        };
      });
    } catch (error: any) {
      let errorMessage = "Failed to fetch direct messages";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchOlderMessages: async (
    type: "channel" | "dm",
    workspaceId: string,
    id: string,
    limit = 50
  ) => {
    try {
      set({ isLoading: true, error: null });

      const cacheKey = `${workspaceId}:${type}:${id}`;
      const oldestTimestamp = get().oldestMessageTimestamp[cacheKey];

      if (!oldestTimestamp) {
        set({ isLoading: false });
        return;
      }

      let result;
      if (type === "channel") {
        result = await messageApi.getChannelMessages(
          workspaceId,
          id,
          limit,
          oldestTimestamp
        );
      } else {
        result = await messageApi.getDirectMessages(
          workspaceId,
          id,
          limit,
          oldestTimestamp
        );
      }

      const { messages, hasMore } = result;

      if (messages.length === 0) {
        set({ isLoading: false });
        return;
      }

      // Get the new oldest message timestamp
      const newOldestMessage = messages[messages.length - 1];
      const newOldestTimestamp = new Date(
        newOldestMessage.createdAt
      ).toISOString();

      // Update the messages list (append to the end since these are older messages)
      set((state) => {
        if (type === "channel") {
          const workspaceChannels = state.channelMessages[workspaceId] || {};
          const currentMessages = workspaceChannels[id] || [];
          const updatedMessages = [...currentMessages, ...messages];

          return {
            channelMessages: {
              ...state.channelMessages,
              [workspaceId]: {
                ...workspaceChannels,
                [id]: updatedMessages,
              },
            },
            hasMoreMessages: {
              ...state.hasMoreMessages,
              [cacheKey]: hasMore,
            },
            oldestMessageTimestamp: {
              ...state.oldestMessageTimestamp,
              [cacheKey]: newOldestTimestamp,
            },
            isLoading: false,
          };
        } else {
          const workspaceDMs = state.directMessages[workspaceId] || {};
          const currentMessages = workspaceDMs[id] || [];
          const updatedMessages = [...currentMessages, ...messages];

          return {
            directMessages: {
              ...state.directMessages,
              [workspaceId]: {
                ...workspaceDMs,
                [id]: updatedMessages,
              },
            },
            hasMoreMessages: {
              ...state.hasMoreMessages,
              [cacheKey]: hasMore,
            },
            oldestMessageTimestamp: {
              ...state.oldestMessageTimestamp,
              [cacheKey]: newOldestTimestamp,
            },
            isLoading: false,
          };
        }
      });
    } catch (error: any) {
      let errorMessage = "Failed to fetch older messages";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchThreadMessages: async (workspaceId: string, messageId: string) => {
    try {
      set({ isLoading: true, error: null });

      const thread = await messageApi.getThreadMessages(workspaceId, messageId);

      set((state) => {
        const workspaceThreads = state.threads[workspaceId] || {};
        
        return {
          threads: {
            ...state.threads,
            [workspaceId]: {
              ...workspaceThreads,
              [messageId]: thread,
            },
          },
          isLoading: false,
        };
      });
    } catch (error: any) {
      let errorMessage = "Failed to fetch thread messages";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
    }
  },

  sendMessage: async (content: string, workspaceId: string, attachments?: File[]) => {
    try {
      const channelStore = useChannelStore.getState();
      const { selectedChannelId, selectedDirectMessageId } = channelStore;

      if (!workspaceId || (!selectedChannelId && !selectedDirectMessageId)) {
        throw new Error("No workspace, channel or direct message selected");
      }

      const messageData = {
        content,
        workspaceId,
        channelId: selectedChannelId || undefined,
        directMessageId: selectedDirectMessageId || undefined,
        attachments,
      };

      const newMessage = await messageApi.sendMessage(messageData);

      // Update the appropriate message list
      set((state) => {
        if (selectedChannelId) {
          const workspaceChannels = state.channelMessages[workspaceId] || {};
          const currentMessages = workspaceChannels[selectedChannelId] || [];
          
          return {
            channelMessages: {
              ...state.channelMessages,
              [workspaceId]: {
                ...workspaceChannels,
                [selectedChannelId]: [...currentMessages, newMessage],
              },
            },
          };
        } else if (selectedDirectMessageId) {
          const workspaceDMs = state.directMessages[workspaceId] || {};
          const currentMessages = workspaceDMs[selectedDirectMessageId] || [];
          
          return {
            directMessages: {
              ...state.directMessages,
              [workspaceId]: {
                ...workspaceDMs,
                [selectedDirectMessageId]: [...currentMessages, newMessage],
              },
            },
          };
        }

        return {};
      });
    } catch (error: any) {
      let errorMessage = "Failed to send message";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  sendThreadMessage: async (
    content: string,
    workspaceId: string,
    parentId: string,
    attachments?: File[]
  ) => {
    try {
      const channelStore = useChannelStore.getState();
      const { selectedChannelId, selectedDirectMessageId } = channelStore;

      if (!workspaceId || (!selectedChannelId && !selectedDirectMessageId)) {
        throw new Error("No workspace, channel or direct message selected");
      }

      const messageData = {
        content,
        workspaceId,
        channelId: selectedChannelId || undefined,
        directMessageId: selectedDirectMessageId || undefined,
        parentId,
        attachments,
      };

      const newMessage = await messageApi.sendMessage(messageData);

      // Update the thread if it's active
      if (get().activeThreadId === parentId) {
        set((state) => {
          const workspaceThreads = state.threads[workspaceId] || {};
          const thread = workspaceThreads[parentId];

          if (thread) {
            return {
              threads: {
                ...state.threads,
                [workspaceId]: {
                  ...workspaceThreads,
                  [parentId]: {
                    ...thread,
                    messages: [...thread.messages, newMessage],
                  },
                },
              },
            };
          }

          return {};
        });
      }
    } catch (error: any) {
      let errorMessage = "Failed to send thread message";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  updateMessage: async (messageId: string, content: string) => {
    try {
      set({ isLoading: true, error: null });

      const updatedMessage = await messageApi.updateMessage(messageId, {
        content,
      });

      // Update message in all relevant stores (channels, DMs, and threads)
      set((state) => {
        const channelStore = useChannelStore.getState();
        const workspaceStore = useWorkspaceStore.getState();
        const { selectedChannelId, selectedDirectMessageId } = channelStore;
        const { selectedWorkspaceId } = workspaceStore;

        // Skip if no workspace selected
        if (!selectedWorkspaceId) return { isLoading: false };

        // Update state object to return
        const newState: any = { isLoading: false };

        // Update in channel messages if applicable
        if (selectedChannelId) {
          const workspaceChannels = state.channelMessages[selectedWorkspaceId] || {};
          const channelMessages = workspaceChannels[selectedChannelId] || [];
          
          if (channelMessages.length > 0) {
            const updatedChannelMessages = channelMessages.map((message) =>
              message.id === messageId
                ? { ...message, ...updatedMessage }
                : message
            );

            newState.channelMessages = {
              ...state.channelMessages,
              [selectedWorkspaceId]: {
                ...workspaceChannels,
                [selectedChannelId]: updatedChannelMessages,
              },
            };
          }
        }

        // Update in direct messages if applicable
        if (selectedDirectMessageId) {
          const workspaceDMs = state.directMessages[selectedWorkspaceId] || {};
          const dmMessages = workspaceDMs[selectedDirectMessageId] || [];
          
          if (dmMessages.length > 0) {
            const updatedDMMessages = dmMessages.map((message) =>
              message.id === messageId
                ? { ...message, ...updatedMessage }
                : message
            );

            newState.directMessages = {
              ...state.directMessages,
              [selectedWorkspaceId]: {
                ...workspaceDMs,
                [selectedDirectMessageId]: updatedDMMessages,
              },
            };
          }
        }

        // Update in thread if applicable
        if (state.activeThreadId) {
          const workspaceThreads = state.threads[selectedWorkspaceId] || {};
          const thread = workspaceThreads[state.activeThreadId];

          if (thread) {
            // Check if it's the parent message
            if (thread.parentMessage.id === messageId) {
              newState.threads = {
                ...state.threads,
                [selectedWorkspaceId]: {
                  ...workspaceThreads,
                  [state.activeThreadId]: {
                    ...thread,
                    parentMessage: { ...thread.parentMessage, ...updatedMessage },
                  },
                },
              };
            } else {
              // Check in thread messages
              const updatedThreadMessages = thread.messages.map((message) =>
                message.id === messageId
                  ? { ...message, ...updatedMessage }
                  : message
              );

              newState.threads = {
                ...state.threads,
                [selectedWorkspaceId]: {
                  ...workspaceThreads,
                  [state.activeThreadId]: {
                    ...thread,
                    messages: updatedThreadMessages,
                  },
                },
              };
            }
          }
        }

        return newState;
      });
    } catch (error: any) {
      let errorMessage = "Failed to update message";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  deleteMessage: async (messageId: string) => {
    try {
      set({ isLoading: true, error: null });

      await messageApi.deleteMessage(messageId);

      // Update state to mark message as deleted
      set((state) => {
        const channelStore = useChannelStore.getState();
        const workspaceStore = useWorkspaceStore.getState();
        const { selectedChannelId, selectedDirectMessageId } = channelStore;
        const { selectedWorkspaceId } = workspaceStore;

        // Skip if no workspace selected
        if (!selectedWorkspaceId) return { isLoading: false };

        // Update state object to return
        const newState: any = { isLoading: false };

        // Update in channel messages if applicable
        if (selectedChannelId) {
          const workspaceChannels = state.channelMessages[selectedWorkspaceId] || {};
          const channelMessages = workspaceChannels[selectedChannelId] || [];
          
          if (channelMessages.length > 0) {
            const updatedChannelMessages = channelMessages.map((message) =>
              message.id === messageId
                ? {
                    ...message,
                    isDeleted: true,
                    content: "[This message has been deleted]",
                  }
                : message
            );

            newState.channelMessages = {
              ...state.channelMessages,
              [selectedWorkspaceId]: {
                ...workspaceChannels,
                [selectedChannelId]: updatedChannelMessages,
              },
            };
          }
        }

        // Update in direct messages if applicable
        if (selectedDirectMessageId) {
          const workspaceDMs = state.directMessages[selectedWorkspaceId] || {};
          const dmMessages = workspaceDMs[selectedDirectMessageId] || [];
          
          if (dmMessages.length > 0) {
            const updatedDMMessages = dmMessages.map((message) =>
              message.id === messageId
                ? {
                    ...message,
                    isDeleted: true,
                    content: "[This message has been deleted]",
                  }
                : message
            );

            newState.directMessages = {
              ...state.directMessages,
              [selectedWorkspaceId]: {
                ...workspaceDMs,
                [selectedDirectMessageId]: updatedDMMessages,
              },
            };
          }
        }

        // Update in thread if applicable
        if (state.activeThreadId) {
          const workspaceThreads = state.threads[selectedWorkspaceId] || {};
          const thread = workspaceThreads[state.activeThreadId];

          if (thread) {
            // Check if it's the parent message
            if (thread.parentMessage.id === messageId) {
              newState.threads = {
                ...state.threads,
                [selectedWorkspaceId]: {
                  ...workspaceThreads,
                  [state.activeThreadId]: {
                    ...thread,
                    parentMessage: {
                      ...thread.parentMessage,
                      isDeleted: true,
                      content: "[This message has been deleted]",
                    },
                  },
                },
              };
            } else {
              // Check in thread messages
              const updatedThreadMessages = thread.messages.map((message) =>
                message.id === messageId
                  ? {
                      ...message,
                      isDeleted: true,
                      content: "[This message has been deleted]",
                    }
                  : message
              );

              newState.threads = {
                ...state.threads,
                [selectedWorkspaceId]: {
                  ...workspaceThreads,
                  [state.activeThreadId]: {
                    ...thread,
                    messages: updatedThreadMessages,
                  },
                },
              };
            }
          }
        }

        return newState;
      });
    } catch (error: any) {
      let errorMessage = "Failed to delete message";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  addReaction: async (messageId: string, emoji: string) => {
    try {
      await messageApi.addReaction(messageId, { emoji });
      // The socket will handle updating the UI with the new reaction
    } catch (error: any) {
      let errorMessage = "Failed to add reaction";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  removeReaction: async (messageId: string, emoji: string) => {
    try {
      await messageApi.removeReaction(messageId, emoji);
      // The socket will handle updating the UI with the removed reaction
    } catch (error: any) {
      let errorMessage = "Failed to remove reaction";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  setActiveThread: (workspaceId: string, messageId: string | null) => {
    const { activeThreadId } = get();

    // Leave previous thread if any
    if (activeThreadId) {
      socketClient.leaveThread(workspaceId, activeThreadId);
    }

    // Join new thread if any
    if (messageId) {
      socketClient.joinThread(workspaceId, messageId);
    }

    set({ activeThreadId: messageId });
  },

  startTyping: (workspaceId: string) => {
    const channelStore = useChannelStore.getState();
    const { selectedChannelId, selectedDirectMessageId } = channelStore;

    if (selectedChannelId) {
      socketClient.sendTypingStart({ 
        channelId: selectedChannelId,
        workspaceId 
      });
    } else if (selectedDirectMessageId) {
      socketClient.sendTypingStart({ 
        dmId: selectedDirectMessageId,
        workspaceId 
      });
    }
  },

  stopTyping: (workspaceId: string) => {
    const channelStore = useChannelStore.getState();
    const { selectedChannelId, selectedDirectMessageId } = channelStore;

    if (selectedChannelId) {
      socketClient.sendTypingStop({ 
        channelId: selectedChannelId,
        workspaceId 
      });
    } else if (selectedDirectMessageId) {
      socketClient.sendTypingStop({ 
        dmId: selectedDirectMessageId,
        workspaceId 
      });
    }
  },

  addTypingUser: (user: TypingIndicator) => {
    set((state) => {
      // Check if this user is already in the typing list
      const userExists = state.typingUsers.some(
        (u) =>
          u.userId === user.userId &&
          u.workspaceId === user.workspaceId &&
          ((u.channelId && u.channelId === user.channelId) ||
            (u.dmId && u.dmId === user.dmId))
      );

      if (userExists) {
        return {};
      }

      return {
        typingUsers: [...state.typingUsers, user],
      };
    });
  },

  removeTypingUser: (userId: string) => {
    set((state) => ({
      typingUsers: state.typingUsers.filter((user) => user.userId !== userId),
    }));
  },

  searchMessages: async (workspaceId: string, query: string, options = {}) => {
    try {
      set({ isLoading: true, error: null });

      const result = await messageApi.searchMessages(workspaceId, query, options);

      set({
        searchResults: {
          messages: result.messages,
          total: result.total,
          query,
        },
        isLoading: false,
      });
    } catch (error: any) {
      let errorMessage = "Failed to search messages";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
    }
  },

  setupSocketListeners: () => {
    // Listen for new messages
    socketClient.on("new_message", (message: Message) => {
      // Don't add own messages as they are already added by sendMessage
      const authStore = useAuthStore.getState();
      if (message.sender.id === authStore.user?.id) {
        return;
      }

      set((state) => {
        const newState: any = {};
        const workspaceId = message.workspaceId;

        // Add to channel messages if applicable
        if (message.channelId) {
          const workspaceChannels = state.channelMessages[workspaceId] || {};
          const currentMessages = workspaceChannels[message.channelId] || [];
          
          newState.channelMessages = {
            ...state.channelMessages,
            [workspaceId]: {
              ...workspaceChannels,
              [message.channelId]: [...currentMessages, message],
            },
          };
        }

        // Add to direct messages if applicable
        if (message.directMessageId) {
          const workspaceDMs = state.directMessages[workspaceId] || {};
          const currentMessages = workspaceDMs[message.directMessageId] || [];
          
          newState.directMessages = {
            ...state.directMessages,
            [workspaceId]: {
              ...workspaceDMs,
              [message.directMessageId]: [...currentMessages, message],
            },
          };
        }

        // Remove typing indicator for this user
        newState.typingUsers = state.typingUsers.filter(
          (user) => user.userId !== message.sender.id
        );

        return newState;
      });
    });

    // Listen for message updates
    socketClient.on("message_update", (message: Message) => {
      set((state) => {
        const newState: any = {};
        const workspaceId = message.workspaceId;

        // Update in channel messages if applicable
        if (message.channelId) {
          const workspaceChannels = state.channelMessages[workspaceId] || {};
          const channelMessages = workspaceChannels[message.channelId] || [];
          
          if (channelMessages.length > 0) {
            newState.channelMessages = {
              ...state.channelMessages,
              [workspaceId]: {
                ...workspaceChannels,
                [message.channelId]: channelMessages.map(
                  (msg) => (msg.id === message.id ? message : msg)
                ),
              },
            };
          }
        }

        // Update in direct messages if applicable
        if (message.directMessageId) {
          const workspaceDMs = state.directMessages[workspaceId] || {};
          const dmMessages = workspaceDMs[message.directMessageId] || [];
          
          if (dmMessages.length > 0) {
            newState.directMessages = {
              ...state.directMessages,
              [workspaceId]: {
                ...workspaceDMs,
                [message.directMessageId]: dmMessages.map(
                  (msg) => (msg.id === message.id ? message : msg)
                ),
              },
            };
          }
        }

        // Update in thread if applicable
        if (state.activeThreadId) {
          const workspaceThreads = state.threads[workspaceId] || {};
          const thread = workspaceThreads[state.activeThreadId];

          if (thread) {
            // Check if it's the parent message
            if (thread.parentMessage.id === message.id) {
              newState.threads = {
                ...state.threads,
                [workspaceId]: {
                  ...workspaceThreads,
                  [state.activeThreadId]: {
                    ...thread,
                    parentMessage: message,
                  },
                },
              };
            } else {
              // Check in thread messages
              const messageExists = thread.messages.some(
                (msg) => msg.id === message.id
              );

              if (messageExists) {
                newState.threads = {
                  ...state.threads,
                  [workspaceId]: {
                    ...workspaceThreads,
                    [state.activeThreadId]: {
                      ...thread,
                      messages: thread.messages.map((msg) =>
                        msg.id === message.id ? message : msg
                      ),
                    },
                  },
                };
              }
            }
          }
        }

        return newState;
      });
    });

    // Listen for message deletions
    socketClient.on(
      "message_delete",
      (data: { 
        id: string; 
        channelId?: string; 
        directMessageId?: string;
        workspaceId: string;
      }) => {
        set((state) => {
          const newState: any = {};
          const workspaceId = data.workspaceId;

          // Update in channel messages if applicable
          if (data.channelId) {
            const workspaceChannels = state.channelMessages[workspaceId] || {};
            const channelMessages = workspaceChannels[data.channelId] || [];
            
            if (channelMessages.length > 0) {
              newState.channelMessages = {
                ...state.channelMessages,
                [workspaceId]: {
                  ...workspaceChannels,
                  [data.channelId]: channelMessages.map(
                    (msg) =>
                      msg.id === data.id
                        ? {
                            ...msg,
                            isDeleted: true,
                            content: "[This message has been deleted]",
                          }
                        : msg
                  ),
                },
              };
            }
          }

          // Update in direct messages if applicable
          if (data.directMessageId) {
            const workspaceDMs = state.directMessages[workspaceId] || {};
            const dmMessages = workspaceDMs[data.directMessageId] || [];
            
            if (dmMessages.length > 0) {
              newState.directMessages = {
                ...state.directMessages,
                [workspaceId]: {
                  ...workspaceDMs,
                  [data.directMessageId]: dmMessages.map(
                    (msg) =>
                      msg.id === data.id
                        ? {
                            ...msg,
                            isDeleted: true,
                            content: "[This message has been deleted]",
                          }
                        : msg
                  ),
                },
              };
            }
          }

          // Update in thread if applicable
          if (state.activeThreadId) {
            const workspaceThreads = state.threads[workspaceId] || {};
            const thread = workspaceThreads[state.activeThreadId];

            if (thread) {
              // Check if it's the parent message
              if (thread.parentMessage.id === data.id) {
                newState.threads = {
                  ...state.threads,
                  [workspaceId]: {
                    ...workspaceThreads,
                    [state.activeThreadId]: {
                      ...thread,
                      parentMessage: {
                        ...thread.parentMessage,
                        isDeleted: true,
                        content: "[This message has been deleted]",
                      },
                    },
                  },
                };
              } else {
                // Check in thread messages
                const messageExists = thread.messages.some(
                  (msg) => msg.id === data.id
                );

                if (messageExists) {
                  newState.threads = {
                    ...state.threads,
                    [workspaceId]: {
                      ...workspaceThreads,
                      [state.activeThreadId]: {
                        ...thread,
                        messages: thread.messages.map((msg) =>
                          msg.id === data.id
                            ? {
                                ...msg,
                                isDeleted: true,
                                content: "[This message has been deleted]",
                              }
                            : msg
                        ),
                      },
                    },
                  };
                }
              }
            }
          }

          return newState;
        });
      }
    );

    // Listen for thread messages
    socketClient.on("new_thread_message", (message: Message) => {
      set((state) => {
        const workspaceId = message.workspaceId;
        
        if (state.activeThreadId === message.parentId) {
          const workspaceThreads = state.threads[workspaceId] || {};
          const thread = workspaceThreads[state.activeThreadId];

          if (thread) {
            return {
              threads: {
                ...state.threads,
                [workspaceId]: {
                  ...workspaceThreads,
                  [state.activeThreadId]: {
                    ...thread,
                    messages: [...thread.messages, message],
                  },
                },
              },
            };
          }
        }

        // If the parent message is visible in the current channel/DM,
        // update its thread count
        const channelStore = useChannelStore.getState();
        const workspaceStore = useWorkspaceStore.getState();
        const { selectedChannelId, selectedDirectMessageId } = channelStore;
        const { selectedWorkspaceId } = workspaceStore;

        if (selectedWorkspaceId && selectedChannelId) {
          const workspaceChannels = state.channelMessages[selectedWorkspaceId] || {};
          const channelMessages = workspaceChannels[selectedChannelId] || [];
          
          const parentMessage = channelMessages.find(
            (msg) => msg.id === message.parentId
          );

          if (parentMessage) {
            return {
              channelMessages: {
                ...state.channelMessages,
                [selectedWorkspaceId]: {
                  ...workspaceChannels,
                  [selectedChannelId]: channelMessages.map((msg) =>
                    msg.id === message.parentId
                      ? {
                          ...msg,
                          hasThread: true,
                          threadCount: (msg.threadCount || 0) + 1,
                        }
                      : msg
                  ),
                },
              },
            };
          }
        } else if (selectedWorkspaceId && selectedDirectMessageId) {
          const workspaceDMs = state.directMessages[selectedWorkspaceId] || {};
          const dmMessages = workspaceDMs[selectedDirectMessageId] || [];
          
          const parentMessage = dmMessages.find(
            (msg) => msg.id === message.parentId
          );

          if (parentMessage) {
            return {
              directMessages: {
                ...state.directMessages,
                [selectedWorkspaceId]: {
                  ...workspaceDMs,
                  [selectedDirectMessageId]: dmMessages.map((msg) =>
                    msg.id === message.parentId
                      ? {
                          ...msg,
                          hasThread: true,
                          threadCount: (msg.threadCount || 0) + 1,
                        }
                      : msg
                  ),
                },
              },
            };
          }
        }

        return {};
      });
    });

    // Listen for reaction updates
    socketClient.on("reaction_update", (message: Message) => {
      set((state) => {
        const newState: any = {};
        const workspaceId = message.workspaceId;

        // Update in channel messages if applicable
        if (message.channelId) {
          const workspaceChannels = state.channelMessages[workspaceId] || {};
          const channelMessages = workspaceChannels[message.channelId] || [];
          
          if (channelMessages.length > 0) {
            newState.channelMessages = {
              ...state.channelMessages,
              [workspaceId]: {
                ...workspaceChannels,
                [message.channelId]: channelMessages.map((msg) =>
                  msg.id === message.id
                    ? { ...msg, reactions: message.reactions }
                    : msg
                ),
              },
            };
          }
        }

        // Update in direct messages if applicable
        if (message.directMessageId) {
          const workspaceDMs = state.directMessages[workspaceId] || {};
          const dmMessages = workspaceDMs[message.directMessageId] || [];
          
          if (dmMessages.length > 0) {
            newState.directMessages = {
              ...state.directMessages,
              [workspaceId]: {
                ...workspaceDMs,
                [message.directMessageId]: dmMessages.map((msg) =>
                  msg.id === message.id
                    ? { ...msg, reactions: message.reactions }
                    : msg
                ),
              },
            };
          }
        }

        // Update in thread if applicable
        if (state.activeThreadId) {
          const workspaceThreads = state.threads[workspaceId] || {};
          const thread = workspaceThreads[state.activeThreadId];

          if (thread) {
            // Check if it's the parent message
            if (thread.parentMessage.id === message.id) {
              newState.threads = {
                ...state.threads,
                [workspaceId]: {
                  ...workspaceThreads,
                  [state.activeThreadId]: {
                    ...thread,
                    parentMessage: {
                      ...thread.parentMessage,
                      reactions: message.reactions,
                    },
                  },
                },
              };
            } else {
              // Check in thread messages
              const messageExists = thread.messages.some(
                (msg) => msg.id === message.id
              );

              if (messageExists) {
                newState.threads = {
                  ...state.threads,
                  [workspaceId]: {
                    ...workspaceThreads,
                    [state.activeThreadId]: {
                      ...thread,
                      messages: thread.messages.map((msg) =>
                        msg.id === message.id
                          ? { ...msg, reactions: message.reactions }
                          : msg
                      ),
                    },
                  },
                };
              }
            }
          }
        }

        return newState;
      });
    });

    // Listen for typing indicators
    socketClient.on("typing_start", (data: TypingIndicator) => {
      get().addTypingUser(data);
    });

    socketClient.on("typing_stop", (data: { userId: string }) => {
      get().removeTypingUser(data.userId);
    });
  },

  cleanupSocketListeners: () => {
    socketClient.off("new_message");
    socketClient.off("message_update");
    socketClient.off("message_delete");
    socketClient.off("new_thread_message");
    socketClient.off("reaction_update");
    socketClient.off("typing_start");
    socketClient.off("typing_stop");
  },

  clearMessages: () => {
    set({
      channelMessages: {},
      directMessages: {},
      threads: {},
      activeThreadId: null,
      hasMoreMessages: {},
      oldestMessageTimestamp: {},
      typingUsers: [],
      searchResults: null,
    });
  },

  clearError: () => set({ error: null }),
}));

export default useMessageStore;


































































// import { create } from "zustand";
// import * as messageApi from "@/lib/api/messaging/messages";
// import {
//   Message,
//   Thread,
//   TypingIndicator,
// } from "@/lib/types/collab-messaging/message";
// import socketClient from "@/lib/socket/messagingSocketClient/socketClient";
// import useChannelStore from "./channelStore";
// import useAuthStore from "./authStore";
// import useWorkspaceStore from "./workspaceStore";

// interface MessageState {
//   // Messages organized by workspace -> channel
//   channelMessages: Record<string, Record<string, Message[]>>;
//   // DMs organized by workspace -> DM
//   directMessages: Record<string, Record<string, Message[]>>;
//   // Threads organized by workspace -> parentMessageId
//   threads: Record<string, Record<string, Thread>>;
  
//   activeThreadId: string | null;
//   hasMoreMessages: Record<string, boolean>;
//   oldestMessageTimestamp: Record<string, string>;
//   isLoading: boolean;
//   error: string | null;
//   typingUsers: TypingIndicator[];
//   searchResults: {
//     messages: Message[];
//     total: number;
//     query: string;
//   } | null;

//   // Actions
//   fetchChannelMessages: (workspaceId: string, channelId: string, limit?: number) => Promise<void>;
//   fetchDirectMessages: (workspaceId: string, dmId: string, limit?: number) => Promise<void>;
//   fetchOlderMessages: (
//     type: "channel" | "dm",
//     workspaceId: string,
//     id: string,
//     limit?: number
//   ) => Promise<void>;
//   fetchThreadMessages: (workspaceId: string, messageId: string) => Promise<void>;
//   sendMessage: (content: string, workspaceId: string, attachments?: File[]) => Promise<void>;
//   sendThreadMessage: (
//     content: string,
//     workspaceId: string,
//     parentId: string,
//     attachments?: File[]
//   ) => Promise<void>;
//   updateMessage: (messageId: string, content: string) => Promise<void>;
//   deleteMessage: (messageId: string) => Promise<void>;
//   addReaction: (messageId: string, emoji: string) => Promise<void>;
//   removeReaction: (messageId: string, emoji: string) => Promise<void>;
//   setActiveThread: (workspaceId: string, messageId: string | null) => void;
//   startTyping: (workspaceId: string) => void;
//   stopTyping: (workspaceId: string) => void;
//   addTypingUser: (user: TypingIndicator) => void;
//   removeTypingUser: (userId: string) => void;
//   searchMessages: (workspaceId: string, query: string, options?: any) => Promise<void>;
//   setupSocketListeners: () => void;
//   cleanupSocketListeners: () => void;
//   clearMessages: () => void;
//   clearError: () => void;
// }

// const useMessageStore = create<MessageState>((set, get) => ({
//   channelMessages: {},
//   directMessages: {},
//   threads: {},
//   activeThreadId: null,
//   hasMoreMessages: {},
//   oldestMessageTimestamp: {},
//   isLoading: false,
//   error: null,
//   typingUsers: [],
//   searchResults: null,

//   fetchChannelMessages: async (workspaceId: string, channelId: string, limit = 50) => {
//     try {
//       set({ isLoading: true, error: null });

//       const { messages, hasMore } = await messageApi.getChannelMessages(workspaceId, channelId, limit);

//       // Get the oldest message timestamp for pagination
//       let oldestTimestamp = "";
//       if (messages.length > 0) {
//         const oldestMessage = messages[messages.length - 1];
//         oldestTimestamp = new Date(oldestMessage.createdAt).toISOString();
//       }

//       set((state) => {
//         // Initialize nested structure if it doesn't exist
//         const workspaceMessages = state.channelMessages[workspaceId] || {};
        
//         return {
//           channelMessages: {
//             ...state.channelMessages,
//             [workspaceId]: {
//               ...workspaceMessages,
//               [channelId]: messages,
//             },
//           },
//           hasMoreMessages: {
//             ...state.hasMoreMessages,
//             [`${workspaceId}:channel:${channelId}`]: hasMore,
//           },
//           oldestMessageTimestamp: {
//             ...state.oldestMessageTimestamp,
//             [`${workspaceId}:channel:${channelId}`]: oldestTimestamp,
//           },
//           isLoading: false,
//         };
//       });
//     } catch (error: any) {
//       let errorMessage = "Failed to fetch channel messages";
//       if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       }
//       set({ error: errorMessage, isLoading: false });
//     }
//   },

//   fetchDirectMessages: async (workspaceId: string, dmId: string, limit = 50) => {
//     try {
//       set({ isLoading: true, error: null });

//       const { messages, hasMore } = await messageApi.getDirectMessages(workspaceId, dmId, limit);

//       // Get the oldest message timestamp for pagination
//       let oldestTimestamp = "";
//       if (messages.length > 0) {
//         const oldestMessage = messages[messages.length - 1];
//         oldestTimestamp = new Date(oldestMessage.createdAt).toISOString();
//       }

//       set((state) => {
//         // Initialize nested structure if it doesn't exist
//         const workspaceDMs = state.directMessages[workspaceId] || {};
        
//         return {
//           directMessages: {
//             ...state.directMessages,
//             [workspaceId]: {
//               ...workspaceDMs,
//               [dmId]: messages,
//             },
//           },
//           hasMoreMessages: {
//             ...state.hasMoreMessages,
//             [`${workspaceId}:dm:${dmId}`]: hasMore,
//           },
//           oldestMessageTimestamp: {
//             ...state.oldestMessageTimestamp,
//             [`${workspaceId}:dm:${dmId}`]: oldestTimestamp,
//           },
//           isLoading: false,
//         };
//       });
//     } catch (error: any) {
//       let errorMessage = "Failed to fetch direct messages";
//       if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       }
//       set({ error: errorMessage, isLoading: false });
//     }
//   },

//   fetchOlderMessages: async (
//     type: "channel" | "dm",
//     workspaceId: string,
//     id: string,
//     limit = 50
//   ) => {
//     try {
//       set({ isLoading: true, error: null });

//       const cacheKey = `${workspaceId}:${type}:${id}`;
//       const oldestTimestamp = get().oldestMessageTimestamp[cacheKey];

//       if (!oldestTimestamp) {
//         set({ isLoading: false });
//         return;
//       }

//       let result;
//       if (type === "channel") {
//         result = await messageApi.getChannelMessages(
//           workspaceId,
//           id,
//           limit,
//           oldestTimestamp
//         );
//       } else {
//         result = await messageApi.getDirectMessages(
//           workspaceId,
//           id,
//           limit,
//           oldestTimestamp
//         );
//       }

//       const { messages, hasMore } = result;

//       if (messages.length === 0) {
//         set({ isLoading: false });
//         return;
//       }

//       // Get the new oldest message timestamp
//       const newOldestMessage = messages[messages.length - 1];
//       const newOldestTimestamp = new Date(
//         newOldestMessage.createdAt
//       ).toISOString();

//       // Update the messages list (append to the end since these are older messages)
//       set((state) => {
//         if (type === "channel") {
//           const workspaceChannels = state.channelMessages[workspaceId] || {};
//           const currentMessages = workspaceChannels[id] || [];
//           const updatedMessages = [...currentMessages, ...messages];

//           return {
//             channelMessages: {
//               ...state.channelMessages,
//               [workspaceId]: {
//                 ...workspaceChannels,
//                 [id]: updatedMessages,
//               },
//             },
//             hasMoreMessages: {
//               ...state.hasMoreMessages,
//               [cacheKey]: hasMore,
//             },
//             oldestMessageTimestamp: {
//               ...state.oldestMessageTimestamp,
//               [cacheKey]: newOldestTimestamp,
//             },
//             isLoading: false,
//           };
//         } else {
//           const workspaceDMs = state.directMessages[workspaceId] || {};
//           const currentMessages = workspaceDMs[id] || [];
//           const updatedMessages = [...currentMessages, ...messages];

//           return {
//             directMessages: {
//               ...state.directMessages,
//               [workspaceId]: {
//                 ...workspaceDMs,
//                 [id]: updatedMessages,
//               },
//             },
//             hasMoreMessages: {
//               ...state.hasMoreMessages,
//               [cacheKey]: hasMore,
//             },
//             oldestMessageTimestamp: {
//               ...state.oldestMessageTimestamp,
//               [cacheKey]: newOldestTimestamp,
//             },
//             isLoading: false,
//           };
//         }
//       });
//     } catch (error: any) {
//       let errorMessage = "Failed to fetch older messages";
//       if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       }
//       set({ error: errorMessage, isLoading: false });
//     }
//   },

//   fetchThreadMessages: async (workspaceId: string, messageId: string) => {
//     try {
//       set({ isLoading: true, error: null });

//       const thread = await messageApi.getThreadMessages(workspaceId, messageId);

//       set((state) => {
//         const workspaceThreads = state.threads[workspaceId] || {};
        
//         return {
//           threads: {
//             ...state.threads,
//             [workspaceId]: {
//               ...workspaceThreads,
//               [messageId]: thread,
//             },
//           },
//           isLoading: false,
//         };
//       });
//     } catch (error: any) {
//       let errorMessage = "Failed to fetch thread messages";
//       if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       }
//       set({ error: errorMessage, isLoading: false });
//     }
//   },

//   sendMessage: async (content: string, workspaceId: string, attachments?: File[]) => {
//     try {
//       const channelStore = useChannelStore.getState();
//       const { selectedChannelId, selectedDirectMessageId } = channelStore;

//       if (!workspaceId || (!selectedChannelId && !selectedDirectMessageId)) {
//         throw new Error("No workspace, channel or direct message selected");
//       }

//       const messageData = {
//         content,
//         workspaceId,
//         channelId: selectedChannelId || undefined,
//         directMessageId: selectedDirectMessageId || undefined,
//         attachments,
//       };

//       const newMessage = await messageApi.sendMessage(messageData);

//       // Update the appropriate message list
//       set((state) => {
//         if (selectedChannelId) {
//           const workspaceChannels = state.channelMessages[workspaceId] || {};
//           const currentMessages = workspaceChannels[selectedChannelId] || [];
          
//           return {
//             channelMessages: {
//               ...state.channelMessages,
//               [workspaceId]: {
//                 ...workspaceChannels,
//                 [selectedChannelId]: [newMessage, ...currentMessages],
//               },
//             },
//           };
//         } else if (selectedDirectMessageId) {
//           const workspaceDMs = state.directMessages[workspaceId] || {};
//           const currentMessages = workspaceDMs[selectedDirectMessageId] || [];
          
//           return {
//             directMessages: {
//               ...state.directMessages,
//               [workspaceId]: {
//                 ...workspaceDMs,
//                 [selectedDirectMessageId]: [newMessage, ...currentMessages],
//               },
//             },
//           };
//         }

//         return {};
//       });
//     } catch (error: any) {
//       let errorMessage = "Failed to send message";
//       if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       }
//       set({ error: errorMessage });
//       throw new Error(errorMessage);
//     }
//   },

//   sendThreadMessage: async (
//     content: string,
//     workspaceId: string,
//     parentId: string,
//     attachments?: File[]
//   ) => {
//     try {
//       const channelStore = useChannelStore.getState();
//       const { selectedChannelId, selectedDirectMessageId } = channelStore;

//       if (!workspaceId || (!selectedChannelId && !selectedDirectMessageId)) {
//         throw new Error("No workspace, channel or direct message selected");
//       }

//       const messageData = {
//         content,
//         workspaceId,
//         channelId: selectedChannelId || undefined,
//         directMessageId: selectedDirectMessageId || undefined,
//         parentId,
//         attachments,
//       };

//       const newMessage = await messageApi.sendMessage(messageData);

//       // Update the thread if it's active
//       if (get().activeThreadId === parentId) {
//         set((state) => {
//           const workspaceThreads = state.threads[workspaceId] || {};
//           const thread = workspaceThreads[parentId];

//           if (thread) {
//             return {
//               threads: {
//                 ...state.threads,
//                 [workspaceId]: {
//                   ...workspaceThreads,
//                   [parentId]: {
//                     ...thread,
//                     messages: [...thread.messages, newMessage],
//                   },
//                 },
//               },
//             };
//           }

//           return {};
//         });
//       }
//     } catch (error: any) {
//       let errorMessage = "Failed to send thread message";
//       if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       }
//       set({ error: errorMessage });
//       throw new Error(errorMessage);
//     }
//   },

//   updateMessage: async (messageId: string, content: string) => {
//     try {
//       set({ isLoading: true, error: null });

//       const updatedMessage = await messageApi.updateMessage(messageId, {
//         content,
//       });

//       // Update message in all relevant stores (channels, DMs, and threads)
//       set((state) => {
//         const channelStore = useChannelStore.getState();
//         const workspaceStore = useWorkspaceStore.getState();
//         const { selectedChannelId, selectedDirectMessageId } = channelStore;
//         const { selectedWorkspaceId } = workspaceStore;

//         // Skip if no workspace selected
//         if (!selectedWorkspaceId) return { isLoading: false };

//         // Update state object to return
//         const newState: any = { isLoading: false };

//         // Update in channel messages if applicable
//         if (selectedChannelId) {
//           const workspaceChannels = state.channelMessages[selectedWorkspaceId] || {};
//           const channelMessages = workspaceChannels[selectedChannelId] || [];
          
//           if (channelMessages.length > 0) {
//             const updatedChannelMessages = channelMessages.map((message) =>
//               message.id === messageId
//                 ? { ...message, ...updatedMessage }
//                 : message
//             );

//             newState.channelMessages = {
//               ...state.channelMessages,
//               [selectedWorkspaceId]: {
//                 ...workspaceChannels,
//                 [selectedChannelId]: updatedChannelMessages,
//               },
//             };
//           }
//         }

//         // Update in direct messages if applicable
//         if (selectedDirectMessageId) {
//           const workspaceDMs = state.directMessages[selectedWorkspaceId] || {};
//           const dmMessages = workspaceDMs[selectedDirectMessageId] || [];
          
//           if (dmMessages.length > 0) {
//             const updatedDMMessages = dmMessages.map((message) =>
//               message.id === messageId
//                 ? { ...message, ...updatedMessage }
//                 : message
//             );

//             newState.directMessages = {
//               ...state.directMessages,
//               [selectedWorkspaceId]: {
//                 ...workspaceDMs,
//                 [selectedDirectMessageId]: updatedDMMessages,
//               },
//             };
//           }
//         }

//         // Update in thread if applicable
//         if (state.activeThreadId) {
//           const workspaceThreads = state.threads[selectedWorkspaceId] || {};
//           const thread = workspaceThreads[state.activeThreadId];

//           if (thread) {
//             // Check if it's the parent message
//             if (thread.parentMessage.id === messageId) {
//               newState.threads = {
//                 ...state.threads,
//                 [selectedWorkspaceId]: {
//                   ...workspaceThreads,
//                   [state.activeThreadId]: {
//                     ...thread,
//                     parentMessage: { ...thread.parentMessage, ...updatedMessage },
//                   },
//                 },
//               };
//             } else {
//               // Check in thread messages
//               const updatedThreadMessages = thread.messages.map((message) =>
//                 message.id === messageId
//                   ? { ...message, ...updatedMessage }
//                   : message
//               );

//               newState.threads = {
//                 ...state.threads,
//                 [selectedWorkspaceId]: {
//                   ...workspaceThreads,
//                   [state.activeThreadId]: {
//                     ...thread,
//                     messages: updatedThreadMessages,
//                   },
//                 },
//               };
//             }
//           }
//         }

//         return newState;
//       });
//     } catch (error: any) {
//       let errorMessage = "Failed to update message";
//       if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       }
//       set({ error: errorMessage, isLoading: false });
//       throw new Error(errorMessage);
//     }
//   },

//   deleteMessage: async (messageId: string) => {
//     try {
//       set({ isLoading: true, error: null });

//       await messageApi.deleteMessage(messageId);

//       // Update state to mark message as deleted
//       set((state) => {
//         const channelStore = useChannelStore.getState();
//         const workspaceStore = useWorkspaceStore.getState();
//         const { selectedChannelId, selectedDirectMessageId } = channelStore;
//         const { selectedWorkspaceId } = workspaceStore;

//         // Skip if no workspace selected
//         if (!selectedWorkspaceId) return { isLoading: false };

//         // Update state object to return
//         const newState: any = { isLoading: false };

//         // Update in channel messages if applicable
//         if (selectedChannelId) {
//           const workspaceChannels = state.channelMessages[selectedWorkspaceId] || {};
//           const channelMessages = workspaceChannels[selectedChannelId] || [];
          
//           if (channelMessages.length > 0) {
//             const updatedChannelMessages = channelMessages.map((message) =>
//               message.id === messageId
//                 ? {
//                     ...message,
//                     isDeleted: true,
//                     content: "[This message has been deleted]",
//                   }
//                 : message
//             );

//             newState.channelMessages = {
//               ...state.channelMessages,
//               [selectedWorkspaceId]: {
//                 ...workspaceChannels,
//                 [selectedChannelId]: updatedChannelMessages,
//               },
//             };
//           }
//         }

//         // Update in direct messages if applicable
//         if (selectedDirectMessageId) {
//           const workspaceDMs = state.directMessages[selectedWorkspaceId] || {};
//           const dmMessages = workspaceDMs[selectedDirectMessageId] || [];
          
//           if (dmMessages.length > 0) {
//             const updatedDMMessages = dmMessages.map((message) =>
//               message.id === messageId
//                 ? {
//                     ...message,
//                     isDeleted: true,
//                     content: "[This message has been deleted]",
//                   }
//                 : message
//             );

//             newState.directMessages = {
//               ...state.directMessages,
//               [selectedWorkspaceId]: {
//                 ...workspaceDMs,
//                 [selectedDirectMessageId]: updatedDMMessages,
//               },
//             };
//           }
//         }

//         // Update in thread if applicable
//         if (state.activeThreadId) {
//           const workspaceThreads = state.threads[selectedWorkspaceId] || {};
//           const thread = workspaceThreads[state.activeThreadId];

//           if (thread) {
//             // Check if it's the parent message
//             if (thread.parentMessage.id === messageId) {
//               newState.threads = {
//                 ...state.threads,
//                 [selectedWorkspaceId]: {
//                   ...workspaceThreads,
//                   [state.activeThreadId]: {
//                     ...thread,
//                     parentMessage: {
//                       ...thread.parentMessage,
//                       isDeleted: true,
//                       content: "[This message has been deleted]",
//                     },
//                   },
//                 },
//               };
//             } else {
//               // Check in thread messages
//               const updatedThreadMessages = thread.messages.map((message) =>
//                 message.id === messageId
//                   ? {
//                       ...message,
//                       isDeleted: true,
//                       content: "[This message has been deleted]",
//                     }
//                   : message
//               );

//               newState.threads = {
//                 ...state.threads,
//                 [selectedWorkspaceId]: {
//                   ...workspaceThreads,
//                   [state.activeThreadId]: {
//                     ...thread,
//                     messages: updatedThreadMessages,
//                   },
//                 },
//               };
//             }
//           }
//         }

//         return newState;
//       });
//     } catch (error: any) {
//       let errorMessage = "Failed to delete message";
//       if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       }
//       set({ error: errorMessage, isLoading: false });
//       throw new Error(errorMessage);
//     }
//   },

//   addReaction: async (messageId: string, emoji: string) => {
//     try {
//       await messageApi.addReaction(messageId, { emoji });
//       // The socket will handle updating the UI with the new reaction
//     } catch (error: any) {
//       let errorMessage = "Failed to add reaction";
//       if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       }
//       set({ error: errorMessage });
//       throw new Error(errorMessage);
//     }
//   },

//   removeReaction: async (messageId: string, emoji: string) => {
//     try {
//       await messageApi.removeReaction(messageId, emoji);
//       // The socket will handle updating the UI with the removed reaction
//     } catch (error: any) {
//       let errorMessage = "Failed to remove reaction";
//       if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       }
//       set({ error: errorMessage });
//       throw new Error(errorMessage);
//     }
//   },

//   setActiveThread: (workspaceId: string, messageId: string | null) => {
//     const { activeThreadId } = get();

//     // Leave previous thread if any
//     if (activeThreadId) {
//       socketClient.leaveThread(workspaceId, activeThreadId);
//     }

//     // Join new thread if any
//     if (messageId) {
//       socketClient.joinThread(workspaceId, messageId);
//     }

//     set({ activeThreadId: messageId });
//   },

//   startTyping: (workspaceId: string) => {
//     const channelStore = useChannelStore.getState();
//     const { selectedChannelId, selectedDirectMessageId } = channelStore;

//     if (selectedChannelId) {
//       socketClient.sendTypingStart({ 
//         channelId: selectedChannelId,
//         workspaceId 
//       });
//     } else if (selectedDirectMessageId) {
//       socketClient.sendTypingStart({ 
//         dmId: selectedDirectMessageId,
//         workspaceId 
//       });
//     }
//   },

//   stopTyping: (workspaceId: string) => {
//     const channelStore = useChannelStore.getState();
//     const { selectedChannelId, selectedDirectMessageId } = channelStore;

//     if (selectedChannelId) {
//       socketClient.sendTypingStop({ 
//         channelId: selectedChannelId,
//         workspaceId 
//       });
//     } else if (selectedDirectMessageId) {
//       socketClient.sendTypingStop({ 
//         dmId: selectedDirectMessageId,
//         workspaceId 
//       });
//     }
//   },

//   addTypingUser: (user: TypingIndicator) => {
//     set((state) => {
//       // Check if this user is already in the typing list
//       const userExists = state.typingUsers.some(
//         (u) =>
//           u.userId === user.userId &&
//           u.workspaceId === user.workspaceId &&
//           ((u.channelId && u.channelId === user.channelId) ||
//             (u.dmId && u.dmId === user.dmId))
//       );

//       if (userExists) {
//         return {};
//       }

//       return {
//         typingUsers: [...state.typingUsers, user],
//       };
//     });
//   },

//   removeTypingUser: (userId: string) => {
//     set((state) => ({
//       typingUsers: state.typingUsers.filter((user) => user.userId !== userId),
//     }));
//   },

//   searchMessages: async (workspaceId: string, query: string, options = {}) => {
//     try {
//       set({ isLoading: true, error: null });

//       const result = await messageApi.searchMessages(workspaceId, query, options);

//       set({
//         searchResults: {
//           messages: result.messages,
//           total: result.total,
//           query,
//         },
//         isLoading: false,
//       });
//     } catch (error: any) {
//       let errorMessage = "Failed to search messages";
//       if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       }
//       set({ error: errorMessage, isLoading: false });
//     }
//   },

//   setupSocketListeners: () => {
//     // Listen for new messages
//     socketClient.on("new_message", (message: Message) => {
//       // Don't add own messages as they are already added by sendMessage
//       const authStore = useAuthStore.getState();
//       if (message.sender.id === authStore.user?.id) {
//         return;
//       }

//       set((state) => {
//         const newState: any = {};
//         const workspaceId = message.workspaceId;

//         // Add to channel messages if applicable
//         if (message.channelId) {
//           const workspaceChannels = state.channelMessages[workspaceId] || {};
//           const currentMessages = workspaceChannels[message.channelId] || [];
          
//           newState.channelMessages = {
//             ...state.channelMessages,
//             [workspaceId]: {
//               ...workspaceChannels,
//               [message.channelId]: [message, ...currentMessages],
//             },
//           };
//         }

//         // Add to direct messages if applicable
//         if (message.directMessageId) {
//           const workspaceDMs = state.directMessages[workspaceId] || {};
//           const currentMessages = workspaceDMs[message.directMessageId] || [];
          
//           newState.directMessages = {
//             ...state.directMessages,
//             [workspaceId]: {
//               ...workspaceDMs,
//               [message.directMessageId]: [message, ...currentMessages],
//             },
//           };
//         }

//         // Remove typing indicator for this user
//         newState.typingUsers = state.typingUsers.filter(
//           (user) => user.userId !== message.sender.id
//         );

//         return newState;
//       });
//     });

//     // Listen for message updates
//     socketClient.on("message_update", (message: Message) => {
//       set((state) => {
//         const newState: any = {};
//         const workspaceId = message.workspaceId;

//         // Update in channel messages if applicable
//         if (message.channelId) {
//           const workspaceChannels = state.channelMessages[workspaceId] || {};
//           const channelMessages = workspaceChannels[message.channelId] || [];
          
//           if (channelMessages.length > 0) {
//             newState.channelMessages = {
//               ...state.channelMessages,
//               [workspaceId]: {
//                 ...workspaceChannels,
//                 [message.channelId]: channelMessages.map(
//                   (msg) => (msg.id === message.id ? message : msg)
//                 ),
//               },
//             };
//           }
//         }

//         // Update in direct messages if applicable
//         if (message.directMessageId) {
//           const workspaceDMs = state.directMessages[workspaceId] || {};
//           const dmMessages = workspaceDMs[message.directMessageId] || [];
          
//           if (dmMessages.length > 0) {
//             newState.directMessages = {
//               ...state.directMessages,
//               [workspaceId]: {
//                 ...workspaceDMs,
//                 [message.directMessageId]: dmMessages.map(
//                   (msg) => (msg.id === message.id ? message : msg)
//                 ),
//               },
//             };
//           }
//         }

//         // Update in thread if applicable
//         if (state.activeThreadId) {
//           const workspaceThreads = state.threads[workspaceId] || {};
//           const thread = workspaceThreads[state.activeThreadId];

//           if (thread) {
//             // Check if it's the parent message
//             if (thread.parentMessage.id === message.id) {
//               newState.threads = {
//                 ...state.threads,
//                 [workspaceId]: {
//                   ...workspaceThreads,
//                   [state.activeThreadId]: {
//                     ...thread,
//                     parentMessage: message,
//                   },
//                 },
//               };
//             } else {
//               // Check in thread messages
//               const messageExists = thread.messages.some(
//                 (msg) => msg.id === message.id
//               );

//               if (messageExists) {
//                 newState.threads = {
//                   ...state.threads,
//                   [workspaceId]: {
//                     ...workspaceThreads,
//                     [state.activeThreadId]: {
//                       ...thread,
//                       messages: thread.messages.map((msg) =>
//                         msg.id === message.id ? message : msg
//                       ),
//                     },
//                   },
//                 };
//               }
//             }
//           }
//         }

//         return newState;
//       });
//     });

//     // Listen for message deletions
//     socketClient.on(
//       "message_delete",
//       (data: { 
//         id: string; 
//         channelId?: string; 
//         directMessageId?: string;
//         workspaceId: string;
//       }) => {
//         set((state) => {
//           const newState: any = {};
//           const workspaceId = data.workspaceId;

//           // Update in channel messages if applicable
//           if (data.channelId) {
//             const workspaceChannels = state.channelMessages[workspaceId] || {};
//             const channelMessages = workspaceChannels[data.channelId] || [];
            
//             if (channelMessages.length > 0) {
//               newState.channelMessages = {
//                 ...state.channelMessages,
//                 [workspaceId]: {
//                   ...workspaceChannels,
//                   [data.channelId]: channelMessages.map(
//                     (msg) =>
//                       msg.id === data.id
//                         ? {
//                             ...msg,
//                             isDeleted: true,
//                             content: "[This message has been deleted]",
//                           }
//                         : msg
//                   ),
//                 },
//               };
//             }
//           }

//           // Update in direct messages if applicable
//           if (data.directMessageId) {
//             const workspaceDMs = state.directMessages[workspaceId] || {};
//             const dmMessages = workspaceDMs[data.directMessageId] || [];
            
//             if (dmMessages.length > 0) {
//               newState.directMessages = {
//                 ...state.directMessages,
//                 [workspaceId]: {
//                   ...workspaceDMs,
//                   [data.directMessageId]: dmMessages.map(
//                     (msg) =>
//                       msg.id === data.id
//                         ? {
//                             ...msg,
//                             isDeleted: true,
//                             content: "[This message has been deleted]",
//                           }
//                         : msg
//                   ),
//                 },
//               };
//             }
//           }

//           // Update in thread if applicable
//           if (state.activeThreadId) {
//             const workspaceThreads = state.threads[workspaceId] || {};
//             const thread = workspaceThreads[state.activeThreadId];

//             if (thread) {
//               // Check if it's the parent message
//               if (thread.parentMessage.id === data.id) {
//                 newState.threads = {
//                   ...state.threads,
//                   [workspaceId]: {
//                     ...workspaceThreads,
//                     [state.activeThreadId]: {
//                       ...thread,
//                       parentMessage: {
//                         ...thread.parentMessage,
//                         isDeleted: true,
//                         content: "[This message has been deleted]",
//                       },
//                     },
//                   },
//                 };
//               } else {
//                 // Check in thread messages
//                 const messageExists = thread.messages.some(
//                   (msg) => msg.id === data.id
//                 );

//                 if (messageExists) {
//                   newState.threads = {
//                     ...state.threads,
//                     [workspaceId]: {
//                       ...workspaceThreads,
//                       [state.activeThreadId]: {
//                         ...thread,
//                         messages: thread.messages.map((msg) =>
//                           msg.id === data.id
//                             ? {
//                                 ...msg,
//                                 isDeleted: true,
//                                 content: "[This message has been deleted]",
//                               }
//                             : msg
//                         ),
//                       },
//                     },
//                   };
//                 }
//               }
//             }
//           }

//           return newState;
//         });
//       }
//     );

//     // Listen for thread messages
//     socketClient.on("new_thread_message", (message: Message) => {
//       set((state) => {
//         const workspaceId = message.workspaceId;
        
//         if (state.activeThreadId === message.parentId) {
//           const workspaceThreads = state.threads[workspaceId] || {};
//           const thread = workspaceThreads[state.activeThreadId];

//           if (thread) {
//             return {
//               threads: {
//                 ...state.threads,
//                 [workspaceId]: {
//                   ...workspaceThreads,
//                   [state.activeThreadId]: {
//                     ...thread,
//                     messages: [...thread.messages, message],
//                   },
//                 },
//               },
//             };
//           }
//         }

//         // If the parent message is visible in the current channel/DM,
//         // update its thread count
//         const channelStore = useChannelStore.getState();
//         const workspaceStore = useWorkspaceStore.getState();
//         const { selectedChannelId, selectedDirectMessageId } = channelStore;
//         const { selectedWorkspaceId } = workspaceStore;

//         if (selectedWorkspaceId && selectedChannelId) {
//           const workspaceChannels = state.channelMessages[selectedWorkspaceId] || {};
//           const channelMessages = workspaceChannels[selectedChannelId] || [];
          
//           const parentMessage = channelMessages.find(
//             (msg) => msg.id === message.parentId
//           );

//           if (parentMessage) {
//             return {
//               channelMessages: {
//                 ...state.channelMessages,
//                 [selectedWorkspaceId]: {
//                   ...workspaceChannels,
//                   [selectedChannelId]: channelMessages.map((msg) =>
//                     msg.id === message.parentId
//                       ? {
//                           ...msg,
//                           hasThread: true,
//                           threadCount: (msg.threadCount || 0) + 1,
//                         }
//                       : msg
//                   ),
//                 },
//               },
//             };
//           }
//         } else if (selectedWorkspaceId && selectedDirectMessageId) {
//           const workspaceDMs = state.directMessages[selectedWorkspaceId] || {};
//           const dmMessages = workspaceDMs[selectedDirectMessageId] || [];
          
//           const parentMessage = dmMessages.find(
//             (msg) => msg.id === message.parentId
//           );

//           if (parentMessage) {
//             return {
//               directMessages: {
//                 ...state.directMessages,
//                 [selectedWorkspaceId]: {
//                   ...workspaceDMs,
//                   [selectedDirectMessageId]: dmMessages.map((msg) =>
//                     msg.id === message.parentId
//                       ? {
//                           ...msg,
//                           hasThread: true,
//                           threadCount: (msg.threadCount || 0) + 1,
//                         }
//                       : msg
//                   ),
//                 },
//               },
//             };
//           }
//         }

//         return {};
//       });
//     });

//     // Listen for reaction updates
//     socketClient.on("reaction_update", (message: Message) => {
//       set((state) => {
//         const newState: any = {};
//         const workspaceId = message.workspaceId;

//         // Update in channel messages if applicable
//         if (message.channelId) {
//           const workspaceChannels = state.channelMessages[workspaceId] || {};
//           const channelMessages = workspaceChannels[message.channelId] || [];
          
//           if (channelMessages.length > 0) {
//             newState.channelMessages = {
//               ...state.channelMessages,
//               [workspaceId]: {
//                 ...workspaceChannels,
//                 [message.channelId]: channelMessages.map((msg) =>
//                   msg.id === message.id
//                     ? { ...msg, reactions: message.reactions }
//                     : msg
//                 ),
//               },
//             };
//           }
//         }

//         // Update in direct messages if applicable
//         if (message.directMessageId) {
//           const workspaceDMs = state.directMessages[workspaceId] || {};
//           const dmMessages = workspaceDMs[message.directMessageId] || [];
          
//           if (dmMessages.length > 0) {
//             newState.directMessages = {
//               ...state.directMessages,
//               [workspaceId]: {
//                 ...workspaceDMs,
//                 [message.directMessageId]: dmMessages.map((msg) =>
//                   msg.id === message.id
//                     ? { ...msg, reactions: message.reactions }
//                     : msg
//                 ),
//               },
//             };
//           }
//         }

//         // Update in thread if applicable
//         if (state.activeThreadId) {
//           const workspaceThreads = state.threads[workspaceId] || {};
//           const thread = workspaceThreads[state.activeThreadId];

//           if (thread) {
//             // Check if it's the parent message
//             if (thread.parentMessage.id === message.id) {
//               newState.threads = {
//                 ...state.threads,
//                 [workspaceId]: {
//                   ...workspaceThreads,
//                   [state.activeThreadId]: {
//                     ...thread,
//                     parentMessage: {
//                       ...thread.parentMessage,
//                       reactions: message.reactions,
//                     },
//                   },
//                 },
//               };
//             } else {
//               // Check in thread messages
//               const messageExists = thread.messages.some(
//                 (msg) => msg.id === message.id
//               );

//               if (messageExists) {
//                 newState.threads = {
//                   ...state.threads,
//                   [workspaceId]: {
//                     ...workspaceThreads,
//                     [state.activeThreadId]: {
//                       ...thread,
//                       messages: thread.messages.map((msg) =>
//                         msg.id === message.id
//                           ? { ...msg, reactions: message.reactions }
//                           : msg
//                       ),
//                     },
//                   },
//                 };
//               }
//             }
//           }
//         }

//         return newState;
//       });
//     });

//     // Listen for typing indicators
//     socketClient.on("typing_start", (data: TypingIndicator) => {
//       get().addTypingUser(data);
//     });

//     socketClient.on("typing_stop", (data: { userId: string }) => {
//       get().removeTypingUser(data.userId);
//     });
//   },

//   cleanupSocketListeners: () => {
//     socketClient.off("new_message");
//     socketClient.off("message_update");
//     socketClient.off("message_delete");
//     socketClient.off("new_thread_message");
//     socketClient.off("reaction_update");
//     socketClient.off("typing_start");
//     socketClient.off("typing_stop");
//   },

//   clearMessages: () => {
//     set({
//       channelMessages: {},
//       directMessages: {},
//       threads: {},
//       activeThreadId: null,
//       hasMoreMessages: {},
//       oldestMessageTimestamp: {},
//       typingUsers: [],
//       searchResults: null,
//     });
//   },

//   clearError: () => set({ error: null }),
// }));

// export default useMessageStore;