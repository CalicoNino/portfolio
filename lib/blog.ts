import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"

const contentDirectory = path.join(process.cwd(), "content")

export type BlogCategory = "tech" | "history"

/** Post metadata without the markdown body — what list views need. */
export type BlogPostMeta = Omit<BlogPost, "content">

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  date: string
  updatedAt: string
  readTime: string
  tags: string[]
  category: BlogCategory
  content: string
}

export function getAllPosts(): BlogPost[] {
  const fileNames = fs.readdirSync(contentDirectory)
  const allPosts = fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      const fullPath = path.join(contentDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, "utf8")

      // Parse the post metadata section
      const { data, content } = matter(fileContents)

      return {
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt,
        date: data.date,
        updatedAt: data.updatedAt,
        readTime: data.readTime,
        tags: data.tags || [],
        category: data.category ?? "tech",
        content,
      } satisfies BlogPost
    })

  // Sort posts by date (newest first)
  return allPosts.sort((a, b) => b.date.localeCompare(a.date))
}

export function getPostBySlug(slug: string): BlogPost | null {
  // Match on the canonical frontmatter slug, not the filename.
  return getAllPosts().find((post) => post.slug === slug) ?? null
}
