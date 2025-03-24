/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import * as messageApi from "../../lib/api//messaging/messages";
import {
  Message,
  Thread,
  TypingIndicator,
} from "@/lib/types/collab-messaging/message";
import socketClient from "@/lib/socket/messagingSocketClient/socketClient";
import useChannelStore from "./channelStore";
import useAuthStore from "./authStore";

interface MessageState {
  channelMessages: Record<string, Message[]>;
  directMessages: Record<string, Message[]>;
  threads: Record<string, Thread>;
  activeThreadId: string | null;
  hasMoreMessages: Record<string, boolean>;
  oldestMessageTimestamp: Record<string, string>;
  isLoading: boolean;
  error: string | null;
  typingUsers: TypingIndicator[];

  // Actions
  fetchChannelMessages: (channelId: string, limit?: number) => Promise<void>;
  fetchDirectMessages: (dmId: string, limit?: number) => Promise<void>;
  fetchOlderMessages: (
    type: "channel" | "dm",
    id: string,
    limit?: number
  ) => Promise<void>;
  fetchThreadMessages: (messageId: string) => Promise<void>;
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  sendThreadMessage: (
    content: string,
    parentId: string,
    attachments?: File[]
  ) => Promise<void>;
  updateMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  setActiveThread: (messageId: string | null) => void;
  startTyping: () => void;
  stopTyping: () => void;
  addTypingUser: (user: TypingIndicator) => void;
  removeTypingUser: (userId: string) => void;
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

