import { createAction, props } from '@ngrx/store';

import { User } from '../../core/models/user.model';

import { AuthUser } from '../../core/models/auth-user.model';


// =====================================================
// LOGIN
// =====================================================

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


// =====================================================
// REGISTER
// =====================================================

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


// =====================================================
// UPDATE PROFILE
// =====================================================

export const updateProfile = createAction(

  '[Auth] Update Profile',

  props<{
    id: string;
    changes: Partial<Omit<User, 'id'>>;
  }>()

);


export const updateProfileSuccess = createAction(

  '[Auth] Update Profile Success',

  props<{
    user: AuthUser;
  }>()

);


export const updateProfileFailure = createAction(

  '[Auth] Update Profile Failure',

  props<{
    error: string;
  }>()

);


// =====================================================
// LOGOUT
// =====================================================

export const logout = createAction(

  '[Auth] Logout'

);


// =====================================================
// RESTORE AUTH
// =====================================================

export const restoreAuth = createAction(

  '[Auth] Restore Auth'

);


export const restoreAuthSuccess = createAction(

  '[Auth] Restore Auth Success',

  props<{
    user: AuthUser | null;
  }>()

);


// =====================================================
// LOGIN DATA MERGE
// =====================================================

export const loginDataMergeComplete = createAction(

  '[Auth] Login Data Merge Complete',

  props<{
    returnUrl?: string;
  }>()

);
export const checkRegistrationEmail = createAction(
  '[Auth] Check Registration Email',
  props<{ email: string }>()
);

export const registrationEmailAvailable = createAction(
  '[Auth] Registration Email Available',
  props<{ email: string }>()
);