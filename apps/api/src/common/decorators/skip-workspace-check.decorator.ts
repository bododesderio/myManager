import { SetMetadata } from '@nestjs/common';

/**
 * Marks a route as exempt from WorkspaceMemberGuard's workspace-resolution
 * requirement, WITHOUT making it @Public() (JWT auth still applies).
 *
 * Use only where the authoritative workspace cannot come from the request and
 * is instead recovered server-side — e.g. the OAuth callback, whose workspace
 * lives in the server-stored `state`. The membership check that would normally
 * happen here was already enforced at the workspace-guarded initiate step that
 * minted that state, and the callback creates the account under the stored
 * workspace, never a caller-supplied one.
 */
export const SKIP_WORKSPACE_CHECK_KEY = 'skipWorkspaceCheck';
export const SkipWorkspaceCheck = () => SetMetadata(SKIP_WORKSPACE_CHECK_KEY, true);
