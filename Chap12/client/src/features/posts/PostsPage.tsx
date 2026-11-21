import { useEffect, useOptimistic, useState, useTransition } from "react";
import { Link } from "react-router";
import { postsApi } from "../../api/endpoints";
import { useAppSelector } from "../../store/hooks";
import type { Post } from "../../types";

export function PostsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Optimistinen poisto: postaus katoaa listalta heti, ja palaa takaisin jos palvelin hylkää
  const [optimisticPosts, removeOptimistic] = useOptimistic(
    posts,
    (current, deletedId: number) => current.filter((p) => p.id !== deletedId),
  );
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    postsApi
      .getAll()
      .then((res) => {
        if (!cancelled) setPosts(res.data);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load posts");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleDelete(id: number) {
    setError(null);
    startTransition(async () => {
      removeOptimistic(id);
      try {
        await postsApi.delete(id);
        setPosts((prev) => prev.filter((p) => p.id !== id));
      } catch (e) {
        // optimistinen tila palautuu itse, koska oikeaa posts-tilaa ei muutettu
        setError(e instanceof Error ? e.message : "Failed to delete post");
      }
    });
  }

  // UX:aa varten: palvelin tarkistaa oikeudet silti aina
  const canModify = (post: Post) =>
    user !== null &&
    (user.id === post.authorId ||
      user.role === "ADMIN" ||
      user.role === "MODERATOR");

  if (isLoading) {
    return <p>Loading posts...</p>;
  }

  return (
    <div>
      <h1>Posts</h1>
      <Link to="/posts/new">Create Post</Link>
      {error && <p className="error">{error}</p>}
      {optimisticPosts.length === 0 && <p>No posts yet.</p>}
      {optimisticPosts.map((post) => (
        <article key={post.id}>
          <Link to={`/posts/${post.id}`}>
            <h2>{post.title}</h2>
          </Link>
          <p className="meta">by {post.author.username}</p>
          <p>
            {post.content.slice(0, 150)}
            {post.content.length > 150 ? "..." : ""}
          </p>
          {canModify(post) && (
            <button onClick={() => handleDelete(post.id)}>Delete</button>
          )}
        </article>
      ))}
    </div>
  );
}
