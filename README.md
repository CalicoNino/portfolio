# caliconino.dev

> *I turn `unwrap()` calls into `Result<features, code>`.*

[![React Router](https://img.shields.io/badge/React_Router-v7-CA4245?logo=reactrouter&logoColor=white)](https://reactrouter.com)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Bun](https://img.shields.io/badge/Bun-latest-fbf0df?logo=bun&logoColor=black)](https://bun.sh)

**[→ Live](https://caliconino.dev)**

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
| Framework | React Router v7 (SSR + prerendering) |
| Build tool | Vite 6 |
| Styling | Tailwind CSS v4 + OKLch color system |
| Language | TypeScript 5 |
| Runtime / package manager | Bun |
| Blog content | Markdown + gray-matter |
| 3D / game | Three.js + WebGL |

---

## Pages

```
/                    → Portfolio (hero, work, projects, thoughts, connect)
/blog                → Blog listing
/blog/:slug          → Blog post (reads from content/*.md at build time)
/travel              → Interactive 3D pirate sailing game
```

The home page, blog listing, and all blog posts are **prerendered to static HTML** at build time. The blog loader reads markdown files from `content/` during the build and embeds the rendered content. The `/travel` route renders server-side on demand.

---

## Local development

```bash
bun install
bun run dev       # → http://localhost:5173
```

```bash
bun run build     # prerender + SSR bundle
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
│       ├── blog.$slug.tsx    # /blog/:slug  (has loader → reads markdown)
│       └── travel.tsx        # /travel (pirate sailing game)
├── components/
│   ├── pirate-sailing-game.tsx
│   ├── game/
│   │   ├── config.ts         # Ships, islands, weather constants
│   │   ├── build-islands.ts  # Procedural island geometry
│   │   └── GameUI.tsx        # React HUD overlay
│   ├── hero-section.tsx
│   ├── work-section.tsx
│   ├── projects-section.tsx
│   ├── thoughts-section.tsx
│   ├── connect-section.tsx
│   └── footer.tsx
├── content/                  # Markdown blog posts
├── data/                     # personal.json, work.json, projects.json, blog-posts.json
├── lib/
│   ├── themes.ts             # 6 language theme definitions
│   └── blog.ts               # Markdown reader (server/build-time only)
├── public/
│   └── 3d/                   # GLB ship and island models (Git LFS)
├── react-router.config.ts    # SSR + prerender config
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

3. Push to `main` — the release workflow triggers semantic-release, which creates a GitHub release and tags the version.

---

## Releases

Releases are automated via [semantic-release](https://semantic-release.gitbook.io) on every push to `main`. Commit messages follow [Conventional Commits](https://www.conventionalcommits.org):

| Prefix | Effect |
|---|---|
| `fix:` | patch release |
| `feat:` | minor release |
| `feat!:` / `BREAKING CHANGE:` | major release |
| `chore:`, `docs:`, `refactor:` | no release |
