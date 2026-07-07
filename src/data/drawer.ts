export type DrawerEntry =
  | {
      kind: 'file'
      n: string
      label: string
      /** horizontal tab position, 0–1 across the sheet */
      tabX: number
      title: string
      sub?: string
      body?: string
      img?: string
      ascii?: string
      link?: { href: string; label: string; external?: boolean }
      tags?: string[]
    }
  | { kind: 'divider'; letter: string; count: string; side: 'left' | 'right' }
