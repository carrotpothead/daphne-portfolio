export type Project = {
  id: string
  title: string
  kicker: string // short context label
  year: string
  status: 'Live' | 'In progress' | 'Live soon'
  summary: string
  // honest role framing — what Daphne actually did
  role: string
  stack: string[]
  liveUrl?: string // public link, if any
  embedUrl?: string // iframe (click-to-load) if playable
  poster: string // hero image in /public
  // longer detail copy (project-detail overlay)
  detail: string[]
  metrics?: { label: string; value: string }[]
}

export const projects: Project[] = [
  {
    id: 'misemash',
    title: 'Misemash',
    kicker: 'Product — designed & built by me',
    year: '2026',
    status: 'Live soon',
    summary:
      'A mobile-first kitchen-ops app: every recipe you’ve saved, one plan for the week, one list for the shop. The missing layer between food you discover and food you actually cook.',
    role: 'Concept, product design, copy, and build — orchestrating AI end-to-end.',
    stack: ['Next.js', 'Claude Code', 'Higgsfield', 'Weavy'],
    poster: '/images/projects/misemash-tall.png',
    detail: [
      'Misemash is the build I own outright — concept, product design, voice, and code.',
      'It solves a real gap: people save endless recipes but still stare at the fridge at 7pm. Misemash turns a saved-recipe pile into a weekly plan and a single shopping list — “Plan. Cook. Tame the chaos.”',
      'Built mobile-first with an editorial, food-forward art direction, generated and assembled by orchestrating AI tools rather than a full engineering team.',
    ],
    metrics: [
      { label: 'Surface', value: 'Mobile-first web' },
      { label: 'Role', value: 'Solo, AI-orchestrated' },
      { label: 'Stage', value: 'Prototype → launch 2026' },
    ],
  },
  {
    id: 'space-vibes',
    title: 'Space Vibes',
    kicker: 'Good Vibes Club — Vibeathon entry',
    year: '2025',
    status: 'Live',
    summary:
      'A browser arcade game — fly, collect vibes, convert the bad vibers, climb the leaderboard. Shipped as my entry to Good Vibes Club’s vibeathon.',
    role:
      'Vibe-coded via Good Vibes Club’s CLI by orchestrating AI. The game concept and IP are GVC’s; I built and shipped this playable entry.',
    stack: ['Next.js', 'Claude Code (CLI)', 'Vercel'],
    liveUrl: 'https://spacevibes.vercel.app/',
    embedUrl: 'https://spacevibes.vercel.app/',
    poster: '/images/projects/spacevibes-thumb.png',
    detail: [
      'Space Vibes was my entry to the Good Vibes Club vibeathon — a build sprint where you ship a playable game by orchestrating AI from a CLI.',
      'The IP and concept belong to Good Vibes Club. What I did: took it from idea to a deployed, playable arcade game — flight controls, a power-up system, lives, and a live leaderboard.',
      'It’s proof of the core skill: hand me a creative brief and AI tooling, and I’ll ship something real and fun that people can actually play.',
    ],
    metrics: [
      { label: 'Event', value: 'GVC Vibeathon' },
      { label: 'Built via', value: 'CLI + AI orchestration' },
      { label: 'State', value: 'Live & playable' },
    ],
  },
]
