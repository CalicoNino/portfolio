import type React from "react";
import { Link } from "react-router";
import type { BlogPostMeta } from "@/lib/blog";
import { themes, type ThemeKey } from "@/lib/themes";
import { ArrowRightIcon } from "@/components/icons/arrow-right-icon";

interface ThoughtsSectionProps {
  posts: BlogPostMeta[];
  activeTheme: ThemeKey;
  sectionsRef: React.RefObject<(HTMLElement | null)[]>;
}

export const ThoughtsSection = ({
  posts,
  activeTheme,
  sectionsRef,
}: ThoughtsSectionProps) => {
  return (
    <section
      id="thoughts"
      ref={(el) => {
        sectionsRef.current[3] = el;
      }}
      className="py-16 sm:py-20 lg:py-32 opacity-0"
    >
      <div className="space-y-6 sm:space-y-12 lg:space-y-16">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl sm:text-4xl font-light">
            <span className="text-primary font-mono">
              {themes[activeTheme].comment}{" "}
            </span>
            Recent Thoughts
          </h2>
          <Link
            to="/blog"
            className="text-sm font-mono text-primary hover:text-accent transition-colors duration-300 flex items-center gap-2 hover:gap-3 cursor-pointer"
          >
            view all
            <ArrowRightIcon />
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group p-6 border border-border rounded-lg bg-card/30 backdrop-blur-sm hover:border-primary hover:bg-card/60 hover:shadow-[0_8px_30px_oklch(0.68_0.25_35/0.15)] hover:-translate-y-1 transition-all duration-500 cursor-pointer"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
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
                  <span className="text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                    {post.readTime}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-medium group-hover:text-primary transition-colors duration-300">
                  {post.title}
                </h3>

                <p className="text-muted-foreground leading-relaxed">
                  {post.excerpt}
                </p>

                <div className="flex items-center gap-2 text-sm font-mono text-primary">
                  <span>
                    {themes[activeTheme].funcPrefix}read
                    {themes[activeTheme].funcSuffix}
                    {themes[activeTheme].arrow}
                  </span>
                  <ArrowRightIcon className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
