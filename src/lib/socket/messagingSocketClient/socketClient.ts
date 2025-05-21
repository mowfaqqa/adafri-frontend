import { io, Socket } from "socket.io-client";
import config from "@/lib/config/messaging";
import { Message, TypingIndicator } from "@/lib/types/collab-messaging/message";

// Define event types for type safety
export interface ServerToClientEvents {
  // Message events
  new_message: (message: Message) => void;
  message_update: (message: Message) => void;
  message_delete: (message: {
    id: string;
    channelId?: string;
    directMessageId?: string;
    workspaceId: string;
  }) => void;
  new_thread_message: (message: Message) => void;
  reaction_update: (message: Message) => void;
  
  // Typing indicators
  typing_start: (data: TypingIndicator) => void;
  typing_stop: (data: {
    userId: string;
    channelId?: string;
    dmId?: string;
    workspaceId: string;
  }) => void;
  
  // User presence
  user_online: (user: { userId: string; username: string; workspaceId: string }) => void;
  user_offline: (user: { userId: string; username: string; workspaceId: string }) => void;
  online_users: (users: { userId: string; username: string; workspaceId: string }[]) => void;
  
  // Channel/DM events
  channel_update: (data: any) => void;
  direct_message_update: (data: any) => void;
  
  // Workspace events
  workspace_update: (data: any) => void;
  workspace_member_update: (data: any) => void;
  workspace_invitation: (data: any) => void;
}

export interface ClientToServerEvents {
  // Room management
  join_workspace: (workspaceId: string) => void;
  leave_workspace: (workspaceId: string) => void;
  join_channel: (workspaceId: string, channelId: string) => void;
  leave_channel: (workspaceId: string, channelId: string) => void;
  join_dm: (workspaceId: string, dmId: string) => void;
  leave_dm: (workspaceId: string, dmId: string) => void;
  join_thread: (workspaceId: string, threadId: string) => void;
  leave_thread: (workspaceId: string, threadId: string) => void;
  
  // Typing indicators
  typing_start: (data: { channelId?: string; dmId?: string; workspaceId: string }) => void;
  typing_stop: (data: { channelId?: string; dmId?: string; workspaceId: string }) => void;
  
  // Message acknowledgment
  message_received: (data: { messageId: string; workspaceId: string }) => void;
}

class SocketClient {
  private static instance: SocketClient;
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private eventHandlers: { [key: string]: ((...args: any[]) => void)[] } = {};
  private currentWorkspaceId: string | null = null;

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
    if (this.socket && this.socket.connected) {
      console.log("Socket already connected");
      return;
    }

    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(config.socketUrl, {
      auth: {
        token,
      },
      ...config.socketOptions,
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
      this.currentWorkspaceId = null;
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
      console.error("Socket connection error:", error);
    });
  }

  // Set current workspace
  public setCurrentWorkspace(workspaceId: string): void {
    if (this.currentWorkspaceId === workspaceId) return;
    
    // Leave current workspace if any
    if (this.currentWorkspaceId) {
      this.leaveWorkspace(this.currentWorkspaceId);
    }
    
    // Join new workspace
    this.joinWorkspace(workspaceId);
    this.currentWorkspaceId = workspaceId;
  }

  // Join a workspace room
  public joinWorkspace(workspaceId: string): void {
    if (!this.socket || !workspaceId) return;
    this.socket.emit("join_workspace", workspaceId);
  }

  // Leave a workspace room
  public leaveWorkspace(workspaceId: string): void {
    if (!this.socket || !workspaceId) return;
    this.socket.emit("leave_workspace", workspaceId);
    if (this.currentWorkspaceId === workspaceId) {
      this.currentWorkspaceId = null;
    }
  }

  // Join a channel room
  public joinChannel(workspaceId: string, channelId: string): void {
    if (!this.socket || !workspaceId || !channelId) return;
    this.socket.emit("join_channel", workspaceId, channelId);
  }

  // Leave a channel room
  public leaveChannel(workspaceId: string, channelId: string): void {
    if (!this.socket || !workspaceId || !channelId) return;
    this.socket.emit("leave_channel", workspaceId, channelId);
  }

  // Join a direct message room
  public joinDirectMessage(workspaceId: string, dmId: string): void {
    if (!this.socket || !workspaceId || !dmId) return;
    this.socket.emit("join_dm", workspaceId, dmId);
  }

  // Leave a direct message room
  public leaveDirectMessage(workspaceId: string, dmId: string): void {
    if (!this.socket || !workspaceId || !dmId) return;
    this.socket.emit("leave_dm", workspaceId, dmId);
  }

  // Join a thread room
  public joinThread(workspaceId: string, threadId: string): void {
    if (!this.socket || !workspaceId || !threadId) return;
    this.socket.emit("join_thread", workspaceId, threadId);
  }

  // Leave a thread room
  public leaveThread(workspaceId: string, threadId: string): void {
    if (!this.socket || !workspaceId || !threadId) return;
    this.socket.emit("leave_thread", workspaceId, threadId);
  }

  // Send typing start indicator
  public sendTypingStart(data: { channelId?: string; dmId?: string; workspaceId: string }): void {
    if (!this.socket || !data.workspaceId) return;
    this.socket.emit("typing_start", data);
  }

  // Send typing stop indicator
  public sendTypingStop(data: { channelId?: string; dmId?: string; workspaceId: string }): void {
    if (!this.socket || !data.workspaceId) return;
    this.socket.emit("typing_stop", data);
  }

  // Add event listener
  public on<T extends keyof ServerToClientEvents>(
    event: T,
    callback: ServerToClientEvents[T]
  ): void {
    if (!this.socket) return;

    if (!this.eventHandlers[event as string]) {
      this.eventHandlers[event as string] = [];
    }

    this.eventHandlers[event as string].push(callback as any);
    this.socket.on(event, callback as any);
  }

  // Remove event listener
  public off<T extends keyof ServerToClientEvents>(
    event: T,
    callback?: ServerToClientEvents[T]
  ): void {
    if (!this.socket) return;

    if (callback && this.eventHandlers[event as string]) {
      const index = this.eventHandlers[event as string].indexOf(callback as any);
      if (index !== -1) {
        this.eventHandlers[event as string].splice(index, 1);
        this.socket.off(event, callback as any);
      }
    } else {
      // Remove all listeners for this event
      if (this.eventHandlers[event as string]) {
        this.eventHandlers[event as string].forEach((handler) => {
          this.socket?.off(event, handler as any);
        });
        this.eventHandlers[event as string] = [];
      }
    }
  }

  // Check if socket is connected
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get current workspace ID
  public getCurrentWorkspaceId(): string | null {
    return this.currentWorkspaceId;
  }
}

export default SocketClient.getInstance();