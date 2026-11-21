import { BrowserRouter, Route, Routes } from "react-router";
import { Layout } from "../components/Layout";
import { AdminPage } from "../features/admin/AdminPage";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterPage } from "../features/auth/RegisterPage";
import { CreatePostPage } from "../features/posts/CreatePostPage";
import { PostDetailPage } from "../features/posts/PostDetailPage";
import { PostsPage } from "../features/posts/PostsPage";
import { ProfilePage } from "../features/profile/ProfilePage";
import { AdminRoute } from "./AdminRoute";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Julkiset reitit */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Suojatut reitit */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<PostsPage />} />
            <Route path="/posts/new" element={<CreatePostPage />} />
            <Route path="/posts/:id" element={<PostDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Vain ADMIN */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
