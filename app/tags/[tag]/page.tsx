import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllTags, getPostsByTag } from "@/lib/posts";
import { PostList } from "@/components/post-list";
import type { Metadata } from "next";

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((tag) => ({
    tag: encodeURIComponent(tag),
  }));
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `#${tag} | scottmckendry.tech`,
    description: `Posts tagged with #${tag}`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const posts = await getPostsByTag(decodedTag);

  if (posts.length === 0) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <header className="mb-12">
          <div className="text-grey mb-4 font-mono">
            <Link
              href="/"
              className="text-blue hover:text-cyan transition-colors"
            >
              $ cd ..
            </Link>
          </div>
          <div className="text-grey font-mono mb-2">{`$ grep -r "${decodedTag}" posts/`}</div>
          <h1 className="text-3xl text-magenta mb-2">#{decodedTag}</h1>
          <p className="text-grey text-sm">
            {posts.length} post{posts.length !== 1 ? "s" : ""}
          </p>
        </header>

        <PostList posts={posts} currentPage={1} totalPosts={posts.length} />

        <footer className="mt-12 pt-8 border-t border-border">
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
