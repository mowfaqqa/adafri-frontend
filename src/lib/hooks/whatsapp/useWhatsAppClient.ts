/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WhatsAppClientStatus, WhatsAppMessage, WhatsAppSocketEvent } from '@/lib/types/whatsapp';
import { initializeSocket, listenToWhatsAppEvent } from '@/lib/api/whatsapp/socket';
import WhatsApp from '@/lib/api/whatsapp/whatsapp';

// WhatsApp client hook
export const useWhatsAppClient = () => {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Record<string, WhatsAppMessage[]>>({});
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  
  // Initialize socket connection
  useEffect(() => {
    initializeSocket();
    
    return () => {
      // Socket disconnection is handled separately on logout
    };
  }, []);
  
  // Listen for incoming messages
  useEffect(() => {
    const unsubscribe = listenToWhatsAppEvent(WhatsAppSocketEvent.WHATSAPP_MESSAGE, (messageData) => {
      const message = messageData as WhatsAppMessage;
      
      // Update messages state
      setMessages((prevMessages) => {
        const chatId = message.isFromMe ? message.to : message.from;
        const chatMessages = [...(prevMessages[chatId] || []), message];
        
        return {
          ...prevMessages,
          [chatId]: chatMessages,
        };
      });
      
      // Invalidate chats query to update last message and unread count
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'chats'] });
    });
    
    return () => {
      unsubscribe();
    };
  }, [queryClient]);
  
  // Get WhatsApp client status
  const statusQuery = useQuery({
    queryKey: ['whatsapp', 'status'],
    queryFn: WhatsApp.getStatus.bind(WhatsApp),
    refetchInterval: (data: any) => {
      // Only refetch if not connected
      if (data?.status !== WhatsAppClientStatus.CONNECTED) {
        return 3000; // Refetch every 3 seconds until connected
      }
      return false; // Stop refetching once connected
    },
  });
  
  // Get WhatsApp profile info
  const profileQuery = useQuery({
    queryKey: ['whatsapp', 'profile'],
    queryFn: WhatsApp.getProfile.bind(WhatsApp),
    enabled: statusQuery.data?.status === WhatsAppClientStatus.CONNECTED,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch messages for a chat
  const fetchMessages = useCallback(async (chatId: string) => {
    try {
      const response = await WhatsApp.getChatMessages(chatId);
      if (response.success && response.messages) {
        setMessages(prev => ({
          ...prev,
          [chatId]: response.messages
        }));
        return response.messages;
      }
      return [];
    } catch (error) {
      console.log('Error fetching messages:', error);
      return [];
    }
  }, []);

  // Send text message
  const sendTextMessageMutation = useMutation({
    mutationFn: WhatsApp.sendTextMessage.bind(WhatsApp),
    onSuccess: (_, variables: any) => {
      // Optimistically update the messages
      const newMessage: Partial<WhatsAppMessage> = {
        id: `temp-${Date.now()}`,
        body: variables?.message,
        timestamp: Math.floor(Date.now() / 1000),
        from: profileQuery.data?.profile?.id || 'me',
        to: variables.chatId,
        type: 'text' as any,
        isFromMe: true,
        isGroup: false,
        isForwarded: false,
        isStatus: false,
        hasMedia: false,
        hasQuotedMsg: false
      };

      setMessages(prev => {
        const chatMessages = [...(prev[variables.chatId] || []), newMessage as WhatsAppMessage];
        return {
          ...prev,
          [variables.chatId]: chatMessages
        };
      });

      // Invalidate queries to refetch
      queryClient.invalidateQueries({ 
        queryKey: ['whatsapp', 'chat', variables.chatId, 'messages'] 
      });
    },
  });
  
  // Send media message
  const sendMediaMessageMutation = useMutation({
    mutationFn: ({ chatId, media, caption }: { chatId: string; media: File; caption?: string }) => 
      WhatsApp.sendMediaMessage(chatId, media, caption),
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ 
        queryKey: ['whatsapp', 'chat', variables.chatId, 'messages'] 
      });
    },
  });
  const initClientMutation = useMutation({
    mutationFn: WhatsApp.initClient.bind(WhatsApp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'status'] });
    },
  });
  // Logout/Disconnect WhatsApp client
  const logoutMutation = useMutation({
    mutationFn: WhatsApp.logout.bind(WhatsApp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp'] });
      setMessages({});
      setCurrentChat(null);
    },
  });

  // Search messages
  const searchMessagesMutation = useMutation({
    mutationFn: ({ query, chatId }: { query: string; chatId?: string }) => 
      WhatsApp.searchMessages(query, chatId),
  });
  
  // Set current chat and fetch messages if needed
  const selectChat = useCallback((chatId: string) => {
    setCurrentChat(chatId);
    
    // If we don't have messages for this chat, fetch them
    if (!messages[chatId] || messages[chatId].length === 0) {
      fetchMessages(chatId);
    }
  }, [messages, fetchMessages]);
  
  return {
    // State
    status: statusQuery.data?.status || WhatsAppClientStatus.NOT_INITIALIZED,
    qrCode: statusQuery.data?.qrCode,
    profile: profileQuery.data?.profile,
    messages,
    currentChat,
    
    // Queries
    statusQuery,
    profileQuery,
    
    // Actions
    fetchMessages,
    selectChat,
    searchMessages: searchMessagesMutation.mutate,
    
    // Mutations
    initClient: initClientMutation.mutate,
    sendTextMessage: sendTextMessageMutation.mutate,
    sendMediaMessage: sendMediaMessageMutation.mutate,
    logout: logoutMutation.mutate,
    
    // Loading states
    isInitializing: initClientMutation.isPending,
    isSendingMessage: sendTextMessageMutation.isPending || sendMediaMessageMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isSearching: searchMessagesMutation.isPending,
    searchResults: searchMessagesMutation.data?.results || [],
  };
};