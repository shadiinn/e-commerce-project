import {
  createReducer,
  on
} from '@ngrx/store';

import {
  login,
  loginSuccess,
  loginFailure,

  register,
  registerSuccess,
  registerFailure,

  logout,
  restoreAuthSuccess
} from './auth.actions';

import {
  initialAuthState
} from './auth.state';


export const authReducer = createReducer(

  initialAuthState,

  on(login, state => ({
    ...state,
    loading: true,
    error: null
  })),

  on(loginSuccess, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    loading: false,
    error: null
  })),

  on(loginFailure, (state, { error }) => ({
    ...state,
    user: null,
    isAuthenticated: false,
    loading: false,
    error
  })),

  on(register, state => ({
    ...state,
    loading: true,
    error: null
  })),

  on(registerSuccess, state => ({
  ...state,
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null
  })),

  on(registerFailure, (state, { error }) => ({
    ...state,
    user: null,
    isAuthenticated: false,
    loading: false,
    error
  })),

  on(logout, () => initialAuthState),

  on(
  restoreAuthSuccess,
  (state, { user }) => ({
      ...state,
      user,
      isAuthenticated: user !== null,
      loading: false,
      error: null
  })
  ),

);