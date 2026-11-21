import { useActionState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { login } from "./authSlice";

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { error } = useAppSelector((state) => state.auth);

  // ProtectedRoute tallensi tähän paikan, jonne käyttäjä oli menossa
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? "/";

  // React 19 nollaa lomakkeen kentät action-kutsun jälkeen. Palautetaan viimeksi syötetty
  // sähköposti tilana ja käytetään sitä defaultValuena, ettei sitä tarvitse kirjoittaa uudelleen.
  // Salasanaa ei muisteta tarkoituksella.
  const [formState, submitAction, isPending] = useActionState(
    async (_prev: { email: string }, formData: FormData) => {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      const result = await dispatch(login({ email, password }));
      if (login.fulfilled.match(result)) {
        navigate(from, { replace: true });
      }
      return { email };
    },
    { email: "" },
  );

  return (
    <form action={submitAction}>
      <h1>Log In</h1>
      {error && <p className="error">{error}</p>}
      <input
        name="email"
        type="email"
        placeholder="Email"
        defaultValue={formState.email}
        required
      />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit" disabled={isPending}>
        {isPending ? "Logging in..." : "Log In"}
      </button>
      <p>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </form>
  );
}
