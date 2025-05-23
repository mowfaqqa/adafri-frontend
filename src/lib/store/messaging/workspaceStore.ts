// src/store/messaging/workspaceStore.ts

import { create } from "zustand";
import * as workspaceApi from "@/lib/api/messaging/workspace";
import { Workspace, WorkspaceCreateData, WorkspaceMember, WorkspaceInvitation } from "@/lib/types/collab-messaging/workspace";
import socketClient from "@/lib/socket/messagingSocketClient/socketClient";

// Make sure the interface name is WorkspaceState, not AuthState
interface WorkspaceState {
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
  members: Record<string, WorkspaceMember[]>; // workspaceId -> members
  invitations: Record<string, WorkspaceInvitation[]>; // workspaceId -> invitations
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchWorkspaces: () => Promise<void>;
  selectWorkspace: (workspaceId: string) => void;
  createWorkspace: (workspaceData: WorkspaceCreateData) => Promise<Workspace>;
  updateWorkspace: (workspaceId: string, workspaceData: Partial<WorkspaceCreateData>) => Promise<void>;
  updateWorkspaceLogo: (workspaceId: string, file: File) => Promise<void>;
  fetchWorkspaceMembers: (workspaceId: string) => Promise<void>;
  updateMemberRole: (workspaceId: string, userId: string, role: 'owner' | 'admin' | 'member') => Promise<void>;
  removeMember: (workspaceId: string, userId: string) => Promise<void>;
  inviteToWorkspace: (workspaceId: string, email: string, role?: 'admin' | 'member') => Promise<void>;
  fetchWorkspaceInvitations: (workspaceId: string) => Promise<void>;
  cancelInvitation: (workspaceId: string, invitationId: string) => Promise<void>;
  acceptInvitation: (token: string) => Promise<void>;
  clearSelection: () => void;
  clearError: () => void;
}

