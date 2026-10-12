import { Suspense, use } from "react";

type Post = {
  id: number;
  title: string;
};

const postsPromise: Promise<Post[]> = new Promise((resolve) => {
  setTimeout(() => {
    fetch("https://jsonplaceholder.typicode.com/posts?_limit=5")
      .then((response) => response.json())
      .then((data: Post[]) => resolve(data));
  }, 2000);
});

function Posts({ promise }: { promise: Promise<Post[]> }) {
  const posts = use(promise);

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

function PostList() {
  return (
    <div>
      <h2>Postaukset</h2>
      <Suspense fallback={<p>Ladataan...</p>}>
        <Posts promise={postsPromise} />
      </Suspense>
    </div>
  );
}

export default PostList;