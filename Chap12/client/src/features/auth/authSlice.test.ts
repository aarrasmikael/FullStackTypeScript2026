import { describe, expect, it } from "vitest";
import authReducer, {
  clearError,
  initializeAuth,
  login,
  logout,
  sessionExpired,
  type AuthState,
} from "./authSlice";

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const user = {
  id: 1,
  username: "Test",
  email: "test@test.com",
  role: "USER" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("auth reducer", () => {
  it("palauttaa alkutilan: lataus käynnissä, ei kirjautunut", () => {
    expect(authReducer(undefined, { type: "unknown" })).toEqual(initialState);
  });

  it("tyhjentää virheen", () => {
    const state = authReducer({ ...initialState, error: "Virhe" }, clearError());
    expect(state.error).toBeNull();
  });

  it("asettaa käyttäjän kun login onnistuu", () => {
    const state = authReducer(initialState, {
      type: login.fulfilled.type,
      payload: user,
    });
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(user);
    expect(state.isLoading).toBe(false);
  });

  it("tallentaa virheviestin kun login epäonnistuu", () => {
    const state = authReducer(initialState, {
      type: login.rejected.type,
      payload: "Invalid email or password",
    });
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe("Invalid email or password");
    expect(state.isLoading).toBe(false);
  });

  it("tyhjentää käyttäjän kun logout onnistuu", () => {
    const state = authReducer(
      { ...initialState, isAuthenticated: true, isLoading: false, user },
      { type: logout.fulfilled.type },
    );
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it("initializeAuth.fulfilled palauttaa käyttäjän sivun päivityksen jälkeen", () => {
    const state = authReducer(initialState, {
      type: initializeAuth.fulfilled.type,
      payload: user,
    });
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it("initializeAuth.rejected lopettaa latauksen mutta ei kirjaa sisään", () => {
    const state = authReducer(initialState, { type: initializeAuth.rejected.type });
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it("sessionExpired kirjaa ulos ja kertoo syyn", () => {
    const state = authReducer(
      { ...initialState, isAuthenticated: true, isLoading: false, user },
      sessionExpired(),
    );
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.error).toMatch(/session has expired/i);
  });
});
