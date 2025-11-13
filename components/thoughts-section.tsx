import type React from "react";
import Link from "next/link";
import { themes, type ThemeKey } from "@/lib/themes";
import { ArrowRightIcon } from "@/components/icons/arrow-right-icon";

interface ThoughtsSectionProps {
  activeTheme: ThemeKey;
  sectionsRef: React.MutableRefObject<(HTMLElement | null)[]>;
}

const staticBlogPosts = [
  {
    slug: "building-with-ai-sdk",
    title: "Building with AI SDK",
    excerpt:
      "Exploring the latest features in the Vercel AI SDK and how to build production-ready AI applications.",
    date: "2024-01-15",
    readTime: "5 min read",
  },
  {
    slug: "design-systems-at-scale",
    title: "Design Systems at Scale",
    excerpt:
      "Lessons learned building and maintaining design systems for large-scale applications.",
    date: "2024-01-10",
    readTime: "8 min read",
  },
  {
    slug: "performance-first-development",
    title: "Performance-First Development",
    excerpt:
      "Why performance should be a priority from day one and how to measure what matters.",
    date: "2024-01-05",
    readTime: "6 min read",
  },
];

export const ThoughtsSection = ({
  activeTheme,
  sectionsRef,
}: ThoughtsSectionProps) => {
  const blogPosts = staticBlogPosts.slice(0, 4); // Get latest 4 posts

  return (
    <section
      id="thoughts"
      ref={(el) => {
        sectionsRef.current[3] = el;
      }}
      className="min-h-screen py-20 sm:py-32 opacity-0"
    >
      <div className="space-y-12 sm:space-y-16">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl sm:text-4xl font-light">
            <span className="text-primary font-mono">
              {themes[activeTheme].comment}{" "}
            </span>
            Recent Thoughts
          </h2>
          <Link
            href="/blog"
            className="text-sm font-mono text-primary hover:text-accent transition-colors duration-300 flex items-center gap-2 hover:gap-3 cursor-pointer"
          >
            view all
            <ArrowRightIcon />
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {blogPosts.map((post, index) => (
            <Link
              key={index}
              href={`/blog/${post.slug}`}
              className="group p-6 border border-border rounded-lg bg-card/30 backdrop-blur-sm hover:border-primary hover:bg-card/60 hover:shadow-[0_8px_30px_oklch(0.68_0.25_35/0.15)] hover:-translate-y-1 transition-all duration-500 cursor-pointer"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-primary">{post.date}</span>
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
