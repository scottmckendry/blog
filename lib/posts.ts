import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { codeToHtml } from "shiki";

const postsDirectory = path.join(process.cwd(), "content/posts");

export interface PostFrontmatter {
  title: string;
  date: string;
  tags: string[];
  summary: string;
  url?: string;
}

export interface Post {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
  htmlContent: string;
}

// Cyberdream theme for Shiki
const cyberdreamTheme = {
  name: "cyberdream",
  type: "dark" as const,
  colors: {
    "editor.background": "#16181a",
    "editor.foreground": "#ffffff",
  },
  tokenColors: [
    // Comment
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "#7b8496" },
    },
    // Strings
    { scope: ["string", "string.quoted"], settings: { foreground: "#5eff6c" } },
    // String interpolation / escape
    {
      scope: ["constant.character.escaped", "constant.character.escape"],
      settings: { foreground: "#ff5ef1" },
    },
    // Numbers
    { scope: ["constant.numeric"], settings: { foreground: "#ffffff" } },
    // Constants
    {
      scope: [
        "constant.language",
        "constant.character",
        "constant.other",
        "support.constant",
      ],
      settings: { foreground: "#ffffff" },
    },
    // Keywords
    { scope: ["keyword"], settings: { foreground: "#ffbd5e" } },
    // Keyword operators
    { scope: ["keyword.operator"], settings: { foreground: "#bd5eff" } },
    // Storage
    { scope: ["storage"], settings: { foreground: "#ff5ea0" } },
    // Storage type (let, const, type, etc)
    {
      scope: ["storage.type", "storage.modifier"],
      settings: { foreground: "#5ef1ff", fontStyle: "italic" },
    },
    // Class / type names
    {
      scope: [
        "entity.name.type",
        "entity.name.class",
        "support.type",
        "support.class",
      ],
      settings: { foreground: "#bd5eff", fontStyle: "italic" },
    },
    // Inherited class
    {
      scope: ["entity.other.inherited-class"],
      settings: { foreground: "#bd5eff" },
    },
    // Functions
    {
      scope: ["entity.name.function", "support.function", "variable.function"],
      settings: { foreground: "#5ea1ff" },
    },
    // Function parameters
    {
      scope: ["variable.parameter"],
      settings: { foreground: "#bd5eff", fontStyle: "italic" },
    },
    // Variables
    {
      scope: ["variable", "variable.other"],
      settings: { foreground: "#ffffff" },
    },
    // Language variables (this, self, super)
    { scope: ["variable.language"], settings: { foreground: "#bd5eff" } },
    // Instance variables (@var)
    {
      scope: ["variable.other.readwrite.instance"],
      settings: { foreground: "#ffbd5e" },
    },
    // Tags
    { scope: ["entity.name.tag"], settings: { foreground: "#5ef1ff" } },
    // Tag attributes
    {
      scope: ["entity.other.attribute-name"],
      settings: { foreground: "#5ef1ff" },
    },
    // Generic punctuation / braces
    {
      scope: ["punctuation", "meta.brace"],
      settings: { foreground: "#7b8496" },
    },
    // Accessor / separator punctuation
    {
      scope: ["punctuation.accessor", "punctuation.separator.namespace"],
      settings: { foreground: "#ff5ea0" },
    },
    // Embedded punctuation
    {
      scope: [
        "punctuation.section.embedded.begin",
        "punctuation.section.embedded.end",
      ],
      settings: { foreground: "#ff5ea0" },
    },
    // CSS property names
    {
      scope: ["support.type.property-name"],
      settings: { foreground: "#5ef1ff" },
    },
    // Diff
    { scope: ["markup.deleted"], settings: { foreground: "#ff6e5e" } },
    { scope: ["markup.inserted"], settings: { foreground: "#5eff6c" } },
    { scope: ["markup.changed"], settings: { foreground: "#5ef1ff" } },
    // Filename
    { scope: ["entity.name.filename"], settings: { foreground: "#5eff6c" } },
    // Invalid
    {
      scope: ["invalid"],
      settings: { foreground: "#ffffff", background: "#ff5ea0" },
    },
    {
      scope: ["invalid.deprecated"],
      settings: { foreground: "#ffffff", background: "#bd5eff" },
    },
  ],
};