  fetchChannelMessages: async (channelId: string, limit = 50) => {
    try {
      set({ isLoading: true, error: null });

      const { messages, hasMore } = await messageApi.getChannelMessages(
        channelId,
        limit
      );

      // Get the oldest message timestamp for pagination
      let oldestTimestamp = "";
      if (messages.length > 0) {
        const oldestMessage = messages[messages.length - 1];
        oldestTimestamp = new Date(oldestMessage.createdAt).toISOString();
      }

      set((state) => ({
        channelMessages: {
          ...state.channelMessages,
          [channelId]: messages,
        },
        hasMoreMessages: {
          ...state.hasMoreMessages,
          [channelId]: hasMore,
        },
        oldestMessageTimestamp: {
          ...state.oldestMessageTimestamp,
          [channelId]: oldestTimestamp,
        },
        isLoading: false,
      }));
    } catch (error: any) {
      let errorMessage = "Failed to fetch channel messages";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchDirectMessages: async (dmId: string, limit = 50) => {
    try {
      set({ isLoading: true, error: null });

      const { messages, hasMore } = await messageApi.getDirectMessages(
        dmId,
        limit
      );

      // Get the oldest message timestamp for pagination
      let oldestTimestamp = "";
      if (messages.length > 0) {
        const oldestMessage = messages[messages.length - 1];
        oldestTimestamp = new Date(oldestMessage.createdAt).toISOString();
      }

      set((state) => ({
        directMessages: {
          ...state.directMessages,
          [dmId]: messages,
        },
        hasMoreMessages: {
          ...state.hasMoreMessages,
          [dmId]: hasMore,
        },
        oldestMessageTimestamp: {
          ...state.oldestMessageTimestamp,
          [dmId]: oldestTimestamp,
        },
        isLoading: false,
      }));
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
    id: string,
    limit = 50
  ) => {
    try {
      set({ isLoading: true, error: null });

      const oldestTimestamp = get().oldestMessageTimestamp[id];

      if (!oldestTimestamp) {
        set({ isLoading: false });
        return;
      }

      let result;
      if (type === "channel") {
        result = await messageApi.getChannelMessages(
          id,
          limit,
          oldestTimestamp
        );
      } else {
        result = await messageApi.getDirectMessages(id, limit, oldestTimestamp);
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
        const currentMessages =
          type === "channel"
            ? state.channelMessages[id] || []
            : state.directMessages[id] || [];

        const updatedMessages = [...currentMessages, ...messages];

        return {
          ...(type === "channel"
            ? {
                channelMessages: {
                  ...state.channelMessages,
                  [id]: updatedMessages,
                },
              }
            : {
                directMessages: {
                  ...state.directMessages,
                  [id]: updatedMessages,
                },
              }),
          hasMoreMessages: {
            ...state.hasMoreMessages,
            [id]: hasMore,
          },
          oldestMessageTimestamp: {
            ...state.oldestMessageTimestamp,
            [id]: newOldestTimestamp,
          },
          isLoading: false,
        };
      });
    } catch (error: any) {
      let errorMessage = "Failed to fetch older messages";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchThreadMessages: async (messageId: string) => {
    try {
      set({ isLoading: true, error: null });

      const thread = await messageApi.getThreadMessages(messageId);

      set((state) => ({
        threads: {
          ...state.threads,
          [messageId]: thread,
        },
        isLoading: false,
      }));
    } catch (error: any) {
      let errorMessage = "Failed to fetch thread messages";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
    }
  },

  sendMessage: async (content: string, attachments?: File[]) => {
    try {
      const channelStore = useChannelStore.getState();
      const { selectedChannelId, selectedDirectMessageId } = channelStore;

      if (!selectedChannelId && !selectedDirectMessageId) {
        throw new Error("No channel or direct message selected");
      }

      const messageData = {
        content,
        channelId: selectedChannelId || undefined,
        directMessageId: selectedDirectMessageId || undefined,
        attachments,
      };

      const newMessage = await messageApi.sendMessage(messageData);

      // Update the appropriate message list
      set((state) => {
        if (selectedChannelId) {
          const currentMessages =
            state.channelMessages[selectedChannelId] || [];
          return {
            channelMessages: {
              ...state.channelMessages,
              [selectedChannelId]: [newMessage, ...currentMessages],
            },
          };
        } else if (selectedDirectMessageId) {
          const currentMessages =
            state.directMessages[selectedDirectMessageId] || [];
          return {
            directMessages: {
              ...state.directMessages,
              [selectedDirectMessageId]: [newMessage, ...currentMessages],
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
    parentId: string,
    attachments?: File[]
  ) => {
    try {
      const channelStore = useChannelStore.getState();
      const { selectedChannelId, selectedDirectMessageId } = channelStore;

      if (!selectedChannelId && !selectedDirectMessageId) {
        throw new Error("No channel or direct message selected");
      }

      const messageData = {
        content,
        channelId: selectedChannelId || undefined,
        directMessageId: selectedDirectMessageId || undefined,
        parentId,
        attachments,
      };

      const newMessage = await messageApi.sendMessage(messageData);

      // Update the thread if it's active
      if (get().activeThreadId === parentId) {
        set((state) => {
          const thread = state.threads[parentId];

          if (thread) {
            return {
              threads: {
                ...state.threads,
                [parentId]: {
                  ...thread,
                  messages: [...thread.messages, newMessage],
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
        const { selectedChannelId, selectedDirectMessageId } = channelStore;

        // Update state object to return
        const newState: any = { isLoading: false };

        // Update in channel messages if applicable
        if (selectedChannelId && state.channelMessages[selectedChannelId]) {
          const updatedChannelMessages = state.channelMessages[
            selectedChannelId
          ].map((message) =>
            message.id === messageId
              ? { ...message, ...updatedMessage }
              : message
          );

          newState.channelMessages = {
            ...state.channelMessages,
            [selectedChannelId]: updatedChannelMessages,
          };
        }

        // Update in direct messages if applicable
        if (
          selectedDirectMessageId &&
          state.directMessages[selectedDirectMessageId]
        ) {
          const updatedDirectMessages = state.directMessages[
            selectedDirectMessageId
          ].map((message) =>
            message.id === messageId
              ? { ...message, ...updatedMessage }
              : message
          );

          newState.directMessages = {
            ...state.directMessages,
            [selectedDirectMessageId]: updatedDirectMessages,
          };
        }

        // Update in thread if applicable
        if (state.activeThreadId) {
          const thread = state.threads[state.activeThreadId];

          if (thread) {
            // Check if it's the parent message
            if (thread.parentMessage.id === messageId) {
              newState.threads = {
                ...state.threads,
                [state.activeThreadId]: {
                  ...thread,
                  parentMessage: { ...thread.parentMessage, ...updatedMessage },
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
                [state.activeThreadId]: {
                  ...thread,
                  messages: updatedThreadMessages,
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
        const { selectedChannelId, selectedDirectMessageId } = channelStore;

        // Update state object to return
        const newState: any = { isLoading: false };

        // Update in channel messages if applicable
        if (selectedChannelId && state.channelMessages[selectedChannelId]) {
          const updatedChannelMessages = state.channelMessages[
            selectedChannelId
          ].map((message) =>
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
            [selectedChannelId]: updatedChannelMessages,
          };
        }

        // Update in direct messages if applicable
        if (
          selectedDirectMessageId &&
          state.directMessages[selectedDirectMessageId]
        ) {
          const updatedDirectMessages = state.directMessages[
            selectedDirectMessageId
          ].map((message) =>
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
            [selectedDirectMessageId]: updatedDirectMessages,
          };
        }

        // Update in thread if applicable
        if (state.activeThreadId) {
          const thread = state.threads[state.activeThreadId];

          if (thread) {
            // Check if it's the parent message
            if (thread.parentMessage.id === messageId) {
              newState.threads = {
                ...state.threads,
                [state.activeThreadId]: {
                  ...thread,
                  parentMessage: {
                    ...thread.parentMessage,
                    isDeleted: true,
                    content: "[This message has been deleted]",
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
                [state.activeThreadId]: {
                  ...thread,
                  messages: updatedThreadMessages,
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

  setActiveThread: (messageId: string | null) => {
    const { activeThreadId } = get();

    // Leave previous thread if any
    if (activeThreadId) {
      socketClient.leaveThread(activeThreadId);
    }

    // Join new thread if any
    if (messageId) {
      socketClient.joinThread(messageId);
    }

    set({ activeThreadId: messageId });
  },

  startTyping: () => {
    const channelStore = useChannelStore.getState();
    const { selectedChannelId, selectedDirectMessageId } = channelStore;

    if (selectedChannelId) {
      socketClient.sendTypingStart({ channelId: selectedChannelId });
    } else if (selectedDirectMessageId) {
      socketClient.sendTypingStart({ dmId: selectedDirectMessageId });
    }
  },

  stopTyping: () => {
    const channelStore = useChannelStore.getState();
    const { selectedChannelId, selectedDirectMessageId } = channelStore;

    if (selectedChannelId) {
      socketClient.sendTypingStop({ channelId: selectedChannelId });
    } else if (selectedDirectMessageId) {
      socketClient.sendTypingStop({ dmId: selectedDirectMessageId });
    }
  },

  addTypingUser: (user: TypingIndicator) => {
    set((state) => {
      // Check if this user is already in the typing list
      const userExists = state.typingUsers.some(
        (u) =>
          u.userId === user.userId &&
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

        // Add to channel messages if applicable
        if (message.channelId) {
          const currentMessages =
            state.channelMessages[message.channelId] || [];
          newState.channelMessages = {
            ...state.channelMessages,
            [message.channelId]: [message, ...currentMessages],
          };
        }

        // Add to direct messages if applicable
        if (message.directMessageId) {
          const currentMessages =
            state.directMessages[message.directMessageId] || [];
          newState.directMessages = {
            ...state.directMessages,
            [message.directMessageId]: [message, ...currentMessages],
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

        // Update in channel messages if applicable
        if (message.channelId && state.channelMessages[message.channelId]) {
          newState.channelMessages = {
            ...state.channelMessages,
            [message.channelId]: state.channelMessages[message.channelId].map(
              (msg) => (msg.id === message.id ? message : msg)
            ),
          };
        }

        // Update in direct messages if applicable
        if (
          message.directMessageId &&
          state.directMessages[message.directMessageId]
        ) {
          newState.directMessages = {
            ...state.directMessages,
            [message.directMessageId]: state.directMessages[
              message.directMessageId
            ].map((msg) => (msg.id === message.id ? message : msg)),
          };
        }

        // Update in thread if applicable
        if (state.activeThreadId) {
          const thread = state.threads[state.activeThreadId];

          if (thread) {
            // Check if it's the parent message
            if (thread.parentMessage.id === message.id) {
              newState.threads = {
                ...state.threads,
                [state.activeThreadId]: {
                  ...thread,
                  parentMessage: message,
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
                  [state.activeThreadId]: {
                    ...thread,
                    messages: thread.messages.map((msg) =>
                      msg.id === message.id ? message : msg
                    ),
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
      (data: { id: string; channelId?: string; directMessageId?: string }) => {
        set((state) => {
          const newState: any = {};

          // Update in channel messages if applicable
          if (data.channelId && state.channelMessages[data.channelId]) {
            newState.channelMessages = {
              ...state.channelMessages,
              [data.channelId]: state.channelMessages[data.channelId].map(
                (msg) =>
                  msg.id === data.id
                    ? {
                        ...msg,
                        isDeleted: true,
                        content: "[This message has been deleted]",
                      }
                    : msg
              ),
            };
          }

          // Update in direct messages if applicable
          if (
            data.directMessageId &&
            state.directMessages[data.directMessageId]
          ) {
            newState.directMessages = {
              ...state.directMessages,
              [data.directMessageId]: state.directMessages[
                data.directMessageId
              ].map((msg) =>
                msg.id === data.id
                  ? {
                      ...msg,
                      isDeleted: true,
                      content: "[This message has been deleted]",
                    }
                  : msg
              ),
            };
          }

          // Update in thread if applicable
          if (state.activeThreadId) {
            const thread = state.threads[state.activeThreadId];

            if (thread) {
              // Check if it's the parent message
              if (thread.parentMessage.id === data.id) {
                newState.threads = {
                  ...state.threads,
                  [state.activeThreadId]: {
                    ...thread,
                    parentMessage: {
                      ...thread.parentMessage,
                      isDeleted: true,
                      content: "[This message has been deleted]",
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
        if (state.activeThreadId === message.parentId) {
          const thread = state.threads[state.activeThreadId];

          if (thread) {
            return {
              threads: {
                ...state.threads,
                [state.activeThreadId]: {
                  ...thread,
                  messages: [...thread.messages, message],
                },
              },
            };
          }
        }

        // If the parent message is visible in the current channel/DM,
        // update its thread count
        const channelStore = useChannelStore.getState();
        const { selectedChannelId, selectedDirectMessageId } = channelStore;

        if (selectedChannelId && state.channelMessages[selectedChannelId]) {
          const parentMessage = state.channelMessages[selectedChannelId].find(
            (msg) => msg.id === message.parentId
          );

          if (parentMessage) {
            return {
              channelMessages: {
                ...state.channelMessages,
                [selectedChannelId]: state.channelMessages[
                  selectedChannelId
                ].map((msg) =>
                  msg.id === message.parentId
                    ? {
                        ...msg,
                        hasThread: true,
                        threadCount: (msg.threadCount || 0) + 1,
                      }
                    : msg
                ),
              },
            };
          }
        } else if (
          selectedDirectMessageId &&
          state.directMessages[selectedDirectMessageId]
        ) {
          const parentMessage = state.directMessages[
            selectedDirectMessageId
          ].find((msg) => msg.id === message.parentId);

          if (parentMessage) {
            return {
              directMessages: {
                ...state.directMessages,
                [selectedDirectMessageId]: state.directMessages[
                  selectedDirectMessageId
                ].map((msg) =>
                  msg.id === message.parentId
                    ? {
                        ...msg,
                        hasThread: true,
                        threadCount: (msg.threadCount || 0) + 1,
                      }
                    : msg
                ),
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

        // Update in channel messages if applicable
        if (message.channelId && state.channelMessages[message.channelId]) {
          newState.channelMessages = {
            ...state.channelMessages,
            [message.channelId]: state.channelMessages[message.channelId].map(
              (msg) =>
                msg.id === message.id
                  ? { ...msg, reactions: message.reactions }
                  : msg
            ),
          };
        }

        // Update in direct messages if applicable
        if (
          message.directMessageId &&
          state.directMessages[message.directMessageId]
        ) {
          newState.directMessages = {
            ...state.directMessages,
            [message.directMessageId]: state.directMessages[
              message.directMessageId
            ].map((msg) =>
              msg.id === message.id
                ? { ...msg, reactions: message.reactions }
                : msg
            ),
          };
        }

        // Update in thread if applicable
        if (state.activeThreadId) {
          const thread = state.threads[state.activeThreadId];

          if (thread) {
            // Check if it's the parent message
            if (thread.parentMessage.id === message.id) {
              newState.threads = {
                ...state.threads,
                [state.activeThreadId]: {
                  ...thread,
                  parentMessage: {
                    ...thread.parentMessage,
                    reactions: message.reactions,
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
                  [state.activeThreadId]: {
                    ...thread,
                    messages: thread.messages.map((msg) =>
                      msg.id === message.id
                        ? { ...msg, reactions: message.reactions }
                        : msg
                    ),
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
    });
  },

  clearError: () => set({ error: null }),
}));

export default useMessageStore;
