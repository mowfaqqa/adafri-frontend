/* eslint-disable @typescript-eslint/no-explicit-any */
import { Message, TypingIndicator } from "@/lib/types/collab-messaging/message";
import { io, Socket } from "socket.io-client";

// Define event types for type safety
export interface ServerToClientEvents {
  new_message: (message: Message) => void;
  message_update: (message: Message) => void;
  message_delete: (message: {
    id: string;
    channelId?: string;
    directMessageId?: string;
  }) => void;
  new_thread_message: (message: Message) => void;
  reaction_update: (message: Message) => void;
  typing_start: (data: TypingIndicator) => void;
  typing_stop: (data: {
    userId: string;
    channelId?: string;
    dmId?: string;
  }) => void;
  user_online: (user: { userId: string; username: string }) => void;
  user_offline: (user: { userId: string; username: string }) => void;
  online_users: (users: { userId: string; username: string }[]) => void;
}

export interface ClientToServerEvents {
  join_channel: (channelId: string) => void;
  leave_channel: (channelId: string) => void;
  join_dm: (dmId: string) => void;
  leave_dm: (dmId: string) => void;
  join_thread: (threadId: string) => void;
  leave_thread: (threadId: string) => void;
  typing_start: (data: { channelId?: string; dmId?: string }) => void;
  typing_stop: (data: { channelId?: string; dmId?: string }) => void;
}

class SocketClient {
  private static instance: SocketClient;
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
    null;
  private eventHandlers: { [key: string]: ((...args: any[]) => void)[] } = {};

  // Private constructor for singleton pattern
  private constructor() {}

  // Get the singleton instance
  public static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  // Initialize socket connection
  public connect(token: string): void {
    if (this.socket) {
      this.disconnect();
    }

    const SOCKET_URL =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

    this.socket = io(SOCKET_URL, {
      auth: {
        token: token,
      },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Setup default event listeners
    this.setupEventListeners();
  }

  // Disconnect socket
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.eventHandlers = {};
    }
  }

  // Setup default event listeners
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("Socket connected");
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    this.socket.on("connect_error", (error) => {
      console.log("Socket connection error:", error);
    });
  }

  // Join a channel room
  public joinChannel(channelId: string): void {
    if (!this.socket) return;
    this.socket.emit("join_channel", channelId);
  }

  // Leave a channel room
  public leaveChannel(channelId: string): void {
    if (!this.socket) return;
    this.socket.emit("leave_channel", channelId);
  }

  // Join a direct message room
  public joinDirectMessage(dmId: string): void {
    if (!this.socket) return;
    this.socket.emit("join_dm", dmId);
  }

  // Leave a direct message room
  public leaveDirectMessage(dmId: string): void {
    if (!this.socket) return;
    this.socket.emit("leave_dm", dmId);
  }

  // Join a thread room
  public joinThread(threadId: string): void {
    if (!this.socket) return;
    this.socket.emit("join_thread", threadId);
  }

  // Leave a thread room
  public leaveThread(threadId: string): void {
    if (!this.socket) return;
    this.socket.emit("leave_thread", threadId);
  }

  // Send typing start indicator
  public sendTypingStart(data: { channelId?: string; dmId?: string }): void {
    if (!this.socket) return;
    this.socket.emit("typing_start", data);
  }

  // Send typing stop indicator
  public sendTypingStop(data: { channelId?: string; dmId?: string }): void {
    if (!this.socket) return;
    this.socket.emit("typing_stop", data);
  }

  // Add event listener
  public on<T extends keyof ServerToClientEvents>(
    event: T,
    callback: ServerToClientEvents[T]
  ): void {
    if (!this.socket) return;

    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }

    this.eventHandlers[event].push(callback);
    this.socket.on(event, callback as any);
  }

  // Remove event listener
  public off<T extends keyof ServerToClientEvents>(
    event: T,
    callback?: ServerToClientEvents[T]
  ): void {
    if (!this.socket) return;

    if (callback && this.eventHandlers[event]) {
      const index = this.eventHandlers[event].indexOf(callback as any);
      if (index !== -1) {
        this.eventHandlers[event].splice(index, 1);
        this.socket.off(event, callback as any);
      }
    } else {
      // Remove all listeners for this event
      if (this.eventHandlers[event]) {
        this.eventHandlers[event].forEach((handler) => {
          this.socket?.off(event, handler as any);
        });
        this.eventHandlers[event] = [];
      }
    }
  }

  // Check if socket is connected
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default SocketClient.getInstance();
