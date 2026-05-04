import { Link } from "react-router";
import type { MetaFunction } from "react-router";
import { useEffect, useState } from "react";

export const meta: MetaFunction = () => [
  { title: "Thoughts | Calico Nino" },
  { name: "description", content: "Writing about code, systems, history, and whatever else is on my mind." },
  { property: "og:title", content: "Thoughts | Calico Nino" },
  { property: "og:description", content: "Writing about code, systems, history, and whatever else is on my mind." },
];
import { themes, type ThemeKey } from "@/lib/themes";
import { PirateIcon } from "@/components/icons/pirate-icon";
import { SunIcon } from "@/components/icons/sun-icon";
import { MoonIcon } from "@/components/icons/moon-icon";
import blogPostsData from "@/data/blog-posts.json";

type Category = "all" | "tech" | "history";

const CATEGORY_LABELS: Record<Category, string> = {
  all: "all",
  tech: "tech",
  history: "history",
};

export default function BlogPage() {
  const [isDark, setIsDark] = useState(true);
  const [activeTheme, setActiveTheme] = useState<ThemeKey>("rust");
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    const theme = themes[activeTheme];
    const root = document.documentElement;

    if (isDark) {
      root.style.setProperty("--primary", theme.colors.primaryDark);
      root.style.setProperty("--accent", theme.colors.accentDark);
    } else {
      root.style.setProperty("--primary", theme.colors.primary);
      root.style.setProperty("--accent", theme.colors.accent);
    }

    root.style.setProperty("--bg-1", theme.colors.bg1);
    root.style.setProperty("--bg-2", theme.colors.bg2);
    root.style.setProperty("--bg-3", theme.colors.bg3);
  }, [activeTheme, isDark]);

  const theme = themes[activeTheme];

  const filteredPosts =
    activeCategory === "all"
      ? blogPostsData
      : blogPostsData.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
        <div className="space-y-8 sm:space-y-12">
          {/* Header */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="relative group">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-sm font-mono text-primary hover:text-accent transition-colors duration-300"
                >
                  <PirateIcon className="w-5 h-5" />
                </Link>
                <span className="absolute left-0 top-full mt-2 px-3 py-1.5 bg-card border border-primary/50 rounded text-xs font-mono text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
                  Go to home
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
                <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                  {["rust", "go", "typescript", "python", "sql", "java"].map(
                    (lang) => (
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
                    )
                  )}
                </div>

                <button
                  onClick={() => setIsDark(!isDark)}
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
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light">
                <span className="text-primary font-mono text-xl sm:text-2xl lg:text-3xl">
                  {theme.comment}{" "}
                </span>
                thoughts
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                Writing about code, systems, history, and whatever else is on my mind.
              </p>
            </div>

            {/* Category filter */}
            <div className="flex gap-2">
              {(["all", "tech", "history"] as Category[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-mono border rounded-full transition-all duration-300 cursor-pointer ${
                    activeCategory === cat
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border hover:border-primary text-muted-foreground"
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-6 sm:space-y-8">
            {filteredPosts.length === 0 ? (
              <p className="text-muted-foreground font-mono text-sm">
                {theme.comment} no posts in this category yet
              </p>
            ) : (
              filteredPosts.map((post, index) => (
                <article
                  key={index}
                  className="group p-4 sm:p-6 lg:p-8 border border-border rounded-lg hover:border-primary hover:bg-card/50 transition-all duration-500"
                >
                  <Link
                    to={`/blog/${post.slug}`}
                    className="space-y-3 sm:space-y-4 block"
                  >
                    <div className="flex items-center justify-between text-xs font-mono flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-primary">{post.date}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full border text-xs font-mono ${
                            post.category === "history"
                              ? "border-accent/50 text-accent"
                              : "border-primary/50 text-primary"
                          }`}
                        >
                          {post.category}
                        </span>
                      </div>
                      <span className="text-muted-foreground">{post.readTime}</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-medium group-hover:text-primary transition-colors duration-300">
                      {post.title}
                    </h2>

                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs font-mono text-accent border border-border rounded group-hover:border-primary/50 transition-all duration-500"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-primary">
                        <span>{theme.resumeFunc}</span>
                        <svg
                          className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                      </div>
                    </div>
                  </Link>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
