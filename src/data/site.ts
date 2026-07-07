export const site = {
  name: 'Daphne',
  role: 'AI-Native Creative Technologist',
  location: 'Singapore',
  email: 'hello.daphnekam@gmail.com',
  resume: '/resume/Daphne_Resume_2026_AI.md',
  available: 'Open to building something together',

  // Hero
  heroSub: 'a marketer who builds with AI',
  heroLead:
    'I orchestrate agents, models and pipelines to ship real products — games, apps, characters, campaigns. This site included.',

  // About — belief / POV
  aboutLead:
    'A marketer with AI for a sidekick, dreaming up the impossible and shipping the fun.',
  belief:
    'I’m a firm believer that ideas with the right tools beat a perfect plan that never ships. Embrace the problem, question current methods, find the right tools, and you can build almost anything. The hardest part was never the building. It was deciding to start.',

  socials: [
    { label: 'Email', href: 'mailto:hello.daphnekam@gmail.com' },
    { label: 'GitHub', href: 'https://github.com/carrotpothead' },
    { label: 'X', href: 'https://x.com/flippingcucken' },
  ],

  capabilities: [
    'ai_native_building',
    'gtm_strategy',
    'brand_art_direction',
    'content_at_scale',
    'community_social',
  ],

  // 004 about — background as release notes, not a résumé
  storyLabel: 'changelog — release notes of a career',
  story: [
    { v: 'v1.0', name: 'art_direction', line: 'Started in design — art directing 360° campaigns for hotels, malls and a national rebrand.' },
    { v: 'v2.0', name: 'gaming_gtm', line: 'Moved to mobile gaming — led a marketing team through global launches and made paid acquisition profitable.' },
    { v: 'v3.0', name: 'big_tech', line: 'Big Tech — user acquisition for APAC’s top gaming advertisers.' },
    { v: 'v4.0', name: 'web3_community', line: 'Crypto — built a 450K community, entered new markets, set a world record along the way.' },
    { v: 'v5.0', name: 'ai_native', line: 'Now — AI-native. Shipping products, characters and campaigns solo, with agents for a team. You’re looking at it.' },
  ],

  // 005 contact — the explicit ask
  seeking: 'currently_seeking: marketing / gtm at an ai company',

  // 002 stack — how she actually operates
  stackLead: 'I don’t prompt and pray. I run a pipeline.',
  stackSub:
    'Daily driver is Claude Code — agents, MCP servers, automation. Around it, a toolchain that takes an idea from sketch to shipped without waiting for anyone.',
  stack: [
    {
      id: 'claude_code',
      title: 'claude_code',
      desc: 'Daily driver. Agentic coding, MCP servers, multi-step automation. Built this site, a macOS app and a game with it.',
      tag: 'agentic_dev',
    },
    {
      id: 'higgsfield',
      title: 'higgsfield',
      desc: 'Image, video & character pipeline. The character on this page — generated, posed, cut out and shipped via CLI.',
      tag: 'gen_media',
    },
    {
      id: 'code_stack',
      title: 'react · three.js · swift',
      desc: 'The stacks I ship in by orchestrating AI — web, WebGL, native macOS. Fluent enough to direct, debug and deploy.',
      tag: 'ships_product',
    },
    {
      id: 'marketing_ai',
      title: 'ai × marketing',
      desc: 'Research, competitor analysis, content at scale, virality prediction. The workflow that cut my planning time 50%+.',
      tag: 'gtm_engine',
    },
  ],
} as const
