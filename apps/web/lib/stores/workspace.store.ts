import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
}

interface WorkspaceStore {
  activeWorkspaceId: string | null;
  workspaces: Workspace[];
  setActiveWorkspace: (id: string) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  getActiveWorkspace: () => Workspace | undefined;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      activeWorkspaceId: null,
      workspaces: [],
      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
      setWorkspaces: (workspaces) => {
        const state = get();
        set({ workspaces });
        // Auto-select first workspace if none selected
        if (!state.activeWorkspaceId && workspaces.length > 0) {
          set({ activeWorkspaceId: workspaces[0].id });
        }
        // Reset if selected workspace no longer exists
        if (
          state.activeWorkspaceId &&
          !workspaces.find((w) => w.id === state.activeWorkspaceId)
        ) {
          set({ activeWorkspaceId: workspaces[0]?.id ?? null });
        }
      },
      getActiveWorkspace: () => {
        const state = get();
        return state.workspaces.find((w) => w.id === state.activeWorkspaceId);
      },
    }),
    {
      name: 'mymanager-workspace',
      partialize: (state) => ({ activeWorkspaceId: state.activeWorkspaceId }),
    },
  ),
);
