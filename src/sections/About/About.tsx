import { Suspense, lazy } from 'react'
import { Reveal } from '@/components/primitives/Reveal'
import { site } from '@/data/site'
import { useReducedMotion, isLowPowerDevice } from '@/lib/useMediaQuery'
import styles from './About.module.css'

const AboutSphere = lazy(() =>
  import('@/components/webgl/AboutSphere').then((m) => ({ default: m.AboutSphere })),
)

export function About() {
  const reduced = useReducedMotion()
  const wantsWebGL = !reduced && !isLowPowerDevice()

  return (
    <section id="about" className={`section ${styles.about}`} aria-labelledby="about-title">
      {wantsWebGL && (
        <div className={styles.sphere}>
          <Suspense fallback={null}>
            <AboutSphere />
          </Suspense>
        </div>
      )}
      <div className="container">
        <div className={styles.grid}>
          <div>
            <p className="eyebrow" id="about-title">
              About
            </p>
            <Reveal>
              <p className={styles.lead} style={{ marginTop: '1.25rem' }}>
                I’m a marketer who got tired of waiting on the build. So I learned to
                ship it myself — <em>orchestrating AI</em> instead of managing a backlog.
              </p>
              <p className={styles.body}>
                Six years across crypto, gaming, and Big Tech — Crypto.com, Meta, gumi —
                taught me how to launch things people care about. Now I pair that with
                Claude Code, Higgsfield, and Weavy to take ideas from brief to live in
                days, not quarters. Marketing instinct, builder’s hands.
              </p>
              <span className={styles.location}>
                <span className={styles.pin} aria-hidden="true" />
                {site.location}
              </span>
            </Reveal>
          </div>

          <Reveal className={styles.currently}>
            <p className={styles.currentlyHead}>Currently</p>
            {site.currently.map((c) => (
              <div key={c.key} className={styles.row}>
                <span className={styles.key}>{c.key}</span>
                <span className={styles.value}>{c.value}</span>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
