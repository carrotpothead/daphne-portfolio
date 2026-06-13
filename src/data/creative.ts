export type CreativeItem = {
  id: string
  title: string
  tag: string
  // image lives in /public/images/creative — placeholders for now until Daphne supplies assets
  image?: string
  // tall | wide | square — drives the masonry grid span
  shape: 'tall' | 'wide' | 'square'
}

// Proof points shown alongside the gallery
export const creativeProof = [
  { value: '30M+', label: 'GIF / IP views in under 3 months' },
  { value: 'GWR', label: 'Guinness World Records $LION campaign' },
  { value: '$3M+', label: 'annual revenue across proprietary IPs' },
  { value: '450K+', label: 'community reached across platforms' },
]

// Gallery tiles — swap `image` in as assets arrive (Higgsfield gens, campaign stills)
export const creative: CreativeItem[] = [
  { id: 'c1', title: 'Loaded Lions — campaign key art', tag: 'Art direction', shape: 'tall' },
  { id: 'c2', title: '$LION World Record push', tag: 'Social campaign', shape: 'wide' },
  { id: 'c3', title: 'AI-generated creative set', tag: 'Higgsfield', shape: 'square' },
  { id: 'c4', title: 'Mini-series — scripted & generated', tag: 'Content', shape: 'square' },
  { id: 'c5', title: 'Game asset concepts', tag: 'AI pipeline', shape: 'wide' },
  { id: 'c6', title: 'Partnership activations', tag: 'UFC · UEFA', shape: 'tall' },
]
