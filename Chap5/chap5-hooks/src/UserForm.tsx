import { useActionState, useState } from "react";

type User = {
  name: string;
};

function UserForm() {
  const [users, setUsers] = useState<User[]>([]);

  const [_formState, submitAction] = useActionState(
    (_prevState: null, formData: FormData) => {
      const name = String(formData.get("name") ?? "").trim();

      if (name !== "") {
        const user: User = { name };
        setUsers((prevUsers) => [...prevUsers, user]);
      }

      return null;
    },
    null,
  );

  return (
    <div>
      <h2>Lisää käyttäjä</h2>
      <form action={submitAction}>
        <input type="text" name="name" placeholder="Nimi" />
        <button type="submit">Lisää</button>
      </form>
      <ul>
        {users.map((user, index) => (
          <li key={index}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default UserForm;