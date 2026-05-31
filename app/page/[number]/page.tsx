import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPosts, POSTS_PER_PAGE, getTotalPages } from "@/lib/posts";
import { PostList } from "@/components/post-list";

interface PageProps {
  params: Promise<{ number: string }>;
}

export async function generateStaticParams() {
  const totalPosts = (await getAllPosts()).length;
  const totalPages = getTotalPages(totalPosts);
  return Array.from({ length: totalPages - 1 }, (_, i) => ({
    number: String(i + 2),
  }));
}

export default async function PagePage({ params }: PageProps) {
  const { number } = await params;
  const pageNum = parseInt(number, 10);

  if (isNaN(pageNum) || pageNum < 2) {
    notFound();
  }

  const allPosts = await getAllPosts();
  const totalPosts = allPosts.length;
  const totalPages = getTotalPages(totalPosts);

  if (pageNum > totalPages) {
    notFound();
  }

  const start = (pageNum - 1) * POSTS_PER_PAGE;
  const posts = allPosts.slice(start, start + POSTS_PER_PAGE);

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
          <div className="text-grey font-mono">
            $ ls posts/ | tail -n +{start + 1}
          </div>
        </header>

        <PostList posts={posts} currentPage={pageNum} totalPosts={totalPosts} />

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
