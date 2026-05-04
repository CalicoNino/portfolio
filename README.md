# caliconino.github.io/portfolio

> *I turn `unwrap()` calls into `Result<features, code>`.*

[![Deploy to GitHub Pages](https://github.com/CalicoNino/portfolio/actions/workflows/deploy.yml/badge.svg)](https://github.com/CalicoNino/portfolio/actions/workflows/deploy.yml)
[![React Router](https://img.shields.io/badge/React_Router-v7-CA4245?logo=reactrouter&logoColor=white)](https://reactrouter.com)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Bun](https://img.shields.io/badge/Bun-latest-fbf0df?logo=bun&logoColor=black)](https://bun.sh)

**[→ Live](https://caliconino.github.io/portfolio)**

---

## The signature feature

The entire site repaints itself based on whichever programming language you pick. Not just colors — the syntax markers, button labels, section prefixes, and comment styles all shift to match the language's idiom:

| Language | Button label | Section prefix | Comment |
|---|---|---|---|
| **Rust** | `view_resume()` | `struct` | `//` |
| **Go** | `ViewResume()` | `type` | `//` |
| **TypeScript** | `viewResume()` | `interface` | `//` |
| **Python** | `view_resume()` | `class` | `#` |
| **SQL** | `VIEW_RESUME()` | `CREATE TABLE` | `--` |
| **Java** | `viewResume()` | `public class` | `//` |

Theme colors are OKLch CSS custom properties swapped at runtime — zero re-renders, instant transitions.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | React Router v7 (framework mode, SSG) |
| Build tool | Vite 6 |
| Styling | Tailwind CSS v4 + OKLch color system |
| Language | TypeScript 5 |
| Runtime / package manager | Bun |
| Blog content | Markdown + gray-matter |
| Deployment | GitHub Pages via GitHub Actions |

---

## Pages

```
/                    → Portfolio (hero, work, projects, thoughts, connect)
/blog                → Blog listing
/blog/:slug          → Blog post (reads from content/*.md at build time)
```

All three routes are **prerendered to static HTML** at build time. The blog loader reads markdown files from `content/` during the build and embeds the rendered content — no server required at runtime.

---

## Local development

```bash
bun install
bun run dev       # → http://localhost:5173
```

```bash
bun run build     # prerender all routes to build/client/
bun run start     # serve the SSR build locally
bun run typecheck # react-router typegen + tsc
```

---

## Project structure

```
├── app/
│   ├── root.tsx              # HTML shell, fonts, global meta
│   ├── routes.ts             # Route definitions
│   ├── globals.css           # Tailwind v4 + animations + theme vars
│   └── routes/
│       ├── home.tsx          # /
│       ├── blog.tsx          # /blog
│       └── blog.$slug.tsx    # /blog/:slug  (has loader → reads markdown)
├── components/
│   ├── hero-section.tsx
│   ├── work-section.tsx
│   ├── projects-section.tsx
│   ├── thoughts-section.tsx
│   ├── connect-section.tsx
│   ├── footer.tsx
│   └── icons/
├── content/                  # Markdown blog posts
├── data/                     # personal.json, work.json, projects.json, blog-posts.json
├── lib/
│   ├── themes.ts             # 6 language theme definitions
│   └── blog.ts               # Markdown reader (server/build-time only)
├── react-router.config.ts    # SSG prerender config
└── vite.config.ts
```

---

## Adding a blog post

1. Create `content/NNN_your-slug.md` with frontmatter:

```markdown
---
title: "Your Post Title"
slug: "your-slug"
excerpt: "One sentence summary."
date: "2025-01-01"
updatedAt: "2025-01-01"
readTime: "5 min"
tags: ["Tag1", "Tag2"]
---

Your content here...
```

2. Add an entry to `data/blog-posts.json` (used for listings and prerender discovery):

```json
{
  "slug": "your-slug",
  "title": "Your Post Title",
  "excerpt": "One sentence summary.",
  "date": "2025-01-01",
  "updatedAt": "2025-01-01",
  "readTime": "5 min",
  "tags": ["Tag1", "Tag2"]
}
```

3. Push to `main` — the workflow prebuilds the new route and deploys automatically.

---

## Deployment

Pushes to `main` trigger the GitHub Actions workflow which:

1. Installs deps with `bun install --frozen-lockfile`
2. Detects the GitHub Pages base path (handles project vs. user/org pages automatically)
3. Runs `bun run build` — prerenders all routes to `build/client/`
4. Deploys `build/client/` to GitHub Pages

To enable for the first time: **Settings → Pages → Source → GitHub Actions**

