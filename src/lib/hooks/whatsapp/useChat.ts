import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Chat from "@/lib/api/whatsapp/chat";

/// Chat hook for managing chat data
export const useChat = () => {
  const queryClient = useQueryClient();
  
  // Get all chats
  const chatsQuery = useQuery({
    queryKey: ['whatsapp', 'chats'],
    queryFn: Chat.getChats.bind(Chat),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Search chats
  const searchChatsMutation = useMutation({
    mutationFn: (query: string) => Chat.searchChats(query),
  });

  // Get chat messages
  // This doesn't use useQuery directly in a callback, instead it returns a function
  // that the component can use to fetch messages for a specific chat
  const fetchChatMessages = useCallback(async (chatId: string, limit?: number) => {
    try {
      const data = await Chat.getChatMessages(chatId, limit);
      return data;
    } catch (error) {
      console.log('Error fetching chat messages:', error);
      throw error;
    }
  }, []);

  // Refresh chats
  const refreshChats = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: ['whatsapp', 'chats'] });
  }, [queryClient]);

  // Search for chats
  const searchChats = useCallback((query: string) => {
    return searchChatsMutation.mutate(query);
  }, [searchChatsMutation]);

  return {
    // Queries
    chatsQuery,
    
    // Functions
    fetchChatMessages,
    refreshChats,
    searchChats,
    
    // Data
    chats: chatsQuery.data?.chats || [],
    searchResults: searchChatsMutation.data?.results || [],
    
    // States
    isLoading: chatsQuery.isLoading,
    isSearching: searchChatsMutation.isPending,
  };
};