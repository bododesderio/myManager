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
  /** The user id the persisted activeWorkspaceId belongs to. */
  userScope: string | null;
  setActiveWorkspace: (id: string) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  /**
   * Bind the store to the signed-in user. If a different user is now active,
   * the persisted workspace (from the previous user, e.g. on a shared browser)
   * is dropped so scoped queries don't fire against a workspace this user can't
   * access (which 403s). Called before dashboard children mount.
   */
  syncUser: (userId: string) => void;
  getActiveWorkspace: () => Workspace | undefined;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      activeWorkspaceId: null,
      workspaces: [],
      userScope: null,
      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
      syncUser: (userId) => {
        if (get().userScope !== userId) {
          set({ userScope: userId, activeWorkspaceId: null, workspaces: [] });
        }
      },
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
      partialize: (state) => ({
        activeWorkspaceId: state.activeWorkspaceId,
        userScope: state.userScope,
      }),
    },
  ),
);
