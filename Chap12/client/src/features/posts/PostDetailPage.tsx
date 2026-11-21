import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { postsApi } from "../../api/endpoints";
import type { Post } from "../../types";

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    postsApi
      .getById(id)
      .then((p) => {
        if (!cancelled) setPost(p);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load post");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div>
        <p className="error">{error}</p>
        <Link to="/">Back</Link>
      </div>
    );
  }

  if (!post) {
    return <p>Loading post...</p>;
  }

  return (
    <article>
      <h1>{post.title}</h1>
      <p className="meta">
        by {post.author.username} on{" "}
        {new Date(post.createdAt).toLocaleDateString()}
      </p>
      <p className="content">{post.content}</p>
      <Link to="/">Back to posts</Link>
    </article>
  );
}
