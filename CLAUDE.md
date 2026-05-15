# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # Type-check (svelte-check + tsc)
npm run check:watch  # Type-check in watch mode
```

There are no tests configured.

## Stack

- **Svelte 5** (Runes syntax — use `$state`, `$derived`, `$effect`, not stores)
- **SvelteKit 2** with static adapter (SSG, no server-side routes)
- **Tailwind CSS 4** via `@tailwindcss/vite`
- **Skeleton Labs v4** (`@skeletonlabs/skeleton` + `@skeletonlabs/skeleton-svelte` + `@skeletonlabs/skeleton-common`) — sahara dark theme
- **Lucide Svelte** for icons

## Architecture

File-based routing under `src/routes/`. SvelteKit's `$lib` alias points to `src/lib/`.

`src/app.html` sets `data-theme="sahara"` and `class="dark"` on `<html>` — the Skeleton theme is applied at the document root.

`src/routes/+layout.css` loads Tailwind, Skeleton base styles, Skeleton component styles (`@skeletonlabs/skeleton-common`), and the sahara theme CSS in order — this import order matters.

The static adapter means all pages must be pre-renderable. Avoid SvelteKit server features (`+server.ts`, `load` with `fetch` to private APIs, form actions with side effects) unless you switch adapters.

`@skeletonlabs/skeleton-svelte` is marked as SSR external in `vite.config.ts` — import Skeleton Svelte components only in `.svelte` files, not in server-side code.
