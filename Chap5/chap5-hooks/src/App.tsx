import Greeting from "./Greeting";
import Counter from "./Counter";
import UserFetcher from "./UserFetcher";
import PostList from "./PostList";
import UserForm from "./UserForm";

function App() {
  return (
    <div>
      <h1>React hookeilla</h1>
      <Greeting name="Mikael" age={20} />
      <Greeting name="Matti" age={30} />
      <Counter />
      <UserFetcher />
      <PostList />
      <UserForm />
    </div>
  );
}

export default App;