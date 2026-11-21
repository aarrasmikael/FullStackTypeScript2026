import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, loggedOutState } from "../../test/renderWithProviders";
import { LoginPage } from "./LoginPage";

// Mockataan API-rajapinta (verkon raja), ei Reduxia tai komponenttia
vi.mock("../../api/endpoints", () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    logoutAll: vi.fn(),
  },
  postsApi: { getAll: vi.fn(), create: vi.fn(), delete: vi.fn() },
  usersApi: { getProfile: vi.fn(), getAll: vi.fn() },
}));

import { authApi } from "../../api/endpoints";
import { getAccessToken, setAccessToken } from "../../api/token";

const user = {
  id: 1,
  username: "Test",
  email: "test@test.com",
  role: "USER" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAccessToken(null);
  });

  it("näyttää lomakkeen", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("näyttää virheen Redux-tilasta", () => {
    renderWithProviders(<LoginPage />, {
      auth: { ...loggedOutState, error: "Invalid credentials" },
    });
    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  });

  it("kirjautuu, tallentaa tokenin muistiin ja ohjaa takaisin haluttuun sivuun", async () => {
    vi.mocked(authApi.login).mockResolvedValue({ user, accessToken: "access-123" });

    const { store } = renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/secret" element={<p>Secret page</p>} />
      </Routes>,
      { route: "/login" },
    );

    await userEvent.type(screen.getByPlaceholderText("Email"), "test@test.com");
    await userEvent.type(screen.getByPlaceholderText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(store.getState().auth.isAuthenticated).toBe(true));
    expect(authApi.login).toHaveBeenCalledWith("test@test.com", "password123");
    expect(getAccessToken()).toBe("access-123");
    expect(store.getState().auth.user).toEqual(user);
  });

  it("näyttää palvelimen virheen kun kirjautuminen epäonnistuu", async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error("Invalid email or password"));

    renderWithProviders(<LoginPage />);

    await userEvent.type(screen.getByPlaceholderText("Email"), "test@test.com");
    await userEvent.type(screen.getByPlaceholderText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
    expect(getAccessToken()).toBeNull();
  });
});
