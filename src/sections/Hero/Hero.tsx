import { Suspense, lazy } from 'react'
import { SplitReveal } from '@/components/primitives/SplitReveal'
import { site } from '@/data/site'
import { useReducedMotion, isLowPowerDevice } from '@/lib/useMediaQuery'
import styles from './Hero.module.css'

// Heavy WebGL scene is its own chunk, only imported when we actually want it.
const HeroCanvas = lazy(() =>
  import('@/components/webgl/HeroCanvas').then((m) => ({ default: m.HeroCanvas })),
)

export function Hero() {
  const reduced = useReducedMotion()
  const wantsWebGL = !reduced && !isLowPowerDevice()

  return (
    <header id="top" className={styles.hero}>
      <div className={styles.backdrop} aria-hidden="true">
        {wantsWebGL ? (
          <Suspense fallback={null}>
            <HeroCanvas />
          </Suspense>
        ) : (
          <img
            className={styles.poster}
            src="/images/hero-poster.jpg"
            alt=""
            aria-hidden="true"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        )}
      </div>

      <div className={`container ${styles.inner}`}>
        <p className={`eyebrow ${styles.eyebrow}`}>
          <span className={styles.dot} aria-hidden="true" />
          {site.role}
        </p>

        <h1 className={styles.name}>
          <SplitReveal as="span" className={styles.fill} text="Daphne" type="chars" trigger={false} />
          <SplitReveal
            as="span"
            className={styles.outline}
            text="Kam"
            type="chars"
            trigger={false}
            delay={0.15}
          />
        </h1>

        <p className={styles.tagline}>
          I build the things I <em>market</em>.
        </p>

        <p className={styles.lede}>{site.intro}</p>
      </div>

      <div className={styles.scrollHint} aria-hidden="true">
        <span className={styles.bar} />
        Scroll
      </div>
    </header>
  )
}
