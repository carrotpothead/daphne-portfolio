import { Reveal } from '@/components/primitives/Reveal'
import { AnimatedChars } from '@/components/primitives/AnimatedChars'
import { Polaroid } from '@/components/layout/Polaroid'
import { Drawer } from '@/components/drawer/Drawer'
import type { DrawerEntry } from '@/data/drawer'
import { site } from '@/data/site'
import styles from './About.module.css'

const asTag = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

/* the career changelog, filed as pullable versions — tabs staircase left→right with the versions */
const TABX = [0.03, 0.21, 0.39, 0.57, 0.74]
const storyFiles: DrawerEntry[] = site.story.map((s, i) => ({
  kind: 'file',
  n: s.v,
  label: s.name,
  tabX: TABX[i % TABX.length],
  title: `${s.v} — ${s.name}`,
  body: s.line,
}))

export function About() {
  return (
    <section id="about" className={`sheet ${styles.sheetCream}`} aria-labelledby="about-title">
      <span className={`sheet-tab ${styles.tabCream}`}>
        <span className="n">003</span> about
      </span>

      <div className="container">
        <div className={styles.inner}>
          <Polaroid
            className={styles.photo}
            src="/images/character-about.png"
            alt="Illustrated character of Daphne, thinking"
          />

          <Reveal>
            <h2 id="about-title" className={styles.lead}>
              A marketer with AI for a sidekick, dreaming up the impossible and{' '}
              <span className={styles.hl}>shipping the fun</span>.
            </h2>
          </Reveal>

          <AnimatedChars text={site.belief} className={styles.belief} />

          <Reveal>
            <div className={styles.story}>
              <span className={styles.storyLabel}>{site.storyLabel}</span>
              <Drawer entries={storyFiles} compact />
            </div>

            <div className={styles.filed}>
              <span className={styles.filedLabel}>filed_under</span>
              <ul className="tags">
                {site.capabilities.map((cap) => (
                  <li key={cap} className="tag">
                    {asTag(cap)}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
