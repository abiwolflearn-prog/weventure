import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IUserIdentity } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  user: IUserIdentity | null;
  loading: boolean;
  error: string | null;
}

const getInitialUser = (): IUserIdentity | null => {
  try {
    const userStr = localStorage.getItem('weventure_user');
    if (userStr && userStr !== 'undefined' && userStr !== 'null') {
      return JSON.parse(userStr);
    }
  } catch (_) {}
  return null;
};

const initialUser = getInitialUser();
const hasToken = !!localStorage.getItem('weventure_jwt_token');

const initialState: AuthState = {
  isAuthenticated: !!initialUser || hasToken,
  user: initialUser,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<IUserIdentity>) {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.loading = false;
      state.error = null;
      localStorage.setItem('weventure_tenant_id', action.payload.tenantId || 'weventurehub');
      localStorage.setItem('weventure_user', JSON.stringify(action.payload));
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('weventure_tenant_id');
      localStorage.removeItem('weventure_jwt_token');
      localStorage.removeItem('weventure_user');
    },
    updateUserProfile(state, action: PayloadAction<Partial<IUserIdentity>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('weventure_user', JSON.stringify(state.user));
      }
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateUserProfile } = authSlice.actions;
export default authSlice.reducer;
