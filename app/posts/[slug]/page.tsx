import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import type { Metadata } from "next";
import MermaidRenderer from "@/app/components/MermaidRenderer";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: `${post.frontmatter.title} | scottmckendry.tech`,
    description: post.frontmatter.summary,
    openGraph: {
      title: post.frontmatter.title,
      description: post.frontmatter.summary,
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.frontmatter.title,
      description: post.frontmatter.summary,
      images: ["/opengraph-image"],
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <header className="mb-8">
          <div className="text-grey font-mono mb-2">
            <Link
              href="/"
              className="text-blue hover:text-cyan transition-colors"
            >
              ~/
            </Link>
            <span className="text-grey">$ cat {slug}.md</span>
          </div>
          <h1 className="text-3xl text-cyan mb-4">{post.frontmatter.title}</h1>
          <div className="flex items-center gap-4 text-sm text-grey">
            <time dateTime={post.frontmatter.date}>
              {new Date(post.frontmatter.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <div className="flex gap-2">
              {post.frontmatter.tags?.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="text-magenta hover:text-cyan transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        </header>

        <article
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: post.htmlContent }}
        />
        <MermaidRenderer />

        <nav className="mt-6 pt-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue hover:text-cyan transition-colors"
          >
            <span>←</span>
            <span>cd ..</span>
          </Link>
          <a
            href={`https://github.com/scottmckendry/blog/edit/main/content/posts/${slug}.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-grey hover:text-cyan transition-colors text-sm"
          >
            edit this post
          </a>
        </nav>

        <footer className="mt-8 pt-8 border-t border-border">
          <div className="flex items-center justify-between text-sm text-grey">
            <span>$ echo $THEME</span>
            <a
              href="https://github.com/scottmckendry/cyberdream.nvim"
              className="text-cyan hover:text-blue transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              cyberdream.nvim
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