// Make sure we're exporting a store with WorkspaceState type
const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  selectedWorkspaceId: null,
  members: {},
  invitations: {},
  isLoading: false,
  error: null,
  
  fetchWorkspaces: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const workspaces = await workspaceApi.getWorkspaces();
      
      set({ 
        workspaces, 
        isLoading: false,
        // If no workspace is currently selected but we have workspaces, select the first one
        selectedWorkspaceId: get().selectedWorkspaceId || (workspaces.length > 0 ? workspaces[0].id : null)
      });

      // If a workspace is now selected, join its socket room
      const selectedId = get().selectedWorkspaceId;
      if (selectedId) {
        socketClient.setCurrentWorkspace(selectedId);
      }
    } catch (error: any) {
      let errorMessage = 'Failed to fetch workspaces';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
    }
  },
  
  selectWorkspace: (workspaceId: string) => {
    const { selectedWorkspaceId } = get();
    
    // Skip if already selected
    if (selectedWorkspaceId === workspaceId) {
      return;
    }
    
    // Join socket room for new workspace
    socketClient.setCurrentWorkspace(workspaceId);
    
    // Update selected workspace
    set({ selectedWorkspaceId: workspaceId });
  },
  
  createWorkspace: async (workspaceData: WorkspaceCreateData) => {
    try {
      set({ isLoading: true, error: null });
      
      const newWorkspace = await workspaceApi.createWorkspace(workspaceData);
      
      set((state) => ({
        workspaces: [...state.workspaces, newWorkspace],
        isLoading: false,
      }));
      
      return newWorkspace;
    } catch (error: any) {
      let errorMessage = 'Failed to create workspace';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  updateWorkspace: async (workspaceId: string, workspaceData: Partial<WorkspaceCreateData>) => {
    try {
      set({ isLoading: true, error: null });
      
      const updatedWorkspace = await workspaceApi.updateWorkspace(workspaceId, workspaceData);
      
      set((state) => ({
        workspaces: state.workspaces.map((workspace) => 
          workspace.id === workspaceId ? updatedWorkspace : workspace
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      let errorMessage = 'Failed to update workspace';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  updateWorkspaceLogo: async (workspaceId: string, file: File) => {
    try {
      set({ isLoading: true, error: null });
      
      const { logo } = await workspaceApi.updateWorkspaceLogo(workspaceId, file);
      
      set((state) => ({
        workspaces: state.workspaces.map((workspace) => 
          workspace.id === workspaceId ? { ...workspace, logo } : workspace
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      let errorMessage = 'Failed to update workspace logo';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  fetchWorkspaceMembers: async (workspaceId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const members = await workspaceApi.getWorkspaceMembers(workspaceId);
      
      set((state) => ({
        members: {
          ...state.members,
          [workspaceId]: members,
        },
        isLoading: false,
      }));
    } catch (error: any) {
      let errorMessage = 'Failed to fetch workspace members';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  updateMemberRole: async (workspaceId: string, userId: string, role: 'owner' | 'admin' | 'member') => {
    try {
      set({ isLoading: true, error: null });
      
      const updatedMember = await workspaceApi.updateMemberRole(workspaceId, userId, role);
      
      set((state) => {
        const currentMembers = state.members[workspaceId] || [];
        const updatedMembers = currentMembers.map((member) => 
          member.userId === userId ? { ...member, role } : member
        );
        
        return {
          members: {
            ...state.members,
            [workspaceId]: updatedMembers,
          },
          isLoading: false,
        };
      });
    } catch (error: any) {
      let errorMessage = 'Failed to update member role';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  removeMember: async (workspaceId: string, userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      await workspaceApi.removeMember(workspaceId, userId);
      
      set((state) => {
        const currentMembers = state.members[workspaceId] || [];
        const updatedMembers = currentMembers.filter((member) => member.userId !== userId);
        
        return {
          members: {
            ...state.members,
            [workspaceId]: updatedMembers,
          },
          isLoading: false,
        };
      });
    } catch (error: any) {
      let errorMessage = 'Failed to remove member';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  inviteToWorkspace: async (workspaceId: string, email: string, role: 'admin' | 'member' = 'member') => {
    try {
      set({ isLoading: true, error: null });
      
      const invitation = await workspaceApi.inviteToWorkspace(workspaceId, email, role);
      
      set((state) => {
        const currentInvitations = state.invitations[workspaceId] || [];
        
        return {
          invitations: {
            ...state.invitations,
            [workspaceId]: [...currentInvitations, invitation],
          },
          isLoading: false,
        };
      });
    } catch (error: any) {
      let errorMessage = 'Failed to invite to workspace';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  fetchWorkspaceInvitations: async (workspaceId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const invitations = await workspaceApi.getWorkspaceInvitations(workspaceId);
      
      set((state) => ({
        invitations: {
          ...state.invitations,
          [workspaceId]: invitations,
        },
        isLoading: false,
      }));
    } catch (error: any) {
      let errorMessage = 'Failed to fetch workspace invitations';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  cancelInvitation: async (workspaceId: string, invitationId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      await workspaceApi.cancelInvitation(workspaceId, invitationId);
      
      set((state) => {
        const currentInvitations = state.invitations[workspaceId] || [];
        const updatedInvitations = currentInvitations.filter(
          (invitation) => invitation.id !== invitationId
        );
        
        return {
          invitations: {
            ...state.invitations,
            [workspaceId]: updatedInvitations,
          },
          isLoading: false,
        };
      });
    } catch (error: any) {
      let errorMessage = 'Failed to cancel invitation';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  acceptInvitation: async (token: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const workspace = await workspaceApi.acceptInvitation(token);
      
      // Add new workspace to the list
      set((state) => ({
        workspaces: [...state.workspaces, workspace],
        isLoading: false,
      }));
    } catch (error: any) {
      let errorMessage = 'Failed to accept invitation';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  clearSelection: () => {
    // Leave the current workspace room if any
    const { selectedWorkspaceId } = get();
    if (selectedWorkspaceId) {
      socketClient.leaveWorkspace(selectedWorkspaceId);
    }
    
    set({ selectedWorkspaceId: null });
  },
  
  clearError: () => set({ error: null }),
}));

export default useWorkspaceStore;
