import { logoutAll } from "../auth/authSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

export function ProfilePage() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();

  if (!user) return null;

  return (
    <div>
      <h1>Profile</h1>
      <dl>
        <dt>Username</dt>
        <dd>{user.username}</dd>
        <dt>Email</dt>
        <dd>{user.email}</dd>
        <dt>Role</dt>
        <dd>{user.role}</dd>
      </dl>
      <button onClick={() => dispatch(logoutAll())}>
        Log out from all devices
      </button>
    </div>
  );
}
