import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { renderWithProviders, loggedOutState } from "../test/renderWithProviders";
import { AdminRoute } from "./AdminRoute";
import { ProtectedRoute } from "./ProtectedRoute";

const user = {
  id: 1,
  username: "Test",
  email: "test@test.com",
  role: "USER" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const tree = (
  <Routes>
    <Route path="/login" element={<p>Login page</p>} />
    <Route element={<ProtectedRoute />}>
      <Route path="/" element={<p>Home page</p>} />
    </Route>
    <Route element={<AdminRoute />}>
      <Route path="/admin" element={<p>Admin page</p>} />
    </Route>
  </Routes>
);

describe("ProtectedRoute", () => {
  it("ohjaa kirjautumattoman käyttäjän /login-sivulle", () => {
    renderWithProviders(tree, { route: "/" });
    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Home page")).not.toBeInTheDocument();
  });

  it("näyttää suojatun sivun kirjautuneelle", () => {
    renderWithProviders(tree, {
      route: "/",
      auth: { ...loggedOutState, isAuthenticated: true, user },
    });
    expect(screen.getByText("Home page")).toBeInTheDocument();
  });

  it("näyttää latausnäytön eikä ohjaa ennen kuin sessio on tarkistettu", () => {
    renderWithProviders(tree, {
      route: "/",
      auth: { ...loggedOutState, isLoading: true },
    });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });
});

describe("AdminRoute", () => {
  it("ohjaa tavallisen käyttäjän etusivulle", () => {
    renderWithProviders(tree, {
      route: "/admin",
      auth: { ...loggedOutState, isAuthenticated: true, user },
    });
    expect(screen.getByText("Home page")).toBeInTheDocument();
    expect(screen.queryByText("Admin page")).not.toBeInTheDocument();
  });

  it("päästää ADMINin sisään", () => {
    renderWithProviders(tree, {
      route: "/admin",
      auth: {
        ...loggedOutState,
        isAuthenticated: true,
        user: { ...user, role: "ADMIN" },
      },
    });
    expect(screen.getByText("Admin page")).toBeInTheDocument();
  });

  it("ohjaa kirjautumattoman /login-sivulle", () => {
    renderWithProviders(tree, { route: "/admin" });
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });
});
