import { Navigate, Outlet } from "react-router";
import { useAppSelector } from "../store/hooks";

// Toinen tarkistus autentikoinnin päälle: vain ADMIN.
// Tämä on vain UX:aa varten, palvelin tarkistaa roolin aina itse (403).
export function AdminRoute() {
  const { user, isAuthenticated, isLoading } = useAppSelector(
    (state) => state.auth,
  );

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
