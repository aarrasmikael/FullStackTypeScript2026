export type Role = "USER" | "MODERATOR" | "ADMIN";

export interface User {
  id: number;
  email: string;
  username: string;
  role: Role;
  createdAt: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  createdAt: string;
  updatedAt: string;
  author: { id: number; username: string };
}

export interface PostList {
  data: Post[];
  total: number;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}
