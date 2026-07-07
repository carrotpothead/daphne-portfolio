import { Suspense, lazy, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { useLenis } from '@/lib/lenis'
import { site } from '@/data/site'
import { SplitReveal } from '@/components/primitives/SplitReveal'
import { Magnet } from '@/components/primitives/Magnet'
import { MagneticButton } from '@/components/layout/MagneticButton'
import { useReducedMotion, useIsMobile, isLowPowerDevice } from '@/lib/useMediaQuery'
import styles from './Hero.module.css'

const HeroField = lazy(() =>
  import('@/components/webgl/HeroField').then((m) => ({ default: m.HeroField })),
)

export function Hero() {
  const { scrollTo } = useLenis()
  const reduced = useReducedMotion()
  const mobile = useIsMobile()
  const wantsWebGL = !reduced && !isLowPowerDevice()
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (reduced || !root.current) return

      gsap.from(`.${styles.canvas}`, { opacity: 0, duration: 1.3, delay: 0.35, ease: 'power2.out' })
      gsap.from(`.${styles.rise}`, {
        opacity: 0,
        y: 26,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.09,
        delay: 0.5,
      })
      // the character walks up from the bottom edge
      gsap.from(`.${styles.figure}`, {
        yPercent: 26,
        opacity: 0,
        duration: 1.3,
        ease: 'power4.out',
        delay: 0.75,
      })

      // scroll parallax — desktop only (mobile lays the figure out in flow)
      if (!mobile) {
        gsap.to(`.${styles.title}`, {
          yPercent: -16,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
        })
        gsap.to(`.${styles.figure}`, {
          yPercent: 12,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
        })
      }
      gsap.to(`.${styles.canvas}`, {
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: '55% top', end: 'bottom top', scrub: true },
      })
    },
    { scope: root, dependencies: [reduced, mobile] },
  )

  return (
    <header id="top" ref={root} className={styles.hero} data-nav="light">
      {wantsWebGL && (
        <div className={styles.canvas} aria-hidden="true">
          <Suspense fallback={null}>
            <HeroField />
          </Suspense>
        </div>
      )}

      <div className={styles.eyebrowRow}>
        <div className={`arc-eyebrow ${styles.rise}`}>
          portfolio <span className="sl">/</span> daphne.archive
        </div>
        <div className={`arc-eyebrow ${styles.rise} ${styles.eyebrowRight}`}>
          singapore <span className="sl">/</span> open_to_work
        </div>
      </div>

      <div className={styles.title}>
        <SplitReveal
          as="h1"
          className={styles.name}
          text="Daphne"
          type="chars"
          trigger={false}
          stagger={0.045}
          delay={0.3}
        />
      </div>

      <Magnet className={styles.figure} strength={5} radius={200}>
        <img
          src="/images/character.png"
          alt="Illustrated character of Daphne, holding a laptop"
          draggable={false}
        />
      </Magnet>

      <div className={styles.bottomBar}>
        <p className={`${styles.tagline} ${styles.rise}`}>
          {site.role} — I orchestrate agents, models &amp; pipelines to ship games, apps and
          campaigns
        </p>
        <div className={`${styles.ctas} ${styles.rise}`}>
          <MagneticButton
            className={styles.cta}
            onClick={() => scrollTo('#work')}
            ariaLabel="Open the files"
          >
            open the files ↓
          </MagneticButton>
        </div>
      </div>
    </header>
  )
}
