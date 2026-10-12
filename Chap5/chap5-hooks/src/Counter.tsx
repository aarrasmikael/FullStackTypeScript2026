import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Painalluksia: {count}</p>
      <button onClick={() => setCount(count + 1)}>Lisää</button>
      <button onClick={() => setCount(0)}>Nollaa</button>
    </div>
  );
}

export default Counter;