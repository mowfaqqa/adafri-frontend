/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, Socket } from "socket.io-client";
import {
  WhatsAppSocketEvent,
  WhatsAppSocketEventData,
} from "../../types/whatsapp";

let socket: Socket | null = null;

// Initialize Socket.io connection
export const initializeSocket = (): Socket => {
  if (!socket) {
    socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:3000",
      {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ["websocket", "polling"],
      }
    );

    // Log connection status
    socket.on("connect", () => {
      console.log("Socket connected with ID:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${reason}`);
    });

    socket.on("connect_error", (error) => {
      console.log("Socket connection error:", error.message);
    });

    socket.on("reconnect", (attempt) => {
      console.log(`Socket reconnected after ${attempt} attempts`);
    });
  }

  return socket;
};

// Get existing socket or initialize a new one
export const getSocket = (): Socket | null => {
  return socket || initializeSocket();
};

// Disconnect socket
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Listen to WhatsApp events with typed callbacks
export const listenToWhatsAppEvent = <T extends WhatsAppSocketEvent>(
  event: T,
  callback: (data: WhatsAppSocketEventData[T]) => void
): (() => void) => {
  const currentSocket = getSocket();

  currentSocket?.on(event, callback as any);

  // Return a function to remove the listener
  return () => {
    currentSocket?.off(event, callback as any);
  };
};
