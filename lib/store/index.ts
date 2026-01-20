import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import localeReducer from './slices/localeSlice';
import { usersApi } from './api/userApi';
import { teamsApi } from './api/teamApi';
import { coursesApi } from './api/coursesApi';
import { reportsApi } from './api/reportsApi';
import { settingsApi } from './api/settingsApi';
import { authApi } from './api/authApi';
import { managerApi } from './api/managerApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    locale: localeReducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [teamsApi.reducerPath]: teamsApi.reducer,
    [coursesApi.reducerPath]: coursesApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [managerApi.reducerPath]: managerApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      usersApi.middleware,
      teamsApi.middleware,
      coursesApi.middleware,
      reportsApi.middleware,
      settingsApi.middleware,
      authApi.middleware,
      managerApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;