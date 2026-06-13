# Daphne Kam — Creative Technologist Portfolio

An immersive personal portfolio. React + Vite + Three.js (WebGL) + GSAP + Lenis.
Dark, editorial, with an interactive "vibes" particle hero, scroll-driven motion,
a quirky-tactile layer (preloader, scroll rail, synthesized UI sound), and
playable project detail overlays.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview the build locally
```

## Where to edit content (no React needed)

All copy lives in plain typed files under `src/data/`:

- `site.ts` — name, tagline, intro, "currently", capabilities, socials
- `projects.ts` — project cards + detail copy (Misemash, Space Vibes)
- `creative.ts` — Creative & Campaigns gallery + proof stats
- `experience.ts` — work history

## Adding real images

Drop files into `public/images/` and reference them from the data files:

- `public/images/projects/` — project posters (Misemash hero is already here)
- `public/images/creative/` — campaign stills / Higgsfield gens. Then set the
  `image` field on each item in `src/data/creative.ts` to swap the placeholder tile.
- `public/images/hero-poster.jpg` — fallback shown under reduced-motion / low-power
- `public/og-image.png` — social share image

## Structure

```
src/
  lib/        motion glue (lenis, gsap, splitText), hooks, sound
  components/ layout (Nav, Footer, Preloader, SoundToggle, ScrollProgress),
              primitives (Reveal, SplitReveal), webgl (HeroCanvas, VibesField, AboutSphere)
  sections/   Hero, Concept, Services, Projects, Creative, About, Experience, Contact
  project-detail/  full-screen overlay routes (/work/:id) with click-to-load embeds
  data/       all editable content
```

## Accessibility & performance

- Full `prefers-reduced-motion` support: no smooth-scroll, no WebGL (poster instead),
  instant reveals, clean text.
- The Three.js bundle is a lazy chunk — only downloads when WebGL is actually used.
- WebGL render loops pause when their section is offscreen.

## Deploy (Vercel)

`vercel.json` is set up (SPA rewrite + asset caching). Either:

- Drag the project folder onto https://vercel.com/new, or
- `npm i -g vercel && vercel` from this directory.

## Dev helper

`node scripts/shoot.mjs [url] [outdir]` — screenshots the running site (uses the
local Chrome via puppeteer-core) for quick visual checks.
