import { createAction, props } from '@ngrx/store';

import { User } from '../../core/models/user.model';
import { AuthUser } from '../../core/models/auth-user.model';

export const login = createAction(
  '[Auth] Login',
  props<{
    email: string;
    password: string;
    returnUrl?: string;
  }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{
    user: AuthUser;
    returnUrl?: string;
  }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{
    error: string;
  }>()
);

export const register = createAction(
  '[Auth] Register',
  props<{
    user: Omit<User, 'id'>;
  }>()
);

export const registerSuccess = createAction(
  '[Auth] Register Success'
);

export const registerFailure = createAction(
  '[Auth] Register Failure',
  props<{
    error: string;
  }>()
);

export const logout = createAction(
  '[Auth] Logout'
);

export const restoreAuth = createAction(
  '[Auth] Restore Auth'
);

export const restoreAuthSuccess = createAction(
  '[Auth] Restore Auth Success',
  props<{ user: AuthUser | null }>()
);