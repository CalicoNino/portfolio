import fs from "fs"
import path from "path"
import matter from "gray-matter"

const contentDirectory = path.join(process.cwd(), "content")

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  date: string
  updatedAt: string
  readTime: string
  tags: string[]
  content: string
}

export function getAllPosts(): BlogPost[] {
  // Get all markdown files from content directory
  const fileNames = fs.readdirSync(contentDirectory)
  const allPosts = fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      // Read markdown file as string
      const fullPath = path.join(contentDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, "utf8")

      // Use gray-matter to parse the post metadata section
      const { data, content } = matter(fileContents)

      return {
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt,
        date: data.date,
        updatedAt: data.updatedAt,
        readTime: data.readTime,
        tags: data.tags || [],
        content,
      }
    })

  // Sort posts by date (newest first)
  return allPosts.sort((a, b) => (a.date > b.date ? -1 : 1))
}

export function getPostBySlug(slug: string): BlogPost | null {
  const fileNames = fs.readdirSync(contentDirectory)
  const fileName = fileNames.find((name) => name.includes(slug) && name.endsWith(".md"))

  if (!fileName) return null

  const fullPath = path.join(contentDirectory, fileName)
  const fileContents = fs.readFileSync(fullPath, "utf8")
  const { data, content } = matter(fileContents)

  return {
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt,
    date: data.date,
    updatedAt: data.updatedAt,
    readTime: data.readTime,
    tags: data.tags || [],
    content,
  }
}
