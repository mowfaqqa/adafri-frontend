/* eslint-disable @typescript-eslint/no-explicit-any */
import { Email, EmailCategory, EmailSegment } from "@/lib/types/email";
import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

interface EmailStore {
  draftEmail: any;
  emails: Email[];
  customSegments: string[];
  activeCategory: EmailCategory;
  addEmail: (
    emailData: Omit<Email, "id" | "timestamp" | "isUrgent" | "category">
  ) => void;
  moveEmail: (emailId: string, segment: EmailSegment) => void;
  addSegment: (name: string) => void;
  setActiveCategory: (category: EmailCategory) => void;
  deleteEmail: (id: string) => void;
  saveDraft: (draft: Partial<Email>) => void;
  updateDraft: (data: any) => void;
}

export const useEmailStore = create<EmailStore>((set) => ({
  emails: [
    {
      id: "1",
      from: "danielodedara@gmail.com",
      to: "test@example.com",
      subject: "Welcome to Adafri Dashboard",
      content: "Welcome to your new dashboard!",
      timestamp: "05/12 - 14:48",
      isUrgent: false,
      hasAttachment: true,
      status: "inbox",
      category: "inbox",
    },
  ],
  customSegments: [],
  activeCategory: "inbox",
  draftEmail: null,
  addEmail: (emailData) =>
    set((state) => ({
      emails: [
        ...state.emails,
        {
          ...emailData,
          id: uuidv4(),
          timestamp: new Date().toLocaleString(),
          isUrgent: false,
          category: state.activeCategory,
          status: emailData.status || state.activeCategory,
        },
      ],
    })),
  moveEmail: (emailId, segment) =>
    set((state) => ({
      emails: state.emails.map((email) =>
        email.id === emailId
          ? { ...email, isUrgent: segment === "urgent" }
          : email
      ),
    })),
  addSegment: (name) =>
    set((state) => ({ customSegments: [...state.customSegments, name] })),
  setActiveCategory: (category) => set({ activeCategory: category }),
  deleteEmail: (id) =>
    set((state) => ({
      emails: state.emails.filter((email) => email.id !== id),
    })),
  saveDraft: (draft) =>
    set((state) => {
      if (draft.id) {
        return {
          emails: state.emails.map((email) =>
            email.id === draft.id ? { ...email, ...draft } : email
          ),
        };
      }
      return state;
    }),
  updateDraft: (data) => set({ draftEmail: data }),
}));
