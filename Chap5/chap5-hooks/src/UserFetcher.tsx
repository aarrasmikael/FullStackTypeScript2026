import { useState, useEffect } from "react";

type User = {
  id: number;
  name: string;
  email: string;
};

function UserFetcher() {
  const [userId, setUserId] = useState("1");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userId === "") {
      return;
    }

    fetch(`https://jsonplaceholder.typicode.com/users/${userId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Käyttäjää ei löytynyt");
        }
        return response.json();
      })
      .then((data: User) => {
        setUser(data);
        setError("");
      })
      .catch((err: Error) => {
        setUser(null);
        setError(err.message);
      });
  }, [userId]);

  return (
    <div>
      <h2>Hae käyttäjä</h2>
      <input
        type="number"
        min="1"
        max="10"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      {error && <p>{error}</p>}
      {user && (
        <p>
          {user.name} ({user.email})
        </p>
      )}
    </div>
  );
}

export default UserFetcher;