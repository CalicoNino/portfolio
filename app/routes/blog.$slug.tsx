import { Link, data, useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { type ThemeKey } from "@/lib/themes";
import { useThemeColors } from "@/lib/use-theme-colors";
import { PirateIcon } from "@/components/icons/pirate-icon";
import { SunIcon } from "@/components/icons/sun-icon";
import { MoonIcon } from "@/components/icons/moon-icon";
import { GridIcon } from "@/components/icons/grid-icon";
import { getPostBySlug } from "@/lib/blog";

export async function loader({ params }: LoaderFunctionArgs) {
  const post = params.slug ? getPostBySlug(params.slug) : null;
  // Serve the not-found UI with a real 404 status so crawlers don't index it.
  return data(post, post ? 200 : 404);
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [{ title: "Post Not Found | Calico Nino" }];
  return [
    { title: `${data.title} | Calico Nino` },
    { name: "description", content: data.excerpt },
    { property: "og:title", content: `${data.title} | Calico Nino` },
    { property: "og:description", content: data.excerpt },
    { property: "og:type", content: "article" },
    { name: "twitter:title", content: `${data.title} | Calico Nino` },
    { name: "twitter:description", content: data.excerpt },
  ];
};

function NavIconLink({ to, label, tooltip, children }: {
  to: string; label: string; tooltip: string; children: React.ReactNode;
}) {
  return (
    <div className="relative group">
      <Link
        to={to}
        className="inline-flex items-center gap-2 text-sm font-mono text-primary hover:text-accent transition-colors duration-300"
        aria-label={label}
      >
        {children}
      </Link>
      <span className="absolute left-0 top-full mt-2 px-3 py-1.5 bg-card border border-primary/50 rounded text-xs font-mono text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
        {tooltip}
      </span>
    </div>
  );
}

function BlogNav() {
  return (
    <div className="flex items-center gap-3">
      <NavIconLink to="/" label="Go to home" tooltip="Go to home">
        <PirateIcon className="w-5 h-5" />
      </NavIconLink>
      <NavIconLink to="/blog" label="View all blogs" tooltip="All blog posts">
        <GridIcon className="w-5 h-5" />
      </NavIconLink>
    </div>
  );
}

export default function BlogPost() {
  const post = useLoaderData<typeof loader>();
  const [isDark, setIsDark] = useState(true);
  const [activeTheme, setActiveTheme] = useState<ThemeKey>("rust");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useThemeColors(activeTheme, isDark);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-mono text-primary">404</h1>
          <p className="text-muted-foreground">Blog post not found</p>
          <Link to="/blog" className="text-primary hover:text-accent font-mono">
            ← back to blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
        {/* Header */}
        <div className="space-y-6 sm:space-y-8 mb-8 sm:mb-12">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <BlogNav />

            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                {["rust", "go", "typescript", "python", "sql", "java"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveTheme(lang as ThemeKey)}
                    className={`px-2 py-1 text-xs font-mono border rounded transition-all duration-300 cursor-pointer ${
                      activeTheme === lang
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border hover:border-primary text-muted-foreground"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg border border-border hover:border-primary hover:bg-primary/10 transition-all duration-300 cursor-pointer"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <SunIcon className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                ) : (
                  <MoonIcon className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono flex-wrap">
              <span className="text-primary">{post.date}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{post.readTime}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">Updated: {post.updatedAt}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light leading-tight">{post.title}</h1>

            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 text-xs font-mono text-accent border border-border rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Markdown Content */}
        <div className="prose prose-sm sm:prose-base lg:prose-lg prose-invert max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-3xl sm:text-4xl font-light mt-12 mb-6 text-foreground">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl sm:text-3xl font-light mt-10 mb-4 text-foreground">
                  <span className="text-primary font-mono text-xl">{"// "}</span>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl sm:text-2xl font-medium mt-8 mb-3 text-foreground">{children}</h3>
              ),
              p: ({ children }) => <p className="text-muted-foreground leading-relaxed mb-6">{children}</p>,
              code: ({ children, className }) => {
                const isBlock = className?.includes("language-");
                return isBlock ? (
                  <code className="block bg-card border border-border rounded-lg p-4 my-6 overflow-x-auto font-mono text-sm text-foreground">
                    {children}
                  </code>
                ) : (
                  <code className="bg-card border border-border rounded px-2 py-0.5 font-mono text-sm text-accent">
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => <div className="my-6">{children}</div>,
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-2 mb-6 text-muted-foreground">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-2 mb-6 text-muted-foreground">{children}</ol>
              ),
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary pl-4 italic my-6 text-muted-foreground">
                  {children}
                </blockquote>
              ),
              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
              a: ({ children, href }) => (
                <a
                  href={href}
                  className="text-primary hover:text-accent underline transition-colors duration-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Footer */}
        <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-border">
          <BlogNav />
        </div>
      </article>
    </div>
  );
}
