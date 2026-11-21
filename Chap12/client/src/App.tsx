import { useEffect, type ReactNode } from "react";
import { Provider } from "react-redux";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { initializeAuth } from "./features/auth/authSlice";
import { AppRouter } from "./routes/AppRouter";
import { store } from "./store";
import { useAppDispatch } from "./store/hooks";

// Ennen kuin mikään reitti renderoituu, tarkistetaan onko käyttäjällä voimassa oleva sessio
function AuthInitializer({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return <>{children}</>;
}

export default function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary fallback={<p>Something went wrong.</p>}>
        <AuthInitializer>
          <AppRouter />
        </AuthInitializer>
      </ErrorBoundary>
    </Provider>
  );
}
