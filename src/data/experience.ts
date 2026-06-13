export type Role = {
  company: string
  title: string
  period: string
  notes: string[]
}

export const experience: Role[] = [
  {
    company: 'Crypto.com',
    title: 'Product Manager, NFT & Gaming',
    period: 'Oct 2023 — Present',
    notes: [
      'Daily Claude Code user — content, campaign strategy & competitor research, cutting planning time 50%+.',
      'Own an AI pipeline for game-asset concepting, idea → dev-ready in ~30 min.',
      'Led GTM & social for the Loaded Lions ecosystem (NFTs, gaming, token TGE).',
      'Directed the Guinness World Records $LION campaign reaching millions.',
    ],
  },
  {
    company: 'Meta',
    title: 'Client Solutions Manager',
    period: 'Aug 2021 — Jan 2022',
    notes: [
      'Led global UA for top APAC gaming clients — $3M+ revenue per quarter.',
      'Brand positioning across Meta products, +20% engagement & installs.',
    ],
  },
  {
    company: 'gumi Asia',
    title: 'Marketing Manager',
    period: 'Mar 2021 — Aug 2021',
    notes: [
      'Global marketing for mobile games — 1,000% ROAS, 150K+ monthly installs.',
    ],
  },
]
