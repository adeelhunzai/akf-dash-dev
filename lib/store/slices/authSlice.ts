import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthState, UserRole } from '@/lib/types/roles';
import { setTokenCookie, getTokenCookie, removeTokenCookie } from '@/lib/utils/cookies';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  token: null,
  isLoggingOut: false,
  isInitializing: true, // Start as true - will be set to false after initialization
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
      // Store token in cookie for persistence and security
      setTokenCookie(action.payload);
    },
    setRole: (state, action: PayloadAction<UserRole>) => {
      if (state.user) {
        state.user.role = action.payload;
      }
    },
    updateUserAvatar: (state, action: PayloadAction<string | null>) => {
      if (state.user) {
        // Create a new user object to ensure React detects the change
        state.user = {
          ...state.user,
          avatar: action.payload,
        };
      }
    },
    setLoggingOut: (state, action: PayloadAction<boolean>) => {
      state.isLoggingOut = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.token = null;
      state.isLoggingOut = false;
      state.isInitializing = false;
      removeTokenCookie();
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    initializeAuth: (state) => {
      // Load token from cookie on app init
      const storedToken = getTokenCookie();
      if (storedToken) {
        state.token = storedToken;
        // Set loading to true so RouteGuard waits for token validation
        state.loading = true;
        // Keep isInitializing true - will be set to false after validation completes
      } else {
        // No token found, ensure loading is false
        state.loading = false;
        // No token means initialization is complete (nothing to validate)
        state.isInitializing = false;
      }
    },
    setInitializing: (state, action: PayloadAction<boolean>) => {
      state.isInitializing = action.payload;
    },
  },
});

export const { setUser, setToken, setRole, updateUserAvatar, logout, setLoading, initializeAuth, setLoggingOut, setInitializing } = authSlice.actions;
export default authSlice.reducer;
