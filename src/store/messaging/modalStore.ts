/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";

export type ModalType =
  | "login"
  | "register"
  | "createChannel"
  | "channelDetails"
  | "editProfile"
  | "userProfile"
  | "addMembers"
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
}

const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  type: null,
  data: {},

  openModal: (type, data = {}) => set({ isOpen: true, type, data }),
  closeModal: () => set({ isOpen: false, type: null, data: {} }),
}));

export default useModalStore;
