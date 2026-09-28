import { User } from '../shared/models/user.model';

export interface WorkspaceInfo {
  tenantId: string;
  tenantName: string;
  role: string;
  isLastUsed: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  requiresWorkspaceSelection?: boolean;
  workspaces?: WorkspaceInfo[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
