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
import { certificatesApi } from './api/certificatesApi';
import { pricingApi } from './api/pricingApi';

export const makeStore = () => {
  return configureStore({
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
      [certificatesApi.reducerPath]: certificatesApi.reducer,
      [pricingApi.reducerPath]: pricingApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        usersApi.middleware,
        teamsApi.middleware,
        coursesApi.middleware,
        reportsApi.middleware,
        settingsApi.middleware,
        authApi.middleware,
        managerApi.middleware,
        certificatesApi.middleware,
        pricingApi.middleware
      ),
  });
};

// Infers the type of the store
export type AppStore = ReturnType<typeof makeStore>;
// Infers the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];