async function highlightCode(code: string, lang: string): Promise<string> {
  try {
    return await codeToHtml(code, {
      lang: lang || "text",
      theme: cyberdreamTheme,
    });
  } catch {
    // Fallback for unsupported languages
    return `<pre class="shiki" style="background-color:#16181a"><code>${escapeHtml(code)}</code></pre>`;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function processMarkdown(content: string): Promise<string> {
  // Extract code blocks and replace with placeholders
  const codeBlocks: { placeholder: string; lang: string; code: string }[] = [];
  let codeBlockIndex = 0;

  const contentWithPlaceholders = content.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_, lang, code) => {
      const placeholder = `CODEPLACEHOLDER${codeBlockIndex}ENDPLACEHOLDER`;
      codeBlocks.push({ placeholder, lang: lang || "text", code: code.trim() });
      codeBlockIndex++;
      return placeholder;
    },
  );

  // Process custom shortcodes
  let processedContent = contentWithPlaceholders;

  // Process alerts: {{< alert icon=lightbulb >}}...{{</ alert >}} or {{< alert >}}...{{</ alert >}}
  processedContent = processedContent.replace(
    /\{\{<\s*alert(?:\s+icon=(\w+))?\s*>\}\}([\s\S]*?)\{\{<\s*\/alert\s*>\}\}/g,
    (_, icon, alertContent) => {
      const iconType = icon || "info";
      const alertType =
        iconType === "lightbulb"
          ? "tip"
          : iconType === "warning"
            ? "warning"
            : "info";
      const label =
        iconType === "lightbulb"
          ? "TIP"
          : iconType === "warning"
            ? "WARNING"
            : "NOTE";
      return `<div class="alert alert-${alertType}"><span class="alert-label">${label}</span><div>${alertContent.trim()}</div></div>`;
    },
  );

  // Process GitHub repos: {{< github repo="user/repo" >}}
  processedContent = processedContent.replace(
    /\{\{<\s*github\s+repo="([^"]+)"\s*>\}\}/g,
    (_, repo) => {
      return `<a href="https://github.com/${repo}" target="_blank" rel="noopener noreferrer" class="github-card">github.com/${repo}</a>`;
    },
  );

  // Process YouTube embeds: {{< youtube id >}}
  processedContent = processedContent.replace(
    /\{\{<\s*youtube\s+([a-zA-Z0-9_-]+)\s*>\}\}/g,
    (_, id) => {
      return `<div class="my-6 aspect-video"><iframe src="https://www.youtube.com/embed/${id}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="w-full h-full"></iframe></div>`;
    },
  );

  // Process lead shortcode: {{< lead >}}...{{< /lead >}}
  processedContent = processedContent.replace(
    /\{\{<\s*lead\s*>\}\}([\s\S]*?)\{\{<\s*\/lead\s*>\}\}/g,
    (_, content) => {
      return `<p class="text-lg text-cyan leading-relaxed mb-6">${content.trim()}</p>`;
    },
  );

  // Process button shortcode: {{< button href="url" >}}...{{< /button >}}
  processedContent = processedContent.replace(
    /\{\{<\s*button\s+href="([^"]+)"\s*>\}\}([\s\S]*?)\{\{<\s*\/button\s*>\}\}/g,
    (_, href, content) => {
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="inline-block border border-border bg-background-alt text-cyan px-4 py-2 hover:border-cyan transition-colors my-4">${content.trim()}</a>`;
    },
  );

  // Process article shortcode: {{< article link="/slug/" >}}
  processedContent = processedContent.replace(
    /\{\{<\s*article\s+link="([^"]+)"\s*>\}\}/g,
    (_, link) => {
      return `<blockquote class="border-l-4 border-cyan pl-4 my-4"><p class="text-grey">Related article: <a href="${link}" class="text-blue hover:text-cyan underline underline-offset-2">${link}</a></p></blockquote>`;
    },
  );

  // Process mermaid shortcode: {{< mermaid >}}...{{< /mermaid >}}
  processedContent = processedContent.replace(
    /\{\{<\s*mermaid\s*>\}\}([\s\S]*?)\{\{<\s*\/mermaid\s*>\}\}/g,
    (_, diagram) => {
      return `<pre class="mermaid bg-background-alt border border-border p-4 my-4 overflow-x-auto">${diagram.trim()}</pre>`;
    },
  );

  // Convert markdown to HTML using remark
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(processedContent);

  let html = String(result);

  // Replace code block placeholders with highlighted code
  // The placeholder may be wrapped in <p> tags by remark, so we need to handle that
  for (const block of codeBlocks) {
    const highlighted = await highlightCode(block.code, block.lang);
    // Remove any <p> wrapper around the placeholder
    html = html.replace(
      new RegExp(`<p>${block.placeholder}</p>`, "g"),
      highlighted,
    );
    html = html.replace(block.placeholder, highlighted);
  }

  return html;
}

export function getPostSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  return fs.readdirSync(postsDirectory).filter((file) => file.endsWith(".md"));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const realSlug = slug.replace(/\.md$/, "");
  const fullPath = path.join(postsDirectory, `${realSlug}.md`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const htmlContent = await processMarkdown(content);

  return {
    slug: realSlug,
    frontmatter: data as PostFrontmatter,
    content,
    htmlContent,
  };
}

export async function getAllPosts(): Promise<Post[]> {
  const slugs = getPostSlugs();
  const posts = await Promise.all(
    slugs.map((slug) => getPostBySlug(slug.replace(/\.md$/, ""))),
  );

  return posts
    .filter((post): post is Post => post !== null)
    .sort(
      (a, b) =>
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime(),
    );
}

export async function getAllTags(): Promise<string[]> {
  const posts = await getAllPosts();
  const tagSet = new Set<string>();
  for (const post of posts) {
    for (const tag of post.frontmatter.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort();
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts.filter((post) =>
    post.frontmatter.tags?.some((t) => t.toLowerCase() === tag.toLowerCase()),
  );
}

export const POSTS_PER_PAGE = 5;

export function getTotalPages(totalPosts: number): number {
  return Math.max(1, Math.ceil(totalPosts / POSTS_PER_PAGE));
}
