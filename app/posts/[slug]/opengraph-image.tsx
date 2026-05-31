import { ImageResponse } from "next/og";
import { getPostBySlug, getAllPosts } from "@/lib/posts";

export const dynamic = "force-static";
export const alt = "scottmckendry.tech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function PostOGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#16181a",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        fontFamily: '"Menlo", "Monaco", "Courier New", monospace',
      }}
    >
      <div
        style={{
          display: "flex",
          color: "#7b8496",
          fontSize: 28,
          marginBottom: 16,
        }}
      >
        $ cat {slug}.md
      </div>
      <div
        style={{
          display: "flex",
          color: "#5ef1ff",
          fontSize: 56,
          fontWeight: 700,
          lineHeight: 1.2,
          marginBottom: 24,
        }}
      >
        {post?.frontmatter.title ?? slug}
      </div>
      {post?.frontmatter.tags && post.frontmatter.tags.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 12,
            color: "#ff5ef1",
            fontSize: 22,
            marginBottom: 32,
          }}
        >
          {post.frontmatter.tags.map((tag) => `#${tag}`).join("  ")}
        </div>
      )}
      <div
        style={{
          display: "flex",
          width: "100%",
          height: 2,
          background: "#3c4048",
          marginBottom: 32,
        }}
      />
      <div
        style={{
          display: "flex",
          color: "#7b8496",
          fontSize: 22,
        }}
      >
        scottmckendry.tech
      </div>
    </div>,
    { ...size },
  );
}
