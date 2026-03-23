import { create } from 'zustand';

interface Draft {
  id: string;
  content: string;
  platforms: string[];
  mediaUris: string[];
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface DraftState {
  drafts: Draft[];
  currentDraft: Draft | null;
  addDraft: (draft: Omit<Draft, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDraft: (id: string, updates: Partial<Draft>) => void;
  deleteDraft: (id: string) => void;
  setCurrentDraft: (draft: Draft | null) => void;
  clearCurrentDraft: () => void;
}

let draftCounter = 0;

export const useDraftStore = create<DraftState>((set) => ({
  drafts: [],
  currentDraft: null,

  addDraft: (draft) => {
    const now = new Date().toISOString();
    const newDraft: Draft = {
      ...draft,
      id: `draft_${++draftCounter}`,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({
      drafts: [newDraft, ...state.drafts],
      currentDraft: newDraft,
    }));
  },

  updateDraft: (id, updates) =>
    set((state) => ({
      drafts: state.drafts.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
      ),
      currentDraft:
        state.currentDraft?.id === id
          ? { ...state.currentDraft, ...updates, updatedAt: new Date().toISOString() }
          : state.currentDraft,
    })),

  deleteDraft: (id) =>
    set((state) => ({
      drafts: state.drafts.filter((d) => d.id !== id),
      currentDraft: state.currentDraft?.id === id ? null : state.currentDraft,
    })),

  setCurrentDraft: (draft) => set({ currentDraft: draft }),

  clearCurrentDraft: () => set({ currentDraft: null }),
}));
