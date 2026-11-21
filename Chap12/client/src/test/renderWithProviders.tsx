import { configureStore } from "@reduxjs/toolkit";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import authReducer, { type AuthState } from "../features/auth/authSlice";

export const loggedOutState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Oikea store jokaiselle testille (ei mockattua Reduxia)
export function renderWithProviders(
  ui: ReactElement,
  {
    auth = loggedOutState,
    route = "/",
  }: { auth?: AuthState; route?: string } = {},
) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth },
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </Provider>,
    ),
  };
}
