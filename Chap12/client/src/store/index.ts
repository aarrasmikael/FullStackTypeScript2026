import { configureStore } from "@reduxjs/toolkit";
import { setAuthFailureHandler } from "../api/token";
import authReducer, { sessionExpired } from "../features/auth/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// Kun API client ei saa sessiota uusittua, Redux-tila nollataan ja ProtectedRoute
// ohjaa käyttäjän kirjautumissivulle
setAuthFailureHandler(() => store.dispatch(sessionExpired()));

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
