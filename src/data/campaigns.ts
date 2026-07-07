export type Campaign = {
  n: string
  id: string
  title: string
  brief: string
  play: string
  outcome: string
  tags: string[]
}

/** Headline proof points — outcomes, not résumé lines. */
export const proof = [
  { value: '$3M+', label: 'annual revenue driven' },
  { value: '450K+', label: 'community built & run' },
  { value: 'GWR', label: 'a world record set' },
  { value: '1,000%', label: 'ROAS at peak' },
] as const

/** Marketing case files — the work a GTM hire gets judged on. */
export const campaigns: Campaign[] = [
  {
    n: '01',
    id: 'guinness_world_record',
    title: 'Set a world record to launch a token',
    brief:
      'A token launch in a crowded market needed attention no media budget could buy.',
    play:
      'Directed a Guinness World Records attempt for Crypto.com’s Loaded Lions — engineered the stunt, the reveal and the global amplification as one story arc.',
    outcome: 'Reached millions worldwide; the ecosystem it launched drives $3M+ a year.',
    tags: ['stunt_marketing', 'global_amplification', 'token_launch'],
  },
  {
    n: '02',
    id: 'korea_market_entry',
    title: 'Enter Korea end-to-end',
    brief: 'A western-built gaming ecosystem needed a real footprint in Korea, not a translated one.',
    play:
      'On the ground at Korea Blockchain Week; built localized community ops on Naver and Telegram with market-native storytelling and partners.',
    outcome: 'A market entered — regional community, partnerships and distribution that stuck.',
    tags: ['field_marketing', 'localization', 'apac'],
  },
  {
    n: '03',
    id: 'sports_sponsorship_activation',
    title: 'Turn sponsorships into community',
    brief:
      'Global UFC & UEFA Champions League sponsorships risked being logos on a wall for a 450K-strong community.',
    play:
      'Directed flagship campaigns that converted sponsorship rights into things members could join, win and share — season-long, not one-off.',
    outcome: '+20% member activity and measurable retention lift across the community.',
    tags: ['partnerships', 'community_ops', 'retention'],
  },
  {
    n: '04',
    id: 'performance_turnaround',
    title: 'Make mobile UA profitable again',
    brief:
      'Mobile-game user acquisition was scaling spend faster than returns across every channel.',
    play:
      'Restructured paid acquisition end to end — creative pipeline, channel mix, incrementality testing and first-party data.',
    outcome: '1,000% ROAS at peak, scaling to 150K+ installs a month.',
    tags: ['paid_ua', 'growth', 'creative_pipeline'],
  },
]
