/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';

import { WhatsAppSocketEvent, WhatsAppSocketEventData } from '../../types/whatsapp';
import { disconnectSocket, getSocket, initializeSocket } from '@/lib/api/whatsapp/socket';

// Socket.io hook
export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  
  // Initialize socket on component mount
  useEffect(() => {
    socketRef.current = initializeSocket();
    
    // Cleanup on unmount
    return () => {
      // Note: We don't disconnect here, it's handled by the app when the user logs out
    };
  }, []);
  
  // Get current socket
  const getSocketInstance = useCallback(() => {
    return socketRef.current || getSocket();
  }, []);
  
  // Add event listener
  const on = useCallback(<T extends WhatsAppSocketEvent>(
    event: T,
    callback: (data: WhatsAppSocketEventData[T]) => void
  ) => {
    const socket = getSocketInstance();
    if (!socket) return () => {};
    
    socket.on(event, callback as any);
    
    // Return a function to remove the listener
    return () => {
      socket.off(event, callback as any);
    };
  }, [getSocketInstance]);
  
  // Disconnect socket
  const disconnect = useCallback(() => {
    disconnectSocket();
    socketRef.current = null;
  }, []);
  
  return {
    socket: socketRef.current,
    getSocket: getSocketInstance,
    on,
    disconnect,
    isConnected: socketRef.current?.connected || false,
  };
};