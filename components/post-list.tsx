import Link from "next/link";
import type { Post } from "@/lib/posts";
import { getTotalPages } from "@/lib/posts";

interface PostListProps {
  posts: Post[];
  currentPage: number;
  totalPosts: number;
}

export function PostList({ posts, currentPage, totalPosts }: PostListProps) {
  const totalPages = getTotalPages(totalPosts);

  return (
    <section>
      {posts.length === 0 ? (
        <div className="text-grey">
          <p>No posts found. Add markdown files to /content/posts/</p>
        </div>
      ) : (
        <>
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/posts/${post.slug}`}
                  className="block border border-border bg-background-alt p-4 hover:border-cyan transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm text-grey mb-1 overflow-hidden">
                        <span className="shrink-0">
                          {new Date(post.frontmatter.date).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </span>
                        <span className="shrink-0">•</span>
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
                          {post.frontmatter.tags?.map((tag) => (
                            <span key={tag} className="text-magenta">
                              #{tag}{" "}
                            </span>
                          ))}
                        </div>
                      </div>
                      <h2 className="text-lg text-cyan group-hover:text-blue transition-colors">
                        {post.frontmatter.title}
                      </h2>
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                        {post.frontmatter.summary}
                      </p>
                    </div>
                    <span className="text-green shrink-0 group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-4 mt-8 font-mono text-sm">
              {currentPage > 1 ? (
                <Link
                  href={currentPage === 2 ? "/" : `/page/${currentPage - 1}`}
                  className="text-blue hover:text-cyan transition-colors"
                >
                  ← prev
                </Link>
              ) : (
                <span className="text-grey">← prev</span>
              )}

              <span className="text-grey">
                {currentPage} / {totalPages}
              </span>

              {currentPage < totalPages ? (
                <Link
                  href={`/page/${currentPage + 1}`}
                  className="text-blue hover:text-cyan transition-colors"
                >
                  next →
                </Link>
              ) : (
                <span className="text-grey">next →</span>
              )}
            </nav>
          )}
        </>
      )}
    </section>
  );
}
