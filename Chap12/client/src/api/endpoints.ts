import type { LoginResponse, Post, PostList, User } from "../types";
import { apiClient } from "./client";

export const authApi = {
  login: (email: string, password: string) =>
    apiClient<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  register: (email: string, password: string, username: string) =>
    apiClient<LoginResponse>("/auth/register", {
      method: "POST",
      body: { email, password, username },
    }),

  refresh: (signal?: AbortSignal) =>
    apiClient<{ accessToken: string }>("/auth/refresh", {
      method: "POST",
      signal,
    }),

  logout: () => apiClient<void>("/auth/logout", { method: "POST" }),

  logoutAll: () => apiClient<void>("/auth/sessions", { method: "DELETE" }),
};

export const postsApi = {
  getAll: () => apiClient<PostList>("/v1/posts"),
  getById: (id: string) => apiClient<Post>(`/v1/posts/${id}`),
  create: (data: { title: string; content: string }) =>
    apiClient<Post>("/v1/posts", { method: "POST", body: data }),
  update: (id: number, data: { title?: string; content?: string }) =>
    apiClient<Post>(`/v1/posts/${id}`, { method: "PUT", body: data }),
  delete: (id: number) =>
    apiClient<void>(`/v1/posts/${id}`, { method: "DELETE" }),
};

export const usersApi = {
  getProfile: () => apiClient<User>("/v1/users/me"),
  getAll: () => apiClient<User[]>("/v1/users"),
};
