import { useActionState } from "react";
import { Link, useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { register } from "./authSlice";

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { error } = useAppSelector((state) => state.auth);

  // Kentät nollautuvat action-kutsun jälkeen, joten username ja email palautetaan tilana
  const [formState, submitAction, isPending] = useActionState(
    async (_prev: { username: string; email: string }, formData: FormData) => {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const username = formData.get("username") as string;

      const result = await dispatch(register({ email, password, username }));
      if (register.fulfilled.match(result)) {
        navigate("/", { replace: true });
      }
      return { username, email };
    },
    { username: "", email: "" },
  );

  return (
    <form action={submitAction}>
      <h1>Register</h1>
      {error && <p className="error">{error}</p>}
      <input
        name="username"
        placeholder="Username"
        defaultValue={formState.username}
        minLength={2}
        required
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        defaultValue={formState.email}
        required
      />
      <input
        name="password"
        type="password"
        placeholder="Password (min 8 characters)"
        minLength={8}
        required
      />
      <button type="submit" disabled={isPending}>
        {isPending ? "Creating account..." : "Register"}
      </button>
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
}
