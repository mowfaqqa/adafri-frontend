import { create } from "zustand";

export type ModalType =
  | "createWorkspace"
  | "editWorkspace"
  | "workspaceInvite"
  | "workspaceMembers"
  | "createChannel"
  | "editChannel"
  | "channelMembers"
  | "editProfile"
  | "userProfile"
  | "confirmDelete";

interface ModalData {
  [key: string]: any;
}

interface ModalState {
  isOpen: boolean;
  type: ModalType | null;
  data: ModalData;

  // Actions
  openModal: (type: ModalType, data?: ModalData) => void;
  closeModal: () => void;
  updateModalData: (data: Partial<ModalData>) => void;
}

const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  type: null,
  data: {},

  openModal: (type, data = {}) => set({ isOpen: true, type, data }),
  closeModal: () => set({ isOpen: false, type: null, data: {} }),
  updateModalData: (data) => set((state) => ({ data: { ...state.data, ...data } })),
}));

export default useModalStore;