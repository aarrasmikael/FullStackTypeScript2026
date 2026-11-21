import { Navigate, Outlet, useLocation } from "react-router";
import { useAppSelector } from "../store/hooks";

// Suojattu reitti: ei kirjautunutta -> ohjaus /login, ja muistetaan mihin oltiin menossa
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
