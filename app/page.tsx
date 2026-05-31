import { getAllPosts, POSTS_PER_PAGE } from "@/lib/posts";
import { PostList } from "@/components/post-list";

export default async function HomePage() {
  const allPosts = await getAllPosts();
  const totalPosts = allPosts.length;
  const posts = allPosts.slice(0, POSTS_PER_PAGE);

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <header className="mb-4">
          <div className="text-grey mb-2 font-mono">$ whoami</div>
          <h1 className="text-3xl text-cyan mb-4">scottmckendry</h1>
          <p className="text-foreground mb-6">
            building things incorrectly, in public. the way it&apos;s meant to
            be.
          </p>

          <div className="font-mono space-y-1 mb-8">
            <div className="text-grey">$ cat ~/.social</div>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <a
                href="https://github.com/scottmckendry"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green hover:text-cyan transition-colors inline-flex items-center gap-1"
              >
                github
              </a>
              <a
                href="https://linkedin.com/in/scott-mckendry"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue hover:text-cyan transition-colors inline-flex items-center gap-1"
              >
                linkedin
              </a>
              <a
                href="https://twitter.com/scott_mckendry"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan hover:text-blue transition-colors inline-flex items-center gap-1"
              >
                twitter
              </a>
              <a
                href="mailto:me@scottmckendry.tech"
                className="text-magenta hover:text-cyan transition-colors inline-flex items-center gap-1"
              >
                email
              </a>
            </div>
          </div>
          <div className="text-grey font-mono">$ ls posts/</div>
        </header>

        <PostList posts={posts} currentPage={1} totalPosts={totalPosts} />

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
