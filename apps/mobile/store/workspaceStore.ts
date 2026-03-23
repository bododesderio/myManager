import { create } from 'zustand';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
}

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspace: (workspace: Workspace) => void;
  switchWorkspace: (workspaceId: string) => void;
  addWorkspace: (workspace: Workspace) => void;
  removeWorkspace: (workspaceId: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  currentWorkspace: null,

  setWorkspaces: (workspaces) =>
    set({
      workspaces,
      currentWorkspace: workspaces[0] || null,
    }),

  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),

  switchWorkspace: (workspaceId) =>
    set((state) => ({
      currentWorkspace:
        state.workspaces.find((w) => w.id === workspaceId) || state.currentWorkspace,
    })),

  addWorkspace: (workspace) =>
    set((state) => ({
      workspaces: [...state.workspaces, workspace],
    })),

  removeWorkspace: (workspaceId) =>
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== workspaceId),
      currentWorkspace:
        state.currentWorkspace?.id === workspaceId
          ? state.workspaces.find((w) => w.id !== workspaceId) || null
          : state.currentWorkspace,
    })),
}));
