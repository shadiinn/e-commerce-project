import { AuthUser } from "../../core/models/auth-user.model";

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  registrationEmailAvailable:boolean;
}

export const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  registrationEmailAvailable: false
};